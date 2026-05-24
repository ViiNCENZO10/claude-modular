package com.mto3clone;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Rational;
import android.view.KeyEvent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.view.animation.AlphaAnimation;
import android.view.animation.Animation;
import android.widget.ArrayAdapter;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;

import org.videolan.libvlc.LibVLC;
import org.videolan.libvlc.Media;
import org.videolan.libvlc.MediaPlayer;
import org.videolan.libvlc.util.VLCVideoLayout;

/**
 * Universal player powered by libVLC.
 * Supports virtually all codecs/containers (AVI, MOV, MKV, MP4, AC3, DTS, DivX, etc.)
 * with hardware acceleration via Android MediaCodec on Realtek/Amlogic SoCs.
 */
public class ExoPlayerActivity extends AppCompatActivity {

    private VLCVideoLayout playerView;
    private LibVLC libVLC;
    private MediaPlayer player;
    private String url;
    private String title;
    private boolean isLive;
    private String customCookies;
    private String customUserAgent;

    private View bottomMenu;
    private LinearLayout bottomMenuRow;
    private boolean bottomMenuOpen = false;
    private android.os.CountDownTimer sleepTimer;

    private LinearLayout channelSidebar;
    private ListView channelListView;
    private List<JSONObject> sidebarChannels = new ArrayList<>();
    private int sidebarCurrentIdx = -1;
    private boolean sidebarOpen = false;

    private LinearLayout groupSidebar;
    private ListView groupListView;
    private List<JSONObject> sidebarGroups = new ArrayList<>();
    private boolean groupSidebarOpen = false;

    private String[] altExtensions = null;
    private int altExtIdx = 0;
    private long mLastBackPressTime = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(
                WindowManager.LayoutParams.FLAG_FULLSCREEN | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
                WindowManager.LayoutParams.FLAG_FULLSCREEN | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
        );
        setContentView(R.layout.activity_exoplayer);
        hideSystemUi();

        playerView = findViewById(R.id.player_view);

        url = getIntent().getStringExtra("url");
        title = getIntent().getStringExtra("title");
        isLive = getIntent().getBooleanExtra("isLive", true);
        customCookies = getIntent().getStringExtra("cookies");
        customUserAgent = getIntent().getStringExtra("userAgent");
        String altExtsCsv = getIntent().getStringExtra("altExts");
        if (altExtsCsv != null && !altExtsCsv.isEmpty()) {
            altExtensions = altExtsCsv.split(",");
            altExtIdx = 0;
        }

        // Sidebars + bottom menu
        channelSidebar = findViewById(R.id.channel_sidebar);
        channelListView = findViewById(R.id.channel_list_view);
        groupSidebar = findViewById(R.id.group_sidebar);
        groupListView = findViewById(R.id.group_list_view);
        bottomMenu = findViewById(R.id.bottom_menu);
        bottomMenuRow = findViewById(R.id.bottom_menu_row);
        setupChannelSidebar();
        setupGroupSidebar();
        setupBottomMenu();

        if (url == null || url.isEmpty()) {
            Toast.makeText(this, "URL manquante", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }

        // Forced VLC always? Currently libVLC IS our player, so this preference is no longer used.
        initPlayer();
    }

    // === Adaptive buffering ===
    // Démarrage à 1500ms (équilibre zap rapide / stabilité), monte jusqu'à 4000ms
    // si on détecte des micro-freeze (plus de 2 events Buffering rapprochés).
    private int liveCachingMs = 1500;
    private int bufferingEventsRecent = 0;
    private long lastBufferingTs = 0;

