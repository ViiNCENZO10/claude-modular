package com.mto3clone;

import android.annotation.SuppressLint;
import android.app.PictureInPictureParams;
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

        // Cache and performance
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setDatabaseEnabled(true);

        // Hardware acceleration layer
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        // Set Stalker-compatible User-Agent (MAG250) - many Stalker portals reject other UAs
        settings.setUserAgentString("Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG250 stbapp ver: 4 rev: 2116 Safari/533.3");

        // JS bridge for Picture-in-Picture trigger from web layer
        webView.addJavascriptInterface(new AndroidBridge(), "AndroidBridge");

        // Keep navigation inside WebView
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }
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
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
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
        public void playNative(String url, String title, boolean isLive) {
            if (url == null || url.isEmpty()) return;
            Intent i = new Intent(MainActivity.this, ExoPlayerActivity.class);
            i.putExtra("url", url);
            i.putExtra("title", title != null ? title : "");
            i.putExtra("isLive", isLive);
            startActivity(i);
        }

        @JavascriptInterface
        public boolean hasNativePlayer() { return true; }

        @JavascriptInterface
        public void downloadAndInstallApk(final String url) {
            if (url == null || url.isEmpty()) return;
            new Thread(new Runnable() {
                @Override
                public void run() {
                    try {
                        toastUi("Téléchargement de la mise à jour...");
                        File dir = new File(getCacheDir(), "updates");
                        if (!dir.exists()) dir.mkdirs();
                        File apkFile = new File(dir, "update.apk");
                        if (apkFile.exists()) apkFile.delete();

                        URL u = new URL(url);
                        HttpURLConnection conn = (HttpURLConnection) u.openConnection();
                        conn.setConnectTimeout(30000);
                        conn.setReadTimeout(60000);
                        conn.setInstanceFollowRedirects(true);
                        conn.setRequestProperty("User-Agent", "iPremTvOnline-Updater");
                        InputStream in = conn.getInputStream();
                        FileOutputStream out = new FileOutputStream(apkFile);
                        byte[] buf = new byte[16 * 1024];
                        int n;
                        while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
                        out.close();
                        in.close();
                        conn.disconnect();

                        toastUi("Lancement de l'installation...");
                        installApk(apkFile);
                    } catch (Exception e) {
                        toastUi("Échec mise à jour: " + e.getMessage());
                    }
                }
            }).start();
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
