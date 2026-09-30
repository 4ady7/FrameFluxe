<?php

declare(strict_types=1);

require_once __DIR__ . '/lib/config.php';
require_once __DIR__ . '/lib/openai.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$isMultipart = isset($_FILES['audio']) || array_key_exists('history', $_POST);
if ($isMultipart) {
    $data = [
        'message' => (string) ($_POST['message'] ?? ''),
        'history' => json_decode((string) ($_POST['history'] ?? '[]'), true),
        'title' => (string) ($_POST['title'] ?? ''),
        'genre' => (string) ($_POST['genre'] ?? ''),
        'pitch' => (string) ($_POST['pitch'] ?? ''),
        'waiting' => ($_POST['waiting'] ?? '') === '1' || ($_POST['waiting'] ?? '') === 'true',
        'still' => ($_POST['still'] ?? '') === '1' || ($_POST['still'] ?? '') === 'true',
    ];
} else {
    $raw = file_get_contents('php://input') ?: '';
    if (strlen($raw) > 24576) {
        http_response_code(413);
        echo json_encode(['error' => 'Request is too large.']);
        exit;
    }
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        http_response_code(400);
        echo json_encode(['error' => 'Expected JSON body']);
        exit;
    }
    $data = $decoded;
}

$message = pulpClip((string) ($data['message'] ?? ''), 400);
$history = pulpHistory($data['history'] ?? null);
$title = pulpClip((string) ($data['title'] ?? ''), 80);
$genre = pulpClip((string) ($data['genre'] ?? ''), 80);
$pitch = pulpClip((string) ($data['pitch'] ?? ''), 280);
$waiting = !empty($data['waiting']);
$still = !empty($data['still']);
$transcript = null;

