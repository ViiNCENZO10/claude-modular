package com.mto3clone

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

/**
 * Client IPTV minimal natif Kotlin.
 *
 * Phase 2.3 : juste assez pour lister les categories Live.
 * Supporte Xtream (player_api.php) + Stalker basic (portal.php).
 */
data class IptvCategory(val id: String, val name: String)

class IptvClient(private val portal: PortalData) {

    /**
     * Recupere la liste des categories Live TV depuis le portail.
     * Retourne [] en cas d'echec (l'UI affiche message d'erreur).
     */
    suspend fun fetchLiveCategories(): List<IptvCategory> = withContext(Dispatchers.IO) {
        try {
            when (portal.type) {
                "xtream" -> fetchXtreamCategories()
                "stalker" -> fetchStalkerCategories()
                else -> emptyList()
            }
        } catch (e: Exception) {
            android.util.Log.w("iPremTvOnline", "fetchLiveCategories failed: ${e.message}")
            emptyList()
        }
    }

    private fun fetchXtreamCategories(): List<IptvCategory> {
        val url = "${portal.server}/player_api.php?username=${enc(portal.username)}" +
                "&password=${enc(portal.password)}&action=get_live_categories"
        val raw = httpGet(url, ua = "Mozilla/5.0 iPremTvOnline") ?: return emptyList()
        // Reponse : tableau JSON [ {category_id, category_name, parent_id}, ... ]
        val arr = try { org.json.JSONArray(raw) } catch (e: Exception) { return emptyList() }
        val out = ArrayList<IptvCategory>(arr.length())
        for (i in 0 until arr.length()) {
            val o = arr.optJSONObject(i) ?: continue
            out.add(IptvCategory(
                id = o.optString("category_id", ""),
                name = o.optString("category_name", "")
            ))
        }
        return out
    }

    private fun fetchStalkerCategories(): List<IptvCategory> {
        // Stalker portal handshake + get_genres
        val baseUrl = portal.server.trimEnd('/')
        val cookies = "mac=${enc(portal.mac)}; stb_lang=fr; timezone=Europe%2FParis"
        val url = "$baseUrl/portal.php?type=itv&action=get_genres&JsHttpRequest=1-xml"
        val raw = httpGet(url, cookies = cookies, ua = STALKER_UA) ?: return emptyList()
        val obj = try { JSONObject(raw) } catch (e: Exception) { return emptyList() }
        val js = obj.optJSONObject("js") ?: return emptyList()
        // Stalker get_genres retourne soit un array soit un objet selon serveur
        val arr = try { js.optJSONArray("") ?: org.json.JSONArray(js.toString()) }
                   catch (e: Exception) { return emptyList() }
        // Plus robuste : try direct array dans js
        val out = ArrayList<IptvCategory>()
        try {
            val a = obj.optJSONObject("js")
            if (a != null) {
                // certain serveurs renvoient js: [array]
                val asArr = obj.opt("js")
                if (asArr is org.json.JSONArray) {
                    for (i in 0 until asArr.length()) {
                        val o = asArr.optJSONObject(i) ?: continue
                        out.add(IptvCategory(
                            id = o.optString("id", ""),
                            name = o.optString("title", "")
                        ))
                    }
                }
            }
        } catch (e: Exception) { }
        return out
    }

    private fun httpGet(url: String, cookies: String? = null, ua: String? = null): String? {
        var conn: HttpURLConnection? = null
        return try {
            conn = (URL(url).openConnection() as HttpURLConnection).apply {
                connectTimeout = 6000
                readTimeout = 10000
                requestMethod = "GET"
                instanceFollowRedirects = true
                if (ua != null) setRequestProperty("User-Agent", ua)
                if (cookies != null) setRequestProperty("Cookie", cookies)
                setRequestProperty("Accept", "application/json, text/plain, */*")
            }
            val code = conn.responseCode
            if (code !in 200..399) return null
            conn.inputStream.bufferedReader().use { it.readText() }
        } catch (e: Exception) {
            null
        } finally {
            try { conn?.disconnect() } catch (_: Exception) {}
        }
    }

    private fun enc(s: String) = URLEncoder.encode(s, "UTF-8")

    companion object {
        private const val STALKER_UA =
            "Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) " +
            "MAG250 stbapp ver: 4 rev: 2116 Safari/533.3"
    }
}
