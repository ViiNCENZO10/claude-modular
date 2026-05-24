/* ============================================
   iPremTvOnline - Hot-reload bootstrap
   Loaded FIRST. Fetches an update manifest at app start.
   If new JS patches are available, downloads + executes them
   AFTER the bundled scripts have loaded (overrides via monkey-patching).
   No APK reinstall required for UI/logic updates.
   ============================================ */

(function() {
  'use strict';

  // Manifest URL - hosted on GitHub Pages (default branch's hotpatch folder)
  // Format expected: { "version": "X.Y.Z", "patches": ["url1.js", "url2.js"], "message": "..." }
  var DEFAULT_MANIFEST_URL = 'https://raw.githubusercontent.com/ViiNCENZO10/claude-modular/claude/remote-control-feature-QLoSs/hotpatch/manifest.json';
  var MANIFEST_URL_KEY = 'iprem_hotpatch_url';
  var LAST_VERSION_KEY = 'iprem_hotpatch_version';
  var CACHED_SCRIPTS_KEY = 'iprem_hotpatch_cache';

  function manifestUrl() {
    return localStorage.getItem(MANIFEST_URL_KEY) || DEFAULT_MANIFEST_URL;
  }

  // Try to fetch the manifest
  async function fetchManifest() {
    try {
      var url = manifestUrl() + '?t=' + Date.now(); // cache buster
      var r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) return null;
      return await r.json();
    } catch (e) {
      console.warn('[hotreload] manifest fetch failed', e);
      return null;
    }
  }

  // Fetch each patch JS as text
  async function fetchPatches(urls) {
    var results = [];
    for (var i = 0; i < urls.length; i++) {
      try {
        var r = await fetch(urls[i] + '?t=' + Date.now(), { cache: 'no-store' });
        if (!r.ok) { results.push(null); continue; }
        results.push(await r.text());
      } catch (e) {
        results.push(null);
      }
    }
    return results;
  }

  function executePatches(patchSources) {
    patchSources.forEach(function(src, idx) {
      if (!src) return;
      try {
        // Wrap in IIFE to isolate scope
        var wrapped = '(function(){ try {' + src + '\n} catch(e){ console.error("[hotpatch '+idx+']", e); } })();';
        var s = document.createElement('script');
        s.textContent = wrapped;
        s.setAttribute('data-hotpatch', idx);
        document.head.appendChild(s);
      } catch (e) {
        console.error('[hotreload] patch execution failed', e);
      }
    });
  }

  function getCachedScripts() {
    try { return JSON.parse(localStorage.getItem(CACHED_SCRIPTS_KEY) || '[]'); } catch (e) { return []; }
  }

  function setCachedScripts(sources) {
    try { localStorage.setItem(CACHED_SCRIPTS_KEY, JSON.stringify(sources)); } catch (e) {}
  }

  // Bootstrap: try network manifest, fall back to cache
  async function bootstrap() {
    // Apply cached scripts first (instant, works offline)
    var cached = getCachedScripts();
    if (cached.length > 0) {
      // Apply AFTER bundled scripts have parsed and registered
      setTimeout(function() { executePatches(cached); }, 1500);
    }

    var manifest = await fetchManifest();
    if (!manifest) return;

    var lastVersion = localStorage.getItem(LAST_VERSION_KEY) || '';
    if (manifest.version === lastVersion && cached.length > 0) {
      // Same version, cached already applied
      return;
    }

    var urls = manifest.patches || [];
    if (urls.length === 0) return;

    var sources = await fetchPatches(urls);
    var validSources = sources.filter(function(s) { return s != null; });
    if (validSources.length === 0) return;

    // Cache new patches
    setCachedScripts(validSources);
    localStorage.setItem(LAST_VERSION_KEY, manifest.version || '');

    // Apply NEW patches now (may override cached ones already applied)
    setTimeout(function() {
      executePatches(validSources);
      if (manifest.message && typeof window.showToast === 'function') {
        window.showToast('Mise à jour appliquée: ' + manifest.message);
      }
    }, 1800);
  }

  // Settings UI for hot-reload (advanced users)
  function buildHotreloadSettings() {
    if (document.getElementById('settingHotreloadUrl')) return;
    var layout = document.querySelector('#settings .settings-sections');
    if (!layout) return;
    var url = manifestUrl();
    var section = document.createElement('div');
    section.className = 'settings-section';
    section.innerHTML =
      '<h3>Hot-reload (mises à jour JS sans réinstallation)</h3>' +
      '<div class="setting-row focusable" tabindex="0">' +
        '<span class="setting-label">Manifest URL</span>' +
        '<input type="url" id="settingHotreloadUrl" class="setting-input" value="' + url.replace(/"/g, '&quot;') + '" autocapitalize="none">' +
      '</div>' +
      '<div class="setting-row">' +
        '<button class="btn btn-secondary focusable" id="btnHotreloadCheck" tabindex="0">Vérifier maintenant</button>' +
        '<button class="btn btn-secondary focusable" id="btnHotreloadClear" tabindex="0">Effacer cache hotpatch</button>' +
      '</div>' +
      '<div class="setting-row">' +
        '<span class="setting-label">Dernière version appliquée</span>' +
        '<span class="setting-value">' + (localStorage.getItem(LAST_VERSION_KEY) || '(aucune)') + '</span>' +
      '</div>';
    layout.appendChild(section);

    document.getElementById('settingHotreloadUrl').addEventListener('change', function(e) {
      localStorage.setItem(MANIFEST_URL_KEY, e.target.value.trim());
      showToast && showToast('URL hotpatch enregistrée');
    });
    document.getElementById('btnHotreloadCheck').addEventListener('click', async function() {
      showToast && showToast('Vérification...');
      await bootstrap();
      showToast && showToast('Vérification terminée');
    });
    document.getElementById('btnHotreloadClear').addEventListener('click', function() {
      localStorage.removeItem(LAST_VERSION_KEY);
      localStorage.removeItem(CACHED_SCRIPTS_KEY);
      showToast && showToast('Cache hotpatch vidé');
    });
  }

  // ====== Background polling + foreground re-check ======
  var POLL_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
  var pollTimer = null;
  var lastSeenVersion = null;

  function showUpdateBanner(newVersion, message) {
    var existing = document.getElementById('hotreloadBanner');
    if (existing) existing.remove();
    var banner = document.createElement('div');
    banner.id = 'hotreloadBanner';
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9998;background:linear-gradient(90deg,#16a34a,#22c55e);color:#fff;padding:10px 16px;display:flex;justify-content:center;align-items:center;gap:14px;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,.3)';
    banner.innerHTML =
      '<span>🔄 Mise à jour disponible (v' + (newVersion || '?') + ')' + (message ? ' — ' + message : '') + '</span>' +
      '<button class="btn btn-primary btn-sm" id="hotreloadReload">Recharger maintenant</button>' +
      '<button style="background:transparent;border:none;color:#fff;font-size:18px;cursor:pointer" id="hotreloadDismiss">×</button>';
    document.body.appendChild(banner);
    document.getElementById('hotreloadReload').addEventListener('click', function() {
      location.reload();
    });
    document.getElementById('hotreloadDismiss').addEventListener('click', function() {
      banner.remove();
    });
  }

  async function checkForNewVersion() {
    var manifest = await fetchManifest();
    if (!manifest) return;
    var currentVersion = localStorage.getItem(LAST_VERSION_KEY) || '';
    if (manifest.version && manifest.version !== currentVersion && manifest.version !== lastSeenVersion) {
      lastSeenVersion = manifest.version;
      showUpdateBanner(manifest.version, manifest.message);
    }
  }

  function startBackgroundPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(checkForNewVersion, POLL_INTERVAL_MS);
  }

  // Re-check when app comes back to foreground
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      setTimeout(checkForNewVersion, 1000);
    }
  });

  // Bootstrap as soon as possible
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      bootstrap();
      setTimeout(startBackgroundPolling, 5000);
    });
  } else {
    bootstrap();
    setTimeout(startBackgroundPolling, 5000);
  }

  // Build Settings UI when settings screen is shown
  window.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
      if (typeof window.showScreen === 'function') {
        var orig = window.showScreen;
        window.showScreen = function(id) {
          var r = orig.apply(this, arguments);
          if (id === 'settings') setTimeout(buildHotreloadSettings, 120);
          return r;
        };
      }
    }, 1000);
  });

  // Expose for debugging
  window.hotreload = { bootstrap: bootstrap, clear: function() {
    localStorage.removeItem(LAST_VERSION_KEY);
    localStorage.removeItem(CACHED_SCRIPTS_KEY);
  }};
})();
