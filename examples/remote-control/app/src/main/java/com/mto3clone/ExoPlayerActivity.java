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

import androidx.annotation.OptIn;
import androidx.appcompat.app.AppCompatActivity;
import androidx.media3.common.AudioAttributes;
import androidx.media3.common.C;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MimeTypes;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.common.TrackGroup;
import androidx.media3.common.TrackSelectionOverride;
import androidx.media3.common.TrackSelectionParameters;
import androidx.media3.common.Tracks;
import androidx.media3.common.util.UnstableApi;
import androidx.media3.common.Format;
import androidx.appcompat.app.AlertDialog;
import androidx.media3.datasource.DefaultHttpDataSource;
import androidx.media3.exoplayer.DefaultLoadControl;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory;
import androidx.media3.extractor.DefaultExtractorsFactory;
import androidx.media3.extractor.ts.DefaultTsPayloadReaderFactory;
import androidx.media3.ui.PlayerView;

@OptIn(markerClass = UnstableApi.class)
public class ExoPlayerActivity extends AppCompatActivity {

    private PlayerView playerView;
    private ExoPlayer player;
    private String url;
    private String title;
    private boolean isLive;
    private String customCookies;
    private String customUserAgent;
    private LinearLayout channelSidebar;
    private ListView channelListView;
    private List<JSONObject> sidebarChannels = new ArrayList<>();
    private int sidebarCurrentIdx = -1;
    private boolean sidebarOpen = false;
    private LinearLayout groupSidebar;
    private ListView groupListView;
    private List<JSONObject> sidebarGroups = new ArrayList<>();
    private boolean groupSidebarOpen = false;

    @Override
    @SuppressLint("UnsafeOptInUsageError")
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

        // Channel sidebar setup
        channelSidebar = findViewById(R.id.channel_sidebar);
        channelListView = findViewById(R.id.channel_list_view);
        groupSidebar = findViewById(R.id.group_sidebar);
        groupListView = findViewById(R.id.group_list_view);
        setupChannelSidebar();
        setupGroupSidebar();

        if (url == null || url.isEmpty()) {
            Toast.makeText(this, "No URL", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }

        initPlayer();
    }

