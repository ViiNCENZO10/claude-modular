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
 *  Chaînes, groupes & favoris
 * ========================================================= */
const FAV_GROUP_ID = "__fav";
const STORAGE_KEY = "ml.channels.v1";

const DEFAULT_STATE = {
  groups: [
    { id: "g1", name: "Sport",         color: "#22c55e" },
    { id: "g2", name: "Films",         color: "#a855f7" },
    { id: "g3", name: "Séries",        color: "#f59e0b" },
    { id: "g4", name: "Information",   color: "#0ea5e9" },
    { id: "g5", name: "Enfants",       color: "#ec4899" },
    { id: "g6", name: "Documentaire",  color: "#14b8a6" },
  ],
  channels: [
    { id: "c1",  name: "beIN Sports 1",      number: 41,  groupId: "g1", logo: "BS1", url: "iptv://bein/1",    fav: true,  catchup: true,  catchupDays: 15 },
    { id: "c2",  name: "beIN Sports 2",      number: 42,  groupId: "g1", logo: "BS2", url: "iptv://bein/2",    fav: false, catchup: true,  catchupDays: 15 },
    { id: "c3",  name: "Eurosport 1",        number: 43,  groupId: "g1", logo: "ES",  url: "iptv://eurosport", fav: false, catchup: true,  catchupDays: 7  },
    { id: "c4",  name: "RMC Sport 1",        number: 44,  groupId: "g1", logo: "RMC", url: "iptv://rmc",       fav: true,  catchup: true,  catchupDays: 15 },
    { id: "c5",  name: "Canal+ Cinéma",      number: 51,  groupId: "g2", logo: "C+",  url: "iptv://canal/cin", fav: true,  catchup: true,  catchupDays: 30 },
    { id: "c6",  name: "OCS Max",            number: 52,  groupId: "g2", logo: "OCS", url: "iptv://ocs",       fav: false, catchup: true,  catchupDays: 30 },
    { id: "c7",  name: "TCM Cinéma",         number: 53,  groupId: "g2", logo: "TCM", url: "iptv://tcm",       fav: false, catchup: true,  catchupDays: 15 },
    { id: "c8",  name: "Netflix Originals",  number: 61,  groupId: "g3", logo: "NFX", url: "iptv://nflx",      fav: true,  catchup: false, catchupDays: 0  },
    { id: "c9",  name: "13ᵉ Rue",            number: 62,  groupId: "g3", logo: "13",  url: "iptv://13rue",     fav: false, catchup: true,  catchupDays: 15 },
    { id: "c10", name: "BFM TV",             number: 15,  groupId: "g4", logo: "BFM", url: "iptv://bfm",       fav: false, catchup: true,  catchupDays: 15 },
    { id: "c11", name: "France Info",        number: 27,  groupId: "g4", logo: "F.I", url: "iptv://finfo",     fav: true,  catchup: true,  catchupDays: 15 },
    { id: "c12", name: "Euronews",           number: 28,  groupId: "g4", logo: "EN",  url: "iptv://euronews",  fav: false, catchup: true,  catchupDays: 7  },
    { id: "c13", name: "Gulli",              number: 71,  groupId: "g5", logo: "GUL", url: "iptv://gulli",     fav: false, catchup: true,  catchupDays: 15 },
    { id: "c14", name: "Disney Channel",     number: 72,  groupId: "g5", logo: "DSN", url: "iptv://disney",    fav: false, catchup: true,  catchupDays: 15 },
    { id: "c15", name: "National Geographic",number: 81,  groupId: "g6", logo: "NAT", url: "iptv://natgeo",    fav: true,  catchup: true,  catchupDays: 30 },
    { id: "c16", name: "Discovery",          number: 82,  groupId: "g6", logo: "DSC", url: "iptv://disco",     fav: false, catchup: true,  catchupDays: 15 },
    { id: "c17", name: "Planète+",           number: 83,  groupId: "g6", logo: "P+",  url: "iptv://planete",   fav: false, catchup: true,  catchupDays: 15 },
  ],
  activeGroupId: FAV_GROUP_ID,
};

const SWATCH_COLORS = ["#22c55e", "#a855f7", "#f59e0b", "#0ea5e9", "#ec4899", "#14b8a6", "#ef4444", "#6366f1", "#84cc16", "#06b6d4"];

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return structuredClone(DEFAULT_STATE);
}
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

function genId(prefix) { return prefix + "_" + Math.random().toString(36).slice(2, 9); }

/* ---------- Rendu ---------- */
const groupsList = document.getElementById("groups-list");
const channelsList = document.getElementById("channels-list");
const channelSearch = document.getElementById("channel-search");
const activeGroupName = document.getElementById("active-group-name");
const activeGroupCount = document.getElementById("active-group-count");
const activeGroupColor = document.getElementById("active-group-color");
const chCount = document.getElementById("ch-count");