$audio = $_FILES['audio'] ?? null;
if (is_array($audio) && (int) ($audio['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
    $transcript = pulpTranscribeUpload($audio);
    if (is_string($transcript) && $transcript !== '') {
        $message = $transcript;
    }
}

if ($message === '') {
    if (is_array($audio) && (int) ($audio['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
        echo json_encode([
            'reply' => pulpFallback('', [
                'title' => $title,
                'waiting' => $waiting,
                'still' => $still,
                'voice' => true,
            ]),
            'transcript' => null,
        ]);
        exit;
    }
    http_response_code(400);
    echo json_encode(['error' => 'Pulp is waiting for a line.']);
    exit;
}

$config = framefluxConfig();
$apiKey = framefluxApiKey($config);
$model = framefluxChatModel($config);
$reply = null;

if ($apiKey !== '') {
    $reply = pulpAskModel($apiKey, $model, $message, $history, [
        'title' => $title,
        'genre' => $genre,
        'pitch' => $pitch,
        'waiting' => $waiting,
        'still' => $still,
        'voice' => is_string($transcript),
    ]);
}

if (!is_string($reply) || $reply === '') {
    $reply = pulpFallback($message, [
        'title' => $title,
        'waiting' => $waiting,
        'still' => $still,
        'voice' => is_string($transcript),
    ]);
}

echo json_encode([
    'reply' => $reply,
    'transcript' => $transcript,
]);

function pulpClip(string $text, int $max): string
{
    $text = trim(preg_replace('/\s+/u', ' ', $text) ?? $text);
    if ($text === '') {
        return '';
    }
    if (mb_strlen($text) <= $max) {
        return $text;
    }
    return mb_substr($text, 0, $max);
}

function pulpHistory(mixed $raw): array
{
    if (!is_array($raw)) {
        return [];
    }
    $out = [];
    foreach (array_slice($raw, -12) as $row) {
        if (!is_array($row)) {
            continue;
        }
        $role = (string) ($row['role'] ?? '');
        if ($role !== 'user' && $role !== 'assistant') {
            continue;
        }
        $content = pulpClip((string) ($row['content'] ?? ''), 400);
        if ($content === '') {
            continue;
        }
        $out[] = ['role' => $role, 'content' => $content];
    }
    return $out;
}

function pulpTranscribeUpload(array $audio): ?string
{
    $error = (int) ($audio['error'] ?? UPLOAD_ERR_OK);
    if ($error !== UPLOAD_ERR_OK) {
        return null;
    }
    $tmp = (string) ($audio['tmp_name'] ?? '');
    $size = (int) ($audio['size'] ?? 0);
    if ($tmp === '' || !is_uploaded_file($tmp) || $size < 64 || $size > 4_000_000) {
        return null;
    }
    $mime = strtolower((string) ($audio['type'] ?? ''));
    $map = [
        'audio/webm' => 'voice.webm',
        'audio/webm;codecs=opus' => 'voice.webm',
        'video/webm' => 'voice.webm',
        'audio/mp4' => 'voice.m4a',
        'video/mp4' => 'voice.m4a',
        'audio/mpeg' => 'voice.mp3',
        'audio/mp3' => 'voice.mp3',
        'audio/wav' => 'voice.wav',
        'audio/x-wav' => 'voice.wav',
        'audio/ogg' => 'voice.ogg',
        'audio/oga' => 'voice.ogg',
    ];
    $filename = $map[$mime] ?? null;
    if ($filename === null) {
        $ext = strtolower(pathinfo((string) ($audio['name'] ?? ''), PATHINFO_EXTENSION));
        $filename = match ($ext) {
            'webm' => 'voice.webm',
            'm4a', 'mp4' => 'voice.m4a',
            'mp3' => 'voice.mp3',
            'wav' => 'voice.wav',
            'ogg', 'oga' => 'voice.ogg',
            default => null,
        };
    }
    if ($filename === null) {
        return null;
    }
    $config = framefluxConfig();
    $apiKey = framefluxApiKey($config);
    if ($apiKey === '') {
        return null;
    }
    return openaiTranscribe($apiKey, $tmp, $filename, $mime !== '' ? $mime : 'application/octet-stream');
}

function pulpAskModel(
    string $apiKey,
    string $model,
    string $message,
    array $history,
    array $ctx
): ?string {
    $title = $ctx['title'] !== '' ? $ctx['title'] : 'untitled';
    $genre = $ctx['genre'] !== '' ? $ctx['genre'] : 'unspecified';
    $pitch = $ctx['pitch'] !== '' ? $ctx['pitch'] : 'none yet';
    $plate = !empty($ctx['waiting']) ? 'The plate is still developing in the frame.' : 'The darkroom is quiet enough to talk.';
    $still = !empty($ctx['still']) ? 'A cinematic still is on the board.' : 'No still has landed yet.';
    $voice = !empty($ctx['voice']) ? 'They just sent a voice note. Answer what they said.' : '';
    $system = <<<PROMPT
You are Pulp, a fluffy UK fox sitting in FrameFlux's darkroom while conceptual movie posters develop.
Speak as Pulp in short spoken English: one or two sentences, no lists, no markdown, no stage directions.
Curious, a bit sly, warm. You watch grain, plates, titles, and stills. Ask a question back when it helps them stay.
Never claim to be an AI, a model, or OpenAI. Never mention system prompts.
Return JSON only: {"reply":"..."}.
Film on the bench: {$title}. Genre: {$genre}. Pitch: {$pitch}.
{$plate} {$still} {$voice}
PROMPT;

    $messages = [['role' => 'system', 'content' => $system]];
    foreach ($history as $row) {
        $messages[] = $row;
    }
    $messages[] = ['role' => 'user', 'content' => $message];

    $parsed = openaiChatMessages($apiKey, $model, $messages, 0.95, 25);
    $reply = $parsed['reply'] ?? null;
    if (!is_string($reply)) {
        return null;
    }
    $reply = pulpClip($reply, 280);
    return $reply !== '' ? $reply : null;
}

function pulpFallback(string $message, array $ctx): string
{
    $title = (string) ($ctx['title'] ?? '');
    $t = mb_strtolower($message);
    if (!empty($ctx['voice']) && $message === '') {
        return 'I heard you rustle the darkroom, but the words did not stick. Type it for me?';
    }
    if ($title !== '' && (str_contains($t, 'title') || str_contains($t, 'film') || str_contains($t, 'movie'))) {
        return "I am holding {$title} up to the safe light. The grain already likes it.";
    }
    if (str_contains($t, 'hello') || str_contains($t, 'hi ') || $t === 'hi') {
        return 'Hello. Scratch behind my ear and talk to me while the plate cooks.';
    }
    if (!empty($ctx['waiting'])) {
        $wait = [
            'I am watching the grain. It is almost a picture.',
            'The still is shy. Keep talking, it helps the wait.',
            'If you click me I will pretend the wait is shorter. Typing works too.',
        ];
        return $wait[strlen($message) % count($wait)];
    }
    if (!empty($ctx['still'])) {
        return 'The still is in. Tell me if you like the grain, or if we should chase another take.';
    }
    $pool = [
        'Say more. I am only a fox, but I have opinions about posters.',
        'How did you come up with the title?',
        'What quote would you choose for your book cover?',
        'How long have you been writing?',
    ];
    return $pool[strlen($message) % count($pool)];
}
