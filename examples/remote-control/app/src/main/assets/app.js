/* ============================================
   iPremTvOnline - IPTV Web Application
   ============================================ */

// ============================================
// Xtream Codes API Client
// ============================================
class XtreamAPI {
  constructor(server, username, password) {
    this.baseUrl = server.replace(/\/+$/, '');
    this.username = username;
    this.password = password;
  }

  async request(params = {}) {
    const url = new URL(this.baseUrl + '/player_api.php');
    url.searchParams.set('username', this.username);
    url.searchParams.set('password', this.password);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error('Server returned ' + res.status);
    }
    return res.json();
  }

  // Auth & account info
  async login() {
    return this.request();
  }

  // Live TV
  async getLiveCategories() {
    return this.request({ action: 'get_live_categories' });
  }

  async getLiveStreams(categoryId) {
    const params = { action: 'get_live_streams' };
    if (categoryId) params.category_id = categoryId;
    return this.request(params);
  }

  async getShortEPG(streamId) {
    return this.request({ action: 'get_short_epg', stream_id: streamId });
  }

  async getFullEPG(streamId) {
    return this.request({ action: 'get_simple_data_table', stream_id: streamId });
  }

  // VOD
  async getVodCategories() {
    return this.request({ action: 'get_vod_categories' });
  }

  async getVodStreams(categoryId) {
    const params = { action: 'get_vod_streams' };
    if (categoryId) params.category_id = categoryId;
    return this.request(params);
  }

  async getVodInfo(vodId) {
    return this.request({ action: 'get_vod_info', vod_id: vodId });
  }

  // Series
  async getSeriesCategories() {
    return this.request({ action: 'get_series_categories' });
  }

  async getSeries(categoryId) {
    const params = { action: 'get_series' };
    if (categoryId) params.category_id = categoryId;
    return this.request(params);
  }

  async getSeriesInfo(seriesId) {
    return this.request({ action: 'get_series_info', series_id: seriesId });
  }

  // Catchup / Timeshift
  async getCatchupEPG(streamId, date) {
    return this.request({
      action: 'get_simple_data_table',
      stream_id: streamId
    });
  }

  // Stream URLs
  liveUrl(streamId, ext) {
    ext = ext || 'm3u8';
    return this.baseUrl + '/live/' + this.username + '/' + this.password + '/' + streamId + '.' + ext;
  }

  vodUrl(streamId, ext) {
    ext = ext || 'mp4';
    return this.baseUrl + '/movie/' + this.username + '/' + this.password + '/' + streamId + '.' + ext;
  }

  seriesUrl(episodeId, ext) {
    ext = ext || 'mp4';
    return this.baseUrl + '/series/' + this.username + '/' + this.password + '/' + episodeId + '.' + ext;
  }

  timeshiftUrl(streamId, start, duration) {
    return this.baseUrl + '/timeshift/' + this.username + '/' + this.password + '/' + duration + '/' + start + '/' + streamId + '.m3u8';
  }
}


// ============================================
// Application State
// ============================================
const AppState = {
  api: null,
  userInfo: null,
  serverInfo: null,
  activeScreen: 'login',
  screenHistory: [],

  // Live
  liveCategories: [],
  liveStreams: [],
  allLiveStreams: [],
  selectedLiveCategory: null,
  selectedChannel: null,
  currentChannelIndex: -1,
  sortMode: 'default', // 'default', 'name', 'number'

  // VOD
  vodCategories: [],
  vodStreams: [],
  selectedVodCategory: null,
  selectedVod: null,

  // Series
  seriesCategories: [],
  seriesList: [],
  selectedSeriesCategory: null,
  selectedSeries: null,
  selectedSeason: null,
  seriesInfo: null,

  // Catchup
  catchupChannels: [],
  selectedCatchupChannel: null,
  selectedCatchupDate: null,
  catchupPrograms: [],

  // Player
  isPlaying: false,
  playerOverlayVisible: false,
  overlayTimeout: null,
  channelOsdTimeout: null,
  osdNumberInput: '',
  osdInputTimeout: null,
  volume: 1.0,
  isMuted: false,

  // Settings
  settings: {
    streamType: 'm3u8',
    bufferSize: 3,
    timezoneOffset: 0,
    parentalPin: ''
  },

  // Favorites
  favorites: {},

  // Portals
  portals: []
};


// ============================================
// Storage helpers
// ============================================
function loadFromStorage(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
}

function loadPortals() {
  AppState.portals = loadFromStorage('iprem_portals', []);
}

function savePortals() {
  saveToStorage('iprem_portals', AppState.portals);
}

function loadSettings() {
  AppState.settings = loadFromStorage('iprem_settings', AppState.settings);
}

function saveSettings() {
  saveToStorage('iprem_settings', AppState.settings);
}

function portalKey() {
  if (!AppState.api) return 'default';
  return AppState.api.baseUrl + '_' + AppState.api.username;
}

function loadFavorites() {
  AppState.favorites = loadFromStorage('iprem_favorites_' + portalKey(), {});
}

function saveFavorites() {
  saveToStorage('iprem_favorites_' + portalKey(), AppState.favorites);
}


// ============================================
// Toast notification
// ============================================
let toastTimer = null;
function showToast(message, duration) {
  duration = duration || 3000;
  const el = document.getElementById('toast');
  el.textContent = message;
  el.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function() {
    el.style.display = 'none';
  }, duration);
}


// ============================================
// Clock
// ============================================
function updateClocks() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  var clocks = document.querySelectorAll('.clock');
  clocks.forEach(function(c) { c.textContent = timeStr; });
  var bannerClock = document.getElementById('bannerClock');
  if (bannerClock) bannerClock.textContent = timeStr;
}

setInterval(updateClocks, 1000);
updateClocks();


// ============================================
// Navigation / Router
// ============================================
function showScreen(screenId) {
  if (screenId === AppState.activeScreen) return;

  // Push current to history
  if (AppState.activeScreen && AppState.activeScreen !== 'login') {
    AppState.screenHistory.push(AppState.activeScreen);
  }

  var screens = document.querySelectorAll('.screen');
  screens.forEach(function(s) {
    s.classList.remove('active');
    if (s.id === 'player') {
      s.style.display = 'none';
    }
  });

  var target = document.getElementById(screenId);
  if (target) {
    if (screenId === 'player') {
      target.style.display = 'flex';
    }
    target.classList.add('active');
  }

  AppState.activeScreen = screenId;

  // Screen-specific init
  switch (screenId) {
    case 'live':
      initLiveScreen();
      break;
    case 'vod':
      initVodScreen();
      break;
    case 'series':
      initSeriesScreen();
      break;
    case 'catchup':
      initCatchupScreen();
      break;
    case 'epg':
      initEpgScreen();
      break;
    case 'settings':
      initSettingsScreen();
      break;
  }
}

function goBack() {
  if (AppState.activeScreen === 'player') {
    stopPlayer();
    return;
  }

  if (AppState.screenHistory.length > 0) {
    var prev = AppState.screenHistory.pop();
    var screens = document.querySelectorAll('.screen');
    screens.forEach(function(s) {
      s.classList.remove('active');
      if (s.id === 'player') s.style.display = 'none';
    });
    var target = document.getElementById(prev);
    if (target) target.classList.add('active');
    AppState.activeScreen = prev;
  }
}


// ============================================
// Login Screen
// ============================================
function initLoginScreen() {
  loadPortals();
  renderPortalList();
  loadSettings();

  var form = document.getElementById('loginForm');
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    doLogin();
  });

  document.getElementById('btnAddPortal').addEventListener('click', addPortal);
}

function renderPortalList() {
  var list = document.getElementById('portalList');
  var container = document.getElementById('savedPortals');

  if (AppState.portals.length === 0) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  list.innerHTML = '';

  AppState.portals.forEach(function(portal, index) {
    var li = document.createElement('li');
    li.className = 'portal-item focusable';
    li.tabIndex = 0;
    li.innerHTML =
      '<div class="portal-item-info">' +
        '<span class="portal-item-name">' + escapeHtml(portal.name || portal.username) + '</span>' +
        '<span class="portal-item-url">' + escapeHtml(portal.server) + '</span>' +
      '</div>' +
      '<div class="portal-item-actions">' +
        '<button class="portal-delete-btn" data-index="' + index + '" title="Delete">&times;</button>' +
      '</div>';

    li.addEventListener('click', function(e) {
      if (e.target.classList.contains('portal-delete-btn')) {
        deletePortal(parseInt(e.target.getAttribute('data-index')));
        return;
      }
      document.getElementById('serverUrl').value = portal.server;
      document.getElementById('username').value = portal.username;
      document.getElementById('password').value = portal.password;
      doLogin();
    });

    li.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        document.getElementById('serverUrl').value = portal.server;
        document.getElementById('username').value = portal.username;
        document.getElementById('password').value = portal.password;
        doLogin();
      }
    });

    list.appendChild(li);
  });
}

function addPortal() {
  var server = document.getElementById('serverUrl').value.trim();
  var username = document.getElementById('username').value.trim();
  var password = document.getElementById('password').value.trim();

  if (!server || !username || !password) {
    showLoginError('Please fill in all fields');
    return;
  }

  // Check for duplicates
  var exists = AppState.portals.some(function(p) {
    return p.server === server && p.username === username;
  });

  if (exists) {
    showToast('Portal already saved');
    return;
  }

  AppState.portals.push({
    name: username + '@' + new URL(server).hostname,
    server: server,
    username: username,
    password: password
  });

  savePortals();
  renderPortalList();
  showToast('Portal saved');
}

function deletePortal(index) {
  AppState.portals.splice(index, 1);
  savePortals();
  renderPortalList();
  showToast('Portal deleted');
}

async function doLogin() {
  var server = document.getElementById('serverUrl').value.trim();
  var username = document.getElementById('username').value.trim();
  var password = document.getElementById('password').value.trim();

  if (!server || !username || !password) {
    showLoginError('Please fill in all fields');
    return;
  }

  showLoginLoading(true);
  hideLoginError();

  try {
    AppState.api = new XtreamAPI(server, username, password);
    var data = await AppState.api.login();

    if (!data || !data.user_info) {
      throw new Error('Invalid response from server');
    }

    if (data.user_info.auth === 0) {
      throw new Error('Authentication failed. Check credentials.');
    }

    AppState.userInfo = data.user_info;
    AppState.serverInfo = data.server_info;

    // Save portal if not already saved
    var exists = AppState.portals.some(function(p) {
      return p.server === server && p.username === username;
    });
    if (!exists) {
      AppState.portals.push({
        name: username + '@' + new URL(server).hostname,
        server: server,
        username: username,
        password: password
      });
      savePortals();
    }

    loadFavorites();
    initHomeScreen();
    showScreen('home');
  } catch (err) {
    showLoginError(err.message || 'Connection failed');
  } finally {
    showLoginLoading(false);
  }
}

function showLoginError(msg) {
  var el = document.getElementById('loginError');
  el.textContent = msg;
  el.style.display = 'block';
}

function hideLoginError() {
  document.getElementById('loginError').style.display = 'none';
}

function showLoginLoading(show) {
  document.getElementById('loginLoading').style.display = show ? 'flex' : 'none';
}


