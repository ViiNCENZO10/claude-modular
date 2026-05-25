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
      '@keyframes fsyncSpin{to{transform:rotate(360deg)}}' +
      '@keyframes fsyncSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}' +
      '#fsync-overlay.closing{animation:fsyncFadeOut .4s ease-in forwards}' +
      // === Phase 1 : spinner "Chargement en cours..." ===
      '#fsync-overlay .fsync-phase1{display:flex;flex-direction:column;align-items:center;gap:20px;transition:opacity .4s}' +
      '#fsync-overlay.phase2 .fsync-phase1{opacity:0;pointer-events:none;position:absolute}' +
      '#fsync-overlay .fsync-spinner{width:64px;height:64px;border:4px solid rgba(6,182,212,.15);border-top-color:#06b6d4;border-right-color:#67e8f9;border-radius:50%;animation:fsyncSpin .9s linear infinite}' +
      '#fsync-overlay .fsync-loading{font-size:18px;font-weight:600;color:#cbd5e1;letter-spacing:.5px}' +
      '#fsync-overlay .fsync-loading-dots::after{content:"";animation:fsyncDots 1.5s steps(4,end) infinite}' +
      '@keyframes fsyncDots{0%{content:""}25%{content:"."}50%{content:".."}75%{content:"..."}100%{content:""}}' +
      // === Phase 2 : portal name + progress ===
      '#fsync-overlay .fsync-phase2{display:flex;flex-direction:column;align-items:center;opacity:0;pointer-events:none}' +
      '#fsync-overlay.phase2 .fsync-phase2{opacity:1;pointer-events:auto;animation:fsyncSlideUp .5s ease-out}' +
      '#fsync-overlay .fsync-logo{font-size:42px;font-weight:800;letter-spacing:-1px;margin-bottom:6px;background:linear-gradient(135deg,#06b6d4,#67e8f9 50%,#fff);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:fsyncPulse 2s ease-in-out infinite}' +
      '#fsync-overlay .fsync-portal-name{font-size:14px;color:#67e8f9;font-weight:600;margin-bottom:8px;letter-spacing:.3px}' +
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
      // Phase 1 : spinner avec "Chargement en cours..."
      '<div class="fsync-phase1">' +
        '<div class="fsync-spinner"></div>' +
        '<div class="fsync-loading">Chargement en cours<span class="fsync-loading-dots"></span></div>' +
      '</div>' +
      // Phase 2 : portail name + progress
      '<div class="fsync-phase2">' +
        '<div class="fsync-done-ico">✓</div>' +
        '<div class="fsync-logo">iPremTvOnline</div>' +
        '<div class="fsync-portal-name" id="fsync-portal"></div>' +
        '<div class="fsync-sub">Synchronisation du portail</div>' +
        '<div class="fsync-bar"><div class="fsync-fill"></div></div>' +
        '<div class="fsync-pct">0%</div>' +
        '<div class="fsync-step">Initialisation...</div>' +
        '<div class="fsync-detail"></div>' +
      '</div>';
    document.body.appendChild(overlay);
    fill = overlay.querySelector('.fsync-fill');
    pctEl = overlay.querySelector('.fsync-pct');
    stepEl = overlay.querySelector('.fsync-step');
    detailEl = overlay.querySelector('.fsync-detail');
  }

  function switchToPhase2(portalName) {
    if (!overlay) return;
    var pn = overlay.querySelector('#fsync-portal');
    if (pn) pn.textContent = portalName || '';
    overlay.classList.add('phase2');
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

    // Affiche le nom du portail dans la phase 2 dès que dispo
    var portalName = '';
    try {
      if (window.AppState && AppState.activePortal) {
        portalName = AppState.activePortal.name || AppState.activePortal.server || '';
      } else if (window.AppState && AppState.portals && AppState.portals[0]) {
        portalName = AppState.portals[0].name || AppState.portals[0].server || '';
      }
    } catch (e) {}

    // Phase 1 : 3 secondes d'attente animation spinner pendant la sync background
    // En parallele on lance la sync en BG. Au bout de 3s on switch en phase 2.
    var t0 = Date.now();
    setTimeout(function() { switchToPhase2(portalName); }, 3000);

    try {
      // === ULTRA-PARALLEL : TOUT en parallele d'un coup (haut debit fibre) ===
      // 6 reqs en flight simultanees (3 cats + 3 listes complètes)
      // Au lieu de phase 1 puis phase 2 séquentielles, tout en même temps
      setProgress(5, 'Connexion au portail...');

      var jobs = {
        liveCats: typeof api.getLiveCategories === 'function'
          ? api.getLiveCategories().catch(function() { return []; })
          : Promise.resolve([]),
        vodCats: typeof api.getVodCategories === 'function'
          ? api.getVodCategories().catch(function() { return []; })
          : Promise.resolve([]),
        seriesCats: typeof api.getSeriesCategories === 'function'
          ? api.getSeriesCategories().catch(function() { return []; })
          : Promise.resolve([]),
        liveStreams: typeof api.getLiveStreams === 'function'
          ? api.getLiveStreams().catch(function() { return []; })
          : Promise.resolve([]),
        vodStreams: typeof api.getVodStreams === 'function'
          ? api.getVodStreams().catch(function() { return []; })
          : Promise.resolve([]),
        seriesStreams: typeof api.getSeries === 'function'
          ? api.getSeries().catch(function() { return []; })
          : Promise.resolve([])
      };

      // Track progress as each finishes (visual feedback)
      var doneCount = 0;
      var TOTAL = 6;
      function bump(label, count) {
        doneCount++;
        setProgress(5 + (doneCount / TOTAL) * 85, label, count != null ? (count + ' éléments') : '');
      }
      jobs.liveCats = jobs.liveCats.then(function(r) { bump('Catégories Live', (r||[]).length); return r; });
      jobs.vodCats = jobs.vodCats.then(function(r) { bump('Catégories Films', (r||[]).length); return r; });
      jobs.seriesCats = jobs.seriesCats.then(function(r) { bump('Catégories Séries', (r||[]).length); return r; });
      jobs.liveStreams = jobs.liveStreams.then(function(r) {
        if (window.AppState) window.AppState.allLiveStreams = r || [];
        bump('Chaînes Live TV', (r||[]).length);
        return r;
      });
      jobs.vodStreams = jobs.vodStreams.then(function(r) {
        if (window.AppState) window.AppState.vodAllStreams = r || [];
        bump('Films', (r||[]).length);
        return r;
      });
      jobs.seriesStreams = jobs.seriesStreams.then(function(r) {
        if (window.AppState) window.AppState.seriesAllStreams = r || [];
        bump('Séries', (r||[]).length);
        return r;
      });

      var all = await Promise.all([
        jobs.liveCats, jobs.vodCats, jobs.seriesCats,
        jobs.liveStreams, jobs.vodStreams, jobs.seriesStreams
      ]);
      var allLive = all[3] || [], allVod = all[4] || [], allSeries = all[5] || [];

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

      var elapsedSec = ((Date.now() - t0) / 1000).toFixed(1);
      setProgress(100, 'Synchronisation terminée', 'Terminée en ' + elapsedSec + 's');
      closeOverlay(true);
      // Signale aux autres modules (poster-warmup, etc.) que la sync est OK
      try { document.dispatchEvent(new Event('iprem-fsync-done')); } catch (e) {}
      // Toast final non bloquant
      if (typeof window.showToast === 'function') {
        setTimeout(function() {
          window.showToast('Portail synchronisé : ' + allLive.length + ' chaînes · ' + allVod.length + ' films · ' + allSeries.length + ' séries');
        }, 1300);
      }

      // === EPG en background APRES la fermeture de l'overlay ===
      // (ne bloque plus l'utilisateur. Quand il arrive sur Live TV ce sera deja chaud)
      if (allLive.length && typeof api.getShortEPG === 'function') {
        if (window.AppState) window.AppState._nowEpgMap = window.AppState._nowEpgMap || {};
        var topChannels = allLive.slice(0, 50);
        var BATCH_EPG = 10;
        (async function backgroundEpg() {
          for (var i = 0; i < topChannels.length; i += BATCH_EPG) {
            var slice = topChannels.slice(i, i + BATCH_EPG);
            await Promise.all(slice.map(async function(ch) {
              try {
                var data = await api.getShortEPG(ch.stream_id);
                var listings = (data && data.epg_listings) ? data.epg_listings : [];
                if (listings.length && window.AppState) {
                  var nowMs = Date.now();
                  for (var j = 0; j < listings.length; j++) {
                    var p = listings[j];
                    var startMs = parseInt(p.start, 10) * 1000;
                    var endMs = parseInt(p.end || p.stop, 10) * 1000;
                    if (isNaN(startMs)) { startMs = Date.parse(p.start); endMs = Date.parse(p.end || p.stop || ''); }
                    if (!isNaN(startMs) && !isNaN(endMs) && startMs <= nowMs && nowMs <= endMs) {
                      // Utilise le decoder robuste (gere base64 + garbage detection)
                      var t = (typeof window._decodeEpgTitle === 'function')
                        ? window._decodeEpgTitle(p)
                        : (function() {
                            try { return p.title ? atob(p.title) : (p.title_decoded || ''); }
                            catch (_) { return p.title_decoded || ''; }
                          })();
                      if (t) window.AppState._nowEpgMap[ch.stream_id] = t;
                      break;
                    }
                  }
                }
              } catch (e) {}
            }));
          }
        })();
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