    @SuppressLint("UnsafeOptInUsageError")
    private void initPlayer() {
        String effectiveUA = (customUserAgent != null && !customUserAgent.isEmpty())
                ? customUserAgent
                : "VLC/3.0.20 LibVLC/3.0.20";

        DefaultHttpDataSource.Factory httpFactory = new DefaultHttpDataSource.Factory()
                .setUserAgent(effectiveUA)
                .setAllowCrossProtocolRedirects(true)
                .setConnectTimeoutMs(20000)
                .setReadTimeoutMs(20000)
                .setKeepPostFor302Redirects(true);

        // Pass custom cookies (e.g. MAC=... for Stalker portals)
        if (customCookies != null && !customCookies.isEmpty()) {
            java.util.Map<String, String> headers = new java.util.HashMap<>();
            headers.put("Cookie", customCookies);
            httpFactory.setDefaultRequestProperties(headers);
        }

        // Detect stream type and use the right MediaSource
        // - /live/ or .m3u8 → HLS
        // - .ts → MPEG-TS (Progressive with TsExtractor)
        // - others → DefaultMediaSourceFactory (auto)
        String lower = url.toLowerCase();
        boolean isHls = lower.contains("/live/") || lower.contains(".m3u8") || lower.contains("/hls/");
        boolean isTs  = lower.endsWith(".ts") || lower.contains(".ts?");

        MediaItem.Builder itemBuilder = new MediaItem.Builder().setUri(Uri.parse(url));
        if (isHls) itemBuilder.setMimeType(MimeTypes.APPLICATION_M3U8);
        else if (isTs) itemBuilder.setMimeType(MimeTypes.VIDEO_MP2T);
        MediaItem mediaItem = itemBuilder.build();

        DefaultExtractorsFactory exFactory = new DefaultExtractorsFactory()
                .setTsExtractorFlags(DefaultTsPayloadReaderFactory.FLAG_ALLOW_NON_IDR_KEYFRAMES);

        DefaultMediaSourceFactory msf = new DefaultMediaSourceFactory(this, exFactory)
                .setDataSourceFactory(httpFactory);

        DefaultLoadControl loadControl;
        if (isLive) {
            // Live TV: 5s min buffer (vs 2s) for stable playback on weak networks,
            // up to 20s max (vs 15s), faster playback start
            loadControl = new DefaultLoadControl.Builder()
                    .setBufferDurationsMs(5000, 20000, 2000, 3000)
                    .setPrioritizeTimeOverSizeThresholds(true)
                    .setBackBuffer(30000, true)
                    .build();
        } else {
            // VOD: bigger buffer + back buffer for smooth seek
            loadControl = new DefaultLoadControl.Builder()
                    .setBufferDurationsMs(20000, 90000, 2500, 5000)
                    .setBackBuffer(60000, true)
                    .build();
        }

        player = new ExoPlayer.Builder(this)
                .setMediaSourceFactory(msf)
                .setLoadControl(loadControl)
                .build();

        AudioAttributes audioAttrs = new AudioAttributes.Builder()
                .setContentType(C.AUDIO_CONTENT_TYPE_MOVIE)
                .setUsage(C.USAGE_MEDIA)
                .build();
        player.setAudioAttributes(audioAttrs, true);

        playerView.setPlayer(player);
        playerView.setUseController(true);
        playerView.setControllerAutoShow(true);
        playerView.setControllerShowTimeoutMs(1500);
        playerView.setControllerHideOnTouch(true);
        playerView.setKeepScreenOn(true);
        playerView.setResizeMode(androidx.media3.ui.AspectRatioFrameLayout.RESIZE_MODE_FIT);

        player.setMediaItem(mediaItem);
        player.setPlayWhenReady(true);
        player.prepare();

        player.addListener(new Player.Listener() {
            @Override
            public void onPlayerError(PlaybackException error) {
                Throwable cause = error.getCause();
                String detail = (cause != null && cause.getMessage() != null) ? cause.getMessage() : error.getMessage();
                String msg = "[" + error.getErrorCodeName() + "] " + (detail != null ? detail : "unknown");
                Toast.makeText(ExoPlayerActivity.this, msg, Toast.LENGTH_LONG).show();

                // Auto-fallback to external player for parsing/codec errors
                int code = error.errorCode;
                boolean canFallback = (
                    code == PlaybackException.ERROR_CODE_PARSING_CONTAINER_UNSUPPORTED ||
                    code == PlaybackException.ERROR_CODE_PARSING_CONTAINER_MALFORMED ||
                    code == PlaybackException.ERROR_CODE_PARSING_MANIFEST_UNSUPPORTED ||
                    code == PlaybackException.ERROR_CODE_PARSING_MANIFEST_MALFORMED ||
                    code == PlaybackException.ERROR_CODE_DECODER_INIT_FAILED ||
                    code == PlaybackException.ERROR_CODE_DECODING_FAILED
                );

                if (canFallback) {
                    Toast.makeText(ExoPlayerActivity.this, "Bascule vers lecteur externe...", Toast.LENGTH_SHORT).show();
                    try {
                        Intent vlc = new Intent(Intent.ACTION_VIEW);
                        Uri u = Uri.parse(url);
                        String mime = url.toLowerCase().contains(".m3u8") || url.toLowerCase().contains("/live/")
                            ? "application/x-mpegURL" : "video/*";
                        vlc.setDataAndType(u, mime);
                        vlc.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(Intent.createChooser(vlc, "Ouvrir avec"));
                    } catch (Exception ignored) { }
                    new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
                        @Override public void run() { finish(); }
                    }, 1500);
                } else if (code != PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_FAILED) {
                    new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
                        @Override public void run() { finish(); }
                    }, 4000);
                }
            }

            @Override
            public void onPlaybackStateChanged(int state) {
                if (state == Player.STATE_ENDED && !isLive) {
                    finish();
                }
            }
        });
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
        if (player != null) player.play();
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (player != null && !isInPipMode()) {
            player.pause();
        }
    }

    private boolean isInPipMode() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && isInPictureInPictureMode();
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (player == null) return super.onKeyDown(keyCode, event);

        // Group sidebar open → handle its keys
        if (groupSidebarOpen) {
            if (keyCode == KeyEvent.KEYCODE_DPAD_RIGHT) {
                hideGroupSidebar(); // back to channels sidebar
                return true;
            }
            if (keyCode == KeyEvent.KEYCODE_BACK) {
                hideGroupSidebar();
                hideSidebar();
                return true;
            }
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
            return super.onKeyDown(keyCode, event); // ListView consumes up/down/enter
        }

        switch (keyCode) {
            case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE:
            case KeyEvent.KEYCODE_SPACE:
                if (player.isPlaying()) player.pause(); else player.play();
                return true;
            case KeyEvent.KEYCODE_MEDIA_STOP:
                finish();
                return true;
            case 185: // KEYCODE_PROG_YELLOW: audio tracks
            case KeyEvent.KEYCODE_A:
                showTrackDialog(C.TRACK_TYPE_AUDIO, "Pistes audio");
                return true;
            case 186: // KEYCODE_PROG_BLUE: subtitle tracks
            case KeyEvent.KEYCODE_S:
                showTrackDialog(C.TRACK_TYPE_TEXT, "Sous-titres");
                return true;
            case KeyEvent.KEYCODE_MEDIA_FAST_FORWARD:
                if (!isLive) player.seekTo(player.getCurrentPosition() + 10000);
                return true;
            case KeyEvent.KEYCODE_DPAD_RIGHT:
                if (!isLive) {
                    player.seekTo(player.getCurrentPosition() + 10000);
                    return true;
                }
                break;
            case KeyEvent.KEYCODE_MEDIA_REWIND:
                if (!isLive) player.seekTo(Math.max(0, player.getCurrentPosition() - 10000));
                return true;
            case KeyEvent.KEYCODE_DPAD_LEFT:
                if (isLive && sidebarChannels.size() > 0) {
                    showSidebar();
                    return true;
                }
                if (!isLive) {
                    player.seekTo(Math.max(0, player.getCurrentPosition() - 10000));
                    return true;
                }
                break;
        }
        return super.onKeyDown(keyCode, event);
    }

    // ===== Channel sidebar =====
    private void setupChannelSidebar() {
        String channelsJson = getIntent().getStringExtra("channels");
        sidebarCurrentIdx = getIntent().getIntExtra("currentChannelIdx", -1);

        if (channelsJson == null || channelsJson.isEmpty()) return;
        try {
            JSONArray arr = new JSONArray(channelsJson);
            for (int i = 0; i < arr.length(); i++) sidebarChannels.add(arr.getJSONObject(i));
        } catch (Exception e) {
            sidebarChannels.clear();
        }
        if (sidebarChannels.isEmpty()) return;

        ChannelAdapter adapter = new ChannelAdapter(this, sidebarChannels);
        channelListView.setAdapter(adapter);
        channelListView.setOnItemClickListener((parent, view, position, id) -> selectChannel(position));
        if (sidebarCurrentIdx >= 0 && sidebarCurrentIdx < sidebarChannels.size()) {
            channelListView.setItemChecked(sidebarCurrentIdx, true);
        }
    }

    private void showSidebar() {
        if (channelSidebar == null) return;
        channelSidebar.setVisibility(View.VISIBLE);
        AlphaAnimation a = new AlphaAnimation(0f, 1f);
        a.setDuration(180);
        channelSidebar.startAnimation(a);
        sidebarOpen = true;
        channelListView.requestFocus();
        int sel = sidebarCurrentIdx >= 0 ? sidebarCurrentIdx : 0;
        if (sel < sidebarChannels.size()) {
            channelListView.setSelection(sel);
        }
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
        playerView.requestFocus();
    }

    private void selectChannel(int position) {
        if (position < 0 || position >= sidebarChannels.size()) return;
        JSONObject ch = sidebarChannels.get(position);
        String newUrl = ch.optString("url", "");
        if (newUrl.isEmpty()) {
            // For Stalker/M3U with no pre-resolved URL: bail back to MainActivity
            Intent result = new Intent();
            result.putExtra("switchToStreamId", ch.optString("stream_id"));
            result.putExtra("switchToIndex", position);
            setResult(RESULT_OK, result);
            finish();
            return;
        }
        sidebarCurrentIdx = position;
        title = ch.optString("name", title);
        url = newUrl;
        if (player != null) {
            MediaItem.Builder b = new MediaItem.Builder().setUri(Uri.parse(newUrl));
            String lower = newUrl.toLowerCase();
            if (lower.contains("/live/") || lower.contains(".m3u8") || lower.contains("/hls/")) {
                b.setMimeType(MimeTypes.APPLICATION_M3U8);
            } else if (lower.endsWith(".ts") || lower.contains(".ts?")) {
                b.setMimeType(MimeTypes.VIDEO_MP2T);
            }
            player.setMediaItem(b.build());
            player.prepare();
            player.play();
        }
        hideSidebar();
        Toast.makeText(this, ch.optString("name"), Toast.LENGTH_SHORT).show();
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

    // ===== Group sidebar =====
    private void setupGroupSidebar() {
        String groupsJson = getIntent().getStringExtra("groups");
        if (groupsJson == null || groupsJson.isEmpty()) return;
        try {
            JSONArray arr = new JSONArray(groupsJson);
            for (int i = 0; i < arr.length(); i++) sidebarGroups.add(arr.getJSONObject(i));
        } catch (Exception e) {
            sidebarGroups.clear();
        }
        if (sidebarGroups.isEmpty()) return;

        ChannelAdapter adapter = new ChannelAdapter(this, sidebarGroups);
        groupListView.setAdapter(adapter);
        groupListView.setOnItemClickListener((parent, view, position, id) -> selectGroup(position));
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

    @SuppressLint("UnsafeOptInUsageError")
    private void showTrackDialog(int trackType, String title) {
        if (player == null) return;
        Tracks tracks = player.getCurrentTracks();
        if (tracks == null || tracks.isEmpty()) {
            Toast.makeText(this, "Aucune piste disponible", Toast.LENGTH_SHORT).show();
            return;
        }

        List<Tracks.Group> typeGroups = new ArrayList<>();
        for (Tracks.Group g : tracks.getGroups()) {
            if (g.getType() == trackType) typeGroups.add(g);
        }
        if (typeGroups.isEmpty()) {
            Toast.makeText(this, "Aucune piste pour ce type", Toast.LENGTH_SHORT).show();
            return;
        }

        List<String> labels = new ArrayList<>();
        List<TrackSelectionOverride> overrides = new ArrayList<>();
        int selectedIdx = 0;
        int currentIdx = 0;

        // Auto / Disable option
        labels.add(trackType == C.TRACK_TYPE_TEXT ? "Désactivés" : "Auto");
        overrides.add(null);

        for (Tracks.Group group : typeGroups) {
            TrackGroup tg = group.getMediaTrackGroup();
            for (int i = 0; i < tg.length; i++) {
                Format fmt = tg.getFormat(i);
                String label = "";
                if (fmt.language != null && !fmt.language.equals("und")) label = fmt.language.toUpperCase();
                if (fmt.label != null && !fmt.label.isEmpty()) label = (label.isEmpty() ? "" : label + " · ") + fmt.label;
                if (label.isEmpty()) label = "Piste " + (i + 1);
                if (fmt.codecs != null) label += " (" + fmt.codecs.split("\\.")[0] + ")";
                labels.add(label);
                overrides.add(new TrackSelectionOverride(tg, i));
                if (group.isTrackSelected(i)) selectedIdx = labels.size() - 1;
            }
        }

        String[] arr = labels.toArray(new String[0]);
        new AlertDialog.Builder(this, R.style.AppTheme)
            .setTitle(title)
            .setSingleChoiceItems(arr, selectedIdx, (dialog, which) -> {
                TrackSelectionParameters.Builder pb = player.getTrackSelectionParameters().buildUpon();
                if (which == 0) {
                    // Disable / auto
                    if (trackType == C.TRACK_TYPE_TEXT) {
                        pb.setTrackTypeDisabled(C.TRACK_TYPE_TEXT, true);
                    } else {
                        pb.clearOverridesOfType(trackType);
                        pb.setTrackTypeDisabled(trackType, false);
                    }
                } else {
                    TrackSelectionOverride override = overrides.get(which);
                    pb.clearOverridesOfType(trackType);
                    pb.setTrackTypeDisabled(trackType, false);
                    if (override != null) pb.addOverride(override);
                }
                player.setTrackSelectionParameters(pb.build());
                dialog.dismiss();
            })
            .setNegativeButton("Annuler", null)
            .show();
    }

    private void selectGroup(int position) {
        if (position < 0 || position >= sidebarGroups.size()) return;
        JSONObject group = sidebarGroups.get(position);
        // Signal MainActivity to switch to this group then play first channel
        Intent result = new Intent();
        result.putExtra("switchToGroupId", group.optString("category_id"));
        result.putExtra("switchToGroupName", group.optString("category_name"));
        setResult(RESULT_OK, result);
        finish();
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
        if (playerView != null) {
            playerView.setUseController(!isInPictureInPictureMode);
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (player != null) {
            player.release();
            player = null;
        }
    }
}
