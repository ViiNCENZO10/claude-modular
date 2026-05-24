/* ============================================
   iPremTvOnline - Native player bridge
   Routes playback to native ExoPlayer (hardware decoders)
   when AndroidBridge.playNative is available.
   ============================================ */

function isNativePlayerEnabled() {
  // Default ON when bridge present
  var stored = localStorage.getItem('iprem_native_player');
  if (stored === 'false') return false;
  return !!(window.AndroidBridge && typeof window.AndroidBridge.playNative === 'function');
}

// Resolve a Stalker create_link URL to the actual stream URL by parsing API response
async function resolveStalkerStreamUrl(apiUrl, mac) {
  try {
    if (window.AndroidBridge && typeof window.AndroidBridge.stalkerFetch === 'function') {
      var raw = window.AndroidBridge.stalkerFetch(apiUrl, mac);
      if (raw && raw.length > 0) {
        var data = JSON.parse(raw);
        if (data && data.js && data.js.cmd) {
          var cmd = String(data.js.cmd).trim();
          // Strip "ffmpeg " or "auto " prefix
          cmd = cmd.replace(/^(ffmpeg|auto)\s+/i, '');
          // Some servers return "URL EXTRA_INFO" — keep only the URL token
          var firstToken = cmd.split(/\s/)[0];
          if (firstToken && /^https?:\/\//i.test(firstToken)) return firstToken;
          return cmd;
        }
      }
    }
  } catch (e) {
    console.warn('resolveStalker failed', e);
  }
  return apiUrl;
}

function buildChannelsJsonForLive() {
  try {
    if (!AppState || !AppState.liveStreams || !AppState.api) return null;
    var providerType = AppState.api.providerType || 'xtream';
    var ext = (AppState.settings && AppState.settings.streamType) || 'm3u8';
    var list = AppState.liveStreams.slice(0, 200); // cap to avoid Intent size limits
    var data = list.map(function(s) {
      var entry = {
        stream_id: String(s.stream_id),
        num: s.num || '',
        name: s.name || ''
      };
      // Pre-resolve URL for Xtream and M3U (Stalker resolved on selection)
      if (providerType === 'xtream' && typeof AppState.api.liveUrl === 'function') {
        try { entry.url = AppState.api.liveUrl(s.stream_id, ext); } catch (e) {}
      } else if (providerType === 'm3u' && s._url) {
        entry.url = s._url;
      }
      return entry;
    });
    return JSON.stringify(data);
  } catch (e) { return null; }
}

async function nativePlay(url, title, isLive) {
  try {
    var isStalker = AppState && AppState.api && AppState.api.providerType === 'stalker';
    if (isStalker && url && url.indexOf('create_link') !== -1) {
      showToast && showToast('Résolution du flux...');
      url = await resolveStalkerStreamUrl(url, AppState.api.mac || '');
    }

    var channelsJson = null;
    var currentIdx = -1;
    if (isLive && AppState && AppState.selectedChannel) {
      channelsJson = buildChannelsJsonForLive();
      try {
        currentIdx = (AppState.liveStreams || []).findIndex(function(s) {
          return String(s.stream_id) === String(AppState.selectedChannel.stream_id);
        });
      } catch (e) { currentIdx = -1; }
    }

    // Build groups JSON for live
    var groupsJson = null;
    if (isLive && AppState && AppState.liveCategories) {
      try {
        groupsJson = JSON.stringify(AppState.liveCategories.slice(0, 200).map(function(c) {
          return { category_id: c.category_id, num: '', name: c.category_name || c.name || 'Sans nom' };
        }));
      } catch (e) { groupsJson = null; }
    }

    var cookies = '';
    var ua = '';
    if (isStalker) {
      var mac = AppState.api.mac || '';
      cookies = 'mac=' + encodeURIComponent(mac) + '; stb_lang=en; timezone=Europe%2FParis; adid=' + mac.replace(/:/g, '').toLowerCase();
      ua = 'Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG250 stbapp ver: 4 rev: 2116 Safari/533.3';
    }

    // Alt extensions for VOD 404 fallback
    var altExts = '';
    if (AppState && AppState.selectedVod && AppState.selectedVod._altExts) {
      try { altExts = AppState.selectedVod._altExts.join(','); } catch (e) {}
    }

    if (typeof window.AndroidBridge.playNativeUltimate === 'function') {
      window.AndroidBridge.playNativeUltimate(url || '', title || '', !!isLive, cookies, ua, channelsJson || '', currentIdx, groupsJson || '', altExts);
      return true;
    }
    if (typeof window.AndroidBridge.playNativeAll === 'function') {
      window.AndroidBridge.playNativeAll(url || '', title || '', !!isLive, cookies, ua, channelsJson || '', currentIdx, groupsJson || '');
      return true;
    }
    if (typeof window.AndroidBridge.playNativeFull === 'function') {
      window.AndroidBridge.playNativeFull(url || '', title || '', !!isLive, cookies, ua, channelsJson || '', currentIdx);
      return true;
    }

    if (isStalker && typeof window.AndroidBridge.playNativeWithAuth === 'function') {
      var mac2 = AppState.api.mac || '';
      var cookies2 = 'mac=' + encodeURIComponent(mac2) + '; stb_lang=en; timezone=Europe%2FParis; adid=' + mac2.replace(/:/g, '').toLowerCase();
      var ua2 = 'Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG250 stbapp ver: 4 rev: 2116 Safari/533.3';
      window.AndroidBridge.playNativeWithAuth(url || '', title || '', !!isLive, cookies2, ua2);
      return true;
    }
    window.AndroidBridge.playNative(url || '', title || '', !!isLive);
    return true;
  } catch (e) {
    console.warn('nativePlay failed', e);
    return false;
  }
}

// JS callback invoked from MainActivity when user picks a channel in sidebar
// (Stalker case where URL needs re-resolution)
window.iprem = window.iprem || {};
window.iprem.switchChannel = async function(idx, streamId) {
  try {
    var streams = AppState.liveStreams || [];
    var ch = streams.find(function(s) { return String(s.stream_id) === String(streamId); });
    if (!ch) return;
    AppState.selectedChannel = ch;
    AppState.currentChannelIndex = idx;
    var ext = (AppState.settings && AppState.settings.streamType) || 'm3u8';
    var url = AppState.api.liveUrl(ch.stream_id, ext);
    if (typeof window.startPlayer === 'function') {
      window.startPlayer(url, ch.name, ch.num || '', 'live', ch);
    }
  } catch (e) { console.warn('switchChannel failed', e); }
};

// Switch to a category/group and play the first channel of that group
window.iprem.switchGroup = async function(categoryId) {
  try {
    if (!AppState.api || typeof AppState.api.getLiveStreams !== 'function') return;
    showToast && showToast('Chargement du groupe...');
    var streams = await AppState.api.getLiveStreams(categoryId);
    if (!streams || streams.length === 0) {
      showToast && showToast('Aucune chaîne dans ce groupe');
      return;
    }
    AppState.liveStreams = streams;
    AppState.selectedLiveCategory = categoryId;
    // Play first channel
    var ch = streams[0];
    AppState.selectedChannel = ch;
    AppState.currentChannelIndex = 0;
    var ext = (AppState.settings && AppState.settings.streamType) || 'm3u8';
    var url = AppState.api.liveUrl(ch.stream_id, ext);
    if (typeof window.startPlayer === 'function') {
      window.startPlayer(url, ch.name, ch.num || '', 'live', ch);
    }
  } catch (e) { console.warn('switchGroup failed', e); showToast && showToast('Erreur changement de groupe'); }
};

// Build a setting toggle in Settings screen
function buildNativePlayerToggle() {
  if (document.getElementById('settingNativePlayer')) return;
  if (!(window.AndroidBridge && typeof window.AndroidBridge.playNative === 'function')) return;
  var layout = document.querySelector('#settings .settings-sections');
  if (!layout) return;

  var section = document.createElement('div');
  section.className = 'settings-section';
  section.innerHTML =
    '<h3>Native Player</h3>' +
    '<div class="setting-row focusable" tabindex="0">' +
      '<span class="setting-label">Hardware Decoder (HEVC / Dolby AC3·EAC3 / DTS)</span>' +
      '<label class="iprem-switch"><input type="checkbox" id="settingNativePlayer"><span class="iprem-slider"></span></label>' +
    '</div>' +
    '<div class="setting-row">' +
      '<span class="setting-help" style="font-size:12px;color:#888">ON: ExoPlayer natif (Realtek RTD129x/RTD131x hardware). OFF: WebView HTML5 (fallback)</span>' +
    '</div>';
  layout.appendChild(section);

  var cb = document.getElementById('settingNativePlayer');
  cb.checked = isNativePlayerEnabled();
  cb.addEventListener('change', function() {
    localStorage.setItem('iprem_native_player', cb.checked ? 'true' : 'false');
    showToast('Native player ' + (cb.checked ? 'ON' : 'OFF'));
  });
}

// Inject CSS for switch
function injectExoStyles() {
  if (document.getElementById('iprem-exo-styles')) return;
  var s = document.createElement('style');
  s.id = 'iprem-exo-styles';
  s.textContent =
    '.iprem-switch{position:relative;display:inline-block;width:46px;height:24px}' +
    '.iprem-switch input{opacity:0;width:0;height:0}' +
    '.iprem-slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:#475569;border-radius:24px;transition:.2s}' +
    '.iprem-slider:before{position:absolute;content:"";height:18px;width:18px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.2s}' +
    '.iprem-switch input:checked + .iprem-slider{background:#3b82f6}' +
    '.iprem-switch input:checked + .iprem-slider:before{transform:translateX(22px)}';
  document.head.appendChild(s);
}

window.addEventListener('DOMContentLoaded', function() {
  injectExoStyles();

  // Intercept startPlayer to route to native bridge when possible
  setTimeout(function() {
    if (typeof window.startPlayer !== 'function') return;
    var origStartPlayer = window.startPlayer;
    window.startPlayer = function(url, name, number, type, stream) {
      if (isNativePlayerEnabled()) {
        var title = name || (stream && stream.name) || '';
        var isLive = (type === 'live' || type === 'catchup');
        if (nativePlay(url, title, isLive)) {
          // Skip WebView player overlay — native takes over
          try {
            // Record recommendation if applicable
            if (type === 'live' && stream && typeof Recommendations !== 'undefined') {
              Recommendations.recordPlay(stream);
            }
          } catch (e) {}
          return;
        }
      }
      // Fallback: original WebView HTML5 player
      return origStartPlayer.apply(this, arguments);
    };
  }, 350);

  // Add settings toggle when Settings screen is rendered
  setTimeout(function() {
    if (typeof window.showScreen === 'function') {
      var orig = window.showScreen;
      window.showScreen = function(id) {
        var r = orig.apply(this, arguments);
        if (id === 'settings') {
          setTimeout(buildNativePlayerToggle, 100);
        }
        return r;
      };
    }
  }, 450);
});