// ============================================
// Home Screen
// ============================================
function initHomeScreen() {
  var portalName = document.getElementById('topPortalName');
  var userInfo = document.getElementById('topUserInfo');
  var greeting = document.getElementById('homeGreeting');

  if (AppState.userInfo) {
    portalName.textContent = AppState.api.username + '@' + new URL(AppState.api.baseUrl).hostname;
    userInfo.textContent = AppState.api.username;

    var hours = new Date().getHours();
    var greetText = hours < 12 ? 'Good Morning' : hours < 18 ? 'Good Afternoon' : 'Good Evening';
    greeting.textContent = greetText + ', ' + AppState.api.username;

    // Account info
    var expiry = AppState.userInfo.exp_date;
    if (expiry) {
      var expDate = new Date(parseInt(expiry) * 1000);
      document.getElementById('homeExpiry').textContent = expDate.toLocaleDateString();
    }

    var maxConn = AppState.userInfo.max_connections;
    var activeConn = AppState.userInfo.active_cons;
    document.getElementById('homeConnections').textContent =
      (activeConn || '0') + '/' + (maxConn || '--');

    var status = AppState.userInfo.status;
    var statusEl = document.getElementById('homeStatus');
    statusEl.textContent = status === 'Active' ? 'Active' : (status || '--');
    statusEl.style.color = status === 'Active' ? '#22c55e' : '#ef4444';
  }

  // Nav cards
  var cards = document.querySelectorAll('.nav-card');
  cards.forEach(function(card) {
    card.addEventListener('click', function() {
      var target = card.getAttribute('data-screen');
      if (target) showScreen(target);
    });
    card.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        var target = card.getAttribute('data-screen');
        if (target) showScreen(target);
      }
    });
  });
}


// ============================================
// Live TV Screen
// ============================================
async function initLiveScreen() {
  if (AppState.liveCategories.length > 0) return; // already loaded

  var categoryList = document.getElementById('liveCategoryList');
  var channelList = document.getElementById('liveChannelList');
  var loading = document.getElementById('liveChannelLoading');

  categoryList.innerHTML = '';
  channelList.innerHTML = '';
  loading.style.display = 'flex';

  try {
    var categories = await AppState.api.getLiveCategories();
    AppState.liveCategories = Array.isArray(categories) ? categories : [];

    // Build category list
    categoryList.innerHTML = '';

    // "All" item
    var allItem = createCategoryItem('All', null, true);
    categoryList.appendChild(allItem);

    // Favorites item
    var favItem = createCategoryItem('★ Favorites', 'favorites', false);
    categoryList.appendChild(favItem);

    AppState.liveCategories.forEach(function(cat) {
      var item = createCategoryItem(cat.category_name, cat.category_id, false);
      categoryList.appendChild(item);
    });

    // Load all streams
    await loadLiveStreams(null);
  } catch (err) {
    showToast('Failed to load channels: ' + err.message);
  } finally {
    loading.style.display = 'none';
  }
}

function createCategoryItem(name, categoryId, active) {
  var li = document.createElement('li');
  li.className = 'category-item focusable' + (active ? ' active' : '');
  li.tabIndex = 0;
  li.textContent = name;
  li.setAttribute('data-category', categoryId || '');

  li.addEventListener('click', function() {
    selectLiveCategory(categoryId, li);
  });

  li.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') selectLiveCategory(categoryId, li);
  });

  return li;
}

async function selectLiveCategory(categoryId, element) {
  // Update active state
  var items = document.querySelectorAll('#liveCategoryList .category-item');
  items.forEach(function(i) { i.classList.remove('active'); });
  if (element) element.classList.add('active');

  AppState.selectedLiveCategory = categoryId;

  if (categoryId === 'favorites') {
    renderFavoriteChannels();
    return;
  }

  await loadLiveStreams(categoryId);
}

async function loadLiveStreams(categoryId) {
  var channelList = document.getElementById('liveChannelList');
  var loading = document.getElementById('liveChannelLoading');
  var titleEl = document.getElementById('liveCategoryTitle');
  var countEl = document.getElementById('liveChannelCount');

  // PAUSE le warmup en background pendant 2s : priorite absolue au clic user
  // (evite que le pre-fetch sature le portail Stalker au moment ou on en a besoin)
  window._warmupPause = Date.now() + 2000;

  // Skeleton INSTANT (place de l'ecran blanc) - apparait < 16ms apres le clic
  if (window.ipremCache && window.ipremCache.showSkeletonChannels) {
    window.ipremCache.showSkeletonChannels(channelList, 14);
  } else {
    channelList.innerHTML = '';
  }
  // Le spinner reste en filigrane mais le skeleton porte le visuel
  if (loading) loading.style.display = 'none';

  try {
    var streams;
    if (!categoryId && AppState.allLiveStreams.length > 0) {
      streams = AppState.allLiveStreams;
    } else {
      streams = await AppState.api.getLiveStreams(categoryId);
      if (!categoryId) AppState.allLiveStreams = streams || [];
    }

    AppState.liveStreams = Array.isArray(streams) ? streams : [];

    // Sort
    if (AppState.sortMode === 'name') {
      AppState.liveStreams.sort(function(a, b) {
        return (a.name || '').localeCompare(b.name || '');
      });
    } else if (AppState.sortMode === 'number') {
      AppState.liveStreams.sort(function(a, b) {
        return (parseInt(a.num) || 0) - (parseInt(b.num) || 0);
      });
    }

    // Title
    if (!categoryId) {
      titleEl.textContent = 'All Channels';
    } else {
      var cat = AppState.liveCategories.find(function(c) {
        return c.category_id === categoryId;
      });
      titleEl.textContent = cat ? cat.category_name : 'Channels';
    }

    countEl.textContent = AppState.liveStreams.length + ' channels';
    renderChannelList();
  } catch (err) {
    showToast('Failed to load streams: ' + err.message);
  } finally {
    loading.style.display = 'none';
  }
}

function renderFavoriteChannels() {
  var favIds = Object.keys(AppState.favorites);
  var titleEl = document.getElementById('liveCategoryTitle');
  var countEl = document.getElementById('liveChannelCount');

  titleEl.textContent = 'Favorites';

  if (favIds.length === 0) {
    AppState.liveStreams = [];
    countEl.textContent = '0 channels';
    var channelList = document.getElementById('liveChannelList');
    channelList.innerHTML = '<li class="placeholder-text">No favorites added yet</li>';
    return;
  }

  // Filter from all streams
  AppState.liveStreams = AppState.allLiveStreams.filter(function(s) {
    return AppState.favorites[s.stream_id];
  });

  countEl.textContent = AppState.liveStreams.length + ' channels';
  renderChannelList();
}

function renderChannelList() {
  var channelList = document.getElementById('liveChannelList');
  channelList.innerHTML = '';

  AppState.liveStreams.forEach(function(stream, index) {
    var li = document.createElement('li');
    li.className = 'channel-item focusable';
    if (AppState.favorites[stream.stream_id]) {
      li.className += ' favorite';
    }
    li.tabIndex = 0;
    li.setAttribute('data-index', index);

    var logoHtml;
    if (stream.stream_icon) {
      logoHtml = '<div class="channel-logo"><img src="' + escapeHtml(stream.stream_icon) + '" alt="" loading="lazy" onerror="this.parentElement.innerHTML=\'<span class=channel-logo-placeholder>' + escapeHtml((stream.name || '?').charAt(0)) + '</span>\'"></div>';
    } else {
      logoHtml = '<div class="channel-logo"><span class="channel-logo-placeholder">' + escapeHtml((stream.name || '?').charAt(0)) + '</span></div>';
    }

    li.innerHTML =
      '<span class="channel-num">' + (stream.num || index + 1) + '</span>' +
      logoHtml +
      '<div class="channel-info">' +
        '<div class="channel-name">' + escapeHtml(stream.name || 'Unknown') + '</div>' +
        '<div class="channel-epg" id="epg_' + stream.stream_id + '"></div>' +
      '</div>';

    li.addEventListener('click', function() {
      selectChannel(index);
    });

    li.addEventListener('dblclick', function() {
      selectChannel(index);
      playChannel(stream);
    });

    li.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        if (AppState.selectedChannel && AppState.selectedChannel.stream_id === stream.stream_id) {
          playChannel(stream);
        } else {
          selectChannel(index);
        }
      }
    });

    // Auto-preview au focus (navigation D-pad sans clic) :
    // remplit le panel droit avec EPG + nom + num des qu'on survole une chaine.
    // Debounce 150ms pour ne pas spam quand l'user scrolle vite.
    li.addEventListener('focus', function() {
      clearTimeout(window._previewDebounce);
      window._previewDebounce = setTimeout(function() {
        selectChannel(index);
      }, 150);
    });

    channelList.appendChild(li);
  });

  // Load EPG for visible channels (batch the first 50)
  loadVisibleEPG();
}

async function loadVisibleEPG() {
  var streams = AppState.liveStreams.slice(0, 50);
  streams.forEach(async function(stream) {
    try {
      var epgData = await AppState.api.getShortEPG(stream.stream_id);
      if (epgData && epgData.epg_listings && epgData.epg_listings.length > 0) {
        var now = epgData.epg_listings[0];
        var el = document.getElementById('epg_' + stream.stream_id);
        if (el) {
          // Decoder robuste : skip si garbage (provider qui encode mal)
          var title = _decodeEpgTitle(now);
          if (title) el.textContent = title;
        }
      }
    } catch (e) {
      // EPG not available for this stream
    }
  });
}

