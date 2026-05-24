/* ============================================
   iPremTvOnline - Provider adapters
   Adds Stalker Portal (MAC auth) + M3U Playlist support
   Plus remote-portal-add via configurable URL
   All providers expose XtreamAPI-compatible interface
   ============================================ */

// ========== Stalker Portal (Ministra) Provider ==========
class StalkerProvider {
  constructor(server, mac, serial) {
    this.baseUrl = server.replace(/\/+$/, '');
    this.mac = (mac || '').toUpperCase();
    this.serial = serial || '';
    this.token = null;
    this.identity = null;
    this.providerType = 'stalker';
    this.username = this.mac;
    this.password = '';
  }

  _headers() {
    return {
      'Cookie': 'mac=' + encodeURIComponent(this.mac) + '; stb_lang=en; timezone=Europe%2FParis',
      'X-User-Agent': 'Model: MAG250; Link: WiFi',
      'User-Agent': 'Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 4 rev: 250 Safari/533.3',
      'Authorization': this.token ? ('Bearer ' + this.token) : ''
    };
  }

  async _portal(params) {
    const url = new URL(this.baseUrl + '/portal.php');
    url.searchParams.set('JsHttpRequest', '1-xml');
    for (const [k, v] of Object.entries(params || {})) url.searchParams.set(k, v);
    const r = await fetch(url.toString(), { headers: this._headers() });
    if (!r.ok) throw new Error('Stalker HTTP ' + r.status);
    return r.json();
  }

  async login() {
    // 1) handshake
    try {
      const hs = await this._portal({ type: 'stb', action: 'handshake', token: '', prehash: '' });
      if (hs && hs.js && hs.js.token) this.token = hs.js.token;
    } catch (e) {
      // Some Stalker variants need POST or different URL — fallback to GET-only
    }
    // 2) get profile / account info
    let profile = null;
    try {
      const p = await this._portal({ type: 'stb', action: 'get_profile' });
      profile = p && p.js ? p.js : null;
    } catch (e) {}
    this.identity = profile;
    return {
      user_info: {
        username: this.mac,
        status: profile && profile.id ? 'Active' : 'Active',
        exp_date: profile && profile.account_balance ? profile.account_balance : '',
        max_connections: '1',
        active_cons: '1'
      },
      server_info: { url: this.baseUrl }
    };
  }

  async getLiveCategories() {
    const r = await this._portal({ type: 'itv', action: 'get_genres' });
    const arr = (r && r.js) ? r.js : [];
    return arr.map(function(g) { return { category_id: String(g.id), category_name: g.title }; });
  }

  async getLiveStreams(categoryId) {
    const params = { type: 'itv', action: 'get_ordered_list', p: 1, JsHttpRequest: '1-xml' };
    if (categoryId) params.genre = categoryId;
    const r = await this._portal(params);
    const list = (r && r.js && r.js.data) ? r.js.data : [];
    return list.map(function(c) {
      return {
        num: c.number,
        name: c.name,
        stream_id: c.id,
        stream_icon: c.logo,
        epg_channel_id: c.xmltv_id || '',
        tv_archive: c.tv_archive || 0,
        _stalker_cmd: c.cmd
      };
    });
  }

  async getVodCategories() {
    try {
      const r = await this._portal({ type: 'vod', action: 'get_categories' });
      const arr = (r && r.js) ? r.js : [];
      return arr.map(function(g) { return { category_id: String(g.id), category_name: g.title }; });
    } catch (e) { return []; }
  }

  async getVodStreams(categoryId) {
    try {
      const params = { type: 'vod', action: 'get_ordered_list', p: 1 };
      if (categoryId) params.category = categoryId;
      const r = await this._portal(params);
      const list = (r && r.js && r.js.data) ? r.js.data : [];
      return list.map(function(v) {
        return {
          stream_id: v.id,
          name: v.name,
          stream_icon: v.screenshot_uri || v.poster,
          rating: v.rating_imdb,
          year: v.year,
          _stalker_cmd: v.cmd
        };
      });
    } catch (e) { return []; }
  }

  async getSeriesCategories() {
    try {
      const r = await this._portal({ type: 'series', action: 'get_categories' });
      const arr = (r && r.js) ? r.js : [];
      return arr.map(function(g) { return { category_id: String(g.id), category_name: g.title }; });
    } catch (e) { return []; }
  }