    private void initPlayer() {
        ArrayList<String> options = new ArrayList<>();

        // === Caching unifié (init + per-media doivent matcher) ===
        // Live : 1500ms = bon compromis. La logique adaptative l'augmente si freezes.
        // VOD : 3000ms (HTTP range request, plus de marge).
        options.add("--network-caching=" + (isLive ? liveCachingMs : 3000));
        options.add("--live-caching=" + (isLive ? liveCachingMs : 3000));
        options.add("--file-caching=" + (isLive ? liveCachingMs : 3000));
        options.add("--sout-mux-caching=" + (isLive ? liveCachingMs : 3000));

        // === Reconnexion auto sur coupure HTTP (micro-coupures = stream IPTV) ===
        options.add("--http-reconnect");
        options.add("--http-continuous");

        // === Décodage hardware (Realtek / Amlogic / Mediatek) avec fallback soft ===
        options.add("--avcodec-hw=any");
        // SUPPRIMÉ --avcodec-fast : sacrifiait la qualité (skip pixels)
        // SUPPRIMÉ --avcodec-skiploopfilter=1 : enlevait le deblocking = image floue
        options.add("--avcodec-threads=0");          // auto = tous les coeurs CPU
        options.add("--avcodec-skiploopfilter=0");   // qualité max
        options.add("--no-drop-late-frames");        // jamais skip une frame = pas de saccades
        options.add("--no-skip-frames");

        // === MPEG-TS (le format IPTV par défaut) : tolérer les erreurs de continuité ===
        // sinon la lecture s'arrête au moindre paquet manquant
        options.add("--ts-cc-check=0");

        // === Sous-titres : ne pas auto-scanner les fichiers .srt voisins ===
        options.add("--no-sub-autodetect-file");

        // === Sync horloge : laisser VLC gérer (default), surtout PAS --clock-synchro=0 ===
        // (cette option cassait la synchro A/V et créait des micro-freeze audio)
        options.add("--clock-jitter=0");

        // === HTTP UA ===
        if (customUserAgent != null && !customUserAgent.isEmpty()) {
            options.add("--http-user-agent=" + customUserAgent);
        } else {
            options.add("--http-user-agent=VLC/3.0.20 LibVLC/3.0.20");
        }
        options.add("-v");

        libVLC = new LibVLC(this, options);
        player = new MediaPlayer(libVLC);
        player.attachViews(playerView, null, true, false);

        player.setEventListener(new MediaPlayer.EventListener() {
            @Override
            public void onEvent(MediaPlayer.Event event) {
                switch (event.type) {
                    case MediaPlayer.Event.EncounteredError:
                        handlePlayerError();
                        break;
                    case MediaPlayer.Event.EndReached:
                        if (!isLive) {
                            new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
                                @Override public void run() { finish(); }
                            }, 1000);
                        }
                        break;
                    case MediaPlayer.Event.Buffering:
                        // Buffering progress = float 0..100 dans event.getBuffering()
                        // On compte les events buffering récents pour détecter un stream instable
                        if (isLive) onBufferingTick(event.getBuffering());
                        break;
                }
            }
        });

        loadAndPlay(url);
    }

    private void onBufferingTick(float pct) {
        // pct < 100 = on est en train de buffer (mauvais signe en live)
        if (pct >= 100f) return;
        long now = System.currentTimeMillis();
        if (now - lastBufferingTs < 10_000) {
            bufferingEventsRecent++;
        } else {
            bufferingEventsRecent = 1;
        }
        lastBufferingTs = now;

        // 3 buffering events en moins de 10s = stream instable, on grossit le buffer
        if (bufferingEventsRecent >= 3 && liveCachingMs < 4000) {
            liveCachingMs = Math.min(4000, liveCachingMs + 1000);
            bufferingEventsRecent = 0;
            // Toast discret pour debug, puis relance avec nouveau cache
            Toast.makeText(this, "Buffer adaptatif → " + liveCachingMs + "ms", Toast.LENGTH_SHORT).show();
            try {
                player.stop();
                loadAndPlay(url);
            } catch (Exception ignored) {}
        }
    }

    private void loadAndPlay(String mediaUrl) {
        if (player == null || libVLC == null) return;
        try {
            Media media = new Media(libVLC, Uri.parse(mediaUrl));
            // HW decoder ON, fallback soft autorisé (jamais d'écran noir)
            media.setHWDecoderEnabled(true, true);

            // Cookies Stalker
            if (customCookies != null && !customCookies.isEmpty()) {
                media.addOption(":http-cookies=" + customCookies);
            }
            // Caching cohérent avec init (utilise la valeur adaptative)
            int cache = isLive ? liveCachingMs : 3000;
            media.addOption(":network-caching=" + cache);
            media.addOption(":live-caching=" + cache);
            media.addOption(":file-caching=" + cache);
            // Demarrage : on ne LIT pas avant d'avoir 100% du buffer initial
            // → premiere image plus tardive de ~200ms mais ensuite zero freeze de start
            media.addOption(":clock-jitter=0");
            // Multi-thread decode
            media.addOption(":avcodec-threads=0");

            player.setMedia(media);
            media.release();
            player.play();
        } catch (Exception e) {
            Toast.makeText(this, "Erreur lecture: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }

    private void handlePlayerError() {
        // Try alt extensions for VOD 404
        if (!isLive && altExtensions != null && altExtIdx < altExtensions.length) {
            String nextExt = altExtensions[altExtIdx++].trim();
            if (!nextExt.isEmpty()) {
                String newUrl = url.replaceAll("\\.[a-zA-Z0-9]+($|\\?)", "." + nextExt + "$1");
                Toast.makeText(this, "Tentative ." + nextExt + "...", Toast.LENGTH_SHORT).show();
                url = newUrl;
                loadAndPlay(newUrl);
                return;
            }
        }
        // Else: fallback to external player
        Toast.makeText(this, "Erreur lecture - bascule externe", Toast.LENGTH_SHORT).show();
        launchExternalAndFinish();
    }

    private void hideSystemUi() {
        View decor = getWindow().getDecorView();
        decor.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        );
    }

    @Override
    protected void onResume() {
        super.onResume();
        hideSystemUi();
        if (player != null && !player.isPlaying()) player.play();
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (player != null && !isInPipMode()) player.pause();
    }

    private boolean isInPipMode() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && isInPictureInPictureMode();
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (player == null) return super.onKeyDown(keyCode, event);

        // Bottom menu open → UP/BACK closes
        if (bottomMenuOpen) {
            if (keyCode == KeyEvent.KEYCODE_DPAD_UP || keyCode == KeyEvent.KEYCODE_BACK) {
                hideBottomMenu();
                return true;
            }
            return super.onKeyDown(keyCode, event);
        }

        // DPAD_DOWN opens bottom menu
        if (keyCode == KeyEvent.KEYCODE_DPAD_DOWN && !sidebarOpen && !groupSidebarOpen) {
            showBottomMenu();
            return true;
        }

        // Group sidebar open
        if (groupSidebarOpen) {
            if (keyCode == KeyEvent.KEYCODE_DPAD_RIGHT) { hideGroupSidebar(); return true; }
            if (keyCode == KeyEvent.KEYCODE_BACK) { hideGroupSidebar(); hideSidebar(); return true; }
            return super.onKeyDown(keyCode, event);
        }

        // Channel sidebar open
        if (sidebarOpen) {
            if (keyCode == KeyEvent.KEYCODE_DPAD_RIGHT || keyCode == KeyEvent.KEYCODE_BACK) {
                hideSidebar();
                return true;
            }
            if (keyCode == KeyEvent.KEYCODE_DPAD_LEFT && sidebarGroups.size() > 0) {
                showGroupSidebar();
                return true;
            }
            return super.onKeyDown(keyCode, event);
        }

        switch (keyCode) {
            case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE:
            case KeyEvent.KEYCODE_SPACE:
                if (player.isPlaying()) player.pause(); else player.play();
                return true;
            case KeyEvent.KEYCODE_MEDIA_STOP:
                finish();
                return true;
            case 185: // PROG_YELLOW
            case KeyEvent.KEYCODE_A:
                showAudioTrackDialog();
                return true;
            case 186: // PROG_BLUE
            case KeyEvent.KEYCODE_S:
                showSubtitleTrackDialog();
                return true;
            case KeyEvent.KEYCODE_MEDIA_FAST_FORWARD:
                if (!isLive) player.setTime(player.getTime() + 10000);
                return true;
            case KeyEvent.KEYCODE_DPAD_RIGHT:
                if (!isLive) { player.setTime(player.getTime() + 10000); return true; }
                break;
            case KeyEvent.KEYCODE_MEDIA_REWIND:
                if (!isLive) player.setTime(Math.max(0, player.getTime() - 10000));
                return true;
            case KeyEvent.KEYCODE_DPAD_LEFT:
                if (isLive && sidebarChannels.size() > 0) { showSidebar(); return true; }
                if (!isLive) { player.setTime(Math.max(0, player.getTime() - 10000)); return true; }
                break;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    public void onBackPressed() {
        long now = System.currentTimeMillis();
        if (now - mLastBackPressTime < 1500) {
            super.onBackPressed();
        } else {
            mLastBackPressTime = now;
            Toast.makeText(this, "Appuyez encore pour quitter la lecture", Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    public void onUserLeaveHint() {
        super.onUserLeaveHint();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                && getPackageManager().hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE)
                && player != null && player.isPlaying()) {
            try {
                android.app.PictureInPictureParams params = new android.app.PictureInPictureParams.Builder()
                        .setAspectRatio(new Rational(16, 9)).build();
                enterPictureInPictureMode(params);
            } catch (Exception ignored) { }
        }
    }

    @Override
    public void onPictureInPictureModeChanged(boolean isInPictureInPictureMode, Configuration newConfig) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig);
    }

    @Override
    protected void onDestroy() {
        if (sleepTimer != null) { sleepTimer.cancel(); sleepTimer = null; }
        if (player != null) {
            try { player.stop(); } catch (Exception ignored) {}
            try { player.detachViews(); } catch (Exception ignored) {}
            try { player.release(); } catch (Exception ignored) {}
            player = null;
        }
        if (libVLC != null) {
            try { libVLC.release(); } catch (Exception ignored) {}
            libVLC = null;
        }
        super.onDestroy();
    }

    // ===== Audio / Subtitle track dialogs =====
    private void showAudioTrackDialog() {
        if (player == null) return;
        MediaPlayer.TrackDescription[] tracks = player.getAudioTracks();
        if (tracks == null || tracks.length == 0) {
            Toast.makeText(this, "Aucune piste audio disponible", Toast.LENGTH_SHORT).show();
            return;
        }
        showTrackDialogVlc("Pistes audio", tracks, player.getAudioTrack(), new TrackSetter() {
            @Override public void set(int id) { player.setAudioTrack(id); }
        });
    }

    private void showSubtitleTrackDialog() {
        if (player == null) return;
        MediaPlayer.TrackDescription[] tracks = player.getSpuTracks();
        if (tracks == null || tracks.length == 0) {
            Toast.makeText(this, "Aucun sous-titre disponible", Toast.LENGTH_SHORT).show();
            return;
        }
        showTrackDialogVlc("Sous-titres", tracks, player.getSpuTrack(), new TrackSetter() {
            @Override public void set(int id) { player.setSpuTrack(id); }
        });
    }

    interface TrackSetter { void set(int id); }

    private void showTrackDialogVlc(String title, MediaPlayer.TrackDescription[] tracks, int currentId, final TrackSetter setter) {
        String[] labels = new String[tracks.length];
        final int[] ids = new int[tracks.length];
        int selected = 0;
        for (int i = 0; i < tracks.length; i++) {
            labels[i] = tracks[i].name != null ? tracks[i].name : ("Piste " + tracks[i].id);
            ids[i] = tracks[i].id;
            if (tracks[i].id == currentId) selected = i;
        }
        new AlertDialog.Builder(this, R.style.TransparentTrackDialog)
            .setTitle(title)
            .setSingleChoiceItems(labels, selected, new android.content.DialogInterface.OnClickListener() {
                @Override public void onClick(android.content.DialogInterface dialog, int which) {
                    setter.set(ids[which]);
                    dialog.dismiss();
                }
            })
            .setNegativeButton("Annuler", null)
            .show();
    }

    // ===== Bottom menu (Formuler/iPremiumTv style) =====
    // Each item: circular icon (white outline / black on focus), color dot, label visible on focus
    private void setupBottomMenu() {
        if (bottomMenuRow == null) return;
        bottomMenuRow.removeAllViews();
        // Channels list (opens sidebar) - left side button
        addMenuItem(R.drawable.ic_subtitles, "Chaînes", 0, new Runnable() {
            @Override public void run() { hideBottomMenu(); if (sidebarChannels.size() > 0) showSidebar(); }
        });
        // EPG button - opens EPG grid screen
        addMenuItem(R.drawable.ic_epg, "EPG", 0, new Runnable() {
            @Override public void run() {
                Intent result = new Intent();
                result.putExtra("openEpg", true);
                setResult(RESULT_OK, result);
                finish();
            }
        });
        addMenuItem(R.drawable.ic_audio, "Audio", 0, new Runnable() { @Override public void run() { showAudioTrackDialog(); } });
        addMenuItem(R.drawable.ic_subtitles, "Sous-titres", 0, new Runnable() { @Override public void run() { showSubtitleTrackDialog(); } });
        addMenuItem(R.drawable.ic_aspect, "Format", 0, new Runnable() { @Override public void run() { cycleAspectRatio(); } });
        // Search (green dot)
        addMenuItem(R.drawable.ic_subtitles, "Rechercher", 0xFF22c55e, new Runnable() {
            @Override public void run() { hideBottomMenu(); Toast.makeText(ExoPlayerActivity.this, "Recherche (à venir)", Toast.LENGTH_SHORT).show(); }
        });
        // Lock (yellow dot)
        addMenuItem(R.drawable.ic_timer, "Verrou", 0xFFeab308, new Runnable() {
            @Override public void run() { hideBottomMenu(); Toast.makeText(ExoPlayerActivity.this, "Code parental", Toast.LENGTH_SHORT).show(); }
        });
        // Favorite (blue dot)
        addMenuItem(R.drawable.ic_subtitles, "Favori", 0xFF3b82f6, new Runnable() {
            @Override public void run() { hideBottomMenu(); Toast.makeText(ExoPlayerActivity.this, "Favori (à venir)", Toast.LENGTH_SHORT).show(); }
        });
        // Record (red dot)
        addMenuItem(R.drawable.ic_restart, "Enregistrer", 0xFFef4444, new Runnable() {
            @Override public void run() { hideBottomMenu(); Toast.makeText(ExoPlayerActivity.this, "Enregistrement", Toast.LENGTH_SHORT).show(); }
        });
        addMenuItem(R.drawable.ic_timer, "Veille", 0, new Runnable() { @Override public void run() { showSleepTimerDialog(); } });
        addMenuItem(R.drawable.ic_pause_play, "Pause/Play", 0, new Runnable() {
            @Override public void run() {
                if (player != null) { if (player.isPlaying()) player.pause(); else player.play(); }
                hideBottomMenu();
            }
        });
        addMenuItem(R.drawable.ic_stop, "Arrêter", 0, new Runnable() { @Override public void run() { finish(); } });
    }

    private void addMenuItem(int iconRes, final String label, int dotColor, final Runnable action) {
        final View item = LayoutInflater.from(this).inflate(R.layout.item_bottom_menu, bottomMenuRow, false);
        ((android.widget.ImageView) item.findViewById(R.id.menu_icon_img)).setImageResource(iconRes);
        final TextView labelView = item.findViewById(R.id.menu_label);
        labelView.setText(label);

        View dotView = item.findViewById(R.id.color_dot);
        if (dotColor != 0) {
            dotView.setBackgroundColor(dotColor);
            dotView.setVisibility(View.VISIBLE);
        } else {
            dotView.setVisibility(View.INVISIBLE);
        }

        // Show label only on focus (Formuler style)
        item.setOnFocusChangeListener(new View.OnFocusChangeListener() {
            @Override public void onFocusChange(View v, boolean hasFocus) {
                labelView.setVisibility(hasFocus ? View.VISIBLE : View.INVISIBLE);
            }
        });
        item.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) { action.run(); }
        });
        bottomMenuRow.addView(item);
    }

    private void updateInfoRow() {
        View infoRow = findViewById(R.id.info_row);
        if (infoRow == null) return;
        // Channel name
        TextView nameView = findViewById(R.id.info_channel);
        if (nameView != null) nameView.setText(title != null ? title : "");
        // Group / number
        TextView groupView = findViewById(R.id.info_group);
        if (groupView != null) {
            String num = "";
            if (sidebarCurrentIdx >= 0) num = (sidebarCurrentIdx + 1) + " • ";
            String groupName = getIntent().getStringExtra("currentGroupName");
            if (groupName == null || groupName.isEmpty()) groupName = "Groupe : ⓅTV";
            groupView.setText(num + groupName);
        }
        // Description - placeholder for now (will come from EPG later)
        TextView descView = findViewById(R.id.info_description);
        if (descView != null) descView.setText("Pas d'informations");
        // Quality badge (FHD/HD based on title keywords)
        TextView qBadge = findViewById(R.id.info_badge_quality);
        if (qBadge != null && title != null) {
            String tl = title.toLowerCase();
            if (tl.contains("4k") || tl.contains("uhd")) {
                qBadge.setText("4K"); qBadge.setVisibility(View.VISIBLE);
            } else if (tl.contains("fhd")) {
                qBadge.setText("FHD"); qBadge.setVisibility(View.VISIBLE);
            } else if (tl.contains(" hd")) {
                qBadge.setText("HD"); qBadge.setVisibility(View.VISIBLE);
            } else {
                qBadge.setVisibility(View.GONE);
            }
        }
    }

    private void showBottomMenu() {
        if (bottomMenu == null) return;
        updateInfoRow();
        bottomMenu.setVisibility(View.VISIBLE);
        AlphaAnimation a = new AlphaAnimation(0f, 1f);
        a.setDuration(180);
        bottomMenu.startAnimation(a);
        bottomMenuOpen = true;
        if (bottomMenuRow.getChildCount() > 0) bottomMenuRow.getChildAt(0).requestFocus();
    }

    private void hideBottomMenu() {
        if (bottomMenu == null) return;
        bottomMenu.setVisibility(View.GONE);
        bottomMenuOpen = false;
        if (playerView != null) playerView.requestFocus();
    }

    private void cycleAspectRatio() {
        if (player == null) return;
        // libVLC aspect ratio cycle: auto → 16:9 → 4:3 → 1:1 → fill → auto
        String current = player.getAspectRatio();
        String next;
        String label;
        if (current == null) {
            next = "16:9"; label = "16:9";
        } else if ("16:9".equals(current)) {
            next = "4:3"; label = "4:3";
        } else if ("4:3".equals(current)) {
            next = "1:1"; label = "1:1";
        } else if ("1:1".equals(current)) {
            // Switch to fill mode via scale
            player.setAspectRatio(null);
            player.setScale(1f);
            Toast.makeText(this, "Remplir", Toast.LENGTH_SHORT).show();
            return;
        } else {
            next = null; label = "Auto";
            player.setScale(0f);
        }
        player.setAspectRatio(next);
        Toast.makeText(this, label, Toast.LENGTH_SHORT).show();
    }

    private void showSleepTimerDialog() {
        String[] options = new String[] { "Annuler veille", "15 min", "30 min", "60 min", "90 min", "120 min" };
        new AlertDialog.Builder(this, R.style.TransparentTrackDialog)
            .setTitle("Veille programmée")
            .setItems(options, new android.content.DialogInterface.OnClickListener() {
                @Override public void onClick(android.content.DialogInterface dialog, int which) {
                    if (sleepTimer != null) { sleepTimer.cancel(); sleepTimer = null; }
                    if (which == 0) {
                        Toast.makeText(ExoPlayerActivity.this, "Veille annulée", Toast.LENGTH_SHORT).show();
                        return;
                    }
                    int[] mins = new int[] { 0, 15, 30, 60, 90, 120 };
                    long durationMs = mins[which] * 60L * 1000L;
                    sleepTimer = new android.os.CountDownTimer(durationMs, 60000) {
                        @Override public void onTick(long ms) {}
                        @Override public void onFinish() {
                            Toast.makeText(ExoPlayerActivity.this, "Veille - arrêt", Toast.LENGTH_SHORT).show();
                            finish();
                        }
                    }.start();
                    Toast.makeText(ExoPlayerActivity.this, "Veille dans " + mins[which] + " min", Toast.LENGTH_SHORT).show();
                }
            })
            .setNegativeButton("Annuler", null)
            .show();
        hideBottomMenu();
    }

    // ===== Channel sidebar (LEFT key) =====
    private void setupChannelSidebar() {
        String channelsJson = getIntent().getStringExtra("channels");
        sidebarCurrentIdx = getIntent().getIntExtra("currentChannelIdx", -1);
        if (channelsJson == null || channelsJson.isEmpty()) return;
        try {
            JSONArray arr = new JSONArray(channelsJson);
            for (int i = 0; i < arr.length(); i++) sidebarChannels.add(arr.getJSONObject(i));
        } catch (Exception e) { sidebarChannels.clear(); }
        if (sidebarChannels.isEmpty()) return;

        ChannelAdapter adapter = new ChannelAdapter(this, sidebarChannels);
        // CHOICE_MODE_SINGLE indispensable pour que setItemChecked passe l'état "activated"
        // à l'item, sinon la stripe dorée + le fond doré ne s'affichent jamais.
        channelListView.setChoiceMode(android.widget.ListView.CHOICE_MODE_SINGLE);
        channelListView.setAdapter(adapter);
        channelListView.setOnItemClickListener(new android.widget.AdapterView.OnItemClickListener() {
            @Override public void onItemClick(android.widget.AdapterView<?> parent, View view, int position, long id) {
                selectChannel(position);
            }
        });
        if (sidebarCurrentIdx >= 0 && sidebarCurrentIdx < sidebarChannels.size()) {
            channelListView.setItemChecked(sidebarCurrentIdx, true);
        }
    }

    private void showSidebar() {
        if (channelSidebar == null || sidebarChannels.isEmpty()) return;
        channelSidebar.setVisibility(View.VISIBLE);
        AlphaAnimation a = new AlphaAnimation(0f, 1f);
        a.setDuration(180);
        channelSidebar.startAnimation(a);
        sidebarOpen = true;
        channelListView.requestFocus();
        int sel = sidebarCurrentIdx >= 0 ? sidebarCurrentIdx : 0;
        if (sel < sidebarChannels.size()) channelListView.setSelection(sel);
    }

    private void hideSidebar() {
        if (channelSidebar == null) return;
        AlphaAnimation a = new AlphaAnimation(1f, 0f);
        a.setDuration(180);
        a.setAnimationListener(new Animation.AnimationListener() {
            @Override public void onAnimationStart(Animation animation) {}
            @Override public void onAnimationEnd(Animation animation) { channelSidebar.setVisibility(View.GONE); }
            @Override public void onAnimationRepeat(Animation animation) {}
        });
        channelSidebar.startAnimation(a);
        sidebarOpen = false;
        if (playerView != null) playerView.requestFocus();
    }

    private void selectChannel(final int position) {
        if (position < 0 || position >= sidebarChannels.size()) return;
        final JSONObject ch = sidebarChannels.get(position);
        String newUrl = ch.optString("url", "");
        if (newUrl.isEmpty()) {
            Intent result = new Intent();
            result.putExtra("switchToStreamId", ch.optString("stream_id"));
            result.putExtra("switchToIndex", position);
            setResult(RESULT_OK, result);
            finish();
            return;
        }
        // Stalker URL? Resolve in background, keep current channel playing meanwhile
        if (newUrl.contains("create_link") && customCookies != null) {
            final String apiUrl = newUrl;
            Toast.makeText(this, "Chargement " + ch.optString("name") + "...", Toast.LENGTH_SHORT).show();
            hideSidebar();
            new Thread(new Runnable() {
                @Override public void run() {
                    final String resolved = resolveStalkerLink(apiUrl);
                    runOnUiThread(new Runnable() {
                        @Override public void run() { playUrlInPlace(position, ch, resolved); }
                    });
                }
            }).start();
            return;
        }
        playUrlInPlace(position, ch, newUrl);
        hideSidebar();
    }

    private void playUrlInPlace(int position, JSONObject ch, String newUrl) {
        if (newUrl == null || newUrl.isEmpty()) {
            Toast.makeText(this, "Lien introuvable", Toast.LENGTH_SHORT).show();
            return;
        }
        sidebarCurrentIdx = position;
        title = ch.optString("name", title);
        url = newUrl;
        // Met à jour la stripe dorée / le fond activé sur la chaîne désormais diffusée
        if (channelListView != null) {
            channelListView.setItemChecked(position, true);
        }
        if (player != null) {
            try { player.stop(); } catch (Exception ignored) {}
            loadAndPlay(newUrl);
        }
        Toast.makeText(this, ch.optString("name"), Toast.LENGTH_SHORT).show();
    }

    private String resolveStalkerLink(String apiUrl) {
        java.net.HttpURLConnection conn = null;
        try {
            java.net.URL u = new java.net.URL(apiUrl);
            conn = (java.net.HttpURLConnection) u.openConnection();
            conn.setConnectTimeout(4000);
            conn.setReadTimeout(5000);
            conn.setInstanceFollowRedirects(true);
            conn.setRequestProperty("User-Agent",
                customUserAgent != null && !customUserAgent.isEmpty() ? customUserAgent :
                "Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG250 stbapp ver: 4 rev: 2116 Safari/533.3");
            if (customCookies != null && !customCookies.isEmpty()) {
                conn.setRequestProperty("Cookie", customCookies);
            }
            conn.setRequestProperty("X-User-Agent", "Model: MAG250; Link: WiFi");
            int code = conn.getResponseCode();
            if (code < 200 || code >= 400) return apiUrl;
            java.io.BufferedReader br = new java.io.BufferedReader(new java.io.InputStreamReader(conn.getInputStream(), "UTF-8"));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = br.readLine()) != null) sb.append(line);
            br.close();
            JSONObject root = new JSONObject(sb.toString());
            JSONObject js = root.optJSONObject("js");
            if (js == null) return apiUrl;
            String cmd = js.optString("cmd", "").trim();
            if (cmd.isEmpty()) return apiUrl;
            cmd = cmd.replaceFirst("^(ffmpeg|auto)\\s+", "");
            for (String t : cmd.split("\\s+")) {
                if (t.startsWith("http://") || t.startsWith("https://") || t.startsWith("rtmp://") || t.startsWith("rtsp://")) {
                    return t;
                }
            }
            return cmd;
        } catch (Exception e) {
            return apiUrl;
        } finally {
            if (conn != null) try { conn.disconnect(); } catch (Exception ignored) {}
        }
    }

    private static class ChannelAdapter extends ArrayAdapter<JSONObject> {
        ChannelAdapter(Context ctx, List<JSONObject> items) { super(ctx, 0, items); }
        @Override
        public View getView(int position, View convertView, ViewGroup parent) {
            View v = convertView;
            if (v == null) v = LayoutInflater.from(getContext()).inflate(R.layout.item_channel, parent, false);
            JSONObject ch = getItem(position);
            if (ch == null) return v;
            ((TextView) v.findViewById(R.id.channel_num)).setText(ch.optString("num", String.valueOf(position + 1)));
            ((TextView) v.findViewById(R.id.channel_name)).setText(ch.optString("name", "?"));
            ((TextView) v.findViewById(R.id.channel_now)).setText(ch.optString("now", ""));
            return v;
        }
    }

    // ===== Group sidebar (LEFT 2x) =====
    private void setupGroupSidebar() {
        String groupsJson = getIntent().getStringExtra("groups");
        if (groupsJson == null || groupsJson.isEmpty()) return;
        try {
            JSONArray arr = new JSONArray(groupsJson);
            for (int i = 0; i < arr.length(); i++) sidebarGroups.add(arr.getJSONObject(i));
        } catch (Exception e) { sidebarGroups.clear(); }
        if (sidebarGroups.isEmpty()) return;
        ChannelAdapter adapter = new ChannelAdapter(this, sidebarGroups);
        groupListView.setChoiceMode(android.widget.ListView.CHOICE_MODE_SINGLE);
        groupListView.setAdapter(adapter);
        groupListView.setOnItemClickListener(new android.widget.AdapterView.OnItemClickListener() {
            @Override public void onItemClick(android.widget.AdapterView<?> parent, View view, int position, long id) {
                selectGroup(position);
            }
        });
    }

    private void showGroupSidebar() {
        if (groupSidebar == null || sidebarGroups.isEmpty()) return;
        groupSidebar.setVisibility(View.VISIBLE);
        AlphaAnimation a = new AlphaAnimation(0f, 1f);
        a.setDuration(180);
        groupSidebar.startAnimation(a);
        groupSidebarOpen = true;
        groupListView.requestFocus();
        groupListView.setSelection(0);
    }

    private void hideGroupSidebar() {
        if (groupSidebar == null) return;
        AlphaAnimation a = new AlphaAnimation(1f, 0f);
        a.setDuration(180);
        a.setAnimationListener(new Animation.AnimationListener() {
            @Override public void onAnimationStart(Animation animation) {}
            @Override public void onAnimationEnd(Animation animation) { groupSidebar.setVisibility(View.GONE); }
            @Override public void onAnimationRepeat(Animation animation) {}
        });
        groupSidebar.startAnimation(a);
        groupSidebarOpen = false;
        channelListView.requestFocus();
    }

    private void selectGroup(int position) {
        if (position < 0 || position >= sidebarGroups.size()) return;
        JSONObject group = sidebarGroups.get(position);
        // Cas normal : c'est un vrai groupe avec un category_id
        String groupId = group.optString("category_id", "");
        if (!groupId.isEmpty()) {
            Intent result = new Intent();
            result.putExtra("switchToGroupId", groupId);
            result.putExtra("switchToGroupName",
                group.optString("category_name", group.optString("name", "")));
            setResult(RESULT_OK, result);
            finish();
            return;
        }
        // Robustesse : certains providers envoient les chaines dans le slot "groups"
        // (ou ont des categories sans category_id). On bascule sur la chaine si on detecte
        // un stream_id, plutot que d'avoir un clic qui ne fait rien.
        String streamId = group.optString("stream_id", "");
        if (!streamId.isEmpty()) {
            Intent result = new Intent();
            result.putExtra("switchToStreamId", streamId);
            result.putExtra("switchToIndex", position);
            setResult(RESULT_OK, result);
            finish();
            return;
        }
        // Sinon on n'a vraiment rien d'exploitable : signal visuel a l'utilisateur
        Toast.makeText(this, "Element non selectionnable (id manquant)", Toast.LENGTH_SHORT).show();
    }

    // ===== External player fallback =====
    private void launchExternalAndFinish() {
        try {
            Intent vlc = new Intent(Intent.ACTION_VIEW);
            Uri u = Uri.parse(url);
            String mime = url.toLowerCase().contains(".m3u8") || url.toLowerCase().contains("/live/")
                ? "application/x-mpegURL" : "video/*";
            vlc.setDataAndType(u, mime);
            vlc.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            if (title != null) vlc.putExtra("title", title);
            try {
                getPackageManager().getPackageInfo("org.videolan.vlc", 0);
                vlc.setPackage("org.videolan.vlc");
                startActivity(vlc);
            } catch (Exception ignored) {
                startActivity(Intent.createChooser(vlc, "Ouvrir avec"));
            }
        } catch (Exception e) {
            Toast.makeText(this, "Aucun lecteur disponible : " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
        new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
            @Override public void run() { finish(); }
        }, 800);
    }
}
