<?php

declare(strict_types=1);

require_once __DIR__ . '/lib/config.php';
require_once __DIR__ . '/lib/dna.php';
require_once __DIR__ . '/lib/openai.php';

set_time_limit(120);
ignore_user_abort(true);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$raw = file_get_contents('php://input') ?: '';
if (strlen($raw) > 65536) {
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

$dna = is_array($data['dna'] ?? null) ? $data['dna'] : $data;
if (!isset($dna['concept']) && isset($data['title'])) {
    $dna = normalizeParams($data, (string) $data['title'], (string) ($data['genre'] ?? ''), (string) ($data['pitch'] ?? ''));
}

$config = framefluxConfig();
$apiKey = framefluxApiKey($config);
$model = framefluxImageModel($config);
$title = (string) ($dna['concept']['title'] ?? $dna['title'] ?? 'Untitled');
$timestamp = date('H:i:s');
$useImage = !array_key_exists('useImage', $data) || $data['useImage'] !== false;

if (!$useImage) {
    error_log("[{$timestamp}] ℹ️ gpt-image-2 SKIPPED: Client opted out of key art for '{$title}'.");
    echo json_encode([
        'source' => 'skipped',
        'image' => null,
        'note' => 'GPT Image off — cinematic plate will be drawn locally from Visual DNA.',
    ]);
    exit;
}

if ($apiKey === '') {
    error_log("[{$timestamp}] ⚠️ gpt-image-2 SKIPPED: No API key resolved from config. Using procedural plate for '{$title}'.");
    echo json_encode([
        'source' => 'fallback',
        'image' => null,
        'note' => 'No API key — cinematic plate will be drawn locally from Visual DNA.',
    ]);
    exit;
}

$conversation = clipConversationNotes((string) ($data['conversation'] ?? ''));
if ($conversation === '') {
    $conversation = clipConversationNotes((string) ($dna['concept']['conversation'] ?? $dna['conversation'] ?? ''));
}
if ($conversation !== '') {
    if (!isset($dna['concept']) || !is_array($dna['concept'])) {
        $dna['concept'] = [];
    }
    $dna['concept']['conversation'] = $conversation;
}

$prompt = cinematicImagePrompt($dna);
$b64 = openaiImagePng($apiKey, $model, $prompt);

if ($b64 === null) {
    error_log("[{$timestamp}] ❌ gpt-image-2 FAILED: OpenAI rejected request, cURL timed out, or returned null for '{$title}'. Falling back to local plate.");
    echo json_encode([
        'source' => 'fallback',
        'image' => null,
        'note' => 'Image model unavailable — cinematic plate will be drawn locally from Visual DNA.',
    ]);
    exit;
}

error_log("[{$timestamp}] ✅ gpt-image-2 SUCCESS: Received key art still ({$model}) for '{$title}'.");
echo json_encode([
    'source' => 'ai',
    'image' => 'data:image/png;base64,' . $b64,
]);