function selectChannel(index) {
  var stream = AppState.liveStreams[index];
  if (!stream) return;

  AppState.selectedChannel = stream;
  AppState.currentChannelIndex = index;

  // Update active state
  var items = document.querySelectorAll('#liveChannelList .channel-item');
  items.forEach(function(item) {
    item.classList.remove('active');
    if (parseInt(item.getAttribute('data-index')) === index) {
      item.classList.add('active');
      item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });

  // Update preview panel
  var previewPlaceholder = document.querySelector('#livePreviewPanel .preview-placeholder');
  var previewContent = document.getElementById('livePreviewContent');
  if (previewPlaceholder) previewPlaceholder.style.display = 'none';
  if (previewContent) previewContent.style.display = 'flex';

  document.getElementById('previewChannelName').textContent = stream.name || 'Unknown';
  document.getElementById('previewChannelNum').textContent = 'Ch. ' + (stream.num || (index + 1));

  loadMiniEPG(stream.stream_id);

  // PRE-RESOLUTION URL Stalker en background -> demarrage instant au clic Play
  if (typeof window.preResolveStalkerForChannel === 'function') {
    window.preResolveStalkerForChannel(stream);
  }
}

function _setText(id, text) {
  var el = document.getElementById(id);
  if (el) el.textContent = text || '';
}

// Check : un texte decode contient-il trop de chars binaires/garbage ?
function _looksLikeText(s) {
  if (!s || s.length < 2) return false;
  if (window.iprem && typeof window.iprem.looksLikeGarbage === 'function') {
    return !window.iprem.looksLikeGarbage(s);
  }
  // Fallback : compte les chars hors ASCII printable + accents communs
  var bad = 0;
  for (var i = 0; i < s.length; i++) {
    var c = s.charCodeAt(i);
    if (c < 32 && c !== 9 && c !== 10 && c !== 13) bad++;
    else if (c > 126 && c < 160) bad++;
    else if (c === 0xFFFD) bad++;
  }
  return (bad / s.length) < 0.25;
}

function _decodeEpgTitle(item) {
  if (!item) return '';
  // Tente atob d'abord MAIS verifie que le resultat n'est pas du garbage
  if (item.title) {
    try {
      var decoded = atob(item.title);
      if (_looksLikeText(decoded)) return decoded;
    } catch (e) {}
  }
  // Fallback : title_decoded fourni par certains providers
  if (item.title_decoded && _looksLikeText(item.title_decoded)) return item.title_decoded;
  // En dernier : titre brut
  return (item.title && _looksLikeText(item.title)) ? item.title : '';
}

function _decodeEpgDesc(item) {
  if (!item) return '';
  if (item.description) {
    try {
      var decoded = atob(item.description);
      if (_looksLikeText(decoded)) return decoded;
    } catch (e) {}
  }
  if (item.description_decoded && _looksLikeText(item.description_decoded)) return item.description_decoded;
  return (item.description && _looksLikeText(item.description)) ? item.description : '';
}

async function loadMiniEPG(streamId) {
  // Reset fiche
  _setText('epgNowTime', '--:--');
  _setText('epgNowTitle', 'Chargement…');
  _setText('epgNowDesc', '');
  _setText('epgNextTime', '');
  _setText('epgNextTitle', '');
  var nextBlock = document.getElementById('epgNextBlock');
  if (nextBlock) nextBlock.style.display = 'none';
  var list = document.getElementById('miniEpgList');
  if (list) list.innerHTML = '';

  try {
    var data = await AppState.api.getShortEPG(streamId);
    var listings = (data && data.epg_listings) ? data.epg_listings : [];

    if (listings.length === 0) {
      _setText('epgNowTitle', 'Pas de programme EPG');
      _setText('epgNowDesc', 'Aucune information disponible pour cette chaîne.');
      return;
    }

    // Now (premier listing)
    var now = listings[0];
    var nowTitle = _decodeEpgTitle(now) || 'Programme en cours';
    var nowDesc = _decodeEpgDesc(now);
    _setText('epgNowTime', formatEpgTime(now.start) + ' · ' + formatEpgTime(now.end));
    _setText('epgNowTitle', nowTitle);
    _setText('epgNowDesc', nowDesc);

    // Next (deuxieme listing) - affiche seulement si dispo
    if (listings.length > 1 && nextBlock) {
      var nxt = listings[1];
      _setText('epgNextTime', formatEpgTime(nxt.start));
      _setText('epgNextTitle', _decodeEpgTitle(nxt) || 'Programme suivant');
      nextBlock.style.display = '';
    }

    // Suite du programme (3-6) en mini-liste
    if (list && listings.length > 2) {
      listings.slice(2, 6).forEach(function(it) {
        var li = document.createElement('li');
        li.className = 'mini-epg-item';
        li.innerHTML =
          '<span class="mini-epg-time">' + formatEpgTime(it.start) + '</span> ' +
          '<span class="mini-epg-title">' + escapeHtml(_decodeEpgTitle(it) || '?') + '</span>';
        list.appendChild(li);
      });
    }
  } catch (e) {
    _setText('epgNowTitle', 'EPG indisponible');
    _setText('epgNowDesc', '');
  }
}

function formatEpgTime(timeStr) {
  if (!timeStr) return '--:--';
  try {
    var d = new Date(timeStr);
    if (isNaN(d.getTime())) return timeStr.substring(11, 16) || timeStr;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return timeStr;
  }
}

function playChannel(stream) {
  // PAUSE TOTALE du warmup pendant 30s pour ne pas concurrencer le portail
  // au moment ou on a besoin de la resolution + du stream
  window._warmupPause = Date.now() + 30000;
  var ext = AppState.settings.streamType || 'm3u8';
  // Si on a deja une URL pre-resolue (pre-fetch au focus), on la passe direct
  var url = stream._resolvedUrl || AppState.api.liveUrl(stream.stream_id, ext);
  startPlayer(url, stream.name, stream.num || '', 'live', stream);
}


// ============================================
// VOD / Movies Screen
// ============================================
async function initVodScreen() {
  if (AppState.vodCategories.length > 0) return;

  var categoryList = document.getElementById('vodCategoryList');
  var loading = document.getElementById('vodLoading');

  categoryList.innerHTML = '';
  loading.style.display = 'flex';

  try {
    var categories = await AppState.api.getVodCategories();
    AppState.vodCategories = Array.isArray(categories) ? categories : [];

    // === SMART CATEGORIES (virtuelles, en tete du menu) ===
    // On garde uniquement ce qui n'existe PAS deja chez le provider :
    // Tous, Favoris (filtre personnel), Recents (historique).
    // Les doublons (Nouveautes/Top/4K/Dolby) sont fournis par le provider lui-meme.
    var smartCats = [
      { id: '__all__',       label: '★ Tous les films' },
      { id: '__favorites__', label: '♥ Favoris' },
      { id: '__recent__',    label: '⏱ Récents' }
    ];
    smartCats.forEach(function(sc, idx) {
      var li = document.createElement('li');
      li.className = 'category-item focusable smart-cat' + (idx === 0 ? ' active' : '');
      li.tabIndex = 0;
      li.textContent = sc.label;
      li.setAttribute('data-smart', sc.id);
      li.addEventListener('click', function() { selectVodCategory(sc.id, li); });
      li.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.keyCode === 13) selectVodCategory(sc.id, li);
      });
      categoryList.appendChild(li);
    });

    // Separator
    var sep = document.createElement('li');
    sep.className = 'category-separator';
    sep.textContent = 'CATÉGORIES';
    categoryList.appendChild(sep);

    // Vraies categories du provider
    AppState.vodCategories.forEach(function(cat) {
      var li = document.createElement('li');
      li.className = 'category-item focusable';
      li.tabIndex = 0;
      li.textContent = cat.category_name;
      li.addEventListener('click', function() {
        selectVodCategory(cat.category_id, li);
      });
      categoryList.appendChild(li);
    });

    await loadVodStreams('__all__');
  } catch (err) {
    showToast('Failed to load movies: ' + err.message);
  } finally {
    loading.style.display = 'none';
  }
}

async function selectVodCategory(categoryId, element) {
  var items = document.querySelectorAll('#vodCategoryList .category-item');
  items.forEach(function(i) { i.classList.remove('active'); });
  if (element) element.classList.add('active');
  AppState.selectedVodCategory = categoryId;
  await loadVodStreams(categoryId);
}

async function loadVodStreams(categoryId) {
  var grid = document.getElementById('vodGrid');
  var loading = document.getElementById('vodLoading');
  var titleEl = document.getElementById('vodCategoryTitle');
  var countEl = document.getElementById('vodCount');

  loading.style.display = 'flex';
  // Skeleton instant
  if (window.ipremCache && window.ipremCache.showSkeletonCards) {
    window.ipremCache.showSkeletonCards(grid, 18);
  } else {
    grid.innerHTML = '';
  }
  window._warmupPause = Date.now() + 2000;

  try {
    var streams;
    // Smart categories : filtres virtuels sur l'ensemble du catalogue
    if (categoryId && categoryId.indexOf('__') === 0) {
      streams = await loadVodSmartCat(categoryId);
      titleEl.textContent = _smartCatLabel(categoryId);
    } else {
      streams = await AppState.api.getVodStreams(categoryId);
      if (!categoryId) titleEl.textContent = 'Tous les films';
      else {
        var cat = AppState.vodCategories.find(function(c) { return c.category_id === categoryId; });
        titleEl.textContent = cat ? cat.category_name : 'Films';
      }
    }
    AppState.vodStreams = Array.isArray(streams) ? streams : [];
    countEl.textContent = AppState.vodStreams.length + ' films';
    renderVodGrid();
  } catch (err) {
    showToast('Failed to load movies: ' + err.message);
  } finally {
    loading.style.display = 'none';
  }
}

// Resout une smart-category vers une liste de films filtree
async function loadVodSmartCat(smartId) {
  // Charge tout le catalogue si pas deja en cache (warmup l'a peut-etre fait)
  var all = AppState.vodAllStreams;
  if (!all || !all.length) {
    all = await AppState.api.getVodStreams();
    AppState.vodAllStreams = Array.isArray(all) ? all : [];
    all = AppState.vodAllStreams;
  }
  if (!all.length) return [];

  switch (smartId) {
    case '__all__':
      return all;
    case '__favorites__':
      // Favoris VOD : AppState.favorites contient stream_id mappes a true
      var favIds = AppState.favorites || {};
      return all.filter(function(v) { return !!favIds[v.stream_id]; });
    case '__recent__':
      // Films de l'historique watch-progress (avec progress > 0)
      var progressList = [];
      try { progressList = (window.iprem && window.iprem.progress) ? window.iprem.progress.list(50) : []; }
      catch (e) {}
      var recentIds = {};
      progressList.forEach(function(p) {
        var id = String(p.id || '').replace(/^vod_/, '');
        recentIds[id] = (p.updatedAt || 0);
      });
      return all
        .filter(function(v) { return recentIds[v.stream_id] != null; })
        .sort(function(a, b) { return (recentIds[b.stream_id] || 0) - (recentIds[a.stream_id] || 0); });
    case '__new__':
      // Trie par 'added' DESC (Xtream renvoie un timestamp)
      return all.slice().sort(function(a, b) {
        var ta = parseInt(a.added) || 0, tb = parseInt(b.added) || 0;
        return tb - ta;
      }).slice(0, 200);
    case '__top__':
      return all.slice().sort(function(a, b) {
        return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
      }).slice(0, 100);
    case '__4k__':
      return all.filter(function(v) {
        return /\b(4K|UHD|HDR|HDR10)\b/i.test(v.name || '');
      });
    case '__dv__':
      return all.filter(function(v) {
        return /\b(DOLBY[ _-]?VISION|DV|DOVI)\b/i.test(v.name || '');
      });
  }
  return [];
}

function _smartCatLabel(id) {
  var map = {
    '__all__': 'Tous les films',
    '__favorites__': '♥ Favoris',
    '__recent__': '⏱ Récemment regardés',
    '__new__': '✨ Nouveautés',
    '__top__': '🏆 Top 100',
    '__4k__': '◆ 4K / HDR',
    '__dv__': '◇ Dolby Vision'
  };
  return map[id] || 'Films';
}

function renderVodGrid() {
  var grid = document.getElementById('vodGrid');
  grid.innerHTML = '';

  AppState.vodStreams.forEach(function(vod) {
    var card = document.createElement('div');
    card.className = 'vod-card focusable';
    card.tabIndex = 0;

    var posterHtml;
    if (vod.stream_icon) {
      posterHtml = '<div class="vod-poster"><img src="' + escapeHtml(vod.stream_icon) + '" alt="" loading="lazy" onerror="this.style.display=\'none\';this.parentElement.innerHTML=\'<div class=vod-poster-placeholder>🎬</div>\'"></div>';
    } else {
      posterHtml = '<div class="vod-poster"><div class="vod-poster-placeholder">🎬</div></div>';
    }

    if (vod.rating) {
      posterHtml = posterHtml.replace('</div>', '<span class="vod-rating">' + escapeHtml(String(vod.rating)) + '</span></div>');
    }

    var year = '';
    if (vod.added) {
      try {
        year = new Date(parseInt(vod.added) * 1000).getFullYear();
      } catch (e) {
        year = '';
      }
    }
    if (vod.releaseDate) {
      year = String(vod.releaseDate).substring(0, 4);
    }

    // Nettoyage : "|FR| Film Name 2025 MULTIVFF 4K HDR" -> "Film Name"
    var rawTitle = vod.name || 'Unknown';
    var cleanedTitle = rawTitle;
    var qualityTag = '';
    if (window.ipremPoster && window.ipremPoster.cleanTitle) {
      cleanedTitle = window.ipremPoster.cleanTitle(rawTitle) || rawTitle;
      // Extraction de la qualite pour afficher en pill
      var qm = rawTitle.match(/\b(4K|UHD|HDR|FHD|HD|DOLBY VISION|DV)\b/i);
      if (qm) qualityTag = qm[0].toUpperCase();
    }
    // Extraction langue (VF/VFF/VOSTFR/MULTI)
    var langTag = '';
    var lm = rawTitle.match(/\b(MULTIVFF|MULTIVFQ|MULTIVF|MULTI|VFF|VFQ|VOSTFR|VOSTEN|VFI|VF|VO|VEQ)\b/i);
    if (lm) langTag = lm[0].toUpperCase();

    var metaLine = '';
    if (year) metaLine += '<span class="meta-pill">' + escapeHtml(year) + '</span>';
    if (qualityTag) metaLine += '<span class="meta-pill quality">' + qualityTag + '</span>';
    if (langTag) metaLine += '<span class="meta-pill lang">' + langTag + '</span>';

    card.innerHTML = posterHtml +
      '<div class="vod-card-info">' +
        '<div class="vod-card-title">' + escapeHtml(cleanedTitle) + '</div>' +
        (metaLine ? '<div class="vod-card-meta">' + metaLine + '</div>' : '') +
      '</div>';

    card.addEventListener('click', function() {
      showVodDetail(vod);
    });

    card.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') showVodDetail(vod);
    });

    // Auto-populate hero banner au focus (D-pad navigation)
    card.addEventListener('focus', function() {
      clearTimeout(window._vodHeroDebounce);
      window._vodHeroDebounce = setTimeout(function() {
        updateVodHero(vod);
      }, 180);
    });

    grid.appendChild(card);
  });
}

