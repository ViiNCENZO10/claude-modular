package com.mto3clone

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LiveTv
import androidx.compose.material.icons.filled.Movie
import androidx.compose.material.icons.filled.Tv
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Phase 1 native UI : Activity Compose minimale.
 * 3 cards Home (Live TV / Films / Series) qui retombent sur l'app WebView.
 */
class ComposeMainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            val colors = darkColorScheme(
                primary = Color(0xFF06B6D4),
                background = Color(0xFF050B18),
                surface = Color(0xFF1E293B),
                onBackground = Color(0xFFE2E8F0),
                onSurface = Color(0xFFE2E8F0)
            )
            MaterialTheme(colorScheme = colors) {
                Surface(modifier = Modifier.fillMaxSize(), color = colors.background) {
                    HomeScreen()
                }
            }
        }
    }

    private fun goWebView() {
        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }

    @Composable
    private fun HomeScreen() {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(48.dp)
        ) {
            Text(
                text = "iPremTvOnline",
                color = Color.White,
                fontSize = 42.sp,
                fontWeight = FontWeight.ExtraBold
            )
            Text(
                text = "Mode UI Native (Phase 1 - Beta)",
                color = Color(0xFF67E8F9),
                fontSize = 14.sp,
                modifier = Modifier.padding(top = 4.dp)
            )

            Spacer(modifier = Modifier.height(60.dp))

            Row(
                horizontalArrangement = Arrangement.spacedBy(24.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                NavCard(
                    title = "Live TV",
                    subtitle = "Chaines en direct",
                    onClick = { goWebView() }
                )
                NavCard(
                    title = "Films",
                    subtitle = "Catalogue VOD",
                    onClick = { goWebView() }
                )
                NavCard(
                    title = "Series",
                    subtitle = "Episodes & saisons",
                    onClick = { goWebView() }
                )
            }

            Spacer(modifier = Modifier.height(40.dp))
            Text(
                text = "Phase 1 termine. Click sur une card revient en mode WebView.",
                color = Color(0xFF64748B),
                fontSize = 12.sp
            )
        }
    }

    @Composable
    private fun NavCard(
        title: String,
        subtitle: String,
        onClick: () -> Unit
    ) {
        Column(
            modifier = Modifier
                .height(180.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(Color(0xFF1E293B))
                .clickable(onClick = onClick)
                .padding(24.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Icon(
                imageVector = when (title) {
                    "Live TV" -> Icons.Filled.LiveTv
                    "Films" -> Icons.Filled.Movie
                    else -> Icons.Filled.Tv
                },
                contentDescription = title,
                tint = Color(0xFF67E8F9),
                modifier = Modifier.size(48.dp)
            )
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
                    modifier = Modifier.padding(top = 2.dp)
                )
            }
        }
    }
}
