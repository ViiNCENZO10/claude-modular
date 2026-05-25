/* ============================================
   iPremTvOnline - Continue Watching + Watchlist
   - Saves playback position on VOD/series
   - Resumes where you left off
   - Watchlist (à voir) for VOD/series
   ============================================ */

(function() {
  'use strict';

  var KEY_PROGRESS = 'iprem_progress';
  var KEY_WATCHLIST = 'iprem_watchlist';

  // ====== Progress storage ======
  function getProgress() {
    try { return JSON.parse(localStorage.getItem(KEY_PROGRESS) || '{}'); } catch (e) { return {}; }
  }
  function setProgress(map) {
    try { localStorage.setItem(KEY_PROGRESS, JSON.stringify(map)); } catch (e) {}
  }
  function saveProgress(id, type, position, duration, name) {
    var map = getProgress();
    map[id] = {
      id: id,
      type: type,
      position: Math.floor(position),
      duration: Math.floor(duration),
      name: name,
      updatedAt: Date.now()
    };
    setProgress(map);
  }
  function clearProgress(id) {
    var map = getProgress();
    delete map[id];
    setProgress(map);
  }
  function getContinueList(maxItems) {
    var map = getProgress();
    var arr = Object.values(map).filter(function(e) {
      // Only show items watched <90% and within last 30 days
      var pct = e.duration > 0 ? e.position / e.duration : 0;
      var age = Date.now() - (e.updatedAt || 0);
      return pct > 0.02 && pct < 0.92 && age < 30 * 24 * 3600 * 1000;
    });
    arr.sort(function(a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
    return arr.slice(0, maxItems || 20);
  }


  // ====== Watchlist ======
  function getWatchlist() {
    try { return JSON.parse(localStorage.getItem(KEY_WATCHLIST) || '{}'); } catch (e) { return {}; }
  }
  function setWatchlist(map) {
    try { localStorage.setItem(KEY_WATCHLIST, JSON.stringify(map)); } catch (e) {}
  }
  function toggleWatchlist(item) {
    if (!item || !item.stream_id) return false;
    var key = (item.type || 'vod') + '_' + item.stream_id;
    var map = getWatchlist();
    if (map[key]) {
      delete map[key];
      setWatchlist(map);
      return false;
    } else {
      map[key] = {
        id: item.stream_id,
        type: item.type || 'vod',
        name: item.name,
        cover: item.stream_icon || item.cover || '',
        rating: item.rating,
        addedAt: Date.now()
      };
      setWatchlist(map);
      return true;
    }
  }
  function isInWatchlist(item) {
    if (!item || !item.stream_id) return false;
    var map = getWatchlist();
    return !!map[(item.type || 'vod') + '_' + item.stream_id];
  }


  // ====== Expose ======
  window.iprem = window.iprem || {};
  window.iprem.progress = {
    save: saveProgress,
    clear: clearProgress,
    list: getContinueList,
    get: function(id) { return getProgress()[id]; }
  };
  window.iprem.watchlist = {
    toggle: toggleWatchlist,
    has: isInWatchlist,
    list: function() { return Object.values(getWatchlist()).sort(function(a, b) { return b.addedAt - a.addedAt; }); }
  };


  // ====== Track position on player while playing ======
  // We piggyback on the video element + the native bridge
  var positionInterval = null;
  function trackPosition() {
    var v = document.getElementById('videoPlayer');
    if (!v) return;
    if (positionInterval) clearInterval(positionInterval);
    positionInterval = setInterval(function() {
      try {
        if (v.duration > 0 && v.currentTime > 5 && AppState && AppState.selectedVod) {
          saveProgress(
            'vod_' + AppState.selectedVod.stream_id,
            'vod',
            v.currentTime,
            v.duration,
            AppState.selectedVod.name
          );
        }
      } catch (e) {}
    }, 5000);
  }


  // ====== Add Continue Watching section on Home ======
  function addContinueWatchingSection() {
    var home = document.getElementById('home');
    if (!home) return;
    if (document.getElementById('continueWatchingSection')) return;

    var list = getContinueList(12);
    if (list.length === 0) return;

    var content = home.querySelector('.home-content');
    if (!content) return;

    var section = document.createElement('div');
    section.id = 'continueWatchingSection';
    section.className = 'continue-watching';
    section.innerHTML =
      '<h3 class="cw-title">📺 Continuer à regarder</h3>' +
      '<div class="cw-row" id="cwRow"></div>';

    var navGrid = content.querySelector('.nav-grid');
    if (navGrid) content.insertBefore(section, navGrid);
    else content.appendChild(section);

    var row = section.querySelector('#cwRow');
    list.forEach(function(entry) {
      var card = document.createElement('div');
      card.className = 'cw-card focusable';
      card.tabIndex = 0;
      var pct = entry.duration > 0 ? (entry.position / entry.duration * 100) : 0;
      card.innerHTML =
        '<div class="cw-card-name">' + escapeText(entry.name || 'Untitled') + '</div>' +
        '<div class="cw-progress"><div class="cw-progress-fill" style="width:' + Math.min(100, pct).toFixed(0) + '%"></div></div>' +
        '<div class="cw-card-time">' + formatTime(entry.position) + ' / ' + formatTime(entry.duration) + '</div>';
      card.addEventListener('click', function() { resumePlayback(entry); });
      card.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') resumePlayback(entry);
      });
      row.appendChild(card);
    });
  }

  // Reprend un film/serie a sa derniere position connue via le bridge natif
  async function resumePlayback(entry) {
    if (!entry || !entry.id) return;
    showToast && showToast('Reprise : ' + (entry.name || ''));
    var rawId = String(entry.id).replace(/^(vod|series|live)_/, '');
    var type = entry.type || 'vod';
    try {
      if (!window.AppState || !AppState.api) {
        showToast && showToast('Connexion requise');
        return;
      }
      var url = '';
      if (type === 'vod' && typeof AppState.api.vodUrl === 'function') {
        // Recupere container_extension si possible (cache)
        var ext = 'mp4';
        try {
          var info = await AppState.api.getVodInfo(rawId);
          if (info && info.movie_data && info.movie_data.container_extension) {
            ext = info.movie_data.container_extension;
          }
        } catch (e) {}
        url = AppState.api.vodUrl(rawId, ext);
      } else if (type === 'series') {
        // Pour series, l'entry.id devrait etre serie_episodeId mais le resume
        // exact d'un episode demande plus de wiring - reprendre la fiche serie pour l'instant
        showToast && showToast('Ouverture de la série...');
        return;
      } else {
        return;
      }
      if (!url) return;
      if (window.AndroidBridge && typeof window.AndroidBridge.playNativeWithResume === 'function') {
        window.AndroidBridge.playNativeWithResume(
          url, entry.name || '', false,
          '', '',           // cookies, userAgent
          '', -1, '', '',   // channelsJson, currentIdx, groupsJson, altExts
          'vod_' + rawId, 'vod',
          Math.floor(entry.position || 0)
        );
      } else if (typeof window.startPlayer === 'function') {
        // Fallback : pas de resume position
        window.startPlayer(url, entry.name, '', 'vod', { stream_id: rawId });
      }
    } catch (e) {
      showToast && showToast('Erreur reprise: ' + e.message);
    }
  }

  function formatTime(secs) {
    secs = Math.floor(secs || 0);
    var h = Math.floor(secs / 3600);
    var m = Math.floor((secs % 3600) / 60);
    var s = secs % 60;
    if (h > 0) return h + 'h' + (m < 10 ? '0' : '') + m;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }
  function escapeText(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }


  // ====== Add ❤ Watchlist button to VOD detail modal ======
  function addWatchlistButton() {
    var modal = document.getElementById('vodDetailModal');
    if (!modal) return;
    if (modal.querySelector('#btnWatchlist')) return;
    var actions = modal.querySelector('.vod-detail-actions');
    if (!actions) return;
    var b = document.createElement('button');
    b.id = 'btnWatchlist';
    b.className = 'btn btn-secondary focusable';
    b.tabIndex = 0;
    var current = AppState.selectedVod;
    if (current) current.type = 'vod';
    b.textContent = (current && isInWatchlist(current)) ? '★ Dans la liste' : '☆ Ajouter à ma liste';
    b.addEventListener('click', function() {
      if (!current) return;
      var added = toggleWatchlist(current);
      b.textContent = added ? '★ Dans la liste' : '☆ Ajouter à ma liste';
      showToast && showToast(added ? 'Ajouté à ta liste' : 'Retiré de la liste');
    });
    actions.appendChild(b);
  }


  // ====== Styles ======
  function injectStyles() {
    if (document.getElementById('iprem-cw-styles')) return;
    var s = document.createElement('style');
    s.id = 'iprem-cw-styles';
    s.textContent =
      '.continue-watching{margin-bottom:24px}' +
      '.cw-title{color:#fff;font-size:18px;font-weight:600;margin:0 0 10px 0}' +
      '.cw-row{display:flex;gap:12px;overflow-x:auto;padding-bottom:8px}' +
      '.cw-card{flex-shrink:0;width:220px;padding:12px 14px;background:#1e293b;border-radius:10px;cursor:pointer;outline:none;transition:transform .12s}' +
      '.cw-card:focus, .cw-card:hover{background:#334155;transform:translateY(-2px)}' +
      '.cw-card-name{color:#fff;font-size:13px;font-weight:600;margin-bottom:8px;line-height:1.2;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical}' +
      '.cw-progress{height:4px;background:#0f172a;border-radius:2px;overflow:hidden;margin-bottom:6px}' +
      '.cw-progress-fill{height:100%;background:linear-gradient(90deg,#3b82f6,#60a5fa);border-radius:2px}' +
      '.cw-card-time{color:#94a3b8;font-size:11px;font-family:monospace}';
    document.head.appendChild(s);
  }


  // ====== Bootstrap ======
  window.addEventListener('DOMContentLoaded', function() {
    injectStyles();

    setTimeout(function() {
      // Hook showScreen to refresh home section
      if (typeof window.showScreen === 'function') {
        var orig = window.showScreen;
        window.showScreen = function(id) {
          var r = orig.apply(this, arguments);
          if (id === 'home') setTimeout(addContinueWatchingSection, 200);
          return r;
        };
      }

      // Hook showVodDetail to add Watchlist button
      if (typeof window.showVodDetail === 'function') {
        var origShow = window.showVodDetail;
        window.showVodDetail = function() {
          origShow.apply(this, arguments);
          setTimeout(addWatchlistButton, 200);
        };
      }

      // Start tracking video player position
      trackPosition();
    }, 1000);
  });

})();
