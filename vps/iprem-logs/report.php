<?php
/**
 * iPremTvOnline - Log receiver endpoint
 * Place this in /var/www/html/iprem-logs/report.php on the VPS.
 *
 * Stores incoming bug reports in /var/log/iprem/reports.jsonl (one JSON per line).
 * Maintains a quick index of (signature → {count, last_seen, severity, sample}).
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'POST only']);
    exit;
}

$body = file_get_contents('php://input');
if (!$body || strlen($body) > 32 * 1024) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid body']);
    exit;
}

$data = json_decode($body, true);
if (!$data || !is_array($data)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

// Strip any potentially sensitive fields
$allowed = ['severity', 'message', 'stack', 'signature', 'timestamp', 'device', 'context'];
$cleaned = [];
foreach ($allowed as $k) if (isset($data[$k])) $cleaned[$k] = $data[$k];
$cleaned['received_at'] = date('c');
$cleaned['client_ip_hash'] = substr(hash('sha256', $_SERVER['REMOTE_ADDR'] . 'salt_iprem'), 0, 16);

$logDir = '/var/log/iprem';
if (!is_dir($logDir)) @mkdir($logDir, 0755, true);

// Append to JSONL log
$line = json_encode($cleaned, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
@file_put_contents($logDir . '/reports.jsonl', $line . "\n", FILE_APPEND | LOCK_EX);

// Update signature index (for dashboard sorting)
$indexFile = $logDir . '/index.json';
$index = [];
if (file_exists($indexFile)) {
    $raw = file_get_contents($indexFile);
    if ($raw) $index = json_decode($raw, true) ?: [];
}
$sig = $cleaned['signature'] ?? 'unknown';
if (!isset($index[$sig])) {
    $index[$sig] = [
        'signature' => $sig,
        'severity' => $cleaned['severity'] ?? 'ERROR',
        'message' => $cleaned['message'] ?? '',
        'first_seen' => $cleaned['received_at'],
        'last_seen' => $cleaned['received_at'],
        'count' => 1,
        'app_versions' => [$cleaned['device']['app_version'] ?? 'unknown' => 1]
    ];
} else {
    $index[$sig]['count']++;
    $index[$sig]['last_seen'] = $cleaned['received_at'];
    $ver = $cleaned['device']['app_version'] ?? 'unknown';
    $index[$sig]['app_versions'][$ver] = ($index[$sig]['app_versions'][$ver] ?? 0) + 1;
}
@file_put_contents($indexFile, json_encode($index, JSON_PRETTY_PRINT), LOCK_EX);

echo json_encode(['ok' => true, 'signature' => $sig]);