// Remplit le hero banner en haut avec backdrop + infos enrichies TMDB
async function updateVodHero(vod) {
  var hero = document.getElementById('vodHero');
  if (!hero) return;
  hero.style.display = '';

  var titleEl = document.getElementById('vodHeroTitle');
  var metaEl = document.getElementById('vodHeroMeta');
  var descEl = document.getElementById('vodHeroDesc');
  var castEl = document.getElementById('vodHeroCast');
  var bgEl = document.getElementById('vodHeroBg');

  // Guard : si l'ecran n'est pas encore monte (focus tres rapide en navigation),
  // bgEl peut etre null -> abort proprement plutot que de throw
  if (!titleEl || !metaEl || !descEl || !castEl || !bgEl) return;

  // Reset visuel pendant la transition
  bgEl.style.backgroundImage = vod.stream_icon ? 'url(' + vod.stream_icon + ')' : '';

  // Titre nettoye
  var rawTitle = vod.name || 'Sans titre';
  var displayTitle = (window.ipremPoster && window.ipremPoster.cleanTitle)
    ? window.ipremPoster.cleanTitle(rawTitle)
    : rawTitle;
  titleEl.textContent = displayTitle || rawTitle;

  // Meta : annee, duree, qualite, age, tmdb score
  var pills = [];
  var year = '';
  if (vod.releaseDate) year = String(vod.releaseDate).substring(0, 4);
  else if (vod.year) year = String(vod.year);
  else if (vod.added) {
    try { year = String(new Date(parseInt(vod.added) * 1000).getFullYear()); } catch (e) {}
  }
  if (year) pills.push('<span class="pill">' + escapeHtml(year) + '</span>');
  // Qualite : detecte via titre
  var qm = rawTitle.match(/\b(4K|UHD|HDR|HDR10|DOLBY|FHD|HD)\b/i);
  if (qm) pills.push('<span class="pill qual">' + qm[0].toUpperCase() + '</span>');
  // Container ext
  if (vod.container_extension) pills.push('<span class="pill">' + escapeHtml(String(vod.container_extension).toUpperCase()) + '</span>');
  // Rating Xtream
  if (vod.rating) pills.push('<span class="pill tmdb">' + escapeHtml(String(vod.rating)) + '</span>');
  metaEl.innerHTML = pills.join('');

  // Description : Xtream fields d'abord
  var desc = vod.plot || vod.description || vod.overview || vod.synopsis || '';
  descEl.textContent = desc || 'Chargement...';
  castEl.textContent = '';

  // Background + cast + synopsis via TMDB lookup (cache 7j)
  if (window.ipremPoster && typeof window.ipremPoster.lookup === 'function') {
    try {
      var resolved = await window.ipremPoster.lookup(rawTitle, year, 'movie');
      if (resolved && resolved.id) {
        // Fetch details + credits en parallele (cache LS perso)
        var detailsCache = 'iprem_tmdb_details_' + resolved.id;
        var creditsCache = 'iprem_tmdb_credits_' + resolved.id;
        var details = _lsCacheGet(detailsCache, 7 * 24 * 3600 * 1000);
        var credits = _lsCacheGet(creditsCache, 7 * 24 * 3600 * 1000);
        var jobs = [];
        if (!details) jobs.push(fetch('https://api.themoviedb.org/3/movie/' + resolved.id + '?language=fr-FR&api_key=4ef0d7355d9ffb5151e987764708ce96')
          .then(function(r) { return r.json(); })
          .then(function(d) { details = d; _lsCacheSet(detailsCache, d); }).catch(function() {}));
        if (!credits) jobs.push(fetch('https://api.themoviedb.org/3/movie/' + resolved.id + '/credits?language=fr&api_key=4ef0d7355d9ffb5151e987764708ce96')
          .then(function(r) { return r.json(); })
          .then(function(d) { credits = d; _lsCacheSet(creditsCache, d); }).catch(function() {}));
        if (jobs.length) await Promise.all(jobs);

        // Backdrop
        if (details && details.backdrop_path) {
          var backdropUrl = 'https://image.tmdb.org/t/p/w1280' + details.backdrop_path;
          var preload = new Image();
          preload.onload = function() { if (bgEl) bgEl.style.backgroundImage = 'url(' + backdropUrl + ')'; };
          preload.src = backdropUrl;
        }
        // Synopsis
        if (details && details.overview && (!desc || desc === 'Chargement...')) {
          descEl.textContent = details.overview;
        } else if (!desc) {
          descEl.textContent = 'Aucune description disponible pour ce contenu.';
        }
        // Cast : top 4 acteurs
        if (credits && credits.cast && credits.cast.length) {
          var top = credits.cast.slice(0, 4).map(function(c) { return c.name; }).join(' · ');
          castEl.textContent = 'Avec : ' + top;
        }
        // Meta extra : duree + note TMDB officielle
        var extraPills = '';
        if (details && details.runtime) {
          var h = Math.floor(details.runtime / 60);
          var m = details.runtime % 60;
          extraPills += '<span class="pill">' + (h > 0 ? h + 'h ' : '') + m + 'm</span>';
        }
        if (details && details.vote_average) {
          extraPills += '<span class="pill tmdb">TMDb ' + (Math.round(details.vote_average * 10)) + '%</span>';
        }
        if (extraPills) metaEl.innerHTML = pills.join('') + extraPills;
      } else if (!desc) {
        descEl.textContent = 'Aucune description disponible pour ce contenu.';
      }
    } catch (e) {
      if (!desc) descEl.textContent = 'Aucune description disponible pour ce contenu.';
    }
  }
}

// Helpers cache LS
function _lsCacheGet(key, ttl) {
  try {
    var raw = localStorage.getItem(key);
    if (!raw) return null;
    var p = JSON.parse(raw);
    if (!p || !p.t || (Date.now() - p.t) > ttl) return null;
    return p.d;
  } catch (e) { return null; }
}
function _lsCacheSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), d: val })); }
  catch (e) {}
}

async function showVodDetail(vod) {
  var modal = document.getElementById('vodDetailModal');
  modal.style.display = 'flex';

  document.getElementById('vodDetailTitle').textContent = vod.name || 'Unknown';

  var posterEl = document.getElementById('vodDetailPoster');
  if (vod.stream_icon) {
    posterEl.innerHTML = '<img src="' + escapeHtml(vod.stream_icon) + '" alt="" onerror="this.style.display=\'none\'">';
  } else {
    posterEl.innerHTML = '';
  }

  var year = '';
  if (vod.releaseDate) year = String(vod.releaseDate).substring(0, 4);
  else if (vod.added) {
    try { year = new Date(parseInt(vod.added) * 1000).getFullYear(); } catch(e) {}
  }

  document.getElementById('vodDetailYear').textContent = year || '--';
  document.getElementById('vodDetailRating').textContent = vod.rating ? vod.rating + '/10' : '--';
  document.getElementById('vodDetailDuration').textContent = '';
  document.getElementById('vodDetailGenre').textContent = vod.genre || '';
  document.getElementById('vodDetailPlot').textContent = 'Loading details...';
  document.getElementById('vodDetailCast').textContent = '';

  AppState.selectedVod = vod;

  // Try to get detailed info
  try {
    var info = await AppState.api.getVodInfo(vod.stream_id);
    if (info && info.info) {
      var i = info.info;
      document.getElementById('vodDetailPlot').textContent = i.plot || i.description || 'No description available.';
      document.getElementById('vodDetailDuration').textContent = i.duration || '';
      document.getElementById('vodDetailGenre').textContent = i.genre || vod.genre || '';
      if (i.cast) {
        document.getElementById('vodDetailCast').textContent = 'Cast: ' + i.cast;
      }
      if (i.movie_image) {
        posterEl.innerHTML = '<img src="' + escapeHtml(i.movie_image) + '" alt="">';
      }
    } else {
      document.getElementById('vodDetailPlot').textContent = vod.plot || 'No description available.';
    }
  } catch (e) {
    document.getElementById('vodDetailPlot').textContent = vod.plot || 'No description available.';
  }

  // Play button
  document.getElementById('vodPlayBtn').onclick = function() {
    var ext = vod.container_extension || 'mp4';
    var url = AppState.api.vodUrl(vod.stream_id, ext);
    modal.style.display = 'none';
    startPlayer(url, vod.name, '', 'vod');
  };

  // Close
  document.getElementById('vodDetailClose').onclick = function() {
    modal.style.display = 'none';
  };

  modal.querySelector('.modal-backdrop').onclick = function() {
    modal.style.display = 'none';
  };
}


// ============================================
// Series Screen
// ============================================
async function initSeriesScreen() {
  if (AppState.seriesCategories.length > 0) return;

  var categoryList = document.getElementById('seriesCategoryList');
  var loading = document.getElementById('seriesLoading');

  categoryList.innerHTML = '';
  loading.style.display = 'flex';

  try {
    var categories = await AppState.api.getSeriesCategories();
    AppState.seriesCategories = Array.isArray(categories) ? categories : [];

    // === SMART CATEGORIES (virtuelles, en tete du menu) ===
    // Idem VOD : on garde uniquement ce qui n'existe pas chez le provider.
    var smartCats = [
      { id: '__all__',       label: '★ Toutes les séries' },
      { id: '__favorites__', label: '♥ Favoris' },
      { id: '__inprogress__',label: '▶ En cours' }
    ];
    smartCats.forEach(function(sc, idx) {
      var li = document.createElement('li');
      li.className = 'category-item focusable smart-cat' + (idx === 0 ? ' active' : '');
      li.tabIndex = 0;
      li.textContent = sc.label;
      li.setAttribute('data-smart', sc.id);
      li.addEventListener('click', function() { selectSeriesCategory(sc.id, li); });
      li.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.keyCode === 13) selectSeriesCategory(sc.id, li);
      });
      categoryList.appendChild(li);
    });

    var sep = document.createElement('li');
    sep.className = 'category-separator';
    sep.textContent = 'CATÉGORIES';
    categoryList.appendChild(sep);

    AppState.seriesCategories.forEach(function(cat) {
      var li = document.createElement('li');
      li.className = 'category-item focusable';
      li.tabIndex = 0;
      li.textContent = cat.category_name;
      li.addEventListener('click', function() {
        selectSeriesCategory(cat.category_id, li);
      });
      categoryList.appendChild(li);
    });

    await loadSeriesList('__all__');
  } catch (err) {
    showToast('Failed to load series: ' + err.message);
  } finally {
    loading.style.display = 'none';
  }
}

async function selectSeriesCategory(categoryId, element) {
  var items = document.querySelectorAll('#seriesCategoryList .category-item');
  items.forEach(function(i) { i.classList.remove('active'); });
  if (element) element.classList.add('active');
  AppState.selectedSeriesCategory = categoryId;
  await loadSeriesList(categoryId);
}