  async getSeries(categoryId) {
    try {
      const params = { type: 'series', action: 'get_ordered_list', p: 1 };
      if (categoryId) params.category = categoryId;
      const r = await this._portal(params);
      const list = (r && r.js && r.js.data) ? r.js.data : [];
      return list.map(function(s) {
        return { series_id: s.id, name: s.name, cover: s.screenshot_uri, year: s.year, _stalker_cmd: s.cmd };
      });
    } catch (e) { return []; }
  }

  async getSeriesInfo(seriesId) {
    return { info: {}, seasons: [], episodes: {} };
  }

  async getShortEPG(streamId) {
    try {
      const r = await this._portal({ type: 'itv', action: 'get_short_epg', ch_id: streamId });
      const arr = (r && r.js) ? r.js : [];
      return { epg_listings: arr.map(function(e) {
        return { title: e.name, description: e.descr, start: e.time, end: e.time_to };
      }) };
    } catch (e) { return { epg_listings: [] }; }
  }

  async getFullEPG(streamId) {
    return this.getShortEPG(streamId);
  }

  async getCatchupEPG(streamId, date) {
    return this.getShortEPG(streamId);
  }

  liveUrl(streamId) {
    // Need to resolve via create_link with cmd from the channel object
    // Caller should pass the cmd from getLiveStreams data
    return this.baseUrl + '/portal.php?type=itv&action=create_link&cmd=auto%20' + encodeURIComponent('http://localhost/ch/' + streamId + '_') + '&JsHttpRequest=1-xml';
  }

  vodUrl(streamId) {
    return this.baseUrl + '/portal.php?type=vod&action=create_link&cmd=' + encodeURIComponent(streamId) + '&JsHttpRequest=1-xml';
  }

  seriesUrl(episodeId) {
    return this.vodUrl(episodeId);
  }

  timeshiftUrl(streamId, start, duration) {
    return this.baseUrl + '/portal.php?type=itv&action=create_link&cmd=' + encodeURIComponent('archive/' + streamId + '/' + start) + '&JsHttpRequest=1-xml';
  }
}


// ========== M3U Playlist Provider ==========
class M3UProvider {
  constructor(playlistUrl, epgUrl) {
    this.playlistUrl = playlistUrl;
    this.epgUrl = epgUrl || '';
    this.channels = [];
    this.groups = [];
    this.providerType = 'm3u';
    this.username = 'm3u';
    this.password = '';
    this.baseUrl = playlistUrl;
  }

  async _fetchPlaylist() {
    if (this.channels.length > 0) return;
    const r = await fetch(this.playlistUrl);
    if (!r.ok) throw new Error('M3U HTTP ' + r.status);
    const txt = await r.text();
    this._parse(txt);
  }

  _parse(content) {
    const lines = content.split(/\r?\n/);
    const channels = [];
    const groupSet = new Set();
    let current = null;
    let id = 1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#EXTINF')) {
        const attrs = {};
        const reAttr = /([\w-]+)="([^"]*)"/g;
        let m;
        while ((m = reAttr.exec(line)) !== null) attrs[m[1]] = m[2];
        const nameMatch = line.match(/,(.+)$/);
        current = {
          stream_id: id++,
          name: nameMatch ? nameMatch[1].trim() : ('Channel ' + id),
          stream_icon: attrs['tvg-logo'] || '',
          epg_channel_id: attrs['tvg-id'] || '',
          category_id: attrs['group-title'] || 'Default',
          num: id - 1
        };
        if (current.category_id) groupSet.add(current.category_id);
      } else if (line && !line.startsWith('#') && current) {
        current._url = line;
        channels.push(current);
        current = null;
      }
    }
    this.channels = channels;
    this.groups = Array.from(groupSet).map(function(g, i) {
      return { category_id: g, category_name: g };
    });
  }

  async login() {
    await this._fetchPlaylist();
    return {
      user_info: {
        username: 'M3U',
        status: 'Active',
        exp_date: '',
        max_connections: '1',
        active_cons: '1'
      },
      server_info: { url: this.playlistUrl }
    };
  }

  async getLiveCategories() {
    await this._fetchPlaylist();
    return this.groups;
  }

  async getLiveStreams(categoryId) {
    await this._fetchPlaylist();
    if (!categoryId) return this.channels;
    return this.channels.filter(function(c) { return c.category_id === categoryId; });
  }

  async getVodCategories() { return []; }
  async getVodStreams() { return []; }
  async getSeriesCategories() { return []; }
  async getSeries() { return []; }
  async getSeriesInfo() { return { info: {}, seasons: [], episodes: {} }; }

  async getShortEPG(streamId) { return { epg_listings: [] }; }
  async getFullEPG(streamId) { return { epg_listings: [] }; }
  async getCatchupEPG(streamId, date) { return { epg_listings: [] }; }

  liveUrl(streamId) {
    const ch = this.channels.find(function(c) { return c.stream_id === streamId; });
    return ch ? ch._url : '';
  }

  vodUrl() { return ''; }
  seriesUrl() { return ''; }
  timeshiftUrl() { return ''; }
}


