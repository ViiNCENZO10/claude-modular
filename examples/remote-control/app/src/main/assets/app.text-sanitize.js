/* ============================================
   iPremTvOnline - Text sanitizer
   Strips garbled / non-printable text from channel rows and EPG fields
   Targets the "©© ^®Ú¢g§‖Æ" type of mojibake from Stalker portals
   ============================================ */

(function() {
  'use strict';

  // Detects garbage strings: high ratio of Latin-1 supplement / control / replacement chars
  function looksLikeGarbage(s) {
    if (!s) return false;
    var str = String(s).trim();
    if (str.length < 3) return false;
    // Replacement char detection (U+FFFD)
    if (str.indexOf('�') !== -1) return true;
    // Mojibake hints: sequences like "©© ^®" "Ú¢g§"
    if (/©©|\^®|‖Æ|Ú¢|§Æ/.test(str)) return true;
    // High symbol ratio (Latin-1 supplement + spacing modifier letters)
    var matches = str.match(/[ -ÿʰ-ͯ -⁯]/g) || [];
    var ratio = matches.length / str.length;
    if (ratio > 0.5 && str.length > 4) return true;
    return false;
  }

  function sanitize(text) {
    if (!text) return '';
    return String(text).replace(/[\x00-\x1F\x7F�]/g, '').trim();
  }

  // Patrol the DOM and hide / clean garbled text
  function patrol() {
    // Channel list rows: any TextView-style spans inside .channel-list li
    var selectors = [
      '.channel-list li *',
      '.epg-channel-label *',
      '.cw-card *',
      '.preview-info *'
    ];
    selectors.forEach(function(sel) {
      document.querySelectorAll(sel).forEach(function(el) {
        // Skip elements with children — we only want leaf text nodes
        if (el.children.length > 0) return;
        var txt = el.textContent;
        if (!txt) return;
        if (looksLikeGarbage(txt)) {
          el.textContent = '';
          el.style.display = 'none';
        } else {
          var clean = sanitize(txt);
          if (clean !== txt) el.textContent = clean;
        }
      });
    });
  }

  // Throttled MutationObserver — runs patrol when DOM changes
  var pending = false;
  function startObserver() {
    if (window._iprem_sanitize_observer) return;
    var observer = new MutationObserver(function() {
      if (pending) return;
      pending = true;
      requestAnimationFrame(function() {
        try { patrol(); } catch (e) {}
        pending = false;
      });
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    window._iprem_sanitize_observer = observer;
  }

  // Expose for prefetch usage
  window.iprem = window.iprem || {};
  window.iprem.sanitize = sanitize;
  window.iprem.looksLikeGarbage = looksLikeGarbage;

  window.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
      startObserver();
      patrol();
    }, 1500);
  });
})();
