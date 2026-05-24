/* ============================================
   iPremTvOnline - Connections grid view
   Rebuilds the login screen with sections (Ajout Web / Portails / Xtream / Listes de lecture)
   Matches iPremiumTv 1.6.7 layout
   ============================================ */

function buildConnectionsView() {
  var login = document.getElementById('login');
  if (!login) return;
  if (document.getElementById('connectionsView')) return; // already built

  // Hide original login-container (we keep it as a modal-opened form)
  var original = login.querySelector('.login-container');
  if (original) original.style.display = 'none';

  // Build the new view
  var view = document.createElement('div');
  view.id = 'connectionsView';
  view.className = 'connections-view';
  view.innerHTML =
    '<div class="conn-header">' +
      '<span class="conn-menu-icon">⊟</span>' +
      '<h1 class="conn-title">Connexions</h1>' +
    '</div>' +
    '<div class="conn-scroll">' +
      '<div class="conn-section" data-section="web">' +
        '<h2 class="conn-section-title">Ajout Web</h2>' +
        '<div class="conn-cards" id="connCardsWeb"></div>' +
      '</div>' +
      '<div class="conn-section" data-section="stalker">' +
        '<h2 class="conn-section-title">Portails</h2>' +
        '<div class="conn-cards" id="connCardsStalker"></div>' +
      '</div>' +
      '<div class="conn-section" data-section="xtream">' +
        '<h2 class="conn-section-title">Xtream</h2>' +
        '<div class="conn-cards" id="connCardsXtream"></div>' +
      '</div>' +
      '<div class="conn-section" data-section="m3u">' +
        '<h2 class="conn-section-title">Listes de lecture</h2>' +
        '<div class="conn-cards" id="connCardsM3U"></div>' +
      '</div>' +
    '</div>';
  login.appendChild(view);

  renderConnectionsView();
}

function renderConnectionsView() {
  var portals = [];
  try { portals = JSON.parse(localStorage.getItem('iprem_portals') || '[]'); } catch (e) {}

  // Web section: only the "Ajout Web" card
  var webCards = document.getElementById('connCardsWeb');
  if (webCards) {
    webCards.innerHTML = '';
    webCards.appendChild(makeAddCard('Ajout Web', 'web', 'addweb'));
  }

  // Stalker section
  var stalkerCards = document.getElementById('connCardsStalker');
  if (stalkerCards) {
    stalkerCards.innerHTML = '';
    stalkerCards.appendChild(makeAddCard('Ajouter un portail', 'stalker'));
    portals.forEach(function(p, idx) {
      if ((p.type || 'xtream') === 'stalker') {
        stalkerCards.appendChild(makePortalCard(p, idx));
      }
    });
  }

  // Xtream section
  var xtreamCards = document.getElementById('connCardsXtream');
  if (xtreamCards) {
    xtreamCards.innerHTML = '';
    xtreamCards.appendChild(makeAddCard('Ajouter Xtream', 'xtream', 'xtream-add'));
    portals.forEach(function(p, idx) {
      if ((p.type || 'xtream') === 'xtream') {
        xtreamCards.appendChild(makePortalCard(p, idx));
      }
    });
  }

  // M3U section
  var m3uCards = document.getElementById('connCardsM3U');
  if (m3uCards) {
    m3uCards.innerHTML = '';
    m3uCards.appendChild(makeAddCard('Ajouter une liste de lecture M3U', 'm3u'));
    portals.forEach(function(p, idx) {
      if ((p.type || 'xtream') === 'm3u') {
        m3uCards.appendChild(makePortalCard(p, idx));
      }
    });
  }
}

function makeAddCard(label, type, extraClass) {
  var card = document.createElement('div');
  card.className = 'conn-card add-card focusable' + (extraClass ? ' ' + extraClass : '');
  card.tabIndex = 0;
  card.setAttribute('data-add-type', type);
  card.innerHTML =
    '<div class="add-card-inner">' +
      '<div class="add-icon">+</div>' +
      '<div class="add-label">' + escapeHtmlSafe(label) + '</div>' +
    '</div>';
  var handle = function() { openAddPortalModal(type); };
  card.addEventListener('click', handle);
  card.addEventListener('keydown', function(e) { if (e.key === 'Enter') handle(); });
  return card;
}

