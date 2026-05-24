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
      '@media (max-width:960px){.vod-detail .vod-detail-layout{grid-template-columns:160px 1fr;gap:18px}.vod-detail-info h2{font-size:22px}}';
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


  // Enhanced detail modal - shows backdrop, score circle, full info
  function patchShowVodDetail() {
    if (typeof window.showVodDetail !== 'function') return;
    var orig = window.showVodDetail;
    window.showVodDetail = async function(vod) {
      orig.apply(this, arguments);
      // After original runs, enhance the modal
      setTimeout(async function() {
        try { await enhanceVodModal(vod); } catch (e) { console.warn(e); }
      }, 100);
    };
  }

  async function enhanceVodModal(vod) {
    var modal = document.getElementById('vodDetailModal');
    if (!modal) return;

    var info = null;
    try {
      if (AppState.api && AppState.api.getVodInfo) {
        info = await AppState.api.getVodInfo(vod.stream_id);
      }
    } catch (e) {}
    var movie = (info && info.info) ? info.info : {};
    var moviedata = (info && info.movie_data) ? info.movie_data : vod;

    // Backdrop
    var backdrop = movie.backdrop_path && movie.backdrop_path[0] ? movie.backdrop_path[0] : (movie.movie_image || vod.stream_icon || '');
    var poster = movie.cover_big || movie.movie_image || vod.stream_icon || '';

    var layout = modal.querySelector('.vod-detail-layout');
    if (!layout) return;

    // Insert backdrop element if missing
    var backdropEl = modal.querySelector('.vod-detail-backdrop');
    if (!backdropEl) {
      backdropEl = document.createElement('div');
      backdropEl.className = 'vod-detail-backdrop';
      layout.parentNode.insertBefore(backdropEl, layout);
    }
    if (backdrop) backdropEl.style.backgroundImage = 'url(' + JSON.stringify(backdrop).replace(/^"|"$/g, '') + ')';

    // Poster
    var posterEl = modal.querySelector('.vod-detail-poster');
    if (posterEl && poster) posterEl.style.backgroundImage = 'url(' + JSON.stringify(poster).replace(/^"|"$/g, '') + ')';

    // Title
    var titleEl = document.getElementById('vodDetailTitle');
    if (titleEl) titleEl.textContent = movie.name || movie.o_name || vod.name || 'Unknown';

    // Meta badges
    var year = movie.releasedate ? String(movie.releasedate).substring(0, 4) : (movie.year || '');
    var rating = parseFloat(movie.rating || movie.rating_5based || vod.rating || 0);
    var duration = movie.duration || (movie.duration_secs ? Math.round(movie.duration_secs / 60) + ' min' : '');
    var genre = movie.genre || '';
    var tmdbId = movie.tmdb_id || movie.tmdb || '';

    var yearEl = document.getElementById('vodDetailYear');
    if (yearEl) yearEl.textContent = year || '—';
    var durEl = document.getElementById('vodDetailDuration');
    if (durEl) durEl.textContent = duration || '—';
    var genreEl = document.getElementById('vodDetailGenre');
    if (genreEl) genreEl.textContent = genre || '—';

    var ratingEl = document.getElementById('vodDetailRating');
    if (ratingEl) {
      if (rating > 0) {
        var pct = Math.min(100, Math.max(0, rating * 10));
        ratingEl.innerHTML = '<span class="score-circle" style="--score-pct:' + pct + '%"><span>' + rating.toFixed(1) + '</span></span>';
      } else {
        ratingEl.textContent = '—';
      }
    }

    // TMDB badge
    var metaEl = modal.querySelector('.vod-detail-meta');
    if (metaEl && tmdbId) {
      // Avoid duplicate
      if (!metaEl.querySelector('.badge-tmdb')) {
        var tmdbBadge = document.createElement('span');
        tmdbBadge.className = 'badge badge-tmdb';
        tmdbBadge.innerHTML = '🎬 TMDB ' + tmdbId;
        metaEl.appendChild(tmdbBadge);
      }
    }

    // Plot / overview
    var plotEl = document.getElementById('vodDetailPlot');
    if (plotEl) plotEl.textContent = movie.plot || movie.description || movie.overview || 'Pas de description disponible';

    // Cast / Director
    var castEl = document.getElementById('vodDetailCast');
    if (castEl) {
      var parts = [];
      if (movie.director) parts.push('<strong>Réalisateur:</strong> ' + escapeText(movie.director));
      if (movie.cast || movie.actors) parts.push('<strong>Casting:</strong> ' + escapeText(movie.cast || movie.actors));
      if (movie.country) parts.push('<strong>Pays:</strong> ' + escapeText(movie.country));
      if (movie.releasedate) parts.push('<strong>Sortie:</strong> ' + escapeText(movie.releasedate));
      castEl.innerHTML = parts.join('<br>');
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
