/* =========================================================
 *  Maison·Lumière — contrôle à distance
 *  Adaptateurs : IR universel · Bluetooth Classic · BLE · Wi-Fi · Zigbee · RF
 *  Codecs      : tous (AV1, HEVC, Dolby Vision, Atmos, FLAC, LDAC...)
 * ========================================================= */

/* ---------- Logger ---------- */
const logEl = document.getElementById("log");
function log(msg, kind = "info") {
  const time = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const li = document.createElement("li");
  li.classList.add("new");
  li.innerHTML = `<span class="log-time">${time}</span><span class="log-msg">${msg}</span>`;
  if (logEl.firstChild && logEl.firstChild.querySelector(".log-msg")?.textContent.startsWith("En attente")) {
    logEl.innerHTML = "";
  }
  logEl.prepend(li);
  while (logEl.children.length > 30) logEl.lastChild.remove();
}

/* ---------- Horloge ---------- */
const clockEl = document.getElementById("clock");
const dateEl  = document.getElementById("date");
function updateClock() {
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  dateEl.textContent  = now.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}
updateClock();
setInterval(updateClock, 30_000);

/* ---------- Réseau (Wi-Fi / Ethernet) ---------- */
const netPill  = document.getElementById("net-pill");
const netIcon  = document.getElementById("net-icon");
const netLabel = document.getElementById("net-label");
const netSub   = document.getElementById("net-sub");

const NETWORKS = [
  { mode: "wifi",     label: "Wi-Fi 6E",   sub: "Livebox · 920 Mb/s", color: "#86efac",
    svg: '<path d="M2 8.5a16 16 0 0 1 20 0"/><path d="M5 12a11 11 0 0 1 14 0"/><path d="M8.5 15.5a6 6 0 0 1 7 0"/><circle cx="12" cy="19" r="1.2" fill="currentColor" stroke="none"/>' },
  { mode: "ethernet", label: "Ethernet",   sub: "Câble · 1 Gb/s",      color: "#7dd3fc",
    svg: '<rect x="4" y="3" width="16" height="11" rx="2"/><path d="M8 14v3M12 14v3M16 14v3"/><rect x="7" y="17" width="10" height="4" rx="1"/>' },
  { mode: "5g",       label: "5G",         sub: "Free · -67 dBm",      color: "#fcd34d",
    svg: '<path d="M2 18l4-12 4 12M3 14h6"/><path d="M14 6h7M18 6v6h-4v6h7"/>' },
];
let netIndex = 0;
function renderNet() {
  const n = NETWORKS[netIndex];
  netLabel.textContent = n.label;
  netSub.textContent   = n.sub;
  netIcon.style.color  = n.color;
  netIcon.innerHTML    = n.svg;
}
netPill.style.cursor = "pointer";
netPill.title = "Cliquer pour changer de connexion";
netPill.addEventListener("click", () => {
  netIndex = (netIndex + 1) % NETWORKS.length;
  renderNet();
  log(`Connexion : ${NETWORKS[netIndex].label} (${NETWORKS[netIndex].sub}).`);
});
renderNet();

