/* ============================================
   iPremTvOnline - Performance caches
   - In-memory cache 1h for EPG + categories
   - Prefetch (HEAD) on hover over Live channels
   ============================================ */

(function() {
  'use strict';

  var TTL_MS = 60 * 60 * 1000; // 1h
  var memCache = {};

  function withCache(api, methodName) {
    if (!api || typeof api[methodName] !== 'function') return;
    if (api['_cached_' + methodName]) return; // already wrapped
    var orig = api[methodName].bind(api);
    api[methodName] = async function() {
      var key = methodName + '|' + Array.prototype.slice.call(arguments).join('|');
      var entry = memCache[key];
      if (entry && Date.now() - entry.t < TTL_MS) return entry.data;
      var data;
      try { data = await orig.apply(api, arguments); }
      catch (e) { if (entry) return entry.data; throw e; }
      memCache[key] = { t: Date.now(), data: data };
      return data;
    };
    api['_cached_' + methodName] = true;
  }

  function applyCaches() {
    if (!window.AppState || !window.AppState.api) return false;
    var api = window.AppState.api;
    // Heavy/repeated calls
    withCache(api, 'getShortEPG');
    withCache(api, 'getFullEPG');
    withCache(api, 'getLiveCategories');
    withCache(api, 'getVodCategories');
    withCache(api, 'getSeriesCategories');
    return true;
  }

  // Watch for AppState.api becoming available (after login)
  var attempts = 0;
  var iv = setInterval(function() {
    attempts++;
    if (applyCaches() || attempts > 120) clearInterval(iv);
  }, 500);


  // ===== Prefetch on channel focus =====
  // When user focuses a channel in the live list, fire-and-forget HEAD/GET to warm HTTP cache
  var prefetchedUrls = {};
  function prefetchUrl(url) {
    if (!url || prefetchedUrls[url]) return;
    prefetchedUrls[url] = true;
    try {
      fetch(url, { method: 'HEAD', mode: 'no-cors', cache: 'force-cache' }).catch(function() {});
    } catch (e) {}
  }

  window.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
      // Listen for focus events on channel list items to prefetch
      document.addEventListener('focus', function(e) {
        var li = e.target.closest && e.target.closest('.channel-list li');
        if (!li || !window.AppState || !AppState.api) return;
        var idx = Array.from(li.parentElement.children).indexOf(li);
        var ch = (AppState.liveStreams || [])[idx];
        if (!ch) return;
        try {
          var ext = (AppState.settings && AppState.settings.streamType) || 'm3u8';
          if (AppState.api.providerType !== 'stalker' && typeof AppState.api.liveUrl === 'function') {
            prefetchUrl(AppState.api.liveUrl(ch.stream_id, ext));
          }
        } catch (e) {}
      }, true);
    }, 2000);
  });

})();