async function loadSeriesList(categoryId) {
  var grid = document.getElementById('seriesGrid');
  var loading = document.getElementById('seriesLoading');
  var titleEl = document.getElementById('seriesCategoryTitle');
  var countEl = document.getElementById('seriesCount');

  loading.style.display = 'flex';
  if (window.ipremCache && window.ipremCache.showSkeletonCards) {
    window.ipremCache.showSkeletonCards(grid, 18);
  } else {
    grid.innerHTML = '';
  }
  window._warmupPause = Date.now() + 2000;

  try {
    var series;
    if (categoryId && categoryId.indexOf('__') === 0) {
      series = await loadSeriesSmartCat(categoryId);
      titleEl.textContent = _seriesSmartCatLabel(categoryId);
    } else {
      series = await AppState.api.getSeries(categoryId);
      if (!categoryId) titleEl.textContent = 'Toutes les séries';
      else {
        var cat = AppState.seriesCategories.find(function(c) { return c.category_id === categoryId; });
        titleEl.textContent = cat ? cat.category_name : 'Séries';
      }
    }
    AppState.seriesList = Array.isArray(series) ? series : [];
    countEl.textContent = AppState.seriesList.length + ' séries';
    renderSeriesGrid();
  } catch (err) {
    showToast('Failed to load series: ' + err.message);
  } finally {
    loading.style.display = 'none';
  }
}

async function loadSeriesSmartCat(smartId) {
  var all = AppState.seriesAllStreams;
  if (!all || !all.length) {
    all = await AppState.api.getSeries();
    AppState.seriesAllStreams = Array.isArray(all) ? all : [];
    all = AppState.seriesAllStreams;
  }
  if (!all.length) return [];

  switch (smartId) {
    case '__all__':
      return all;
    case '__favorites__':
      var favs = AppState.favorites || {};
      return all.filter(function(s) { return !!favs[s.series_id]; });
    case '__inprogress__':
      // Series dont au moins 1 episode a ete commence
      var progressList = [];
      try { progressList = (window.iprem && window.iprem.progress) ? window.iprem.progress.list(100) : []; }
      catch (e) {}
      var inProgressSeriesIds = {};
      progressList.forEach(function(p) {
        // id format : "series_<seriesId>_s<S>e<E>" (cf reprise par episode)
        var m = String(p.id || '').match(/^series_(\d+)/);
        if (m) inProgressSeriesIds[m[1]] = (p.updatedAt || 0);
      });
      return all
        .filter(function(s) { return inProgressSeriesIds[s.series_id] != null; })
        .sort(function(a, b) { return (inProgressSeriesIds[b.series_id] || 0) - (inProgressSeriesIds[a.series_id] || 0); });
    case '__new__':
      return all.slice().sort(function(a, b) {
        var ta = parseInt(a.last_modified || a.added) || 0;
        var tb = parseInt(b.last_modified || b.added) || 0;
        return tb - ta;
      }).slice(0, 200);
    case '__top__':
      return all.slice().sort(function(a, b) {
        return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
      }).slice(0, 100);
    case '__4k__':
      return all.filter(function(s) {
        return /\b(4K|UHD|HDR|HDR10)\b/i.test(s.name || '');
      });
  }
  return [];
}

function _seriesSmartCatLabel(id) {
  var map = {
    '__all__': 'Toutes les séries',
    '__favorites__': '♥ Favoris',
    '__inprogress__': '▶ En cours',
    '__new__': '✨ Nouveautés',
    '__top__': '🏆 Top 100',
    '__4k__': '◆ 4K / HDR'
  };
  return map[id] || 'Séries';
}

function renderSeriesGrid() {
  var grid = document.getElementById('seriesGrid');
  grid.innerHTML = '';

  AppState.seriesList.forEach(function(series) {
    var card = document.createElement('div');
    card.className = 'vod-card focusable';
    card.tabIndex = 0;

    var posterHtml;
    if (series.cover) {
      posterHtml = '<div class="vod-poster"><img src="' + escapeHtml(series.cover) + '" alt="" loading="lazy" onerror="this.style.display=\'none\';this.parentElement.innerHTML=\'<div class=vod-poster-placeholder>📺</div>\'"></div>';
    } else {
      posterHtml = '<div class="vod-poster"><div class="vod-poster-placeholder">📺</div></div>';
    }

    if (series.rating) {
      posterHtml = posterHtml.replace('</div>', '<span class="vod-rating">' + escapeHtml(String(series.rating)) + '</span></div>');
    }

    var year = series.releaseDate ? String(series.releaseDate).substring(0, 4) : '';

    // Nettoyage titre (meme logique que VOD)
    var rawTitle = series.name || 'Unknown';
    var cleanedTitle = rawTitle;
    var qualityTag = '';
    if (window.ipremPoster && window.ipremPoster.cleanTitle) {
      cleanedTitle = window.ipremPoster.cleanTitle(rawTitle) || rawTitle;
      var qm = rawTitle.match(/\b(4K|UHD|HDR|FHD|HD|DOLBY VISION|DV)\b/i);
      if (qm) qualityTag = qm[0].toUpperCase();
    }
    var langTag = '';
    var lm = rawTitle.match(/\b(MULTIVFF|MULTIVFQ|MULTIVF|MULTI|VFF|VFQ|VOSTFR|VOSTEN|VFI|VF|VO|VEQ)\b/i);
    if (lm) langTag = lm[0].toUpperCase();

    var metaLine = '';
    if (year) metaLine += '<span class="meta-pill">' + escapeHtml(year) + '</span>';
    if (qualityTag) metaLine += '<span class="meta-pill quality">' + qualityTag + '</span>';
    if (langTag) metaLine += '<span class="meta-pill lang">' + langTag + '</span>';

    card.innerHTML = posterHtml +
      '<div class="vod-card-info">' +
        '<div class="vod-card-title">' + escapeHtml(cleanedTitle) + '</div>' +
        (metaLine ? '<div class="vod-card-meta">' + metaLine + '</div>' : '') +
      '</div>';

    card.addEventListener('click', function() {
      showSeriesDetail(series);
    });

    card.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') showSeriesDetail(series);
    });

    grid.appendChild(card);
  });
}

async function showSeriesDetail(series) {
  var modal = document.getElementById('seriesDetailModal');
  modal.style.display = 'flex';

  document.getElementById('seriesDetailTitle').textContent = series.name || 'Unknown';

  var posterEl = document.getElementById('seriesDetailPoster');
  if (series.cover) {
    posterEl.innerHTML = '<img src="' + escapeHtml(series.cover) + '" alt="">';
  } else {
    posterEl.innerHTML = '';
  }

  var year = series.releaseDate ? String(series.releaseDate).substring(0, 4) : '';
  document.getElementById('seriesDetailYear').textContent = year || '--';
  document.getElementById('seriesDetailRating').textContent = series.rating ? series.rating + '/10' : '--';
  document.getElementById('seriesDetailGenre').textContent = series.genre || '';
  document.getElementById('seriesDetailPlot').textContent = series.plot || 'Loading...';
  document.getElementById('seriesDetailCast').textContent = series.cast ? 'Cast: ' + series.cast : '';

  document.getElementById('seasonTabs').innerHTML = '<span class="badge">Loading seasons...</span>';
  document.getElementById('episodeList').innerHTML = '';

  AppState.selectedSeries = series;

  // Close
  document.getElementById('seriesDetailClose').onclick = function() {
    modal.style.display = 'none';
  };

  modal.querySelector('.modal-backdrop').onclick = function() {
    modal.style.display = 'none';
  };

  // Load series info
  try {
    var info = await AppState.api.getSeriesInfo(series.series_id);
    AppState.seriesInfo = info;

    if (info && info.info) {
      document.getElementById('seriesDetailPlot').textContent = info.info.plot || series.plot || 'No description available.';
      if (info.info.cast) {
        document.getElementById('seriesDetailCast').textContent = 'Cast: ' + info.info.cast;
      }
      if (info.info.cover) {
        posterEl.innerHTML = '<img src="' + escapeHtml(info.info.cover) + '" alt="">';
      }
    }

    if (info && info.episodes) {
      renderSeasons(info.episodes);
    } else {
      document.getElementById('seasonTabs').innerHTML = '<span class="badge">No seasons available</span>';
    }
  } catch (e) {
    document.getElementById('seasonTabs').innerHTML = '<span class="badge">Failed to load</span>';
    document.getElementById('seriesDetailPlot').textContent = series.plot || 'No description available.';
  }
}

function renderSeasons(episodes) {
  var seasonTabs = document.getElementById('seasonTabs');
  seasonTabs.innerHTML = '';

  var seasonNumbers = Object.keys(episodes).sort(function(a, b) {
    return parseInt(a) - parseInt(b);
  });

  if (seasonNumbers.length === 0) {
    seasonTabs.innerHTML = '<span class="badge">No episodes available</span>';
    return;
  }

  seasonNumbers.forEach(function(num, index) {
    var tab = document.createElement('span');
    tab.className = 'season-tab focusable' + (index === 0 ? ' active' : '');
    tab.tabIndex = 0;
    tab.textContent = 'Saison ' + num;
    tab.addEventListener('click', function() {
      var tabs = document.querySelectorAll('#seasonTabs .season-tab');
      tabs.forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      AppState.currentSeasonNum = parseInt(num);
      renderEpisodes(episodes[num]);
    });
    seasonTabs.appendChild(tab);
  });

  // Show first season episodes
  AppState.currentSeasonNum = parseInt(seasonNumbers[0]);
  renderEpisodes(episodes[seasonNumbers[0]]);
}

function _formatSecsHMS(s) {
  s = Math.floor(s || 0);
  var m = Math.floor(s / 60);
  var sec = s % 60;
  return m + ':' + (sec < 10 ? '0' : '') + sec;
}

