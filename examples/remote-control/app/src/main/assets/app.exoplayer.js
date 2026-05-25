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

// ===== Pre-resolution Stalker au focus chaine =====
// Quand l'user navigue D-pad sur une chaine, on resout l'URL en arriere-plan.
// Au moment du clic Play, l'URL est deja resolue => GAIN 2-5 SECONDES.
// Cache 5 min par chaine (le ttl Stalker des links est typiquement court).
var _stalkerResolveCache = {};
function preResolveStalkerForChannel(stream) {
  if (!stream || !stream.stream_id) return;
  if (!AppState || !AppState.api || AppState.api.providerType !== 'stalker') return;
  var sid = String(stream.stream_id);
  // Deja resolu et frais ?
  var cached = _stalkerResolveCache[sid];
  if (cached && cached.url && (Date.now() - cached.t < 4 * 60 * 1000) /* 4min */) {
    stream._resolvedUrl = cached.url;
    stream._resolvedAt = cached.t;
    return;
  }
  // Marque "in flight" pour eviter de retrigger pendant qu'on attend
  if (cached && cached.inflight) return;
  _stalkerResolveCache[sid] = { inflight: true, t: Date.now() };

  try {
    var ext = (AppState.settings && AppState.settings.streamType) || 'm3u8';
    var apiUrl = AppState.api.liveUrl(stream.stream_id, ext);
    var mac = AppState.api.mac || '';
    (async function() {
      try {
        var resolved = await resolveStalkerStreamUrl(apiUrl, mac);
        if (resolved && resolved !== apiUrl) {
          var now = Date.now();
          _stalkerResolveCache[sid] = { url: resolved, t: now };
          stream._resolvedUrl = resolved;
          stream._resolvedAt = now;
        } else {
          delete _stalkerResolveCache[sid];
        }
      } catch (e) {
        delete _stalkerResolveCache[sid];
      }
    })();
  } catch (e) {
    delete _stalkerResolveCache[sid];
  }
}
window.preResolveStalkerForChannel = preResolveStalkerForChannel;

function buildChannelsJsonForLive() {
  try {
    if (!AppState || !AppState.liveStreams || !AppState.api) return null;
    var providerType = AppState.api.providerType || 'xtream';
    var ext = (AppState.settings && AppState.settings.streamType) || 'm3u8';
    var list = AppState.liveStreams.slice(0, 200);
    // EPG cache map - filled by background prefetch
    var epgMap = (AppState._nowEpgMap || {});
    var data = list.map(function(s) {
      var entry = {
        stream_id: String(s.stream_id),
        num: s.num || '',
        name: s.name || '',
        now: epgMap[s.stream_id] || ''
      };
      if (providerType === 'xtream' && typeof AppState.api.liveUrl === 'function') {
        try { entry.url = AppState.api.liveUrl(s.stream_id, ext); } catch (e) {}
      } else if (providerType === 'm3u' && s._url) {
        entry.url = s._url;
      } else if (providerType === 'stalker') {
        // Pre-build the create_link API URL with cmd if known
        try { entry.url = AppState.api.liveUrl(s.stream_id, ext); } catch (e) {}
      }
      return entry;
    });
    return JSON.stringify(data);
  } catch (e) { return null; }
}

// Background EPG prefetch — populates AppState._nowEpgMap[stream_id] = "current program title"
// Called after liveStreams are loaded; non-blocking
async function prefetchNowEpg() {
  if (!AppState || !AppState.api || !AppState.liveStreams) return;
  if (typeof AppState.api.getShortEPG !== 'function') return;
  AppState._nowEpgMap = AppState._nowEpgMap || {};
  var streams = AppState.liveStreams.slice(0, 50); // top 50 only
  // Parallel batches of 5
  var BATCH = 5;
  for (var i = 0; i < streams.length; i += BATCH) {
    var chunk = streams.slice(i, i + BATCH);
    await Promise.all(chunk.map(async function(s) {
      try {
        var data = await AppState.api.getShortEPG(s.stream_id);
        var listings = (data && data.epg_listings) ? data.epg_listings : [];
        // Find current program (start <= now <= end)
        var nowMs = Date.now();
        for (var j = 0; j < listings.length; j++) {
          var p = listings[j];
          var startMs = parseInt(p.start) * 1000;
          var endMs = parseInt(p.end || p.stop) * 1000;
          if (isNaN(startMs)) { startMs = Date.parse(p.start); endMs = Date.parse(p.end || p.stop || ''); }
          if (!isNaN(startMs) && !isNaN(endMs) && startMs <= nowMs && nowMs <= endMs) {
            var raw = p.title || p.name || '';
            // Sanitize before storing
            if (window.iprem && window.iprem.looksLikeGarbage && window.iprem.looksLikeGarbage(raw)) {
              break;
            }
            if (window.iprem && window.iprem.sanitize) raw = window.iprem.sanitize(raw);
            AppState._nowEpgMap[s.stream_id] = raw;
            break;
          }
        }
      } catch (e) {}
    }));
  }
}

