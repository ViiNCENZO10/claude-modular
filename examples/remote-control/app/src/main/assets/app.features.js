/* ============================================
   iPremTvOnline - Feature extensions
   - i18n (FR/EN/ES/IT/DE/NL)
   - AES-GCM crypto for stored credentials
   - Auto-update via GitHub releases
   - Cloud sync via GitHub Gist
   - Recordings (DVR catalog)
   - Recommendations (top-watched + recent)
   - Picture-in-Picture trigger
   ============================================ */

// ========== i18n ==========
const I18N_DICT = {
  en: { Welcome:"Welcome","Live TV":"Live TV", Movies:"Movies", Series:"Series", Catchup:"Catchup", "EPG Guide":"EPG Guide", Settings:"Settings", Recommended:"Recommended", Recordings:"Recordings", Language:"Language", "Cloud Sync":"Cloud Sync", "Auto Updates":"Auto Updates", "Picture in Picture":"Picture in Picture", Login:"Login", "Add Portal":"Add Portal", "Saved Portals":"Saved Portals", "Server URL":"Server URL", Username:"Username", Password:"Password", Search:"Search", Sort:"Sort", Favorite:"Favorite", EPG:"EPG", Categories:"Categories", "All Channels":"All Channels", Now:"Now", Next:"Next", Stop:"Stop", Play:"Play", Pause:"Pause", Mute:"Mute", "Press OK to watch":"Press OK to watch", Connecting:"Connecting...", "Stream Type":"Stream Type", "Buffer Size":"Buffer Size", "Parental PIN":"Parental PIN", Status:"Status", "Expiry Date":"Expiry Date", Logout:"Logout", "Clear Favorites":"Clear Favorites", "Clear Cache":"Clear Cache", Version:"Version", Record:"Record", "Update available":"Update available", "Sync now":"Sync now", "Push to cloud":"Push to cloud", "Pull from cloud":"Pull from cloud", "Check for updates":"Check for updates", "Up to date":"Up to date", "Recording saved":"Recording saved", "Language updated":"Language updated", "Credentials encrypted":"Credentials encrypted (AES-256)" },
  fr: { Welcome:"Bienvenue","Live TV":"TV en direct", Movies:"Films", Series:"Séries", Catchup:"Replay", "EPG Guide":"Guide EPG", Settings:"Réglages", Recommended:"Recommandés", Recordings:"Enregistrements", Language:"Langue", "Cloud Sync":"Synchronisation Cloud", "Auto Updates":"Mises à jour auto", "Picture in Picture":"Image dans Image", Login:"Connexion", "Add Portal":"Ajouter portail", "Saved Portals":"Portails enregistrés", "Server URL":"URL serveur", Username:"Identifiant", Password:"Mot de passe", Search:"Rechercher", Sort:"Trier", Favorite:"Favori", EPG:"EPG", Categories:"Catégories", "All Channels":"Toutes les chaînes", Now:"Maintenant", Next:"Après", Stop:"Stop", Play:"Lire", Pause:"Pause", Mute:"Muet", "Press OK to watch":"Appuyer OK pour regarder", Connecting:"Connexion...", "Stream Type":"Type de flux", "Buffer Size":"Taille buffer", "Parental PIN":"Code parental", Status:"Statut", "Expiry Date":"Date d'expiration", Logout:"Déconnexion", "Clear Favorites":"Effacer favoris", "Clear Cache":"Effacer cache", Version:"Version", Record:"Enregistrer", "Update available":"Mise à jour disponible", "Sync now":"Synchroniser", "Push to cloud":"Envoyer au cloud", "Pull from cloud":"Récupérer du cloud", "Check for updates":"Vérifier mises à jour", "Up to date":"À jour", "Recording saved":"Enregistrement sauvegardé", "Language updated":"Langue mise à jour", "Credentials encrypted":"Identifiants chiffrés (AES-256)" },
  es: { Welcome:"Bienvenido","Live TV":"TV en vivo", Movies:"Películas", Series:"Series", Catchup:"Repeticiones", "EPG Guide":"Guía EPG", Settings:"Ajustes", Recommended:"Recomendados", Recordings:"Grabaciones", Language:"Idioma", "Cloud Sync":"Sincr. Nube", "Auto Updates":"Actualizaciones auto", "Picture in Picture":"Imagen en imagen", Login:"Acceder", "Add Portal":"Añadir portal", "Saved Portals":"Portales guardados", "Server URL":"URL servidor", Username:"Usuario", Password:"Contraseña", Search:"Buscar", Sort:"Ordenar", Favorite:"Favorito", EPG:"EPG", Categories:"Categorías", "All Channels":"Todos los canales", Now:"Ahora", Next:"Siguiente", Stop:"Stop", Play:"Reproducir", Pause:"Pausa", Mute:"Silencio", "Press OK to watch":"OK para ver", Connecting:"Conectando...", "Stream Type":"Tipo de stream", "Buffer Size":"Buffer", "Parental PIN":"PIN parental", Status:"Estado", "Expiry Date":"Fecha caducidad", Logout:"Cerrar sesión", "Clear Favorites":"Borrar favoritos", "Clear Cache":"Limpiar caché", Version:"Versión", Record:"Grabar", "Update available":"Actualización disponible", "Sync now":"Sincronizar", "Push to cloud":"Enviar a nube", "Pull from cloud":"Traer de nube", "Check for updates":"Buscar actualizaciones", "Up to date":"Al día", "Recording saved":"Grabación guardada", "Language updated":"Idioma actualizado", "Credentials encrypted":"Credenciales cifradas (AES-256)" },
  it: { Welcome:"Benvenuto","Live TV":"TV in diretta", Movies:"Film", Series:"Serie", Catchup:"Replay", "EPG Guide":"Guida EPG", Settings:"Impostazioni", Recommended:"Consigliati", Recordings:"Registrazioni", Language:"Lingua", "Cloud Sync":"Sincr. Cloud", "Auto Updates":"Aggiornamenti auto", "Picture in Picture":"Picture in Picture", Login:"Accedi", "Add Portal":"Aggiungi portale", "Saved Portals":"Portali salvati", "Server URL":"URL server", Username:"Utente", Password:"Password", Search:"Cerca", Sort:"Ordina", Favorite:"Preferito", EPG:"EPG", Categories:"Categorie", "All Channels":"Tutti i canali", Now:"Ora", Next:"Dopo", Stop:"Stop", Play:"Riproduci", Pause:"Pausa", Mute:"Muto", "Press OK to watch":"OK per guardare", Connecting:"Connessione...", "Stream Type":"Tipo stream", "Buffer Size":"Buffer", "Parental PIN":"PIN genitori", Status:"Stato", "Expiry Date":"Scadenza", Logout:"Esci", "Clear Favorites":"Cancella preferiti", "Clear Cache":"Pulisci cache", Version:"Versione", Record:"Registra", "Update available":"Aggiornamento disponibile", "Sync now":"Sincronizza", "Push to cloud":"Invia al cloud", "Pull from cloud":"Scarica dal cloud", "Check for updates":"Verifica aggiornamenti", "Up to date":"Aggiornato", "Recording saved":"Registrazione salvata", "Language updated":"Lingua aggiornata", "Credentials encrypted":"Credenziali cifrate (AES-256)" },
  de: { Welcome:"Willkommen","Live TV":"Live-TV", Movies:"Filme", Series:"Serien", Catchup:"Aufholen", "EPG Guide":"EPG-Programm", Settings:"Einstellungen", Recommended:"Empfohlen", Recordings:"Aufnahmen", Language:"Sprache", "Cloud Sync":"Cloud-Sync", "Auto Updates":"Auto-Updates", "Picture in Picture":"Bild im Bild", Login:"Anmelden", "Add Portal":"Portal hinzufügen", "Saved Portals":"Gespeicherte Portale", "Server URL":"Server-URL", Username:"Benutzer", Password:"Passwort", Search:"Suchen", Sort:"Sortieren", Favorite:"Favorit", EPG:"EPG", Categories:"Kategorien", "All Channels":"Alle Sender", Now:"Jetzt", Next:"Nächstes", Stop:"Stopp", Play:"Wiedergabe", Pause:"Pause", Mute:"Stumm", "Press OK to watch":"OK drücken zum Sehen", Connecting:"Verbinden...", "Stream Type":"Stream-Typ", "Buffer Size":"Puffergröße", "Parental PIN":"Eltern-PIN", Status:"Status", "Expiry Date":"Ablaufdatum", Logout:"Abmelden", "Clear Favorites":"Favoriten löschen", "Clear Cache":"Cache leeren", Version:"Version", Record:"Aufnehmen", "Update available":"Update verfügbar", "Sync now":"Jetzt syncen", "Push to cloud":"In Cloud senden", "Pull from cloud":"Aus Cloud holen", "Check for updates":"Updates prüfen", "Up to date":"Aktuell", "Recording saved":"Aufnahme gespeichert", "Language updated":"Sprache aktualisiert", "Credentials encrypted":"Zugangsdaten verschlüsselt (AES-256)" },
  nl: { Welcome:"Welkom","Live TV":"Live TV", Movies:"Films", Series:"Series", Catchup:"Terugkijken", "EPG Guide":"EPG-gids", Settings:"Instellingen", Recommended:"Aanbevolen", Recordings:"Opnames", Language:"Taal", "Cloud Sync":"Cloudsync", "Auto Updates":"Auto-update", "Picture in Picture":"Beeld-in-beeld", Login:"Inloggen", "Add Portal":"Portaal toevoegen", "Saved Portals":"Opgeslagen portalen", "Server URL":"Server-URL", Username:"Gebruiker", Password:"Wachtwoord", Search:"Zoeken", Sort:"Sorteren", Favorite:"Favoriet", EPG:"EPG", Categories:"Categorieën", "All Channels":"Alle zenders", Now:"Nu", Next:"Volgende", Stop:"Stop", Play:"Afspelen", Pause:"Pauze", Mute:"Demp", "Press OK to watch":"OK om te kijken", Connecting:"Verbinden...", "Stream Type":"Streamtype", "Buffer Size":"Buffer", "Parental PIN":"Ouderlijke PIN", Status:"Status", "Expiry Date":"Vervaldatum", Logout:"Uitloggen", "Clear Favorites":"Favorieten wissen", "Clear Cache":"Cache wissen", Version:"Versie", Record:"Opnemen", "Update available":"Update beschikbaar", "Sync now":"Nu syncen", "Push to cloud":"Naar cloud", "Pull from cloud":"Uit cloud", "Check for updates":"Updates zoeken", "Up to date":"Up-to-date", "Recording saved":"Opname opgeslagen", "Language updated":"Taal bijgewerkt", "Credentials encrypted":"Gegevens versleuteld (AES-256)" }
};