function renderEpisodes(episodes) {
  var list = document.getElementById('episodeList');
  list.innerHTML = '';

  if (!Array.isArray(episodes)) {
    list.innerHTML = '<p class="placeholder-text">No episodes</p>';
    return;
  }

  var seriesId = AppState.selectedSeries ? AppState.selectedSeries.series_id : '';

  episodes.forEach(function(ep) {
    var item = document.createElement('div');
    item.className = 'episode-item focusable';
    item.tabIndex = 0;

    var rawTitle = ep.title || ep.name || 'Episode ' + (ep.episode_num || '?');
    var cleanTitle = rawTitle;
    if (window.ipremPoster && window.ipremPoster.cleanTitle) {
      var c = window.ipremPoster.cleanTitle(rawTitle);
      if (c) cleanTitle = c;
    }
    var ext = ep.container_extension || 'mp4';
    var seasonNum = parseInt(ep.season || (AppState.currentSeasonNum) || 1);
    var episodeNum = parseInt(ep.episode_num || 1);
    var sxe = 'S' + (seasonNum < 10 ? '0' : '') + seasonNum
            + 'E' + (episodeNum < 10 ? '0' : '') + episodeNum;

    // Miniature : Xtream renvoie souvent ep.info.movie_image ou ep.info.cover_big
    var thumb = (ep.info && (ep.info.movie_image || ep.info.cover_big)) || '';
    // Duree
    var durTxt = '';
    if (ep.info && ep.info.duration) {
      durTxt = String(ep.info.duration); // ex: "00:42:13"
      var parts = durTxt.split(':');
      if (parts.length === 3) durTxt = parseInt(parts[0]) > 0 ? (parts[0] + 'h' + parts[1]) : (parseInt(parts[1]) + ' min');
    } else if (ep.info && ep.info.duration_secs) {
      var sec = parseInt(ep.info.duration_secs);
      durTxt = Math.floor(sec / 60) + ' min';
    }
    // Description
    var plot = (ep.info && (ep.info.plot || ep.info.description)) || '';

    // Continue Watching : recupere la progression pour cet episode
    var contentId = 'series_' + seriesId + '_s' + seasonNum + 'e' + episodeNum;
    var prog = null;
    try { prog = (window.iprem && window.iprem.progress) ? window.iprem.progress.get(contentId) : null; }
    catch (e) {}
    var pct = 0, watched = false;
    if (prog && prog.duration > 0) {
      pct = (prog.position / prog.duration) * 100;
      watched = pct >= 92;
    }

    item.innerHTML =
      (thumb
        ? '<div class="ep-thumb"><img src="' + escapeHtml(thumb) + '" alt="" loading="lazy" onerror="this.parentElement.classList.add(\'no-img\')"></div>'
        : '<div class="ep-thumb no-img">📺</div>') +
      '<div class="ep-content">' +
        '<div class="ep-line1">' +
          '<span class="ep-sxe">' + sxe + '</span>' +
          '<span class="ep-title">' + escapeHtml(cleanTitle) + '</span>' +
          (durTxt ? '<span class="ep-duration">' + escapeHtml(durTxt) + '</span>' : '') +
          (watched ? '<span class="ep-badge-watched">✓ Vu</span>' : '') +
        '</div>' +
        (plot ? '<div class="ep-plot">' + escapeHtml(plot) + '</div>' : '') +
        (pct > 0 && !watched
          ? '<div class="ep-progress"><div class="ep-progress-fill" style="width:' + Math.min(100, pct).toFixed(0) + '%"></div></div>'
          : '') +
      '</div>' +
      '<div class="ep-actions">' +
        (pct > 0 && !watched
          ? '<button class="episode-play-btn resume" title="Reprendre">▶ ' + _formatSecsHMS(prog.position) + '</button>'
          : '<button class="episode-play-btn" title="Lire"><svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><polygon points="5,3 19,12 5,21"/></svg></button>') +
      '</div>';

    var playFn = function() {
      var url = AppState.api.seriesUrl(ep.id, ext);
      document.getElementById('seriesDetailModal').style.display = 'none';
      var resumePos = (prog && prog.position > 5 && pct < 92) ? prog.position : 0;
      // Lance le player natif avec resume position si dispo
      if (window.AndroidBridge && typeof window.AndroidBridge.playNativeWithResume === 'function') {
        window.AndroidBridge.playNativeWithResume(
          url, sxe + ' ' + cleanTitle, false,
          '', '', '', -1, '', '',
          contentId, 'series', resumePos
        );
      } else {
        startPlayer(url, cleanTitle, sxe, 'series', { stream_id: ep.id });
      }
    };

    item.querySelector('.episode-play-btn').addEventListener('click', function(e) {
      e.stopPropagation();
      playFn();
    });

    item.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') playFn();
    });

    item.addEventListener('click', playFn);

    list.appendChild(item);
  });
}


// ============================================
// Catchup Screen
// ============================================
async function initCatchupScreen() {
  var channelList = document.getElementById('catchupChannelList');
  var dateSelector = document.getElementById('dateSelector');

  channelList.innerHTML = '';
  dateSelector.innerHTML = '';

  // Build date buttons for last 7 days
  for (var i = 0; i < 7; i++) {
    var d = new Date();
    d.setDate(d.getDate() - i);
    var btn = document.createElement('button');
    btn.className = 'date-btn focusable' + (i === 0 ? ' active' : '');
    btn.tabIndex = 0;
    var dateStr = d.toISOString().substring(0, 10);
    btn.setAttribute('data-date', dateStr);
    btn.textContent = i === 0 ? 'Today' : (i === 1 ? 'Yesterday' : d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }));

    btn.addEventListener('click', (function(date, element) {
      return function() {
        var btns = document.querySelectorAll('#dateSelector .date-btn');
        btns.forEach(function(b) { b.classList.remove('active'); });
        element.classList.add('active');
        AppState.selectedCatchupDate = date;
        if (AppState.selectedCatchupChannel) {
          loadCatchupPrograms(AppState.selectedCatchupChannel, date);
        }
      };
    })(dateStr, btn));

    dateSelector.appendChild(btn);
  }

  AppState.selectedCatchupDate = new Date().toISOString().substring(0, 10);

  // Load channels that support catchup
  try {
    if (AppState.allLiveStreams.length === 0) {
      AppState.allLiveStreams = await AppState.api.getLiveStreams();
    }

    // Filter channels with tv_archive = 1
    AppState.catchupChannels = AppState.allLiveStreams.filter(function(s) {
      return s.tv_archive === 1 || s.tv_archive === '1';
    });

    if (AppState.catchupChannels.length === 0) {
      // Show all channels if no catchup-specific ones
      AppState.catchupChannels = AppState.allLiveStreams.slice(0, 100);
    }

    AppState.catchupChannels.forEach(function(ch) {
      var li = document.createElement('li');
      li.className = 'category-item focusable';
      li.tabIndex = 0;
      li.textContent = ch.name || 'Unknown';

      li.addEventListener('click', function() {
        var items = document.querySelectorAll('#catchupChannelList .category-item');
        items.forEach(function(item) { item.classList.remove('active'); });
        li.classList.add('active');
        AppState.selectedCatchupChannel = ch;
        loadCatchupPrograms(ch, AppState.selectedCatchupDate);
      });

      channelList.appendChild(li);
    });
  } catch (err) {
    showToast('Failed to load catchup channels: ' + err.message);
  }
}

async function loadCatchupPrograms(channel, date) {
  var programList = document.getElementById('catchupProgramList');
  var loading = document.getElementById('catchupLoading');

  loading.style.display = 'flex';
  programList.innerHTML = '';

  try {
    var data = await AppState.api.getShortEPG(channel.stream_id);
    var listings = (data && data.epg_listings) ? data.epg_listings : [];

    if (listings.length === 0) {
      programList.innerHTML = '<p class="placeholder-text">No programs available for this date</p>';
      loading.style.display = 'none';
      return;
    }

    listings.forEach(function(prog) {
      var item = document.createElement('div');
      item.className = 'catchup-program-item';

      var title = '';
      try {
        title = prog.title ? atob(prog.title) : (prog.title_decoded || 'Unknown');
      } catch (e) {
        title = prog.title_decoded || prog.title || 'Unknown';
      }

      var startTime = formatEpgTime(prog.start);
      var endTime = formatEpgTime(prog.end);

      item.innerHTML =
        '<span class="catchup-time">' + startTime + ' - ' + endTime + '</span>' +
        '<span class="catchup-title">' + escapeHtml(title) + '</span>' +
        '<button class="catchup-play-btn focusable" tabindex="0" title="Play">' +
          '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>' +
        '</button>';

      item.querySelector('.catchup-play-btn').addEventListener('click', function() {
        // Build timeshift URL
        var start = prog.start || '';
        var duration = prog.duration || 60;
        var url;
        if (start) {
          var startFormatted = start.replace(/[-: ]/g, function(m) {
            if (m === '-') return '-';
            if (m === ':') return ':';
            return ':';
          });
          url = AppState.api.timeshiftUrl(channel.stream_id, startFormatted, duration);
        } else {
          url = AppState.api.liveUrl(channel.stream_id, 'm3u8');
        }
        startPlayer(url, title, channel.name, 'catchup');
      });

      programList.appendChild(item);
    });
  } catch (err) {
    programList.innerHTML = '<p class="placeholder-text">Failed to load programs</p>';
  } finally {
    loading.style.display = 'none';
  }
}


// ============================================
// EPG Guide Screen
// ============================================
async function initEpgScreen() {
  var timeline = document.getElementById('epgTimeline');
  var grid = document.getElementById('epgGrid');
  var loading = document.getElementById('epgLoading');

  loading.style.display = 'flex';
  timeline.innerHTML = '';
  grid.innerHTML = '';

  // Build timeline (current hour +/- 3 hours)
  var now = new Date();
  var startHour = now.getHours() - 2;

  for (var h = 0; h < 8; h++) {
    var hour = ((startHour + h) + 24) % 24;
    var slot = document.createElement('div');
    slot.className = 'epg-time-slot';
    slot.textContent = (hour < 10 ? '0' : '') + hour + ':00';
    timeline.appendChild(slot);
  }

  try {
    // Load first 30 channels and their EPG
    if (AppState.allLiveStreams.length === 0) {
      AppState.allLiveStreams = await AppState.api.getLiveStreams();
    }

    var channels = AppState.allLiveStreams.slice(0, 30);

    for (var c = 0; c < channels.length; c++) {
      var ch = channels[c];
      var row = document.createElement('div');
      row.className = 'epg-row';

      var logoHtml = '';
      if (ch.stream_icon) {
        logoHtml = '<img src="' + escapeHtml(ch.stream_icon) + '" alt="" onerror="this.style.display=\'none\'">';
      }

      row.innerHTML =
        '<div class="epg-channel-label">' +
          logoHtml +
          '<span>' + escapeHtml(ch.name || 'Unknown') + '</span>' +
        '</div>' +
        '<div class="epg-programs" id="epg-row-' + ch.stream_id + '">' +
          '<div class="epg-program" style="flex:1;">Loading...</div>' +
        '</div>';

      grid.appendChild(row);

      // Load EPG async
      loadEpgRow(ch.stream_id);
    }
  } catch (err) {
    grid.innerHTML = '<p class="placeholder-text">Failed to load EPG: ' + escapeHtml(err.message) + '</p>';
  } finally {
    loading.style.display = 'none';
  }
}

async function loadEpgRow(streamId) {
  try {
    var data = await AppState.api.getShortEPG(streamId);
    var container = document.getElementById('epg-row-' + streamId);
    if (!container) return;

    container.innerHTML = '';

    if (!data || !data.epg_listings || data.epg_listings.length === 0) {
      container.innerHTML = '<div class="epg-program" style="flex:1;">No data</div>';
      return;
    }

    var now = new Date();

    data.epg_listings.slice(0, 8).forEach(function(prog) {
      var div = document.createElement('div');
      div.className = 'epg-program';

      var startDate = prog.start ? new Date(prog.start) : null;
      var endDate = prog.end ? new Date(prog.end) : null;

      if (startDate && endDate && now >= startDate && now <= endDate) {
        div.classList.add('now');
      }

      // Width proportional to duration (30 min = 100px base)
      var durationMin = 30;
      if (startDate && endDate) {
        durationMin = Math.max(15, (endDate - startDate) / 60000);
      }
      div.style.minWidth = Math.max(60, durationMin * 3.3) + 'px';
      div.style.flex = 'none';

      var title = '';
      try {
        title = prog.title ? atob(prog.title) : (prog.title_decoded || '');
      } catch (e) {
        title = prog.title_decoded || prog.title || '';
      }

      div.textContent = formatEpgTime(prog.start) + ' ' + title;

      div.addEventListener('click', function() {
        showToast(title + ' (' + formatEpgTime(prog.start) + ' - ' + formatEpgTime(prog.end) + ')');
      });

      container.appendChild(div);
    });
  } catch (e) {
    var container = document.getElementById('epg-row-' + streamId);
    if (container) {
      container.innerHTML = '<div class="epg-program" style="flex:1;">Unavailable</div>';
    }
  }
}


