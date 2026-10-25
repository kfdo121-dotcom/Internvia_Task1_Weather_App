// 1. Get a free key at https://openweathermap.org/api and paste it here.
//    (New keys can take up to ~2 hours to activate.)
const API_KEY = "fc91f4c30adf4c794dc84b643d812cc9";
const BASE = "https://api.openweathermap.org/data/2.5";

const $ = (id) => document.getElementById(id);
const state = { unit: localStorage.getItem("unit") || "metric", query: null };

const SYMBOL = { metric: { t: "°C", w: "km/h" }, imperial: { t: "°F", w: "mph" } };

/* ---------- helpers ---------- */
function emoji(id, night) {
  if (id >= 200 && id < 300) return "⛈️";
  if (id >= 300 && id < 400) return "🌦️";
  if (id >= 500 && id < 600) return "🌧️";
  if (id >= 600 && id < 700) return "❄️";
  if (id >= 700 && id < 800) return "🌫️";
  if (id === 800) return night ? "🌙" : "☀️";
  if (id === 801) return night ? "☁️" : "🌤️";
  if (id === 802) return "⛅";
  return "☁️";
}
function skyFor(id, night) {
  if (id >= 200 && id < 300) return "storm";
  if (id >= 300 && id < 600) return "rain";
  if (id >= 600 && id < 700) return "snow";
  if (id >= 700 && id < 800) return "mist";
  if (id === 800 || id === 801) return night ? "clear-night" : "clear-day";
  return "clouds";
}
const deg = (n) => Math.round(n) + "°";
// Shift a unix timestamp into the city's own clock; read it back with UTC getters.
const local = (dt, tz) => new Date((dt + tz) * 1000);
const hm = (d) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
const wind = (v) => Math.round(state.unit === "metric" ? v * 3.6 : v) + " " + SYMBOL[state.unit].w;

function setStatus(msg, isError = false) {
  const el = $("status");
  el.textContent = msg;
  el.className = "status" + (isError ? " error" : "");
  el.hidden = !msg;
}

/* ---------- data ---------- */
async function api(path, params) {
  const qs = new URLSearchParams({ ...params, units: state.unit, appid: API_KEY });
  const res = await fetch(`${BASE}/${path}?${qs}`);
  if (res.ok) return res.json();
  if (res.status === 401) throw new Error("Your API key is missing or not active yet. Check API_KEY in app.js.");
  if (res.status === 404) throw new Error("City not found. Check the spelling or add a country code, like “Paris, FR”.");
  if (res.status === 429) throw new Error("Too many requests. Wait a minute and try again.");
  throw new Error("Weather service error. Try again shortly.");
}

async function load(query) {
  state.query = query;
  setStatus("Loading weather…");
  try {
    const [now, fc] = await Promise.all([api("weather", query), api("forecast", query)]);
    render(now, fc);
    saveRecent(now.name);
    setStatus("");
  } catch (e) {
    $("weather").hidden = true;
    setStatus(e.message === "Failed to fetch" ? "Can’t reach the weather service. Check your connection." : e.message, true);
  }
}

/* ---------- render ---------- */
function render(now, fc) {
  const tz = now.timezone;
  const night = now.dt < now.sys.sunrise || now.dt > now.sys.sunset;
  const cond = now.weather[0];

  document.body.dataset.sky = skyFor(cond.id, night);
  $("city-name").textContent = `${now.name}, ${now.sys.country}`;
  $("local-time").textContent = "Local time " + hm(local(Math.floor(Date.now() / 1000), tz));
  $("icon").textContent = emoji(cond.id, night);
  $("temp").textContent = deg(now.main.temp);
  $("desc").textContent = cond.description;
  $("range").textContent = `Feels like ${deg(now.main.feels_like)}  ·  H ${deg(now.main.temp_max)}  L ${deg(now.main.temp_min)}`;

  const stats = [
    ["Humidity", now.main.humidity + "%"],
    ["Wind", wind(now.wind.speed)],
    ["Pressure", now.main.pressure + " hPa"],
    ["Visibility", state.unit === "metric" ? (now.visibility / 1000).toFixed(1) + " km" : (now.visibility / 1609).toFixed(1) + " mi"],
    ["Sunrise", hm(local(now.sys.sunrise, tz))],
    ["Sunset", hm(local(now.sys.sunset, tz))],
  ];
  $("stats").innerHTML = stats.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");

  renderForecast(fc, tz);
  $("weather").hidden = false;
}

function renderForecast(fc, tz) {
  const days = {};
  for (const e of fc.list) {
    const d = local(e.dt, tz);
    const key = d.toISOString().slice(0, 10);
    const day = (days[key] ||= { date: d, hi: -Infinity, lo: Infinity, pick: e, pickGap: 99 });
    day.hi = Math.max(day.hi, e.main.temp_max);
    day.lo = Math.min(day.lo, e.main.temp_min);
    const gap = Math.abs(d.getUTCHours() - 13); // entry closest to midday represents the day
    if (gap < day.pickGap) { day.pick = e; day.pickGap = gap; }
  }
  $("forecast").innerHTML = Object.values(days).slice(0, 5).map((d, i) => {
    const name = i === 0 ? "Today" : d.date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
    const c = d.pick.weather[0];
    return `<li><span class="day">${name}</span><span class="ico">${emoji(c.id, false)}</span>
      <span class="d">${c.description}</span>
      <span class="t"><b>${deg(d.hi)}</b><span>${deg(d.lo)}</span></span></li>`;
  }).join("");
}

/* ---------- recent searches ---------- */
function saveRecent(name) {
  let list = JSON.parse(localStorage.getItem("recent") || "[]").filter((c) => c !== name);
  list = [name, ...list].slice(0, 5);
  localStorage.setItem("recent", JSON.stringify(list));
  showRecent();
}
function showRecent() {
  const list = JSON.parse(localStorage.getItem("recent") || "[]");
  const box = $("recent");
  box.hidden = !list.length;
  box.innerHTML = "";
  list.forEach((c) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = c;
    b.onclick = () => load({ q: c });
    box.append(b);
  });
}

/* ---------- events ---------- */
$("search").addEventListener("submit", (e) => {
  e.preventDefault();
  const q = $("city").value.trim();
  if (q) load({ q });
});

$("locate").addEventListener("click", () => {
  if (!navigator.geolocation) return setStatus("Your browser doesn’t support location.", true);
  setStatus("Finding your location…");
  navigator.geolocation.getCurrentPosition(
    (p) => load({ lat: p.coords.latitude, lon: p.coords.longitude }),
    () => setStatus("Location access was denied. Search for a city instead.", true)
  );
});

document.querySelectorAll(".units button").forEach((b) => {
  b.addEventListener("click", () => {
    state.unit = b.dataset.unit;
    localStorage.setItem("unit", state.unit);
    syncUnits();
    if (state.query) load(state.query);
  });
});
function syncUnits() {
  document.querySelectorAll(".units button").forEach((b) =>
    b.setAttribute("aria-pressed", b.dataset.unit === state.unit));
}

syncUnits();
showRecent();
const last = JSON.parse(localStorage.getItem("recent") || "[]")[0];
if (last && API_KEY !== "YOUR_API_KEY_HERE") load({ q: last });
else if (API_KEY === "YOUR_API_KEY_HERE") setStatus("Add your OpenWeatherMap API key to app.js to get started.", true);