let CURRENT_LANG = localStorage.getItem('iprem_lang') || 'fr';

function t(key) {
  const dict = I18N_DICT[CURRENT_LANG] || I18N_DICT.en;
  return dict[key] || key;
}

function setLang(lang) {
  if (!I18N_DICT[lang]) return;
  CURRENT_LANG = lang;
  localStorage.setItem('iprem_lang', lang);
  applyI18n();
}

function applyI18n() {
  // Translate all elements with [data-i18n]
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    const k = el.getAttribute('data-i18n');
    el.textContent = t(k);
  });
  // Translate placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
    const k = el.getAttribute('data-i18n-placeholder');
    el.setAttribute('placeholder', t(k));
  });
}


// ========== AES-GCM Crypto (Web Crypto API) ==========
async function deriveKey(password) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode('iprem_salt_v1'), iterations: 100000, hash: 'SHA-256' },
    keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
  );
}

function getDeviceKey() {
  // Stable key per device (not perfect, but obfuscates plaintext on disk)
  let k = localStorage.getItem('iprem_devkey');
  if (!k) {
    k = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2,'0')).join('');
    localStorage.setItem('iprem_devkey', k);
  }
  return k;
}

async function encryptString(plain) {
  try {
    const key = await deriveKey(getDeviceKey());
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, new TextEncoder().encode(plain));
    const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2,'0')).join('');
    const ctHex = Array.from(new Uint8Array(ct)).map(b => b.toString(16).padStart(2,'0')).join('');
    return 'enc:' + ivHex + ':' + ctHex;
  } catch (e) {
    console.warn('encrypt failed', e);
    return plain;
  }
}

