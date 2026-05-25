/* ============================================
   iPremTvOnline - Transitions & loading indicator

   Objectif fluidite :
   1. Loader fin de 2px en haut de l'ecran, animation cyan shimmer
      => visible des qu'un fetch async est en cours
   2. Compteur de fetchs en cours (n>0 => loader ON, n=0 => loader OFF)
   3. Auto-wrap fetch() global pour comptabiliser automatiquement
   4. API publique window.iprem.loader.start/stop pour les operations non-fetch

   Activation : injecte un <div id="ipremTopLoader"> au DOMContentLoaded.
   ============================================ */

(function() {
  'use strict';

  var inFlight = 0;
  var loaderEl = null;

  function ensureLoader() {
    if (loaderEl) return loaderEl;
    loaderEl = document.getElementById('ipremTopLoader');
    if (!loaderEl) {
      loaderEl = document.createElement('div');
      loaderEl.id = 'ipremTopLoader';
      loaderEl.className = 'iprem-top-loader';
      document.body.appendChild(loaderEl);
    }
    return loaderEl;
  }

  function show() {
    var el = ensureLoader();
    if (el) el.classList.add('active');
  }
  function hide() {
    var el = ensureLoader();
    if (el) el.classList.remove('active');
  }

  function start() {
    inFlight++;
    if (inFlight === 1) show();
  }
  function stop() {
    inFlight = Math.max(0, inFlight - 1);
    if (inFlight === 0) hide();
  }

  // Public API
  window.iprem = window.iprem || {};
  window.iprem.loader = { start: start, stop: stop };

  // Auto-wrap fetch global pour comptage automatique
  if (typeof window.fetch === 'function' && !window._ipremFetchWrapped) {
    window._ipremFetchWrapped = true;
    var origFetch = window.fetch.bind(window);
    window.fetch = function() {
      start();
      var p;
      try { p = origFetch.apply(null, arguments); }
      catch (e) { stop(); throw e; }
      p.then(function() { stop(); }, function() { stop(); });
      return p;
    };
  }

  window.addEventListener('DOMContentLoaded', function() {
    setTimeout(ensureLoader, 100);
  });
})();
