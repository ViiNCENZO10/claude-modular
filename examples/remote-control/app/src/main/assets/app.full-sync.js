/* ============================================
   iPremTvOnline - Full Sync Portal au login

   Quand l'utilisateur se connecte a un portail, on charge AGRESSIVEMENT :
   - Categories Live + VOD + Series
   - Liste complete Live + VOD + Series
   - EPG "now" du top 50 chaines
   - Cache LS persistant pour reuse 6-24h

   Affiche un overlay plein ecran avec barre 0-100% + label du step actif.
   Une fois fait : navigation INSTANTANEE pour toute la session.
   ============================================ */

(function() {
  'use strict';

  var SYNC_DONE_KEY = 'iprem_full_sync_done_v1';
  var SYNC_TTL_MS = 6 * 60 * 60 * 1000; // resync apres 6h

  function injectStyles() {
    if (document.getElementById('iprem-fsync-styles')) return;
    var s = document.createElement('style');
    s.id = 'iprem-fsync-styles';
    s.textContent =
      '#fsync-overlay{position:fixed;inset:0;background:radial-gradient(circle at 50% 30%,#1e3a8a 0%,#0a1530 60%,#000 100%);z-index:9999;display:flex;align-items:center;justify-content:center;flex-direction:column;color:#fff;font-family:-apple-system,sans-serif;animation:fsyncFadeIn .3s ease-out}' +
      '@keyframes fsyncFadeIn{from{opacity:0}to{opacity:1}}' +
      '@keyframes fsyncFadeOut{from{opacity:1}to{opacity:0}}' +
      '@keyframes fsyncPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}' +
      '#fsync-overlay.closing{animation:fsyncFadeOut .4s ease-in forwards}' +
      '#fsync-overlay .fsync-logo{font-size:42px;font-weight:800;letter-spacing:-1px;margin-bottom:6px;background:linear-gradient(135deg,#06b6d4,#67e8f9 50%,#fff);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:fsyncPulse 2s ease-in-out infinite}' +
      '#fsync-overlay .fsync-sub{font-size:13px;color:#94a3b8;margin-bottom:36px}' +
      '#fsync-overlay .fsync-bar{width:60vw;max-width:600px;height:8px;background:rgba(255,255,255,.08);border-radius:4px;overflow:hidden;position:relative;box-shadow:0 0 24px rgba(6,182,212,.15)}' +
      '#fsync-overlay .fsync-fill{height:100%;background:linear-gradient(90deg,#06b6d4 0%,#67e8f9 50%,#3b82f6 100%);background-size:200% 100%;animation:fsyncShimmer 1.5s linear infinite;width:0%;border-radius:4px;transition:width .35s cubic-bezier(.4,0,.2,1);box-shadow:0 0 12px rgba(6,182,212,.6)}' +
      '@keyframes fsyncShimmer{0%{background-position:0% 0}100%{background-position:200% 0}}' +
      '#fsync-overlay .fsync-pct{font-size:32px;font-weight:700;color:#fff;font-variant-numeric:tabular-nums;margin-top:18px}' +
      '#fsync-overlay .fsync-step{font-size:14px;color:#cbd5e1;margin-top:6px;min-height:20px;text-align:center}' +
      '#fsync-overlay .fsync-detail{font-size:11px;color:#64748b;margin-top:4px;font-family:monospace;min-height:14px}' +
      '#fsync-overlay .fsync-done-ico{font-size:48px;color:#22c55e;margin-bottom:12px;display:none}' +
      '#fsync-overlay.success .fsync-done-ico{display:block;animation:fsyncPulse .6s ease-out}';
    document.head.appendChild(s);
  }

  var overlay = null;
  var fill = null;
  var pctEl = null;
  var stepEl = null;
  var detailEl = null;

  function openOverlay() {
    injectStyles();
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.id = 'fsync-overlay';
    overlay.innerHTML =
      '<div class="fsync-done-ico">✓</div>' +
      '<div class="fsync-logo">iPremTvOnline</div>' +
      '<div class="fsync-sub">Synchronisation du portail</div>' +
      '<div class="fsync-bar"><div class="fsync-fill"></div></div>' +
      '<div class="fsync-pct">0%</div>' +
      '<div class="fsync-step">Initialisation...</div>' +
      '<div class="fsync-detail"></div>';
    document.body.appendChild(overlay);
    fill = overlay.querySelector('.fsync-fill');
    pctEl = overlay.querySelector('.fsync-pct');
    stepEl = overlay.querySelector('.fsync-step');
    detailEl = overlay.querySelector('.fsync-detail');
  }

  function setProgress(pct, step, detail) {
    if (!overlay) return;
    var p = Math.max(0, Math.min(100, Math.round(pct)));
    fill.style.width = p + '%';
    pctEl.textContent = p + '%';
    if (step != null) stepEl.textContent = step;
    if (detail != null) detailEl.textContent = detail;
  }

  function closeOverlay(success) {
    if (!overlay) return;
    if (success) {
      overlay.classList.add('success');
      setProgress(100, 'Synchronisation terminée ✓', '');
      setTimeout(function() {
        overlay.classList.add('closing');
        setTimeout(function() {
          if (overlay && overlay.parentElement) overlay.parentElement.removeChild(overlay);
          overlay = null;
        }, 500);
      }, 800);
    } else {
      overlay.classList.add('closing');
      setTimeout(function() {
        if (overlay && overlay.parentElement) overlay.parentElement.removeChild(overlay);
        overlay = null;
      }, 400);
    }
  }

  async function runFullSync(api, opts) {
    opts = opts || {};
    if (!api) return false;
    openOverlay();

    var t0 = Date.now();
    try {
      // === Phase 1 : Categories (3 reqs en parallele, ~5%) ===
      setProgress(2, 'Chargement des catégories...');
      var pCats = [];
      if (typeof api.getLiveCategories === 'function')
        pCats.push(api.getLiveCategories().catch(function() { return []; }));
      else pCats.push([]);
      if (typeof api.getVodCategories === 'function')
        pCats.push(api.getVodCategories().catch(function() { return []; }));
      else pCats.push([]);
      if (typeof api.getSeriesCategories === 'function')
        pCats.push(api.getSeriesCategories().catch(function() { return []; }));
      else pCats.push([]);
      var results = await Promise.all(pCats);
      var liveCats = results[0] || [], vodCats = results[1] || [], seriesCats = results[2] || [];
      setProgress(8, 'Catégories chargées', liveCats.length + ' Live · ' + vodCats.length + ' Films · ' + seriesCats.length + ' Séries');

      // === Phase 2 : Listes COMPLETES en parallele (~3 reqs lourdes, 40%) ===
      setProgress(12, 'Chargement de la chaîne TV...');
      var pLists = [];
      pLists.push((async function() {
        if (typeof api.getLiveStreams !== 'function') return [];
        try {
          var r = await api.getLiveStreams();
          if (window.AppState) window.AppState.allLiveStreams = r || [];
          setProgress(25, 'Live TV chargé', (r ? r.length : 0) + ' chaînes');
          return r || [];
        } catch (e) { return []; }
      })());
      pLists.push((async function() {
        if (typeof api.getVodStreams !== 'function') return [];
        try {
          var r = await api.getVodStreams();
          if (window.AppState) window.AppState.vodAllStreams = r || [];
          setProgress(40, 'Films chargés', (r ? r.length : 0) + ' films');
          return r || [];
        } catch (e) { return []; }
      })());
      pLists.push((async function() {
        if (typeof api.getSeries !== 'function') return [];
        try {
          var r = await api.getSeries();
          if (window.AppState) window.AppState.seriesAllStreams = r || [];
          setProgress(55, 'Séries chargées', (r ? r.length : 0) + ' séries');
          return r || [];
        } catch (e) { return []; }
      })());
      var [allLive, allVod, allSeries] = await Promise.all(pLists);

      // === Phase 3 : EPG des 50 premieres chaines (~50 reqs parallel, 30%) ===
      if (allLive.length && typeof api.getShortEPG === 'function') {
        setProgress(60, 'Guide EPG en cours...', '0 / 50');
        if (window.AppState) window.AppState._nowEpgMap = window.AppState._nowEpgMap || {};
        var topChannels = allLive.slice(0, 50);
        var done = 0;
        var BATCH = 8;
        for (var i = 0; i < topChannels.length; i += BATCH) {
          var slice = topChannels.slice(i, i + BATCH);
          await Promise.all(slice.map(async function(ch) {
            try {
              var data = await api.getShortEPG(ch.stream_id);
              var listings = (data && data.epg_listings) ? data.epg_listings : [];
              if (listings.length && window.AppState) {
                // Trouve le programme en cours
                var nowMs = Date.now();
                for (var j = 0; j < listings.length; j++) {
                  var p = listings[j];
                  var startMs = parseInt(p.start) * 1000;
                  var endMs = parseInt(p.end || p.stop) * 1000;
                  if (isNaN(startMs)) { startMs = Date.parse(p.start); endMs = Date.parse(p.end || p.stop || ''); }
                  if (!isNaN(startMs) && !isNaN(endMs) && startMs <= nowMs && nowMs <= endMs) {
                    try {
                      var t = p.title ? atob(p.title) : (p.title_decoded || '');
                      if (t) window.AppState._nowEpgMap[ch.stream_id] = t;
                    } catch (e) {}
                    break;
                  }
                }
              }
            } catch (e) {}
            done++;
          }));
          var pct = 60 + (done / topChannels.length) * 30;
          setProgress(pct, 'Guide EPG en cours...', done + ' / ' + topChannels.length);
        }
      }

      // === Phase 4 : Marqueur LS + finalisation (95-100%) ===
      setProgress(95, 'Finalisation du cache...');
      try {
        localStorage.setItem(SYNC_DONE_KEY, JSON.stringify({
          t: Date.now(),
          live: allLive.length,
          vod: allVod.length,
          series: allSeries.length
        }));
      } catch (e) {}

      var elapsedSec = Math.round((Date.now() - t0) / 1000);
      setProgress(100, 'Synchronisation terminée', 'Terminée en ' + elapsedSec + 's');
      closeOverlay(true);
      // Toast final non bloquant
      if (typeof window.showToast === 'function') {
        setTimeout(function() {
          window.showToast('Portail synchronisé : ' + allLive.length + ' chaînes · ' + allVod.length + ' films · ' + allSeries.length + ' séries');
        }, 1300);
      }
      return true;
    } catch (e) {
      console.warn('full-sync failed', e);
      setProgress(100, 'Erreur de synchronisation', String(e && e.message || e));
      setTimeout(function() { closeOverlay(false); }, 1500);
      return false;
    }
  }

  function needsSync() {
    try {
      var raw = localStorage.getItem(SYNC_DONE_KEY);
      if (!raw) return true;
      var p = JSON.parse(raw);
      if (!p || !p.t) return true;
      return (Date.now() - p.t) > SYNC_TTL_MS;
    } catch (e) { return true; }
  }

  // ===== Hook automatique apres connexion portail =====
  function bootstrap() {
    var pending = false;
    var checkInterval = setInterval(function() {
      if (pending) return;
      if (!window.AppState || !window.AppState.api) return;
      // Une seule fois par session, sauf si TTL expire
      if (window.AppState._fullSyncTriggered) {
        clearInterval(checkInterval);
        return;
      }
      window.AppState._fullSyncTriggered = true;
      pending = true;
      if (needsSync()) {
        // Attendre 800ms que l'UI soit montee
        setTimeout(function() {
          runFullSync(window.AppState.api).catch(function() {});
        }, 800);
      }
      clearInterval(checkInterval);
    }, 500);
  }

  // Public API : pour bouton "Recharger tout" dans Settings
  window.iprem = window.iprem || {};
  window.iprem.fullSync = {
    run: function() {
      if (window.AppState && window.AppState.api) {
        // Force re-sync en clearant le marker
        try { localStorage.removeItem(SYNC_DONE_KEY); } catch (e) {}
        return runFullSync(window.AppState.api);
      }
      return Promise.resolve(false);
    },
    isStale: needsSync
  };

  window.addEventListener('DOMContentLoaded', function() {
    setTimeout(bootstrap, 500);
  });
})();
