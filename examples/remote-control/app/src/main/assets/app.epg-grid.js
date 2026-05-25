/* ============================================
   iPremTvOnline - EPG Grid (Formuler/iPremiumTv style)
   Timeline grid view with mini-player + colored action shortcuts
   ============================================ */

(function() {
  'use strict';

  var dayOffset = 0;          // -1, 0, +1 days
  var gridStartHour = 22;     // computed dynamically
  var slotMinutes = 30;       // 30 minutes per slot
  var slotsCount = 6;         // 6 slots = 3 hours visible
  var slotWidth = 200;        // px per slot

  // Auto-refresh state
  var nowLineInterval = null;     // updates the "now" line position every minute
  var fullRefreshInterval = null; // re-fetches EPG data every 5 minutes
  var lastBuildStart = null;      // tracks if grid start needs to advance
  var FULL_REFRESH_MS = 5 * 60 * 1000; // 5 min
  var NOW_LINE_MS = 30 * 1000;        // 30 sec

  function injectStyles() {
    if (document.getElementById('iprem-epg-styles')) return;
    var s = document.createElement('style');
    s.id = 'iprem-epg-styles';
    s.textContent =
      '#epg{padding:0;background:linear-gradient(135deg,#0a1530 0%,#1e3a8a 100%)}' +
      '#epg .top-bar{background:transparent;padding:14px 24px}' +
      '#epg .screen-title{display:none}' +
      '.epgg-wrap{position:relative;height:100vh;display:flex;flex-direction:column;color:#fff}' +
      // Back button - very visible, top-left
      '.epgg-back{position:absolute;top:14px;left:18px;z-index:20;background:rgba(0,0,0,.55);color:#fff;border:1px solid rgba(255,255,255,.25);border-radius:8px;padding:8px 14px;font-size:13px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:6px;outline:none;transition:transform .12s, background .12s}' +
      '.epgg-back:focus, .epgg-back:hover{background:#fff;color:#0a1530;transform:scale(1.06);border-color:#fff}' +
      // Group picker overlay
      '.epgg-grouppick{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.7);backdrop-filter:blur(4px);z-index:50;display:flex;align-items:center;justify-content:center}' +
      '.epgg-grouppick-box{background:#0f172a;border:1px solid rgba(255,255,255,.15);border-radius:10px;width:420px;max-height:70vh;display:flex;flex-direction:column;overflow:hidden}' +
      '.epgg-grouppick-head{padding:14px 18px;font-size:15px;font-weight:700;color:#fff;border-bottom:1px solid rgba(255,255,255,.08)}' +
      '.epgg-grouppick-list{flex:1;overflow-y:auto;padding:6px 0}' +
      '.epgg-grouppick-item{padding:10px 18px;font-size:13px;color:#cbd5e1;cursor:pointer;outline:none}' +
      '.epgg-grouppick-item:focus, .epgg-grouppick-item:hover{background:#fff;color:#0a1530;font-weight:600}' +
      '.epgg-header{display:flex;align-items:flex-start;padding:16px 28px 12px 80px;gap:24px}' +
      '.epgg-preview{flex-shrink:0;width:280px;aspect-ratio:16/9;background:#0a1530;border-radius:6px;overflow:hidden;position:relative}' +
      '.epgg-preview video, .epgg-preview img{width:100%;height:100%;object-fit:cover}' +
      '.epgg-preview .epgg-prev-label{position:absolute;left:8px;top:6px;background:rgba(0,0,0,.6);color:#fff;padding:2px 6px;border-radius:3px;font-size:11px;font-weight:600}' +
      '.epgg-info{flex:1;display:flex;flex-direction:column;justify-content:flex-start}' +
      '.epgg-info-line{font-size:12px;color:#cbd5e1;margin-bottom:4px}' +
      '.epgg-info-title{font-size:22px;font-weight:700;margin-bottom:6px;color:#fff}' +
      '.epgg-info-desc{font-size:14px;color:#cbd5e1}' +
      '.epgg-datetime{margin-left:auto;font-size:14px;color:#fff;font-weight:500;text-align:right}' +
      // Timeline
      '.epgg-timeline{display:flex;align-items:center;padding:0 28px;height:36px;position:relative}' +
      '.epgg-date-label{flex-shrink:0;width:240px;font-size:13px;color:#fff;font-weight:600}' +
      '.epgg-timeline-row{flex:1;display:flex;height:100%;position:relative;border-bottom:2px solid rgba(255,255,255,.3)}' +
      '.epgg-time-slot{width:200px;flex-shrink:0;font-size:13px;color:#fff;display:flex;align-items:center;justify-content:flex-start;padding-left:2px;position:relative}' +
      '.epgg-time-slot::before{content:"";position:absolute;left:0;top:8px;bottom:8px;width:1px;background:rgba(255,255,255,.4)}' +
      // Now indicator (vertical blue line)
      '.epgg-now-line{position:absolute;top:0;bottom:0;width:2px;background:#06b6d4;z-index:5;pointer-events:none;box-shadow:0 0 6px #06b6d4}' +
      // Grid scroll
      '.epgg-grid-scroll{flex:1;overflow-y:auto;padding:0 28px 60px 28px}' +
      '.epgg-row{display:flex;align-items:stretch;height:46px;border-bottom:1px solid rgba(255,255,255,.06)}' +
      '.epgg-channel-label{flex-shrink:0;width:240px;display:flex;align-items:center;gap:8px;padding:0 12px;background:transparent}' +
      '.epgg-channel-num{font-size:14px;color:rgba(255,255,255,.7);font-weight:500;min-width:24px;text-align:center}' +
      '.epgg-channel-logo{width:36px;height:36px;background:#3b82f6;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;flex-shrink:0;overflow:hidden}' +
      '.epgg-channel-logo img{width:100%;height:100%;object-fit:contain}' +
      '.epgg-channel-name{font-size:13px;color:#fff;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
      '.epgg-channel-name.live-now{color:#ef4444}' +
      '.epgg-programs{flex:1;display:flex;position:relative;height:100%}' +
      '.epgg-program{height:100%;background:rgba(59,130,246,.25);border-right:1px solid rgba(0,0,0,.4);border-radius:3px;padding:6px 10px;font-size:12px;color:#fff;cursor:pointer;display:flex;align-items:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;transition:background .12s;outline:none}' +
      '.epgg-program:focus{background:#fff;color:#000;font-weight:600}' +
      '.epgg-program.empty{background:rgba(59,130,246,.15);color:rgba(255,255,255,.6);font-style:italic}' +
      // Bottom action bar
      '.epgg-actions{position:fixed;bottom:0;left:0;right:0;background:rgba(0,0,0,.5);backdrop-filter:blur(6px);padding:12px 28px;display:flex;justify-content:center;gap:20px;font-size:12px;color:#fff;z-index:10}' +
      '.epgg-action{display:inline-flex;align-items:center;gap:6px;cursor:pointer;outline:none}' +
      '.epgg-action:focus, .epgg-action:hover{transform:scale(1.08);transition:transform .12s}' +
      '.epgg-action .dot{width:10px;height:10px;border-radius:50%;display:inline-block}' +
      '.epgg-action .dot.red{background:#ef4444}' +
      '.epgg-action .dot.green{background:#22c55e}' +
      '.epgg-action .dot.yellow{background:#eab308}' +
      '.epgg-action .dot.blue{background:#3b82f6}' +
      '.epgg-action .dot.gray{background:#94a3b8}';
    document.head.appendChild(s);
  }

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function formatTime(date) {
    return pad(date.getHours()) + ':' + pad(date.getMinutes());
  }

  function formatFullDate(date) {
    var days = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
    var months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    return days[date.getDay()] + ' ' + date.getDate() + ' ' + months[date.getMonth()] + ' ' + date.getFullYear();
  }

  function buildEpgGrid() {
    var epg = document.getElementById('epg');
    if (!epg) return;
    // Clear and rebuild
    epg.innerHTML = '';

    var wrap = document.createElement('div');
    wrap.className = 'epgg-wrap';

    // Back button (always visible, top-left)
    var backBtn = document.createElement('button');
    backBtn.className = 'epgg-back focusable';
    backBtn.setAttribute('tabindex', '0');
    backBtn.innerHTML = '<span style="font-size:16px">←</span> Retour';
    backBtn.addEventListener('click', leaveEpg);
    backBtn.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.keyCode === 13) { e.preventDefault(); leaveEpg(); }
    });
    wrap.appendChild(backBtn);

    // Header: preview + current channel info + datetime
    var header = document.createElement('div');
    header.className = 'epgg-header';
    var now = new Date();
    now.setDate(now.getDate() + dayOffset);
    var currentChannelName = (AppState.selectedChannel && AppState.selectedChannel.name) || '|IT| SKY SPORT BAR UNO FHD';
    var currentGroup = AppState.selectedLiveCategory || 'SPORTS IT';
    header.innerHTML =
      '<div class="epgg-preview"><div class="epgg-prev-label">' + escapeHtml(currentChannelName) + '</div></div>' +
      '<div class="epgg-info">' +
        '<div class="epgg-info-line">Groupe : Ⓟ TV ‖ ' + escapeHtml(currentGroup) + '</div>' +
        '<div class="epgg-info-title">' + escapeHtml(currentChannelName) + '</div>' +
        '<div class="epgg-info-desc">Pas d\'informations</div>' +
      '</div>' +
      '<div class="epgg-datetime">' + formatTime(now) + ' • ' + formatFullDate(now) + '</div>';
    wrap.appendChild(header);

    // Timeline row
    var timelineRow = document.createElement('div');
    timelineRow.className = 'epgg-timeline';
    var nowH = now.getHours();
    var nowM = now.getMinutes();
    gridStartHour = Math.floor(nowH / 1); // start near current hour
    // Round down to nearest 30 min slot
    var startDate = new Date(now);
    startDate.setMinutes(Math.floor(nowM / slotMinutes) * slotMinutes, 0, 0);
    var dateLabel = formatFullDate(startDate);
    var timelineHtml = '<div class="epgg-date-label">' + dateLabel + '</div><div class="epgg-timeline-row" id="epggTimelineRow">';
    for (var i = 0; i < slotsCount; i++) {
      var slot = new Date(startDate.getTime() + i * slotMinutes * 60000);
      timelineHtml += '<div class="epgg-time-slot">' + formatTime(slot) + '</div>';
    }
    timelineHtml += '</div>';
    timelineRow.innerHTML = timelineHtml;
    wrap.appendChild(timelineRow);

    // Grid
    var grid = document.createElement('div');
    grid.className = 'epgg-grid-scroll';
    grid.id = 'epggGrid';
    grid.innerHTML = '<p style="color:#94a3b8;padding:30px;text-align:center">Chargement de l\'EPG...</p>';
    wrap.appendChild(grid);

    // Bottom action bar (color shortcuts)
    var actions = document.createElement('div');
    actions.className = 'epgg-actions';
    actions.innerHTML =
      '<div class="epgg-action focusable" tabindex="0" data-act="back" style="background:rgba(239,68,68,.2);padding:6px 12px;border-radius:6px"><span style="font-size:14px">←</span> Retour</div>' +
      '<div class="epgg-action focusable" tabindex="0" data-act="groups"><span class="dot gray"></span> Catégorie</div>' +
      '<div class="epgg-action focusable" tabindex="0" data-act="channels"><span class="dot blue"></span> Liste chaînes</div>' +
      '<div class="epgg-action focusable" tabindex="0" data-act="record"><span class="dot red"></span> Enregistrer</div>' +
      '<div class="epgg-action focusable" tabindex="0" data-act="watchlist"><span class="dot green"></span> Watchlist</div>' +
      '<div class="epgg-action focusable" tabindex="0" data-act="now"><span class="dot yellow"></span> Maintenant</div>' +
      '<div class="epgg-action focusable" tabindex="0" data-act="prev-day"><span class="dot red"></span> -1 Jour</div>' +
      '<div class="epgg-action focusable" tabindex="0" data-act="next-day"><span class="dot blue"></span> +1 Jour</div>' +
      '<div class="epgg-action focusable" tabindex="0" data-act="refresh"><span class="dot gray"></span> ↻ Actualiser</div>';
    wrap.appendChild(actions);

    epg.appendChild(wrap);

    // Wire actions
    actions.querySelectorAll('.epgg-action').forEach(function(a) {
      var act = a.getAttribute('data-act');
      a.addEventListener('click', function() { handleAction(act); });
      a.addEventListener('keydown', function(e) { if (e.key === 'Enter') handleAction(act); });
    });

    // Position the "now" vertical line
    setTimeout(positionNowLine, 100);

    // Load channels + EPG
    lastBuildStart = startDate;
    loadEpgData(startDate);

    // Start auto-refresh timers
    startAutoRefresh();
  }

  function startAutoRefresh() {
    stopAutoRefresh();
    // Move the "now" line every 30 seconds
    nowLineInterval = setInterval(positionNowLine, NOW_LINE_MS);
    // Full EPG re-fetch every 5 minutes (only if user is still on EPG screen)
    fullRefreshInterval = setInterval(function() {
      if (window.AppState && AppState.activeScreen === 'epg') {
        invalidateEpgCache();
        // If now has advanced past the visible grid, rebuild from scratch
        if (lastBuildStart) {
          var elapsedMin = (Date.now() - lastBuildStart.getTime()) / 60000;
          if (elapsedMin >= slotsCount * slotMinutes - 30) {
            buildEpgGrid();
            return;
          }
        }
        // Otherwise just reload EPG data for visible channels
        if (lastBuildStart) loadEpgData(lastBuildStart);
      } else {
        // user left EPG → stop timers
        stopAutoRefresh();
      }
    }, FULL_REFRESH_MS);
  }

  function stopAutoRefresh() {
    if (nowLineInterval) { clearInterval(nowLineInterval); nowLineInterval = null; }
    if (fullRefreshInterval) { clearInterval(fullRefreshInterval); fullRefreshInterval = null; }
  }

  function invalidateEpgCache() {
    try {
      if (window.ipremCache && typeof window.ipremCache.clearEpg === 'function') {
        var n = window.ipremCache.clearEpg();
        if (typeof showToast === 'function') showToast('EPG actualisé');
        return n;
      }
    } catch (e) {}
    return 0;
  }

  function positionNowLine() {
    var timelineRow = document.getElementById('epggTimelineRow');
    if (!timelineRow) return;
    var old = document.querySelector('.epgg-now-line');
    if (old) old.remove();
    var now = new Date();
    now.setDate(now.getDate() + dayOffset);
    var firstSlot = timelineRow.querySelector('.epgg-time-slot');
    if (!firstSlot) return;
    var firstTimeText = firstSlot.textContent;
    var parts = firstTimeText.split(':');
    var startMinFromMidnight = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    var nowMinFromMidnight = now.getHours() * 60 + now.getMinutes();
    var minutesIntoGrid = nowMinFromMidnight - startMinFromMidnight;
    if (minutesIntoGrid < 0) minutesIntoGrid += 1440;
    var pxIntoGrid = (minutesIntoGrid / slotMinutes) * slotWidth;
    if (pxIntoGrid < 0 || pxIntoGrid > slotsCount * slotWidth) return;
    var nowLine = document.createElement('div');
    nowLine.className = 'epgg-now-line';
    nowLine.style.left = pxIntoGrid + 'px';
    timelineRow.appendChild(nowLine);
  }

  async function loadEpgData(startDate) {
    var grid = document.getElementById('epggGrid');
    if (!grid || !AppState.api) return;

    // Get channels (first 30)
    var channels = AppState.liveStreams || [];
    if (channels.length === 0) {
      try { channels = await AppState.api.getLiveStreams(AppState.selectedLiveCategory); } catch (e) {}
    }
    channels = channels.slice(0, 30);

    grid.innerHTML = '';
    channels.forEach(function(ch, idx) {
      var row = document.createElement('div');
      row.className = 'epgg-row';
      var isCurrent = (AppState.selectedChannel && AppState.selectedChannel.stream_id === ch.stream_id);
      row.innerHTML =
        '<div class="epgg-channel-label">' +
          '<span class="epgg-channel-num">' + (ch.num || (idx + 1)) + '</span>' +
          '<div class="epgg-channel-logo">' +
            (ch.stream_icon ? '<img loading="lazy" src="' + escapeHtml(ch.stream_icon) + '" onerror="this.style.display=\'none\'">' : 'TV') +
          '</div>' +
          '<span class="epgg-channel-name' + (isCurrent ? ' live-now' : '') + '">' + escapeHtml(ch.name) + '</span>' +
        '</div>' +
        '<div class="epgg-programs" id="epgg-row-' + ch.stream_id + '">' +
          '<div class="epgg-program empty" style="flex:1">Chargement...</div>' +
        '</div>';
      grid.appendChild(row);

      // Load EPG for this channel async
      loadChannelEpg(ch, startDate);
    });
  }

  async function loadChannelEpg(channel, startDate) {
    var container = document.getElementById('epgg-row-' + channel.stream_id);
    if (!container) return;
    try {
      var data = await AppState.api.getShortEPG(channel.stream_id);
      var listings = (data && data.epg_listings) ? data.epg_listings : [];
      if (listings.length === 0) {
        container.innerHTML = '<div class="epgg-program empty" style="flex:1">Pas d\'informations</div>';
        return;
      }
      // Build program blocks positioned by start/duration
      var html = '';
      var gridStartMs = startDate.getTime();
      var gridEndMs = gridStartMs + slotsCount * slotMinutes * 60000;
      listings.forEach(function(p) {
        var startMs = parseInt(p.start) * 1000;
        var endMs = parseInt(p.end || p.stop) * 1000;
        if (isNaN(startMs)) {
          // Try date string parsing
          startMs = Date.parse(p.start);
          endMs = Date.parse(p.end || p.stop || '');
        }
        if (isNaN(startMs) || isNaN(endMs)) return;
        // Clip to grid
        if (endMs <= gridStartMs || startMs >= gridEndMs) return;
        var clippedStart = Math.max(startMs, gridStartMs);
        var clippedEnd = Math.min(endMs, gridEndMs);
        var leftPx = ((clippedStart - gridStartMs) / 60000 / slotMinutes) * slotWidth;
        var widthPx = ((clippedEnd - clippedStart) / 60000 / slotMinutes) * slotWidth;
        var title = (p.title || p.name || 'Programme').toString();
        html += '<div class="epgg-program focusable" tabindex="0" style="position:absolute;left:' + leftPx + 'px;width:' + widthPx + 'px" title="' + escapeHtml(title) + '">' + escapeHtml(title) + '</div>';
      });
      if (!html) html = '<div class="epgg-program empty" style="flex:1">Pas d\'informations</div>';
      container.innerHTML = html;
    } catch (e) {
      container.innerHTML = '<div class="epgg-program empty" style="flex:1">Pas d\'informations</div>';
    }
  }

  function handleAction(act) {
    switch (act) {
      case 'back':
        leaveEpg();
        break;
      case 'groups':
        openGroupPicker();
        break;
      case 'channels':
        // Scroll to top of channel list and focus first row
        var grid = document.getElementById('epggGrid');
        if (grid) {
          grid.scrollTop = 0;
          var firstProgram = grid.querySelector('.epgg-program.focusable');
          if (firstProgram) firstProgram.focus();
        }
        break;
      case 'record':
        if (window.Recordings && AppState.selectedChannel) {
          window.Recordings.add(AppState.selectedChannel);
        }
        break;
      case 'watchlist':
        if (window.iprem && window.iprem.watchlist && AppState.selectedChannel) {
          window.iprem.watchlist.toggle(AppState.selectedChannel);
        }
        break;
      case 'now':
        dayOffset = 0; buildEpgGrid(); break;
      case 'prev-day':
        dayOffset--; buildEpgGrid(); break;
      case 'next-day':
        dayOffset++; buildEpgGrid(); break;
      case 'refresh':
        invalidateEpgCache();
        buildEpgGrid();
        break;
    }
  }

  // Leaves the EPG screen and returns to the previous one (typically Live TV)
  function leaveEpg() {
    stopAutoRefresh();
    // Prefer the app's own goBack handler if available
    if (typeof window.goBack === 'function') {
      try { window.goBack(); return; } catch (e) {}
    }
    // Fallback: jump back to the live screen explicitly
    if (typeof window.showScreen === 'function') {
      try { window.showScreen('live'); return; } catch (e) {}
    }
    // Last resort: just hide EPG container
    var epg = document.getElementById('epg');
    if (epg) epg.classList.remove('active');
  }

  // Group picker overlay: lets user filter the EPG by live category
  function openGroupPicker() {
    // Already open?
    if (document.querySelector('.epgg-grouppick')) return;
    var groups = (window.AppState && AppState.liveCategories) || [];
    if (!groups.length) {
      // Try to extract from current state or fall back to "Toutes"
      groups = [{ category_name: 'Toutes les chaînes', category_id: '' }];
    }
    var overlay = document.createElement('div');
    overlay.className = 'epgg-grouppick';
    var html =
      '<div class="epgg-grouppick-box">' +
        '<div class="epgg-grouppick-head">Choisir une catégorie</div>' +
        '<div class="epgg-grouppick-list" id="epggGroupList">';
    groups.forEach(function(g, idx) {
      var name = g.category_name || g.name || ('Catégorie ' + (idx + 1));
      var id = g.category_id != null ? g.category_id : '';
      html += '<div class="epgg-grouppick-item focusable" tabindex="0" data-gid="' + escapeHtml(String(id)) + '">' + escapeHtml(name) + '</div>';
    });
    html += '</div></div>';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);

    // Close on overlay click (outside box)
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeGroupPicker();
    });

    overlay.querySelectorAll('.epgg-grouppick-item').forEach(function(it) {
      var pick = function() {
        var gid = it.getAttribute('data-gid');
        AppState.selectedLiveCategory = gid;
        // Force EPG to reload with the new category filter
        AppState.liveStreams = null;
        closeGroupPicker();
        buildEpgGrid();
      };
      it.addEventListener('click', pick);
      it.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.keyCode === 13) { e.preventDefault(); pick(); }
        if (e.key === 'Escape' || e.keyCode === 27 || e.keyCode === 8 || e.keyCode === 4) {
          e.preventDefault(); closeGroupPicker();
        }
      });
    });

    // Auto-focus first item
    var first = overlay.querySelector('.epgg-grouppick-item');
    if (first) first.focus();
  }

  function closeGroupPicker() {
    var ov = document.querySelector('.epgg-grouppick');
    if (ov) ov.remove();
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Global key listener active only when EPG is on screen.
  // Handles BACK / Escape to leave the EPG, and ensures the group picker can be closed.
  function isEpgActive() {
    if (window.AppState && AppState.activeScreen === 'epg') return true;
    var epg = document.getElementById('epg');
    return !!(epg && epg.classList.contains('active'));
  }

  function onGlobalKeydown(e) {
    if (!isEpgActive()) return;
    var code = e.keyCode || e.which;
    // BACK on Android TV remote = 4, Escape = 27, Backspace = 8
    if (code === 4 || code === 27 || code === 8 || e.key === 'Escape' || e.key === 'Backspace') {
      // If group picker is open, close it first; otherwise leave EPG
      if (document.querySelector('.epgg-grouppick')) {
        closeGroupPicker();
      } else {
        leaveEpg();
      }
      e.preventDefault();
      e.stopPropagation();
    }
  }

  // Hook into showScreen('epg') to rebuild our grid + manage auto-refresh lifecycle
  window.addEventListener('DOMContentLoaded', function() {
    injectStyles();
    // Attach the BACK key handler at capture phase so we run BEFORE the generic tvnav,
    // which would try to navigate to the home screen.
    document.addEventListener('keydown', onGlobalKeydown, true);

    setTimeout(function() {
      if (typeof window.showScreen === 'function') {
        var orig = window.showScreen;
        window.showScreen = function(id) {
          var r = orig.apply(this, arguments);
          if (id === 'epg') {
            setTimeout(function() {
              buildEpgGrid();
              // Auto-focus the back button so user sees right away how to exit
              setTimeout(function() {
                var b = document.querySelector('.epgg-back');
                if (b) b.focus();
              }, 250);
            }, 100);
          } else {
            // Leaving EPG screen - stop auto-refresh + cleanup any open picker
            stopAutoRefresh();
            closeGroupPicker();
          }
          return r;
        };
      }
    }, 1200);
  });
})();