/* ---------- Météo ---------- */
const WEATHERS = [
  { temp: 21, cond: "Ensoleillé",    icon: "sun",   hum: 48, wind: 12, color: "#fcd34d" },
  { temp: 18, cond: "Nuageux",        icon: "cloud", hum: 62, wind: 18, color: "#cbd5e1" },
  { temp: 14, cond: "Pluie légère",   icon: "rain",  hum: 81, wind: 22, color: "#7dd3fc" },
  { temp: 26, cond: "Dégagé",         icon: "sun",   hum: 35, wind: 6,  color: "#fb923c" },
  { temp: 3,  cond: "Neige",          icon: "snow",  hum: 90, wind: 9,  color: "#e0e7ff" },
  { temp: 23, cond: "Orage",          icon: "storm", hum: 75, wind: 35, color: "#a78bfa" },
];
const WEATHER_ICONS = {
  sun:   '<circle cx="12" cy="12" r="4" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v2"/><path d="M12 19v2"/><path d="M3 12h2"/><path d="M19 12h2"/><path d="M5.6 5.6l1.4 1.4"/><path d="M17 17l1.4 1.4"/><path d="M5.6 18.4L7 17"/><path d="M17 7l1.4-1.4"/></g>',
  cloud: '<path d="M7 18a4 4 0 0 1 .5-7.97 6 6 0 0 1 11.5 1.97A3.5 3.5 0 0 1 18 18H7z" fill="currentColor"/>',
  rain:  '<path d="M7 14a4 4 0 0 1 .5-7.97 6 6 0 0 1 11.5 1.97A3.5 3.5 0 0 1 18 14H7z" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 17l-1 3"/><path d="M12 17l-1 3"/><path d="M16 17l-1 3"/></g>',
  snow:  '<path d="M7 14a4 4 0 0 1 .5-7.97 6 6 0 0 1 11.5 1.97A3.5 3.5 0 0 1 18 14H7z" fill="currentColor"/><g fill="currentColor"><circle cx="8" cy="19" r="1"/><circle cx="12" cy="20" r="1"/><circle cx="16" cy="19" r="1"/></g>',
  storm: '<path d="M7 13a4 4 0 0 1 .5-7.97 6 6 0 0 1 11.5 1.97A3.5 3.5 0 0 1 18 13H7z" fill="currentColor"/><path d="M11 14l-2 4h3l-1 4 4-6h-3l2-2h-3z" fill="#fcd34d" stroke="none"/>',
};
const weatherIconEl = document.getElementById("weather-icon");
function setWeather(w) {
  document.getElementById("weather-temp").textContent = w.temp + "°";
  document.getElementById("weather-cond").textContent = w.cond;
  document.getElementById("weather-hum").textContent  = `💧 ${w.hum}%`;
  document.getElementById("weather-wind").textContent = `🌬 ${w.wind} km/h`;
  weatherIconEl.innerHTML = `<svg viewBox="0 0 24 24" style="color:${w.color}">${WEATHER_ICONS[w.icon]}</svg>`;
}
let weatherIdx = 0;
setWeather(WEATHERS[0]);
document.getElementById("weather-pill").style.cursor = "pointer";
document.getElementById("weather-pill").title = "Cliquer pour changer la météo";
document.getElementById("weather-pill").addEventListener("click", () => {
  weatherIdx = (weatherIdx + 1) % WEATHERS.length;
  setWeather(WEATHERS[weatherIdx]);
});
setInterval(() => {
  weatherIdx = (weatherIdx + 1) % WEATHERS.length;
  setWeather(WEATHERS[weatherIdx]);
}, 25_000);

/* =========================================================
 *  Adaptateurs de transport — abstraction multi-protocole
 * ========================================================= */
class Adapter {
  constructor(name) { this.name = name; this.ready = false; }
  async init() { this.ready = true; }
  async send(_payload) { throw new Error("not implemented"); }
}

class IRAdapter extends Adapter {
  constructor() { super("IR universel"); this.protocols = ["NEC", "RC5", "RC6", "SIRC", "Samsung", "Panasonic", "JVC", "Sharp", "Denon"]; this.freq = 38_000; }
  async send({ device, command, raw }) {
    log(`IR → ${device} : « ${command} » (${this.protocols[0]} @ ${this.freq} Hz)`);
    return { ok: true, raw: raw ?? this._encode(command) };
  }
  _encode(cmd) {
    const seed = [...cmd].reduce((a, c) => a + c.charCodeAt(0), 0);
    return Array.from({ length: 32 }, (_, i) => ((seed >> (i % 8)) & 1) ? 560 : -1690);
  }
}

class BTClassicAdapter extends Adapter {
  constructor() { super("Bluetooth Classic (BT1)"); this.profiles = ["HID", "SPP", "AVRCP", "A2DP"]; this.version = "2.1+EDR / 3.0 / 4.0"; }
  async send({ device, command }) {
    log(`BT1 → ${device} : « ${command} » (profil HID)`);
    return { ok: true };
  }
}

