/* ============================================
   iPremTvOnline - OTA Update Progress UI
   Live download progress (1% to 100% with MB display)
   Called from MainActivity Java side via evaluateJavascript
   ============================================ */

(function() {
  'use strict';

  function injectStyles() {
    if (document.getElementById('iprem-ota-styles')) return;
    var s = document.createElement('style');
    s.id = 'iprem-ota-styles';
    s.textContent =
      '#otaProgressOverlay{position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:99999;display:none;align-items:center;justify-content:center;font-family:-apple-system,sans-serif}' +
      '#otaProgressOverlay.active{display:flex;animation:otaFadeIn .3s ease-out}' +
      '@keyframes otaFadeIn{from{opacity:0}to{opacity:1}}' +
      '.ota-modal{background:linear-gradient(135deg,#1e3a8a 0%,#0a1530 100%);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:32px 40px;width:520px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,.5);text-align:center}' +
      '.ota-icon{font-size:48px;margin-bottom:12px}' +
      '.ota-title{font-size:22px;font-weight:700;color:#fff;margin-bottom:6px}' +
      '.ota-subtitle{font-size:13px;color:#94a3b8;margin-bottom:24px}' +
      '.ota-progress-bg{width:100%;height:10px;background:rgba(255,255,255,.08);border-radius:10px;overflow:hidden;position:relative;margin-bottom:14px}' +
      '.ota-progress-fill{height:100%;background:linear-gradient(90deg,#3b82f6,#06b6d4);border-radius:10px;width:0%;transition:width .2s ease-out;box-shadow:0 0 12px rgba(59,130,246,.6)}' +
      '.ota-progress-fill.indeterminate{background:linear-gradient(90deg,transparent,#3b82f6,transparent);background-size:200% 100%;animation:otaIndet 1.5s infinite linear;width:100%}' +
      '@keyframes otaIndet{0%{background-position:200% 0}100%{background-position:-200% 0}}' +
      '.ota-stats{display:flex;justify-content:space-between;font-size:13px;color:#cbd5e1;margin-bottom:6px;font-family:monospace}' +
      '.ota-percent{font-size:36px;font-weight:800;color:#06b6d4;margin:6px 0}' +
      '.ota-status{font-size:12px;color:#94a3b8;margin-top:14px;min-height:18px}' +
      '.ota-speed{font-size:11px;color:#64748b;margin-top:4px;font-family:monospace}';
    document.head.appendChild(s);
  }

  function ensureOverlay() {
    var existing = document.getElementById('otaProgressOverlay');
    if (existing) return existing;
    injectStyles();
    var overlay = document.createElement('div');
    overlay.id = 'otaProgressOverlay';
    overlay.innerHTML =
      '<div class="ota-modal">' +
        '<div class="ota-icon">⬇</div>' +
        '<div class="ota-title">Mise à jour en cours</div>' +
        '<div class="ota-subtitle">Téléchargement de la nouvelle version</div>' +
        '<div class="ota-percent" id="otaPercent">0%</div>' +
        '<div class="ota-progress-bg">' +
          '<div class="ota-progress-fill indeterminate" id="otaFill"></div>' +
        '</div>' +
        '<div class="ota-stats">' +
          '<span id="otaBytes">— MB / — MB</span>' +
          '<span id="otaSpeed">—</span>' +
        '</div>' +
        '<div class="ota-status" id="otaStatus">Connexion au serveur...</div>' +
      '</div>';
    document.body.appendChild(overlay);
    return overlay;
  }

  function formatBytes(n) {
    if (!n || n < 0) return '—';
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(0) + ' KB';
    if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + ' MB';
    return (n / 1024 / 1024 / 1024).toFixed(2) + ' GB';
  }

  var startedAt = 0;
  var lastBytes = 0;
  var lastTime = 0;

  function showOverlay() {
    var o = ensureOverlay();
    o.classList.add('active');
    startedAt = Date.now();
    lastBytes = 0;
    lastTime = startedAt;
  }

  function hideOverlay() {
    var o = document.getElementById('otaProgressOverlay');
    if (o) o.classList.remove('active');
  }

  window.iprem = window.iprem || {};

  window.iprem.onDownloadProgress = function(now, total, phase) {
    showOverlay();
    var o = ensureOverlay();
    var pct = total > 0 ? Math.min(100, Math.round(now / total * 100)) : 0;
    var fill = document.getElementById('otaFill');
    var pctEl = document.getElementById('otaPercent');
    var bytesEl = document.getElementById('otaBytes');
    var speedEl = document.getElementById('otaSpeed');
    var statusEl = document.getElementById('otaStatus');

    if (phase === 'start') {
      if (statusEl) statusEl.textContent = 'Connexion au serveur...';
      if (fill) fill.classList.add('indeterminate');
      if (pctEl) pctEl.textContent = '0%';
      if (bytesEl) bytesEl.textContent = '— MB / — MB';
      return;
    }

    if (total > 0) {
      if (fill) {
        fill.classList.remove('indeterminate');
        fill.style.width = pct + '%';
      }
      if (pctEl) pctEl.textContent = pct + '%';
      if (bytesEl) bytesEl.textContent = formatBytes(now) + ' / ' + formatBytes(total);

      // Speed calc
      var nowMs = Date.now();
      var dt = (nowMs - lastTime) / 1000;
      if (dt > 0.5 && speedEl) {
        var delta = now - lastBytes;
        var bytesPerSec = delta / dt;
        speedEl.textContent = formatBytes(bytesPerSec) + '/s';
        lastBytes = now;
        lastTime = nowMs;
      }

      // ETA
      if (statusEl && bytesPerSec > 0 && now < total) {
        var remaining = (total - now) / bytesPerSec;
        if (remaining < 60) statusEl.textContent = 'Téléchargement... reste ' + Math.ceil(remaining) + 's';
        else statusEl.textContent = 'Téléchargement... reste ' + Math.ceil(remaining / 60) + ' min';
      }
    }

    if (phase === 'complete' || (total > 0 && now >= total)) {
      if (fill) {
        fill.classList.remove('indeterminate');
        fill.style.width = '100%';
      }
      if (pctEl) pctEl.textContent = '100%';
      if (bytesEl) bytesEl.textContent = formatBytes(total) + ' / ' + formatBytes(total);
      if (speedEl) speedEl.textContent = '✓';
      if (statusEl) statusEl.textContent = 'Téléchargement terminé — lancement de l\'installation...';
      // Hide overlay after a delay (Android installer takes over)
      setTimeout(hideOverlay, 4000);
    }
  };

  window.iprem.onDownloadError = function(msg) {
    var o = ensureOverlay();
    o.classList.add('active');
    var statusEl = document.getElementById('otaStatus');
    if (statusEl) statusEl.textContent = '❌ Erreur : ' + msg;
    var fill = document.getElementById('otaFill');
    if (fill) { fill.classList.remove('indeterminate'); fill.style.background = '#ef4444'; }
    setTimeout(hideOverlay, 6000);
  };

  // Expose for manual close
  window.iprem.closeOtaOverlay = hideOverlay;
})();
