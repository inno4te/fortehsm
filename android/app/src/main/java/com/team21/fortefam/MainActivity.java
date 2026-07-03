package com.team21.fortefam;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

/**
 * ForTe Fam — Android WebView wrapper.
 * Loads the bundled web app (assets/www/index.html) and exposes:
 *   • Microphone permission for the MediaRecorder voice notes
 *   • Photo / file picker via onShowFileChooser
 *   • External URL routing for Jitsi, Meet, Google Docs etc.
 *   • Hardware back button → WebView history back
 */
public class MainActivity extends Activity {

    private WebView web;
    private ValueCallback<Uri[]> filePathCallback;
    private static final int RC_FILE_CHOOSER = 1001;
    private static final int RC_PERMISSIONS  = 1002;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Deep forest-green system bar to match the brand
        Window window = getWindow();
        window.setStatusBarColor(Color.parseColor("#073820"));
        window.setNavigationBarColor(Color.parseColor("#0B4D2A"));

        // Ask for the runtime permissions the app needs up-front
        requestRuntimePermissions();

        web = new WebView(this);
        WebSettings ws = web.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);
        ws.setDatabaseEnabled(true);
        ws.setAllowFileAccess(true);
        ws.setAllowContentAccess(true);
        ws.setMediaPlaybackRequiresUserGesture(false);   // voice-note playback starts immediately
        ws.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        ws.setJavaScriptCanOpenWindowsAutomatically(true);
        ws.setSupportMultipleWindows(false);   // window.open() loads in this WebView → caught by shouldOverrideUrlLoading
        ws.setBuiltInZoomControls(false);
        ws.setDisplayZoomControls(false);
        ws.setLoadWithOverviewMode(false);
        ws.setUseWideViewPort(false);
        ws.setTextZoom(100);
        // a recognisable UA so server logs can tell native ForTe Fam from a browser
        ws.setUserAgentString(ws.getUserAgentString() + " ForTeFam/1.0");

        // Route external links (calls, Google tools, Drive shares) to the system browser
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                return handleExternal(req.getUrl().toString());
            }
            @SuppressWarnings("deprecation")
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleExternal(url);
            }
        });

        web.setWebChromeClient(new WebChromeClient() {

            // Grant in-page mic / cam requests automatically (we already prompted the user at OS level)
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> request.grant(request.getResources()));
            }

            // Photo / file picker bridge
            @Override
            public boolean onShowFileChooser(WebView wv,
                                             ValueCallback<Uri[]> callback,
                                             FileChooserParams params) {
                if (filePathCallback != null) filePathCallback.onReceiveValue(null);
                filePathCallback = callback;
                Intent intent;
                try {
                    intent = params.createIntent();
                } catch (Exception e) {
                    filePathCallback = null;
                    return false;
                }
                try {
                    startActivityForResult(intent, RC_FILE_CHOOSER);
                } catch (Exception e) {
                    filePathCallback = null;
                    Toast.makeText(MainActivity.this,
                            "Couldn't open the picker on this device",
                            Toast.LENGTH_SHORT).show();
                    return false;
                }
                return true;
            }
        });

        setContentView(web);
        web.loadUrl("file:///android_asset/www/index.html");
    }

    /** External URLs we always hand off to the system browser. */
    private boolean handleExternal(String url) {
        if (url == null) return false;
        String[] externalPrefixes = new String[]{
                "https://meet.jit.si",
                "https://meet.google.com",
                "https://docs.google.com",
                "https://drive.google.com",
                "https://calendar.google.com",
                "https://photos.google.com",
                "https://keep.google.com",
                "https://maps.google.com",
                "https://translate.google.com",
                "https://www.canva.com",
                "https://script.google.com",   // backend tab if the family wants to inspect it
                "mailto:", "tel:", "sms:", "geo:"
        };
        for (String p : externalPrefixes) {
            if (url.startsWith(p)) {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(intent);
                } catch (Exception ignored) { }
                return true;
            }
        }
        return false;
    }

    private void requestRuntimePermissions() {
        String[] need;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) { // SDK 33+
            need = new String[]{
                    Manifest.permission.RECORD_AUDIO,
                    Manifest.permission.READ_MEDIA_IMAGES,
                    Manifest.permission.READ_MEDIA_AUDIO,
                    Manifest.permission.READ_MEDIA_VIDEO
            };
        } else {
            need = new String[]{
                    Manifest.permission.RECORD_AUDIO,
                    Manifest.permission.READ_EXTERNAL_STORAGE
            };
        }
        java.util.ArrayList<String> ask = new java.util.ArrayList<>();
        for (String p : need) {
            if (ContextCompat.checkSelfPermission(this, p) != PackageManager.PERMISSION_GRANTED) {
                ask.add(p);
            }
        }
        if (!ask.isEmpty()) {
            ActivityCompat.requestPermissions(this, ask.toArray(new String[0]), RC_PERMISSIONS);
        }
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == RC_FILE_CHOOSER) {
            if (filePathCallback == null) return;
            Uri[] result = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
            filePathCallback.onReceiveValue(result);
            filePathCallback = null;
        }
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onPause() { if (web != null) web.onPause(); super.onPause(); }
    @Override
    protected void onResume() { super.onResume(); if (web != null) web.onResume(); }
}
