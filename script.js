import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, set, onValue, get } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDAa1GBRp-2bkEkah-sKR1rP1VSoITexDU",
  authDomain: "projetiot-7dd49.firebaseapp.com",
  databaseURL: "https://projetiot-7dd49-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "projetiot-7dd49",
  storageBucket: "projetiot-7dd49.firebasestorage.app",
  messagingSenderId: "662639984346",
  appId: "1:662639984346:web:aa5a7e7742847659d8afe3",
  measurementId: "G-YWNKVEM3MF"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const fmtTime = () => new Date().toLocaleTimeString('fr-FR');

const clockText = document.getElementById("clockText");
setInterval(() => { clockText.textContent = fmtTime(); }, 1000);
clockText.textContent = fmtTime();

const connDot = document.getElementById("connDot");
const connText = document.getElementById("connText");
onValue(ref(db, ".info/connected"), (snap) => {
  const ok = snap.val() === true;
  connDot.className = "dot " + (ok ? "live" : "down");
  connText.textContent = ok ? "Connecté" : "Hors ligne";
});

const ledRef = ref(db, "/led_1");
const ledRef2 = ref(db, "/led_2");
const etatLed = document.getElementById("etatLed");
const ledToggle = document.getElementById("ledToggle");
const bulbFill = document.getElementById("bulbFill");
const bulbGlow = document.getElementById("bulbGlow");
const ledUpdated = document.getElementById("ledUpdated");
const etatLed2 = document.getElementById("etatLed2");
const ledToggle2 = document.getElementById("ledToggle2");
const bulbFill2 = document.getElementById("bulbFill2");
const bulbGlow2 = document.getElementById("bulbGlow2");

function updateStatus(val) {
  const on = val === true || val === "true";
  if (val === null || val === undefined) {
    etatLed.textContent = "Aucune valeur";
    return;
  }
  etatLed.textContent = on ? "LED allumée" : "LED éteinte";
  etatLed.style.color = on ? "#34d399" : "#e7ecf5";
  bulbFill.setAttribute("fill", on ? "#facc15" : "#334155");
  bulbGlow.classList.toggle("on", on);
  ledToggle.checked = on;
  ledUpdated.textContent = fmtTime();
}

async function setLed(state) {
  try {
    await set(ledRef, state);
  } catch (err) {
    console.error("Erreur Firebase:", err);
    alert("Erreur Firebase: " + err);
  }
}

ledToggle.addEventListener("change", (e) => setLed(e.target.checked));
ledToggle2.addEventListener("change", (e) => set(ledRef2, e.target.checked).catch((err) => {
  console.error("Erreur Firebase:", err);
  alert("Erreur Firebase: " + err);
}));
onValue(ledRef, (snapshot) => updateStatus(snapshot.val()));
onValue(ledRef2, (snapshot) => {
  const val = snapshot.val();
  const on = val === true || val === "true";
  etatLed2.textContent = val === null ? "Aucune valeur" : (on ? "LED allumée" : "LED éteinte");
  etatLed2.style.color = on ? "#34d399" : "#e7ecf5";
  bulbFill2.setAttribute("fill", on ? "#facc15" : "#334155");
  bulbGlow2.classList.toggle("on", on);
  ledToggle2.checked = on;
});
(async () => {
  try {
    const snap = await get(ledRef);
    if (snap.exists()) updateStatus(snap.val());
  } catch (err) {
    console.warn("Lecture initiale échouée:", err);
  }
})();

const sensorRef = ref(db, "/sensors");
const tempVal = document.getElementById("tempVal");
const humVal = document.getElementById("humVal");
const tempUpdated = document.getElementById("tempUpdated");
const humUpdated = document.getElementById("humUpdated");
const tempCtx = document.getElementById("tempGauge").getContext("2d");
const humCtx = document.getElementById("humGauge").getContext("2d");

let currentTemp = 0, currentHum = 0;

function drawGauge(ctx, value, max, colorA, colorB) {
  const W = 220, H = 130, cx = 110, cy = 118, r = 92;
  ctx.clearRect(0, 0, W, H);

  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, 2 * Math.PI);
  ctx.lineWidth = 14;
  ctx.strokeStyle = "rgba(148,163,184,0.14)";
  ctx.lineCap = "round";
  ctx.stroke();

  const clamped = Math.max(0, Math.min(value, max));
  const angle = Math.PI + (clamped / max) * Math.PI;
  const grad = ctx.createLinearGradient(cx - r, 0, cx + r, 0);
  grad.addColorStop(0, colorA);
  grad.addColorStop(1, colorB);

  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, angle);
  ctx.lineWidth = 14;
  ctx.lineCap = "round";
  ctx.strokeStyle = grad;
  ctx.shadowColor = colorB;
  ctx.shadowBlur = 14;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.save();
  ctx.translate(cx, cy);
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI + (i / 10) * Math.PI;
    const x1 = Math.cos(a) * (r - 10), y1 = Math.sin(a) * (r - 10);
    const x2 = Math.cos(a) * (r - 18), y2 = Math.sin(a) * (r - 18);
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = "rgba(148,163,184,0.4)";
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }
  ctx.restore();

  const nx = cx + Math.cos(angle) * (r - 26);
  const ny = cy + Math.sin(angle) * (r - 26);
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(nx, ny);
  ctx.strokeStyle = "#e7ecf5";
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
  ctx.fillStyle = "#e7ecf5";
  ctx.fill();
}

function animateGauge(ctx, start, end, max, colorA, colorB) {
  const steps = 24;
  const step = (end - start) / steps;
  let val = start, n = 0;
  const interval = setInterval(() => {
    val += step; n++;
    drawGauge(ctx, val, max, colorA, colorB);
    if (n >= steps) { drawGauge(ctx, end, max, colorA, colorB); clearInterval(interval); }
  }, 15);
}

drawGauge(tempCtx, 0, 50, "#f59e0b", "#ef4444");
drawGauge(humCtx, 0, 100, "#38bdf8", "#6366f1");

onValue(sensorRef, (snapshot) => {
  const data = snapshot.val();
  if (!data) return;
  if (typeof data.temperature === "number") {
    tempVal.innerHTML = data.temperature.toFixed(1) + "<span>&deg;C</span>";
    animateGauge(tempCtx, currentTemp, data.temperature, 50, "#f59e0b", "#ef4444");
    currentTemp = data.temperature;
    tempUpdated.textContent = fmtTime();
  }
  if (typeof data.humidity === "number") {
    humVal.innerHTML = data.humidity.toFixed(1) + "<span>%</span>";
    animateGauge(humCtx, currentHum, data.humidity, 100, "#38bdf8", "#6366f1");
    currentHum = data.humidity;
    humUpdated.textContent = fmtTime();
  }
});