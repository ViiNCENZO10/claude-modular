/* ============================================
   iPremTvOnline - Performance caches v2

   Trois couches :
   1. Cache memoire (RAM) : TTL 1h, hit instant pendant la session
   2. Cache localStorage : TTL 24h pour categories, 6h pour listes
      => au reboot de l'app, les categories + dernieres listes sont restaurees
   3. Skeleton screens : placeholders gris instantanes pendant le fetch
      => sensation de reactivite meme si le serveur met 2s a repondre

   Bonus :
   - Precharge des categories adjacentes au focus (le N-1 et N+1)
   - Memoire des logos en 404 pour ne pas re-tenter
   ============================================ */

(function() {
  'use strict';

  var MEM_TTL = 60 * 60 * 1000;            // 1h en RAM
  var LS_TTL_CATS = 24 * 60 * 60 * 1000;   // 24h pour categories
  var LS_TTL_LISTS = 6 * 60 * 60 * 1000;   // 6h pour listes contenus
  var LS_PREFIX = 'iprem_cache_v2_';

  var memCache = {};

  // ===== Utilitaires localStorage =====
  function lsKey(method, args) {
    return LS_PREFIX + method + '_' + (args.join('_').replace(/[^a-z0-9_-]/gi, '').slice(0, 80));
  }
  function lsGet(key, ttl) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.t || (Date.now() - parsed.t) > ttl) {
        try { localStorage.removeItem(key); } catch (e) {}
        return null;
      }
      return parsed.d;
    } catch (e) { return null; }
  }
  function lsSet(key, data) {
    try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), d: data })); }
    catch (e) {
      // Quota plein : on purge les vieilles entrees et on retente
      try { _pruneLs(); localStorage.setItem(key, JSON.stringify({ t: Date.now(), d: data })); }
      catch (e2) {}
    }
  }
  function _pruneLs() {
    var keys = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf(LS_PREFIX) === 0) keys.push(k);
    }
    // Remove the 25% oldest entries
    var entries = keys.map(function(k) {
      try { return { k: k, t: (JSON.parse(localStorage.getItem(k)) || {}).t || 0 }; }
      catch (e) { return { k: k, t: 0 }; }
    });
    entries.sort(function(a, b) { return a.t - b.t; });
    entries.slice(0, Math.ceil(entries.length / 4)).forEach(function(e) {
      try { localStorage.removeItem(e.k); } catch (err) {}
    });
  }

  // ===== Wrapper generique avec 3 couches de cache =====
  function withCache(api, methodName, lsTtl) {
    if (!api || typeof api[methodName] !== 'function') return;
    if (api['_cached_' + methodName]) return; // already wrapped
    var orig = api[methodName].bind(api);
    api[methodName] = async function() {
      var argsArr = Array.prototype.slice.call(arguments);
      var memKey = methodName + '|' + argsArr.join('|');

      // 1. RAM hit
      var entry = memCache[memKey];
      if (entry && Date.now() - entry.t < MEM_TTL) return entry.data;

      // 2. localStorage hit (seulement si lsTtl > 0)
      if (lsTtl > 0) {
        var lk = lsKey(methodName, argsArr);
        var fromLs = lsGet(lk, lsTtl);
        if (fromLs != null) {
          // Promote to mem cache for next call this session
          memCache[memKey] = { t: Date.now(), data: fromLs };
          // Best-effort revalidation en background (stale-while-revalidate)
          setTimeout(function() {
            orig.apply(api, argsArr).then(function(fresh) {
              if (fresh != null) {
                memCache[memKey] = { t: Date.now(), data: fresh };
                lsSet(lk, fresh);
              }
            }).catch(function() {});
          }, 100);
          return fromLs;
        }
      }

      // 3. Fetch reseau
      var data;
      try { data = await orig.apply(api, argsArr); }
      catch (e) {
        // Fallback to stale entry on error
        if (entry) return entry.data;
        if (lsTtl > 0) {
          var stale = lsGet(lsKey(methodName, argsArr), 7 * 24 * 60 * 60 * 1000);
          if (stale) return stale;
        }
        throw e;
      }
      memCache[memKey] = { t: Date.now(), data: data };
      if (lsTtl > 0 && data != null) lsSet(lsKey(methodName, argsArr), data);
      return data;
    };
    api['_cached_' + methodName] = true;
  }

  function applyCaches() {
    if (!window.AppState || !window.AppState.api) return false;
    var api = window.AppState.api;
    // Categories (changent peu) -> LS 24h
    withCache(api, 'getLiveCategories', LS_TTL_CATS);
    withCache(api, 'getVodCategories', LS_TTL_CATS);
    withCache(api, 'getSeriesCategories', LS_TTL_CATS);
    // Listes contenus (peuvent changer plus souvent) -> LS 6h
    withCache(api, 'getLiveStreams', LS_TTL_LISTS);
    withCache(api, 'getVod', LS_TTL_LISTS);
    withCache(api, 'getSeries', LS_TTL_LISTS);
    // EPG : RAM seulement (change toutes les 30 min, pas la peine de persister)
    withCache(api, 'getShortEPG', 0);
    withCache(api, 'getFullEPG', 0);
    return true;
  }

  // ===== Skeleton screens =====
  // Inject CSS pour skeleton + observer pour insertion auto
  function injectSkeletonStyles() {
    if (document.getElementById('iprem-skeleton-styles')) return;
    var s = document.createElement('style');
    s.id = 'iprem-skeleton-styles';
    s.textContent =
      '@keyframes ipremShimmer { 0% { background-position: -300px 0 } 100% { background-position: 300px 0 } }' +
      '.iprem-skel { background: linear-gradient(90deg, rgba(255,255,255,.04) 0px, rgba(255,255,255,.10) 80px, rgba(255,255,255,.04) 160px); background-size: 300px 100%; animation: ipremShimmer 1.2s linear infinite; border-radius: 6px; }' +
      '.channel-list .iprem-skel-row { display: flex; align-items: center; gap: 12px; padding: 10px 12px; height: 44px; margin-bottom: 2px; }' +
      '.channel-list .iprem-skel-row .iprem-skel.logo { width: 40px; height: 40px; flex-shrink: 0 }' +
      '.channel-list .iprem-skel-row .iprem-skel.line { flex: 1; height: 14px }' +
      '.vod-grid .iprem-skel-card { aspect-ratio: 2/3; }' +
      '.category-list .iprem-skel-cat { height: 32px; margin: 4px 8px; }';
    document.head.appendChild(s);
  }

  function showSkeletonChannels(container, count) {
    if (!container) return;
    container.innerHTML = '';
    for (var i = 0; i < count; i++) {
      var li = document.createElement('li');
      li.className = 'iprem-skel-row';
      li.innerHTML = '<div class="iprem-skel logo"></div><div class="iprem-skel line"></div>';
      container.appendChild(li);
    }
  }

  function showSkeletonCards(container, count) {
    if (!container) return;
    container.innerHTML = '';
    for (var i = 0; i < count; i++) {
      var div = document.createElement('div');
      div.className = 'iprem-skel iprem-skel-card';
      container.appendChild(div);
    }
  }

  // Wrapper qui affiche skeleton avant fetch, puis laisse le code normal remplir
  function wrapWithSkeleton(fnName, getContainer, skeletonFn, count) {
    var orig = window[fnName];
    if (typeof orig !== 'function') return;
    window[fnName] = function() {
      try {
        var c = getContainer();
        if (c && (!c.children.length || c.querySelector('.iprem-skel'))) skeletonFn(c, count);
      } catch (e) {}
      return orig.apply(this, arguments);
    };
  }

  // ===== Precharge des categories adjacentes =====
  // Quand user navigue sur la categorie N dans live/vod, on precharge N-1 et N+1 en background
  function setupAdjacentPrefetch() {
    document.addEventListener('focus', function(e) {
      var item = e.target.closest && e.target.closest('.category-list li, .category-item');
      if (!item || !window.AppState || !AppState.api) return;
      var section = null;
      if (item.closest('#liveCategorySidebar')) section = 'live';
      else if (item.closest('#vodCategorySidebar')) section = 'vod';
      else if (item.closest('#seriesCategorySidebar')) section = 'series';
      if (!section) return;
      var siblings = Array.from(item.parentElement.children);
      var idx = siblings.indexOf(item);
      [idx - 1, idx + 1].forEach(function(j) {
        if (j < 0 || j >= siblings.length) return;
        var s = siblings[j];
        var cid = s.getAttribute('data-category-id') || s.dataset.categoryId;
        if (!cid) return;
        // Fire-and-forget : le cache wrapper handles the rest
        try {
          if (section === 'live' && typeof AppState.api.getLiveStreams === 'function') {
            AppState.api.getLiveStreams(cid).catch(function() {});
          } else if (section === 'vod' && typeof AppState.api.getVod === 'function') {
            AppState.api.getVod(cid).catch(function() {});
          } else if (section === 'series' && typeof AppState.api.getSeries === 'function') {
            AppState.api.getSeries(cid).catch(function() {});
          }
        } catch (err) {}
      }, true);
    }, true);
  }

  // ===== Init =====
  var attempts = 0;
  var iv = setInterval(function() {
    attempts++;
    if (applyCaches() || attempts > 120) clearInterval(iv);
  }, 500);

  window.addEventListener('DOMContentLoaded', function() {
    injectSkeletonStyles();
    setTimeout(function() {
      // Wire skeleton: when loadCategoryChannels or similar is called, show skeleton first
      wrapWithSkeleton('loadCategoryChannels',
        function() { return document.getElementById('liveChannelList'); },
        showSkeletonChannels, 12);
      wrapWithSkeleton('loadLiveChannels',
        function() { return document.getElementById('liveChannelList'); },
        showSkeletonChannels, 12);
      wrapWithSkeleton('loadVodList',
        function() { return document.getElementById('vodGrid'); },
        showSkeletonCards, 18);
      wrapWithSkeleton('loadSeriesList',
        function() { return document.getElementById('seriesGrid'); },
        showSkeletonCards, 18);
      setupAdjacentPrefetch();
    }, 1500);
  });

  // ===== API d'invalidation =====
  window.ipremCache = window.ipremCache || {};
  window.ipremCache.invalidate = function(methodPrefix) {
    var keys = Object.keys(memCache);
    var n = 0;
    keys.forEach(function(k) {
      if (!methodPrefix || k.indexOf(methodPrefix) === 0) { delete memCache[k]; n++; }
    });
    // Aussi en LS
    try {
      for (var i = localStorage.length - 1; i >= 0; i--) {
        var lk = localStorage.key(i);
        if (lk && lk.indexOf(LS_PREFIX) === 0 && (!methodPrefix || lk.indexOf(LS_PREFIX + methodPrefix) === 0)) {
          localStorage.removeItem(lk);
          n++;
        }
      }
    } catch (e) {}
    return n;
  };
  window.ipremCache.clearEpg = function() {
    return (window.ipremCache.invalidate('getShortEPG') || 0) +
           (window.ipremCache.invalidate('getFullEPG') || 0);
  };
  window.ipremCache.clearAll = function() {
    memCache = {};
    return window.ipremCache.invalidate('');
  };
  window.ipremCache.showSkeletonChannels = showSkeletonChannels;
  window.ipremCache.showSkeletonCards = showSkeletonCards;
})();