class BLEAdapter extends Adapter {
  constructor() { super("Bluetooth LE (BT2)"); this.profiles = ["HOGP", "GATT custom", "LE Audio"]; this.version = "4.0 → 5.4"; }
  async send({ device, command }) {
    log(`BLE → ${device} : « ${command} » (GATT)`);
    return { ok: true };
  }
  async scan() {
    if (!("bluetooth" in navigator)) {
      log("Web Bluetooth indisponible sur ce navigateur — scan simulé.");
      return [];
    }
    try {
      const dev = await navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: ["device_information"] });
      log(`BLE découvert : ${dev.name || "appareil"}`);
      return [dev];
    } catch { return []; }
  }
}

class WiFiAdapter extends Adapter {
  constructor() { super("Wi-Fi / MQTT"); this.broker = "mqtt://hub.local:8883"; }
  async send({ device, command }) {
    log(`MQTT → ${device}/cmd : « ${command} »`);
    return { ok: true };
  }
}

class ZigbeeAdapter extends Adapter {
  constructor() { super("Zigbee 3.0"); this.channel = 15; }
  async send({ device, command }) {
    log(`Zigbee[ch${this.channel}] → ${device} : « ${command} »`);
    return { ok: true };
  }
}

class RFAdapter extends Adapter {
  constructor() { super("RF 433/868 MHz"); this.frequencies = [433.92, 868.35]; }
  async send({ device, command, frequency = 433.92 }) {
    log(`RF ${frequency} MHz → ${device} : « ${command} »`);
    return { ok: true };
  }
}

/* ---------- Hub : routeur entre appareils et adaptateurs ---------- */
class RemoteHub {
  constructor() {
    this.adapters = {
      ir:     new IRAdapter(),
      bt1:    new BTClassicAdapter(),
      bt2:    new BLEAdapter(),
      wifi:   new WiFiAdapter(),
      zigbee: new ZigbeeAdapter(),
      rf:     new RFAdapter(),
    };
    this.devices = new Map();
  }
  async init() { for (const a of Object.values(this.adapters)) await a.init(); }
  registerDevice(id, { name, transport, ...rest }) { this.devices.set(id, { name, transport, ...rest }); }
  async command(deviceId, command, opts = {}) {
    const d = this.devices.get(deviceId);
    if (!d) return { ok: false, error: "appareil inconnu" };
    const adapter = this.adapters[d.transport];
    if (!adapter) return { ok: false, error: `transport ${d.transport} indisponible` };
    return adapter.send({ device: d.name, command, ...opts });
  }
}

const hub = new RemoteHub();
hub.init();

hub.registerDevice("tv-salon",      { name: "Samsung QLED 65\"",   transport: "ir" });
hub.registerDevice("appletv",        { name: "Apple TV Remote",     transport: "bt2" });
hub.registerDevice("portail",        { name: "Portail Somfy",       transport: "rf", frequency: 433.92 });
hub.registerDevice("sonos",          { name: "Sonos Beam",          transport: "wifi" });
hub.registerDevice("ampli",          { name: "Denon AVR-X4800H",    transport: "ir" });
hub.registerDevice("clavier-bt",     { name: "Logitech K380",       transport: "bt1" });
hub.registerDevice("lampe-salon",    { name: "Philips Hue salon",   transport: "zigbee" });

/* =========================================================
 *  Moteur média — tous les codecs
 * ========================================================= */
const MEDIA_ENGINE = {
  video:     ["AV1", "HEVC / H.265", "VVC / H.266", "H.264 / AVC", "VP9", "VP8", "MPEG-2", "ProRes"],
  hdr:       ["Dolby Vision", "HDR10+", "HDR10", "HLG", "Rec. 2020", "DCI-P3", "10-bit · 12-bit"],
  surround:  ["Dolby Atmos", "DTS:X", "Dolby TrueHD", "DTS-HD MA", "Dolby Digital+", "DTS", "Auro-3D"],
  lossless:  ["FLAC", "ALAC", "WavPack", "DSD (SACD)", "PCM 192/24", "APE"],
  lossy:     ["Opus", "AAC / xHE-AAC", "MP3", "Vorbis", "WMA"],
  bluetooth: ["LDAC", "aptX Adaptive", "aptX Lossless", "aptX HD", "aptX", "LC3 / LE Audio", "SBC"],
  container: ["MKV", "MP4 / MOV", "WebM", "TS / M2TS", "AVI", "FLV"],
  streaming: ["HLS", "MPEG-DASH", "RTSP / RTP", "SRT", "WebRTC", "AirPlay 2", "Chromecast"],
};
const codecCount = Object.values(MEDIA_ENGINE).reduce((a, l) => a + l.length, 0);
document.getElementById("codec-count").textContent = codecCount;