async function decryptString(encrypted) {
  try {
    if (!encrypted || !encrypted.startsWith('enc:')) return encrypted;
    const parts = encrypted.split(':');
    const iv = new Uint8Array(parts[1].match(/.{2}/g).map(h => parseInt(h, 16)));
    const ct = new Uint8Array(parts[2].match(/.{2}/g).map(h => parseInt(h, 16)));
    const key = await deriveKey(getDeviceKey());
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, ct);
    return new TextDecoder().decode(pt);
  } catch (e) {
    console.warn('decrypt failed', e);
    return encrypted;
  }
}


// ========== Auto-update (GitHub Releases) ==========
const APP_VERSION = '4.0.5';
const UPDATE_REPO = 'ViiNCENZO10/claude-modular';

function getInstalledVersionCode() {
  try {
    if (window.AndroidBridge && typeof window.AndroidBridge.getVersionCode === 'function') {
      return window.AndroidBridge.getVersionCode();
    }
  } catch (e) {}
  return 0;
}

function extractBuildNumber(tagName) {
  // Tag format: v3.1.3-b30 → return 30
  if (!tagName) return 0;
  var m = String(tagName).match(/-b(\d+)$/i);
  return m ? parseInt(m[1], 10) : 0;
}

async function checkForUpdates(silent) {
  try {
    const r = await fetch('https://api.github.com/repos/' + UPDATE_REPO + '/releases/latest');
    if (!r.ok) {
      if (!silent) showToast(t('Up to date'));
      return null;
    }
    const data = await r.json();
    const latestTag = data.tag_name || '';
    const latestBuild = extractBuildNumber(latestTag);
    const installedBuild = getInstalledVersionCode();
    const latest = latestTag.replace(/^v/, '');

    // Use buildNumber comparison if both available — that's the source of truth
    var hasUpdate;
    if (latestBuild > 0 && installedBuild > 0) {
      hasUpdate = latestBuild > installedBuild;
    } else {
      hasUpdate = latest && latest !== APP_VERSION;
    }

    if (hasUpdate) {
      const apk = (data.assets || []).find(a => a.name && a.name.endsWith('.apk'));
      const dlUrl = apk ? apk.browser_download_url : data.html_url;
      const banner = document.getElementById('updateBanner');
      const hasNativeInstall = !!(window.AndroidBridge && typeof window.AndroidBridge.downloadAndInstallApk === 'function');
      if (banner) {
        if (hasNativeInstall && apk) {
          banner.innerHTML = '<span>' + t('Update available') + ' : v' + latest + '</span> <button class="btn btn-primary btn-sm" id="btnAutoInstall">Installer maintenant</button>';
          banner.style.display = 'flex';
          setTimeout(function() {
            var btn = document.getElementById('btnAutoInstall');
            if (btn) btn.addEventListener('click', function() { triggerAutoInstall(dlUrl); });
          }, 100);
        } else {
          banner.innerHTML = '<span>' + t('Update available') + ' : v' + latest + '</span> <a class="btn btn-primary btn-sm" href="' + dlUrl + '">Télécharger</a>';
          banner.style.display = 'flex';
        }
      }
      if (!silent) showToast(t('Update available') + ' : v' + latest, 6000);
      return latest;
    } else if (!silent) {
      showToast(t('Up to date'));
    }
  } catch (e) {
    if (!silent) showToast(t('Up to date'));
  }
  return null;
}