function renderGroups() {
  groupsList.innerHTML = "";
  const favCount = state.channels.filter(c => c.fav).length;

  const favRow = document.createElement("li");
  favRow.innerHTML = `
    <button class="group-row fav ${state.activeGroupId === FAV_GROUP_ID ? "active" : ""}" data-id="${FAV_GROUP_ID}">
      <span class="group-color-dot"></span>
      <span class="group-name">★ Favoris</span>
      <span class="group-count">${favCount}</span>
    </button>`;
  groupsList.appendChild(favRow);

  for (const g of state.groups) {
    const count = state.channels.filter(c => c.groupId === g.id).length;
    const li = document.createElement("li");
    li.innerHTML = `
      <button class="group-row ${state.activeGroupId === g.id ? "active" : ""}" data-id="${g.id}">
        <span class="group-color-dot" style="background:${g.color}"></span>
        <span class="group-name">${escapeHTML(g.name)}</span>
        <span class="group-actions">
          <span class="icon-btn" data-act="edit-group" data-id="${g.id}" title="Renommer">✎</span>
          <span class="icon-btn danger" data-act="del-group" data-id="${g.id}" title="Supprimer">🗑</span>
        </span>
        <span class="group-count">${count}</span>
      </button>`;
    groupsList.appendChild(li);
  }
}

