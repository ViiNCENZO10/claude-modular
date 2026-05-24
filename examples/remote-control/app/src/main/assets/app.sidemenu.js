/* ============================================
   iPremTvOnline - Side menu overlay (CherryTV-style)
   + Category order editor
   ============================================ */

function buildSideMenu() {
  if (document.getElementById('sideMenu')) return;

  var menu = document.createElement('aside');
  menu.id = 'sideMenu';
  menu.className = 'side-menu';
  menu.style.display = 'none';
  menu.innerHTML =
    '<div class="sm-backdrop"></div>' +
    '<div class="sm-panel">' +
      '<div class="sm-logo">' +
        '<div class="sm-logo-icon">' +
          '<svg width="28" height="28" viewBox="0 0 64 64" fill="none">' +
            '<circle cx="32" cy="32" r="28" fill="#3b82f6"/>' +
            '<polygon points="24,18 24,46 46,32" fill="#fff"/>' +
          '</svg>' +
        '</div>' +
        '<span class="sm-logo-text">iPremTvOnline</span>' +
      '</div>' +
      '<ul class="sm-items">' +
        sideMenuItem('live',        'Télévision en direct', 'play')   +
        sideMenuItem('vod',         'VOD',                  'movie')  +
        sideMenuItem('series',      'Séries télévisées',    'series') +
        sideMenuItem('radio',       'Radio',                'radio')  +
        sideMenuItem('refresh',     'Actualiser',           'refresh')+
        sideMenuItem('recordings',  'Enregistrements',      'rec')    +
        sideMenuItem('calendar',    'Calendrier',           'cal')    +
        '<li class="sm-separator"></li>' +
        sideMenuItem('connexions',  'Connexions',           'plug')   +
        sideMenuItem('settings',    'Paramètres',           'gear')   +
        sideMenuItem('catorder',    'Modifier la catégorie','edit')   +
        sideMenuItem('about',       'À propos',             'info')   +
      '</ul>' +
    '</div>';
  document.body.appendChild(menu);

  menu.querySelector('.sm-backdrop').addEventListener('click', closeSideMenu);

  menu.querySelectorAll('.sm-item').forEach(function(el) {
    var action = el.getAttribute('data-action');
    var run = function() { handleSideMenuAction(action); };
    el.addEventListener('click', run);
    el.addEventListener('keydown', function(e) { if (e.key === 'Enter') run(); if (e.key === 'Escape') closeSideMenu(); });
  });

  // Close on Escape anywhere
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && menu.style.display !== 'none') {
      closeSideMenu();
    }
  });
}

function sideMenuItem(action, label, icon) {
  var iconSvg = sideMenuIcon(icon);
  return '<li class="sm-item focusable" tabindex="0" data-action="' + action + '">' +
    '<span class="sm-item-icon">' + iconSvg + '</span>' +
    '<span class="sm-item-label">' + label + '</span>' +
  '</li>';
}