/* =========================================================
 *  Portail
 * ========================================================= */
const gateStage = document.querySelector(".gate-stage");
const gateBadge = document.getElementById("gate-badge");
const lastAccess = document.getElementById("last-access");
let gateState = "closed";
let gateTimer = null;

function setGateState(s) {
  gateState = s;
  gateStage.classList.remove("opening", "open", "closing");
  const map = { opening: "Ouverture…", open: "Ouvert", closing: "Fermeture…", closed: "Fermé" };
  gateBadge.textContent = map[s];
  gateBadge.style.background = s === "open" ? "rgba(74,222,128,.12)"
                              : s === "closed" ? "rgba(239,68,68,.12)"
                              : "rgba(251,191,36,.12)";
  gateBadge.style.color = s === "open" ? "#86efac"
                        : s === "closed" ? "#fca5a5"
                        : "#fcd34d";
  gateBadge.style.borderColor = s === "open" ? "rgba(74,222,128,.25)"
                              : s === "closed" ? "rgba(239,68,68,.25)"
                              : "rgba(251,191,36,.25)";
  if (s === "opening" || s === "open") gateStage.classList.add(s === "open" ? "open" : "opening");
  if (s === "closing") gateStage.classList.add("opening"); // doors rotated open during closing animation reset
}

document.querySelectorAll(".gate-btn").forEach(btn => {
  btn.addEventListener("click", async () => {
    const action = btn.dataset.action;
    clearTimeout(gateTimer);
    if (action === "open") {
      if (gateState === "open") return log("Portail déjà ouvert.");
      setGateState("opening");
      await hub.command("portail", "OPEN");
      gateTimer = setTimeout(() => {
        setGateState("open");
        lastAccess.textContent = "à l'instant";
        log("Portail ouvert.", "ok");
      }, 1300);
    } else if (action === "close") {
      if (gateState === "closed") return log("Portail déjà fermé.");
      gateStage.classList.remove("open");
      setGateState("closing");
      await hub.command("portail", "CLOSE");
      gateTimer = setTimeout(() => {
        setGateState("closed");
        log("Portail fermé.");
      }, 1300);
    } else if (action === "stop") {
      clearTimeout(gateTimer);
      await hub.command("portail", "STOP");
      log("Portail arrêté.");
    }
  });
});

setGateState("closed");

/* =========================================================
 *  Télécommande TV
 * ========================================================= */
let tvOn = false;
let muted = false;
let volume = 42;
let channel = 12;

const powerBtn = document.getElementById("power-btn");
const muteBtn = document.getElementById("mute-btn");
const volFill = document.getElementById("vol-fill");
const volVal = document.getElementById("vol-val");
const channelEl = document.getElementById("channel-val");
const tvState = document.getElementById("tv-state");

function renderTV() {
  powerBtn.classList.toggle("on", tvOn);
  muteBtn.classList.toggle("active", muted);
  volFill.style.width = volume + "%";
  volVal.textContent = muted ? "M" : volume;
  channelEl.textContent = channel;
  tvState.textContent = tvOn ? `Allumée · Ch.${channel}` : "En veille";
  tvState.style.color = tvOn ? "#86efac" : "";
}

powerBtn.addEventListener("click", async () => {
  tvOn = !tvOn;
  await hub.command("tv-salon", tvOn ? "POWER_ON" : "POWER_OFF");
  log(`TV ${tvOn ? "allumée" : "mise en veille"}.`);
  renderTV();
});

muteBtn.addEventListener("click", async () => {
  muted = !muted;
  await hub.command("tv-salon", muted ? "MUTE" : "UNMUTE");
  log(muted ? "Muet activé." : "Muet désactivé.");
  renderTV();
});

document.querySelectorAll("[data-vol]").forEach(b => {
  b.addEventListener("click", async () => {
    const delta = +b.dataset.vol;
    volume = Math.max(0, Math.min(100, volume + delta * 4));
    muted = false;
    await hub.command("tv-salon", delta > 0 ? "VOL_UP" : "VOL_DOWN");
    renderTV();
  });
});

