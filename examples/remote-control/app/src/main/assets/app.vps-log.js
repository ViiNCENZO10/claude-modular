/* ============================================
   iPremTvOnline - VPS error logging
   Sends bug reports to https://158.220.85.28/iprem-logs/report
   - Anonymous (no IP, no portal credentials)
   - Severity: CRITICAL | ERROR | WARNING | INFO
   - Throttled (max 1 report per 5s per error signature)
   - Disabled if user toggles off in Settings
   ============================================ */

(function() {
  'use strict';

  var ENDPOINT = 'http://158.220.85.28/iprem-logs/report';
  var QUEUE_KEY = 'iprem_log_queue';
  var MAX_QUEUE = 50;
  var THROTTLE_MS = 5000;

  var recentSignatures = {};
  var deviceInfo = null;

  function computeDeviceInfo() {
    if (deviceInfo) return deviceInfo;
    deviceInfo = {
      ua: (navigator && navigator.userAgent) || '',
      lang: (navigator && navigator.language) || '',
      screen: (screen ? screen.width + 'x' + screen.height : ''),
      app_version: (typeof APP_VERSION !== 'undefined') ? APP_VERSION : ''
    };
    try {
      if (window.AndroidBridge && typeof window.AndroidBridge.getVersionCode === 'function') {
        deviceInfo.version_code = window.AndroidBridge.getVersionCode();
      }
    } catch (e) {}
    try {
      if (window.AndroidBridge && typeof window.AndroidBridge.getDeviceMac === 'function') {
        // Hash the MAC to keep anonymity (not the raw MAC)
        var mac = window.AndroidBridge.getDeviceMac() || '';
        deviceInfo.device_hash = simpleHash(mac);
      }
    } catch (e) {}
    return deviceInfo;
  }

  function simpleHash(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) & 0xFFFFFFFF;
    return (h >>> 0).toString(16);
  }

  function isLoggingEnabled() {
    return localStorage.getItem('iprem_logs_optout') !== '1';
  }

  // Signature = hash of error type + first line of stack (groups identical errors)
  function buildSignature(payload) {
    var stack = (payload.stack || '').split('\n')[0];
    return simpleHash((payload.severity || '') + '|' + (payload.message || '') + '|' + stack);
  }

  function send(payload) {
    if (!isLoggingEnabled()) return;
    var sig = buildSignature(payload);
    var now = Date.now();
    if (recentSignatures[sig] && now - recentSignatures[sig] < THROTTLE_MS) return;
    recentSignatures[sig] = now;

    payload.signature = sig;
    payload.timestamp = new Date().toISOString();
    payload.device = computeDeviceInfo();

    // Try direct POST; on failure, queue for retry
    try {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function() { queuePayload(payload); });
    } catch (e) {
      queuePayload(payload);
    }
  }

  function queuePayload(p) {
    try {
      var q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
      q.push(p);
      if (q.length > MAX_QUEUE) q = q.slice(-MAX_QUEUE);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
    } catch (e) {}
  }

  function flushQueue() {
    if (!isLoggingEnabled()) return;
    try {
      var q = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
      if (!q.length) return;
      localStorage.setItem(QUEUE_KEY, '[]');
      q.forEach(function(p) {
        fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(p),
          keepalive: true
        }).catch(function() { queuePayload(p); });
      });
    } catch (e) {}
  }

  // Public API
  window.iprem = window.iprem || {};
  window.iprem.log = {
    critical: function(message, context) { send({ severity: 'CRITICAL', message: message, context: context || {} }); },
    error: function(message, context) { send({ severity: 'ERROR', message: message, context: context || {} }); },
    warning: function(message, context) { send({ severity: 'WARNING', message: message, context: context || {} }); },
    info: function(message, context) { send({ severity: 'INFO', message: message, context: context || {} }); },
    setEnabled: function(b) { localStorage.setItem('iprem_logs_optout', b ? '0' : '1'); },
    isEnabled: isLoggingEnabled
  };

  // Capture window errors
  window.addEventListener('error', function(e) {
    if (!isLoggingEnabled()) return;
    send({
      severity: 'ERROR',
      message: e.message || 'Unknown JS error',
      stack: (e.error && e.error.stack) || '',
      context: { file: e.filename || '', line: e.lineno || 0, col: e.colno || 0 }
    });
  });

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', function(e) {
    if (!isLoggingEnabled()) return;
    var reason = e.reason || {};
    send({
      severity: 'ERROR',
      message: 'Unhandled promise: ' + (reason.message || String(reason)),
      stack: reason.stack || ''
    });
  });

  // Try to flush queue every 60s
  setInterval(flushQueue, 60000);
  // Flush on page load (after 2s)
  setTimeout(flushQueue, 2000);
})();