// Trigger prefetch after live streams loaded (debounced)
var _epgPrefetchTimer = null;
function scheduleEpgPrefetch() {
  if (_epgPrefetchTimer) clearTimeout(_epgPrefetchTimer);
  _epgPrefetchTimer = setTimeout(function() {
    prefetchNowEpg().catch(function() {});
  }, 500);
}

async function nativePlay(url, title, isLive) {
  try {
    var isStalker = AppState && AppState.api && AppState.api.providerType === 'stalker';
    if (isStalker && url && url.indexOf('create_link') !== -1) {
      // OPTIMISATION : si l'URL a deja ete resolue en pre-fetch (au focus),
      // on l'utilise directement => GAIN 2-5s sur le demarrage
      var ch = (AppState && AppState.selectedChannel) || null;
      if (ch && ch._resolvedUrl) {
        url = ch._resolvedUrl;
      } else {
        // Sinon resolution synchrone (cas du clic direct sans focus prealable)
        url = await resolveStalkerStreamUrl(url, AppState.api.mac || '');
      }
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

  var forceVlc = false;
  try {
    if (typeof window.AndroidBridge.getForceVlc === 'function') forceVlc = window.AndroidBridge.getForceVlc();
  } catch (e) {}

  var section = document.createElement('div');
  section.className = 'settings-section';
  section.innerHTML =
    '<h3>Lecteur vidéo</h3>' +
    '<div class="setting-row focusable" tabindex="0">' +
      '<span class="setting-label">Décodeur hardware ExoPlayer (HEVC / VP9 / AAC)</span>' +
      '<label class="iprem-switch"><input type="checkbox" id="settingNativePlayer"><span class="iprem-slider"></span></label>' +
    '</div>' +
    '<div class="setting-row focusable" tabindex="0">' +
      '<span class="setting-label">Forcer VLC pour TOUT (AC3, DTS, AVI, formats exotiques)</span>' +
      '<label class="iprem-switch"><input type="checkbox" id="settingForceVlc"' + (forceVlc ? ' checked' : '') + '><span class="iprem-slider"></span></label>' +
    '</div>' +
    '<div class="setting-row">' +
      '<span class="setting-help" style="font-size:12px;color:#888">ON: tous les flux passent par VLC (universel, codecs exotiques). OFF: ExoPlayer (rapide, hardware) avec auto-fallback VLC en cas d\'erreur. Auto-bascule VLC pour AVI/MOV/WMV.</span>' +
    '</div>';
  layout.appendChild(section);

  var cb = document.getElementById('settingNativePlayer');
  cb.checked = isNativePlayerEnabled();
  cb.addEventListener('change', function() {
    localStorage.setItem('iprem_native_player', cb.checked ? 'true' : 'false');
    showToast('Décodeur hardware ' + (cb.checked ? 'ON' : 'OFF'));
  });

  var fvCb = document.getElementById('settingForceVlc');
  if (fvCb) {
    fvCb.addEventListener('change', function() {
      try {
        if (typeof window.AndroidBridge.setForceVlc === 'function') {
          window.AndroidBridge.setForceVlc(fvCb.checked);
        }
        showToast('Forcer VLC ' + (fvCb.checked ? 'ON' : 'OFF'));
      } catch (e) {}
    });
  }
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

  // Trigger EPG prefetch whenever live streams change
  setTimeout(function() {
    if (typeof window.initLiveScreen === 'function') {
      var orig = window.initLiveScreen;
      window.initLiveScreen = async function() {
        var r = await orig.apply(this, arguments);
        scheduleEpgPrefetch();
        return r;
      };
    }
  }, 1500);

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
