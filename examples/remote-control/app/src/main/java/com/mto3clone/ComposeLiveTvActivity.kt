package com.mto3clone

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
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
 * Phase 2.1 : Skeleton Live TV en Compose.
 *
 * Layout cible (sera rempli par 2.2 + 2.3 + 2.4 + 2.5) :
 *  +----------------------------+
 *  | [<] Live TV          [clock] |  Header
 *  +-------+--------+-----------+
 *  | Catg  | Chaines| Preview   |
 *  |       |        |           |
 *  +-------+--------+-----------+
 */
class ComposeLiveTvActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            IPremTheme {
                LiveTvScreen(onBack = { finish() })
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
private fun LiveTvScreen(onBack: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(Color(0xFF0A1530), Color(0xFF050B18))
                )
            )
    ) {
        // === Header ===
        TopBar(title = "Live TV", onBack = onBack)

        // === Body : 3 colonnes (Catégories / Chaînes / Preview) ===
        Row(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            // Colonne 1 : Catégories
            ColumnPanel(
                title = "CATÉGORIES",
                modifier = Modifier.width(200.dp).fillMaxSize()
            ) {
                PlaceholderText("Étape 2.3\nLazyColumn focusable\nà venir")
            }

            Spacer(modifier = Modifier.size(12.dp))

            // Colonne 2 : Chaînes (prend tout l'espace dispo)
            WeightedColumn(weight = 1f, title = "CHAÎNES") {
                PlaceholderText("Étape 2.4\nListe filtrable\nà venir")
            }

            Spacer(modifier = Modifier.size(12.dp))

            // Colonne 3 : Preview
            ColumnPanel(
                title = "APERÇU",
                modifier = Modifier.width(300.dp).fillMaxSize()
            ) {
                PlaceholderText("Étape 2.5\nMini preview\n+ EPG now/next")
            }
        }
    }
}

@Composable
private fun RowScope.WeightedColumn(weight: Float, title: String, content: @Composable () -> Unit) {
    ColumnPanel(
        title = title,
        modifier = Modifier.weight(weight).fillMaxSize(),
        content = content
    )
}

@Composable
private fun TopBar(title: String, onBack: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF0F172A))
            .padding(horizontal = 18.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Back button rond avec focus state
        Box(
            modifier = Modifier
                .size(32.dp)
                .clip(CircleShape)
                .background(Color(0xFF1E293B))
                .clickable(onClick = onBack),
            contentAlignment = Alignment.Center
        ) {
            Text(text = "<", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
        }
        Spacer(modifier = Modifier.size(14.dp))
        Text(
            text = title,
            color = Color.White,
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
private fun ColumnPanel(
    title: String,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(Color(0xCC1E293B))
    ) {
        Text(
            text = title,
            color = Color(0xFF94A3B8),
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(start = 16.dp, top = 14.dp, bottom = 10.dp)
        )
        Box(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            content()
        }
    }
}

@Composable
private fun PlaceholderText(text: String) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text(
            text = text,
            color = Color(0xFF64748B),
            fontSize = 13.sp
        )
    }
}

// (helpers supprimes : on utilise Modifier.width(N.dp) directement inline)