function renderChannels() {
  const isFav = state.activeGroupId === FAV_GROUP_ID;
  const group = state.groups.find(g => g.id === state.activeGroupId);
  const filterText = (channelSearch.value || "").toLowerCase().trim();

  let list = isFav
    ? state.channels.filter(c => c.fav)
    : state.channels.filter(c => c.groupId === state.activeGroupId);
  if (filterText) list = list.filter(c => c.name.toLowerCase().includes(filterText) || String(c.number).includes(filterText));
  list.sort((a, b) => (a.number || 0) - (b.number || 0));

  activeGroupName.textContent = isFav ? "★ Favoris" : (group?.name || "—");
  activeGroupColor.style.background = isFav ? "#fcd34d" : (group?.color || "transparent");
  activeGroupCount.textContent = `${list.length} canal${list.length > 1 ? "x" : ""}`;
  chCount.textContent = `${state.channels.length} chaînes`;

  channelsList.innerHTML = "";
  if (!list.length) {
    channelsList.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📺</span>
        <span class="empty-text">${isFav ? "Aucun favori — clique ★ sur une chaîne." : "Aucune chaîne dans ce groupe."}</span>
      </div>`;
    return;
  }
  for (const c of list) {
    const groupOf = state.groups.find(g => g.id === c.groupId);
    const item = document.createElement("li");
    item.className = "channel-item";
    item.innerHTML = `
      <span class="channel-logo" style="background:linear-gradient(135deg, ${groupOf?.color || "#7c9bff"}, #b48cff)">${escapeHTML(c.logo || c.name.slice(0,3).toUpperCase())}</span>
      <span class="channel-info">
        <span class="channel-name">${escapeHTML(c.name)}</span>
        <span class="channel-meta">Ch.${c.number} · ${escapeHTML(groupOf?.name || "—")}</span>
      </span>
      <span class="channel-actions">
        ${c.catchup ? `<button class="icon-btn catchup-btn" data-act="catchup" data-id="${c.id}" title="Replay (${c.catchupDays || 15} j)">↺</button>` : ""}
        <button class="fav-star ${c.fav ? "on" : ""}" data-act="fav" data-id="${c.id}" title="Favori">${c.fav ? "★" : "☆"}</button>
        <button class="icon-btn" data-act="edit-ch" data-id="${c.id}" title="Modifier">✎</button>
        <button class="icon-btn danger" data-act="del-ch" data-id="${c.id}" title="Supprimer">🗑</button>
      </span>`;
    channelsList.appendChild(item);
  }
}

function renderAll() { renderGroups(); renderChannels(); saveState(); }

function escapeHTML(s) { return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

/* ---------- Events ---------- */
groupsList.addEventListener("click", e => {
  const actBtn = e.target.closest("[data-act]");
  if (actBtn) {
    e.stopPropagation();
    const id = actBtn.dataset.id;
    if (actBtn.dataset.act === "edit-group") editGroup(id);
    else if (actBtn.dataset.act === "del-group") deleteGroup(id);
    return;
  }
  const row = e.target.closest(".group-row");
  if (!row) return;
  state.activeGroupId = row.dataset.id;
  renderAll();
});

document.getElementById("add-group-btn").addEventListener("click", () => addGroup());
document.getElementById("add-group-row").addEventListener("click", () => addGroup());
document.getElementById("add-channel-btn").addEventListener("click", () => addChannel());
channelSearch.addEventListener("input", () => renderChannels());

channelsList.addEventListener("click", e => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const id = btn.dataset.id;
  const act = btn.dataset.act;
  if (act === "fav") toggleFav(id);
  else if (act === "edit-ch") editChannel(id);
  else if (act === "del-ch") deleteChannel(id);
  else if (act === "catchup") openCatchup(id);
});

function toggleFav(id) {
  const c = state.channels.find(x => x.id === id);
  if (!c) return;
  c.fav = !c.fav;
  log(`${c.fav ? "★" : "☆"} « ${c.name} » ${c.fav ? "ajoutée aux" : "retirée des"} favoris.`);
  renderAll();
}

/* ---------- Modal ---------- */
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalForm = document.getElementById("modal-form");
const modalOk = document.getElementById("modal-ok");
const modalCancel = document.getElementById("modal-cancel");
const modalClose = document.getElementById("modal-close");

function openModal(title, fieldsHTML, onSubmit) {
  modalTitle.textContent = title;
  modalForm.innerHTML = fieldsHTML;
  modal.hidden = false;
  modalForm.querySelectorAll(".swatch").forEach(sw => {
    sw.addEventListener("click", () => {
      modalForm.querySelectorAll(".swatch").forEach(x => x.classList.remove("active"));
      sw.classList.add("active");
      modalForm.querySelector("[name=color]").value = sw.dataset.color;
    });
  });
  const first = modalForm.querySelector("input, select, textarea");
  if (first) setTimeout(() => first.focus(), 50);

  const handler = (e) => { e?.preventDefault(); onSubmit(new FormData(modalForm)); };
  modalOk.onclick = handler;
  modalForm.onsubmit = handler;
}
function closeModal() {
  modal.hidden = true;
  modalOk.onclick = null;
  modalForm.onsubmit = null;
  modalOk.hidden = false;
  modalCancel.textContent = "Annuler";
  modal.querySelector(".modal").classList.remove("modal-wide");
}
modalCancel.addEventListener("click", closeModal);
modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !modal.hidden) closeModal(); });

function swatchHTML(active) {
  return `<div class="swatches">` + SWATCH_COLORS.map(c =>
    `<span class="swatch ${c === active ? "active" : ""}" data-color="${c}" style="background:${c}"></span>`
  ).join("") + `</div><input type="hidden" name="color" value="${active}" />`;
}

/* ---------- CRUD groupes ---------- */
function addGroup() {
  openModal("Nouveau groupe", `
    <div class="field">
      <label>Nom du groupe</label>
      <input name="name" required placeholder="ex. Musique, Adulte, International…" />
    </div>
    <div class="field">
      <label>Couleur</label>
      ${swatchHTML(SWATCH_COLORS[0])}
    </div>
  `, (form) => {
    const name = (form.get("name") || "").trim();
    if (!name) return;
    const color = form.get("color") || SWATCH_COLORS[0];
    const g = { id: genId("g"), name, color };
    state.groups.push(g);
    state.activeGroupId = g.id;
    closeModal();
    log(`Groupe « ${name} » créé.`);
    renderAll();
  });
}

function editGroup(id) {
  const g = state.groups.find(x => x.id === id);
  if (!g) return;
  openModal("Modifier le groupe", `
    <div class="field">
      <label>Nom</label>
      <input name="name" required value="${escapeHTML(g.name)}" />
    </div>
    <div class="field">
      <label>Couleur</label>
      ${swatchHTML(g.color)}
    </div>
  `, (form) => {
    const name = (form.get("name") || "").trim();
    if (!name) return;
    g.name = name;
    g.color = form.get("color") || g.color;
    closeModal();
    log(`Groupe renommé en « ${name} ».`);
    renderAll();
  });
}

function deleteGroup(id) {
  const g = state.groups.find(x => x.id === id);
  if (!g) return;
  const count = state.channels.filter(c => c.groupId === id).length;
  const ok = confirm(`Supprimer le groupe « ${g.name} » ?${count ? `\n${count} chaîne(s) seront également supprimées.` : ""}`);
  if (!ok) return;
  state.channels = state.channels.filter(c => c.groupId !== id);
  state.groups = state.groups.filter(x => x.id !== id);
  if (state.activeGroupId === id) state.activeGroupId = FAV_GROUP_ID;
  log(`Groupe « ${g.name} » supprimé (${count} chaîne(s)).`);
  renderAll();
}

/* ---------- CRUD chaînes ---------- */
function channelFormHTML(c = {}) {
  const groupOpts = state.groups.map(g =>
    `<option value="${g.id}" ${g.id === c.groupId ? "selected" : ""}>${escapeHTML(g.name)}</option>`
  ).join("");
  return `
    <div class="field">
      <label>Nom de la chaîne</label>
      <input name="name" required value="${escapeHTML(c.name || "")}" placeholder="ex. France 2, RMC Story…" />
    </div>
    <div class="field">
      <label>Numéro</label>
      <input name="number" type="number" min="1" value="${c.number ?? ""}" placeholder="ex. 12" />
    </div>
    <div class="field">
      <label>Groupe</label>
      <select name="groupId" required>${groupOpts || `<option value="">— créez d'abord un groupe —</option>`}</select>
    </div>
    <div class="field">
      <label>Logo (3 lettres)</label>
      <input name="logo" maxlength="4" value="${escapeHTML(c.logo || "")}" placeholder="ex. F2" />
    </div>
    <div class="field">
      <label>URL du flux (facultatif)</label>
      <input name="url" value="${escapeHTML(c.url || "")}" placeholder="ex. http://… .m3u8" />
    </div>
    <div class="field">
      <label>Replay / Catchup</label>
      <label class="checkbox-row">
        <input type="checkbox" name="catchup" ${c.catchup !== false ? "checked" : ""} />
        <span>Activer la rediffusion (catch-up)</span>
      </label>
    </div>
    <div class="field">
      <label>Durée du replay (jours)</label>
      <input name="catchupDays" type="number" min="1" max="60" value="${c.catchupDays ?? 15}" />
    </div>
  `;
}

function addChannel() {
  if (!state.groups.length) {
    alert("Créez d'abord un groupe avant d'ajouter une chaîne.");
    addGroup();
    return;
  }
  openModal("Nouvelle chaîne", channelFormHTML({ groupId: state.activeGroupId !== FAV_GROUP_ID ? state.activeGroupId : state.groups[0].id }), (form) => {
    const name = (form.get("name") || "").trim();
    if (!name) return;
    const c = {
      id: genId("c"),
      name,
      number: parseInt(form.get("number"), 10) || nextChannelNumber(),
      groupId: form.get("groupId"),
      logo: (form.get("logo") || name.slice(0, 3)).toUpperCase(),
      url:  form.get("url") || "",
      fav: false,
      catchup: !!form.get("catchup"),
      catchupDays: Math.min(60, Math.max(1, parseInt(form.get("catchupDays"), 10) || 15)),
    };
    state.channels.push(c);
    closeModal();
    log(`Chaîne « ${name} » ajoutée (Ch.${c.number}${c.catchup ? `, replay ${c.catchupDays}j` : ""}).`);
    renderAll();
  });
}

function editChannel(id) {
  const c = state.channels.find(x => x.id === id);
  if (!c) return;
  openModal("Modifier la chaîne", channelFormHTML(c), (form) => {
    const name = (form.get("name") || "").trim();
    if (!name) return;
    c.name = name;
    c.number = parseInt(form.get("number"), 10) || c.number;
    c.groupId = form.get("groupId") || c.groupId;
    c.logo = (form.get("logo") || c.logo).toUpperCase();
    c.url = form.get("url") || "";
    c.catchup = !!form.get("catchup");
    c.catchupDays = Math.min(60, Math.max(1, parseInt(form.get("catchupDays"), 10) || 15));
    closeModal();
    log(`Chaîne « ${name} » mise à jour.`);
    renderAll();
  });
}

function deleteChannel(id) {
  const c = state.channels.find(x => x.id === id);
  if (!c) return;
  if (!confirm(`Supprimer la chaîne « ${c.name} » ?`)) return;
  state.channels = state.channels.filter(x => x.id !== id);
  log(`Chaîne « ${c.name} » supprimée.`);
  renderAll();
}

function nextChannelNumber() {
  const used = new Set(state.channels.map(c => c.number));
  for (let n = 1; n < 9999; n++) if (!used.has(n)) return n;
  return 1;
}

/* ---------- Replay / Catchup (15 jours en arrière) ---------- */
const PROGRAM_LIBRARY = {
  g1: [ /* sport */
    { title: "PSG vs Marseille",         genre: "Football",   duration: 120 },
    { title: "Tour de France — étape",   genre: "Cyclisme",   duration: 240 },
    { title: "Roland-Garros",            genre: "Tennis",     duration: 180 },
    { title: "F1 Grand Prix de Monaco",  genre: "Auto",       duration: 150 },
    { title: "NBA Finals — Game 4",      genre: "Basket",     duration: 150 },
    { title: "Top 14 — Toulouse / Bayonne", genre: "Rugby",   duration: 120 },
    { title: "Champions League — résumé",   genre: "Football", duration: 60 },
    { title: "Stade 2",                   genre: "Magazine",  duration: 90 },
  ],
  g2: [ /* films */
    { title: "Inception",              genre: "SF",      duration: 148 },
    { title: "Interstellar",           genre: "SF",      duration: 169 },
    { title: "Dune — Partie 2",        genre: "SF",      duration: 166 },
    { title: "Tenet",                  genre: "Action",  duration: 150 },
    { title: "Le Parrain",             genre: "Drame",   duration: 175 },
    { title: "Pulp Fiction",           genre: "Crime",   duration: 154 },
    { title: "Le Seigneur des Anneaux",genre: "Fantasy", duration: 178 },
    { title: "La La Land",             genre: "Musical", duration: 128 },
  ],
  g3: [ /* séries */
    { title: "Breaking Bad — S5E14",   genre: "Drame",   duration: 50 },
    { title: "Stranger Things — S4E7", genre: "SF",      duration: 75 },
    { title: "The Crown — S6E4",       genre: "Histor.", duration: 60 },
    { title: "House of the Dragon",    genre: "Fantasy", duration: 65 },
    { title: "Lupin — épisode 5",      genre: "Polar",   duration: 45 },
    { title: "Dix pour cent — S4E2",   genre: "Comédie", duration: 50 },
  ],
  g4: [ /* info */
    { title: "Journal de 20h",         genre: "Info",   duration: 35 },
    { title: "C dans l'air",           genre: "Débat",  duration: 65 },
    { title: "Quotidien",              genre: "Talk",   duration: 75 },
    { title: "Le 19/20",               genre: "Info",   duration: 30 },
    { title: "Élysée 2032",            genre: "Politique", duration: 90 },
    { title: "Météo France",           genre: "Météo",  duration: 5 },
  ],
  g5: [ /* enfants */
    { title: "Mickey Mouse Clubhouse", genre: "Animation", duration: 25 },
    { title: "Bluey",                  genre: "Animation", duration: 20 },
    { title: "Paw Patrol",             genre: "Animation", duration: 22 },
    { title: "Pat'Patrouille — Film",  genre: "Animation", duration: 95 },
    { title: "Pokémon",                genre: "Animation", duration: 25 },
    { title: "Spider-Man",             genre: "Animation", duration: 25 },
  ],
  g6: [ /* doc */
    { title: "Planète Bleue II — Profondeurs", genre: "Nature",  duration: 60 },
    { title: "Cosmos — Voyage spatial",         genre: "Science", duration: 50 },
    { title: "Apocalypse — Seconde Guerre",     genre: "Histoire",duration: 55 },
    { title: "Tchernobyl, le silence",          genre: "Histoire",duration: 90 },
    { title: "Les abysses",                     genre: "Nature",  duration: 60 },
    { title: "Volcans en fureur",               genre: "Nature",  duration: 55 },
  ],
};
const GENERIC_PROGRAMS = [
  { title: "Magazine du soir", genre: "Magazine", duration: 50 },
  { title: "Ciné-club",        genre: "Cinéma",   duration: 110 },
  { title: "Documentaire",     genre: "Doc",      duration: 55 },
  { title: "Talk-show",        genre: "Talk",     duration: 60 },
];

function seededRand(seed) {
  let x = seed | 0;
  return () => {
    x = (x * 1664525 + 1013904223) | 0;
    return ((x >>> 0) % 100000) / 100000;
  };
}

function buildSchedule(channel, daysBack) {
  const programs = PROGRAM_LIBRARY[channel.groupId] || GENERIC_PROGRAMS;
  const rnd = seededRand(channel.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + daysBack);
  const day = new Date();
  day.setDate(day.getDate() - daysBack);
  day.setHours(0, 0, 0, 0);

  const slots = [];
  let cursor = 6 * 60; // 06:00
  const endOfDay = 26 * 60; // 02:00 day after
  while (cursor < endOfDay) {
    const p = programs[Math.floor(rnd() * programs.length)];
    const dur = p.duration + Math.floor(rnd() * 15 - 7);
    const h = Math.floor(cursor / 60) % 24;
    const m = cursor % 60;
    slots.push({
      time: `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`,
      title: p.title,
      genre: p.genre,
      duration: Math.max(15, dur),
    });
    cursor += Math.max(15, dur);
  }
  return slots;
}

let currentCatchup = { channel: null, day: 0 };

function openCatchup(id) {
  const c = state.channels.find(x => x.id === id);
  if (!c || !c.catchup) return;
  currentCatchup = { channel: c, day: 1 };
  modal.hidden = false;
  modal.querySelector(".modal").classList.add("modal-wide");
  modalTitle.textContent = `Replay — ${c.name}`;
  modalForm.innerHTML = renderCatchup(c, 1);
  modalOk.hidden = true;
  modalCancel.textContent = "Fermer";
  modalForm.querySelectorAll(".day-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      const d = parseInt(tab.dataset.day, 10);
      currentCatchup.day = d;
      modalForm.innerHTML = renderCatchup(c, d);
      attachCatchupHandlers(c);
    });
  });
  attachCatchupHandlers(c);
}

function attachCatchupHandlers(c) {
  modalForm.querySelectorAll(".day-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      const d = parseInt(tab.dataset.day, 10);
      currentCatchup.day = d;
      modalForm.innerHTML = renderCatchup(c, d);
      attachCatchupHandlers(c);
    });
  });
  modalForm.querySelectorAll(".prog-watch").forEach(btn => {
    btn.addEventListener("click", () => {
      const title = btn.dataset.title;
      const time = btn.dataset.time;
      log(`▶ Lecture replay « ${title} » (${c.name}, ${formatDayLabel(currentCatchup.day)} ${time}).`);
      btn.textContent = "✓ Lancé";
      btn.disabled = true;
    });
  });
}

function formatDayLabel(daysBack) {
  if (daysBack === 0) return "Aujourd'hui";
  if (daysBack === 1) return "Hier";
  const d = new Date();
  d.setDate(d.getDate() - daysBack);
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

function renderCatchup(c, daysBack) {
  const maxDays = Math.max(1, c.catchupDays || 15);
  const tabs = [];
  for (let d = 1; d <= maxDays; d++) {
    tabs.push(`<button type="button" class="day-tab ${d === daysBack ? "active" : ""}" data-day="${d}">${formatDayLabel(d)}</button>`);
  }
  const schedule = buildSchedule(c, daysBack);
  const rows = schedule.map(s => `
    <li class="prog-item">
      <span class="prog-time">${s.time}</span>
      <span class="prog-info">
        <span class="prog-title">${escapeHTML(s.title)}</span>
        <span class="prog-meta">${escapeHTML(s.genre)} · ${s.duration} min</span>
      </span>
      <button type="button" class="prog-watch" data-title="${escapeHTML(s.title)}" data-time="${s.time}">▶ Voir</button>
    </li>
  `).join("");

  return `
    <div class="catchup-head">
      <div class="catchup-meta">
        <span class="catchup-chan-logo">${escapeHTML(c.logo)}</span>
        <div>
          <div class="catchup-channel">Ch.${c.number} · ${escapeHTML(c.name)}</div>
          <div class="catchup-sub">Replay disponible sur ${maxDays} jours en arrière</div>
        </div>
      </div>
    </div>
    <div class="day-tabs">${tabs.join("")}</div>
    <ul class="prog-list">${rows}</ul>
  `;
}

/* =========================================================
 *  EPG (Guide TV — visionneuse) — chaînes + aperçu + programmes
 * ========================================================= */
const EPG_DAYS_PAST = 7;
const EPG_DAYS_FUTURE = 7;

const epgChannelsList = document.getElementById("epg-channels-list");
const epgChannelSearch = document.getElementById("epg-channel-search");
const guideList = document.getElementById("guide-list");
const guideDayTabs = document.getElementById("guide-day-tabs");
const guideChannelName = document.getElementById("guide-channel-name");
const epgDateEl = document.getElementById("epg-date");

const screenChannelEl = document.getElementById("screen-channel");
const screenTitleEl = document.getElementById("screen-title");
const screenMetaEl = document.getElementById("screen-meta");
const screenTimeEl = document.getElementById("screen-time");
const screenProgressBar = document.getElementById("screen-progress-bar");
const screenStage = document.getElementById("screen-stage");

let epgOffset = 0;        // 0 = aujourd'hui
let selectedChannelId = null;

function startOfDay(daysFromToday) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildDayScheduleAbs(channel, daysFromToday) {
  // construit la grille pour un jour donné avec heures de début absolues (minutes depuis minuit)
  const programs = PROGRAM_LIBRARY[channel.groupId] || GENERIC_PROGRAMS;
  const rnd = seededRand(
    channel.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + daysFromToday * 31
  );
  const slots = [];
  let cursor = 5 * 60; // 05:00
  const end = 24 * 60;
  while (cursor < end) {
    const p = programs[Math.floor(rnd() * programs.length)];
    let dur = p.duration + Math.floor(rnd() * 20 - 10);
    dur = Math.max(15, Math.min(end - cursor, dur));
    slots.push({
      startMin: cursor,
      endMin: cursor + dur,
      title: p.title,
      genre: p.genre,
      duration: dur,
    });
    cursor += dur;
  }
  return slots;
}

function hhmm(m) {
  return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function getNowMinutes() {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}

function currentProgramOf(channel) {
  const nowM = getNowMinutes();
  const today = buildDayScheduleAbs(channel, 0);
  return today.find(s => s.startMin <= nowM && s.endMin > nowM) || today[0];
}

function renderEpgChannelsList() {
  const filter = (epgChannelSearch?.value || "").toLowerCase().trim();
  let channels = [...state.channels].sort((a, b) => (b.fav - a.fav) || ((a.number || 0) - (b.number || 0)));
  if (filter) {
    channels = channels.filter(c =>
      c.name.toLowerCase().includes(filter) ||
      String(c.number).includes(filter)
    );
  }
  if (!selectedChannelId || !channels.find(c => c.id === selectedChannelId)) {
    selectedChannelId = channels[0]?.id || null;
  }

  epgChannelsList.innerHTML = "";
  for (const c of channels) {
    const groupOf = state.groups.find(g => g.id === c.groupId);
    const nowProg = currentProgramOf(c);
    const row = document.createElement("button");
    row.type = "button";
    row.className = `epg-ch-row ${c.id === selectedChannelId ? "active" : ""}`;
    row.innerHTML = `
      <span class="epg-ch-logo" style="background:linear-gradient(135deg, ${groupOf?.color || "#7c9bff"}, #b48cff)">${escapeHTML(c.logo)}</span>
      <span class="epg-ch-info">
        <span class="epg-ch-num">Ch.${c.number}</span>
        <span class="epg-ch-name">${escapeHTML(c.name)}</span>
        <span class="epg-ch-now">${nowProg ? "▶ " + escapeHTML(nowProg.title) : ""}</span>
      </span>
      ${c.fav ? '<span class="epg-ch-fav">★</span>' : ""}
    `;
    row.addEventListener("click", () => {
      selectedChannelId = c.id;
      renderEpgAll();
    });
    epgChannelsList.appendChild(row);
  }
}

function renderGuideDayTabs() {
  guideDayTabs.innerHTML = "";
  for (let d = -EPG_DAYS_PAST; d <= EPG_DAYS_FUTURE; d++) {
    const day = startOfDay(d);
    const today = d === 0;
    const isActive = d === epgOffset;
    const name = today ? "Aujourd'hui" :
                 d === -1 ? "Hier" :
                 d === 1 ? "Demain" :
                 day.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `guide-day ${isActive ? "active" : ""} ${today ? "today" : ""}`;
    btn.textContent = name;
    btn.addEventListener("click", () => { epgOffset = d; renderEpgAll(); });
    guideDayTabs.appendChild(btn);
  }
}

function renderGuideList() {
  guideList.innerHTML = "";
  const channel = state.channels.find(c => c.id === selectedChannelId);
  if (!channel) {
    guideChannelName.textContent = "—";
    guideList.innerHTML = `<div class="empty-state"><span class="empty-icon">📺</span><span class="empty-text">Sélectionne une chaîne dans la liste.</span></div>`;
    return;
  }
  guideChannelName.textContent = channel.name;
  const schedule = buildDayScheduleAbs(channel, epgOffset);
  const nowM = getNowMinutes();

  for (const s of schedule) {
    let cls = "guide-item";
    let when;
    if (epgOffset < 0) { cls += " past"; when = "past"; }
    else if (epgOffset > 0) { cls += " future"; when = "future"; }
    else {
      if (s.endMin <= nowM) { cls += " past"; when = "past"; }
      else if (s.startMin > nowM) { cls += " future"; when = "future"; }
      else { cls += " live"; when = "live"; }
    }
    if (when === "past" && channel.catchup && Math.abs(epgOffset) <= (channel.catchupDays || 15)) {
      cls += " replay";
    }
    const item = document.createElement("button");
    item.type = "button";
    item.className = cls;
    const actionLabel = when === "live"  ? "▶ Regarder"
                      : (when === "past" && cls.includes("replay")) ? "↺ Replay"
                      : when === "past"  ? "Diffusé"
                      :                    "🔔 Rappel";
    item.innerHTML = `
      <span class="guide-time">${hhmm(s.startMin)}</span>
      <span class="guide-info">
        <span class="guide-title">${escapeHTML(s.title)}</span>
        <span class="guide-meta">${escapeHTML(s.genre)} · ${s.duration} min · termine à ${hhmm(s.endMin)}</span>
      </span>
      <span class="guide-action">${actionLabel}</span>
    `;
    item.addEventListener("click", () => openProgramDetail(channel, s, when));
    guideList.appendChild(item);
  }
}

function renderPreviewScreen() {
  const channel = state.channels.find(c => c.id === selectedChannelId);
  if (!channel) {
    screenChannelEl.textContent = "—";
    screenTitleEl.textContent = "Aucune chaîne sélectionnée";
    screenMetaEl.textContent = "—";
    screenProgressBar.style.width = "0%";
    return;
  }
  const groupOf = state.groups.find(g => g.id === channel.groupId);
  const nowM = getNowMinutes();
  const today = buildDayScheduleAbs(channel, 0);
  const live = today.find(s => s.startMin <= nowM && s.endMin > nowM);

  screenChannelEl.textContent = `Ch.${channel.number} · ${channel.name}`;
  screenTimeEl.textContent = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  if (live) {
    screenTitleEl.textContent = live.title;
    screenMetaEl.textContent = `${live.genre} · ${hhmm(live.startMin)} – ${hhmm(live.endMin)} · ${live.duration} min`;
    const progress = ((nowM - live.startMin) / (live.endMin - live.startMin)) * 100;
    screenProgressBar.style.width = Math.max(0, Math.min(100, progress)) + "%";
  } else {
    screenTitleEl.textContent = "Hors antenne";
    screenMetaEl.textContent = "—";
    screenProgressBar.style.width = "0%";
  }

  // teinte de l'écran selon couleur du groupe
  if (groupOf?.color) {
    screenStage.style.background =
      `linear-gradient(135deg, ${groupOf.color}33, #1e1b4b 50%, #0c4a6e)`;
  }

  // bouton favori : maj du label
  const favBtn = document.getElementById("screen-fav");
  if (favBtn) favBtn.textContent = channel.fav ? "★ Favori" : "☆ Favori";
}

function renderEpgAll() {
  const day = startOfDay(epgOffset);
  epgDateEl.textContent = day.toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long",
  });
  renderEpgChannelsList();
  renderGuideDayTabs();
  renderGuideList();
  renderPreviewScreen();
}

