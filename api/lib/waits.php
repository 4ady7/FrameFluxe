<?php

declare(strict_types=1);

/**
 * Recent waits stay in data/generation-waits.csv.
 * Every row is appended to data/generation-waits-history.csv and kept there.
 * The recent file only holds the latest WAIT_RECENT_LIMIT rows; older rows
 * leave it after they are already in the history file.
 * Averages always use the full history.
 */

const WAIT_HEADERS = [
    'timestamp',
    'waited_seconds',
    'gpt_image',
    'mode',
    'ok',
    'title',
];

const WAIT_RECENT_LIMIT = 200;
const WAIT_INBOX_NAME = 'generation-waits.csv';
const WAIT_HISTORY_NAME = 'generation-waits-history.csv';

function waitPaths(?string $dir = null): array
{
    $dir = $dir ?? dirname(__DIR__, 2) . '/data';
    return [
        'dir' => $dir,
        'inbox' => $dir . '/' . WAIT_INBOX_NAME,
        'history' => $dir . '/' . WAIT_HISTORY_NAME,
        'state' => $dir . '/generation-waits-state.json',
        'lock' => $dir . '/generation-waits.lock',
    ];
}

function waitRecordRow(array $row, ?string $dir = null, int $inboxLimit = WAIT_RECENT_LIMIT): void
{
    $row = array_map(static fn ($value): string => (string) $value, array_values($row));
    if (count($row) !== count(WAIT_HEADERS)) {
        throw new InvalidArgumentException('Wait row must have 6 columns.');
    }
    $limit = max(1, $inboxLimit);
    $paths = waitPaths($dir);
    waitWithLock($paths, static function () use ($paths, $row, $limit): void {
        $state = waitSync($paths, $limit);
        $end = waitAppendCsv($paths['history'], $row);
        $state = waitAccumulate($state, [$row]);
        $state['history_bytes'] = $end;
        waitWriteState($paths['state'], $state);
        waitAppendCsv($paths['inbox'], $row);
        waitTrimInbox($paths['inbox'], $limit);
    });
}

function waitLoggedAverages(?string $dir = null, int $inboxLimit = WAIT_RECENT_LIMIT): array
{
    $paths = waitPaths($dir);
    if (!is_file($paths['inbox']) && !is_file($paths['history']) && !is_file($paths['state'])) {
        return waitAveragesFromState(waitEmptyState());
    }
    $limit = max(1, $inboxLimit);
    return waitWithLock($paths, static function () use ($paths, $limit): array {
        return waitAveragesFromState(waitSync($paths, $limit));
    });
}

function waitCsvRows(string $path, int $offset = 0): array
{
    if (!is_file($path)) {
        return [];
    }
    $handle = fopen($path, 'rb');
    if ($handle === false) {
        throw new RuntimeException('Could not open wait CSV.');
    }
    $rows = [];
    try {
        if ($offset > 0 && fseek($handle, $offset) !== 0) {
            throw new RuntimeException('Could not open wait CSV.');
        }
        $skipHeader = $offset === 0;
        while (($row = fgetcsv($handle, 0, ',', '"', '\\')) !== false) {
            if (!is_array($row) || $row === [null]) {
                continue;
            }
            if ($skipHeader) {
                $skipHeader = false;
                if (array_slice($row, 0, count(WAIT_HEADERS)) === WAIT_HEADERS) {
                    continue;
                }
            }
            $normalized = waitNormalizeRow($row);
            if ($normalized !== null) {
                $rows[] = $normalized;
            }
        }
    } finally {
        fclose($handle);
    }
    return $rows;
}

function waitEmptyState(): array
{
    return [
        'history_bytes' => 0,
        'count_enabled' => 0,
        'sum_enabled' => 0.0,
        'count_disabled' => 0,
        'sum_disabled' => 0.0,
        'inbox_backfilled' => false,
    ];
}