function sideMenuIcon(name) {
  var icons = {
    play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="14" rx="2"/><polygon points="10,8 10,14 15,11" fill="currentColor"/><line x1="9" y1="20" x2="15" y2="20"/></svg>',
    movie: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M17 9h4M3 14h4M17 14h4"/></svg>',
    series: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="6" height="14" rx="1"/><rect x="9" y="7" width="6" height="12" rx="1"/><rect x="15" y="9" width="6" height="10" rx="1"/></svg>',
    radio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M5 12a7 7 0 0114 0M2 12a10 10 0 0120 0"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23,4 23,10 17,10"/><path d="M20.49 15A9 9 0 1 1 19 6"/></svg>',
    rec: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4" fill="currentColor"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/></svg>',
    plug: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 7V3M15 7V3M5 11h14v3a5 5 0 01-5 5h-4a5 5 0 01-5-5v-3z"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };
  return icons[name] || icons.info;
}

function openSideMenu() {
  buildSideMenu();
  var menu = document.getElementById('sideMenu');
  if (!menu) return;
  menu.style.display = 'flex';
  // Mark current screen as active
  var current = AppState.activeScreen;
  menu.querySelectorAll('.sm-item').forEach(function(el) {
    el.classList.toggle('active', el.getAttribute('data-action') === current);
  });
  setTimeout(function() {
    var active = menu.querySelector('.sm-item.active') || menu.querySelector('.sm-item');
    if (active) active.focus();
  }, 80);
}

function closeSideMenu() {
  var menu = document.getElementById('sideMenu');
  if (menu) menu.style.display = 'none';
}

function handleSideMenuAction(action) {
  closeSideMenu();
  switch (action) {
    case 'live':       try { showScreen('live'); } catch (e) {} break;
    case 'vod':        try { showScreen('vod'); } catch (e) {} break;
    case 'series':     try { showScreen('series'); } catch (e) {} break;
    case 'radio':      showToast('Radio : utilisez la catégorie Radio dans Live TV'); break;
    case 'refresh':    showToast('Actualisation...'); setTimeout(function() { location.reload(); }, 400); break;
    case 'recordings': showRecordingsModal(); break;
    case 'calendar':   showToast('Calendrier : programmation EPG dans EPG Guide'); try { showScreen('epg'); } catch (e) {} break;
    case 'connexions': try { stopPlayer && stopPlayer(); } catch (e) {} try { showScreen('login'); } catch (e) {} break;
    case 'settings':   try { showScreen('settings'); } catch (e) {} break;
    case 'catorder':   openCategoryOrderEditor(); break;
    case 'about':      showAboutModal(); break;
  }
}


function showRecordingsModal() {
  if (typeof Recordings === 'undefined' || !Recordings.list || Recordings.list.length === 0) {
    showToast('Aucun enregistrement');
    return;
  }
  var lines = Recordings.list.slice(0, 30).map(function(r, i) {
    return (i + 1) + '. ' + r.name + ' — ' + new Date(r.startedAt).toLocaleString();
  });
  alert('Enregistrements (' + Recordings.list.length + ') :\n\n' + lines.join('\n'));
}

function showAboutModal() {
  var version = (typeof APP_VERSION !== 'undefined') ? APP_VERSION : '3.1.0';
  alert('iPremTvOnline v' + version + '\n\n' +
        'Lecteur natif ExoPlayer (HEVC, AC3/EAC3, DTS)\n' +
        'Compatible Xtream Codes, Stalker Portal, M3U\n' +
        'Multi-langue (6) — Picture-in-Picture\n' +
        'Enregistrements — Sync Cloud — AES-256');
}


// ========== Category Order Editor ==========
function openCategoryOrderEditor() {
  var existing = document.getElementById('catOrderModal');
  if (existing) existing.remove();

  // Pick current section automatically
  var currentSection = AppState.activeScreen;
  if (currentSection !== 'live' && currentSection !== 'vod' && currentSection !== 'series') {
    currentSection = 'live';
  }

  var modal = document.createElement('div');
  modal.id = 'catOrderModal';
  modal.className = 'modal catorder-modal';
  modal.innerHTML =
    '<div class="modal-backdrop"></div>' +
    '<div class="modal-content catorder-content">' +
      '<div class="catorder-header">' +
        '<button class="catorder-back focusable" id="catOrderBack" tabindex="0">↶</button>' +
        '<h2>Modifier l\'ordre des catégories</h2>' +
        '<select id="catOrderSection" class="catorder-section-sel">' +
          '<option value="live"' + (currentSection === 'live' ? ' selected' : '') + '>Télévision en direct</option>' +
          '<option value="vod"' + (currentSection === 'vod' ? ' selected' : '') + '>VOD / Films</option>' +
          '<option value="series"' + (currentSection === 'series' ? ' selected' : '') + '>Séries</option>' +
        '</select>' +
      '</div>' +
      '<div class="catorder-help">Réorganisez vos catégories. Belgique en premier, France ensuite, ce que vous voulez.</div>' +
      '<ul class="catorder-list" id="catOrderList"></ul>' +
      '<div class="catorder-actions">' +
        '<button class="btn btn-secondary focusable" id="catOrderReset" tabindex="0">Réinitialiser</button>' +
        '<button class="btn btn-primary focusable" id="catOrderSave" tabindex="0">Enregistrer</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(modal);
  modal.style.display = 'flex';

  var close = function() { try { modal.remove(); } catch (e) {} };
  modal.querySelector('#catOrderBack').addEventListener('click', close);
  modal.querySelector('.modal-backdrop').addEventListener('click', close);

  var renderList = function(section) {
    var cats = getCategoriesForSection(section);
    var order = getCategoryOrder(section);
    var hidden = getCategoryHidden(section);

    // Apply saved order
    if (order && order.length) {
      var byId = {};
      cats.forEach(function(c) { byId[c.category_id] = c; });
      var ordered = [];
      var seen = {};
      order.forEach(function(id) { if (byId[id]) { ordered.push(byId[id]); seen[id] = true; } });
      cats.forEach(function(c) { if (!seen[c.category_id]) ordered.push(c); });
      cats = ordered;
    }

    var ul = document.getElementById('catOrderList');
    ul.innerHTML = '';
    cats.forEach(function(cat, idx) {
      var isHidden = hidden.indexOf(cat.category_id) !== -1;
      var li = document.createElement('li');
      li.className = 'catorder-item focusable' + (isHidden ? ' hidden-cat' : '');
      li.tabIndex = 0;
      li.setAttribute('data-id', cat.category_id);
      li.innerHTML =
        '<span class="catorder-num">' + (idx + 1) + '</span>' +
        '<span class="catorder-name">' + escapeHtmlSafe(cat.category_name) + '</span>' +
        '<div class="catorder-controls">' +
          '<button class="catorder-btn btn-up focusable" tabindex="0" title="Monter">▲</button>' +
          '<button class="catorder-btn btn-down focusable" tabindex="0" title="Descendre">▼</button>' +
          '<button class="catorder-btn btn-pin focusable" tabindex="0" title="Épingler en haut">📌</button>' +
          '<button class="catorder-btn btn-toggle focusable" tabindex="0" title="' + (isHidden ? 'Afficher' : 'Cacher') + '">' + (isHidden ? '👁' : '🚫') + '</button>' +
        '</div>';
      ul.appendChild(li);
    });

    // Wire buttons
    ul.querySelectorAll('.catorder-item').forEach(function(item, idx) {
      var id = item.getAttribute('data-id');
      item.querySelector('.btn-up').addEventListener('click', function(e) {
        e.stopPropagation();
        var arr = Array.from(ul.children).map(function(li) { return li.getAttribute('data-id'); });
        if (idx > 0) { var t = arr[idx]; arr[idx] = arr[idx - 1]; arr[idx - 1] = t; saveOrderAndRender(section, arr); }
      });
      item.querySelector('.btn-down').addEventListener('click', function(e) {
        e.stopPropagation();
        var arr = Array.from(ul.children).map(function(li) { return li.getAttribute('data-id'); });
        if (idx < arr.length - 1) { var t = arr[idx]; arr[idx] = arr[idx + 1]; arr[idx + 1] = t; saveOrderAndRender(section, arr); }
      });
      item.querySelector('.btn-pin').addEventListener('click', function(e) {
        e.stopPropagation();
        var arr = Array.from(ul.children).map(function(li) { return li.getAttribute('data-id'); });
        arr = [id].concat(arr.filter(function(x) { return x !== id; }));
        saveOrderAndRender(section, arr);
      });
      item.querySelector('.btn-toggle').addEventListener('click', function(e) {
        e.stopPropagation();
        var h = getCategoryHidden(section);
        if (h.indexOf(id) !== -1) h = h.filter(function(x) { return x !== id; });
        else h.push(id);
        setCategoryHidden(section, h);
        renderList(section);
      });
    });
  };

  var saveOrderAndRender = function(section, arr) {
    setCategoryOrder(section, arr);
    renderList(section);
  };

  document.getElementById('catOrderSection').addEventListener('change', function(e) {
    renderList(e.target.value);
  });
  document.getElementById('catOrderReset').addEventListener('click', function() {
    var s = document.getElementById('catOrderSection').value;
    setCategoryOrder(s, []);
    setCategoryHidden(s, []);
    renderList(s);
    showToast('Réinitialisé');
  });
  document.getElementById('catOrderSave').addEventListener('click', function() {
    showToast('Ordre enregistré');
    close();
    // Trigger a refresh of the relevant screen if currently shown
    try {
      var s = document.getElementById('catOrderSection').value;
      if (AppState.activeScreen === s) {
        // Re-init screen to apply new order
        if (typeof window.showScreen === 'function') {
          var prev = AppState.activeScreen;
          AppState.activeScreen = '';
          showScreen(prev);
        }
      }
    } catch (e) {}
  });

  renderList(currentSection);
}

function getCategoriesForSection(section) {
  if (section === 'live') return (AppState.liveCategories || []).slice();
  if (section === 'vod') return (AppState.vodCategories || []).slice();
  if (section === 'series') return (AppState.seriesCategories || []).slice();
  return [];
}

function categoryStorageKey(section, suffix) {
  var pk = (typeof portalKey === 'function') ? portalKey() : 'default';
  return 'iprem_cat' + suffix + '_' + pk + '_' + section;
}

function getCategoryOrder(section) {
  try { return JSON.parse(localStorage.getItem(categoryStorageKey(section, 'order')) || '[]'); } catch (e) { return []; }
}
function setCategoryOrder(section, ids) {
  localStorage.setItem(categoryStorageKey(section, 'order'), JSON.stringify(ids));
}
function getCategoryHidden(section) {
  try { return JSON.parse(localStorage.getItem(categoryStorageKey(section, 'hidden')) || '[]'); } catch (e) { return []; }
}
function setCategoryHidden(section, ids) {
  localStorage.setItem(categoryStorageKey(section, 'hidden'), JSON.stringify(ids));
}

// Apply order + hidden filter to a category list
function applyCategoryPrefs(section, categories) {
  if (!categories || !categories.length) return categories;
  var order = getCategoryOrder(section);
  var hidden = getCategoryHidden(section);
  var byId = {};
  categories.forEach(function(c) { byId[c.category_id] = c; });
  var result = [];
  var seen = {};
  if (order && order.length) {
    order.forEach(function(id) {
      if (byId[id] && hidden.indexOf(id) === -1) { result.push(byId[id]); seen[id] = true; }
    });
  }
  categories.forEach(function(c) {
    if (!seen[c.category_id] && hidden.indexOf(c.category_id) === -1) result.push(c);
  });
  return result;
}


// ========== Add hamburger button to top-bars ==========
function addHamburgerButtons() {
  document.querySelectorAll('.top-bar .top-bar-left').forEach(function(left) {
    if (left.querySelector('.btn-hamburger')) return;
    var b = document.createElement('button');
    b.className = 'btn-icon focusable btn-hamburger';
    b.tabIndex = 0;
    b.title = 'Menu';
    b.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
    b.addEventListener('click', openSideMenu);
    b.addEventListener('keydown', function(e) { if (e.key === 'Enter') openSideMenu(); });
    left.insertBefore(b, left.firstChild);
  });
}

// Patch loadLiveStreams / etc. to apply category prefs
function patchCategoryLoaders() {
  // Hook into the original render of category sidebars
  if (typeof window.loadLiveStreams === 'function' && !window._patchedLiveCats) {
    var orig = window.loadLiveStreams;
    window.loadLiveStreams = async function() {
      var r = await orig.apply(this, arguments);
      try {
        if (AppState.liveCategories && Array.isArray(AppState.liveCategories)) {
          AppState.liveCategories = applyCategoryPrefs('live', AppState.liveCategories);
        }
      } catch (e) {}
      return r;
    };
    window._patchedLiveCats = true;
  }

  // Wrap the screen init functions to apply prefs after categories arrive
  ['initLiveScreen', 'initVodScreen', 'initSeriesScreen'].forEach(function(fn) {
    if (typeof window[fn] === 'function' && !window['_p_' + fn]) {
      var orig = window[fn];
      window[fn] = function() {
        var r = orig.apply(this, arguments);
        setTimeout(function() {
          try {
            if (fn === 'initLiveScreen' && AppState.liveCategories) AppState.liveCategories = applyCategoryPrefs('live', AppState.liveCategories);
            if (fn === 'initVodScreen' && AppState.vodCategories) AppState.vodCategories = applyCategoryPrefs('vod', AppState.vodCategories);
            if (fn === 'initSeriesScreen' && AppState.seriesCategories) AppState.seriesCategories = applyCategoryPrefs('series', AppState.seriesCategories);
          } catch (e) {}
        }, 800);
        return r;
      };
      window['_p_' + fn] = true;
    }
  });
}


function injectSideMenuStyles() {
  if (document.getElementById('iprem-sidemenu-styles')) return;
  var s = document.createElement('style');
  s.id = 'iprem-sidemenu-styles';
  s.textContent =
    '.side-menu{position:fixed;inset:0;z-index:300;display:flex}' +
    '.side-menu .sm-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.45);backdrop-filter:blur(3px)}' +
    '.side-menu .sm-panel{position:relative;width:320px;height:100vh;background:linear-gradient(180deg,rgba(15,23,42,.96) 0%,rgba(30,41,59,.96) 100%);padding:24px 0;display:flex;flex-direction:column;box-shadow:6px 0 30px rgba(0,0,0,.5);overflow-y:auto}' +
    '.sm-logo{display:flex;align-items:center;gap:12px;padding:0 24px 20px 24px;border-bottom:1px solid rgba(255,255,255,.05)}' +
    '.sm-logo-text{color:#fff;font-size:18px;font-weight:600}' +
    '.sm-items{list-style:none;padding:14px 12px;margin:0;flex:1}' +
    '.sm-item{display:flex;align-items:center;gap:14px;padding:14px 18px;border-radius:30px;cursor:pointer;color:#cbd5e1;font-size:15px;transition:all .15s;outline:none}' +
    '.sm-item .sm-item-icon{width:22px;height:22px;color:#94a3b8;display:flex;align-items:center;justify-content:center}' +
    '.sm-item .sm-item-icon svg{width:22px;height:22px}' +
    '.sm-item:hover, .sm-item:focus{background:rgba(59,130,246,.15);color:#fff}' +
    '.sm-item:focus .sm-item-icon, .sm-item:hover .sm-item-icon{color:#60a5fa}' +
    '.sm-item.active{background:linear-gradient(90deg,#3b82f6 0%,#2563eb 100%);color:#fff}' +
    '.sm-item.active .sm-item-icon{color:#fff}' +
    '.sm-separator{height:1px;background:rgba(255,255,255,.08);margin:14px 18px}' +
    '.btn-hamburger{background:transparent;border:none;color:#fff;padding:6px;margin-right:8px;cursor:pointer;border-radius:6px}' +
    '.btn-hamburger:hover, .btn-hamburger:focus{background:rgba(255,255,255,.1);outline:none}' +
    // Category order modal
    '.catorder-modal{display:flex;align-items:center;justify-content:center;position:fixed;inset:0;z-index:250}' +
    '.catorder-content{max-width:640px;width:92%;max-height:88vh;background:#0f172a;border-radius:14px;padding:22px;display:flex;flex-direction:column;overflow:hidden}' +
    '.catorder-header{display:flex;align-items:center;gap:14px;margin-bottom:8px}' +
    '.catorder-header h2{flex:1;color:#fff;margin:0;font-size:18px}' +
    '.catorder-back{background:transparent;border:none;color:#fff;font-size:22px;cursor:pointer;padding:6px 10px;border-radius:6px}' +
    '.catorder-back:hover, .catorder-back:focus{background:#334155;outline:none}' +
    '.catorder-section-sel{padding:6px 10px;background:#1e293b;color:#fff;border:1px solid #334155;border-radius:6px;font-size:13px}' +
    '.catorder-help{color:#94a3b8;font-size:12px;margin:8px 0 14px 0}' +
    '.catorder-list{list-style:none;padding:0;margin:0;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:6px}' +
    '.catorder-item{display:flex;align-items:center;gap:10px;padding:10px 14px;background:#1e293b;border-radius:8px;color:#e2e8f0;outline:none}' +
    '.catorder-item:focus{box-shadow:0 0 0 2px #3b82f6}' +
    '.catorder-item.hidden-cat{opacity:.5;background:#0f172a}' +
    '.catorder-num{font-family:monospace;color:#64748b;font-size:13px;width:28px}' +
    '.catorder-name{flex:1;font-size:14px}' +
    '.catorder-controls{display:flex;gap:4px}' +
    '.catorder-btn{background:#334155;border:none;color:#fff;width:34px;height:30px;border-radius:6px;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center}' +
    '.catorder-btn:hover, .catorder-btn:focus{background:#3b82f6;outline:none}' +
    '.catorder-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:14px;padding-top:14px;border-top:1px solid #1e293b}';
  document.head.appendChild(s);
}


// ========== Bootstrap ==========
window.addEventListener('DOMContentLoaded', function() {
  injectSideMenuStyles();
  setTimeout(function() {
    buildSideMenu();
    addHamburgerButtons();
    patchCategoryLoaders();

    // Re-add hamburger when screens change (some screens lazy-render)
    if (typeof window.showScreen === 'function') {
      var orig = window.showScreen;
      window.showScreen = function(id) {
        var r = orig.apply(this, arguments);
        setTimeout(addHamburgerButtons, 60);
        return r;
      };
    }
  }, 700);
});
