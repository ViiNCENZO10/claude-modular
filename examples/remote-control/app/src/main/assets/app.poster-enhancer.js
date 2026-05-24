/* ============================================
   iPremTvOnline - TMDB Poster Auto-Enhancer

   Detecte les cards VOD/Series sans vraie affiche et remplace en
   background par le poster TMDB officiel.

   - Cache localStorage 7j (les affiches changent jamais)
   - 4 requetes TMDB max en parallele (rate-friendly)
   - Fade-in smooth quand le poster arrive
   - Nettoie le titre des marqueurs |FR| / HD / 4K / DUBLADO / etc.
   ============================================ */

(function() {
  'use strict';

  var TMDB_KEY = '4ef0d7355d9ffb5151e987764708ce96';
  var CACHE_PREFIX = 'iprem_tmdb_poster_';
  var TTL = 7 * 24 * 60 * 60 * 1000; // 7 jours
  var MAX_PARALLEL = 4;

  var queue = [];
  var inFlight = 0;
  var inProgress = {}; // dedup : meme titre en attente => on attache au meme job

  function lsGet(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      var p = JSON.parse(raw);
      if (!p || !p.t || (Date.now() - p.t) > TTL) {
        try { localStorage.removeItem(key); } catch (e) {}
        return null;
      }
      return p.d;
    } catch (e) { return null; }
  }

  function lsSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), d: val })); }
    catch (e) {
      // Quota plein : purge 25% des plus vieux
      try {
        var keys = [];
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.indexOf(CACHE_PREFIX) === 0) keys.push(k);
        }
        var entries = keys.map(function(k) {
          try { return { k: k, t: (JSON.parse(localStorage.getItem(k)) || {}).t || 0 }; }
          catch (e) { return { k: k, t: 0 }; }
        });
        entries.sort(function(a, b) { return a.t - b.t; });
        entries.slice(0, Math.ceil(entries.length / 4)).forEach(function(e) {
          try { localStorage.removeItem(e.k); } catch (err) {}
        });
        localStorage.setItem(key, JSON.stringify({ t: Date.now(), d: val }));
      } catch (e2) {}
    }
  }

  // Nettoie un titre IPTV pour TMDB
  // "|FR| Avatar 2 [4K HDR DOLBY VISION] MULTIVFF" -> "Avatar 2"
  function cleanTitle(title) {
    if (!title) return '';
    var t = String(title);
    // Supprime tags |XX|
    t = t.replace(/\|[^|]+\|/g, ' ');
    // Supprime crochets et leur contenu
    t = t.replace(/\[[^\]]*\]/g, ' ');
    // Supprime parens si elles contiennent des markers (laisse les annees)
    t = t.replace(/\(((?!\d{4}\))[^)]+)\)/g, ' ');
    // Markers qualite / langue courants
    var markers = '(4K|UHD|HDR|HDR10|HDR10\\+|DOLBY|VISION|HEVC|x265|h265|x264|h264|FHD|HD|SD|MULTI|MULTIVFF|MULTIVF|MULTIVFQ|VFF|VFQ|VFI|VOSTFR|VOSTEN|VOST|VO|VF|VFFEN|TRUEFRENCH|TRUE FRENCH|FRENCH|DUBLADO|LEGENDADO|ITALIANO|ENGLISH|PORTUGUES|ESPANOL|DEUTSCH|BLURAY|BR|WEB|WEBRIP|WEB-DL|DVDRIP|REMUX|REPACK|10bit|8bit|AC3|DTS|EAC3|DDP|DD5\\.1|5\\.1|7\\.1|2\\.0)';
    t = t.replace(new RegExp('\\b' + markers + '\\b', 'gi'), ' ');
    // Tirets/etoiles deco
    t = t.replace(/[-_•★▼◆◇■□●○♦♥♠♣]+/g, ' ');
    // Espaces multiples
    t = t.replace(/\s+/g, ' ').trim();
    return t;
  }

  // Extrait l'annee si presente "Avatar (2009)" -> 2009
  function extractYear(title) {
    var m = String(title).match(/\b(19\d{2}|20\d{2})\b/);
    return m ? m[1] : '';
  }

  function cacheKey(title, year, type) {
    var clean = (type || 'm') + '_' + title.toLowerCase().replace(/[^a-z0-9]/g, '_') + (year ? '_' + year : '');
    return CACHE_PREFIX + clean.slice(0, 90);
  }

  function applyPosterToImg(img, posterUrl) {
    if (!img || !posterUrl) return;
    if (!img.parentElement) return;
    // Si une image visible existait deja avec un src bidon (bandeau provider),
    // on swap. Sinon on cree.
    img.style.transition = 'opacity .35s';
    img.style.opacity = '0';
    var tmp = new Image();
    tmp.onload = function() {
      img.src = posterUrl;
      requestAnimationFrame(function() { img.style.opacity = '1'; });
    };
    tmp.onerror = function() { /* keep original */ };
    tmp.src = posterUrl;
  }

  // Cree ou recupere l'IMG dans une card.
  function ensureImg(card) {
    var poster = card.querySelector('.vod-poster');
    if (!poster) return null;
    var img = poster.querySelector('img');
    if (img) return img;
    // Pas d'img : cree-en une devant le placeholder
    var newImg = document.createElement('img');
    newImg.alt = '';
    newImg.loading = 'lazy';
    newImg.style.opacity = '0';
    var placeholder = poster.querySelector('.vod-poster-placeholder');
    if (placeholder) poster.insertBefore(newImg, placeholder);
    else poster.appendChild(newImg);
    return newImg;
  }

  function processQueue() {
    while (inFlight < MAX_PARALLEL && queue.length > 0) {
      var job = queue.shift();
      doFetch(job);
    }
  }

  async function doFetch(job) {
    inFlight++;
    var ck = job.cacheKey;
    try {
      var endpoint = job.type === 'tv' ? 'tv' : 'movie';
      var url = 'https://api.themoviedb.org/3/search/' + endpoint +
                '?query=' + encodeURIComponent(job.title) +
                (job.year ? (job.type === 'tv' ? '&first_air_date_year=' + job.year : '&year=' + job.year) : '') +
                '&api_key=' + TMDB_KEY + '&language=fr-FR';
      var r = await fetch(url, { mode: 'cors' });
      if (!r.ok) throw new Error('http ' + r.status);
      var data = await r.json();
      var first = data && data.results && data.results[0];
      var poster = first && first.poster_path ? 'https://image.tmdb.org/t/p/w342' + first.poster_path : '';
      // Cache meme si vide (__none__) pour eviter de re-tenter
      lsSet(ck, poster || '__none__');
      // Applique a TOUS les img qui attendaient ce titre
      if (poster) {
        (inProgress[ck] || []).forEach(function(imgEl) {
          applyPosterToImg(imgEl, poster);
        });
      }
    } catch (e) {
      // Cache un "rien trouve" pour 1h seulement (vs 7j succes)
      lsSet(ck, '__none__');
    } finally {
      delete inProgress[ck];
      inFlight--;
      processQueue();
    }
  }

  function enhance(imgEl, title, year, type) {
    if (!imgEl || !title) return;
    var clean = cleanTitle(title);
    if (!clean || clean.length < 2) return;
    var yr = year || extractYear(title);
    var ck = cacheKey(clean, yr, type);

    // 1. Cache hit
    var cached = lsGet(ck);
    if (cached) {
      if (cached !== '__none__') applyPosterToImg(imgEl, cached);
      return;
    }

    // 2. Job deja en cours pour ce titre : on s'attache
    if (inProgress[ck]) {
      inProgress[ck].push(imgEl);
      return;
    }
    inProgress[ck] = [imgEl];

    // 3. Enqueue
    queue.push({ cacheKey: ck, title: clean, year: yr, type: type || 'movie' });
    processQueue();
  }

  // ===== Auto-hook : MutationObserver sur les grilles VOD/Series =====
  function hookCard(card, isSeries) {
    var img = ensureImg(card);
    if (!img) return;
    var titleEl = card.querySelector('.vod-card-title');
    var yearEl = card.querySelector('.vod-card-year');
    if (!titleEl) return;
    enhance(img, titleEl.textContent, yearEl ? yearEl.textContent.trim() : '', isSeries ? 'tv' : 'movie');
  }

  function hookGrid(grid, isSeries) {
    if (!grid) return;
    // Process cards already there
    Array.prototype.slice.call(grid.querySelectorAll('.vod-card')).forEach(function(c) {
      hookCard(c, isSeries);
    });
    // Watch for new ones
    var obs = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        Array.prototype.slice.call(m.addedNodes).forEach(function(node) {
          if (node.nodeType !== 1) return;
          if (node.classList && node.classList.contains('vod-card')) hookCard(node, isSeries);
          else if (node.querySelectorAll) {
            Array.prototype.slice.call(node.querySelectorAll('.vod-card')).forEach(function(c) {
              hookCard(c, isSeries);
            });
          }
        });
      });
    });
    obs.observe(grid, { childList: true, subtree: false });
  }

  window.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
      hookGrid(document.getElementById('vodGrid'), false);
      hookGrid(document.getElementById('seriesGrid'), true);
    }, 1500);
  });

  // Public API
  window.ipremPoster = {
    enhance: enhance,
    cleanTitle: cleanTitle
  };
})();
