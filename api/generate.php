<?php

declare(strict_types=1);

require_once __DIR__ . '/lib/config.php';
require_once __DIR__ . '/lib/dna.php';
require_once __DIR__ . '/lib/openai.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$raw = file_get_contents('php://input') ?: '';
if (strlen($raw) > 32768) {
    http_response_code(413);
    echo json_encode(['error' => 'Request is too large.']);
    exit;
}

$data = json_decode($raw, true);
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['error' => 'Expected JSON body']);
    exit;
}

$title = trim((string) ($data['title'] ?? ''));
$genre = trim((string) ($data['genre'] ?? ''));
$pitch = trim((string) ($data['pitch'] ?? ''));
$mode = trim((string) ($data['mode'] ?? 'generate'));
$variation = (int) ($data['variation'] ?? random_int(1, 1_000_000_000));
if ($variation < 1) {
    $variation = random_int(1, 1_000_000_000);
}

$allowedModes = ['generate', 'improve', 'reimagine'];
if (!in_array($mode, $allowedModes, true)) {
    $mode = 'generate';
}

if ($title === '' || mb_strlen($title) > 80) {
    http_response_code(400);
    echo json_encode(['error' => 'A film title is required (max 80 characters).']);
    exit;
}

if ($genre === '' || mb_strlen($genre) > 80) {
    http_response_code(400);
    echo json_encode(['error' => 'A genre is required (max 80 characters).']);
    exit;
}

if (mb_strlen($pitch) > 280) {
    http_response_code(400);
    echo json_encode(['error' => 'Pitch must be 280 characters or fewer.']);
    exit;
}

$conversation = clipConversationNotes((string) ($data['conversation'] ?? ''));

$previous = whitelistPrevious(is_array($data['previous'] ?? null) ? $data['previous'] : null);

if (($mode === 'improve' || $mode === 'reimagine') && $previous === null) {
    http_response_code(400);
    echo json_encode(['error' => ucfirst($mode) . ' needs the previous Visual DNA.']);
    exit;
}

$config = framefluxConfig();
$apiKey = framefluxApiKey($config);
$model = framefluxChatModel($config);

$params = null;
$source = 'fallback';

if ($apiKey !== '') {
    $params = requestVisualDna($apiKey, $model, $title, $genre, $pitch, $variation, $mode, $previous, $conversation);
    if ($params !== null) {
        $source = 'ai';
    }
}

if ($params === null) {
    $params = fallbackVisualParams($title, $genre, $pitch, $variation, $mode, $previous, $conversation);
}

$dna = normalizeParams($params, $title, $genre, $pitch);
if ($conversation !== '') {
    $dna['concept']['conversation'] = $conversation;
}
$dna['source'] = $source;
$dna['mode'] = $mode;
$dna['qualityNotes'] = assessDnaQuality($dna);

// Server terminal notification
$timestamp = date('H:i:s');
if ($source === 'ai') {
    error_log("[{$timestamp}] ✅ Visual DNA: AI SUCCESS (Model: {$model}) | Film: '{$title}'");
} else {
    $reason = ($apiKey === '') ? 'Missing or unread API key' : 'requestVisualDna() failed or returned non-200';
    error_log("[{$timestamp}] ⚠️ Visual DNA: LOCAL FALLBACK USED ({$reason}) | Film: '{$title}'");
}

echo json_encode($dna);

function requestVisualDna(
    string $apiKey,
    string $model,
    string $title,
    string $genre,
    string $pitch,
    int $variation,
    string $mode,
    ?array $previous,
    string $conversation = ''
): ?array {
    $shape = dnaShapePrompt();
    $rules = dnaRulesPrompt();
    $family = inferGenreFamily($genre, $title . ' ' . $pitch . ' ' . $conversation);
    $brief = grammarDirectorBrief($family);
    $direction = conversationDirectionBlock($conversation);

    if ($mode === 'improve' && $previous !== null) {
        $prevJson = json_encode($previous, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        $prompt = <<<PROMPT
You are refining an existing FrameFlux Visual DNA. Return JSON only with this exact shape:
{$shape}

{$rules}

Keep the same film identity, visualMetaphor, narrativeAnchor, material, and grammarFamily.
Strengthen spatial emphasis, lighting, cinematic staging, and quote — not a new concept.
If the darkroom notes name a specific improvement, make that change first.
Stay inside this visual grammar:
{$brief}
Do not return an identical copy. Variation seed: {$variation}.

Film title: {$title}
Genre: {$genre}
Pitch: {$pitch}
{$direction}

Previous Visual DNA (whitelisted):
{$prevJson}
PROMPT;
        $system = 'You refine one nested FrameFlux Visual DNA v1.3 object. Keep a single semantic source of truth. Stay inside the allowed enums. Cinematic subject and environment remain a textless still photograph, never a poster, and must not include REF:// labels. Wildlife and nature subjects are allowed when the story selects them. typography.genreVisibility is hidden. narrativeAnchor equals visualMetaphor. Return JSON only.';
        $temperature = 0.85;
    } elseif ($mode === 'reimagine' && $previous !== null) {
        $prevJson = json_encode($previous, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        $prompt = <<<PROMPT
You reinterpret the same film as a new cinematic direction. Return JSON only with this exact shape:
{$shape}

{$rules}

Same title, genre, and pitch. Choose a new visualMetaphor / narrativeAnchor and material from the same grammar family while staying true to the story.
Stay inside this visual grammar:
{$brief}
New mood, lighting, camera, palette, composition.mode, and patterns.
It must feel like a different creative campaign take, not a seed change. Variation seed: {$variation}.

Film title: {$title}
Genre: {$genre}
Pitch: {$pitch}
{$direction}

Previous Visual DNA (whitelisted) — do not copy it:
{$prevJson}
PROMPT;
        $system = 'You reimagine one nested FrameFlux Visual DNA v1.3 object for the same film. One DNA only. Stay inside the allowed enums. Cinematic subject and environment remain a textless still photograph, never a poster, and must not include REF:// labels. Wildlife and nature subjects are allowed when the story selects them. typography.genreVisibility is hidden. narrativeAnchor equals visualMetaphor. Return JSON only.';
        $temperature = 1.05;
    } else {
        $prompt = <<<PROMPT
You are the FrameFlux Visual-DNA Architect. Convert a film concept into exactly one nested Visual DNA v1.3 object. Return JSON only with this exact shape:
{$shape}

{$rules}

This is a new design pass (variation {$variation}). Derive emotionalCore, narrativeCore, visualMetaphor, material, composition.mode, and lighting from the story first. Invent palette, pattern pair, and quote that serve that metaphor. Copy title, genre, and pitch exactly. narrativeAnchor must equal visualMetaphor. typography.genreVisibility must be hidden.

{$brief}

Film title: {$title}
Genre: {$genre}
Pitch: {$pitch}
{$direction}
PROMPT;
        $system = 'You convert film concepts into one nested Visual DNA v1.3 object for a hybrid cinematic / procedural poster system. One film equals one semantic DNA. Never invent enums. Never ask the image model to render typography or REF:// labels. Nature, wildlife, canine, mountain, and botanical subjects are allowed when the story selects them. Return JSON only.';
        $temperature = 1.05;
    }

    return openaiChatJson($apiKey, $model, $system, $prompt, $temperature);
}