function renderEpg() { renderEpgAll(); }

function openProgramDetail(channel, slot, when) {
  const hh = (m) => `${String(Math.floor(m / 60) % 24).padStart(2,"0")}:${String(m % 60).padStart(2,"0")}`;
  const day = startOfDay(epgOffset);
  const dayLabel = day.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const statusBadge = when === "live"  ? `<span style="color:#86efac">● En direct</span>`
                    : when === "past"  ? `<span style="color:var(--ink-dim)">⏪ Diffusé</span>`
                    :                    `<span style="color:#7c9bff">⏩ À venir</span>`;
  const canReplay = when === "past" && channel.catchup && Math.abs(epgOffset) <= (channel.catchupDays || 15);
  const canReminder = when === "future";

  modal.hidden = false;
  modal.querySelector(".modal").classList.remove("modal-wide");
  modalTitle.textContent = slot.title;
  modalOk.hidden = true;
  modalCancel.textContent = "Fermer";
  modalForm.innerHTML = `
    <div class="field">
      <label>Chaîne</label>
      <div style="display:flex;align-items:center;gap:10px;">
        <span class="epg-channel-logo" style="background:linear-gradient(135deg, ${state.groups.find(g => g.id === channel.groupId)?.color || "#7c9bff"}, #b48cff)">${escapeHTML(channel.logo)}</span>
        <span style="font-size:14px;color:var(--ink)">Ch.${channel.number} · ${escapeHTML(channel.name)}</span>
      </div>
    </div>
    <div class="field">
      <label>Date &amp; horaire</label>
      <div style="font-size:14px;color:var(--ink);text-transform:capitalize">${dayLabel}, ${hh(slot.startMin)} – ${hh(slot.endMin)}</div>
    </div>
    <div class="field">
      <label>Genre · durée</label>
      <div style="font-size:14px;color:var(--ink-soft)">${escapeHTML(slot.genre)} · ${slot.duration} min</div>
    </div>
    <div class="field">
      <label>Statut</label>
      <div style="font-size:14px">${statusBadge}</div>
    </div>
    <div class="field" style="flex-direction:row;gap:10px;flex-wrap:wrap">
      ${when === "live" ? `<button type="button" class="panel-btn" data-act="watch-live">▶ Regarder en direct</button>` : ""}
      ${canReplay ? `<button type="button" class="panel-btn" data-act="watch-replay">↺ Revoir en replay</button>` : ""}
      ${canReminder ? `<button type="button" class="panel-btn" data-act="set-reminder">🔔 Me rappeler</button>` : ""}
      ${canReminder ? `<button type="button" class="panel-btn ghost" data-act="record">⏺ Programmer enregistrement</button>` : ""}
    </div>
  `;
  modalForm.querySelectorAll("[data-act]").forEach(btn => {
    btn.addEventListener("click", () => {
      const act = btn.dataset.act;
      if (act === "watch-live")    log(`▶ Lecture en direct : « ${slot.title} » sur ${channel.name}.`);
      if (act === "watch-replay")  log(`↺ Replay : « ${slot.title} » (${channel.name}, ${dayLabel}).`);
      if (act === "set-reminder")  log(`🔔 Rappel programmé : « ${slot.title} » à ${hh(slot.startMin)}.`);
      if (act === "record")        log(`⏺ Enregistrement programmé : « ${slot.title} » sur ${channel.name}.`);
      closeModal();
    });
  });
}