// ========== Remote Portal Sync ==========
// Fetches a remote JSON URL and merges its portals into local storage.
// Expected JSON shape: { "portals": [ { "name":"...", "type":"xtream|stalker|m3u", "server":"...", "username":"...", "password":"...", "mac":"...", "playlistUrl":"..." } ] }
async function syncRemotePortals(silent) {
  const url = localStorage.getItem('iprem_remote_url') || '';
  if (!url) {
    if (!silent) showToast('Configure Remote URL in Settings');
    return 0;
  }
  try {
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    const incoming = (data && data.portals) ? data.portals : [];
    if (!Array.isArray(incoming) || incoming.length === 0) {
      if (!silent) showToast('No remote portals');
      return 0;
    }
    let existing = [];
    try { existing = JSON.parse(localStorage.getItem('iprem_portals') || '[]'); } catch (e) {}
    const sig = function(p) {
      return (p.type || 'xtream') + '|' + (p.server || p.playlistUrl || '') + '|' + (p.username || p.mac || '');
    };
    const existingSigs = new Set(existing.map(sig));
    let added = 0;
    for (const p of incoming) {
      if (!existingSigs.has(sig(p))) {
        existing.push(p);
        added++;
      }
    }
    if (added > 0) {
      localStorage.setItem('iprem_portals', JSON.stringify(existing));
      if (!silent) showToast(added + ' portal(s) added from remote');
    } else if (!silent) {
      showToast('Already up to date');
    }
    return added;
  } catch (e) {
    if (!silent) showToast('Remote sync failed: ' + e.message);
    return 0;
  }
}


// ========== Provider factory: choose based on portal.type ==========
function buildProvider(portal) {
  const type = (portal.type || 'xtream').toLowerCase();
  if (type === 'stalker') {
    return new StalkerProvider(portal.server, portal.mac, portal.serial);
  }
  if (type === 'm3u') {
    return new M3UProvider(portal.playlistUrl || portal.server, portal.epgUrl);
  }
  // default xtream — relies on global XtreamAPI from app.js
  return new XtreamAPI(portal.server, portal.username, portal.password);
}


