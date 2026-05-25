/* ============================================
   iPremTvOnline - Poster Warmup TMDB

   Apres la full-sync, on a en cache LS les correspondances
   {titre_clean+annee -> tmdb_id+poster_url}. On precharge alors
   TOUS les posters TMDB en background via Image() invisible :
   - Le WebView les met dans son HTTP cache (RAM + disque)
   - Le decode bitmap est garde dans le texture cache GPU
   - A l'affichage reel : 0 latence, image deja en RAM

   Throttle : 6 en parallele, espacement 80ms pour ne pas saturer
   le reseau au boot.
   ============================================ */

(function() {
  'use strict';

  var inFlight = 0;
  var MAX_PARALLEL = 6;
  var queue = [];
  var preloaded = {};

  function preloadOne(url) {
    if (!url || preloaded[url]) return;
    preloaded[url] = true;
    inFlight++;
    var img = new Image();
    var done = function() {
      inFlight--;
      processQueue();
    };
    img.onload = done;
    img.onerror = done;
    img.src = url;
  }

  function processQueue() {
    while (inFlight < MAX_PARALLEL && queue.length > 0) {
      preloadOne(queue.shift());
    }
  }

  // Scan le LS pour trouver toutes les entrees TMDB cachees et les precharger
  function warmupAllCachedPosters() {
    var found = 0;
    var totalKeys = 0;
    try { totalKeys = localStorage.length; } catch (_) { return; }
    for (var i = 0; i < totalKeys; i++) {
      var k = null;
      try { k = localStorage.key(i); } catch (_) { continue; }
      if (!k || k.indexOf('iprem_tmdb_v2_') !== 0) continue;
      // try/catch INSIDE the loop : une entree corrompue ne doit pas arreter le warmup
      try {
        var raw = localStorage.getItem(k);
        if (!raw) continue;
        var entry = JSON.parse(raw);
        if (entry && entry.d && typeof entry.d === 'object' && entry.d.poster) {
          queue.push(entry.d.poster);
          found++;
        }
      } catch (e) {
        // Entree corrompue : on la purge pour ne plus la rencontrer
        try { localStorage.removeItem(k); } catch (_) {}
      }
    }
    if (found > 0) {
      processQueue();
      var pulser = setInterval(function() {
        if (!queue.length && !inFlight) { clearInterval(pulser); return; }
        processQueue();
      }, 200);
    }
  }

  // Hook : declenche apres la full-sync ou ~5s apres le boot si LS deja chaud
  function bootstrap() {
    // Cas 1 : LS contient deja des entrees TMDB -> warmup direct 4s apres boot
    setTimeout(function() {
      warmupAllCachedPosters();
    }, 4000);

    // Cas 2 : full-sync en cours -> on s'accroche a l'event "sync done"
    // (declenche par app.full-sync.js a la fin)
    document.addEventListener('iprem-fsync-done', function() {
      setTimeout(warmupAllCachedPosters, 1500);
    });
  }

  // API publique
  window.iprem = window.iprem || {};
  window.iprem.posterWarmup = {
    run: warmupAllCachedPosters,
    preload: function(url) { queue.push(url); processQueue(); }
  };

  window.addEventListener('DOMContentLoaded', function() {
    setTimeout(bootstrap, 1500);
  });
})();
