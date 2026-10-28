<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/api/lib/waits.php';

$failed = 0;
$root = dirname(__DIR__) . '/tests/_tmp_waits';

function expect(bool $ok, string $label): void
{
    global $failed;
    if ($ok) {
        echo "ok  $label\n";
        return;
    }
    $failed++;
    echo "FAIL  $label\n";
}

function expectSame(mixed $actual, mixed $expected, string $label): void
{
    if ($actual === $expected) {
        expect(true, $label);
        return;
    }
    expect(false, $label . ' (got ' . var_export($actual, true) . ')');
}

function removeTree(string $dir): void
{
    if (!is_dir($dir)) {
        return;
    }
    $items = scandir($dir);
    if ($items === false) {
        return;
    }
    foreach ($items as $item) {
        if ($item === '.' || $item === '..') {
            continue;
        }
        $path = $dir . '/' . $item;
        if (is_dir($path)) {
            removeTree($path);
            continue;
        }
        unlink($path);
    }
    rmdir($dir);
}

function waitRow(string $seconds, string $gpt, string $ok, string $title, string $mode = 'generate'): array
{
    return ['2026-10-28T12:00:00+00:00', $seconds, $gpt, $mode, $ok, $title];
}

function writeCsv(string $path, array $rows): void
{
    $dir = dirname($path);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    $handle = fopen($path, 'wb');
    if ($handle === false) {
        throw new RuntimeException('Could not write test CSV.');
    }
    fputcsv($handle, WAIT_HEADERS, ',', '"', '\\');
    foreach ($rows as $row) {
        fputcsv($handle, $row, ',', '"', '\\');
    }
    fclose($handle);
}

removeTree($root);
mkdir($root, 0755, true);

try {
    $emptyDir = $root . '/empty';
    mkdir($emptyDir, 0755, true);
    $empty = waitLoggedAverages($emptyDir);
    expectSame($empty['enabled'], null, 'empty log has no image average');
    expectSame($empty['disabled'], null, 'empty log has no local average');
    expectSame($empty['count_enabled'], 0, 'empty log counts no image waits');
    expect(!is_file($emptyDir . '/' . WAIT_HISTORY_NAME), 'reading averages does not create a history file');

    $dir = $root . '/live';
    waitRecordRow(waitRow('10.00', 'yes', 'yes', 'Night Ferry'), $dir, 2);
    waitRecordRow(waitRow('30.00', 'yes', 'yes', 'Night Ferry'), $dir, 2);
    waitRecordRow(waitRow('0.00', 'yes', 'yes', 'Still'), $dir, 2);
    waitRecordRow(waitRow('99.00', 'yes', 'no', 'Failed Plate'), $dir, 2);
    waitRecordRow(waitRow('8.50', 'no', 'yes', 'Paper House'), $dir, 2);
    waitRecordRow(waitRow('11.50', 'no', 'yes', 'Say "hello", kid'), $dir, 2);

    $averages = waitLoggedAverages($dir, 2);
    expectSame($averages['enabled'], 20.0, 'image average uses successful waits only');
    expectSame($averages['count_enabled'], 2, 'image average skips zero and failed waits');
    expectSame($averages['disabled'], 10.0, 'local average is the mean of successful local waits');
    expectSame($averages['count_disabled'], 2, 'local average counts both successful local waits');

    $history = waitCsvRows($dir . '/' . WAIT_HISTORY_NAME);
    $inbox = waitCsvRows($dir . '/' . WAIT_INBOX_NAME);
    expectSame(count($history), 6, 'history keeps every recorded wait');
    expectSame(count($inbox), 2, 'recent file keeps only the newest rows');
    expectSame($inbox[1][5], 'Say "hello", kid', 'recent file keeps commas and quotes in titles');
    expectSame($history[3][4], 'no', 'failed waits are stored in history');
    expectSame($history[5][5], 'Say "hello", kid', 'history keeps commas and quotes in titles');

    $again = waitLoggedAverages($dir, 2);
    expectSame($again, $averages, 'reading averages does not change them');
    expectSame(count(waitCsvRows($dir . '/' . WAIT_HISTORY_NAME)), 6, 'reading averages does not duplicate history');

    $extra = waitRow('5.00', 'yes', 'yes', 'Late Arrival');
    $handle = fopen($dir . '/' . WAIT_HISTORY_NAME, 'ab');
    if ($handle === false) {
        throw new RuntimeException('Could not append test history.');
    }
    fputcsv($handle, $extra, ',', '"', '\\');
    fclose($handle);
    $repaired = waitLoggedAverages($dir, 2);
    expectSame($repaired['count_enabled'], 3, 'rows appended outside the logger are counted');
    expectSame($repaired['enabled'], 15.0, 'repaired image average includes the extra row');
    $repairedAgain = waitLoggedAverages($dir, 2);
    expectSame($repairedAgain['count_enabled'], 3, 'a repaired row is counted once');

    unlink($dir . '/generation-waits-state.json');
    $restored = waitLoggedAverages($dir, 2);
    expectSame($restored['count_enabled'], 3, 'averages rebuild after the state cache is removed');
    expectSame($restored['enabled'], 15.0, 'rebuilt image average matches history');
    expectSame(count(waitCsvRows($dir . '/' . WAIT_HISTORY_NAME)), 7, 'rebuilding averages does not copy recent rows again');

    $legacyDir = $root . '/legacy';
    $legacyRows = [
        waitRow('4.00', 'no', 'yes', 'One'),
        waitRow('6.00', 'no', 'yes', 'Two'),
        waitRow('12.00', 'yes', 'yes', 'Three'),
        waitRow('18.00', 'yes', 'no', 'Four'),
    ];
    writeCsv($legacyDir . '/' . WAIT_INBOX_NAME, $legacyRows);
    $legacy = waitLoggedAverages($legacyDir, 2);
    expectSame($legacy['disabled'], 5.0, 'existing recent rows move into the average');
    expectSame($legacy['count_enabled'], 1, 'existing image waits move into the average');
    expectSame(count(waitCsvRows($legacyDir . '/' . WAIT_HISTORY_NAME)), 4, 'existing recent rows move into history');
    expectSame(count(waitCsvRows($legacyDir . '/' . WAIT_INBOX_NAME)), 2, 'moved rows leave the recent file');
    waitLoggedAverages($legacyDir, 2);
    expectSame(count(waitCsvRows($legacyDir . '/' . WAIT_HISTORY_NAME)), 4, 'moving twice does not duplicate history');

    $partialDir = $root . '/partial';
    writeCsv($partialDir . '/' . WAIT_INBOX_NAME, $legacyRows);
    writeCsv($partialDir . '/' . WAIT_HISTORY_NAME, array_slice($legacyRows, 0, 2));
    $resumed = waitLoggedAverages($partialDir, 10);
    expectSame(count(waitCsvRows($partialDir . '/' . WAIT_HISTORY_NAME)), 4, 'a partial move finishes without duplicating rows');
    expectSame($resumed['disabled'], 5.0, 'a resumed move keeps the local average');
    expectSame($resumed['count_enabled'], 1, 'a resumed move keeps the image count');
    waitLoggedAverages($partialDir, 10);
    expectSame(count(waitCsvRows($partialDir . '/' . WAIT_HISTORY_NAME)), 4, 'finishing a partial move is idempotent');
} finally {
    removeTree($root);
}

echo $failed === 0 ? "\nAll wait-log tests passed.\n" : "\n{$failed} test(s) failed.\n";
exit($failed === 0 ? 0 : 1);
