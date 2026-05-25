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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

class ComposeLiveTvActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            IPremTheme { LiveTvScreen(onBack = { finish() }) }
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

private sealed class LoadState<out T> {
    object Loading : LoadState<Nothing>()
    data class Loaded<T>(val data: T) : LoadState<T>()
    data class Error(val msg: String) : LoadState<Nothing>()
    object NoPortal : LoadState<Nothing>()
}

@Composable
private fun LiveTvScreen(onBack: () -> Unit) {
    val ctx = LocalContext.current
    var state by remember { mutableStateOf<LoadState<List<IptvCategory>>>(LoadState.Loading) }
    var portalLabel by remember { mutableStateOf("...") }

    // Charge le portail actif + categories au montage
    LaunchedEffect(Unit) {
        val portal = PortalStore.loadActive(ctx)
        if (portal == null) {
            state = LoadState.NoPortal
            portalLabel = "(aucun portail connecte)"
            return@LaunchedEffect
        }
        portalLabel = portal.name.ifEmpty { portal.server }
        val cats = IptvClient(portal).fetchLiveCategories()
        state = if (cats.isEmpty()) {
            LoadState.Error("Aucune catégorie reçue du portail")
        } else {
            LoadState.Loaded(cats)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(colors = listOf(Color(0xFF0A1530), Color(0xFF050B18)))
            )
    ) {
        TopBar(title = "Live TV — $portalLabel", onBack = onBack)

        Row(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            // Colonne 1 : Catégories
            ColumnPanel(
                title = "CATÉGORIES",
                modifier = Modifier.width(240.dp).fillMaxSize()
            ) {
                when (val s = state) {
                    is LoadState.Loading -> CenteredLoader()
                    is LoadState.NoPortal -> CenteredMessage(
                        "Aucun portail actif.\nConnectez-vous depuis l'UI WebView d'abord.",
                        Color(0xFFFBBF24)
                    )
                    is LoadState.Error -> CenteredMessage(s.msg, Color(0xFFEF4444))
                    is LoadState.Loaded -> CategoryList(s.data)
                }
            }

            Spacer(modifier = Modifier.size(12.dp))

            // Colonne 2 : Chaînes (étape 2.4 à venir)
            WeightedColumn(weight = 1f, title = "CHAÎNES") {
                CenteredMessage("Étape 2.4 à venir", Color(0xFF64748B))
            }

            Spacer(modifier = Modifier.size(12.dp))

            // Colonne 3 : Aperçu (étape 2.5)
            ColumnPanel(
                title = "APERÇU",
                modifier = Modifier.width(300.dp).fillMaxSize()
            ) {
                CenteredMessage("Étape 2.5 à venir", Color(0xFF64748B))
            }
        }
    }
}

@Composable
private fun CategoryList(categories: List<IptvCategory>) {
    LazyColumn(modifier = Modifier.fillMaxSize()) {
        items(categories) { cat ->
            CategoryItem(cat)
        }
    }
}

@Composable
private fun CategoryItem(cat: IptvCategory) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(6.dp))
            .background(Color(0x331E293B))
            .clickable { /* TODO: étape 2.4 */ }
            .padding(horizontal = 12.dp, vertical = 10.dp)
    ) {
        Text(
            text = cat.name.ifEmpty { "(sans nom)" },
            color = Color.White,
            fontSize = 13.sp,
            fontWeight = FontWeight.Medium
        )
    }
}

@Composable
private fun CenteredLoader() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator(color = Color(0xFF06B6D4))
    }
}

@Composable
private fun CenteredMessage(text: String, color: Color) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text(text = text, color = color, fontSize = 12.sp)
    }
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
        Text(text = title, color = Color.White, fontSize = 17.sp, fontWeight = FontWeight.Bold)
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
            modifier = Modifier.padding(start = 16.dp, top = 14.dp, bottom = 8.dp)
        )
        Box(modifier = Modifier.fillMaxSize().padding(horizontal = 8.dp)) {
            content()
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
