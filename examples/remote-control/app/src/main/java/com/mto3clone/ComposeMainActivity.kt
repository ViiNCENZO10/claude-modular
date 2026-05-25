package com.mto3clone

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
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
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.focusable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.platform.LocalContext

/**
 * Phase 1 native UI : ComposeMainActivity
 *
 * Activity Compose minimaliste qui sert d'alternative a MainActivity (WebView).
 * Aujourd'hui : ecran Home avec 3 cards (Live TV / Films / Series) + retour vers WebView.
 *
 * L'app WebView reste l'entree par defaut. Cette activity est launched seulement si
 * l'utilisateur active le toggle "Mode UI natif (beta)" dans Settings.
 */
class ComposeMainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            IPremTheme {
                HomeScreen(
                    onLiveTv = { openWebViewSection("live") },
                    onMovies = { openWebViewSection("vod") },
                    onSeries = { openWebViewSection("series") },
                    onBackToWebView = { openWebViewSection(null) }
                )
            }
        }
    }

    private fun openWebViewSection(screen: String?) {
        // Phase 1 : pour les ecrans pas encore portes (Live/VOD/Series),
        // on retombe sur l'ancienne MainActivity WebView.
        // En Phase 2+ ces routes redirigeront vers leurs equivalents Compose.
        val intent = Intent(this, MainActivity::class.java)
        if (screen != null) intent.putExtra("openScreen", screen)
        startActivity(intent)
        finish()
    }
}

@Composable
private fun IPremTheme(content: @Composable () -> Unit) {
    val colors = darkColorScheme(
        primary = Color(0xFF06B6D4),
        onPrimary = Color(0xFF0A1530),
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

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun HomeScreen(
    onLiveTv: () -> Unit,
    onMovies: () -> Unit,
    onSeries: () -> Unit,
    onBackToWebView: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.radialGradient(
                    colors = listOf(Color(0xFF1E3A8A), Color(0xFF0A1530), Color(0xFF000000)),
                    radius = 1200f
                )
            )
            .padding(horizontal = 48.dp, vertical = 32.dp)
    ) {
        // Titre app
        Text(
            text = "iPremTvOnline",
            color = Color.White,
            fontSize = 42.sp,
            fontWeight = FontWeight.ExtraBold
        )
        Text(
            text = "Mode UI Native (Phase 1 / Beta)",
            color = Color(0xFF67E8F9),
            fontSize = 14.sp,
            modifier = Modifier.padding(top = 4.dp)
        )

        Spacer(modifier = Modifier.height(60.dp))

        // 3 grosses cards
        val firstFocus = remember { FocusRequester() }
        Row(
            horizontalArrangement = Arrangement.spacedBy(24.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            NavCard(
                title = "Live TV",
                subtitle = "Chaines en direct",
                icon = Icons.Filled.LiveTv,
                modifier = Modifier
                    .weight(1f)
                    .focusRequester(firstFocus),
                onClick = onLiveTv
            )
            NavCard(
                title = "Films",
                subtitle = "Catalogue VOD",
                icon = Icons.Filled.Movie,
                modifier = Modifier.weight(1f),
                onClick = onMovies
            )
            NavCard(
                title = "Series",
                subtitle = "Episodes & saisons",
                icon = Icons.Filled.Tv,
                modifier = Modifier.weight(1f),
                onClick = onSeries
            )
        }

        Spacer(modifier = Modifier.weight(1f))

        // Footer : retour vers la WebView pour debug
        Text(
            text = "Appuyez RETOUR pour revenir a la version WebView",
            color = Color(0xFF64748B),
            fontSize = 11.sp,
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 16.dp),
            textAlign = TextAlign.Center
        )

        // Auto-focus la 1ere card pour navigation D-pad immediate
        LaunchedEffect(Unit) { firstFocus.requestFocus() }
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun NavCard(
    title: String,
    subtitle: String,
    icon: ImageVector,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    var focused by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(
        targetValue = if (focused) 1.06f else 1f,
        animationSpec = tween(durationMillis = 180),
        label = "navCardScale"
    )
    val borderColor = if (focused) Color(0xFF06B6D4) else Color(0xFF334155)
    val bg = if (focused) Color(0xFF1E3A8A) else Color(0xFF1E293B)

    Column(
        modifier = modifier
            .scale(scale)
            .height(180.dp)
            .shadow(elevation = if (focused) 24.dp else 8.dp, shape = RoundedCornerShape(16.dp))
            .background(bg, shape = RoundedCornerShape(16.dp))
            .border(width = 2.dp, color = borderColor, shape = RoundedCornerShape(16.dp))
            .focusable(interactionSource = remember { MutableInteractionSource() })
            .onFocusChanged { focused = it.isFocused }
            .clickable(onClick = onClick)
            .padding(24.dp),
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        Icon(
            imageVector = icon,
            contentDescription = title,
            tint = if (focused) Color.White else Color(0xFF67E8F9),
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
