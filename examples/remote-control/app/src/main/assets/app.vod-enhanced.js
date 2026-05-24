/* ============================================
   iPremTvOnline - VOD/Series UI enhancement
   - Bigger posters
   - Slide-in animation
   - Smooth vertical scroll
   - Rich detail modal (TMDB-style)
   - Score badge, plot, cast, etc.
   ============================================ */

(function() {
  'use strict';

  function injectVodStyles() {
    if (document.getElementById('iprem-vod-styles')) return;
    var s = document.createElement('style');
    s.id = 'iprem-vod-styles';
    s.textContent =
      // Grid layout: bigger posters
      '.vod-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:18px;padding:14px 20px;overflow-y:auto;align-content:start;animation:vodSlideIn .35s ease-out}' +
      '@keyframes vodSlideIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}' +
      // Each poster card
      '.vod-grid > *{aspect-ratio:2/3;border-radius:10px;overflow:hidden;background:#1e293b;position:relative;cursor:pointer;transition:transform .15s ease-out,box-shadow .15s ease-out;outline:none}' +
      '.vod-grid > *:focus, .vod-grid > *:hover{transform:scale(1.06);box-shadow:0 8px 24px rgba(0,0,0,.6);z-index:2}' +
      '.vod-grid > * img{width:100%;height:100%;object-fit:cover;display:block;background:#0f172a}' +
      '.vod-grid > * .vod-item-title{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top,rgba(0,0,0,.92) 30%,transparent);color:#fff;padding:24px 10px 8px 10px;font-size:13px;font-weight:600;line-height:1.2;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
      '.vod-grid > * .vod-item-rating{position:absolute;top:8px;right:8px;background:rgba(245,158,11,.95);color:#000;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700;display:flex;align-items:center;gap:3px}' +
      // Make vod-content scrollable
      '.vod-content{display:flex;flex-direction:column;flex:1;overflow:hidden}' +
      '.vod-grid-header{padding:8px 20px;border-bottom:1px solid rgba(255,255,255,.05);flex-shrink:0}' +
      // Category list scrollable
      '.category-sidebar{display:flex;flex-direction:column;width:240px;flex-shrink:0;background:#0f172a;border-right:1px solid rgba(255,255,255,.05)}' +
      '.sidebar-header{padding:12px 14px;font-weight:600;font-size:13px;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;flex-shrink:0;border-bottom:1px solid rgba(255,255,255,.05)}' +
      '.category-list{list-style:none;margin:0;padding:8px 6px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:2px}' +
      '.category-list li{padding:10px 14px;border-radius:8px;cursor:pointer;color:#cbd5e1;font-size:14px;transition:background .12s;outline:none}' +
      '.category-list li:focus, .category-list li:hover{background:rgba(59,130,246,.18);color:#fff}' +
      '.category-list li.active{background:#3b82f6;color:#fff;font-weight:600}' +
      // Detail modal - TMDB style
      '.vod-detail{max-width:1100px;width:96vw;max-height:92vh;overflow-y:auto;background:#0f172a;border-radius:14px;padding:0;position:relative}' +
      '.vod-detail .vod-detail-backdrop{height:280px;background-size:cover;background-position:center top;background-color:#1e293b;position:relative}' +
      '.vod-detail .vod-detail-backdrop::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,#0f172a 0%,transparent 60%)}' +
      '.vod-detail .vod-detail-layout{display:grid;grid-template-columns:240px 1fr;gap:24px;padding:0 28px 28px 28px;margin-top:-120px;position:relative;z-index:1}' +
      '.vod-detail-poster{aspect-ratio:2/3;border-radius:10px;background-size:cover;background-position:center;background-color:#1e293b;box-shadow:0 12px 30px rgba(0,0,0,.6)}' +
      '.vod-detail-info h2{margin:0 0 12px 0;font-size:28px;color:#fff;line-height:1.15;font-weight:700}' +
      '.vod-detail-meta{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}' +
      '.vod-detail-meta .badge{background:rgba(255,255,255,.08);color:#e2e8f0;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:500}' +
      '.vod-detail-meta .badge-accent{background:#f59e0b;color:#000;font-weight:700}' +
      '.vod-detail-meta .badge-tmdb{background:#01b4e4;color:#fff}' +
      '.vod-detail-plot{color:#cbd5e1;font-size:14px;line-height:1.55;margin:0 0 16px 0;max-height:none}' +
      '.vod-detail-cast{color:#94a3b8;font-size:13px;margin-bottom:6px}' +
      '.vod-detail-cast strong{color:#fff;font-weight:600}' +
      '.vod-detail-actions{display:flex;gap:10px;margin-top:18px;flex-wrap:wrap}' +
      '.vod-detail-actions .btn-lg{padding:12px 24px;font-size:15px;font-weight:600;display:flex;align-items:center;gap:8px}' +
      '.vod-detail-close{position:absolute;top:14px;right:14px;background:rgba(0,0,0,.6);border:none;color:#fff;width:38px;height:38px;border-radius:50%;font-size:22px;cursor:pointer;z-index:2}' +
      '.vod-detail-close:hover, .vod-detail-close:focus{background:rgba(0,0,0,.9);outline:2px solid #60a5fa}' +
      // Score visual (circle)
      '.score-circle{display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:50%;background:conic-gradient(#22c55e 0% var(--score-pct,70%),#334155 var(--score-pct,70%) 100%);color:#fff;font-weight:700;font-size:14px;position:relative}' +
      '.score-circle::before{content:"";position:absolute;inset:5px;background:#0f172a;border-radius:50%;z-index:0}' +
      '.score-circle span{position:relative;z-index:1}' +
      // Mobile / smaller screens
      '@media (max-width:960px){.vod-detail .vod-detail-layout{grid-template-columns:160px 1fr;gap:18px}.vod-detail-info h2{font-size:22px}}' +
      // ===== Cinematic full-screen detail =====
      '.cinematic-detail{position:fixed;inset:0;z-index:1000;color:#fff;animation:cinFadeIn .35s ease-out;overflow:hidden}' +
      '@keyframes cinFadeIn{from{opacity:0}to{opacity:1}}' +
      '.cin-backdrop{position:absolute;inset:0;background-size:cover;background-position:center right;background-color:#0f172a;background-repeat:no-repeat}' +
      '.cin-gradient{position:absolute;inset:0;background:linear-gradient(90deg,rgba(15,23,42,.95) 0%,rgba(15,23,42,.85) 40%,rgba(15,23,42,.4) 65%,transparent 95%),linear-gradient(180deg,rgba(15,23,42,.4) 0%,transparent 30%,transparent 70%,rgba(15,23,42,.9) 100%);pointer-events:none}' +
      '.cin-close{position:absolute;top:18px;right:22px;background:rgba(0,0,0,.5);border:none;color:#fff;width:42px;height:42px;border-radius:50%;font-size:28px;line-height:1;cursor:pointer;z-index:5;outline:none}' +
      '.cin-close:focus, .cin-close:hover{background:rgba(0,0,0,.85);outline:2px solid #60a5fa}' +
      '.cin-brand{position:absolute;bottom:22px;right:28px;font-size:13px;color:rgba(255,255,255,.55);font-weight:500;z-index:5}' +
      '.cin-content{position:absolute;left:60px;top:50%;transform:translateY(-50%);max-width:55%;z-index:4;padding-right:30px}' +
      '.cin-title{font-size:54px;font-weight:900;margin:0 0 14px 0;line-height:.95;letter-spacing:-.5px;text-shadow:0 4px 16px rgba(0,0,0,.7);font-family:Impact,"Arial Black",sans-serif}' +
      '.cin-meta-line{display:flex;align-items:center;gap:10px;margin-bottom:10px;font-size:15px;color:rgba(255,255,255,.85)}' +
      '.cin-meta-year{font-weight:600;color:#fff}' +
      '.cin-dot{color:rgba(255,255,255,.5);font-size:18px;line-height:1}' +
      '.cin-badges{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px}' +
      '.cin-badge{padding:4px 10px;border-radius:6px;font-size:13px;font-weight:700}' +
      '.cin-badge-age{background:rgba(34,197,94,.2);color:#86efac;border:1px solid #22c55e}' +
      '.cin-badge-tmdb{background:#22c55e;color:#000}' +
      '.cin-badge-duration{color:rgba(255,255,255,.9);background:rgba(255,255,255,.1)}' +
      '.cin-added{font-size:14px;color:rgba(255,255,255,.85);margin-bottom:10px}' +
      '.cin-added strong{color:#fff;font-weight:600}' +
      '.cin-plot{font-size:15px;line-height:1.55;color:rgba(255,255,255,.95);margin:0 0 12px 0;max-height:115px;overflow:hidden;text-shadow:0 2px 8px rgba(0,0,0,.5)}' +
      '.cin-cast{font-size:13px;color:rgba(255,255,255,.7);margin-bottom:20px}' +
      '.cin-cast strong{color:#fff}' +
      '.cin-actions{display:flex;gap:12px;align-items:center;margin-bottom:24px}' +
      '.cin-btn-watch{display:inline-flex;align-items:center;gap:10px;padding:14px 38px;background:#fff;color:#000;border:none;border-radius:50px;font-size:17px;font-weight:700;cursor:pointer;outline:none;transition:transform .12s,box-shadow .12s}' +
      '.cin-btn-watch:focus, .cin-btn-watch:hover{transform:scale(1.04);box-shadow:0 8px 24px rgba(255,255,255,.3)}' +
      '.cin-btn-fav{width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,.18);border:2px solid rgba(255,255,255,.4);color:#fff;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;outline:none;transition:all .12s}' +
      '.cin-btn-fav:focus, .cin-btn-fav:hover{background:rgba(255,255,255,.3);border-color:#fff}' +
      '.cin-btn-fav.active{background:#f59e0b;border-color:#f59e0b;color:#000}' +
      '.cin-btn-fav.active svg{fill:#000}' +
      '.cin-trailer-row{display:flex;flex-direction:column;gap:8px;margin-top:8px}' +
      '.cin-trailer-label{font-size:13px;font-weight:600;color:#fff;letter-spacing:.5px}' +
      '.cin-trailer-card{position:relative;width:240px;aspect-ratio:16/9;border-radius:8px;overflow:hidden;cursor:pointer;background:#1e293b;outline:none}' +
      '.cin-trailer-card:focus, .cin-trailer-card:hover{outline:2px solid #60a5fa}' +
      '.cin-trailer-card img{width:100%;height:100%;object-fit:cover;display:block}' +
      '.cin-trailer-play{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:46px;height:46px;border-radius:50%;background:rgba(255,255,255,.85);color:#000;display:flex;align-items:center;justify-content:center;font-size:22px}' +
      // Smaller screens
      '@media (max-width:900px){.cin-title{font-size:38px}.cin-content{left:30px;max-width:75%}}';
    document.head.appendChild(s);
  }


  // Enhanced render of a VOD item card
  function renderVodCard(vod) {
    var poster = vod.stream_icon || vod.cover || '';
    var rating = parseFloat(vod.rating || vod.rating_5based || 0);
    var ratingDisplay = rating > 0 ? rating.toFixed(1) : '';
    var html =
      (poster ? '<img loading="lazy" src="' + escapeAttr(poster) + '" alt="" onerror="this.style.display=\'none\'">' : '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#475569;font-size:13px">' + escapeText(vod.name || 'No image') + '</div>') +
      (ratingDisplay ? '<div class="vod-item-rating">★ ' + ratingDisplay + '</div>' : '') +
      '<div class="vod-item-title">' + escapeText(vod.name || 'Unknown') + '</div>';
    return html;
  }

  function escapeAttr(s) { return String(s).replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
  function escapeText(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }


  // Patch the original renderVodGrid (if it exists) to use enhanced cards
  function patchVodRenderer() {
    if (typeof window.renderVodGrid !== 'function') return;
    var orig = window.renderVodGrid;
    window.renderVodGrid = function() {
      var r = orig.apply(this, arguments);
      try {
        var grid = document.getElementById('vodGrid');
        if (!grid) return r;
        // Replace each child with enhanced markup
        var items = Array.from(grid.children);
        var streams = AppState.vodStreams || [];
        items.forEach(function(item, idx) {
          var vod = streams[idx];
          if (!vod) return;
          item.innerHTML = renderVodCard(vod);
          item.setAttribute('tabindex', '0');
        });
      } catch (e) { console.warn('vod render patch failed', e); }
      return r;
    };
  }

  function patchSeriesRenderer() {
    if (typeof window.renderSeriesGrid !== 'function') return;
    var orig = window.renderSeriesGrid;
    window.renderSeriesGrid = function() {
      var r = orig.apply(this, arguments);
      try {
        var grid = document.getElementById('seriesGrid');
        if (!grid) return r;
        var items = Array.from(grid.children);
        var list = AppState.seriesList || [];
        items.forEach(function(item, idx) {
          var s = list[idx];
          if (!s) return;
          item.innerHTML = renderVodCard({ stream_icon: s.cover || s.stream_icon, name: s.name, rating: s.rating });
          item.setAttribute('tabindex', '0');
        });
      } catch (e) { console.warn('series render patch failed', e); }
      return r;
    };
  }


  // Enhanced detail - replaces modal with cinematic full-screen overlay
  function patchShowVodDetail() {
    if (typeof window.showVodDetail !== 'function') return;
    var orig = window.showVodDetail;
    window.showVodDetail = async function(vod) {
      // Hide the original modal — we replace it entirely
      try {
        var origModal = document.getElementById('vodDetailModal');
        if (origModal) origModal.style.display = 'none';
      } catch (e) {}
      openCinematicDetail(vod);
    };
  }

  function relativeAdded(timestamp) {
    if (!timestamp) return '';
    var ts = parseInt(timestamp, 10);
    if (isNaN(ts) || ts === 0) return '';
    if (ts < 10000000000) ts = ts * 1000; // seconds → ms
    var diff = Date.now() - ts;
    var d = Math.floor(diff / 86400000);
    if (d < 0) return '';
    if (d === 0) return "Aujourd'hui";
    if (d === 1) return 'Hier';
    if (d < 7) return 'Il y a ' + d + ' jours';
    if (d < 30) return 'Il y a ' + Math.floor(d / 7) + ' semaine' + (Math.floor(d / 7) > 1 ? 's' : '');
    if (d < 365) return 'Il y a ' + Math.floor(d / 30) + ' mois';
    return 'Il y a ' + Math.floor(d / 365) + ' an' + (Math.floor(d / 365) > 1 ? 's' : '');
  }

  function scoreColor(pct) {
    if (pct >= 70) return '#22c55e';
    if (pct >= 50) return '#84cc16';
    if (pct >= 30) return '#f59e0b';
    return '#ef4444';
  }

  async function openCinematicDetail(vod) {
    // Remove any existing cinematic overlay
    var existing = document.getElementById('cinematicDetail');
    if (existing) existing.remove();

    // Build skeleton immediately for instant feedback
    var overlay = document.createElement('div');
    overlay.id = 'cinematicDetail';
    overlay.className = 'cinematic-detail';
    overlay.innerHTML =
      '<div class="cin-backdrop" id="cinBackdrop"></div>' +
      '<div class="cin-gradient"></div>' +
      '<button class="cin-close focusable" id="cinClose" tabindex="0" title="Fermer">&times;</button>' +
      '<div class="cin-brand">↔ iPremTvOnline</div>' +
      '<div class="cin-content">' +
        '<h1 class="cin-title" id="cinTitle">' + escapeText(vod.name || '') + '</h1>' +
        '<div class="cin-meta-line">' +
          '<span id="cinYear" class="cin-meta-year">—</span>' +
          '<span class="cin-dot">•</span>' +
          '<span id="cinGenre" class="cin-meta-genre">—</span>' +
        '</div>' +
        '<div class="cin-badges" id="cinBadges"></div>' +
        '<div class="cin-added" id="cinAdded"></div>' +
        '<p class="cin-plot" id="cinPlot">Chargement...</p>' +
        '<div class="cin-cast" id="cinCast"></div>' +
        '<div class="cin-actions">' +
          '<button class="cin-btn-watch focusable" id="cinBtnWatch" tabindex="0" autofocus>' +
            '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20"/></svg>' +
            '<span>Regarder</span>' +
          '</button>' +
          '<button class="cin-btn-fav focusable" id="cinBtnFav" tabindex="0" title="Favori">' +
            '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="cin-trailer-row" id="cinTrailerRow" style="display:none">' +
          '<span class="cin-trailer-label">Bande-annonce</span>' +
          '<div class="cin-trailer-card" id="cinTrailerCard"></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    // Close handlers
    var close = function() {
      try { overlay.remove(); } catch (e) {}
    };
    overlay.querySelector('#cinClose').addEventListener('click', close);
    // Click on backdrop closes
    overlay.querySelector('#cinBackdrop').addEventListener('click', function(e) {
      if (e.target.id === 'cinBackdrop') close();
    });

    // Watch button → play
    overlay.querySelector('#cinBtnWatch').addEventListener('click', function() {
      try {
        var ext = vod.container_extension || 'mp4';
        var url = AppState.api.vodUrl(vod.stream_id, ext);
        close();
        if (typeof window.startPlayer === 'function') {
          window.startPlayer(url, vod.name, '', 'vod', vod);
        }
      } catch (e) { showToast && showToast('Lecture impossible'); }
    });

    // Favorite button
    var favBtn = overlay.querySelector('#cinBtnFav');
    var refreshFav = function() {
      try {
        if (window.iprem && window.iprem.watchlist) {
          var inList = window.iprem.watchlist.has({ stream_id: vod.stream_id, type: 'vod' });
          favBtn.classList.toggle('active', !!inList);
        }
      } catch (e) {}
    };
    refreshFav();
    favBtn.addEventListener('click', function() {
      try {
        if (window.iprem && window.iprem.watchlist) {
          vod.type = 'vod';
          window.iprem.watchlist.toggle(vod);
          refreshFav();
        }
      } catch (e) {}
    });

    // Focus Watch button
    setTimeout(function() {
      var w = overlay.querySelector('#cinBtnWatch');
      if (w) w.focus();
    }, 100);

    // Now fetch detailed info (async)
    var info = null;
    try {
      if (AppState.api && AppState.api.getVodInfo) {
        info = await AppState.api.getVodInfo(vod.stream_id);
      }
    } catch (e) {}
    var movie = (info && info.info) ? info.info : {};
    var moviedata = (info && info.movie_data) ? info.movie_data : vod;

    var backdrop = (movie.backdrop_path && movie.backdrop_path[0]) ? movie.backdrop_path[0] : (movie.movie_image || vod.stream_icon || '');
    var poster = movie.cover_big || movie.movie_image || vod.stream_icon || '';

    // Update backdrop
    var bgUrl = backdrop || poster;
    if (bgUrl) {
      overlay.querySelector('#cinBackdrop').style.backgroundImage = "url('" + bgUrl.replace(/'/g, '%27') + "')";
    }

    // Title
    overlay.querySelector('#cinTitle').textContent = (movie.name || movie.o_name || vod.name || 'Sans titre').toUpperCase();

    // Year & Genre
    var year = movie.releasedate ? String(movie.releasedate).substring(0, 4) : (movie.year || '');
    var genre = movie.genre || '';
    overlay.querySelector('#cinYear').textContent = year || '—';
    overlay.querySelector('#cinGenre').textContent = genre || '—';

    // Badges
    var rating = parseFloat(movie.rating || movie.rating_5based || vod.rating || 0);
    var ratingPct = 0;
    if (rating > 0) ratingPct = (rating > 10 ? rating : rating * 10);
    ratingPct = Math.min(100, Math.max(0, ratingPct));

    var duration = movie.duration || '';
    var durSec = parseInt(movie.duration_secs || 0, 10);
    if (!duration && durSec > 0) {
      var h = Math.floor(durSec / 3600);
      var m = Math.floor((durSec % 3600) / 60);
      duration = (h > 0 ? h + 'h ' : '') + m + 'm';
    }

    var ageRating = movie.rating_mpaa || movie.age || '';
    var tmdbId = movie.tmdb_id || movie.tmdb || '';

    var badges = '';
    if (ageRating) badges += '<span class="cin-badge cin-badge-age">' + escapeText(String(ageRating)) + '</span>';
    if (ratingPct > 0) badges += '<span class="cin-badge cin-badge-tmdb" style="background:' + scoreColor(ratingPct) + '">TMDb ' + Math.round(ratingPct) + '%</span>';
    if (duration) badges += '<span class="cin-badge cin-badge-duration">' + escapeText(duration) + '</span>';
    overlay.querySelector('#cinBadges').innerHTML = badges;

    // Date added
    var added = moviedata.added || movie.added || vod.added;
    var addedTxt = relativeAdded(added);
    if (addedTxt) {
      overlay.querySelector('#cinAdded').innerHTML = '<strong>Date ajoutée :</strong> ' + addedTxt;
    }

    // Plot
    overlay.querySelector('#cinPlot').textContent = movie.plot || movie.description || movie.overview || vod.description || '';

    // Cast / Director
    var castParts = [];
    if (movie.director) castParts.push('<strong>Réal:</strong> ' + escapeText(movie.director));
    if (movie.cast || movie.actors) castParts.push('<strong>Avec:</strong> ' + escapeText(movie.cast || movie.actors));
    overlay.querySelector('#cinCast').innerHTML = castParts.join(' · ');

    // Trailer
    var youtube = movie.youtube_trailer || '';
    if (youtube) {
      var videoId = youtube;
      var m = String(youtube).match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
      if (m) videoId = m[1];
      var thumb = 'https://img.youtube.com/vi/' + videoId + '/mqdefault.jpg';
      overlay.querySelector('#cinTrailerRow').style.display = '';
      overlay.querySelector('#cinTrailerCard').innerHTML =
        '<img src="' + thumb + '" alt="Bande-annonce">' +
        '<span class="cin-trailer-play">▶</span>';
    }

    if (tmdbId && (!ratingPct || ratingPct === 0)) {
      // Still show TMDB badge even without score
      var bEl = overlay.querySelector('#cinBadges');
      if (bEl && !bEl.querySelector('.cin-badge-tmdb')) {
        bEl.insertAdjacentHTML('beforeend', '<span class="cin-badge cin-badge-tmdb" style="background:#22c55e">TMDb ' + tmdbId + '</span>');
      }
    }
  }


  // Bootstrap
  window.addEventListener('DOMContentLoaded', function() {
    injectVodStyles();
    setTimeout(function() {
      patchVodRenderer();
      patchSeriesRenderer();
      patchShowVodDetail();
    }, 800);
  });

})();
