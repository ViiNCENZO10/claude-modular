package com.mto3clone

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Phase 1bis native UI : Activity Compose (en plus de NativeHomeActivity XML).
 *
 * Utilise le nouveau Compose Compiler Plugin Kotlin 2.0+ qui resout les conflits
 * de versions automatiquement. Compose BOM 2024.12.01.
 */
class ComposeMainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            IPremTheme {
                HomeScreen(
                    onLiveTv = {
                        // Live TV : ecran natif Compose (Phase 2)
                        startActivity(Intent(this, ComposeLiveTvActivity::class.java))
                    },
                    onMoviesOrSeries = {
                        // VOD / Series : retombe sur WebView en attendant Phase 3 et 4
                        startActivity(Intent(this, MainActivity::class.java))
                        finish()
                    }
                )
            }
        }
    }
}

@Composable
private fun IPremTheme(content: @Composable () -> Unit) {
    val colors = darkColorScheme(
        primary = Color(0xFF06B6D4),
        background = Color(0xFF050B18),
        surface = Color(0xFF1E293B),
        onBackground = Color(0xFFE2E8F0),
        onSurface = Color(0xFFE2E8F0)
    )
    MaterialTheme(colorScheme = colors) {
        Surface(modifier = Modifier.fillMaxSize(), color = colors.background) {
            content()
        }
    }
}

@Composable
private fun HomeScreen(onLiveTv: () -> Unit, onMoviesOrSeries: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.radialGradient(
                    colors = listOf(Color(0xFF1E3A8A), Color(0xFF0A1530), Color(0xFF000000))
                )
            )
    ) {
        Column(modifier = Modifier.padding(48.dp).fillMaxSize()) {
            Text(
                text = "iPremTvOnline",
                color = Color.White,
                fontSize = 42.sp,
                fontWeight = FontWeight.ExtraBold
            )
            Text(
                text = "Mode UI Native Compose - Phase 1bis",
                color = Color(0xFF67E8F9),
                fontSize = 14.sp,
                modifier = Modifier.padding(top = 4.dp)
            )

            Spacer(modifier = Modifier.height(60.dp))

            Row(
                horizontalArrangement = Arrangement.spacedBy(24.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                HomeCard(title = "Live TV", subtitle = "Chaines en direct (NATIF)", onClick = onLiveTv)
                HomeCard(title = "Films", subtitle = "Catalogue VOD (WebView)", onClick = onMoviesOrSeries)
                HomeCard(title = "Series", subtitle = "Episodes (WebView)", onClick = onMoviesOrSeries)
            }

            Spacer(modifier = Modifier.height(40.dp))
            Text(
                text = "Compose officiel Kotlin 2.0 plugin actif",
                color = Color(0xFF64748B),
                fontSize = 12.sp
            )
        }
    }
}

@Composable
private fun androidx.compose.foundation.layout.RowScope.HomeCard(
    title: String,
    subtitle: String,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .weight(1f)
            .height(180.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0xFF1E293B))
            .clickable(onClick = onClick)
            .padding(24.dp),
        contentAlignment = Alignment.BottomStart
    ) {
        Column {
            Text(
                text = title,
                color = Color.White,
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = subtitle,
                color = Color(0xFF94A3B8),
                fontSize = 13.sp,
                modifier = Modifier.padding(top = 4.dp)
            )
        }
    }
}