// ============================================
// Settings Screen
// ============================================
function initSettingsScreen() {
  // Populate settings values
  document.getElementById('settingStreamType').value = AppState.settings.streamType || 'm3u8';
  document.getElementById('settingBufferSize').value = AppState.settings.bufferSize || 3;
  document.getElementById('settingTimezone').value = AppState.settings.timezoneOffset || 0;
  document.getElementById('settingPin').value = AppState.settings.parentalPin || '';

  // Account info
  if (AppState.userInfo) {
    document.getElementById('settingUsername').textContent = AppState.api.username;
    document.getElementById('settingStatus').textContent = AppState.userInfo.status || '--';
    document.getElementById('settingServer').textContent = AppState.api.baseUrl;

    var maxConn = AppState.userInfo.max_connections;
    document.getElementById('settingMaxConn').textContent = maxConn || '--';

    var activeConn = AppState.userInfo.active_cons;
    document.getElementById('settingActiveConn').textContent = activeConn || '0';

    var expiry = AppState.userInfo.exp_date;
    if (expiry) {
      var expDate = new Date(parseInt(expiry) * 1000);
      document.getElementById('settingExpiry').textContent = expDate.toLocaleDateString() + ' ' + expDate.toLocaleTimeString();
    }
  }

  // Settings change handlers
  document.getElementById('settingStreamType').onchange = function() {
    AppState.settings.streamType = this.value;
    saveSettings();
    showToast('Stream type updated');
  };

  document.getElementById('settingBufferSize').onchange = function() {
    AppState.settings.bufferSize = parseInt(this.value);
    saveSettings();
    showToast('Buffer size updated');
  };

  document.getElementById('settingTimezone').onchange = function() {
    AppState.settings.timezoneOffset = parseInt(this.value);
    saveSettings();
    showToast('Timezone offset updated');
  };

  document.getElementById('settingPin').onchange = function() {
    AppState.settings.parentalPin = this.value;
    saveSettings();
    showToast('PIN updated');
  };

  // Action buttons
  document.getElementById('btnClearFavorites').onclick = function() {
    AppState.favorites = {};
    saveFavorites();
    showToast('Favorites cleared');
  };

  document.getElementById('btnClearCache').onclick = function() {
    // Reset cached data
    AppState.liveCategories = [];
    AppState.allLiveStreams = [];
    AppState.vodCategories = [];
    AppState.seriesCategories = [];
    showToast('Cache cleared');
  };

  document.getElementById('btnLogout').onclick = function() {
    doLogout();
  };
}

function doLogout() {
  // Reset state
  AppState.api = null;
  AppState.userInfo = null;
  AppState.serverInfo = null;
  AppState.liveCategories = [];
  AppState.allLiveStreams = [];
  AppState.liveStreams = [];
  AppState.vodCategories = [];
  AppState.vodStreams = [];
  AppState.seriesCategories = [];
  AppState.seriesList = [];
  AppState.catchupChannels = [];
  AppState.selectedChannel = null;
  AppState.screenHistory = [];

  // Go to login
  var screens = document.querySelectorAll('.screen');
  screens.forEach(function(s) {
    s.classList.remove('active');
    if (s.id === 'player') s.style.display = 'none';
  });

  document.getElementById('login').classList.add('active');
  AppState.activeScreen = 'login';

  showToast('Logged out');
}


// ============================================
// Player
// ============================================
var playerInfo = {
  type: 'live',
  stream: null,
  name: '',
  number: ''
};

function startPlayer(url, name, number, type, stream) {
  var video = document.getElementById('videoPlayer');
  var playerScreen = document.getElementById('player');

  playerInfo.type = type || 'live';
  playerInfo.stream = stream || null;
  playerInfo.name = name || '';
  playerInfo.number = number || '';

  // Show player
  var screens = document.querySelectorAll('.screen');
  screens.forEach(function(s) { s.classList.remove('active'); });
  playerScreen.style.display = 'flex';
  playerScreen.classList.add('active');

  if (AppState.activeScreen !== 'player') {
    AppState.screenHistory.push(AppState.activeScreen);
  }
  AppState.activeScreen = 'player';

  // Set source
  video.src = url;
  video.load();

  var playPromise = video.play();
  if (playPromise !== undefined) {
    playPromise.then(function() {
      AppState.isPlaying = true;
      updatePlayPauseIcon();
    }).catch(function(err) {
      console.warn('Autoplay blocked:', err);
      AppState.isPlaying = false;
      updatePlayPauseIcon();
    });
  }

  // Update banner
  document.getElementById('bannerChannelNum').textContent = number || '';
  document.getElementById('bannerChannelName').textContent = name || '';

  // Show overlay briefly
  showPlayerOverlay();

  // Load EPG if live
  if (type === 'live' && stream) {
    loadPlayerEPG(stream.stream_id);
  } else {
    document.getElementById('epgNowTitle').textContent = name || '--';
    document.getElementById('epgNowTime').textContent = '';
    document.getElementById('epgNextTitle').textContent = '--';
    document.getElementById('epgNextTime').textContent = '';
    document.getElementById('epgProgressFill').style.width = '0%';
  }
}

function stopPlayer() {
  var video = document.getElementById('videoPlayer');
  video.pause();
  video.removeAttribute('src');
  video.load();

  AppState.isPlaying = false;
  hidePlayerOverlay();

  var playerScreen = document.getElementById('player');
  playerScreen.style.display = 'none';
  playerScreen.classList.remove('active');

  // Go back
  if (AppState.screenHistory.length > 0) {
    var prev = AppState.screenHistory.pop();
    var target = document.getElementById(prev);
    if (target) target.classList.add('active');
    AppState.activeScreen = prev;
  } else {
    document.getElementById('home').classList.add('active');
    AppState.activeScreen = 'home';
  }
}

function togglePlayPause() {
  var video = document.getElementById('videoPlayer');
  if (video.paused) {
    video.play().catch(function() {});
    AppState.isPlaying = true;
  } else {
    video.pause();
    AppState.isPlaying = false;
  }
  updatePlayPauseIcon();
}

function updatePlayPauseIcon() {
  var iconPlay = document.getElementById('iconPlay');
  var iconPause = document.getElementById('iconPause');
  if (AppState.isPlaying) {
    iconPlay.style.display = 'none';
    iconPause.style.display = 'block';
  } else {
    iconPlay.style.display = 'block';
    iconPause.style.display = 'none';
  }
}

function showPlayerOverlay() {
  var overlay = document.getElementById('playerOverlay');
  overlay.classList.add('visible');
  AppState.playerOverlayVisible = true;

  clearTimeout(AppState.overlayTimeout);
  AppState.overlayTimeout = setTimeout(function() {
    hidePlayerOverlay();
  }, 5000);
}

function hidePlayerOverlay() {
  var overlay = document.getElementById('playerOverlay');
  overlay.classList.remove('visible');
  AppState.playerOverlayVisible = false;
  clearTimeout(AppState.overlayTimeout);
}

function togglePlayerOverlay() {
  if (AppState.playerOverlayVisible) {
    hidePlayerOverlay();
  } else {
    showPlayerOverlay();
  }
}

function changeChannel(direction) {
  if (playerInfo.type !== 'live') return;

  var streams = AppState.liveStreams;
  if (streams.length === 0) return;

  AppState.currentChannelIndex += direction;
  if (AppState.currentChannelIndex < 0) AppState.currentChannelIndex = streams.length - 1;
  if (AppState.currentChannelIndex >= streams.length) AppState.currentChannelIndex = 0;

  var stream = streams[AppState.currentChannelIndex];
  AppState.selectedChannel = stream;

  var ext = AppState.settings.streamType || 'm3u8';
  var url = AppState.api.liveUrl(stream.stream_id, ext);

  // Show OSD
  showChannelOsd(stream.num || (AppState.currentChannelIndex + 1), stream.name);

  startPlayer(url, stream.name, stream.num || (AppState.currentChannelIndex + 1), 'live', stream);
}

function showChannelOsd(number, name) {
  var osd = document.getElementById('playerChannelOsd');
  var osdNum = document.getElementById('osdNumber');
  osdNum.textContent = number;
  osd.style.display = 'block';

  clearTimeout(AppState.channelOsdTimeout);
  AppState.channelOsdTimeout = setTimeout(function() {
    osd.style.display = 'none';
  }, 3000);
}

function handleNumberInput(num) {
  if (playerInfo.type !== 'live') return;

  AppState.osdNumberInput += num;
  showChannelOsd(AppState.osdNumberInput, '');

  clearTimeout(AppState.osdInputTimeout);
  AppState.osdInputTimeout = setTimeout(function() {
    // Find channel by number
    var targetNum = parseInt(AppState.osdNumberInput);
    AppState.osdNumberInput = '';

    var index = AppState.liveStreams.findIndex(function(s) {
      return parseInt(s.num) === targetNum;
    });

    if (index >= 0) {
      AppState.currentChannelIndex = index;
      var stream = AppState.liveStreams[index];
      AppState.selectedChannel = stream;
      var ext = AppState.settings.streamType || 'm3u8';
      var url = AppState.api.liveUrl(stream.stream_id, ext);
      startPlayer(url, stream.name, stream.num, 'live', stream);
    } else {
      showToast('Channel ' + targetNum + ' not found');
    }
  }, 1500);
}

function adjustVolume(delta) {
  var video = document.getElementById('videoPlayer');
  AppState.volume = Math.max(0, Math.min(1, AppState.volume + delta));
  video.volume = AppState.volume;
  AppState.isMuted = AppState.volume === 0;

  document.getElementById('volumeFill').style.width = (AppState.volume * 100) + '%';
  updateVolumeIcon();
  showPlayerOverlay();
}

function toggleMute() {
  var video = document.getElementById('videoPlayer');
  AppState.isMuted = !AppState.isMuted;
  video.muted = AppState.isMuted;
  updateVolumeIcon();

  if (AppState.isMuted) {
    document.getElementById('volumeFill').style.width = '0%';
  } else {
    document.getElementById('volumeFill').style.width = (AppState.volume * 100) + '%';
  }
}

function updateVolumeIcon() {
  var iconOn = document.getElementById('iconVolumeOn');
  var iconOff = document.getElementById('iconVolumeOff');
  if (AppState.isMuted) {
    iconOn.style.display = 'none';
    iconOff.style.display = 'block';
  } else {
    iconOn.style.display = 'block';
    iconOff.style.display = 'none';
  }
}

async function loadPlayerEPG(streamId) {
  try {
    var data = await AppState.api.getShortEPG(streamId);
    if (!data || !data.epg_listings || data.epg_listings.length === 0) {
      document.getElementById('epgNowTitle').textContent = playerInfo.name || '--';
      return;
    }

    var now = data.epg_listings[0];
    var next = data.epg_listings.length > 1 ? data.epg_listings[1] : null;

    var nowTitle = '';
    try {
      nowTitle = now.title ? atob(now.title) : (now.title_decoded || '--');
    } catch (e) {
      nowTitle = now.title_decoded || now.title || '--';
    }

    document.getElementById('epgNowTitle').textContent = nowTitle;
    document.getElementById('epgNowTime').textContent = formatEpgTime(now.start) + ' - ' + formatEpgTime(now.end);

    if (next) {
      var nextTitle = '';
      try {
        nextTitle = next.title ? atob(next.title) : (next.title_decoded || '--');
      } catch (e) {
        nextTitle = next.title_decoded || next.title || '--';
      }
      document.getElementById('epgNextTitle').textContent = nextTitle;
      document.getElementById('epgNextTime').textContent = formatEpgTime(next.start) + ' - ' + formatEpgTime(next.end);
    }

    // Progress bar
    if (now.start && now.end) {
      var startMs = new Date(now.start).getTime();
      var endMs = new Date(now.end).getTime();
      var nowMs = Date.now();
      var progress = Math.max(0, Math.min(100, ((nowMs - startMs) / (endMs - startMs)) * 100));
      document.getElementById('epgProgressFill').style.width = progress + '%';
    }
  } catch (e) {
    // EPG not available
  }
}


// ============================================
// Search
// ============================================
function openSearch() {
  document.getElementById('searchModal').style.display = 'flex';
  document.getElementById('searchInput').value = '';
  document.getElementById('searchResults').innerHTML = '<p class="placeholder-text">Enter a search term</p>';
  setTimeout(function() {
    document.getElementById('searchInput').focus();
  }, 100);
}