function triggerAutoInstall(apkUrl) {
  if (!window.AndroidBridge || typeof window.AndroidBridge.downloadAndInstallApk !== 'function') {
    showToast('Installation auto non supportée');
    return;
  }
  try {
    if (typeof window.AndroidBridge.canInstallApk === 'function' && !window.AndroidBridge.canInstallApk()) {
      showToast('Autorisez l\'installation : Paramètres → Applications inconnues');
      if (typeof window.AndroidBridge.openInstallPermissionSettings === 'function') {
        setTimeout(function() { window.AndroidBridge.openInstallPermissionSettings(); }, 800);
      }
      return;
    }
  } catch (e) {}
  showToast('Téléchargement...');
  window.AndroidBridge.downloadAndInstallApk(apkUrl);
}


// ========== Cloud Sync (via GitHub Gist) ==========
function getGistConfig() {
  return {
    token: localStorage.getItem('iprem_gist_token') || '',
    gistId: localStorage.getItem('iprem_gist_id') || ''
  };
}

function setGistConfig(token, gistId) {
  localStorage.setItem('iprem_gist_token', token || '');
  if (gistId) localStorage.setItem('iprem_gist_id', gistId);
}

function collectSyncPayload() {
  // safeJSON : si une cle LS est corrompue, on ne throw pas, on retourne defaut
  var safeJSON = function(key, defaultJson) {
    try { return JSON.parse(localStorage.getItem(key) || defaultJson); }
    catch (e) {
      try { localStorage.removeItem(key); } catch (_) {}
      return JSON.parse(defaultJson);
    }
  };
  var favKeys = {};
  try {
    Object.keys(localStorage).filter(function(k) { return k.indexOf('iprem_favorites_') === 0; }).forEach(function(k) {
      favKeys[k] = safeJSON(k, '{}');
    });
  } catch (_) {}
  return {
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
    portals: safeJSON('iprem_portals', '[]'),
    settings: safeJSON('iprem_settings', '{}'),
    favorites_keys: favKeys,
    recordings: safeJSON('iprem_recordings', '[]'),
    recommendations: safeJSON('iprem_recos', '{}'),
    language: CURRENT_LANG
  };
}

