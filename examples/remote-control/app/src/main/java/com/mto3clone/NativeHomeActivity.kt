package com.mto3clone

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.LinearLayout
import androidx.appcompat.app.AppCompatActivity

/**
 * Phase 1 native UI : Home Activity en Kotlin pur + XML layout.
 *
 * Voie native classique (pas Compose, qui crashe en CI) :
 * - Kotlin 1.9.20
 * - XML layout (activity_native_home.xml)
 * - ConstraintLayout + LinearLayout + Button
 *
 * 3 cards Home (Live TV / Films / Series) qui retombent sur l'app WebView pour
 * le moment. Les écrans seront migrés progressivement vers le natif.
 */
class NativeHomeActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_native_home)

        // Plein écran (style TV)
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        )

        val cardLive = findViewById<LinearLayout>(R.id.card_live)
        val cardVod = findViewById<LinearLayout>(R.id.card_vod)
        val cardSeries = findViewById<LinearLayout>(R.id.card_series)

        val backToWeb = View.OnClickListener { goWebView() }
        cardLive?.setOnClickListener(backToWeb)
        cardVod?.setOnClickListener(backToWeb)
        cardSeries?.setOnClickListener(backToWeb)

        // Auto-focus 1ère card pour navigation D-pad immédiate
        cardLive?.requestFocus()
    }

    private fun goWebView() {
        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }
}