function makePortalCard(portal, index) {
  var card = document.createElement('div');
  card.className = 'conn-card portal-card focusable';
  card.tabIndex = 0;
  card.setAttribute('data-portal-idx', index);

  var name = portal.name || portal.username || portal.mac || portal.playlistUrl || 'Portal';
  var expiry = portal._expiry || 'Unlimited';
  var status = portal._status || 'Connecté';

  card.innerHTML =
    '<div class="portal-card-name">' + escapeHtmlSafe(name) + '</div>' +
    '<div class="portal-card-status"><span class="status-badge">' + escapeHtmlSafe(status) + '</span></div>' +
    '<div class="portal-card-meta">Expire: ' + escapeHtmlSafe(expiry) + '</div>' +
    '<button class="portal-card-delete" title="Supprimer" data-idx="' + index + '">&times;</button>';

  var handle = function() { connectToPortal(portal); };
  card.addEventListener('click', function(e) {
    if (e.target.classList.contains('portal-card-delete')) {
      deletePortalAt(index);
      return;
    }
    handle();
  });
  card.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') handle();
    if (e.key === 'Delete' || e.key === 'Backspace') deletePortalAt(index);
  });
  return card;
}

function escapeHtmlSafe(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, function(c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function deletePortalAt(index) {
  var portals = [];
  try { portals = JSON.parse(localStorage.getItem('iprem_portals') || '[]'); } catch (e) {}
  if (index >= 0 && index < portals.length) {
    portals.splice(index, 1);
    localStorage.setItem('iprem_portals', JSON.stringify(portals));
    renderConnectionsView();
    showToast('Portail supprimé');
  }
}

function connectToPortal(portal) {
  // Use the existing infrastructure: set fields then call doLogin
  var type = portal.type || 'xtream';

  // Make sure type radio + fields are set so the patched doLogin sees correct values
  setLoginType(type);

  if (type === 'xtream') {
    document.getElementById('serverUrl').value = portal.server || '';
    document.getElementById('username').value = portal.username || '';
    document.getElementById('password').value = portal.password || '';
  } else if (type === 'stalker') {
    document.getElementById('serverUrl').value = portal.server || '';
    var macIn = document.getElementById('macAddress');
    if (macIn) macIn.value = portal.mac || '';
  } else if (type === 'm3u') {
    var m3uIn = document.getElementById('m3uUrl');
    if (m3uIn) m3uIn.value = portal.playlistUrl || portal.server || '';
  }

  // Re-show the original login container temporarily (form submit / doLogin needs it visible? no, only DOM-accessible)
  if (typeof window.doLogin === 'function') {
    window.doLogin();
  }
}

function setLoginType(type) {
  var radios = document.querySelectorAll('input[name="loginType"]');
  radios.forEach(function(r) { r.checked = (r.value === type); });
  // Trigger change handler to update field visibility
  if (radios.length > 0) {
    var ev = new Event('change', { bubbles: true });
    radios[0].closest('.login-type-row') && radios[0].closest('.login-type-row').dispatchEvent(ev);
  }
}

// ========== Modal to add a new portal (per type) ==========
function openAddPortalModal(type) {
  // For 'web' (Ajout Web), open the Remote URL config + sync
  if (type === 'web') {
    openWebAddModal();
    return;
  }

  // Reuse the original .login-container as the form, shown inside a modal
  var existing = document.getElementById('addPortalModal');
  if (existing) existing.remove();

  var modal = document.createElement('div');
  modal.id = 'addPortalModal';
  modal.className = 'modal addportal-modal';
  modal.innerHTML =
    '<div class="modal-backdrop"></div>' +
    '<div class="modal-content addportal-content">' +
      '<div class="addportal-header">' +
        '<button class="addportal-back focusable" id="addPortalBack" tabindex="0">↶</button>' +
        '<h2 class="addportal-title">Ajouter un portail</h2>' +
      '</div>' +
      '<div class="addportal-body" id="addPortalBody"></div>' +
    '</div>';
  document.body.appendChild(modal);
  modal.style.display = 'flex';

  // Move the original login-container into the modal body (so doLogin still works on its existing fields)
  var loginContainer = document.querySelector('#login .login-container');
  if (loginContainer) {
    document.getElementById('addPortalBody').appendChild(loginContainer);
    loginContainer.style.display = '';
  }

  // Pre-select the right type
  setLoginType(type);

  var close = function() {
    try {
      // Move login container back to its original location (hidden again)
      var login = document.getElementById('login');
      if (loginContainer && login) {
        login.appendChild(loginContainer);
        loginContainer.style.display = 'none';
      }
    } catch (e) {}
    try { modal.remove(); } catch (e) {}
    // Re-render to reflect any new portals
    renderConnectionsView();
  };
  modal.querySelector('#addPortalBack').addEventListener('click', close);
  modal.querySelector('.modal-backdrop').addEventListener('click', close);

  // Auto-close when login succeeds (showScreen('home') called)
  var watcher = setInterval(function() {
    if (AppState && AppState.activeScreen && AppState.activeScreen !== 'login') {
      clearInterval(watcher);
      try { modal.remove(); } catch (e) {}
    }
    if (!document.body.contains(modal)) { clearInterval(watcher); }
  }, 250);
}

function openWebAddModal() {
  var existing = document.getElementById('webAddModal');
  if (existing) existing.remove();

  var remoteUrl = localStorage.getItem('iprem_remote_url') || '';
  var modal = document.createElement('div');
  modal.id = 'webAddModal';
  modal.className = 'modal addportal-modal';
  modal.innerHTML =
    '<div class="modal-backdrop"></div>' +
    '<div class="modal-content addportal-content">' +
      '<div class="addportal-header">' +
        '<button class="addportal-back focusable" id="webAddBack" tabindex="0">↶</button>' +
        '<h2 class="addportal-title">Ajout Web</h2>' +
      '</div>' +
      '<div class="addportal-body">' +
        '<div class="form-group">' +
          '<label for="webAddUrl">URL JSON de portails à distance</label>' +
          '<input type="url" id="webAddUrl" placeholder="https://example.com/portals.json" value="' + remoteUrl.replace(/"/g, '&quot;') + '" autocapitalize="none">' +
        '</div>' +
        '<div class="form-group">' +
          '<small style="color:#94a3b8;font-size:12px">' +
            'Format attendu : { "portals": [ {"type":"xtream","server":"...","username":"...","password":"..."}, {"type":"stalker","server":"...","mac":"..."}, {"type":"m3u","playlistUrl":"..."} ] }' +
          '</small>' +
        '</div>' +
        '<div class="form-actions">' +
          '<button type="button" class="btn btn-secondary focusable" id="webAddSave" tabindex="0">Enregistrer URL</button>' +
          '<button type="button" class="btn btn-primary focusable" id="webAddSync" tabindex="0">Synchroniser maintenant</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  document.body.appendChild(modal);
  modal.style.display = 'flex';

  var close = function() {
    try { modal.remove(); } catch (e) {}
    renderConnectionsView();
  };
  modal.querySelector('#webAddBack').addEventListener('click', close);
  modal.querySelector('.modal-backdrop').addEventListener('click', close);

  modal.querySelector('#webAddSave').addEventListener('click', function() {
    var v = document.getElementById('webAddUrl').value.trim();
    localStorage.setItem('iprem_remote_url', v);
    showToast('URL enregistrée');
  });
  modal.querySelector('#webAddSync').addEventListener('click', function() {
    var v = document.getElementById('webAddUrl').value.trim();
    if (v) localStorage.setItem('iprem_remote_url', v);
    if (typeof syncRemotePortals === 'function') {
      syncRemotePortals(false).then(function(n) {
        renderConnectionsView();
        if (n > 0) close();
      });
    }
  });
}

// ========== CSS injection ==========
function injectConnectionsStyles() {
  if (document.getElementById('iprem-conn-styles')) return;
  var s = document.createElement('style');
  s.id = 'iprem-conn-styles';
  s.textContent =
    '#login{padding:0;background:linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#7e22ce 100%);min-height:100vh;display:block !important;align-items:initial !important;justify-content:initial !important;overflow-y:auto}' +
    '.connections-view{padding:24px 32px 60px 32px;color:#fff;min-height:100vh}' +
    '.conn-header{display:flex;align-items:center;gap:14px;margin-bottom:24px;padding-top:10px}' +
    '.conn-menu-icon{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border:2px solid #64748b;border-radius:8px;color:#64748b;font-size:18px;cursor:pointer}' +
    '.conn-title{font-size:28px;font-weight:600;margin:0;color:#fff}' +
    '.conn-scroll{display:flex;flex-direction:column;gap:28px}' +
    '.conn-section-title{font-size:16px;font-weight:500;color:#cbd5e1;margin:0 0 12px 0;letter-spacing:.5px}' +
    '.conn-cards{display:flex;flex-wrap:wrap;gap:16px}' +
    '.conn-card{width:240px;height:140px;border-radius:14px;cursor:pointer;transition:all .15s;position:relative;display:flex;align-items:center;justify-content:center;flex-direction:column;padding:14px;box-sizing:border-box;outline:none}' +
    '.conn-card:focus{transform:scale(1.04);box-shadow:0 0 0 3px #60a5fa,0 8px 24px rgba(59,130,246,.4)}' +
    '.conn-card:hover{transform:scale(1.02)}' +
    '.add-card{background:linear-gradient(135deg,#60a5fa 0%,#3b82f6 100%);color:#fff;text-align:center}' +
    '.add-card.xtream-add{background:linear-gradient(135deg,#3b82f6 0%,#1d4ed8 100%)}' +
    '.add-card.addweb{background:linear-gradient(135deg,#3b82f6 0%,#1e40af 100%)}' +
    '.add-card-inner{display:flex;flex-direction:column;align-items:center;gap:10px}' +
    '.add-icon{width:46px;height:46px;border-radius:50%;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:300;line-height:1}' +
    '.add-label{font-size:14px;font-weight:500;text-align:center;line-height:1.3;max-width:200px}' +
    '.portal-card{background:linear-gradient(135deg,#60a5fa 0%,#3b82f6 100%);align-items:flex-start;justify-content:flex-start;padding:16px 18px}' +
    '.portal-card-name{font-size:16px;font-weight:600;color:#fff;margin-bottom:auto;align-self:flex-start}' +
    '.portal-card-status{margin:10px 0}' +
    '.status-badge{display:inline-block;background:#34d399;color:#064e3b;padding:3px 12px;border-radius:14px;font-size:12px;font-weight:600}' +
    '.portal-card-meta{font-size:12px;color:rgba(255,255,255,.85);align-self:flex-start;margin-top:auto}' +
    '.portal-card-delete{position:absolute;top:6px;right:8px;background:rgba(0,0,0,.25);border:none;color:#fff;width:24px;height:24px;border-radius:50%;font-size:18px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .15s}' +
    '.portal-card:hover .portal-card-delete, .portal-card:focus-within .portal-card-delete{opacity:1}' +
    // Add portal modal
    '.addportal-modal{display:flex;align-items:center;justify-content:center;position:fixed;inset:0;z-index:200}' +
    '.addportal-content{max-width:680px;width:90%;max-height:90vh;overflow-y:auto;background:#0f172a;border-radius:14px;padding:24px;position:relative}' +
    '.addportal-header{display:flex;align-items:center;gap:14px;margin-bottom:20px}' +
    '.addportal-back{background:transparent;border:none;color:#fff;font-size:22px;cursor:pointer;padding:6px 10px;border-radius:6px}' +
    '.addportal-back:hover, .addportal-back:focus{background:#334155;outline:none}' +
    '.addportal-title{margin:0;font-size:22px;color:#fff;font-weight:500}' +
    '.addportal-body .login-container{padding:0;background:transparent;box-shadow:none}' +
    '.addportal-body .login-logo{display:none}';
  document.head.appendChild(s);
}


// ========== Bootstrap ==========
window.addEventListener('DOMContentLoaded', function() {
  injectConnectionsStyles();
  setTimeout(function() {
    buildConnectionsView();
    // Re-render whenever a new portal might have been added (syncRemotePortals etc.)
    var origRenderPortalList = window.renderPortalList;
    if (typeof origRenderPortalList === 'function') {
      window.renderPortalList = function() {
        try { origRenderPortalList.apply(this, arguments); } catch (e) {}
        try { renderConnectionsView(); } catch (e) {}
      };
    }
  }, 600);
});