document.getElementById("epg-prev").addEventListener("click", () => { epgOffset = Math.max(-EPG_DAYS_PAST, epgOffset - 1); renderEpgAll(); });
document.getElementById("epg-next").addEventListener("click", () => { epgOffset = Math.min(EPG_DAYS_FUTURE, epgOffset + 1); renderEpgAll(); });
document.getElementById("epg-today").addEventListener("click", () => { epgOffset = 0; renderEpgAll(); });
epgChannelSearch.addEventListener("input", () => renderEpgChannelsList());

document.getElementById("screen-play").addEventListener("click", () => {
  const c = state.channels.find(x => x.id === selectedChannelId);
  if (!c) return;
  log(`▶ Lecture en direct sur ${c.name}.`);
});
document.getElementById("screen-fav").addEventListener("click", () => {
  if (selectedChannelId) {
    toggleFav(selectedChannelId);
    renderPreviewScreen();
    renderEpgChannelsList();
  }
});
document.getElementById("screen-record").addEventListener("click", () => {
  const c = state.channels.find(x => x.id === selectedChannelId);
  if (!c) return;
  log(`⏺ Enregistrement programmé sur ${c.name}.`);
});

renderEpgAll();
setInterval(() => { if (epgOffset === 0) { renderPreviewScreen(); renderGuideList(); } }, 60_000);

/* ---------- Export ---------- */
document.getElementById("export-btn").addEventListener("click", () => {
  const lines = ["#EXTM3U"];
  for (const c of state.channels.sort((a, b) => a.number - b.number)) {
    const g = state.groups.find(x => x.id === c.groupId);
    lines.push(`#EXTINF:-1 tvg-num="${c.number}" group-title="${g?.name || ""}",${c.name}`);
    lines.push(c.url || `iptv://channel/${c.id}`);
  }
  const blob = new Blob([lines.join("\n")], { type: "audio/x-mpegurl" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "playlist.m3u";
  a.click();
  URL.revokeObjectURL(a.href);
  log(`Liste exportée — ${state.channels.length} chaînes (.m3u).`);
});

renderAll();

/* =========================================================
 *  Démarrage
 * ========================================================= */
log("Hub démarré — 6 adaptateurs initialisés.");
log(`Moteur média prêt : ${codecCount} codecs (AV1, HEVC, Dolby Vision, Atmos, FLAC, LDAC…).`);
log("Système : Android 14 · One UI 6.0 · build UP1A.231005.007.");
log(`Bibliothèque chargée : ${state.groups.length} groupes, ${state.channels.length} chaînes, ${state.channels.filter(c => c.fav).length} favoris.`);