function waitWithLock(array $paths, callable $fn): mixed
{
    if (!is_dir($paths['dir']) && !mkdir($paths['dir'], 0755, true) && !is_dir($paths['dir'])) {
        throw new RuntimeException('Could not create data directory.');
    }
    $lock = fopen($paths['lock'], 'c+');
    if ($lock === false) {
        throw new RuntimeException('Could not lock wait log.');
    }
    try {
        if (!flock($lock, LOCK_EX)) {
            throw new RuntimeException('Could not lock wait log.');
        }
        return $fn();
    } finally {
        flock($lock, LOCK_UN);
        fclose($lock);
    }
}

function waitSync(array $paths, int $inboxLimit): array
{
    $state = waitReadState($paths['state']) ?? waitEmptyState();
    if (empty($state['inbox_backfilled'])) {
        $state = waitBackfill($paths);
    } else {
        $state = waitRepairHistory($paths, $state);
    }
    waitTrimInbox($paths['inbox'], $inboxLimit);
    return $state;
}

function waitBackfill(array $paths): array
{
    $inboxRows = waitCsvRows($paths['inbox']);
    $historyRows = waitCsvRows($paths['history']);
    if (waitIsPrefix($inboxRows, $historyRows)) {
        foreach (array_slice($inboxRows, count($historyRows)) as $row) {
            waitAppendCsv($paths['history'], $row);
        }
    }
    $fresh = waitAccumulate(waitEmptyState(), waitCsvRows($paths['history']));
    clearstatcache(true, $paths['history']);
    $fresh['history_bytes'] = is_file($paths['history']) ? (int) filesize($paths['history']) : 0;
    $fresh['inbox_backfilled'] = true;
    waitWriteState($paths['state'], $fresh);
    return $fresh;
}

function waitRepairHistory(array $paths, array $state): array
{
    $history = $paths['history'];
    if (!is_file($history)) {
        if ((int) ($state['history_bytes'] ?? 0) === 0) {
            return $state;
        }
        $fresh = waitEmptyState();
        $fresh['inbox_backfilled'] = !empty($state['inbox_backfilled']);
        waitWriteState($paths['state'], $fresh);
        return $fresh;
    }
    clearstatcache(true, $history);
    $size = filesize($history);
    if ($size === false) {
        throw new RuntimeException('Could not open wait CSV.');
    }
    $watermark = (int) ($state['history_bytes'] ?? 0);
    if ($watermark < 0 || $watermark > $size) {
        $fresh = waitAccumulate(waitEmptyState(), waitCsvRows($history));
        $fresh['history_bytes'] = $size;
        $fresh['inbox_backfilled'] = !empty($state['inbox_backfilled']);
        waitWriteState($paths['state'], $fresh);
        return $fresh;
    }
    if ($watermark === $size) {
        return $state;
    }
    $state = waitAccumulate($state, waitCsvRows($history, $watermark));
    $state['history_bytes'] = $size;
    waitWriteState($paths['state'], $state);
    return $state;
}

function waitAppendCsv(string $path, array $row): int
{
    $handle = fopen($path, 'c+');
    if ($handle === false) {
        throw new RuntimeException('Could not open wait CSV.');
    }
    try {
        if (!flock($handle, LOCK_EX)) {
            throw new RuntimeException('Could not lock wait log.');
        }
        $stat = fstat($handle);
        $size = is_array($stat) ? (int) $stat['size'] : 0;
        if ($size === 0) {
            waitFputcsv($handle, WAIT_HEADERS);
        } else {
            fseek($handle, 0, SEEK_END);
        }
        waitFputcsv($handle, $row);
        fflush($handle);
        fsync($handle);
        $end = ftell($handle);
        if ($end === false) {
            throw new RuntimeException('Could not open wait CSV.');
        }
        waitSyncDirectory($path);
        return $end;
    } finally {
        flock($handle, LOCK_UN);
        fclose($handle);
    }
}

