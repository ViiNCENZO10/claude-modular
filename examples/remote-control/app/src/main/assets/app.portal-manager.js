/* ============================================
   iPremTvOnline - Portal Manager screen
   Sidebar list of portals + detail panel + toolbar
   Inspired by iPremiumTv portal management
   ============================================ */

(function() {
  'use strict';

  function openPortalManager() {
    var existing = document.getElementById('portalMgr');
    if (existing) { existing.remove(); }

    var overlay = document.createElement('div');
    overlay.id = 'portalMgr';
    overlay.className = 'pm-overlay';
    overlay.innerHTML =
      '<div class="pm-frame">' +
        '<aside class="pm-sidebar">' +
          '<button class="pm-back focusable" id="pmBack" tabindex="0">←</button>' +
          '<button class="pm-add focusable" id="pmAdd" tabindex="0">' +
            '<span class="pm-add-icon">+</span><span>Ajouter</span>' +
          '</button>' +
          '<ul class="pm-portal-list" id="pmPortalList"></ul>' +
        '</aside>' +
        '<main class="pm-main">' +
          '<div class="pm-toolbar" id="pmToolbar">' +
            '<button class="pm-tool focusable" data-act="reload" tabindex="0" title="Recharger">' +
              '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23,4 23,10 17,10"/><path d="M20.49 15A9 9 0 1 1 19 6"/></svg>' +
            '</button>' +
            '<button class="pm-tool focusable" data-act="info" tabindex="0" title="Plus d\'infos">' +
              '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>' +
            '</button>' +
            '<button class="pm-tool focusable" data-act="show" tabindex="0" title="Afficher mot de passe">' +
              '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' +
            '</button>' +
            '<button class="pm-tool focusable" data-act="hide" tabindex="0" title="Désactiver">' +
              '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>' +
            '</button>' +
            '<button class="pm-tool focusable" data-act="edit" tabindex="0" title="Modifier">' +
              '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>' +
            '</button>' +
            '<button class="pm-tool pm-tool-danger focusable" data-act="delete" tabindex="0" title="Supprimer">' +
              '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
            '</button>' +
            '<button class="pm-tool focusable" data-act="export" tabindex="0" title="Exporter">' +
              '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
            '</button>' +
          '</div>' +
          '<div class="pm-detail" id="pmDetail">' +
            '<div class="pm-empty">Sélectionne un portail dans la liste</div>' +
          '</div>' +
        '</main>' +
      '</div>';
    document.body.appendChild(overlay);

    document.getElementById('pmBack').addEventListener('click', function() { overlay.remove(); });
    document.getElementById('pmAdd').addEventListener('click', function() {
      overlay.remove();
      if (typeof window.openAddPortalModal === 'function') window.openAddPortalModal('stalker');
    });

    renderPortalList();
    setTimeout(function() {
      var first = document.querySelector('#pmPortalList .pm-portal-item');
      if (first) first.click();
    }, 80);
  }

  function getPortals() {
    try { return JSON.parse(localStorage.getItem('iprem_portals') || '[]'); } catch (e) { return []; }
  }
  function savePortals(arr) {
    localStorage.setItem('iprem_portals', JSON.stringify(arr));
  }

  var selectedIndex = -1;
  var passwordRevealed = false;

  function renderPortalList() {
    var list = document.getElementById('pmPortalList');
    if (!list) return;
    var portals = getPortals();
    list.innerHTML = portals.map(function(p, i) {
      var type = (p.type || 'xtream');
      var typeLabel = type === 'stalker' ? 'Stalker' : (type === 'm3u' ? 'M3U' : 'Xtream');
      var name = p.name || p.username || p.mac || 'Portail';
      var disabled = !!p._disabled;
      return '<li class="pm-portal-item focusable' + (i === selectedIndex ? ' active' : '') + (disabled ? ' disabled' : '') + '" tabindex="0" data-idx="' + i + '">' +
        '<span class="pm-portal-radio"></span>' +
        '<div class="pm-portal-info">' +
          '<div class="pm-portal-name">' + escapeText(name) + '</div>' +
          '<div class="pm-portal-type">' + typeLabel + '</div>' +
        '</div>' +
      '</li>';
    }).join('');

    Array.from(list.querySelectorAll('.pm-portal-item')).forEach(function(el) {
      el.addEventListener('click', function() {
        selectedIndex = parseInt(el.getAttribute('data-idx'), 10);
        passwordRevealed = false;
        renderPortalList();
        renderDetail();
      });
    });
  }

  function renderDetail() {
    var detail = document.getElementById('pmDetail');
    if (!detail) return;
    var portals = getPortals();
    var p = portals[selectedIndex];
    if (!p) {
      detail.innerHTML = '<div class="pm-empty">Sélectionne un portail dans la liste</div>';
      return;
    }
    var type = (p.type || 'xtream');
    var typeLabel = type === 'stalker' ? 'Stalker' : (type === 'm3u' ? 'M3U' : 'Xtream');
    var url = p.server || p.playlistUrl || '';
    var user = (type === 'stalker') ? '-' : (p.username || '-');
    var passDisplay = '-';
    if (type !== 'stalker' && p.password) {
      passDisplay = passwordRevealed ? p.password : p.password.replace(/./g, '•').substring(0, 24);
    }
    var idMac = (type === 'stalker') ? (p.mac || '-') : (p.username || '-');

    detail.innerHTML =
      '<h1 class="pm-portal-title">' + escapeText(p.name || 'Portail') + '</h1>' +
      '<div class="pm-grid">' +
        '<div class="pm-grid-left">' +
          '<h3 class="pm-section-title">Détails d\'identification</h3>' +
          row('🔗', 'URL', url) +
          row('👤', 'Identifiant utilisateur', user) +
          row('🔒', 'Mot de passe', passDisplay) +
          '<h3 class="pm-section-title">Paramètres</h3>' +
          row('🔄', 'Type', typeLabel) +
          row('🆔', 'ID', idMac) +
          row('⏱', 'Décalage EPG', p.epgOffset || 'Aucun') +
        '</div>' +
        '<div class="pm-grid-right">' +
          '<h3 class="pm-section-title">Aperçu des contenus</h3>' +
          '<div class="pm-stats">' +
            statCard('📺', 'Chaînes TV', p._stats_live || '—') +
            statCard('🎬', 'VOD', p._stats_vod || '—') +
            statCard('🎞', 'Séries TV', p._stats_series || '—') +
            statCard('📻', 'Radios', p._stats_radio || '—') +
          '</div>' +
          '<div class="pm-stats-info">' +
            statRow('Expire', p._expire || 'Illimité') +
            statRow('Dernière MAJ EPG', p._epgUpdated || '—') +
            statRow('Dernière MAJ contenus', p._contentUpdated || '—') +
          '</div>' +
        '</div>' +
      '</div>';

    // Wire toolbar actions
    var toolbar = document.getElementById('pmToolbar');
    toolbar.querySelectorAll('.pm-tool').forEach(function(btn) {
      btn.onclick = function() { handleToolbarAction(btn.getAttribute('data-act')); };
    });
  }

  function row(icon, label, value) {
    return '<div class="pm-row focusable" tabindex="0">' +
      '<span class="pm-row-icon">' + icon + '</span>' +
      '<span class="pm-row-label">' + escapeText(label) + '</span>' +
      '<span class="pm-row-value">' + escapeText(value || '-') + '</span>' +
    '</div>';
  }
  function statCard(icon, label, value) {
    return '<div class="pm-stat-card">' +
      '<div class="pm-stat-icon">' + icon + '</div>' +
      '<div class="pm-stat-label">' + escapeText(label) + ': ' + escapeText(String(value)) + '</div>' +
    '</div>';
  }
  function statRow(label, value) {
    return '<div class="pm-stat-row">' +
      '<span class="pm-stat-row-label">' + escapeText(label) + '</span>' +
      '<span class="pm-stat-row-value">' + escapeText(value || '-') + '</span>' +
    '</div>';
  }

  async function handleToolbarAction(act) {
    var portals = getPortals();
    var p = portals[selectedIndex];
    if (!p && act !== 'reload') return;

    switch (act) {
      case 'reload':
        if (!p) { showToast && showToast('Sélectionne un portail'); return; }
        await reloadPortalStats(p);
        savePortals(portals);
        renderDetail();
        break;
      case 'info':
        showToast && showToast('Détails complets affichés');
        break;
      case 'show':
        passwordRevealed = !passwordRevealed;
        renderDetail();
        break;
      case 'hide':
        p._disabled = !p._disabled;
        savePortals(portals);
        renderPortalList();
        renderDetail();
        showToast && showToast(p._disabled ? 'Portail désactivé' : 'Portail réactivé');
        break;
      case 'edit':
        // Reopen the add-portal modal pre-filled
        if (typeof window.openAddPortalModal === 'function') {
          // Note: edit support would require modal to accept pre-filled values - basic version
          document.getElementById('portalMgr').remove();
          window.openAddPortalModal(p.type || 'xtream');
          setTimeout(function() {
            try {
              var modal = document.getElementById('addPortalModal');
              if (!modal) return;
              if (modal.querySelector('#apName')) modal.querySelector('#apName').value = p.name || '';
              if (modal.querySelector('#apServer')) modal.querySelector('#apServer').value = p.server || p.playlistUrl || '';
              if (modal.querySelector('#apUser')) modal.querySelector('#apUser').value = p.username || '';
              if (modal.querySelector('#apMac')) modal.querySelector('#apMac').value = p.mac || '';
              if (modal.querySelector('#apUrl')) modal.querySelector('#apUrl').value = p.playlistUrl || '';
            } catch (e) {}
          }, 200);
        }
        break;
      case 'delete':
        if (!confirm('Supprimer le portail "' + (p.name || '') + '" ?')) return;
        portals.splice(selectedIndex, 1);
        savePortals(portals);
        selectedIndex = -1;
        renderPortalList();
        renderDetail();
        showToast && showToast('Portail supprimé');
        break;
      case 'export':
        var blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = (p.name || 'portail').replace(/[^a-z0-9_-]/gi, '_') + '.json';
        a.click();
        showToast && showToast('Export téléchargé');
        break;
    }
  }

  async function reloadPortalStats(p) {
    try {
      showToast && showToast('Rechargement...');
      var api;
      if (typeof window.buildProvider === 'function') {
        api = window.buildProvider(p);
      } else if (p.type === 'xtream' || !p.type) {
        if (typeof XtreamAPI !== 'undefined') api = new XtreamAPI(p.server, p.username, p.password);
      }
      if (!api) return;
      var auth = await api.login();
      if (auth && auth.user_info) {
        p._expire = auth.user_info.exp_date ? new Date(parseInt(auth.user_info.exp_date) * 1000).toLocaleDateString() : 'Illimité';
      }
      var live = await api.getLiveStreams();
      p._stats_live = (live && live.length) || 0;
      try {
        var vod = await api.getVodStreams();
        p._stats_vod = (vod && vod.length) || 0;
      } catch (e) { p._stats_vod = '—'; }
      try {
        var ser = await api.getSeries();
        p._stats_series = (ser && ser.length) || 0;
      } catch (e) { p._stats_series = '—'; }
      p._contentUpdated = new Date().toLocaleString();
      p._epgUpdated = new Date().toLocaleString();
      showToast && showToast('Stats à jour');
    } catch (e) {
      showToast && showToast('Erreur: ' + e.message);
    }
  }

  function escapeText(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }


  // ===== CSS =====
  function injectStyles() {
    if (document.getElementById('iprem-pm-styles')) return;
    var s = document.createElement('style');
    s.id = 'iprem-pm-styles';
    s.textContent =
      '.pm-overlay{position:fixed;inset:0;z-index:1100;background:linear-gradient(135deg,#1e40af 0%,#3b82f6 100%);color:#fff}' +
      '.pm-frame{position:absolute;inset:0;display:grid;grid-template-columns:280px 1fr;gap:0}' +
      '.pm-sidebar{background:rgba(15,23,42,.35);padding:20px 12px;display:flex;flex-direction:column;gap:14px;border-right:1px solid rgba(255,255,255,.08)}' +
      '.pm-back{align-self:flex-start;background:rgba(255,255,255,.15);border:none;color:#fff;width:44px;height:44px;border-radius:50%;font-size:22px;cursor:pointer;outline:none}' +
      '.pm-back:focus, .pm-back:hover{background:rgba(255,255,255,.3)}' +
      '.pm-add{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.1);border:1px dashed rgba(255,255,255,.3);color:#fff;padding:12px 16px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;outline:none}' +
      '.pm-add:focus, .pm-add:hover{background:rgba(255,255,255,.2);border-color:rgba(255,255,255,.5)}' +
      '.pm-add-icon{font-size:22px;line-height:1}' +
      '.pm-portal-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px;overflow-y:auto;flex:1}' +
      '.pm-portal-item{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:10px;cursor:pointer;background:transparent;outline:none;transition:background .12s}' +
      '.pm-portal-item:hover, .pm-portal-item:focus{background:rgba(255,255,255,.1)}' +
      '.pm-portal-item.active{background:rgba(255,255,255,.95);color:#0f172a}' +
      '.pm-portal-item.active .pm-portal-type{color:#475569}' +
      '.pm-portal-item.disabled{opacity:.5}' +
      '.pm-portal-radio{width:18px;height:18px;border-radius:50%;border:2px solid rgba(255,255,255,.5);flex-shrink:0;background:transparent}' +
      '.pm-portal-item.active .pm-portal-radio{background:#0f172a;border-color:#0f172a;box-shadow:inset 0 0 0 3px #fff}' +
      '.pm-portal-info{flex:1;min-width:0}' +
      '.pm-portal-name{font-size:14px;font-weight:600;line-height:1.2}' +
      '.pm-portal-type{font-size:12px;opacity:.7;margin-top:2px}' +
      // Main panel
      '.pm-main{display:flex;flex-direction:column;overflow-y:auto;padding:24px 32px}' +
      '.pm-toolbar{display:flex;gap:10px;margin-bottom:24px;flex-wrap:wrap}' +
      '.pm-tool{width:48px;height:48px;border-radius:50%;background:rgba(15,23,42,.4);border:none;color:#fff;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;outline:none;transition:background .12s,transform .12s}' +
      '.pm-tool:focus, .pm-tool:hover{background:rgba(15,23,42,.7);transform:scale(1.08)}' +
      '.pm-tool-danger:focus, .pm-tool-danger:hover{background:#dc2626}' +
      '.pm-portal-title{font-size:32px;font-weight:700;margin:0 0 24px 0}' +
      '.pm-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}' +
      '.pm-section-title{font-size:15px;font-weight:600;color:rgba(255,255,255,.85);margin:0 0 12px 0;letter-spacing:.3px}' +
      '.pm-row{display:flex;align-items:center;gap:14px;padding:14px 16px;background:rgba(15,23,42,.3);border-radius:10px;margin-bottom:8px;outline:none}' +
      '.pm-row:focus{outline:2px solid #60a5fa}' +
      '.pm-row-icon{font-size:18px;width:24px;text-align:center}' +
      '.pm-row-label{flex:1;font-size:13px;color:rgba(255,255,255,.85)}' +
      '.pm-row-value{font-size:13px;color:#fff;font-weight:500;font-family:monospace;text-align:right;max-width:60%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
      '.pm-stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px}' +
      '.pm-stat-card{background:rgba(15,23,42,.3);padding:18px 14px;border-radius:10px;text-align:center}' +
      '.pm-stat-icon{font-size:26px;margin-bottom:6px}' +
      '.pm-stat-label{font-size:13px;color:#fff;font-weight:500}' +
      '.pm-stats-info{background:rgba(15,23,42,.3);border-radius:10px;padding:14px 18px;display:flex;flex-direction:column;gap:10px}' +
      '.pm-stat-row{display:flex;justify-content:space-between;font-size:13px;color:#fff;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.06)}' +
      '.pm-stat-row:last-child{border-bottom:none}' +
      '.pm-stat-row-label{opacity:.8}' +
      '.pm-stat-row-value{font-weight:500}' +
      '.pm-empty{padding:60px 20px;text-align:center;color:rgba(255,255,255,.7);font-size:15px}' +
      // Mobile
      '@media (max-width:900px){.pm-frame{grid-template-columns:200px 1fr}.pm-grid{grid-template-columns:1fr}.pm-portal-title{font-size:24px}}';
    document.head.appendChild(s);
  }


  // Expose globally
  window.iprem = window.iprem || {};
  window.iprem.openPortalManager = openPortalManager;

  window.addEventListener('DOMContentLoaded', function() {
    injectStyles();

    // Hook into side menu "Connexions" action to open the manager
    setTimeout(function() {
      if (typeof window.handleSideMenuAction === 'function') {
        var orig = window.handleSideMenuAction;
        window.handleSideMenuAction = function(action) {
          if (action === 'connexions') {
            if (typeof window.closeSideMenu === 'function') window.closeSideMenu();
            openPortalManager();
            return;
          }
          return orig.apply(this, arguments);
        };
      }
    }, 1000);
  });

})();
