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
      // Grid layout: balanced posters
      '.vod-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:14px;padding:12px 16px;overflow-y:auto;align-content:start;animation:vodSlideIn .35s ease-out}' +
      '@keyframes vodSlideIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}' +
      // Each poster card - with CSS containment for scroll perf
      '.vod-grid > *{aspect-ratio:2/3;border-radius:10px;overflow:hidden;background:#1e293b;position:relative;cursor:pointer;transition:transform .15s ease-out,box-shadow .15s ease-out;outline:none;contain:layout style paint;content-visibility:auto;contain-intrinsic-size:280px}' +
      '.vod-grid > *:focus, .vod-grid > *:hover{transform:scale(1.06);box-shadow:0 8px 24px rgba(0,0,0,.6);z-index:2}' +
      '.vod-grid > * img{width:100%;height:100%;object-fit:cover;display:block;background:#0f172a}' +
      '.vod-grid > * .vod-item-title{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top,rgba(0,0,0,.92) 30%,transparent);color:#fff;padding:20px 8px 6px 8px;font-size:12px;font-weight:600;line-height:1.2;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
      '.vod-grid > * .vod-item-rating{position:absolute;top:6px;right:6px;background:rgba(245,158,11,.95);color:#000;padding:2px 6px;border-radius:8px;font-size:10px;font-weight:700;display:flex;align-items:center;gap:3px}' +
      // Make vod-content scrollable
      '.vod-content{display:flex;flex-direction:column;flex:1;overflow:hidden}' +
      '.vod-grid-header{padding:8px 20px;border-bottom:1px solid rgba(255,255,255,.05);flex-shrink:0}' +
      // Category list scrollable - larger text for readability
      '.category-sidebar{display:flex;flex-direction:column;width:260px;flex-shrink:0;background:#0f172a;border-right:1px solid rgba(255,255,255,.05)}' +
      '.sidebar-header{padding:14px 16px;font-weight:700;font-size:14px;color:#e2e8f0;text-transform:uppercase;letter-spacing:.6px;flex-shrink:0;border-bottom:1px solid rgba(255,255,255,.08)}' +
      '.category-list{list-style:none;margin:0;padding:8px 6px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:3px}' +
      '.category-list li{padding:11px 16px;border-radius:8px;cursor:pointer;color:#e2e8f0;font-size:15px;font-weight:500;transition:background .12s;outline:none;line-height:1.3}' +
      '.category-list li:focus, .category-list li:hover{background:rgba(59,130,246,.22);color:#fff}' +
      '.category-list li.active{background:#3b82f6;color:#fff;font-weight:700}' +
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
      '.cin-content{position:absolute;left:50px;top:50%;transform:translateY(-50%);max-width:55%;z-index:4;padding-right:30px}' +
      '.cin-title{font-size:36px;font-weight:900;margin:0 0 10px 0;line-height:1;letter-spacing:-.3px;text-shadow:0 3px 12px rgba(0,0,0,.7);font-family:Impact,"Arial Black",sans-serif}' +
      '.cin-meta-line{display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:13px;color:rgba(255,255,255,.85)}' +
      '.cin-meta-year{font-weight:600;color:#fff}' +
      '.cin-dot{color:rgba(255,255,255,.5);font-size:16px;line-height:1}' +
      '.cin-badges{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}' +
      '.cin-badge{padding:3px 8px;border-radius:5px;font-size:11px;font-weight:700}' +
      '.cin-badge-age{background:rgba(34,197,94,.2);color:#86efac;border:1px solid #22c55e}' +
      '.cin-badge-tmdb{background:#22c55e;color:#000}' +
      '.cin-badge-duration{color:rgba(255,255,255,.9);background:rgba(255,255,255,.1)}' +
      '.cin-added{font-size:12px;color:rgba(255,255,255,.85);margin-bottom:8px}' +
      '.cin-added strong{color:#fff;font-weight:600}' +
      '.cin-plot{font-size:13px;line-height:1.5;color:rgba(255,255,255,.95);margin:0 0 10px 0;max-height:90px;overflow:hidden;text-shadow:0 2px 8px rgba(0,0,0,.5)}' +
      '.cin-cast{font-size:11px;color:rgba(255,255,255,.7);margin-bottom:16px}' +
      '.cin-cast strong{color:#fff}' +
      '.cin-actions{display:flex;gap:10px;align-items:center;margin-bottom:18px}' +
      '.cin-btn-watch{display:inline-flex;align-items:center;gap:8px;padding:10px 28px;background:#fff;color:#000;border:none;border-radius:50px;font-size:14px;font-weight:700;cursor:pointer;outline:none;transition:transform .12s,box-shadow .12s}' +
      '.cin-btn-watch:focus, .cin-btn-watch:hover{transform:scale(1.04);box-shadow:0 6px 18px rgba(255,255,255,.3)}' +
      '.cin-btn-fav{width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.18);border:2px solid rgba(255,255,255,.4);color:#fff;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;outline:none;transition:all .12s}' +
      '.cin-btn-fav:focus, .cin-btn-fav:hover{background:rgba(255,255,255,.3);border-color:#fff}' +
      '.cin-btn-fav.active{background:#f59e0b;border-color:#f59e0b;color:#000}' +
      '.cin-btn-fav.active svg{fill:#000}' +
      '.cin-trailer-row{display:flex;flex-direction:column;gap:8px;margin-top:8px}' +
      '.cin-trailer-label{font-size:13px;font-weight:600;color:#fff;letter-spacing:.5px}' +
      '.cin-trailer-card{position:relative;width:240px;aspect-ratio:16/9;border-radius:8px;overflow:hidden;cursor:pointer;background:#1e293b;outline:none}' +
      '.cin-trailer-card:focus, .cin-trailer-card:hover{outline:2px solid #60a5fa}' +
      '.cin-trailer-card img{width:100%;height:100%;object-fit:cover;display:block}' +
      '.cin-trailer-play{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:46px;height:46px;border-radius:50%;background:rgba(255,255,255,.85);color:#000;display:flex;align-items:center;justify-content:center;font-size:22px}' +
      // Cinematic scroll layout (hero + actors + similar + media)
      '.cinematic-detail .cin-scroll{position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;scroll-behavior:smooth}' +
      '.cinematic-detail .cin-hero{position:relative;min-height:100vh}' +
      '.cinematic-detail .cin-trailer-row{display:none}' +
      '.cin-section{padding:24px 60px 28px 60px;background:#0f172a;border-top:1px solid rgba(255,255,255,.05)}' +
      '.cin-section-title{font-size:20px;font-weight:700;color:#fff;margin:0 0 14px 0;letter-spacing:.3px}' +
      // Actors row
      '.cin-actors-row{display:flex;gap:14px;overflow-x:auto;padding-bottom:8px;scroll-snap-type:x mandatory}' +
      '.cin-actor-card{flex-shrink:0;width:140px;scroll-snap-align:start;outline:none;border-radius:10px;background:transparent;cursor:default}' +
      '.cin-actor-card:focus{outline:2px solid #60a5fa;outline-offset:2px}' +
      '.cin-actor-photo{display:block;width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:10px;background:#1e293b}' +
      '.cin-actor-photo.no-photo{display:flex;align-items:center;justify-content:center;color:#475569;font-size:32px;font-weight:700;background:linear-gradient(135deg,#1e293b,#334155)}' +
      '.cin-actor-name{color:#fff;font-size:14px;font-weight:600;margin-top:8px;line-height:1.2}' +
      '.cin-actor-char{color:#94a3b8;font-size:12px;margin-top:2px;line-height:1.2}' +
      // Similar row
      '.cin-similar-row{display:flex;gap:14px;overflow-x:auto;padding-bottom:8px;scroll-snap-type:x mandatory}' +
      '.cin-similar-card{flex-shrink:0;width:150px;scroll-snap-align:start;outline:none;cursor:pointer;transition:transform .12s}' +
      '.cin-similar-card:focus, .cin-similar-card:hover{transform:scale(1.05)}' +
      '.cin-similar-card:focus .cin-similar-poster{outline:2px solid #60a5fa}' +
      '.cin-similar-poster{display:block;width:100%;aspect-ratio:2/3;object-fit:cover;border-radius:8px;background:#1e293b}' +
      '.cin-similar-poster.no-img{display:flex;align-items:center;justify-content:center;color:#cbd5e1;font-size:12px;padding:10px;text-align:center}' +
      '.cin-similar-name{color:#cbd5e1;font-size:12px;margin-top:6px;line-height:1.2;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
      // Media (trailer) row
      '.cin-media-row{display:flex;gap:14px}' +
      '.cin-media-row .cin-trailer-card{position:relative;width:280px;aspect-ratio:16/9;border-radius:8px;overflow:hidden;cursor:pointer;background:#1e293b;outline:none;text-decoration:none;display:block}' +
      '.cin-media-row .cin-trailer-card:focus, .cin-media-row .cin-trailer-card:hover{outline:2px solid #60a5fa}' +
      '.cin-media-row .cin-trailer-card img{width:100%;height:100%;object-fit:cover;display:block}' +
      '.cin-media-row .cin-trailer-play{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:54px;height:54px;border-radius:50%;background:rgba(255,255,255,.85);color:#000;display:flex;align-items:center;justify-content:center;font-size:24px}' +
      '.cin-trailer-caption{position:absolute;bottom:8px;left:10px;color:#fff;font-size:12px;font-weight:600;text-shadow:0 1px 4px rgba(0,0,0,.7)}' +
      '@media (max-width:900px){.cin-title{font-size:38px}.cin-content{left:30px;max-width:75%}.cin-section{padding:18px 30px}}';
    document.head.appendChild(s);
  }


  // Enhanced render of a VOD item card
  function renderVodCard(vod) {
    var poster = upgradeImg(vod.stream_icon || vod.cover || '', 'poster');
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

  // Upgrade TMDB image URLs to high-res. type: 'backdrop' (original) | 'poster' (w780) | 'actor' (w342)
  function upgradeImg(url, type) {
    if (!url) return url;
    var m = String(url).match(/^(.*image\.tmdb\.org\/t\/p\/)(w\d+|original)(\/.+)$/);
    if (m) {
      var size = type === 'backdrop' ? 'original' : (type === 'actor' ? 'w342' : 'w780');
      return m[1] + size + m[3];
    }
    return url;
  }


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
      try {
        var origModal = document.getElementById('vodDetailModal');
        if (origModal) origModal.style.display = 'none';
      } catch (e) {}
      openCinematicDetail(vod);
    };
  }

  // Same enhancement for Series
  function patchShowSeriesDetail() {
    if (typeof window.showSeriesDetail !== 'function') return;
    var orig = window.showSeriesDetail;
    window.showSeriesDetail = async function(series) {
      try {
        var origModal = document.getElementById('seriesDetailModal');
        if (origModal) origModal.style.display = 'none';
      } catch (e) {}
      // Build a VOD-like object from series so openCinematicDetail can handle it
      var fakeVod = {
        stream_id: series.series_id || series.stream_id,
        name: series.name,
        stream_icon: series.cover || series.stream_icon,
        rating: series.rating,
        category_id: series.category_id,
        added: series.last_modified || series.added,
        _series: series, // keep ref for episode loading later
        _type: 'series'
      };
      openCinematicDetail(fakeVod);
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
      '<div class="cin-scroll">' +
        '<div class="cin-hero">' +
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
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20"/></svg>' +
                '<span>Regarder</span>' +
              '</button>' +
              '<button class="cin-btn-fav focusable" id="cinBtnFav" tabindex="0" title="Favori">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"/></svg>' +
              '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="cin-section" id="cinActorsSection" style="display:none">' +
          '<h2 class="cin-section-title">Acteurs</h2>' +
          '<div class="cin-actors-row" id="cinActorsRow"></div>' +
        '</div>' +
        '<div class="cin-section" id="cinSimilarSection" style="display:none">' +
          '<h2 class="cin-section-title" id="cinSimilarTitle">Similaires</h2>' +
          '<div class="cin-similar-row" id="cinSimilarRow"></div>' +
        '</div>' +
        '<div class="cin-section" id="cinMediaSection" style="display:none">' +
          '<h2 class="cin-section-title">Médias</h2>' +
          '<div class="cin-media-row" id="cinMediaRow"></div>' +
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

    // Watch button → play (handles VOD and Series differently)
    overlay.querySelector('#cinBtnWatch').addEventListener('click', async function() {
      try {
        if (vod._type === 'series') {
          var sInfo = info;
          if (!sInfo || !sInfo.episodes) {
            sInfo = await AppState.api.getSeriesInfo(vod.stream_id);
          }
          if (sInfo && sInfo.episodes) {
            var seasonKeys = Object.keys(sInfo.episodes).sort(function(a, b) { return parseInt(a) - parseInt(b); });
            if (seasonKeys.length > 0) {
              var firstSeasonEps = sInfo.episodes[seasonKeys[0]];
              if (firstSeasonEps && firstSeasonEps.length > 0) {
                var ep = firstSeasonEps[0];
                var ext = ep.container_extension || 'mp4';
                var url = AppState.api.seriesUrl(ep.id, ext);
                close();
                if (typeof window.startPlayer === 'function') {
                  window.startPlayer(url, vod.name + ' - S' + seasonKeys[0] + 'E' + (ep.episode_num || 1), '', 'series', vod);
                }
                return;
              }
            }
          }
          showToast && showToast('Aucun épisode disponible');
        } else {
          // VOD - use container_extension from the API response (info.movie_data) which is authoritative
          var serverExt = (moviedata && moviedata.container_extension) ||
                          (info && info.movie_data && info.movie_data.container_extension) ||
                          vod.container_extension || 'mp4';
          var url = AppState.api.vodUrl(vod.stream_id, serverExt);
          close();
          // Stash alt extensions on the VOD object for ExoPlayer 404 fallback
          vod._altExts = ['mkv', 'avi', 'ts', 'mp4'].filter(function(e) { return e !== serverExt; });
          // Ensure AppState.selectedVod points to this vod so the bridge can read _altExts
          AppState.selectedVod = vod;
          if (typeof window.startPlayer === 'function') {
            window.startPlayer(url, vod.name, '', 'vod', vod);
          }
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
    var isSeries = (vod._type === 'series');
    try {
      if (AppState.api) {
        if (isSeries && AppState.api.getSeriesInfo) {
          info = await AppState.api.getSeriesInfo(vod.stream_id);
        } else if (AppState.api.getVodInfo) {
          info = await AppState.api.getVodInfo(vod.stream_id);
        }
      }
    } catch (e) {}
    var movie = (info && info.info) ? info.info : {};
    var moviedata = (info && info.movie_data) ? info.movie_data : vod;

    var backdrop = upgradeImg((movie.backdrop_path && movie.backdrop_path[0]) ? movie.backdrop_path[0] : (movie.movie_image || vod.stream_icon || ''), 'backdrop');
    var poster = upgradeImg(movie.cover_big || movie.movie_image || vod.stream_icon || '', 'poster');

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

    // Plot - try Xtream fields first, then TMDB API as fallback
    var plotText = movie.plot || movie.description || movie.overview || movie.synopsis || vod.description || '';
    if (!plotText && info && info.seasons && info.seasons.length > 0) {
      var totalEps = 0;
      info.seasons.forEach(function(se) {
        if (info.episodes && info.episodes[se.season_number]) totalEps += info.episodes[se.season_number].length;
      });
      plotText = info.seasons.length + ' saison' + (info.seasons.length > 1 ? 's' : '') + (totalEps > 0 ? ' • ' + totalEps + ' épisodes' : '');
    }
    if (!plotText) plotText = 'Chargement de la description...';
    overlay.querySelector('#cinPlot').textContent = plotText;

    // Fallback TMDB fetch for description if missing
    if (tmdbId && (!movie.plot && !movie.description && !movie.overview && !movie.synopsis && !vod.description)) {
      try {
        var tdescCache = 'tmdb_overview_' + tmdbId + '_fr';
        var tdesc = null;
        try {
          var trec = localStorage.getItem(tdescCache);
          if (trec) {
            var te = JSON.parse(trec);
            if (Date.now() - te.t < 24 * 3600 * 1000) tdesc = te.data;
          }
        } catch (e) {}
        if (!tdesc) {
          var tkey = localStorage.getItem('iprem_tmdb_key') || '4ef0d7355d9ffb5151e987764708ce96';
          var tendpoint = (vod._type === 'series') ? 'tv' : 'movie';
          var tr = await fetch('https://api.themoviedb.org/3/' + tendpoint + '/' + tmdbId + '?language=fr-FR&api_key=' + tkey);
          if (tr.ok) {
            var td = await tr.json();
            tdesc = td.overview || '';
            try { localStorage.setItem(tdescCache, JSON.stringify({ t: Date.now(), data: tdesc })); } catch (e) {}
          }
        }
        if (tdesc) {
          overlay.querySelector('#cinPlot').textContent = tdesc;
        } else {
          overlay.querySelector('#cinPlot').textContent = 'Aucune description disponible pour ce contenu.';
        }
      } catch (e) {
        overlay.querySelector('#cinPlot').textContent = 'Aucune description disponible pour ce contenu.';
      }
    } else if (plotText === 'Chargement de la description...') {
      overlay.querySelector('#cinPlot').textContent = 'Aucune description disponible pour ce contenu.';
    }

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
      var bEl = overlay.querySelector('#cinBadges');
      if (bEl && !bEl.querySelector('.cin-badge-tmdb')) {
        bEl.insertAdjacentHTML('beforeend', '<span class="cin-badge cin-badge-tmdb" style="background:#22c55e">TMDb ' + tmdbId + '</span>');
      }
    }

    // ===== Actors section =====
    // Try TMDB credits if we have tmdb_id and a configured key, otherwise fallback to cast string
    var castStr = movie.cast || movie.actors || '';
    var directorStr = movie.director || '';
    var actors = [];
    if (tmdbId) {
      try {
        var cacheKey = 'tmdb_credits_' + tmdbId + '_fr';
        var cached = null;
        try {
          var raw = localStorage.getItem(cacheKey);
          if (raw) {
            var entry = JSON.parse(raw);
            if (Date.now() - entry.t < 24 * 3600 * 1000) cached = entry.data;
          }
        } catch (e) {}

        var creds = cached;
        if (!creds) {
          var tmdbKey = localStorage.getItem('iprem_tmdb_key') || '4ef0d7355d9ffb5151e987764708ce96';
          var credRes = await fetch('https://api.themoviedb.org/3/movie/' + tmdbId + '/credits?language=fr&api_key=' + tmdbKey);
          if (credRes.ok) {
            creds = await credRes.json();
            try { localStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), data: creds })); } catch (e) {}
          }
        }

        if (creds) {
          if (creds.cast && creds.cast.length > 0) {
            actors = creds.cast.slice(0, 12).map(function(c) {
              return {
                name: c.name,
                character: c.character || '',
                photo: c.profile_path ? ('https://image.tmdb.org/t/p/w342' + c.profile_path) : ''
              };
            });
          }
          if (!directorStr && creds.crew) {
            var dir = creds.crew.find(function(p) { return p.job === 'Director'; });
            if (dir) directorStr = dir.name;
          }
        }
      } catch (e) {}
    }
    // Fallback to cast string
    if (actors.length === 0 && castStr) {
      actors = castStr.split(/,|;/).map(function(n) { return { name: n.trim(), character: '', photo: '' }; }).filter(function(a) { return a.name; }).slice(0, 12);
    }
    if (actors.length > 0) {
      var actorsRow = overlay.querySelector('#cinActorsRow');
      actorsRow.innerHTML = actors.map(function(a) {
        return '<div class="cin-actor-card focusable" tabindex="0">' +
          (a.photo
            ? '<img class="cin-actor-photo" loading="lazy" src="' + a.photo.replace(/'/g, '%27') + '" alt="" onerror="this.style.display=\'none\';this.parentElement.classList.add(\'no-photo\')">'
            : '<div class="cin-actor-photo no-photo"><span>' + escapeText(a.name.charAt(0)) + '</span></div>') +
          '<div class="cin-actor-name">' + escapeText(a.name) + '</div>' +
          (a.character ? '<div class="cin-actor-char">' + escapeText(a.character) + '</div>' : '') +
        '</div>';
      }).join('');
      overlay.querySelector('#cinActorsSection').style.display = '';
    }

    // ===== Similar movies (same category in current portal) =====
    try {
      var sameCat = (AppState.vodStreams || []).filter(function(s) {
        return s.stream_id !== vod.stream_id && (!vod.category_id || s.category_id === vod.category_id);
      }).slice(0, 14);
      if (sameCat.length > 0) {
        var simRow = overlay.querySelector('#cinSimilarRow');
        simRow.innerHTML = sameCat.map(function(s) {
          var p = upgradeImg(s.stream_icon || s.cover || '', 'poster');
          return '<div class="cin-similar-card focusable" tabindex="0" data-id="' + s.stream_id + '">' +
            (p ? '<img class="cin-similar-poster" loading="lazy" src="' + p.replace(/'/g, '%27') + '" alt="" onerror="this.style.display=\'none\'">' : '<div class="cin-similar-poster no-img">' + escapeText(s.name) + '</div>') +
            '<div class="cin-similar-name">' + escapeText(s.name) + '</div>' +
          '</div>';
        }).join('');
        Array.from(simRow.querySelectorAll('.cin-similar-card')).forEach(function(card) {
          card.addEventListener('click', function() {
            var id = card.getAttribute('data-id');
            var s = sameCat.find(function(x) { return String(x.stream_id) === String(id); });
            if (s) {
              try { overlay.remove(); } catch (e) {}
              setTimeout(function() { openCinematicDetail(s); }, 50);
            }
          });
        });
        overlay.querySelector('#cinSimilarTitle').textContent = 'Dans la même catégorie';
        overlay.querySelector('#cinSimilarSection').style.display = '';
      }
    } catch (e) {}

    // ===== Trailer in Médias section =====
    var youtube = movie.youtube_trailer || '';
    if (youtube) {
      var videoId = youtube;
      var m = String(youtube).match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
      if (m) videoId = m[1];
      var thumb = 'https://img.youtube.com/vi/' + videoId + '/mqdefault.jpg';
      var ytLink = 'https://www.youtube.com/watch?v=' + videoId;
      var mediaRow = overlay.querySelector('#cinMediaRow');
      mediaRow.innerHTML =
        '<a class="cin-trailer-card focusable" tabindex="0" href="' + ytLink + '" target="_blank" rel="noopener">' +
          '<img src="' + thumb + '" alt="Bande-annonce">' +
          '<span class="cin-trailer-play">▶</span>' +
          '<span class="cin-trailer-caption">Bande-annonce</span>' +
        '</a>';
      overlay.querySelector('#cinMediaSection').style.display = '';
    }
  }


  // Infinite scroll: load more VOD/Series when near bottom of grid
  function attachInfiniteScroll() {
    ['vod', 'series'].forEach(function(type) {
      var scrollArea = document.querySelector('#' + type + ' .vod-content') ||
                       document.querySelector('#' + type + ' .vod-grid');
      if (!scrollArea || scrollArea.dataset.inf === '1') return;
      scrollArea.dataset.inf = '1';
      var loading = false;
      scrollArea.addEventListener('scroll', async function() {
        if (loading) return;
        var nearBottom = scrollArea.scrollTop + scrollArea.clientHeight >= scrollArea.scrollHeight - 240;
        if (!nearBottom) return;
        if (!AppState.api) return;
        var loadFn = type === 'vod' ? AppState.api.loadMoreVod : AppState.api.loadMoreSeries;
        if (typeof loadFn !== 'function') return;
        loading = true;
        try {
          var catId = type === 'vod' ? AppState.selectedVodCategory : AppState.selectedSeriesCategory;
          var more = await loadFn.call(AppState.api, catId);
          if (more && more.length > 0) {
            if (type === 'vod') {
              AppState.vodStreams = (AppState.vodStreams || []).concat(more);
              if (typeof window.renderVodGrid === 'function') window.renderVodGrid();
            } else {
              AppState.seriesList = (AppState.seriesList || []).concat(more);
              if (typeof window.renderSeriesGrid === 'function') window.renderSeriesGrid();
            }
            showToast && showToast('+ ' + more.length + ' items chargés');
          }
        } catch (e) { console.warn('loadMore failed', e); }
        loading = false;
      });
    });
  }

  // Bootstrap
  window.addEventListener('DOMContentLoaded', function() {
    injectVodStyles();
    setTimeout(function() {
      patchVodRenderer();
      patchSeriesRenderer();
      patchShowVodDetail();
      patchShowSeriesDetail();
    }, 800);

    // Attach infinite scroll when screens are shown
    setTimeout(function() {
      if (typeof window.showScreen === 'function') {
        var orig = window.showScreen;
        window.showScreen = function(id) {
          var r = orig.apply(this, arguments);
          if (id === 'vod' || id === 'series') setTimeout(attachInfiniteScroll, 400);
          return r;
        };
      }
    }, 1500);
  });

})();
