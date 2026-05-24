package com.mto3clone;

import android.annotation.SuppressLint;
import android.app.PictureInPictureParams;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.os.Build;
import android.os.Bundle;
import android.util.Rational;
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

    @Override
    public void onBackPressed() {
        // If showing fullscreen video, exit it
        if (customView != null) {
            webView.getWebChromeClient().onHideCustomView();
            return;
        }
        // If WebView can go back, navigate back
        if (webView.canGoBack()) {
            webView.goBack();
            return;
        }
        super.onBackPressed();
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
}
