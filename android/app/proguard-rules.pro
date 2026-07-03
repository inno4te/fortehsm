# ForTe Fam — keep WebView and reflection-based bridges safe
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class android.webkit.** { *; }