function waitTrimInbox(string $path, int $limit): void
{
    if (!is_file($path)) {
        return;
    }
    $rows = waitCsvRows($path);
    if (count($rows) <= $limit) {
        return;
    }
    $tmp = $path . '.tmp';
    $handle = fopen($tmp, 'wb');
    if ($handle === false) {
        throw new RuntimeException('Could not open wait CSV.');
    }
    try {
        waitFputcsv($handle, WAIT_HEADERS);
        foreach (array_slice($rows, -$limit) as $row) {
            waitFputcsv($handle, $row);
        }
        fflush($handle);
        fsync($handle);
    } finally {
        fclose($handle);
    }
    if (!rename($tmp, $path)) {
        throw new RuntimeException('Could not open wait CSV.');
    }
    waitSyncDirectory($path);
}

function waitReadState(string $path): ?array
{
    if (!is_file($path)) {
        return null;
    }
    $raw = file_get_contents($path);
    if (!is_string($raw) || $raw === '') {
        return null;
    }
    $data = json_decode($raw, true);
    if (!is_array($data) || !isset($data['history_bytes'])) {
        return null;
    }
    return $data;
}

function waitWriteState(string $path, array $state): void
{
    $payload = json_encode([
        'history_bytes' => (int) $state['history_bytes'],
        'count_enabled' => (int) $state['count_enabled'],
        'sum_enabled' => round((float) $state['sum_enabled'], 2),
        'count_disabled' => (int) $state['count_disabled'],
        'sum_disabled' => round((float) $state['sum_disabled'], 2),
        'inbox_backfilled' => !empty($state['inbox_backfilled']),
    ], JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT);
    $tmp = $path . '.tmp';
    if (file_put_contents($tmp, $payload . "\n", LOCK_EX) === false) {
        throw new RuntimeException('Could not store wait history.');
    }
    if (!rename($tmp, $path)) {
        throw new RuntimeException('Could not store wait history.');
    }
    waitSyncDirectory($path);
}

function waitAccumulate(array $state, array $rows): array
{
    foreach ($rows as $row) {
        if (($row[4] ?? '') === 'no') {
            continue;
        }
        $waited = (float) ($row[1] ?? 0);
        if ($waited <= 0) {
            continue;
        }
        if (($row[2] ?? '') === 'yes') {
            $state['count_enabled'] = (int) $state['count_enabled'] + 1;
            $state['sum_enabled'] = (float) $state['sum_enabled'] + $waited;
        } elseif (($row[2] ?? '') === 'no') {
            $state['count_disabled'] = (int) $state['count_disabled'] + 1;
            $state['sum_disabled'] = (float) $state['sum_disabled'] + $waited;
        }
    }
    return $state;
}

function waitAveragesFromState(array $state): array
{
    $avg = static function (int $count, float $sum): ?float {
        if ($count < 1) {
            return null;
        }
        return round($sum / $count, 2);
    };
    return [
        'enabled' => $avg((int) $state['count_enabled'], (float) $state['sum_enabled']),
        'disabled' => $avg((int) $state['count_disabled'], (float) $state['sum_disabled']),
        'count_enabled' => (int) $state['count_enabled'],
        'count_disabled' => (int) $state['count_disabled'],
    ];
}

function waitNormalizeRow(array $row): ?array
{
    if (count($row) < count(WAIT_HEADERS)) {
        return null;
    }
    $normalized = [];
    for ($i = 0; $i < count(WAIT_HEADERS); $i++) {
        $normalized[] = (string) $row[$i];
    }
    return $normalized;
}

function waitIsPrefix(array $rows, array $prefix): bool
{
    if (count($prefix) > count($rows)) {
        return false;
    }
    return array_slice($rows, 0, count($prefix)) === $prefix;
}

function waitFputcsv($handle, array $row): void
{
    fputcsv($handle, $row, ',', '"', '\\');
}

function waitSyncDirectory(string $path): void
{
    $dir = is_dir($path) ? $path : dirname($path);
    $handle = fopen($dir, 'r');
    if ($handle === false) {
        return;
    }
    fsync($handle);
    fclose($handle);
}