function closeSearch() {
  document.getElementById('searchModal').style.display = 'none';
}

async function performSearch() {
  var query = document.getElementById('searchInput').value.trim().toLowerCase();
  if (!query || query.length < 2) {
    showToast('Enter at least 2 characters');
    return;
  }

  var results = document.getElementById('searchResults');
  results.innerHTML = '<div class="loading-indicator"><div class="spinner"></div></div>';

  var searchLive = document.getElementById('searchLive').checked;
  var searchVod = document.getElementById('searchVod').checked;
  var searchSeries = document.getElementById('searchSeries').checked;

  var html = '';

  try {
    // Search Live TV
    if (searchLive) {
      if (AppState.allLiveStreams.length === 0) {
        AppState.allLiveStreams = await AppState.api.getLiveStreams();
      }

      var liveResults = AppState.allLiveStreams.filter(function(s) {
        return (s.name || '').toLowerCase().indexOf(query) !== -1;
      }).slice(0, 20);

      if (liveResults.length > 0) {
        html += '<div class="search-result-section"><h4>Live TV (' + liveResults.length + ')</h4>';
        liveResults.forEach(function(s) {
          html += '<div class="search-result-item" data-type="live" data-id="' + s.stream_id + '">' +
            '<div class="search-result-icon">' +
              (s.stream_icon ? '<img src="' + escapeHtml(s.stream_icon) + '" alt="" onerror="this.style.display=\'none\'">' : '<span>' + escapeHtml((s.name || '?').charAt(0)) + '</span>') +
            '</div>' +
            '<div class="search-result-info">' +
              '<div class="search-result-name">' + escapeHtml(s.name) + '</div>' +
              '<div class="search-result-type">Ch. ' + (s.num || '') + '</div>' +
            '</div>' +
          '</div>';
        });
        html += '</div>';
      }
    }

    // Search VOD
    if (searchVod) {
      var vodStreams = await AppState.api.getVodStreams();
      var vodResults = (Array.isArray(vodStreams) ? vodStreams : []).filter(function(s) {
        return (s.name || '').toLowerCase().indexOf(query) !== -1;
      }).slice(0, 20);

      if (vodResults.length > 0) {
        html += '<div class="search-result-section"><h4>Movies (' + vodResults.length + ')</h4>';
        vodResults.forEach(function(s) {
          html += '<div class="search-result-item" data-type="vod" data-id="' + s.stream_id + '">' +
            '<div class="search-result-icon">' +
              (s.stream_icon ? '<img src="' + escapeHtml(s.stream_icon) + '" alt="" onerror="this.style.display=\'none\'">' : '<span>🎬</span>') +
            '</div>' +
            '<div class="search-result-info">' +
              '<div class="search-result-name">' + escapeHtml(s.name) + '</div>' +
              '<div class="search-result-type">Movie' + (s.rating ? ' - ' + s.rating : '') + '</div>' +
            '</div>' +
          '</div>';
        });
        html += '</div>';
      }
    }

    // Search Series
    if (searchSeries) {
      var seriesList = await AppState.api.getSeries();
      var seriesResults = (Array.isArray(seriesList) ? seriesList : []).filter(function(s) {
        return (s.name || '').toLowerCase().indexOf(query) !== -1;
      }).slice(0, 20);

      if (seriesResults.length > 0) {
        html += '<div class="search-result-section"><h4>Series (' + seriesResults.length + ')</h4>';
        seriesResults.forEach(function(s) {
          html += '<div class="search-result-item" data-type="series" data-id="' + s.series_id + '">' +
            '<div class="search-result-icon">' +
              (s.cover ? '<img src="' + escapeHtml(s.cover) + '" alt="" onerror="this.style.display=\'none\'">' : '<span>📺</span>') +
            '</div>' +
            '<div class="search-result-info">' +
              '<div class="search-result-name">' + escapeHtml(s.name) + '</div>' +
              '<div class="search-result-type">Series' + (s.rating ? ' - ' + s.rating : '') + '</div>' +
            '</div>' +
          '</div>';
        });
        html += '</div>';
      }
    }

    if (!html) {
      html = '<p class="placeholder-text">No results found for "' + escapeHtml(query) + '"</p>';
    }

    results.innerHTML = html;

    // Add click handlers to results
    results.querySelectorAll('.search-result-item').forEach(function(item) {
      item.addEventListener('click', function() {
        var type = item.getAttribute('data-type');
        var id = item.getAttribute('data-id');
        closeSearch();

        if (type === 'live') {
          var stream = AppState.allLiveStreams.find(function(s) { return String(s.stream_id) === id; });
          if (stream) {
            showScreen('live');
            setTimeout(function() {
              var ext = AppState.settings.streamType || 'm3u8';
              var url = AppState.api.liveUrl(stream.stream_id, ext);
              startPlayer(url, stream.name, stream.num, 'live', stream);
            }, 300);
          }
        } else if (type === 'vod') {
          var vod = vodStreams.find(function(s) { return String(s.stream_id) === id; });
          if (vod) {
            showScreen('vod');
            setTimeout(function() { showVodDetail(vod); }, 300);
          }
        } else if (type === 'series') {
          var ser = seriesList.find(function(s) { return String(s.series_id) === id; });
          if (ser) {
            showScreen('series');
            setTimeout(function() { showSeriesDetail(ser); }, 300);
          }
        }
      });
    });
  } catch (err) {
    results.innerHTML = '<p class="placeholder-text">Search failed: ' + escapeHtml(err.message) + '</p>';
  }
}


// ============================================
// Favorites
// ============================================
function toggleFavorite() {
  if (!AppState.selectedChannel) {
    showToast('Select a channel first');
    return;
  }

  var id = AppState.selectedChannel.stream_id;
  if (AppState.favorites[id]) {
    delete AppState.favorites[id];
    showToast('Removed from favorites');
  } else {
    AppState.favorites[id] = true;
    showToast('Added to favorites');
  }

  saveFavorites();

  // Refresh list to update star indicator
  renderChannelList();
}

function toggleSort() {
  if (AppState.sortMode === 'default') {
    AppState.sortMode = 'name';
    showToast('Sorted by name');
  } else if (AppState.sortMode === 'name') {
    AppState.sortMode = 'number';
    showToast('Sorted by number');
  } else {
    AppState.sortMode = 'default';
    showToast('Default order');
  }

  // Re-sort and render
  if (AppState.sortMode === 'name') {
    AppState.liveStreams.sort(function(a, b) {
      return (a.name || '').localeCompare(b.name || '');
    });
  } else if (AppState.sortMode === 'number') {
    AppState.liveStreams.sort(function(a, b) {
      return (parseInt(a.num) || 0) - (parseInt(b.num) || 0);
    });
  } else {
    // Reload to get default order
    loadLiveStreams(AppState.selectedLiveCategory);
    return;
  }
  renderChannelList();
}


// ============================================
// Keyboard / Remote Control handler
// ============================================
document.addEventListener('keydown', function(e) {
  var key = e.key;

  // Player keys
  if (AppState.activeScreen === 'player') {
    switch (key) {
      case 'ArrowUp':
        e.preventDefault();
        changeChannel(-1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        changeChannel(1);
        break;
      case 'Enter':
        e.preventDefault();
        togglePlayerOverlay();
        break;
      case 'Escape':
      case 'Backspace':
        e.preventDefault();
        stopPlayer();
        break;
      case ' ':
        e.preventDefault();
        togglePlayPause();
        showPlayerOverlay();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        adjustVolume(-0.1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        adjustVolume(0.1);
        break;
      case 'm':
      case 'M':
        toggleMute();
        showPlayerOverlay();
        break;
      case 'i':
      case 'I':
        showPlayerOverlay();
        break;
      default:
        // Number keys for direct channel entry
        if (key >= '0' && key <= '9') {
          handleNumberInput(key);
        }
        break;
    }
    return;
  }

  // Global keys
  switch (key) {
    case 'Escape':
    case 'Backspace':
      if (document.getElementById('searchModal').style.display === 'flex') {
        closeSearch();
        e.preventDefault();
      } else if (document.getElementById('vodDetailModal').style.display === 'flex') {
        document.getElementById('vodDetailModal').style.display = 'none';
        e.preventDefault();
      } else if (document.getElementById('seriesDetailModal').style.display === 'flex') {
        document.getElementById('seriesDetailModal').style.display = 'none';
        e.preventDefault();
      } else if (AppState.activeScreen !== 'login' && AppState.activeScreen !== 'home') {
        goBack();
        e.preventDefault();
      }
      break;
  }
});


// ============================================
// Utility
// ============================================
function escapeHtml(text) {
  if (!text) return '';
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(String(text)));
  return div.innerHTML;
}


// ============================================
// Initialize
// ============================================
function init() {
  initLoginScreen();

  // Back buttons
  document.querySelectorAll('[data-back]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      goBack();
    });
  });

  // Player control buttons
  document.getElementById('btnPlayerStop').addEventListener('click', stopPlayer);
  document.getElementById('btnPlayerPlayPause').addEventListener('click', function() {
    togglePlayPause();
    showPlayerOverlay();
  });
  document.getElementById('btnPlayerPrev').addEventListener('click', function() { changeChannel(-1); });
  document.getElementById('btnPlayerNext').addEventListener('click', function() { changeChannel(1); });
  document.getElementById('btnPlayerMute').addEventListener('click', function() {
    toggleMute();
    showPlayerOverlay();
  });

  // Player overlay click to toggle
  document.getElementById('playerOverlay').addEventListener('click', function(e) {
    if (e.target === document.getElementById('playerOverlay') ||
        e.target.closest('.player-top-banner') ||
        e.target.closest('.player-epg-bar')) {
      togglePlayerOverlay();
    }
  });

  // Video element events
  var video = document.getElementById('videoPlayer');
  video.addEventListener('playing', function() {
    AppState.isPlaying = true;
    updatePlayPauseIcon();
  });
  video.addEventListener('pause', function() {
    AppState.isPlaying = false;
    updatePlayPauseIcon();
  });
  video.addEventListener('error', function() {
    showToast('Playback error. Try a different stream type.');
  });
  video.addEventListener('waiting', function() {
    // Could show a buffering indicator
  });

  // Color buttons
  document.getElementById('btnEpg').addEventListener('click', function() {
    showScreen('epg');
  });
  document.getElementById('btnSearch').addEventListener('click', openSearch);
  document.getElementById('btnSort').addEventListener('click', toggleSort);
  document.getElementById('btnFavorite').addEventListener('click', toggleFavorite);
  // Toolbar VOD : utilise les memes handlers que la Live
  var $ = function(id) { return document.getElementById(id); };
  if ($('vodBtnSearch')) $('vodBtnSearch').addEventListener('click', openSearch);
  if ($('vodBtnSort')) $('vodBtnSort').addEventListener('click', toggleSort);
  if ($('vodBtnFavorites')) $('vodBtnFavorites').addEventListener('click', toggleFavorite);
  if ($('vodBtnFilter')) $('vodBtnFilter').addEventListener('click', function() {
    // Place focus sur la sidebar Categories (qui sert de filter par categorie)
    var sb = document.getElementById('vodCategoryList');
    var first = sb && sb.querySelector('li');
    if (first) first.focus();
  });

  // Search modal
  document.getElementById('searchClose').addEventListener('click', closeSearch);
  document.getElementById('searchBtn').addEventListener('click', performSearch);
  document.getElementById('searchInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      performSearch();
    }
  });
  document.querySelector('#searchModal .modal-backdrop').addEventListener('click', closeSearch);

  // Touch support for player overlay on video
  video.addEventListener('click', function() {
    togglePlayerOverlay();
  });
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