// ========== Hook into existing app: replace AppState.api on login ==========
// We patch doLogin so it builds the right provider based on the form's selected type
window.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    if (typeof window.doLogin !== 'function') return;
    var origDoLogin = window.doLogin;

    window.doLogin = function() {
      var loginType = (document.querySelector('input[name="loginType"]:checked') || {}).value || 'xtream';
      var server = (document.getElementById('serverUrl') || {}).value || '';
      var username = (document.getElementById('username') || {}).value || '';
      var password = (document.getElementById('password') || {}).value || '';
      var mac = (document.getElementById('macAddress') || {}).value || '';
      var m3uUrl = (document.getElementById('m3uUrl') || {}).value || '';

      if (loginType === 'xtream') {
        // Use original flow
        return origDoLogin.apply(this, arguments);
      }

      // Custom flow for stalker / m3u
      var portal;
      if (loginType === 'stalker') {
        if (!server || !mac) { showToast('Server URL + MAC required'); return; }
        portal = { type: 'stalker', server: server, mac: mac, name: 'Stalker ' + mac };
      } else if (loginType === 'm3u') {
        if (!m3uUrl) { showToast('Playlist URL required'); return; }
        portal = { type: 'm3u', playlistUrl: m3uUrl, server: m3uUrl, username: 'm3u', name: 'M3U' };
      }

      // Show loading
      try { showLoginLoading(); } catch (e) {}
      var api = buildProvider(portal);

      api.login().then(function(authData) {
        AppState.api = api;
        AppState.userInfo = (authData && authData.user_info) || { username: portal.username || portal.mac, status: 'Active' };
        AppState.serverInfo = (authData && authData.server_info) || { url: portal.server };

        // Save portal if not already present
        var existing = [];
        try { existing = JSON.parse(localStorage.getItem('iprem_portals') || '[]'); } catch (e) {}
        var found = existing.find(function(p) {
          return (p.type || 'xtream') === portal.type &&
            (p.server === portal.server || p.playlistUrl === portal.playlistUrl) &&
            (p.mac === portal.mac || p.username === portal.username);
        });
        if (!found) {
          existing.push(portal);
          localStorage.setItem('iprem_portals', JSON.stringify(existing));
        }

        try { hideLoginError(); hideLoginLoading && hideLoginLoading(); } catch (e) {}
        try { loadFavorites(); } catch (e) {}

        // Update Home labels
        var hg = document.getElementById('homeGreeting');
        if (hg) hg.textContent = t('Welcome') + ', ' + (AppState.userInfo.username || '');
        var topUser = document.getElementById('topUserInfo');
        if (topUser) topUser.textContent = AppState.userInfo.username || '';
        var topPortal = document.getElementById('topPortalName');
        if (topPortal) topPortal.textContent = portal.name || '';

        showScreen('home');
      }).catch(function(err) {
        try { showLoginError(err.message || String(err)); } catch (e) { showToast('Login failed: ' + err.message); }
        try { hideLoginLoading && hideLoginLoading(); } catch (e) {}
      });
    };
  }, 250);
});


// ========== Build login type tabs + Stalker/M3U fields ==========
function buildLoginTypeTabs() {
  var form = document.getElementById('loginForm');
  if (!form || document.getElementById('loginTypeRow')) return;

  // Row of radio buttons
  var row = document.createElement('div');
  row.id = 'loginTypeRow';
  row.className = 'form-group login-type-row';
  row.innerHTML =
    '<label class="login-type-opt"><input type="radio" name="loginType" value="xtream" checked> <span>Xtream Codes</span></label>' +
    '<label class="login-type-opt"><input type="radio" name="loginType" value="stalker"> <span>Stalker (MAC)</span></label>' +
    '<label class="login-type-opt"><input type="radio" name="loginType" value="m3u"> <span>Playlist M3U</span></label>';
  form.insertBefore(row, form.firstChild);

  // Add Stalker field
  var macGroup = document.createElement('div');
  macGroup.className = 'form-group stalker-only';
  macGroup.style.display = 'none';
  macGroup.innerHTML =
    '<label for="macAddress">MAC Address</label>' +
    '<input type="text" id="macAddress" placeholder="00:1A:79:XX:XX:XX">';
  form.insertBefore(macGroup, form.querySelector('.form-actions'));

  // Add M3U field
  var m3uGroup = document.createElement('div');
  m3uGroup.className = 'form-group m3u-only';
  m3uGroup.style.display = 'none';
  m3uGroup.innerHTML =
    '<label for="m3uUrl">Playlist URL (.m3u / .m3u8)</label>' +
    '<input type="url" id="m3uUrl" placeholder="https://example.com/list.m3u">';
  form.insertBefore(m3uGroup, form.querySelector('.form-actions'));

  // Toggle field visibility based on selected type
  var toggle = function() {
    var t = (document.querySelector('input[name="loginType"]:checked') || {}).value || 'xtream';
    var xtreamFields = [document.getElementById('serverUrl'), document.getElementById('username'), document.getElementById('password')];
    var xtreamGroups = xtreamFields.map(function(f) { return f ? f.closest('.form-group') : null; });

    if (t === 'xtream') {
      xtreamGroups.forEach(function(g) { if (g) g.style.display = ''; });
      macGroup.style.display = 'none';
      m3uGroup.style.display = 'none';
    } else if (t === 'stalker') {
      // Show server + mac
      if (xtreamGroups[0]) xtreamGroups[0].style.display = ''; // server
      if (xtreamGroups[1]) xtreamGroups[1].style.display = 'none';
      if (xtreamGroups[2]) xtreamGroups[2].style.display = 'none';
      macGroup.style.display = '';
      m3uGroup.style.display = 'none';
    } else if (t === 'm3u') {
      xtreamGroups.forEach(function(g) { if (g) g.style.display = 'none'; });
      macGroup.style.display = 'none';
      m3uGroup.style.display = '';
    }
    // Adjust required attributes so submit works
    xtreamFields.forEach(function(f) { if (f) f.required = (t === 'xtream') || (f.id === 'serverUrl' && t === 'stalker'); });
  };
  row.addEventListener('change', toggle);
  toggle();
}


