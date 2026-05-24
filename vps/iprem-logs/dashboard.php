<?php
/**
 * iPremTvOnline - Bug reports dashboard
 * Place at /var/www/html/iprem-logs/dashboard.php
 *
 * Sorts by severity DESC then count DESC (most critical + most frequent first).
 * Basic auth via VPS_LOG_TOKEN env var.
 */

$expectedToken = getenv('VPS_LOG_TOKEN') ?: 'changeme';
$token = $_GET['t'] ?? $_SERVER['HTTP_X_AUTH'] ?? '';
if ($token !== $expectedToken) {
    http_response_code(401);
    echo "Unauthorized. Add ?t=YOUR_TOKEN";
    exit;
}

$logDir = '/var/log/iprem';
$indexFile = $logDir . '/index.json';
$index = file_exists($indexFile) ? (json_decode(file_get_contents($indexFile), true) ?: []) : [];

// Severity ordering
$sevOrder = ['CRITICAL' => 0, 'ERROR' => 1, 'WARNING' => 2, 'INFO' => 3];

$rows = array_values($index);
usort($rows, function($a, $b) use ($sevOrder) {
    $sa = $sevOrder[$a['severity']] ?? 99;
    $sb = $sevOrder[$b['severity']] ?? 99;
    if ($sa !== $sb) return $sa - $sb;
    return ($b['count'] ?? 0) - ($a['count'] ?? 0);
});

$totalReports = array_sum(array_column($rows, 'count'));
?>
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>iPremTvOnline — Bug Reports</title>
<style>
  body{font-family:-apple-system,sans-serif;background:#0f172a;color:#e2e8f0;margin:0;padding:24px}
  h1{font-size:22px;margin:0 0 4px 0}
  .sub{color:#94a3b8;font-size:13px;margin-bottom:20px}
  .stats{display:flex;gap:14px;margin-bottom:18px}
  .stat{background:#1e293b;border-radius:8px;padding:12px 16px;border:1px solid #334155}
  .stat strong{color:#fff;font-size:20px;display:block}
  .stat span{color:#94a3b8;font-size:11px}
  table{width:100%;border-collapse:collapse;background:#1e293b;border-radius:8px;overflow:hidden}
  th,td{padding:10px 12px;text-align:left;border-bottom:1px solid #334155;font-size:13px;vertical-align:top}
  th{background:#0a1530;color:#94a3b8;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:.5px}
  tr:hover{background:#0a1530}
  .sev{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700}
  .sev-CRITICAL{background:#7f1d1d;color:#fecaca}
  .sev-ERROR{background:#991b1b;color:#fecaca}
  .sev-WARNING{background:#854d0e;color:#fde68a}
  .sev-INFO{background:#1e3a8a;color:#bfdbfe}
  .msg{font-family:monospace;font-size:12px;color:#cbd5e1;max-width:600px;word-break:break-all}
  .count{font-weight:700;color:#fff;text-align:right}
  .time{color:#94a3b8;font-family:monospace;font-size:11px;white-space:nowrap}
  .versions{font-family:monospace;font-size:11px;color:#94a3b8}
</style>
</head>
<body>
  <h1>🐛 iPremTvOnline — Rapports d'erreurs</h1>
  <div class="sub">Trié par <strong>sévérité ↓ puis fréquence ↓</strong> — Auto-refresh 60s</div>
  <div class="stats">
    <div class="stat"><strong><?= count($rows) ?></strong><span>Signatures uniques</span></div>
    <div class="stat"><strong><?= $totalReports ?></strong><span>Rapports totaux</span></div>
    <div class="stat"><strong><?= count(array_filter($rows, fn($r) => $r['severity'] === 'CRITICAL')) ?></strong><span>Crashes critiques</span></div>
    <div class="stat"><strong><?= count(array_filter($rows, fn($r) => $r['severity'] === 'ERROR')) ?></strong><span>Erreurs</span></div>
  </div>
  <table>
    <thead><tr>
      <th>Sév.</th><th>Message</th><th>Occ.</th><th>Versions</th><th>Première vue</th><th>Dernière vue</th>
    </tr></thead>
    <tbody>
    <?php foreach ($rows as $r): ?>
      <tr>
        <td><span class="sev sev-<?= htmlspecialchars($r['severity']) ?>"><?= htmlspecialchars($r['severity']) ?></span></td>
        <td><div class="msg"><?= htmlspecialchars($r['message']) ?></div></td>
        <td class="count"><?= $r['count'] ?></td>
        <td class="versions"><?php
          $vs = $r['app_versions'] ?? [];
          foreach ($vs as $v => $c) echo htmlspecialchars($v) . " ($c)<br>";
        ?></td>
        <td class="time"><?= htmlspecialchars($r['first_seen']) ?></td>
        <td class="time"><?= htmlspecialchars($r['last_seen']) ?></td>
      </tr>
    <?php endforeach; ?>
    <?php if (empty($rows)): ?>
      <tr><td colspan="6" style="text-align:center;color:#64748b;padding:30px">Aucun rapport pour le moment ✓</td></tr>
    <?php endif; ?>
    </tbody>
  </table>
  <script>setTimeout(function(){location.reload()}, 60000);</script>
</body>
</html>