document.querySelectorAll("[data-ch]").forEach(b => {
  b.addEventListener("click", async () => {
    const delta = +b.dataset.ch;
    channel = Math.max(1, channel + delta);
    if (tvOn) await hub.command("tv-salon", delta > 0 ? "CH_UP" : "CH_DOWN");
    log(`Chaîne : ${channel}`);
    renderTV();
  });
});

document.querySelectorAll("[data-dir]").forEach(b => {
  b.addEventListener("click", () => hub.command("tv-salon", `NAV_${b.dataset.dir.toUpperCase()}`));
});
document.getElementById("ok-btn").addEventListener("click", () => hub.command("tv-salon", "OK"));

document.querySelectorAll(".numpad button").forEach(b => {
  b.addEventListener("click", () => {
    const t = b.textContent.trim();
    if (/^\d$/.test(t)) {
      channel = Math.max(1, parseInt(t, 10));
      if (tvOn) hub.command("tv-salon", `NUM_${t}`);
      renderTV();
    }
  });
});

renderTV();

/* =========================================================
 *  Scènes
 * ========================================================= */
const scenes = {
  morning: () => { setLight("salon", true, 70, "chaud"); setLight("cuisine", true, 100, "froid"); setLight("chambre", false); log("Scène : Matin"); },
  cinema:  () => { setLight("salon", true, 18, "chaud"); setLight("cuisine", false); setLight("chambre", false); log("Scène : Cinéma"); },
  dinner:  () => { setLight("salon", true, 40, "chaud"); setLight("cuisine", true, 60, "chaud"); setLight("chambre", false); log("Scène : Dîner"); },
  away:    () => { setLight("salon", false); setLight("cuisine", false); setLight("chambre", false); log("Scène : Absent — alarme armée"); },
};
document.querySelectorAll(".scene").forEach(b => {
  b.addEventListener("click", () => {
    document.querySelectorAll(".scene").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    scenes[b.dataset.scene]?.();
  });
});

/* =========================================================
 *  Lumières
 * ========================================================= */
function setLight(room, on, pct = 80, temp = "chaud") {
  const el = document.querySelector(`.light[data-room="${room}"]`);
  if (!el) return;
  const sw = el.querySelector("input");
  const bulb = el.querySelector(".light-bulb");
  sw.checked = on;
  bulb.classList.toggle("off", !on);
  el.querySelector(".light-pct").textContent = on ? pct : 0;
  el.querySelector(".light-detail").innerHTML =
    `<span class="light-pct">${on ? pct : 0}</span>% — ${on ? temp : "éteint"}`;
}
document.querySelectorAll(".light").forEach(el => {
  el.querySelector("input").addEventListener("change", e => {
    const room = el.dataset.room;
    const on = e.target.checked;
    el.querySelector(".light-bulb").classList.toggle("off", !on);
    log(`Lumière ${room} ${on ? "allumée" : "éteinte"}.`);
  });
});

/* =========================================================
 *  Compatibilité / appairage
 * ========================================================= */
document.querySelectorAll(".proto").forEach(p => {
  p.addEventListener("click", () => {
    const wasActive = p.classList.contains("active");
    p.classList.toggle("active");
    const proto = p.dataset.proto;
    const name = p.querySelector(".proto-name").textContent;
    p.querySelector(".proto-state").textContent = wasActive ? "Veille" : "Prêt";
    log(`Adaptateur ${name} ${wasActive ? "désactivé" : "activé"}.`);
  });
});

document.getElementById("scan-btn").addEventListener("click", async () => {
  log("Scan multi-protocoles lancé…");
  const active = [...document.querySelectorAll(".proto.active")].map(p => p.dataset.proto);
  for (const proto of active) {
    await new Promise(r => setTimeout(r, 350 + Math.random() * 500));
    const name = document.querySelector(`.proto[data-proto="${proto}"] .proto-name`).textContent;
    log(`✓ ${name} — appareils détectés.`);
  }
  if (active.includes("bt2") && "bluetooth" in navigator) {
    log("Web Bluetooth disponible — scan BLE réel possible.");
  }
  log("Scan terminé.");
});

/* =========================================================
 *  Launcher Android 14 — Applications
 * ========================================================= */
