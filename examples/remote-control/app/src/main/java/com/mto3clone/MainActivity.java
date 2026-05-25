package com.mto3clone;

import android.annotation.SuppressLint;
import android.app.PictureInPictureParams;
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
import android.webkit.ValueCallback;
import android.widget.Toast;

import androidx.core.content.FileProvider;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private FrameLayout fullscreenContainer;
    private View customView;
    private WebChromeClient.CustomViewCallback customViewCallback;

    @Override
    @SuppressLint("SetJavaScriptEnabled")
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Fullscreen flags
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(
                WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN
        );
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        fullscreenContainer = findViewById(R.id.fullscreen_container);

        // Immersive mode
        enterImmersiveMode();

        // Configure WebView settings
        configureWebView();

        // Load the local HTML
        webView.loadUrl("file:///android_asset/index.html");

        // Ensure WebView has focus so remote control keys reach it
        webView.setFocusable(true);
        webView.setFocusableInTouchMode(true);
        webView.requestFocus();
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void configureWebView() {
        WebSettings settings = webView.getSettings();

        // JavaScript and DOM storage
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);

        // Media playback without user gesture
        settings.setMediaPlaybackRequiresUserGesture(false);

        // File access for local assets
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);

        // Allow cross-origin requests from file:// URLs
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setAllowFileAccessFromFileURLs(true);

        // Allow mixed content (HTTP streams from HTTPS context)
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        // Cache and performance - mode RAM-agressif
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setDatabaseEnabled(true);
        settings.setDomStorageEnabled(true);
        // Images charges plus tot, ne block plus le rendering initial
        try { settings.setLoadsImagesAutomatically(true); } catch (Exception ignored) {}
        try { settings.setBlockNetworkImage(false); } catch (Exception ignored) {}
        // Force le JS et le layout sur thread dedie quand possible
        try { settings.setOffscreenPreRaster(true); } catch (Throwable ignored) {}

        // Hardware acceleration layer
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        // === RAM agressive : log le heap dispo + demande le max ===
        try {
            Runtime rt = Runtime.getRuntime();
            long maxMb = rt.maxMemory() / (1024L * 1024L);
            android.util.Log.i("iPremTvOnline", "Java heap max = " + maxMb + " MB (largeHeap)");
            // Hint au GC : on prefere garder en RAM plutot que d'agresser le CPU avec des collections
            // Note : -XX:NewRatio etc. ne sont pas configurables a runtime sur Android,
            // mais en gardant le heap pres du max on minimise le GC pressure
        } catch (Throwable ignored) {}

        // Keep default WebView User-Agent (Xtream/M3U portals expect a browser-like UA).
        // For Stalker portals specifically, the JS layer uses AndroidBridge.stalkerFetch()
        // which makes the HTTP call from Java with the MAG250 spoofed User-Agent.

        // JS bridge for Picture-in-Picture trigger from web layer
        webView.addJavascriptInterface(new AndroidBridge(), "AndroidBridge");

        // BroadcastReceiver pour Continue Watching : ExoPlayerActivity envoie la
        // position toutes les 10s, on relaie au JS via window.iprem.progress.save()
        registerProgressReceiver();

        // Keep navigation inside WebView + cache HTTP agressif pour images TMDB
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }

            // shouldInterceptRequest retire :
            // l'ancienne version interceptait image.tmdb.org pour cacher en HTTP,
            // mais HttpURLConnection.disconnect() n'etait jamais appele =>
            // fuite de socket file descriptors apres ~500 images
            // (crash sur boitier ARM avec ulimit 1024).
            // Le cache WebView natif + le module poster-warmup.js (Image preload)
            // gerent deja le caching efficacement, sans fuite.
        });

        // Fullscreen video support
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onShowCustomView(View view, CustomViewCallback callback) {
                if (customView != null) {
                    callback.onCustomViewHidden();
                    return;
                }
                customView = view;
                customViewCallback = callback;
                fullscreenContainer.addView(customView, new FrameLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                ));
                fullscreenContainer.setVisibility(View.VISIBLE);
                webView.setVisibility(View.GONE);
                enterImmersiveMode();
            }

            @Override
            public void onHideCustomView() {
                if (customView == null) {
                    return;
                }
                fullscreenContainer.removeView(customView);
                fullscreenContainer.setVisibility(View.GONE);
                webView.setVisibility(View.VISIBLE);
                customView = null;
                if (customViewCallback != null) {
                    customViewCallback.onCustomViewHidden();
                    customViewCallback = null;
                }
                enterImmersiveMode();
            }
        });
    }

    private void enterImmersiveMode() {
        View decorView = getWindow().getDecorView();
        decorView.setSystemUiVisibility(
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
        enterImmersiveMode();
    }

    private long mLastBackPressTime = 0;

    @Override
    public void onBackPressed() {
        // If showing fullscreen video, exit it
        if (customView != null) {
            webView.getWebChromeClient().onHideCustomView();
            return;
        }

        // Ask JS layer to handle back navigation (close modal / go back screen / close side menu)
        webView.evaluateJavascript(
            "(function(){try{if(window.tvnav&&typeof window.tvnav.goBack==='function'){return window.tvnav.goBack()?'handled':'noop';}return 'noop';}catch(e){return 'err';}})()",
            new ValueCallback<String>() {
                @Override
                public void onReceiveValue(String value) {
                    boolean handled = value != null && value.contains("handled");
                    if (handled) return;

                    // JS couldn't handle (we're at root)
                    long now = System.currentTimeMillis();
                    if (now - mLastBackPressTime < 2000) {
                        // Second press within 2s - actually exit
                        MainActivity.super.onBackPressed();
                    } else {
                        mLastBackPressTime = now;
                        Toast.makeText(MainActivity.this, "Appuyez encore pour quitter", Toast.LENGTH_SHORT).show();
                    }
                }
            }
        );
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == 1001 && resultCode == RESULT_OK && data != null) {
            String streamId = data.getStringExtra("switchToStreamId");
            int idx = data.getIntExtra("switchToIndex", -1);
            String groupId = data.getStringExtra("switchToGroupId");
            boolean openEpg = data.getBooleanExtra("openEpg", false);
            if (openEpg) {
                webView.evaluateJavascript("typeof showScreen === 'function' && showScreen('epg')", null);
            } else if (groupId != null && !groupId.isEmpty()) {
                // jsArg() escape correctement les quotes pour eviter SyntaxError
                String js = "window.iprem && window.iprem.switchGroup && window.iprem.switchGroup(" + jsArg(groupId) + ")";
                webView.evaluateJavascript(js, null);
            } else if (streamId != null && !streamId.isEmpty()) {
                // BUG FIX : streamId etait concatene SANS quotes. Si streamId etait
                // non-numerique (cas Stalker), le JS genere etait invalide :
                //   switchChannel(5, abc-123)  => abc-123 interprete comme moins
                // => SyntaxError [index.html:1:56] qu'on voyait depuis v3.4.0
                String js = "window.iprem && window.iprem.switchChannel && window.iprem.switchChannel(" + idx + ", " + jsArg(streamId) + ")";
                webView.evaluateJavascript(js, null);
            }
        }
    }

    @Override
    protected void onDestroy() {
        if (progressReceiver != null) {
            try { unregisterReceiver(progressReceiver); } catch (Exception ignored) {}
            progressReceiver = null;
        }
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }

    // ===== Continue Watching : reception broadcast SAVE_PROGRESS =====
    private android.content.BroadcastReceiver progressReceiver = null;
    private void registerProgressReceiver() {
        progressReceiver = new android.content.BroadcastReceiver() {
            @Override
            public void onReceive(android.content.Context ctx, Intent intent) {
                try {
                    String cid = intent.getStringExtra("contentId");
                    String ctype = intent.getStringExtra("contentType");
                    long pos = intent.getLongExtra("position", 0);
                    long dur = intent.getLongExtra("duration", 0);
                    String name = intent.getStringExtra("name");
                    if (cid == null || cid.isEmpty()) return;
                    final String js = "window.iprem && window.iprem.progress && window.iprem.progress.save("
                            + jsArg(cid) + ", "
                            + jsArg(ctype != null ? ctype : "vod") + ", "
                            + pos + ", " + dur + ", "
                            + jsArg(name != null ? name : "") + ")";
                    runOnUiThread(new Runnable() {
                        @Override public void run() {
                            if (webView != null) webView.evaluateJavascript(js, null);
                        }
                    });
                } catch (Exception ignored) {}
            }
        };
        android.content.IntentFilter filter = new android.content.IntentFilter("com.mto3clone.SAVE_PROGRESS");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(progressReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(progressReceiver, filter);
        }
    }

    private static String jsArg(String s) {
        if (s == null) return "''";
        // BUG FIX : ancienne version n'escapait pas U+2028 (LINE SEPARATOR) et
        // U+2029 (PARAGRAPH SEPARATOR) qui sont des terminateurs de ligne JS
        // MEME dans une string literal => SyntaxError "Invalid token" silencieux.
        // JSONObject.quote() escape proprement tout (chars de controle, unicode,
        // newlines, quotes, backslashes) - strictement plus safe que regex manuel.
        try {
            return org.json.JSONObject.quote(s);
        } catch (Throwable t) {
            // Fallback : version manuelle defensive
            String safe = s.replace("\\", "\\\\")
                           .replace("\"", "\\\"")
                           .replace("\n", " ")
                           .replace("\r", " ")
                           .replace(" ", " ")
                           .replace(" ", " ")
                           .replace("\t", " ");
            return "\"" + safe + "\"";
        }
    }

    // ===== Picture-in-Picture =====
    private boolean hasPipSupport() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return false;
        return getPackageManager().hasSystemFeature(PackageManager.FEATURE_PICTURE_IN_PICTURE);
    }

    public void triggerPip() {
        if (!hasPipSupport()) return;
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        PictureInPictureParams params = new PictureInPictureParams.Builder()
                                .setAspectRatio(new Rational(16, 9))
                                .build();
                        enterPictureInPictureMode(params);
                    }
                } catch (Exception ignored) { }
            }
        });
    }

    @Override
    public void onPictureInPictureModeChanged(boolean isInPictureInPictureMode, Configuration newConfig) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig);
        if (!isInPictureInPictureMode) {
            enterImmersiveMode();
        }
    }

    @Override
    public void onUserLeaveHint() {
        super.onUserLeaveHint();
        // Auto-enter PiP when user presses Home while video is playing (Android TV friendly)
        try {
            if (customView != null && hasPipSupport()) {
                triggerPip();
            }
        } catch (Exception ignored) { }
    }

    public class AndroidBridge {
        @JavascriptInterface
        public void enterPip() { triggerPip(); }

        @JavascriptInterface
        public boolean supportsPip() { return hasPipSupport(); }

        @JavascriptInterface
        public void openNativeUi() {
            runOnUiThread(new Runnable() {
                @Override public void run() {
                    startActivity(new Intent(MainActivity.this, NativeHomeActivity.class));
                    finish();
                }
            });
        }

        @JavascriptInterface
        public void openComposeUi() {
            runOnUiThread(new Runnable() {
                @Override public void run() {
                    startActivity(new Intent(MainActivity.this, ComposeMainActivity.class));
                    finish();
                }
            });
        }

        @JavascriptInterface
        public void playNative(String url, String title, boolean isLive) {
            playNativeWithAuth(url, title, isLive, null, null);
        }

        @JavascriptInterface
        public void playNativeWithAuth(String url, String title, boolean isLive, String cookies, String userAgent) {
            playNativeFull(url, title, isLive, cookies, userAgent, null, -1);
        }

        @JavascriptInterface
        public void playNativeFull(String url, String title, boolean isLive, String cookies, String userAgent, String channelsJson, int currentIdx) {
            playNativeAll(url, title, isLive, cookies, userAgent, channelsJson, currentIdx, null);
        }

        @JavascriptInterface
        public void playNativeAll(String url, String title, boolean isLive, String cookies, String userAgent, String channelsJson, int currentIdx, String groupsJson) {
            playNativeUltimate(url, title, isLive, cookies, userAgent, channelsJson, currentIdx, groupsJson, null);
        }

        @JavascriptInterface
        public void playNativeUltimate(String url, String title, boolean isLive, String cookies, String userAgent, String channelsJson, int currentIdx, String groupsJson, String altExtsCsv) {
            playNativeWithResume(url, title, isLive, cookies, userAgent, channelsJson, currentIdx, groupsJson, altExtsCsv, null, null, 0L);
        }

        // NOUVEAU : variant avec resume position pour Continue Watching
        @JavascriptInterface
        public void playNativeWithResume(String url, String title, boolean isLive, String cookies,
                                          String userAgent, String channelsJson, int currentIdx,
                                          String groupsJson, String altExtsCsv,
                                          String contentId, String contentType, long resumePositionSec) {
            if (url == null || url.isEmpty()) return;
            Intent i = new Intent(MainActivity.this, ExoPlayerActivity.class);
            i.putExtra("url", url);
            i.putExtra("title", title != null ? title : "");
            i.putExtra("isLive", isLive);
            if (cookies != null && !cookies.isEmpty()) i.putExtra("cookies", cookies);
            if (userAgent != null && !userAgent.isEmpty()) i.putExtra("userAgent", userAgent);
            if (channelsJson != null && !channelsJson.isEmpty()) i.putExtra("channels", channelsJson);
            if (groupsJson != null && !groupsJson.isEmpty()) i.putExtra("groups", groupsJson);
            if (currentIdx >= 0) i.putExtra("currentChannelIdx", currentIdx);
            if (altExtsCsv != null && !altExtsCsv.isEmpty()) i.putExtra("altExts", altExtsCsv);
            if (contentId != null && !contentId.isEmpty()) i.putExtra("contentId", contentId);
            if (contentType != null && !contentType.isEmpty()) i.putExtra("contentType", contentType);
            if (resumePositionSec > 0) i.putExtra("resumePosition", resumePositionSec);
            startActivityForResult(i, 1001);
        }

        @JavascriptInterface
        public boolean hasNativePlayer() { return true; }

        @JavascriptInterface
        public void setForceVlc(boolean force) {
            getSharedPreferences("iprem", MODE_PRIVATE).edit().putBoolean("force_vlc", force).apply();
        }

        @JavascriptInterface
        public boolean getForceVlc() {
            return getSharedPreferences("iprem", MODE_PRIVATE).getBoolean("force_vlc", false);
        }

        @JavascriptInterface
        public int getVersionCode() {
            try {
                return getPackageManager().getPackageInfo(getPackageName(), 0).versionCode;
            } catch (Exception e) { return 0; }
        }

        @JavascriptInterface
        public String getVersionName() {
            try {
                return getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
            } catch (Exception e) { return ""; }
        }

        @JavascriptInterface
        public boolean playExternal(String url, String title) {
            return launchExternalPlayer(url, title);
        }

        @JavascriptInterface
        public void downloadAndInstallApk(final String url) {
            if (url == null || url.isEmpty()) return;
            new Thread(new Runnable() {
                @Override
                public void run() {
                    HttpURLConnection conn = null;
                    try {
                        reportProgress(0, 0, "start");
                        File dir = new File(getCacheDir(), "updates");
                        if (!dir.exists()) dir.mkdirs();
                        File apkFile = new File(dir, "update.apk");
                        if (apkFile.exists()) apkFile.delete();

                        URL u = new URL(url);
                        conn = (HttpURLConnection) u.openConnection();
                        conn.setConnectTimeout(30000);
                        conn.setReadTimeout(60000);
                        conn.setInstanceFollowRedirects(true);
                        conn.setRequestProperty("User-Agent", "iPremTvOnline-Updater");

                        long total = conn.getContentLengthLong();
                        InputStream in = conn.getInputStream();
                        FileOutputStream out = new FileOutputStream(apkFile);
                        byte[] buf = new byte[64 * 1024];
                        long downloaded = 0;
                        long lastReport = 0;
                        int n;
                        while ((n = in.read(buf)) > 0) {
                            out.write(buf, 0, n);
                            downloaded += n;
                            long now = System.currentTimeMillis();
                            if (now - lastReport > 200) {
                                reportProgress(downloaded, total, "download");
                                lastReport = now;
                            }
                        }
                        out.flush();
                        out.close();
                        in.close();

                        reportProgress(downloaded, total, "complete");
                        installApk(apkFile);
                    } catch (Exception e) {
                        final String msg = e.getMessage() != null ? e.getMessage() : "unknown";
                        runOnUiThread(new Runnable() {
                            @Override public void run() {
                                if (webView != null) {
                                    // jsArg() escape proprement quotes + newlines + backslashes
                                    webView.evaluateJavascript(
                                        "window.iprem && window.iprem.onDownloadError && window.iprem.onDownloadError(" + jsArg(msg) + ")", null);
                                }
                            }
                        });
                    } finally {
                        if (conn != null) try { conn.disconnect(); } catch (Exception ignored) {}
                    }
                }
            }).start();
        }

        private void reportProgress(final long now, final long total, final String phase) {
            runOnUiThread(new Runnable() {
                @Override public void run() {
                    if (webView != null) {
                        webView.evaluateJavascript(
                            "window.iprem && window.iprem.onDownloadProgress && window.iprem.onDownloadProgress(" + now + "," + total + "," + jsArg(phase) + ")", null);
                    }
                }
            });
        }

        @JavascriptInterface
        public String stalkerFetch(String url, String mac) {
            // Stalker portal request with MAG250-spoofed User-Agent (isolated, doesn't affect WebView UA)
            HttpURLConnection conn = null;
            try {
                URL u = new URL(url);
                conn = (HttpURLConnection) u.openConnection();
                conn.setConnectTimeout(15000);
                conn.setReadTimeout(20000);
                conn.setInstanceFollowRedirects(true);
                conn.setRequestProperty("User-Agent",
                    "Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG250 stbapp ver: 4 rev: 2116 Safari/533.3");
                conn.setRequestProperty("X-User-Agent", "Model: MAG250; Link: WiFi");
                if (mac != null && !mac.isEmpty()) {
                    String cookie = "mac=" + java.net.URLEncoder.encode(mac, "UTF-8")
                                  + "; stb_lang=en; timezone=Europe%2FParis"
                                  + "; adid=" + mac.replace(":", "").toLowerCase();
                    conn.setRequestProperty("Cookie", cookie);
                }
                conn.setRequestProperty("Accept", "*/*");
                int code = conn.getResponseCode();
                InputStream is = (code >= 200 && code < 400) ? conn.getInputStream() : conn.getErrorStream();
                if (is == null) return "{\"error\":\"HTTP " + code + "\"}";
                java.io.BufferedReader br = new java.io.BufferedReader(new java.io.InputStreamReader(is, "UTF-8"));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) sb.append(line);
                br.close();
                return sb.toString();
            } catch (Exception e) {
                // e.getMessage() peut etre null (IOException sans message) =>
                // .replace() throw NPE => stalkerFetch retournait une exception au lieu de JSON
                String msg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
                return "{\"error\":\"" + msg.replace("\"", "'") + "\"}";
            } finally {
                if (conn != null) conn.disconnect();
            }
        }

        @JavascriptInterface
        public boolean canInstallApk() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                return getPackageManager().canRequestPackageInstalls();
            }
            return true;
        }

        @JavascriptInterface
        public void openInstallPermissionSettings() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                try {
                    Intent i = new Intent(android.provider.Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                    i.setData(Uri.parse("package:" + getPackageName()));
                    i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(i);
                } catch (Exception ignored) { }
            }
        }

        @JavascriptInterface
        public String getDeviceMac() {
            // Try ethernet first (box TV use eth0 by default)
            String mac = readMacFromFile("/sys/class/net/eth0/address");
            if (isValidMac(mac)) return mac.toUpperCase();
            mac = readMacFromFile("/sys/class/net/wlan0/address");
            if (isValidMac(mac)) return mac.toUpperCase();
            // Fallback: NetworkInterface
            try {
                java.util.Enumeration<java.net.NetworkInterface> nis = java.net.NetworkInterface.getNetworkInterfaces();
                while (nis.hasMoreElements()) {
                    java.net.NetworkInterface ni = nis.nextElement();
                    String name = ni.getName();
                    if (name == null) continue;
                    if (name.equalsIgnoreCase("eth0") || name.equalsIgnoreCase("wlan0")) {
                        byte[] addr = ni.getHardwareAddress();
                        if (addr != null && addr.length == 6) {
                            StringBuilder sb = new StringBuilder();
                            for (byte b : addr) {
                                if (sb.length() > 0) sb.append(':');
                                sb.append(String.format("%02X", b));
                            }
                            return sb.toString();
                        }
                    }
                }
            } catch (Exception ignored) { }
            return "";
        }

        @JavascriptInterface
        public String getNetworkInterfaces() {
            // Return all interfaces as JSON for debug/UI
            StringBuilder out = new StringBuilder("[");
            try {
                java.util.Enumeration<java.net.NetworkInterface> nis = java.net.NetworkInterface.getNetworkInterfaces();
                boolean first = true;
                while (nis.hasMoreElements()) {
                    java.net.NetworkInterface ni = nis.nextElement();
                    byte[] addr = ni.getHardwareAddress();
                    if (addr == null || addr.length != 6) continue;
                    StringBuilder mac = new StringBuilder();
                    for (byte b : addr) {
                        if (mac.length() > 0) mac.append(':');
                        mac.append(String.format("%02X", b));
                    }
                    if (!first) out.append(',');
                    out.append("{\"name\":\"").append(ni.getName()).append("\",\"mac\":\"").append(mac).append("\"}");
                    first = false;
                }
            } catch (Exception ignored) { }
            out.append("]");
            return out.toString();
        }

        private boolean isValidMac(String s) {
            if (s == null) return false;
            String t = s.trim();
            if (t.length() < 11) return false;
            return t.matches("(?i)[0-9a-f]{2}([:\\-][0-9a-f]{2}){5}");
        }

        private String readMacFromFile(String path) {
            try {
                java.io.BufferedReader br = new java.io.BufferedReader(new java.io.FileReader(path));
                String line = br.readLine();
                br.close();
                return line != null ? line.trim() : "";
            } catch (Exception e) { return ""; }
        }
    }

    // ===== Helpers for APK auto-install =====
    private void toastUi(final String msg) {
        new Handler(Looper.getMainLooper()).post(new Runnable() {
            @Override
            public void run() {
                Toast.makeText(MainActivity.this, msg, Toast.LENGTH_SHORT).show();
            }
        });
    }

    private boolean launchExternalPlayer(String url, String title) {
        if (url == null || url.isEmpty()) return false;
        // Try known players in order, fallback to chooser
        String[] candidatePackages = new String[] {
            "org.videolan.vlc",
            "com.mxtech.videoplayer.ad",
            "com.mxtech.videoplayer.pro",
            "tv.danmaku.bili",
            "com.brouken.player"
        };
        Uri uri = Uri.parse(url);
        String mime = inferMime(url);
        for (String pkg : candidatePackages) {
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW);
                intent.setPackage(pkg);
                intent.setDataAndType(uri, mime);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                if (title != null) intent.putExtra("title", title);
                intent.putExtra("position", 0);
                startActivity(intent);
                return true;
            } catch (Exception ignored) { }
        }
        // Fallback: generic chooser
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(uri, mime);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(Intent.createChooser(intent, "Ouvrir avec"));
            return true;
        } catch (Exception e) {
            toastUi("Aucun lecteur externe installé. Installe VLC ou MX Player.");
            return false;
        }
    }

    private String inferMime(String url) {
        String low = url.toLowerCase();
        if (low.contains(".m3u8") || low.contains("/hls/") || low.contains("/live/")) return "application/x-mpegURL";
        if (low.endsWith(".ts") || low.contains(".ts?")) return "video/mp2t";
        if (low.endsWith(".mp4") || low.contains(".mp4?")) return "video/mp4";
        if (low.endsWith(".mkv")) return "video/x-matroska";
        return "video/*";
    }

    private void installApk(File apkFile) {
        try {
            Uri uri;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                uri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", apkFile);
            } else {
                uri = Uri.fromFile(apkFile);
            }
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(uri, "application/vnd.android.package-archive");
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivity(intent);
        } catch (Exception e) {
            toastUi("Install error: " + e.getMessage());
        }
    }
}
