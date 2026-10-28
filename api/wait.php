<?php

declare(strict_types=1);

require_once __DIR__ . '/lib/waits.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        echo json_encode(waitLoggedAverages());
    } catch (RuntimeException $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$raw = file_get_contents('php://input') ?: '';
if (strlen($raw) > 4096) {
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

$waited = round((float) ($data['waited_seconds'] ?? -1), 2);
$gptImage = ($data['gpt_image'] ?? '') === true || ($data['gpt_image'] ?? '') === 'yes' ? 'yes' : 'no';
$mode = trim((string) ($data['mode'] ?? 'generate'));
$ok = !empty($data['ok']) ? 'yes' : 'no';
$title = trim((string) ($data['title'] ?? ''));

if ($waited < 0 || $waited > 600) {
    http_response_code(400);
    echo json_encode(['error' => 'waited_seconds is out of range.']);
    exit;
}

$allowedModes = ['generate', 'improve', 'reimagine'];
if (!in_array($mode, $allowedModes, true)) {
    $mode = 'generate';
}

if (mb_strlen($title) > 80) {
    $title = mb_substr($title, 0, 80);
}

try {
    waitRecordRow([
        gmdate('c'),
        number_format($waited, 2, '.', ''),
        $gptImage,
        $mode,
        $ok,
        $title,
    ]);
} catch (RuntimeException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}

echo json_encode([
    'ok' => true,
    'path' => 'data/' . WAIT_INBOX_NAME,
    'history' => 'data/' . WAIT_HISTORY_NAME,
]);