const APP_CATALOG = {
  ipremium:    { name: "iPremium TvOnline", desc: "IPTV premium · 12 000 chaînes · VOD 4K", version: "v4.2.1" },
  anydesk:     { name: "AnyDesk",            desc: "Contrôle à distance · faible latence", version: "v7.1.13" },
  youtube:     { name: "YouTube",            desc: "Vidéos · musique · live · 4K HDR", version: "v18.45.43" },
  remote:      { name: "Remote Controller",  desc: "Télécommande universelle (IR · BT · Wi-Fi)", version: "v3.8.0" },
  netflix:     { name: "Netflix",            desc: "Streaming · Dolby Vision · Atmos", version: "v9.1.0" },
  prime:       { name: "Prime Video",        desc: "Streaming · HDR10+ · 4K", version: "v3.0.380" },
  disney:      { name: "Disney+",            desc: "Streaming · IMAX Enhanced", version: "v3.1.1" },
  spotify:     { name: "Spotify",            desc: "Musique · podcasts · LDAC", version: "v8.9.2" },
  chrome:      { name: "Chrome",             desc: "Navigateur web · sync compte", version: "v120.0" },
  filebrowser: { name: "FileBrowser",        desc: "Stockage interne · USB · carte SD · NAS SMB / NFS", version: "v2.7.0" },
  playstore:   { name: "Google Play Store",  desc: "Catalogue Android · mises à jour automatiques", version: "v38.6" },
  kodi:        { name: "Kodi",               desc: "Centre média · tous codecs · plugins", version: "v21 Omega" },
};

document.querySelectorAll(".app").forEach(btn => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.app;
    const meta = APP_CATALOG[id];
    if (!meta) return;
    btn.style.transform = "scale(.92)";
    setTimeout(() => btn.style.transform = "", 150);
    openPanel(`${meta.name} — ${meta.version}`, panelBodyForApp(id, meta));
    log(`Lancement : ${meta.name}`);
  });
});

function panelBodyForApp(id, meta) {
  const body = document.createElement("div");
  body.innerHTML = `
    <div class="row"><span>Description</span><b>${meta.desc}</b></div>
    <div class="row"><span>Version</span><b>${meta.version}</b></div>
    <div class="row"><span>Compatibilité</span><b>Android 14 · ARM64</b></div>
  `;
  if (id === "filebrowser") {
    body.innerHTML += `
      <div class="row"><span>Stockage interne</span><b>52,4 / 128 Go</b></div>
      <div class="bar"><span style="width:41%"></span></div>
      <div class="row"><span>Clé USB</span><b>16,1 / 64 Go</b></div>
      <div class="bar"><span style="width:25%"></span></div>
      <div class="row"><span>Carte SD</span><b>Non insérée</b></div>
      <div class="row"><span>NAS SMB</span><b>connecté · 4 To</b></div>
      <button class="panel-btn">Ouvrir l'explorateur</button>
    `;
  } else if (id === "playstore") {
    body.innerHTML += `
      <div class="row"><span>Mises à jour disponibles</span><b>3 applications</b></div>
      <div class="row"><span>Téléchargements actifs</span><b>0</b></div>
      <button class="panel-btn">Mettre à jour tout</button>
    `;
  } else if (id === "anydesk") {
    body.innerHTML += `
      <div class="row"><span>ID AnyDesk</span><b>847 263 195</b></div>
      <div class="row"><span>Statut</span><b style="color:#86efac">En ligne</b></div>
      <button class="panel-btn">Démarrer une session</button>
    `;
  } else {
    body.innerHTML += `<button class="panel-btn">Ouvrir l'application</button>`;
  }
  return body;
}

/* =========================================================
 *  Outils système Android 14
 * ========================================================= */
const panelEl = document.getElementById("tool-panel");
const panelTitle = document.getElementById("panel-title");
const panelBody = document.getElementById("panel-body");
const SYSTEM = {
  os: "Android 14",
  build: "UP1A.231005.007",
  oneui: "One UI 6.0",
  chipset: "ARM Cortex-A78 octa-core @ 2,4 GHz",
  gpu: "Mali-G610 MC4",
  ram: { total: 8192, used: 3277 },
  storage: { total: 131072, used: 53657 },
  battery: 87,
  resolution: "3840×2160 · HDR10+",
  network: "Wi-Fi 6E · 5G",
  ipAddress: "192.168.1.42",
  mac: "F4:5C:89:2A:1D:EE",
};

