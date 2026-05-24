/* ============================================
   iPremTvOnline - TV remote / D-pad spatial navigation
   Makes the app usable from Android TV remote control:
   - Arrow keys navigate by visual position (not DOM order)
   - Enter / OK / DPAD_CENTER triggers click on focused element
   - Escape / Back navigates back
   - Menu key opens side menu
   - Auto-focus first element on every screen change
   - Strong visible focus ring
   ============================================ */

(function() {
  'use strict';

  // ====== Find all focusable elements currently visible ======
  function findFocusables() {
    var selectors = [
      '[tabindex]:not([disabled]):not([tabindex="-1"])',
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '.focusable',
      '[role="button"]'
    ];
    var nodes = document.querySelectorAll(selectors.join(','));
    var result = [];
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (isVisible(el)) result.push(el);
    }
    return result;
  }

  function isVisible(el) {
    if (!el || !el.offsetParent && el.tagName !== 'BODY') {
      // offsetParent null could mean position:fixed inside hidden parent
      // We still check getBoundingClientRect
    }
    var r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return false;
    // Walk up ancestors to check display/visibility
    var p = el;
    while (p && p !== document.body && p !== document.documentElement) {
      var cs;
      try { cs = window.getComputedStyle(p); } catch (e) { return true; }
      if (!cs) return true;
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      if (parseFloat(cs.opacity) === 0) return false;
      p = p.parentElement;
    }
    return true;
  }

  // ====== Spatial navigation ======
  function navigate(dir) {
    var current = document.activeElement;
    var focusables = findFocusables();
    if (focusables.length === 0) return;

    // If nothing focused or body is focused, pick the first
    if (!current || current === document.body || current === document.documentElement) {
      focusables[0].focus();
      return;
    }

    // If current is not in focusables (hidden or removed), focus first
    if (focusables.indexOf(current) === -1) {
      focusables[0].focus();
      return;
    }

    var cr = current.getBoundingClientRect();
    var cx = cr.left + cr.width / 2;
    var cy = cr.top + cr.height / 2;

    var best = null;
    var bestScore = Infinity;

    for (var i = 0; i < focusables.length; i++) {
      var el = focusables[i];
      if (el === current) continue;
      var r = el.getBoundingClientRect();
      var ex = r.left + r.width / 2;
      var ey = r.top + r.height / 2;
      var dx = ex - cx;
      var dy = ey - cy;

      // Filter: must be in the requested direction (with tolerance)
      var primary, perpendicular;
      switch (dir) {
        case 'up':    if (dy >= -5)   continue; primary = -dy; perpendicular = Math.abs(dx); break;
        case 'down':  if (dy <= 5)    continue; primary = dy;  perpendicular = Math.abs(dx); break;
        case 'left':  if (dx >= -5)   continue; primary = -dx; perpendicular = Math.abs(dy); break;
        case 'right': if (dx <= 5)    continue; primary = dx;  perpendicular = Math.abs(dy); break;
        default: continue;
      }

      // Score: prefer aligned (low perpendicular) and close (low primary)
      // Weight perpendicular more so we stay in same row/column
      var score = primary + perpendicular * 2.5;
      if (score < bestScore) {
        bestScore = score;
        best = el;
      }
    }

    if (best) {
      best.focus();
      try { best.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' }); } catch (e) {}
    }
  }

  // ====== Click on Enter ======
  function activateFocused() {
    var el = document.activeElement;
    if (!el || el === document.body) return false;
    var tag = el.tagName;
    // Don't intercept Enter on text inputs
    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      var type = (el.type || '').toLowerCase();
      if (type === 'text' || type === 'password' || type === 'url' || type === 'email' || type === 'search' || type === 'number' || type === '' || tag === 'TEXTAREA') {
        return false;
      }
    }
    // For SELECT, open dropdown (default behavior)
    if (tag === 'SELECT') return false;
    el.click();
    return true;
  }

  // ====== Go back action ======
  // Returns true if handled (don't exit app), false if at root (exit allowed)
  function goBackAction() {
    // Close any open modal first
    var modals = document.querySelectorAll('.modal');
    for (var i = modals.length - 1; i >= 0; i--) {
      var m = modals[i];
      if (!m) continue;
      var d = m.style.display;
      if (d && d !== 'none') {
        var close = m.querySelector('.modal-close, .addportal-back, [id$="Back"], [id$="Close"]');
        if (close) { close.click(); return true; }
        m.style.display = 'none';
        return true;
      }
    }
    // Mac selector modal (specific class)
    var macSel = document.getElementById('macSelectorModal');
    if (macSel && macSel.style.display !== 'none') {
      try { macSel.remove(); } catch (e) {}
      return true;
    }
    // Side menu
    var sm = document.getElementById('sideMenu');
    if (sm && sm.style.display !== 'none' && sm.style.display !== '') {
      if (typeof window.closeSideMenu === 'function') window.closeSideMenu();
      return true;
    }
    // If we're at root (login screen with no history), let Java exit
    if (window.AppState && window.AppState.activeScreen === 'login') {
      if (!window.AppState.screenHistory || window.AppState.screenHistory.length === 0) {
        return false;
      }
    }
    // Internal screen back
    if (typeof window.goBack === 'function') {
      var prevScreen = window.AppState ? window.AppState.activeScreen : null;
      window.goBack();
      var newScreen = window.AppState ? window.AppState.activeScreen : null;
      // If goBack didn't change anything and we're already at login → root, allow exit
      if (prevScreen === newScreen && newScreen === 'login') return false;
      return true;
    }
    return false;
  }

  // ====== Global key handler ======
  function handleKey(e) {
    // Identify the key (works across browsers + Android WebView)
    var key = e.key;
    var code = e.keyCode || e.which;

    // DPAD_CENTER on some Android firmwares = code 23
    // Comprehensive key matching for various remotes including universal
    var isEnter = (
      key === 'Enter' || key === ' ' || key === 'Spacebar' ||
      code === 13 || code === 23 /* DPAD_CENTER */ ||
      code === 32 /* SPACE */ || code === 66 /* KEYCODE_ENTER */ ||
      code === 96 /* GAMEPAD A */ || code === 160 /* OK button on some TVs */
    );
    var isBack = (
      key === 'Escape' || key === 'Backspace' || key === 'GoBack' ||
      code === 27 || code === 8 || code === 4 /* KEYCODE_BACK */ ||
      code === 461 /* Samsung back */ || code === 10009 /* WebOS back */
    );
    var isMenu = (
      key === 'ContextMenu' ||
      code === 93 || code === 82 /* KEYCODE_MENU */ ||
      code === 18 /* Alt */ || code === 124 /* extra menu key */
    );

    // Arrow keys: standard browser codes (37-40) + Android native KEYCODE_DPAD_* (19-22)
    if (key === 'ArrowUp'    || code === 38 || code === 19) { navigate('up');    e.preventDefault(); return; }
    if (key === 'ArrowDown'  || code === 40 || code === 20) { navigate('down');  e.preventDefault(); return; }
    if (key === 'ArrowLeft'  || code === 37 || code === 21) { navigate('left');  e.preventDefault(); return; }
    if (key === 'ArrowRight' || code === 39 || code === 22) { navigate('right'); e.preventDefault(); return; }

    if (isEnter) {
      var done = activateFocused();
      if (done) e.preventDefault();
      return;
    }

    if (isBack) {
      // Skip if user is typing in a text field
      var ae = document.activeElement;
      if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA')) {
        // Only block Escape, not Backspace (let backspace work in input)
        if (key === 'Escape' || code === 27) {
          ae.blur();
          e.preventDefault();
        }
        return;
      }
      if (goBackAction()) e.preventDefault();
      return;
    }

    if (isMenu) {
      if (typeof window.openSideMenu === 'function') {
        window.openSideMenu();
        e.preventDefault();
      }
      return;
    }
  }

  // ====== Auto-focus first element after screen change ======
  function focusFirstAfterScreenChange() {
    setTimeout(function() {
      var active = document.querySelector('.screen.active');
      if (!active) return;
      var first = active.querySelector('[tabindex="0"]:not([disabled]), .focusable:not([disabled]), button:not([disabled])');
      if (first && isVisible(first)) first.focus();
    }, 120);
  }

  // ====== Inject improved focus styles ======
  function injectFocusStyles() {
    if (document.getElementById('iprem-tvnav-styles')) return;
    var s = document.createElement('style');
    s.id = 'iprem-tvnav-styles';
    s.textContent =
      // Strong visible focus ring for ALL focusable elements
      '*:focus{outline:none}' +
      '.focusable:focus, [tabindex="0"]:focus, button:focus, a:focus, input:focus, select:focus, .nav-card:focus, .conn-card:focus, .portal-card:focus, .channel-list li:focus, .category-list li:focus, .sm-item:focus, .player-btn:focus, .btn:focus, .btn-icon:focus, .setting-row:focus, .form-group input:focus, .mac-sel-item:focus, .catorder-item:focus, .login-type-opt:focus-within{' +
        'outline:3px solid #60a5fa !important;' +
        'outline-offset:2px;' +
        'box-shadow:0 0 0 5px rgba(96,165,250,.35), 0 0 20px rgba(59,130,246,.5);' +
        'z-index:1;' +
      '}' +
      // Bigger scale for cards on focus
      '.nav-card:focus, .conn-card:focus, .portal-card:focus{transform:scale(1.05);transition:transform .12s ease-out}' +
      // Channel/category list items on focus
      '.channel-list li:focus, .category-list li:focus{background:rgba(59,130,246,.2) !important}' +
      // Inputs need stronger visible state
      'input:focus, select:focus, textarea:focus{outline:3px solid #60a5fa !important;border-color:#60a5fa !important}' +
      // Modal items
      '.modal:focus-within .focusable:focus{box-shadow:0 0 0 4px #60a5fa, 0 0 24px rgba(59,130,246,.6)}';
    document.head.appendChild(s);
  }

  // ====== Make EVERY clickable element keyboard-focusable ======
  function ensureFocusable() {
    var candidates = document.querySelectorAll(
      'button, a[href], .nav-card, .conn-card, .add-card, .portal-card, .channel-list li, .category-list li, .sm-item, .mac-sel-item, .catorder-item, .login-type-opt, .setting-row, .episode-item, .vod-item, .series-item, .vod-grid > div, .color-btn, .focusable, [role="button"], [data-screen], [data-back]'
    );
    candidates.forEach(function(el) {
      if (!el.hasAttribute('tabindex') && !el.disabled) {
        el.setAttribute('tabindex', '0');
      }
    });
  }

  // ====== Periodic ensure-focusable for dynamically rendered content ======
  function startFocusableObserver() {
    if (window._iprem_focusable_observer) return;
    var observer = new MutationObserver(function(mutations) {
      var needsUpdate = false;
      for (var i = 0; i < mutations.length; i++) {
        if (mutations[i].addedNodes && mutations[i].addedNodes.length > 0) {
          needsUpdate = true;
          break;
        }
      }
      if (needsUpdate) ensureFocusable();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window._iprem_focusable_observer = observer;
  }

  // ====== Bootstrap ======
  window.addEventListener('DOMContentLoaded', function() {
    injectFocusStyles();
    setTimeout(function() {
      ensureFocusable();
      startFocusableObserver();

      // Hook into showScreen to auto-focus + ensure home nav-cards are bound
      if (typeof window.showScreen === 'function') {
        var orig = window.showScreen;
        window.showScreen = function(id) {
          var r = orig.apply(this, arguments);
          // DEFENSIVE: re-bind nav-card click handlers if user lands on home without them
          if (id === 'home') {
            setTimeout(function() {
              document.querySelectorAll('#home .nav-card[data-screen]').forEach(function(card) {
                if (card.dataset.bound === '1') return;
                card.dataset.bound = '1';
                var target = card.getAttribute('data-screen');
                card.addEventListener('click', function() {
                  if (!window.AppState || !window.AppState.api) {
                    showToast && showToast('Connectez-vous à un portail d\'abord');
                    return;
                  }
                  if (typeof window.showScreen === 'function' && target) window.showScreen(target);
                });
                card.addEventListener('keydown', function(e) {
                  if (e.key === 'Enter' || e.keyCode === 13 || e.keyCode === 23 || e.keyCode === 66) {
                    if (!window.AppState || !window.AppState.api) {
                      showToast && showToast('Connectez-vous à un portail d\'abord');
                      return;
                    }
                    if (typeof window.showScreen === 'function' && target) window.showScreen(target);
                  }
                });
              });
              // Also handle generic .focusable[data-screen] inside #home
              document.querySelectorAll('#home [data-screen]:not(.nav-card)').forEach(function(el) {
                if (el.dataset.bound === '1') return;
                el.dataset.bound = '1';
                var target = el.getAttribute('data-screen');
                el.addEventListener('click', function() {
                  if (typeof window.showScreen === 'function' && target) window.showScreen(target);
                });
              });
            }, 50);
          }
          focusFirstAfterScreenChange();
          return r;
        };
      }

      // Initial focus
      focusFirstAfterScreenChange();
    }, 800);

    // Capture keys at document level (capture phase = before any other handler)
    document.addEventListener('keydown', handleKey, true);
  });

  // Expose helpers globally for debugging
  window.tvnav = {
    navigate: navigate,
    findFocusables: findFocusables,
    focusFirst: focusFirstAfterScreenChange,
    ensureFocusable: ensureFocusable,
    goBack: goBackAction
  };
})();
