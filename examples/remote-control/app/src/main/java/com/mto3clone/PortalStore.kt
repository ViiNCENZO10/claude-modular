package com.mto3clone

import android.content.Context
import org.json.JSONObject

/**
 * Persistance du portail actif (partage WebView <-> Compose UI).
 *
 * La WebView (legacy) garde ses portails en localStorage. Quand l'utilisateur
 * se connecte, le JS push une copie dans SharedPreferences via le bridge
 * AndroidBridge.persistActivePortal(jsonString). Les Activities natives
 * (ComposeLiveTvActivity, etc.) lisent depuis ici sans avoir besoin du WebView.
 */
data class PortalData(
    val type: String,           // "xtream" | "stalker" | "m3u"
    val name: String,
    val server: String,
    val username: String = "",
    val password: String = "",
    val mac: String = "",
    val playlistUrl: String = ""
)

object PortalStore {
    private const val PREFS = "iprem_portal_store"
    private const val KEY_ACTIVE = "active_portal_json"

    fun save(ctx: Context, jsonString: String) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_ACTIVE, jsonString)
            .apply()
    }

    fun loadJson(ctx: Context): String? {
        return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getString(KEY_ACTIVE, null)
    }

    fun loadActive(ctx: Context): PortalData? {
        val raw = loadJson(ctx) ?: return null
        return try {
            val j = JSONObject(raw)
            PortalData(
                type = j.optString("type", "xtream"),
                name = j.optString("name", ""),
                server = j.optString("server", ""),
                username = j.optString("username", ""),
                password = j.optString("password", ""),
                mac = j.optString("mac", ""),
                playlistUrl = j.optString("playlistUrl", "")
            )
        } catch (e: Exception) {
            null
        }
    }

    fun clear(ctx: Context) {
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .remove(KEY_ACTIVE)
            .apply()
    }
}