function openPanel(title, contentEl) {
  panelTitle.textContent = title;
  panelBody.innerHTML = "";
  panelBody.appendChild(contentEl);
  panelEl.hidden = false;
}
document.getElementById("panel-close").addEventListener("click", () => panelEl.hidden = true);

document.querySelectorAll(".tool").forEach(t => {
  t.addEventListener("click", () => {
    const tool = t.dataset.tool;
    const handlers = {
      settings: showSystemSettings,
      launcher: showLauncherSettings,
      update:   showSoftwareUpdate,
      hotkeys:  showHotkeys,
      sysinfo:  showSystemInfo,
      clean:    showMemoryClean,
    };
    handlers[tool]?.();
  });
});

function makeBody(html) { const d = document.createElement("div"); d.innerHTML = html; return d; }

function showSystemSettings() {
  openPanel("Paramètres système", makeBody(`
    <div class="row"><span>Réseau</span><b>${SYSTEM.network}</b></div>
    <div class="row"><span>Adresse IP</span><b>${SYSTEM.ipAddress}</b></div>
    <div class="row"><span>Bluetooth</span><b style="color:#86efac">Activé</b></div>
    <div class="row"><span>Affichage</span><b>${SYSTEM.resolution}</b></div>
    <div class="row"><span>Sons</span><b>Dolby Atmos · 7.1.4</b></div>
    <div class="row"><span>Sécurité</span><b>Knox · 2FA · empreinte</b></div>
    <div class="row"><span>Comptes</span><b>3 connectés</b></div>
    <div class="row"><span>Langue</span><b>Français (France)</b></div>
  `));
  log("Ouvert : Paramètres système.");
}

function showLauncherSettings() {
  openPanel("Paramètres du lanceur", makeBody(`
    <div class="row"><span>Grille</span><b>4 × 3 (large)</b></div>
    <div class="row"><span>Thème dynamique</span><b style="color:#86efac">Activé (Material You)</b></div>
    <div class="row"><span>Mode sombre</span><b style="color:#86efac">Activé</b></div>
    <div class="row"><span>Fond d'écran</span><b>Dégradé adaptatif</b></div>
    <div class="row"><span>Animation</span><b>Standard (1,0×)</b></div>
    <div class="row"><span>Géolocalisation icônes</span><b>Désactivée</b></div>
    <button class="panel-btn">Personnaliser</button>
    <button class="panel-btn ghost">Réinitialiser</button>
  `));
  log("Ouvert : Paramètres du lanceur.");
}

function showSoftwareUpdate() {
  const body = makeBody(`
    <div class="row"><span>Version actuelle</span><b>${SYSTEM.os}</b></div>
    <div class="row"><span>Build</span><b>${SYSTEM.build}</b></div>
    <div class="row"><span>Surcouche</span><b>${SYSTEM.oneui}</b></div>
    <div class="row"><span>Patch sécurité</span><b>1ᵉʳ mai 2026</b></div>
    <div class="row"><span>Statut</span><b style="color:#86efac">Système à jour</b></div>
    <button class="panel-btn" id="check-update">Vérifier les mises à jour</button>
  `);
  openPanel("Mise à jour du logiciel", body);
  body.querySelector("#check-update").addEventListener("click", async e => {
    const btn = e.target;
    btn.textContent = "Recherche…";
    btn.disabled = true;
    await new Promise(r => setTimeout(r, 1400));
    btn.textContent = "Système à jour ✓";
    log("Vérification des mises à jour : aucune disponible.");
  });
}

function showHotkeys() {
  openPanel("Raccourcis & macros", makeBody(`
    <div class="row"><span>Appui long bouton OK</span><b>Capture d'écran</b></div>
    <div class="row"><span>Appui long Power</span><b>Assistant Google</b></div>
    <div class="row"><span>Double appui Power</span><b>Caméra</b></div>
    <div class="row"><span>Triple ▼ volume</span><b>SOS</b></div>
    <div class="row"><span>Geste 3 doigts</span><b>Partager l'écran</b></div>
    <div class="row"><span>Macro « Cinéma »</span><b>TV ON → HDMI 2 → lumières -80%</b></div>
    <button class="panel-btn">Ajouter un raccourci</button>
  `));
  log("Ouvert : Raccourcis.");
}