// ========== Build Remote-Add section in Settings ==========
function buildRemoteAddSettings() {
  if (document.getElementById('settingRemoteUrl')) return;
  var layout = document.querySelector('#settings .settings-sections');
  if (!layout) return;

  var section = document.createElement('div');
  section.className = 'settings-section';
  var remoteUrl = localStorage.getItem('iprem_remote_url') || '';
  section.innerHTML =
    '<h3>Remote Portal Add</h3>' +
    '<div class="setting-row focusable" tabindex="0">' +
      '<span class="setting-label">Remote URL (JSON)</span>' +
      '<input type="url" id="settingRemoteUrl" class="setting-input" placeholder="https://example.com/portals.json" value="' + remoteUrl.replace(/"/g, '&quot;') + '">' +
    '</div>' +
    '<div class="setting-row">' +
      '<button class="btn btn-secondary focusable" id="btnSyncRemote" tabindex="0">Sync remote portals now</button>' +
    '</div>' +
    '<div class="setting-row">' +
      '<span class="setting-help" style="font-size:12px;color:#888">Expected JSON: { "portals": [ {"type":"xtream","server":"...","username":"...","password":"..."}, {"type":"stalker","server":"...","mac":"00:1A:..."}, {"type":"m3u","playlistUrl":"..."} ] }</span>' +
    '</div>';
  layout.appendChild(section);

  document.getElementById('settingRemoteUrl').addEventListener('change', function(e) {
    localStorage.setItem('iprem_remote_url', e.target.value.trim());
    showToast('Remote URL saved');
  });
  document.getElementById('btnSyncRemote').addEventListener('click', function() {
    var v = document.getElementById('settingRemoteUrl').value.trim();
    if (v) localStorage.setItem('iprem_remote_url', v);
    syncRemotePortals(false).then(function(n) {
      if (n > 0) setTimeout(function() { try { renderPortalList(); } catch (e) {} }, 300);
    });
  });
}


// ========== CSS for login tabs + remote section ==========
function injectProviderStyles() {
  if (document.getElementById('iprem-provider-styles')) return;
  var s = document.createElement('style');
  s.id = 'iprem-provider-styles';
  s.textContent =
    '.login-type-row{display:flex;gap:8px;justify-content:center;margin-bottom:14px}' +
    '.login-type-opt{display:flex;align-items:center;gap:6px;padding:8px 12px;border:1px solid #334155;border-radius:8px;cursor:pointer;background:#1e293b;color:#cbd5e1;font-size:13px}' +
    '.login-type-opt input{accent-color:#3b82f6}' +
    '.login-type-opt:has(input:checked){background:#1e40af;border-color:#3b82f6;color:#fff}';
  document.head.appendChild(s);
}


// ========== Initial bootstrap for providers + remote add ==========
window.addEventListener('DOMContentLoaded', function() {
  injectProviderStyles();

  // Wait a moment so login screen is fully rendered, then add tabs
  setTimeout(buildLoginTypeTabs, 300);

  // Hook into settings screen build
  setTimeout(function() {
    if (typeof window.showScreen === 'function') {
      var orig = window.showScreen;
      window.showScreen = function(id) {
        var r = orig.apply(this, arguments);
        if (id === 'settings') {
          setTimeout(buildRemoteAddSettings, 80);
        }
        return r;
      };
    }
  }, 400);

  // Auto-sync remote portals at startup (silent)
  setTimeout(function() { syncRemotePortals(true); }, 3000);
});
