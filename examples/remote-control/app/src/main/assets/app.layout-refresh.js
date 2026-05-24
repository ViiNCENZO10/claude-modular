/* ============================================
   iPremTvOnline - Layout refresh
   - Home menu: vertical list style (no more squares)
   - Player OSD: circular icon action bar at bottom
   - Live TV: enhanced preview panel design
   ============================================ */

(function() {
  'use strict';

  function injectStyles() {
    if (document.getElementById('iprem-layout-styles')) return;
    var s = document.createElement('style');
    s.id = 'iprem-layout-styles';
    s.textContent =
      // ===== Home menu: vertical list (Formuler/iPremiumTv style) =====
      '#home .home-content{max-width:none;padding:32px 60px}' +
      '#home .home-greeting{font-size:32px;font-weight:700;margin-bottom:8px}' +
      '#home .nav-grid{display:flex !important;flex-direction:column;gap:6px;max-width:520px;margin:24px 0;grid-template-columns:none !important}' +
      '#home .nav-card{width:100%;height:auto;aspect-ratio:auto;padding:18px 24px;flex-direction:row !important;justify-content:flex-start;align-items:center !important;gap:18px;border-radius:14px;background:rgba(15,23,42,.5);border:1px solid rgba(255,255,255,.06);transition:background .12s,border-color .12s,transform .12s}' +
      '#home .nav-card:focus, #home .nav-card:hover{background:rgba(59,130,246,.18);border-color:#3b82f6;transform:translateX(4px)}' +
      '#home .nav-card-icon{width:36px;height:36px;flex-shrink:0;color:#60a5fa}' +
      '#home .nav-card-icon svg{width:36px;height:36px}' +
      '#home .nav-card-label{font-size:17px;font-weight:600;color:#fff;flex:1;text-align:left}' +
      '#home .nav-card::after{content:"›";font-size:24px;color:rgba(255,255,255,.4);font-weight:300}' +
      '#home .nav-card:focus::after{color:#fff;transform:translateX(4px)}' +
      '#home .home-info-bar{margin-top:32px;padding:16px 20px;background:rgba(15,23,42,.4);border-radius:12px;border:1px solid rgba(255,255,255,.05)}' +

      // ===== Player OSD: circular icon action bar =====
      '.player-osd-bar{position:absolute;bottom:24px;left:50%;transform:translateX(-50%);display:flex;gap:14px;align-items:center;background:rgba(15,23,42,.7);padding:10px 18px;border-radius:50px;backdrop-filter:blur(8px);z-index:30;opacity:0;transition:opacity .25s}' +
      '.player-overlay.show .player-osd-bar, .player-screen:hover .player-osd-bar, .player-screen:focus-within .player-osd-bar{opacity:1}' +
      '.osd-btn{width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.1);border:none;color:#fff;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;outline:none;transition:all .12s;position:relative}' +
      '.osd-btn:focus, .osd-btn:hover{background:#fff;color:#000;transform:scale(1.1)}' +
      '.osd-btn.active{background:#fff;color:#000}' +
      '.osd-btn svg{width:20px;height:20px}' +
      '.osd-btn-label{position:absolute;top:-32px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.85);color:#fff;padding:4px 10px;border-radius:6px;font-size:11px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .12s}' +
      '.osd-btn:focus .osd-btn-label, .osd-btn:hover .osd-btn-label{opacity:1}' +
      // Color dots on bottom
      '.osd-btn-color{position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);width:6px;height:6px;border-radius:50%}' +
      '.osd-btn-color.red{background:#ef4444}' +
      '.osd-btn-color.green{background:#22c55e}' +
      '.osd-btn-color.yellow{background:#eab308}' +
      '.osd-btn-color.blue{background:#3b82f6}' +

      // Top-right info on player
      '.player-top-info{position:absolute;top:18px;right:24px;display:flex;align-items:center;gap:14px;color:rgba(255,255,255,.95);font-size:13px;font-weight:500;z-index:30;text-shadow:0 1px 4px rgba(0,0,0,.6)}' +
      '.player-top-info .pti-divider{opacity:.4}' +

      // ===== Live TV preview panel enhancements =====
      '.channel-preview-panel{background:linear-gradient(180deg,rgba(15,23,42,.7),rgba(15,23,42,.3));border-left:1px solid rgba(255,255,255,.05);display:flex;flex-direction:column}' +
      '.preview-video-area{aspect-ratio:16/9;background:#0f172a;display:flex;align-items:center;justify-content:center;margin:18px;border-radius:10px;overflow:hidden;position:relative}' +
      '.preview-info{padding:0 20px 12px 20px}' +
      '#previewChannelName{font-size:20px;font-weight:700;color:#fff;margin-bottom:4px}' +
      '.preview-num{font-size:13px;color:#94a3b8;font-family:monospace}' +
      '.mini-epg{flex:1;padding:14px 20px;overflow-y:auto}' +
      '.mini-epg h4{font-size:13px;color:rgba(255,255,255,.7);font-weight:600;margin:0 0 12px 0;text-transform:uppercase;letter-spacing:.5px}' +
      '#miniEpgList{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px}' +
      '#miniEpgList li{padding:10px 14px;background:rgba(255,255,255,.04);border-radius:8px;font-size:13px}' +
      '#miniEpgList li .epg-time{color:#94a3b8;font-family:monospace;font-size:11px;display:block;margin-bottom:2px}' +
      '#miniEpgList li .epg-title{color:#fff;font-weight:500}' +

      // Channel list polish (already a list but enhance)
      '.channel-list li{display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:8px}' +
      '.channel-list li:focus, .channel-list li.active{background:rgba(255,255,255,.95);color:#0f172a}' +
      '.channel-list li:focus img, .channel-list li.active img{filter:none}' +

      // Live TV color-coded bottom buttons
      '.bottom-bar .color-btn{padding:8px 14px;border-radius:8px;background:rgba(15,23,42,.5);display:inline-flex;align-items:center;gap:6px}' +
      '.bottom-bar .color-btn .color-dot{width:10px;height:10px;border-radius:50%;display:inline-block}' +
      '.bottom-bar .color-btn.red .color-dot{background:#ef4444}' +
      '.bottom-bar .color-btn.green .color-dot{background:#22c55e}' +
      '.bottom-bar .color-btn.yellow .color-dot{background:#eab308}' +
      '.bottom-bar .color-btn.blue .color-dot{background:#3b82f6}';
    document.head.appendChild(s);
  }


  // ===== Build player OSD bar =====
  function buildPlayerOsd() {
    var player = document.getElementById('player');
    if (!player || player.querySelector('.player-osd-bar')) return;

    var bar = document.createElement('div');
    bar.className = 'player-osd-bar';
    bar.innerHTML =
      osdBtn('list',    'Liste',    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>') +
      osdBtn('category','Catégories','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>') +
      osdBtn('history', 'Historique','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>') +
      osdBtn('settings','Réglages', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82V9a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 3a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V-3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>') +
      osdBtn('search',  'Rechercher','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>', null, 'green') +
      osdBtn('lock',    'Verrouiller','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>', null, 'yellow') +
      osdBtn('fav',     'Favori',   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"/></svg>', null, 'blue') +
      osdBtn('record',  'Enregistrer','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4" fill="currentColor"/></svg>', null, 'red') +
      osdBtn('pip',     'PiP',      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><rect x="12" y="10" width="7" height="6" rx="1" fill="currentColor"/></svg>') +
      osdBtn('cloud',   'Sync',     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>');
    player.appendChild(bar);

    // Wire actions
    bar.querySelectorAll('.osd-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        handleOsdAction(btn.getAttribute('data-act'));
      });
    });

    // Top-right info
    if (!player.querySelector('.player-top-info')) {
      var info = document.createElement('div');
      info.className = 'player-top-info';
      info.innerHTML =
        '<span>Fournisseur : <strong id="osdProvider">—</strong></span>' +
        '<span class="pti-divider">|</span>' +
        '<span id="osdTime">—</span>';
      player.appendChild(info);
      setInterval(updateOsdTime, 30000);
      updateOsdTime();
    }
  }

  function osdBtn(act, label, svg, extraClass, color) {
    return '<button class="osd-btn focusable' + (extraClass ? ' ' + extraClass : '') + '" tabindex="0" data-act="' + act + '" title="' + label + '">' +
      svg +
      '<span class="osd-btn-label">' + label + '</span>' +
      (color ? '<span class="osd-btn-color ' + color + '"></span>' : '') +
    '</button>';
  }

  function updateOsdTime() {
    var el = document.getElementById('osdTime');
    if (!el) return;
    var d = new Date();
    var days = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
    el.textContent = days[d.getDay()] + ' ' + d.getDate() + ' à ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);

    var prov = document.getElementById('osdProvider');
    if (prov && AppState && AppState.api) {
      var name = AppState.api.username || AppState.api.mac || 'iPremTv';
      prov.textContent = name;
    }
  }

  function handleOsdAction(act) {
    switch (act) {
      case 'list':
        try { if (typeof togglePlayerOverlay === 'function') togglePlayerOverlay(); } catch (e) {}
        break;
      case 'category':
        try { stopPlayer && stopPlayer(); showScreen && showScreen('live'); } catch (e) {}
        break;
      case 'history':
        showToast && showToast('Historique : continue à regarder sur Home');
        break;
      case 'settings':
        try { stopPlayer && stopPlayer(); showScreen && showScreen('settings'); } catch (e) {}
        break;
      case 'search':
        try { openSearch && openSearch(); } catch (e) {}
        break;
      case 'lock':
        var pin = (AppState.settings && AppState.settings.parentalPin) || '';
        if (pin) {
          var x = prompt('Code parental (4 chiffres) :');
          if (x !== pin) showToast && showToast('Code incorrect');
        } else {
          showToast && showToast('Aucun code parental défini (Réglages)');
        }
        break;
      case 'fav':
        try { toggleFavorite && toggleFavorite(); } catch (e) {}
        break;
      case 'record':
        if (window.Recordings && AppState.selectedChannel) {
          window.Recordings.add(AppState.selectedChannel);
        }
        break;
      case 'pip':
        if (typeof window.enterPictureInPicture === 'function') window.enterPictureInPicture();
        break;
      case 'cloud':
        if (typeof window.pushToCloud === 'function') window.pushToCloud();
        break;
    }
  }


  // ===== Bootstrap =====
  window.addEventListener('DOMContentLoaded', function() {
    injectStyles();

    // Build player OSD when player is shown
    setTimeout(function() {
      if (typeof window.showScreen === 'function') {
        var orig = window.showScreen;
        window.showScreen = function(id) {
          var r = orig.apply(this, arguments);
          if (id === 'player') setTimeout(buildPlayerOsd, 100);
          return r;
        };
      }
    }, 1200);
  });

})();
