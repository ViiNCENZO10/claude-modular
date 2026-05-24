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

function nativePlay(url, title, isLive) {
  try {
    window.AndroidBridge.playNative(url || '', title || '', !!isLive);
    return true;
  } catch (e) {
    console.warn('nativePlay failed', e);
    return false;
  }
}

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