async function pushToCloud() {
  const cfg = getGistConfig();
  if (!cfg.token) { showToast('Token required (Settings)'); return; }
  const payload = collectSyncPayload();
  const body = {
    description: 'iPremTvOnline backup',
    public: false,
    files: { 'iprem_backup.json': { content: JSON.stringify(payload, null, 2) } }
  };
  const url = cfg.gistId ? ('https://api.github.com/gists/' + cfg.gistId) : 'https://api.github.com/gists';
  const method = cfg.gistId ? 'PATCH' : 'POST';
  try {
    const r = await fetch(url, {
      method: method,
      headers: { 'Authorization': 'Bearer ' + cfg.token, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    if (data.id) setGistConfig(cfg.token, data.id);
    showToast(t('Sync now') + ' ✓');
  } catch (e) {
    showToast('Sync failed: ' + e.message);
  }
}

async function pullFromCloud() {
  const cfg = getGistConfig();
  if (!cfg.token || !cfg.gistId) { showToast('Token + Gist ID required'); return; }
  try {
    const r = await fetch('https://api.github.com/gists/' + cfg.gistId, {
      headers: { 'Authorization': 'Bearer ' + cfg.token, 'Accept': 'application/vnd.github+json' }
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    const f = data.files['iprem_backup.json'];
    if (!f) throw new Error('No backup found');
    const payload = JSON.parse(f.content);
    if (payload.portals) localStorage.setItem('iprem_portals', JSON.stringify(payload.portals));
    if (payload.settings) localStorage.setItem('iprem_settings', JSON.stringify(payload.settings));
    if (payload.favorites_keys) Object.entries(payload.favorites_keys).forEach(function(kv) { localStorage.setItem(kv[0], JSON.stringify(kv[1])); });
    if (payload.recordings) localStorage.setItem('iprem_recordings', JSON.stringify(payload.recordings));
    if (payload.recommendations) localStorage.setItem('iprem_recos', JSON.stringify(payload.recommendations));
    if (payload.language) { setLang(payload.language); }
    showToast(t('Sync now') + ' ✓');
    setTimeout(function() { location.reload(); }, 800);
  } catch (e) {
    showToast('Pull failed: ' + e.message);
  }
}


// ========== Recordings (DVR catalog) ==========
const Recordings = {
  list: [],
  load: function() {
    try { this.list = JSON.parse(localStorage.getItem('iprem_recordings') || '[]'); } catch (e) { this.list = []; }
  },
  save: function() {
    localStorage.setItem('iprem_recordings', JSON.stringify(this.list));
  },
  add: function(channel) {
    if (!channel) return;
    const entry = {
      id: 'rec_' + Date.now(),
      name: channel.name || channel.stream_display_name || 'Unknown',
      channelId: channel.stream_id || channel.num,
      streamUrl: (AppState.api && channel.stream_id) ? AppState.api.liveUrl(channel.stream_id) : '',
      startedAt: new Date().toISOString(),
      durationSec: 0
    };
    this.list.unshift(entry);
    if (this.list.length > 200) this.list.length = 200;
    this.save();
    showToast(t('Recording saved'));
    return entry;
  },
  remove: function(id) {
    this.list = this.list.filter(function(r) { return r.id !== id; });
    this.save();
  }
};


// ========== Recommendations (top-watched + recent) ==========
const Recommendations = {
  counts: {},
  recent: [],
  load: function() {
    try {
      const d = JSON.parse(localStorage.getItem('iprem_recos') || '{}');
      this.counts = d.counts || {};
      this.recent = d.recent || [];
    } catch (e) { this.counts = {}; this.recent = []; }
  },
  save: function() {
    localStorage.setItem('iprem_recos', JSON.stringify({ counts: this.counts, recent: this.recent }));
  },
  recordPlay: function(channel) {
    if (!channel || !channel.stream_id) return;
    const id = String(channel.stream_id);
    this.counts[id] = (this.counts[id] || 0) + 1;
    // Recent: dedupe + cap 30
    this.recent = [id].concat(this.recent.filter(function(x) { return x !== id; })).slice(0, 30);
    this.save();
  },
  getTopChannels: function(allChannels, n) {
    n = n || 10;
    var scored = (allChannels || []).map(function(ch) {
      var id = String(ch.stream_id);
      var c = Recommendations.counts[id] || 0;
      var ri = Recommendations.recent.indexOf(id);
      var recencyBonus = ri >= 0 ? (30 - ri) * 0.3 : 0;
      return { ch: ch, score: c + recencyBonus };
    });
    scored.sort(function(a, b) { return b.score - a.score; });
    return scored.filter(function(s) { return s.score > 0; }).slice(0, n).map(function(s) { return s.ch; });
  }
};


// ========== Picture-in-Picture trigger ==========
function enterPictureInPicture() {
  try {
    if (window.AndroidBridge && typeof window.AndroidBridge.enterPip === 'function') {
      window.AndroidBridge.enterPip();
      return;
    }
    const v = document.getElementById('videoPlayer');
    if (v && document.pictureInPictureEnabled && !v.disablePictureInPicture) {
      v.requestPictureInPicture().catch(function(e) { showToast('PiP: ' + e.message); });
    } else {
      showToast('PiP not supported');
    }
  } catch (e) { showToast('PiP error: ' + e.message); }
}


// ========== Build extra Settings UI dynamically ==========
function buildFeatureSettings() {
  const layout = document.querySelector('#settings .settings-sections');
  if (!layout || document.getElementById('settingsFeatureExtras')) return;

  const div = document.createElement('div');
  div.id = 'settingsFeatureExtras';

  // Language
  var langOpts = Object.keys(I18N_DICT).map(function(k) {
    var label = { en:'English', fr:'Français', es:'Español', it:'Italiano', de:'Deutsch', nl:'Nederlands' }[k] || k;
    return '<option value="' + k + '"' + (k === CURRENT_LANG ? ' selected' : '') + '>' + label + '</option>';
  }).join('');

  const cfg = getGistConfig();

  div.innerHTML =
    '<div class="settings-section">' +
      '<h3 data-i18n="Language">Language</h3>' +
      '<div class="setting-row focusable" tabindex="0">' +
        '<span class="setting-label" data-i18n="Language">Language</span>' +
        '<select id="settingLang" class="setting-select">' + langOpts + '</select>' +
      '</div>' +
    '</div>' +
    '<div class="settings-section">' +
      '<h3 data-i18n="Auto Updates">Auto Updates</h3>' +
      '<div class="setting-row">' +
        '<span class="setting-label" data-i18n="Version">Version</span>' +
        '<span class="setting-value">v' + APP_VERSION + '</span>' +
      '</div>' +
      '<div class="setting-row">' +
        '<button class="btn btn-secondary focusable" id="btnCheckUpdate" tabindex="0" data-i18n="Check for updates">Check for updates</button>' +
      '</div>' +
    '</div>' +
    '<div class="settings-section">' +
      '<h3 data-i18n="Cloud Sync">Cloud Sync</h3>' +
      '<div class="setting-row focusable" tabindex="0">' +
        '<span class="setting-label">GitHub Token</span>' +
        '<input type="password" id="settingGistToken" class="setting-input" placeholder="ghp_..." value="' + (cfg.token ? '••••••••' : '') + '">' +
      '</div>' +
      '<div class="setting-row focusable" tabindex="0">' +
        '<span class="setting-label">Gist ID</span>' +
        '<input type="text" id="settingGistId" class="setting-input" placeholder="(auto on first push)" value="' + (cfg.gistId || '') + '">' +
      '</div>' +
      '<div class="setting-row">' +
        '<button class="btn btn-secondary focusable" id="btnPushCloud" tabindex="0" data-i18n="Push to cloud">Push to cloud</button>' +
        '<button class="btn btn-secondary focusable" id="btnPullCloud" tabindex="0" data-i18n="Pull from cloud">Pull from cloud</button>' +
      '</div>' +
    '</div>' +
    '<div class="settings-section">' +
      '<h3 data-i18n="Recordings">Recordings</h3>' +
      '<div class="setting-row">' +
        '<span class="setting-label">Saved</span>' +
        '<span class="setting-value" id="settingRecCount">0</span>' +
      '</div>' +
      '<div class="setting-row">' +
        '<button class="btn btn-secondary focusable" id="btnViewRecordings" tabindex="0" data-i18n="Recordings">Recordings</button>' +
      '</div>' +
    '</div>';

  // Insert before Data section (or at the end)
  layout.appendChild(div);

  // Wire up listeners
  document.getElementById('settingLang').addEventListener('change', function(e) {
    setLang(e.target.value);
    showToast(t('Language updated'));
  });
  document.getElementById('btnCheckUpdate').addEventListener('click', function() { checkForUpdates(false); });
  document.getElementById('btnPushCloud').addEventListener('click', function() {
    var tokInput = document.getElementById('settingGistToken');
    var idInput = document.getElementById('settingGistId');
    var tok = tokInput.value;
    if (tok && tok.indexOf('•') === -1) {
      setGistConfig(tok, idInput.value);
    }
    pushToCloud();
  });
  document.getElementById('btnPullCloud').addEventListener('click', function() {
    var tokInput = document.getElementById('settingGistToken');
    var idInput = document.getElementById('settingGistId');
    var tok = tokInput.value;
    if (tok && tok.indexOf('•') === -1) {
      setGistConfig(tok, idInput.value);
    }
    pullFromCloud();
  });
  document.getElementById('btnViewRecordings').addEventListener('click', function() {
    var n = Recordings.list.length;
    if (n === 0) { showToast('No recordings yet'); return; }
    var lines = Recordings.list.slice(0, 10).map(function(r) { return r.name + ' - ' + new Date(r.startedAt).toLocaleString(); });
    alert(t('Recordings') + ' (' + n + '):\n\n' + lines.join('\n'));
  });

  document.getElementById('settingRecCount').textContent = String(Recordings.list.length);
}


// ========== Inject minimal CSS for new elements ==========
function injectFeatureStyles() {
  if (document.getElementById('iprem-feature-styles')) return;
  var s = document.createElement('style');
  s.id = 'iprem-feature-styles';
  s.textContent =
    '.update-banner{position:fixed;top:0;left:0;right:0;z-index:9999;background:#1e40af;color:#fff;padding:10px 16px;display:flex;justify-content:center;align-items:center;gap:14px;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,.3)}' +
    '.update-banner a{background:#3b82f6;padding:6px 14px;border-radius:6px;color:#fff;text-decoration:none;font-weight:600}' +
    '#btnPlayerRecord svg{width:24px;height:24px}' +
    '#btnPlayerPip svg{width:22px;height:22px}' +
    '#settingsFeatureExtras .btn{margin-right:8px}';
  document.head.appendChild(s);
}


// ========== Bootstrap on DOMContentLoaded (after main app.js init) ==========
window.addEventListener('DOMContentLoaded', function() {
  injectFeatureStyles();
  // Load saved state
  Recordings.load();
  Recommendations.load();

  // Apply i18n now (covers static [data-i18n] markers in HTML)
  setTimeout(applyI18n, 50);

  // Build settings additions when entering settings screen
  var originalShowScreen = window.showScreen;
  if (typeof window.showScreen === 'function') {
    window.showScreen = function(id) {
      var r = originalShowScreen.apply(this, arguments);
      if (id === 'settings') {
        setTimeout(function() { buildFeatureSettings(); applyI18n(); }, 50);
      }
      return r;
    };
  }

  // Update banner
  var ub = document.createElement('div');
  ub.id = 'updateBanner';
  ub.className = 'update-banner';
  ub.style.display = 'none';
  document.body.appendChild(ub);

  // Check updates silently after 2s
  setTimeout(function() { checkForUpdates(true); }, 2000);

  // Add Record button to player overlay
  setTimeout(function() {
    var ctrls = document.querySelector('.player-controls');
    if (ctrls && !document.getElementById('btnPlayerRecord')) {
      var b = document.createElement('button');
      b.className = 'player-btn focusable';
      b.id = 'btnPlayerRecord';
      b.tabIndex = 0;
      b.title = t('Record');
      b.innerHTML = '<svg viewBox="0 0 24 24" fill="#ef4444"><circle cx="12" cy="12" r="7"/></svg>';
      b.addEventListener('click', function() {
        Recordings.add(AppState.selectedChannel);
      });
      ctrls.appendChild(b);

      var p = document.createElement('button');
      p.className = 'player-btn focusable';
      p.id = 'btnPlayerPip';
      p.tabIndex = 0;
      p.title = t('Picture in Picture');
      p.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V4.98C23 3.88 22.1 3 21 3zm0 16.01H3V4.98h18v14.03z"/></svg>';
      p.addEventListener('click', enterPictureInPicture);
      ctrls.appendChild(p);
    }
  }, 500);

  // Hook into playChannel to record recommendations
  setTimeout(function() {
    if (typeof window.playChannel === 'function') {
      var orig = window.playChannel;
      window.playChannel = function(channel) {
        try { Recommendations.recordPlay(channel); } catch (e) {}
        return orig.apply(this, arguments);
      };
    }
  }, 200);

  // Encrypt-on-save hook: re-encrypt stored portals once at startup if not encrypted yet
  setTimeout(async function() {
    try {
      var raw = localStorage.getItem('iprem_portals');
      if (!raw) return;
      var portals = JSON.parse(raw);
      var changed = false;
      for (var i = 0; i < portals.length; i++) {
        var p = portals[i];
        if (p.password && !String(p.password).startsWith('enc:')) {
          p.password = await encryptString(p.password);
          changed = true;
        }
      }
      if (changed) {
        localStorage.setItem('iprem_portals', JSON.stringify(portals));
        console.log('[iprem] credentials encrypted at rest');
      }
    } catch (e) { /* ignore */ }
  }, 1500);

  // Decrypt portals before use: monkey-patch loadPortals to decrypt
  setTimeout(function() {
    if (typeof window.loadPortals === 'function') {
      var orig = window.loadPortals;
      window.loadPortals = async function() {
        orig.apply(this, arguments);
        if (AppState && AppState.portals) {
          for (var i = 0; i < AppState.portals.length; i++) {
            var p = AppState.portals[i];
            if (p.password && String(p.password).startsWith('enc:')) {
              try { p.password = await decryptString(p.password); } catch (e) {}
            }
          }
        }
      };
      // Trigger initial re-load to ensure decryption
      try { window.loadPortals(); } catch (e) {}
    }
  }, 1800);
});