function showSystemInfo() {
  const ramPct = Math.round((SYSTEM.ram.used / SYSTEM.ram.total) * 100);
  const stoPct = Math.round((SYSTEM.storage.used / SYSTEM.storage.total) * 100);
  openPanel("Informations système", makeBody(`
    <div class="row"><span>Système</span><b>${SYSTEM.os} · ${SYSTEM.oneui}</b></div>
    <div class="row"><span>Build</span><b>${SYSTEM.build}</b></div>
    <div class="row"><span>Processeur</span><b>${SYSTEM.chipset}</b></div>
    <div class="row"><span>GPU</span><b>${SYSTEM.gpu}</b></div>
    <div class="row"><span>Mémoire vive</span><b>${(SYSTEM.ram.used/1024).toFixed(1)} / ${(SYSTEM.ram.total/1024).toFixed(0)} Go (${ramPct}%)</b></div>
    <div class="bar"><span style="width:${ramPct}%"></span></div>
    <div class="row"><span>Stockage</span><b>${(SYSTEM.storage.used/1024).toFixed(1)} / ${(SYSTEM.storage.total/1024).toFixed(0)} Go (${stoPct}%)</b></div>
    <div class="bar"><span style="width:${stoPct}%"></span></div>
    <div class="row"><span>Batterie</span><b>${SYSTEM.battery}%</b></div>
    <div class="row"><span>Adresse MAC</span><b>${SYSTEM.mac}</b></div>
    <div class="row"><span>Résolution</span><b>${SYSTEM.resolution}</b></div>
  `));
  log("Ouvert : Informations système.");
}

function showMemoryClean() {
  const body = makeBody(`
    <div class="row"><span>RAM utilisée</span><b id="ram-line">${(SYSTEM.ram.used/1024).toFixed(1)} / 8,0 Go</b></div>
    <div class="bar"><span id="ram-bar" style="width:${Math.round(SYSTEM.ram.used/SYSTEM.ram.total*100)}%"></span></div>
    <div class="row"><span>Cache applications</span><b id="cache-line">1,7 Go</b></div>
    <div class="row"><span>Fichiers temporaires</span><b id="tmp-line">420 Mo</b></div>
    <div class="row"><span>Apps en arrière-plan</span><b id="bg-line">14</b></div>
    <button class="panel-btn" id="do-clean">🧹 Nettoyer maintenant</button>
  `);
  openPanel("Nettoyage mémoire", body);
  body.querySelector("#do-clean").addEventListener("click", async e => {
    const btn = e.target;
    btn.disabled = true;
    btn.textContent = "Nettoyage en cours…";
    log("Nettoyage mémoire lancé…");
    await new Promise(r => setTimeout(r, 1600));
    SYSTEM.ram.used = 1843;
    const pct = Math.round(SYSTEM.ram.used / SYSTEM.ram.total * 100);
    body.querySelector("#ram-line").textContent = `${(SYSTEM.ram.used/1024).toFixed(1)} / 8,0 Go`;
    body.querySelector("#ram-bar").style.width = pct + "%";
    body.querySelector("#cache-line").textContent = "0 Mo";
    body.querySelector("#tmp-line").textContent = "0 Mo";
    body.querySelector("#bg-line").textContent = "3";
    document.getElementById("clean-desc").textContent = `RAM ${(SYSTEM.ram.used/1024).toFixed(1)} / 8 Go utilisés`;
    btn.textContent = "✓ Libéré 1,4 Go";
    log("Nettoyage terminé — 1,4 Go libérés.", "ok");
  });
}

/* =========================================================
 *  Démarrage
 * ========================================================= */
log("Hub démarré — 6 adaptateurs initialisés.");
log(`Moteur média prêt : ${codecCount} codecs (AV1, HEVC, Dolby Vision, Atmos, FLAC, LDAC…).`);
log("Système : Android 14 · One UI 6.0 · build UP1A.231005.007.");
