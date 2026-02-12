import { useState, useEffect, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area } from "recharts";
import { supabase, storage, syncOnLoad, debouncedPush } from "./supabase.js";

const STORAGE_KEY = "seche-tracker-v5";
const START_DATE = "2026-02-17";
const TOTAL_DAYS = 30;

const CITIES = [
  { name: "Paris", emoji: "🗼", min: 0, x: 20, y: 18 },
  { name: "Lyon", emoji: "🦁", min: 800, x: 28, y: 38 },
  { name: "Marseille", emoji: "⛵", min: 1600, x: 32, y: 58 },
  { name: "Nice", emoji: "🌴", min: 2400, x: 44, y: 62 },
  { name: "Gênes", emoji: "⚓", min: 3200, x: 55, y: 55 },
  { name: "Florence", emoji: "🎨", min: 4200, x: 62, y: 48 },
  { name: "Rome", emoji: "🏛️", min: 5500, x: 68, y: 62 },
];

const AVATAR_STAGES = [
  { min: 0, label: "Skinny Fat", bodyWidth: 42, armWidth: 8, chestWidth: 40, legWidth: 14, sixpack: 0, color: "#e8b89d", shorts: "#666" },
  { min: 800, label: "Début", bodyWidth: 40, armWidth: 9, chestWidth: 42, legWidth: 15, sixpack: 0, color: "#e0a88a", shorts: "#555" },
  { min: 1600, label: "En forme", bodyWidth: 38, armWidth: 11, chestWidth: 44, legWidth: 16, sixpack: 2, color: "#d49a7a", shorts: "#444" },
  { min: 2400, label: "Athlétique", bodyWidth: 36, armWidth: 13, chestWidth: 48, legWidth: 17, sixpack: 4, color: "#c88a6a", shorts: "#333" },
  { min: 3200, label: "Warrior", bodyWidth: 33, armWidth: 15, chestWidth: 50, legWidth: 18, sixpack: 6, color: "#bc7a5a", shorts: "#e94560" },
  { min: 4200, label: "Spartan", bodyWidth: 30, armWidth: 17, chestWidth: 54, legWidth: 19, sixpack: 6, color: "#b06a4a", shorts: "#c23152" },
  { min: 5500, label: "Titan 🇮🇹", bodyWidth: 28, armWidth: 19, chestWidth: 58, legWidth: 20, sixpack: 6, color: "#a05a3a", shorts: "#ffeb3b" },
];

const WEEKLY_REWARDS = [
  { week: 1, emoji: "🍦", title: "Gelato à Rome", desc: "Un gelato artisanal pour 2 dans le Trastevere", category: "food" },
  { week: 2, emoji: "🍝", title: "Restaurant Carbonara", desc: "Un vrai restaurant de carbonara romaine authentique", category: "food" },
  { week: 3, emoji: "🎨", title: "Visite des Offices", desc: "Entrée au musée des Offices à Florence", category: "culture" },
  { week: 4, emoji: "🌹", title: "Nuit Romantique", desc: "Soirée romantique avec vue sur le Colisée", category: "love" },
];

const HABITS = [
  { id: "respiration", label: "Respiration / CO2", emoji: "🫁", xp: 15 },
  { id: "meditation", label: "Méditation", emoji: "🧘", xp: 15 },
  { id: "steps", label: "12 000 pas", emoji: "🚶", xp: 20 },
  { id: "sport", label: "Sport 1h", emoji: "🏋️", xp: 30 },
  { id: "souplesse", label: "Souplesse", emoji: "🤸", xp: 15 },
  { id: "journaling", label: "Journaling", emoji: "📓", xp: 10 },
  { id: "rigoler", label: "Rigoler / s'amuser", emoji: "😂", xp: 10 },
  { id: "social", label: "Câlins / liens sociaux", emoji: "🤗", xp: 10 },
  { id: "noir_lire", label: "Noir + lire avant dodo", emoji: "📖", xp: 10 },
  { id: "dodo", label: "Dodo 9h régulier", emoji: "🌙", xp: 20 },
  { id: "psy", label: "Psy (1×/semaine)", emoji: "🧠", xp: 40, weekly: true },
];

const MEALS = [
  { id: "jo", label: "Jus d'orange 700ml", emoji: "🍊", xp: 5 },
  { id: "miel", label: "Miel 48g", emoji: "🍯", xp: 5 },
  { id: "banane", label: "Banane 265g", emoji: "🍌", xp: 5 },
  { id: "boeuf", label: "Bœuf haché 300g", emoji: "🥩", xp: 10 },
  { id: "oeufs", label: "6 œufs", emoji: "🥚", xp: 5 },
  { id: "whey", label: "Whey Dynveo 80g", emoji: "🥛", xp: 10 },
  { id: "collagene", label: "Collagène AM 50g", emoji: "💪", xp: 10 },
  { id: "beurre", label: "Beurre 28g", emoji: "🧈", xp: 3 },
  { id: "legumes", label: "Carottes + Champignons", emoji: "🥕", xp: 5 },
];

const SUPPS = [
  { id: "s_collagene", label: "Collagène 50g", emoji: "💪" },
  { id: "s_creatine", label: "Créatine 5g", emoji: "⚡" },
  { id: "s_magnesium", label: "Magnésium 3×300mg", emoji: "🧲" },
  { id: "s_d3", label: "D3 5000 UI", emoji: "☀️" },
  { id: "s_k2", label: "K2 MK7 300µg", emoji: "🦴" },
  { id: "s_b", label: "Complexe B", emoji: "🅱️" },
  { id: "s_taurine", label: "Taurine 2-3g", emoji: "🌙" },
  { id: "s_zinc", label: "Zinc 20mg", emoji: "🔩" },
  { id: "s_vite", label: "Vit E 300 UI", emoji: "🌿" },
  { id: "s_calcium", label: "Calcium 1000mg", emoji: "🦷" },
];

const SYMPTOMS = ["Énergie","Humeur","Sommeil","Digestion","Peau","Cheveux","Dos","Mâchoire","Vue","Libido","Stress","Concentration","Articulations"];

const NATURO = [
  { id: "langue", label: "Langue", good: "Rose propre" },
  { id: "ongles", label: "Ongles", good: "Lisses, durs" },
  { id: "yeux", label: "Blanc des yeux", good: "Blanc pur" },
  { id: "cernes", label: "Cernes", good: "Légers" },
  { id: "selles", label: "Selles (Bristol)", good: "Type 3-4" },
  { id: "urine", label: "Urine", good: "Jaune paille" },
  { id: "mains_froides", label: "Mains/pieds froids", good: "Non" },
  { id: "cicatrisation", label: "Cicatrisation", good: "Rapide" },
  { id: "transpiration", label: "Transpiration", good: "Normale" },
  { id: "haleine", label: "Haleine réveil", good: "Neutre" },
  { id: "peau_seche", label: "Peau sèche", good: "Non" },
];

// Helpers
function getToday() { return new Date().toISOString().split("T")[0]; }
function getDayNumber(d) { return Math.floor((new Date(d) - new Date(START_DATE)) / 86400000) + 1; }
function getWeekNumber(d) { return Math.ceil(getDayNumber(d) / 7); }
function getAvatarStage(xp) { let s = AVATAR_STAGES[0]; for (const a of AVATAR_STAGES) if (xp >= a.min) s = a; return s; }
function getCurrentCity(xp) { let c = CITIES[0]; for (const city of CITIES) if (xp >= city.min) c = city; return c; }
function getNextCity(xp) { for (const c of CITIES) if (xp < c.min) return c; return null; }

const defaultData = () => ({ days: {}, weeks: {}, weight: {}, totalXP: 0, bestStreak: 0, seenRewards: [] });


function getWeekAvgScore(data, weekNum) {
  let total = 0, days = 0;
  const start = new Date(START_DATE);
  for (let i = (weekNum - 1) * 7; i < weekNum * 7 && i < 30; i++) {
    const dt = new Date(start); dt.setDate(dt.getDate() + i);
    const key = dt.toISOString().split("T")[0];
    const day = data.days[key];
    if (day) {
      let t = 0, d2 = 0;
      HABITS.filter(h => !h.weekly).forEach(() => t++);
      MEALS.forEach(() => t++); SUPPS.forEach(() => t++);
      if (day.habits) Object.values(day.habits).forEach(v => { if (v) d2++; });
      if (day.meals) Object.values(day.meals).forEach(v => { if (v) d2++; });
      if (day.supps) Object.values(day.supps).forEach(v => { if (v) d2++; });
      if (t > 0) { total += (d2 / t) * 100; days++; }
    }
  }
  return days > 0 ? total / days : 0;
}

function isWeekComplete(data, weekNum) {
  const start = new Date(START_DATE);
  const lastDay = new Date(start); lastDay.setDate(lastDay.getDate() + weekNum * 7 - 1);
  return new Date(getToday()) >= lastDay && getWeekAvgScore(data, weekNum) >= 70;
}

const ACHIEVEMENT_REWARDS = [
  { id: "streak_7", emoji: "🏖️", title: "Plage à Nice", desc: "Pause plage sur la Côte d'Azur", condition: "7 jours de streak", check: (d) => d.bestStreak >= 7 },
  { id: "streak_14", emoji: "🛥️", title: "Balade en bateau", desc: "Tour en bateau à Gênes", condition: "14 jours de streak", check: (d) => d.bestStreak >= 14 },
  { id: "streak_21", emoji: "🎭", title: "Opéra à Florence", desc: "Spectacle dans un théâtre historique", condition: "21 jours de streak", check: (d) => d.bestStreak >= 21 },
  { id: "perfect_week", emoji: "🍕", title: "Pizza Napolitaine", desc: "La meilleure pizza de ta vie", condition: "1 semaine à 100%", check: (d) => { for (let w = 1; w <= 4; w++) if (getWeekAvgScore(d, w) >= 98) return true; return false; }},
  { id: "all_supps_10", emoji: "🏎️", title: "Tour en Vespa", desc: "Location Vespa pour explorer Rome à deux", condition: "10j suppléments complets", check: (d) => { let c = 0; Object.values(d.days).forEach(day => { if (day.supps && Object.values(day.supps).filter(Boolean).length >= 10) c++; }); return c >= 10; }},
  { id: "weight_loss", emoji: "🛍️", title: "Shopping à Milan", desc: "Détour shopping pour ta nouvelle silhouette", condition: "Premier kg perdu", check: (d) => { const w1 = d.weight?.w1?.poids ? parseFloat(d.weight.w1.poids) : 0; const latest = Object.keys(d.weight || {}).sort().reverse().find(k => d.weight[k]?.poids); const last = latest ? parseFloat(d.weight[latest].poids) : 0; return w1 > 0 && last > 0 && w1 - last >= 1; }},
  { id: "all_temps", emoji: "🍷", title: "Dégustation de vin", desc: "Dégustation dans un vignoble toscan", condition: "Température 7j de suite", check: (d) => { let con = 0, max = 0; const start = new Date(START_DATE); for (let i = 0; i < 30; i++) { const dt = new Date(start); dt.setDate(dt.getDate() + i); const k = dt.toISOString().split("T")[0]; const t = d.days[k]?.temp; if (t && t.reveil && t.apres_repas && t.aprem) { con++; max = Math.max(max, con); } else con = 0; } return max >= 7; }},
  { id: "xp_3000", emoji: "📸", title: "Shooting Photo", desc: "Photos souvenirs devant la Fontaine de Trevi", condition: "Atteindre 3000 XP", check: (d) => d.totalXP >= 3000 },
  { id: "xp_5500", emoji: "🏆", title: "Dîner au Sommet", desc: "Dîner gastronomique panoramique sur Rome", condition: "Atteindre Rome (5500 XP)", check: (d) => d.totalXP >= 5500 },
];

// ---- AVATAR SVG ----
function AvatarSVG({ stage, size = 180 }) {
  const s = stage, cx = 60, headY = 22;
  return (
    <svg viewBox="0 0 120 160" width={size} height={size * 1.33}>
      <defs>
        <radialGradient id="sg" cx="50%" cy="30%"><stop offset="0%" stopColor={s.color} /><stop offset="100%" stopColor={`${s.color}dd`} /></radialGradient>
        <linearGradient id="shg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={s.shorts} /><stop offset="100%" stopColor={`${s.shorts}aa`} /></linearGradient>
      </defs>
      <rect x={cx-s.legWidth-3} y={110} width={s.legWidth} height={38} rx={s.legWidth/2} fill="url(#sg)"><animate attributeName="height" values="38;40;38" dur="2s" repeatCount="indefinite"/></rect>
      <rect x={cx+3} y={110} width={s.legWidth} height={38} rx={s.legWidth/2} fill="url(#sg)"><animate attributeName="height" values="40;38;40" dur="2s" repeatCount="indefinite"/></rect>
      <rect x={cx-s.chestWidth/2+2} y={100} width={s.chestWidth-4} height={22} rx={4} fill="url(#shg)" />
      <path d={`M${cx-s.chestWidth/2},${55} Q${cx-s.chestWidth/2-2},${80} ${cx-s.bodyWidth/2},${105} L${cx+s.bodyWidth/2},${105} Q${cx+s.chestWidth/2+2},${80} ${cx+s.chestWidth/2},${55} Z`} fill="url(#sg)" />
      {s.sixpack>=2&&<><line x1={cx} y1={65} x2={cx} y2={98} stroke={`${s.color}88`} strokeWidth="0.8"/><line x1={cx-8} y1={75} x2={cx+8} y2={75} stroke={`${s.color}88`} strokeWidth="0.5"/></>}
      {s.sixpack>=4&&<><line x1={cx-8} y1={83} x2={cx+8} y2={83} stroke={`${s.color}88`} strokeWidth="0.5"/><line x1={cx-7} y1={91} x2={cx+7} y2={91} stroke={`${s.color}88`} strokeWidth="0.5"/></>}
      {s.sixpack>=6&&<line x1={cx-6} y1={98} x2={cx+6} y2={98} stroke={`${s.color}88`} strokeWidth="0.5"/>}
      <ellipse cx={cx-s.chestWidth/4} cy={62} rx={s.chestWidth/4-2} ry={7+s.armWidth/3} fill={`${s.color}22`}/>
      <ellipse cx={cx+s.chestWidth/4} cy={62} rx={s.chestWidth/4-2} ry={7+s.armWidth/3} fill={`${s.color}22`}/>
      <rect x={cx-s.chestWidth/2-s.armWidth+2} y={55} width={s.armWidth} height={42} rx={s.armWidth/2} fill="url(#sg)" transform={`rotate(-8,${cx-s.chestWidth/2},55)`}><animate attributeName="y" values="55;53;55" dur="3s" repeatCount="indefinite"/></rect>
      <rect x={cx+s.chestWidth/2-2} y={55} width={s.armWidth} height={42} rx={s.armWidth/2} fill="url(#sg)" transform={`rotate(8,${cx+s.chestWidth/2},55)`}><animate attributeName="y" values="53;55;53" dur="3s" repeatCount="indefinite"/></rect>
      <rect x={cx-6} y={35} width={12} height={22} rx={6} fill="url(#sg)" />
      <circle cx={cx} cy={headY} r={16} fill="url(#sg)" />
      <path d={`M${cx-14},${headY-6} Q${cx-16},${headY-16} ${cx-6},${headY-18} Q${cx},${headY-20} ${cx+6},${headY-18} Q${cx+16},${headY-16} ${cx+14},${headY-6}`} fill="#2a1a0a"/>
      <circle cx={cx-5} cy={headY-1} r={2} fill="#1a1a2e"/><circle cx={cx+5} cy={headY-1} r={2} fill="#1a1a2e"/>
      <circle cx={cx-4.5} cy={headY-1.5} r={0.6} fill="white"/><circle cx={cx+5.5} cy={headY-1.5} r={0.6} fill="white"/>
      <path d={`M${cx-4},${headY+5} Q${cx},${headY+5+s.sixpack} ${cx+4},${headY+5}`} fill="none" stroke="#1a1a2e" strokeWidth="1.2" strokeLinecap="round"/>
      <ellipse cx={cx-s.legWidth/2-3} cy={150} rx={s.legWidth/2+3} ry={5} fill="#1a1a2e"/><ellipse cx={cx+s.legWidth/2+3} cy={150} rx={s.legWidth/2+3} ry={5} fill="#1a1a2e"/>
    </svg>
  );
}

// ---- MAP SVG ----
function MapSVG({ xp }) {
  const currentCity = getCurrentCity(xp), nextCity = getNextCity(xp);
  let prog = 0;
  if (nextCity) { const ci = CITIES.indexOf(currentCity); const seg = nextCity.min - currentCity.min; prog = ci + (seg > 0 ? (xp - currentCity.min) / seg : 0); }
  else prog = CITIES.length - 1;
  const idx = Math.floor(prog), frac = prog - idx;
  const cp = idx >= CITIES.length - 1 ? { x: CITIES[CITIES.length - 1].x, y: CITIES[CITIES.length - 1].y } : { x: CITIES[idx].x + (CITIES[idx + 1].x - CITIES[idx].x) * frac, y: CITIES[idx].y + (CITIES[idx + 1].y - CITIES[idx].y) * frac };

  return (
    <svg viewBox="0 0 100 80" style={{ width: "100%", height: "auto" }}>
      <defs>
        <radialGradient id="seaG" cx="50%" cy="50%"><stop offset="0%" stopColor="#0a1628" /><stop offset="100%" stopColor="#061020" /></radialGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="1" result="g" /><feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="100" height="80" fill="url(#seaG)" rx="8" />
      <path d="M10,10 L35,8 L40,15 L42,30 L38,50 L35,65 L25,70 L15,60 L8,45 L5,25 Z" fill="#12122a" stroke="#2a2a5a" strokeWidth="0.3" />
      <path d="M50,35 L58,30 L68,32 L72,40 L74,50 L70,58 L68,68 L65,73 L62,70 L60,62 L56,55 L52,48 L50,40 Z" fill="#12122a" stroke="#2a2a5a" strokeWidth="0.3" />
      <ellipse cx={65} cy={75} rx={4} ry={2.5} fill="#12122a" stroke="#2a2a5a" strokeWidth="0.3" />
      <path d={`M${CITIES.map(c => `${c.x},${c.y}`).join(" L")}`} fill="none" stroke="#333" strokeWidth="0.5" strokeDasharray="2,1" />
      {CITIES.map((c, i) => {
        if (!i) return null; const prev = CITIES[i - 1];
        if (xp >= c.min) return <line key={i} x1={prev.x} y1={prev.y} x2={c.x} y2={c.y} stroke="#e94560" strokeWidth="0.8" filter="url(#glow)" />;
        if (xp >= prev.min) { const f = (xp - prev.min) / (c.min - prev.min); return <line key={i} x1={prev.x} y1={prev.y} x2={prev.x + (c.x - prev.x) * f} y2={prev.y + (c.y - prev.y) * f} stroke="#e94560" strokeWidth="0.8" filter="url(#glow)" />; }
        return null;
      })}
      {CITIES.map((c, i) => {
        const reached = xp >= c.min;
        return (<g key={i}><circle cx={c.x} cy={c.y} r={reached ? 2.5 : 1.8} fill={reached ? "#e94560" : "#333"} stroke={reached ? "#ff6b81" : "#444"} strokeWidth="0.3">{reached && <animate attributeName="r" values="2.5;3;2.5" dur="2s" repeatCount="indefinite" />}</circle><text x={c.x} y={c.y - 4} textAnchor="middle" fill={reached ? "#fff" : "#555"} fontSize="3" fontWeight={reached ? "bold" : "normal"} fontFamily="Arial">{c.name}</text></g>);
      })}
      <g><text x={cp.x} y={cp.y - 1} textAnchor="middle" fontSize="5" filter="url(#glow)"><animate attributeName="y" values={`${cp.y - 1};${cp.y - 3};${cp.y - 1}`} dur="1.5s" repeatCount="indefinite" />✈️</text></g>
      <text x={25} y={76} fill="#1a2a4a" fontSize="2.5" fontStyle="italic" fontFamily="serif">Méditerranée</text>
    </svg>
  );
}

function RewardCard({ reward, unlocked, isNew, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: unlocked ? "linear-gradient(135deg,#1a0a2e,#2a1040,#1a0a2e)" : "linear-gradient(135deg,#0a0a14,#0d0d1e)",
      border: `1px solid ${unlocked ? (isNew ? "#ffeb3b" : "#6a3aaa") : "#1a1a2a"}`,
      borderRadius: 16, padding: 16, cursor: unlocked ? "pointer" : "default",
      position: "relative", overflow: "hidden", transition: "all .3s", opacity: unlocked ? 1 : 0.5,
    }}>
      {unlocked && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,#ffeb3b,transparent)", backgroundSize: "200% 100%", animation: isNew ? "shimmer 2s infinite" : "none" }} />}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
          background: unlocked ? "linear-gradient(135deg,#e94560,#c23152)" : "#111",
          boxShadow: unlocked ? "0 4px 20px rgba(233,69,96,.3)" : "none",
        }}>{unlocked ? reward.emoji : "🔒"}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: unlocked ? "#fff" : "#444" }}>{unlocked ? reward.title : "???"}</div>
          <div style={{ fontSize: 11, color: unlocked ? "#bbb" : "#333", marginTop: 2 }}>{unlocked ? reward.desc : (reward.condition || `Semaine ${reward.week} — Score ≥ 70%`)}</div>
        </div>
        {unlocked && isNew && <div style={{ background: "linear-gradient(135deg,#ffeb3b,#ff9800)", color: "#000", fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 20, animation: "pulse 1.5s infinite" }}>NEW!</div>}
        {unlocked && !isNew && <div style={{ fontSize: 20 }}>✨</div>}
      </div>
      {reward.category && unlocked && (
        <div style={{ marginTop: 8 }}>
          <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 10, background: "rgba(233,69,96,.15)", color: "#e94560", fontWeight: 600 }}>
            {{ food: "🍴 Gastronomie", culture: "🏛️ Culture", love: "❤️ Romantique" }[reward.category] || reward.category}
          </span>
        </div>
      )}
    </div>
  );
}

// ---- LOGIN SCREEN ----
function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error: err } = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    if (err) setError(err.message);
    setBusy(false);
  };

  return (
    <div style={{ fontFamily: "'Outfit',sans-serif", background: "#0a0a1a", minHeight: "100vh", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}body{background:#0a0a1a}`}</style>
      <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 360, padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>✈️🇮🇹</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Sèche Tracker</div>
          <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>{mode === "login" ? "Connexion" : "Créer un compte"}</div>
        </div>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required style={{ width: "100%", padding: "14px 16px", marginBottom: 10, borderRadius: 12, border: "1px solid #2a2a4a", background: "#0d0d24", color: "white", fontSize: 14, fontFamily: "'Outfit'", outline: "none" }} />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mot de passe" required minLength={6} style={{ width: "100%", padding: "14px 16px", marginBottom: 16, borderRadius: 12, border: "1px solid #2a2a4a", background: "#0d0d24", color: "white", fontSize: 14, fontFamily: "'Outfit'", outline: "none" }} />
        {error && <div style={{ color: "#e94560", fontSize: 12, marginBottom: 12, textAlign: "center" }}>{error}</div>}
        <button type="submit" disabled={busy} style={{ width: "100%", padding: "14px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#e94560,#c23152)", color: "white", fontSize: 15, fontWeight: 700, fontFamily: "'Outfit'", cursor: busy ? "wait" : "pointer", opacity: busy ? 0.6 : 1 }}>
          {busy ? "..." : mode === "login" ? "Se connecter" : "Créer le compte"}
        </button>
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <span onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }} style={{ color: "#e94560", fontSize: 12, cursor: "pointer" }}>
            {mode === "login" ? "Créer un compte" : "J'ai déjà un compte"}
          </span>
        </div>
      </form>
    </div>
  );
}

// ===== MAIN APP =====
export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [showUnlock, setShowUnlock] = useState(null);
  const [showRewardPopup, setShowRewardPopup] = useState(null);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => setSession(s)
    );
    return () => subscription.unsubscribe();
  }, []);

  // Load local data immediately
  useEffect(() => {
    const saved = storage.get(STORAGE_KEY);
    setData(saved || defaultData());
    setLoading(false);
  }, []);

  // Sync with Supabase when session becomes available
  useEffect(() => {
    if (!session || !data) return;
    syncOnLoad(data, session.user.id).then(synced => {
      if (synced && JSON.stringify(synced) !== JSON.stringify(data)) {
        setData(synced);
      }
    });
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-sync when coming back online
  useEffect(() => {
    const handleOnline = () => {
      if (session && data) {
        debouncedPush(data, session.user.id, 100);
      }
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [session, data]);

  const save = useCallback((nd) => {
    setData(nd);
    storage.set(STORAGE_KEY, nd);
    if (session?.user?.id) {
      debouncedPush(nd, session.user.id);
    }
  }, [session]);

  const toggleItem = useCallback((cat, id, xpVal = 5) => {
    const dk = selectedDate;
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.days[dk]) nd.days[dk] = {};
    if (!nd.days[dk][cat]) nd.days[dk][cat] = {};
    const was = nd.days[dk][cat][id];
    nd.days[dk][cat][id] = !was;
    nd.totalXP = Math.max(0, nd.totalXP + (was ? -xpVal : xpVal));

    const oldCity = getCurrentCity(data.totalXP);
    const newCity = getCurrentCity(nd.totalXP);
    if (newCity.min > oldCity.min && !was) { setShowUnlock(newCity); setTimeout(() => setShowUnlock(null), 3500); }

    const streak = calcStreak(nd);
    if (streak > nd.bestStreak) nd.bestStreak = streak;
    if (!nd.seenRewards) nd.seenRewards = [];

    ACHIEVEMENT_REWARDS.forEach(r => {
      if (r.check(nd) && !nd.seenRewards.includes(r.id)) {
        setTimeout(() => { setShowRewardPopup(r); setTimeout(() => setShowRewardPopup(null), 4000); }, showUnlock ? 3600 : 300);
      }
    });
    save(nd);
  }, [data, selectedDate, save, showUnlock]);

  const markRewardSeen = useCallback((id) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.seenRewards) nd.seenRewards = [];
    if (!nd.seenRewards.includes(id)) { nd.seenRewards.push(id); save(nd); }
  }, [data, save]);

  const setSymptom = useCallback((s, v) => { const wk = `w${getWeekNumber(selectedDate)}`; const nd = JSON.parse(JSON.stringify(data)); if (!nd.weeks[wk]) nd.weeks[wk] = {}; if (!nd.weeks[wk].symptoms) nd.weeks[wk].symptoms = {}; nd.weeks[wk].symptoms[s] = v; save(nd); }, [data, selectedDate, save]);
  const setNaturo = useCallback((id, v) => { const wk = `w${getWeekNumber(selectedDate)}`; const nd = JSON.parse(JSON.stringify(data)); if (!nd.weeks[wk]) nd.weeks[wk] = {}; if (!nd.weeks[wk].naturo) nd.weeks[wk].naturo = {}; nd.weeks[wk].naturo[id] = v; save(nd); }, [data, selectedDate, save]);
  const setTemp = useCallback((slot, v) => { const nd = JSON.parse(JSON.stringify(data)); if (!nd.days[selectedDate]) nd.days[selectedDate] = {}; if (!nd.days[selectedDate].temp) nd.days[selectedDate].temp = {}; nd.days[selectedDate].temp[slot] = v; save(nd); }, [data, selectedDate, save]);
  const setWeightData = useCallback((f, v) => { const wk = `w${getWeekNumber(selectedDate)}`; const nd = JSON.parse(JSON.stringify(data)); if (!nd.weight[wk]) nd.weight[wk] = {}; nd.weight[wk][f] = v; save(nd); }, [data, selectedDate, save]);

  function calcStreak(d) {
    let streak = 0; const today = new Date(getToday());
    for (let i = 0; i < 60; i++) { const dt = new Date(today); dt.setDate(dt.getDate() - i); const k = dt.toISOString().split("T")[0]; const dd = d.days[k]; if (!dd) break; const h = dd.habits ? Object.values(dd.habits).filter(Boolean).length : 0; const m = dd.meals ? Object.values(dd.meals).filter(Boolean).length : 0; if (h + m >= 8) streak++; else break; }
    return streak;
  }

  function getDayScore(dk) {
    const day = data?.days?.[dk]; if (!day) return 0; let total = 0, done = 0;
    HABITS.filter(h => !h.weekly).forEach(() => total++); MEALS.forEach(() => total++); SUPPS.forEach(() => total++);
    if (day.habits) Object.values(day.habits).forEach(v => { if (v) done++; }); if (day.meals) Object.values(day.meals).forEach(v => { if (v) done++; }); if (day.supps) Object.values(day.supps).forEach(v => { if (v) done++; });
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }

  function getWeightChartData() { const d = []; for (let w = 1; w <= 5; w++) { const wk = data.weight[`w${w}`]; if (wk?.poids) d.push({ name: `S${w}`, poids: parseFloat(wk.poids) }); } return d; }
  function getSymptomRadarData() { const wk = `w${getWeekNumber(selectedDate)}`; const syms = data.weeks[wk]?.symptoms || {}; return SYMPTOMS.slice(0, 8).map(s => ({ subject: s, value: syms[s] ?? 0, fullMark: 10 })); }
  function getTempChartData() { const d = []; const start = new Date(START_DATE); for (let i = 0; i < 30; i++) { const dt = new Date(start); dt.setDate(dt.getDate() + i); const k = dt.toISOString().split("T")[0]; const t = data.days[k]?.temp; if (t && (t.reveil || t.apres_repas || t.aprem)) d.push({ name: `J${i + 1}`, reveil: t.reveil ? parseFloat(t.reveil) : null, apres: t.apres_repas ? parseFloat(t.apres_repas) : null, aprem: t.aprem ? parseFloat(t.aprem) : null }); } return d; }

  function countUnlocked() { let n = 0; WEEKLY_REWARDS.forEach(r => { if (isWeekComplete(data, r.week)) n++; }); ACHIEVEMENT_REWARDS.forEach(r => { if (r.check(data)) n++; }); return n; }
  function countNew() { let n = 0; ACHIEVEMENT_REWARDS.forEach(r => { if (r.check(data) && !(data.seenRewards || []).includes(r.id)) n++; }); return n; }

  if (authLoading || loading || !data) return (<div style={{ background: "#0a0a1a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Outfit'" }}><div style={{ color: "#e94560", fontSize: 24 }}>✈️</div></div>);

  if (!session) return <LoginScreen />;

  const avatarStage = getAvatarStage(data.totalXP);
  const currentCity = getCurrentCity(data.totalXP);
  const nextCity = getNextCity(data.totalXP);
  const streak = calcStreak(data);
  const dayNum = Math.max(1, Math.min(getDayNumber(getToday()), 30));
  const dayScore = getDayScore(selectedDate);
  const dayData = data.days[selectedDate] || {};
  const weekKey = `w${getWeekNumber(selectedDate)}`;
  const weekData = data.weeks[weekKey] || {};
  const unlockedCount = countUnlocked();
  const newCount = countNew();
  const totalRewards = WEEKLY_REWARDS.length + ACHIEVEMENT_REWARDS.length;

  const navigateDay = (dir) => { const d = new Date(selectedDate); d.setDate(d.getDate() + dir); setSelectedDate(d.toISOString().split("T")[0]); };
  const dateLabel = (() => { const d = new Date(selectedDate); return `${["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"][d.getDay()]} ${d.getDate()} ${["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"][d.getMonth()]}`; })();

  const tabs = [
    { id: "dashboard", label: "🏠", name: "Home" },
    { id: "habits", label: "✅", name: "Habitudes" },
    { id: "food", label: "🍽️", name: "Repas" },
    { id: "supps", label: "💊", name: "Suppl." },
    { id: "health", label: "🩺", name: "Santé" },
    { id: "rewards", label: "🎁", name: "Cadeaux", badge: newCount },
    { id: "stats", label: "📊", name: "Stats" },
    { id: "weight", label: "⚖️", name: "Poids" },
  ];

  return (
    <div style={{ fontFamily: "'Outfit',sans-serif", background: "#0a0a1a", minHeight: "100vh", color: "white", maxWidth: 480, margin: "0 auto", paddingBottom: 80, position: "relative", WebkitOverflowScrolling: "touch" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}body{background:#0a0a1a}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#e94560;border-radius:2px}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes unlockPop{0%{transform:scale(0) rotate(-10deg);opacity:0}60%{transform:scale(1.15) rotate(3deg)}100%{transform:scale(1) rotate(0);opacity:1}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}
        @keyframes confettiDrop{0%{opacity:1;transform:translateY(0) rotate(0)}100%{opacity:0;transform:translateY(80px) rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes rewardSlide{0%{transform:translateY(100%) scale(.8);opacity:0}50%{transform:translateY(-10%) scale(1.05)}100%{transform:translateY(0) scale(1);opacity:1}}
        @keyframes sparkle{0%,100%{opacity:0;transform:scale(0) rotate(0)}50%{opacity:1;transform:scale(1) rotate(180deg)}}
        .card{background:linear-gradient(145deg,#0d0d24,#151535);border:1px solid #1e1e4a;border-radius:20px;padding:20px;animation:slideUp .4s ease}
        .ci{display:flex;align-items:center;gap:12px;padding:14px;border-radius:14px;cursor:pointer;transition:all .15s;border:1px solid transparent;user-select:none;-webkit-tap-highlight-color:transparent}
        .ci:active{transform:scale(.98)}.ci.done{background:rgba(76,175,80,.08);border-color:rgba(76,175,80,.25)}
        .cb{width:28px;height:28px;border-radius:8px;border:2px solid #3a3a5a;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s;font-size:14px;font-weight:700;color:white}
        .ci.done .cb{background:linear-gradient(135deg,#4caf50,#2e7d32);border-color:#4caf50}
        .xp{background:linear-gradient(135deg,#e94560,#c23152);padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;color:white;font-family:'Space Mono',monospace}
        .tb{flex:1;padding:8px 2px;border:none;background:transparent;color:#555;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:8px;font-family:'Outfit';transition:all .2s;border-radius:12px;position:relative;-webkit-tap-highlight-color:transparent}
        .tb.active{color:#e94560;background:rgba(233,69,96,.12)}
        .na{width:40px;height:40px;border-radius:12px;border:1px solid #2a2a4a;background:#0d0d24;color:white;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;transition:all .15s;-webkit-tap-highlight-color:transparent}
        .na:active{transform:scale(.95);border-color:#e94560}
        input[type=number],input[type=text]{background:#0d0d24;border:1px solid #2a2a4a;border-radius:10px;color:white;padding:10px 12px;font-family:'Space Mono';font-size:14px;width:80px;text-align:center;outline:none;-webkit-appearance:none}
        input:focus{border-color:#e94560!important}
        .recharts-text{fill:#888!important;font-size:10px!important}
      `}</style>

      {/* CITY UNLOCK */}
      {showUnlock && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.92)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", animation: "unlockPop .5s ease" }}>
          {[...Array(12)].map((_, i) => (<div key={i} style={{ position: "absolute", left: `${10 + Math.random() * 80}%`, top: `${20 + Math.random() * 40}%`, fontSize: 20, animation: `confettiDrop ${1 + Math.random()}s ease ${Math.random() * .5}s infinite` }}>{"🎉⭐🔥✨💪🇮🇹"[i % 6] || "🎉"}</div>))}
          <div style={{ fontSize: 60, marginBottom: 8 }}>{showUnlock.emoji}</div>
          <div style={{ fontSize: 28, fontWeight: 900, background: "linear-gradient(135deg,#e94560,#ffeb3b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>VILLE DÉBLOQUÉE!</div>
          <div style={{ fontSize: 20, color: "#ccc", marginTop: 4 }}>{showUnlock.name}</div>
        </div>
      )}

      {/* REWARD POPUP */}
      {showRewardPopup && !showUnlock && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.92)", zIndex: 998, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", animation: "rewardSlide .6s ease" }}>
          {[...Array(8)].map((_, i) => (<div key={i} style={{ position: "absolute", left: `${15 + Math.random() * 70}%`, top: `${25 + Math.random() * 50}%`, fontSize: 16, animation: `sparkle ${1.5 + Math.random()}s ease ${Math.random() * .8}s infinite` }}>✨</div>))}
          <div style={{ fontSize: 14, color: "#ffeb3b", fontWeight: 700, letterSpacing: 3, marginBottom: 12, fontFamily: "'Space Mono'" }}>🎁 CADEAU DÉBLOQUÉ 🎁</div>
          <div style={{ width: 80, height: 80, borderRadius: 20, background: "linear-gradient(135deg,#e94560,#c23152)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, boxShadow: "0 8px 40px rgba(233,69,96,.4)", marginBottom: 16 }}>{showRewardPopup.emoji}</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{showRewardPopup.title}</div>
          <div style={{ fontSize: 13, color: "#999", maxWidth: 280, textAlign: "center" }}>{showRewardPopup.desc}</div>
        </div>
      )}

      {/* HEADER */}
      <div style={{ background: "linear-gradient(180deg,#e94560 0%,#0a0a1a 100%)", padding: "max(env(safe-area-inset-top), 16px) 16px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.5)", fontFamily: "'Space Mono'", letterSpacing: 3, textTransform: "uppercase" }}>Destination</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>🇮🇹 Rome avec ma copine</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "'Space Mono'", color: "#ffeb3b" }}>{dayNum}<span style={{ fontSize: 13, color: "rgba(255,255,255,.3)" }}>/30</span></div>
            <div onClick={() => supabase.auth.signOut()} style={{ fontSize: 9, color: "rgba(255,255,255,.3)", cursor: "pointer", marginTop: 2 }}>Déconnexion</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,.3)", borderRadius: 12, padding: "8px 12px" }}>
          <div style={{ fontSize: 22 }}>{currentCity.emoji}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 12, fontWeight: 700 }}>{currentCity.name}</span>
              <span style={{ fontSize: 11, fontFamily: "'Space Mono'", color: "#e94560" }}>{data.totalXP} XP</span>
            </div>
            <div style={{ height: 5, background: "rgba(255,255,255,.08)", borderRadius: 3 }}>
              <div style={{ width: `${nextCity ? ((data.totalXP - currentCity.min) / (nextCity.min - currentCity.min)) * 100 : 100}%`, height: "100%", background: "linear-gradient(90deg,#e94560,#ff6b81)", borderRadius: 3, transition: "width .5s" }} />
            </div>
            {nextCity && <div style={{ fontSize: 9, color: "rgba(255,255,255,.35)", marginTop: 2 }}>{nextCity.min - data.totalXP} XP → {nextCity.name} {nextCity.emoji}</div>}
          </div>
        </div>
      </div>

      {/* DATE NAV */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, padding: "10px 16px" }}>
        <button className="na" onClick={() => navigateDay(-1)}>←</button>
        <div style={{ textAlign: "center", minWidth: 120 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{dateLabel}</div>
          {selectedDate === getToday() && <div style={{ fontSize: 9, color: "#4caf50", fontWeight: 700, letterSpacing: 1 }}>AUJOURD'HUI</div>}
        </div>
        <button className="na" onClick={() => navigateDay(1)}>→</button>
      </div>

      {/* STATS */}
      <div style={{ display: "flex", gap: 6, padding: "0 16px 12px" }}>
        {[{ label: "Score", value: `${dayScore}%`, color: dayScore >= 80 ? "#4caf50" : dayScore >= 50 ? "#ff9800" : "#e94560" }, { label: "Streak", value: `${streak}🔥`, color: "#ff9800" }, { label: "Cadeaux", value: `${unlockedCount}/${totalRewards}`, color: "#ffeb3b" }].map((s, i) => (
          <div key={i} style={{ flex: 1, background: "#0d0d24", border: "1px solid #1e1e4a", borderRadius: 14, padding: "8px 6px", textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "#555" }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Space Mono'", color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: "0 16px" }}>

        {tab === "dashboard" && (<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="card" style={{ padding: 12 }}><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>🗺️ Paris → Rome</div><MapSVG xp={data.totalXP} /></div>
          <div className="card" style={{ textAlign: "center", padding: "16px 20px" }}><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>👤 Ma transformation</div><div style={{ fontSize: 10, color: "#888", marginBottom: 8 }}>{avatarStage.label}</div><div style={{ animation: "breathe 3s ease infinite" }}><AvatarSVG stage={avatarStage} size={140} /></div><div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 8 }}>{AVATAR_STAGES.map((s, i) => (<div key={i} style={{ width: 8, height: 8, borderRadius: 4, background: data.totalXP >= s.min ? "#e94560" : "#1e1e4a", transition: "all .3s" }} />))}</div></div>
          {(() => { const nw = WEEKLY_REWARDS.find(r => !isWeekComplete(data, r.week)); const na = ACHIEVEMENT_REWARDS.find(r => !r.check(data)); const next = nw || na; if (!next) return null; return (<div className="card" style={{ padding: 14, cursor: "pointer", border: "1px solid #2a1a4a" }} onClick={() => setTab("rewards")}><div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 44, height: 44, borderRadius: 12, background: "#111", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🔒</div><div style={{ flex: 1 }}><div style={{ fontSize: 11, color: "#ffeb3b", fontWeight: 700 }}>Prochain cadeau</div><div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{next.condition || `Semaine ${next.week} — Score ≥ 70%`}</div></div><div style={{ fontSize: 18, color: "#444" }}>→</div></div></div>); })()}
          <div className="card"><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>📅 Planning</div>{(() => { const dow = new Date(selectedDate).getDay(); const p = { 1: ["PUSH + Coupole", "Souplesse 60min"], 2: ["PULL + Natation VMA", "Souplesse 60min"], 3: ["Course VMA + Coupole", "Souplesse 60min"], 4: ["SUPER SET + Natation Endurance", "Souplesse 60min"], 5: ["JAMBES + Natation VMA", "Souplesse 60min"], 6: ["Coupole longue", "Souplesse complète"], 0: ["Repos", "Yoga flow"] }[dow]; return (<div style={{ display: "flex", gap: 6 }}>{[{ t: "☀️", v: p[0] }, { t: "🌙", v: p[1] }].map((x, i) => (<div key={i} style={{ flex: 1, background: "#0a0a1a", borderRadius: 12, padding: "10px 12px", border: "1px solid #1e1e4a" }}><div style={{ fontSize: 16, marginBottom: 4 }}>{x.t}</div><div style={{ fontSize: 12, fontWeight: 600, color: x.v === "Repos" ? "#4caf50" : "#fff" }}>{x.v}</div></div>))}</div>); })()}</div>
          <div className="card"><div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>{[{ l: "Glucides", v: "175g", c: "#ffeb3b" }, { l: "Protéines", v: "200g", c: "#e94560" }, { l: "Lipides", v: "70g", c: "#4caf50" }].map((m, i) => (<div key={i}><div style={{ width: 48, height: 48, borderRadius: "50%", border: `2.5px solid ${m.c}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 4px", fontSize: 13, fontWeight: 800, fontFamily: "'Space Mono'" }}>{m.v}</div><div style={{ fontSize: 10, color: "#666" }}>{m.l}</div></div>))}</div><div style={{ textAlign: "center", marginTop: 10, fontSize: 18, fontWeight: 900, fontFamily: "'Space Mono'", color: "#e94560" }}>2 130 kcal</div></div>
        </div>)}

        {tab === "habits" && (<div className="card"><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>✅ Habitudes du jour</div>{HABITS.map(h => { const done = dayData.habits?.[h.id] || false; return (<div key={h.id} className={`ci ${done ? "done" : ""}`} onClick={() => toggleItem("habits", h.id, h.xp)}><div className="cb">{done ? "✓" : ""}</div><span style={{ fontSize: 18 }}>{h.emoji}</span><span style={{ flex: 1, fontSize: 13, fontWeight: done ? 600 : 400 }}>{h.label}</span><span className="xp">+{h.xp}</span></div>); })}</div>)}

        {tab === "food" && (<div className="card"><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>🍽️ Plan sèche — 2 130 kcal</div>{MEALS.map(m => { const done = dayData.meals?.[m.id] || false; return (<div key={m.id} className={`ci ${done ? "done" : ""}`} onClick={() => toggleItem("meals", m.id, m.xp)}><div className="cb">{done ? "✓" : ""}</div><span style={{ fontSize: 18 }}>{m.emoji}</span><span style={{ flex: 1, fontSize: 13 }}>{m.label}</span><span className="xp">+{m.xp}</span></div>); })}<div style={{ marginTop: 12, padding: 10, background: "rgba(233,69,96,.06)", borderRadius: 12, fontSize: 12, textAlign: "center" }}>Budget : <span style={{ color: "#ffeb3b", fontWeight: 700, fontFamily: "'Space Mono'" }}>13,27 - 14,21€/jour</span></div></div>)}

        {tab === "supps" && (<div style={{ display: "flex", flexDirection: "column", gap: 12 }}><div className="card"><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>💊 Suppléments</div>{SUPPS.map(s => { const done = dayData.supps?.[s.id] || false; return (<div key={s.id} className={`ci ${done ? "done" : ""}`} onClick={() => toggleItem("supps", s.id, 5)}><div className="cb">{done ? "✓" : ""}</div><span style={{ fontSize: 18 }}>{s.emoji}</span><span style={{ flex: 1, fontSize: 13 }}>{s.label}</span><span className="xp">+5</span></div>); })}</div><div className="card" style={{ padding: 14 }}><div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>⏰ Timing</div>{[{ t: "🌅 À jeun", v: "Collagène → jus d'orange" }, { t: "🍳 Petit-déj", v: "D3+K2+E+B+Mg" }, { t: "🥩 Midi", v: "Calcium+vinaigre+Mg" }, { t: "🏋️ Post-train", v: "Whey+Créatine" }, { t: "🌙 Dodo", v: "Taurine+Zinc+Mg" }].map((x, i) => (<div key={i} style={{ display: "flex", gap: 8, padding: "5px 0", fontSize: 11, borderBottom: i < 4 ? "1px solid #1a1a2e" : "none" }}><span style={{ color: "#e94560", fontWeight: 600, minWidth: 90 }}>{x.t}</span><span style={{ color: "#999" }}>{x.v}</span></div>))}</div></div>)}

        {tab === "health" && (<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="card"><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>🌡️ Température — Ray Peat</div>{[{ id: "reveil", label: "🌅 Réveil", norm: "36.6-37.0", lo: 36.6, hi: 37.0, warnLo: 36.4 }, { id: "apres_repas", label: "🍳 Après repas", norm: "36.8-37.2", lo: 36.8, hi: 37.2, warnLo: 36.6 }, { id: "aprem", label: "🌆 Fin aprem", norm: "36.8-37.2", lo: 36.8, hi: 37.2, warnLo: 36.6 }].map(slot => { const val = dayData.temp?.[slot.id] || ""; const n = parseFloat(val); let st = "", sc = "#555"; if (val && !isNaN(n)) { if (n >= slot.lo && n <= slot.hi) { st = "✅"; sc = "#4caf50"; } else if (n < slot.warnLo) { st = "⚠️"; sc = "#e94560"; } else if (n < slot.lo) { st = "🟡"; sc = "#ff9800"; } else { st = "🔴"; sc = "#e94560"; } } return (<div key={slot.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0", borderBottom: "1px solid #111" }}><span style={{ fontSize: 12, flex: 1 }}>{slot.label} <span style={{ color: "#4caf50", fontSize: 10 }}>({slot.norm})</span></span><input type="number" step="0.1" min="35" max="39" value={val} placeholder="36.8" onChange={e => setTemp(slot.id, e.target.value)} style={{ width: 72 }} /><span style={{ fontSize: 12, color: sc, minWidth: 24 }}>{st}</span></div>); })}</div>
          <div className="card"><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>⚠️ Symptômes — S{getWeekNumber(selectedDate)}</div><div style={{ fontSize: 10, color: "#555", marginBottom: 10 }}>0 = catastrophe → 10 = excellent</div>{SYMPTOMS.map((s, i) => { const val = weekData.symptoms?.[s] ?? ""; return (<div key={i} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 0", borderBottom: "1px solid #0d0d24" }}><span style={{ flex: 1, fontSize: 11 }}>{s}</span><div style={{ display: "flex", gap: 2 }}>{[...Array(11)].map((_, n) => (<div key={n} onClick={() => setSymptom(s, n)} style={{ width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "'Space Mono'", background: val === n ? (n >= 7 ? "#2e7d32" : n >= 4 ? "#e65100" : "#c62828") : "#0a0a1a", color: val === n ? "#fff" : "#444", border: `1px solid ${val === n ? "transparent" : "#1e1e4a"}` }}>{n}</div>))}</div></div>); })}</div>
          <div className="card"><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>🌿 Naturopathie — S{getWeekNumber(selectedDate)}</div>{NATURO.map((n, i) => { const val = weekData.naturo?.[n.id] || ""; return (<div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #0d0d24" }}><div style={{ flex: 1 }}><div style={{ fontSize: 12 }}>{n.label}</div><div style={{ fontSize: 9, color: "#4caf50" }}>✓ {n.good}</div></div><input type="text" value={val} placeholder="..." onChange={e => setNaturo(n.id, e.target.value)} style={{ background: "#0a0a1a", border: "1px solid #1e1e4a", borderRadius: 8, color: "white", padding: "6px 8px", fontSize: 11, width: 110, fontFamily: "'Outfit'" }} /></div>); })}</div>
        </div>)}

        {tab === "rewards" && (<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card" style={{ textAlign: "center", padding: 20, background: "linear-gradient(145deg,#0d0d24,#1a0a2e,#0d0d24)", border: "1px solid #2a1a4a" }}>
            <div style={{ fontSize: 11, color: "#ffeb3b", fontWeight: 700, letterSpacing: 2, fontFamily: "'Space Mono'", marginBottom: 8 }}>🎁 CADEAUX ITALIE 🇮🇹</div>
            <div style={{ fontSize: 42, fontWeight: 900, background: "linear-gradient(135deg,#e94560,#ffeb3b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{unlockedCount}<span style={{ fontSize: 20 }}>/{totalRewards}</span></div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>débloqués pour ton voyage</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 12 }}>{[...Array(totalRewards)].map((_, i) => (<div key={i} style={{ width: 10, height: 10, borderRadius: 5, background: i < unlockedCount ? "linear-gradient(135deg,#e94560,#ffeb3b)" : "#1e1e4a" }} />))}</div>
          </div>
          <div><div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>📅 Récompenses Hebdo</div><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{WEEKLY_REWARDS.map(r => { const unlocked = isWeekComplete(data, r.week); const ws = Math.round(getWeekAvgScore(data, r.week)); return (<div key={r.week}><RewardCard reward={r} unlocked={unlocked} isNew={false} onClick={() => { }} />{!unlocked && <div style={{ marginTop: 4, padding: "0 16px" }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}><span style={{ fontSize: 10, color: "#444" }}>Semaine {r.week}</span><span style={{ fontSize: 10, color: "#555", fontFamily: "'Space Mono'" }}>{ws}%/70%</span></div><div style={{ height: 3, background: "#111", borderRadius: 2 }}><div style={{ width: `${Math.min((ws / 70) * 100, 100)}%`, height: "100%", background: ws >= 70 ? "#4caf50" : "#e94560", borderRadius: 2 }} /></div></div>}</div>); })}</div></div>
          <div><div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>🏆 Achievements</div><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{ACHIEVEMENT_REWARDS.map(r => { const unlocked = r.check(data); const isNew = unlocked && !(data.seenRewards || []).includes(r.id); return (<RewardCard key={r.id} reward={r} unlocked={unlocked} isNew={isNew} onClick={() => { if (isNew) markRewardSeen(r.id); }} />); })}</div></div>
        </div>)}

        {tab === "stats" && (<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="card"><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>📉 Poids</div>{getWeightChartData().length > 1 ? (<ResponsiveContainer width="100%" height={180}><AreaChart data={getWeightChartData()}><defs><linearGradient id="wG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e94560" stopOpacity={.3} /><stop offset="100%" stopColor="#e94560" stopOpacity={0} /></linearGradient></defs><XAxis dataKey="name" tick={{ fill: "#555", fontSize: 10 }} axisLine={{ stroke: "#1e1e4a" }} /><YAxis domain={["dataMin-1", "dataMax+1"]} tick={{ fill: "#555", fontSize: 10 }} axisLine={{ stroke: "#1e1e4a" }} /><Tooltip contentStyle={{ background: "#0d0d24", border: "1px solid #2a2a5a", borderRadius: 8, fontSize: 12, color: "#fff" }} /><Area type="monotone" dataKey="poids" stroke="#e94560" strokeWidth={2} fill="url(#wG)" dot={{ fill: "#e94560", r: 4 }} /></AreaChart></ResponsiveContainer>) : (<div style={{ color: "#444", fontSize: 12, textAlign: "center", padding: 30 }}>2+ semaines → graph</div>)}</div>
          <div className="card"><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>🎯 Radar santé</div>{getSymptomRadarData().some(d => d.value > 0) ? (<ResponsiveContainer width="100%" height={220}><RadarChart data={getSymptomRadarData()}><PolarGrid stroke="#1e1e4a" /><PolarAngleAxis dataKey="subject" tick={{ fill: "#888", fontSize: 9 }} /><PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} /><Radar name="Score" dataKey="value" stroke="#e94560" fill="#e94560" fillOpacity={.2} strokeWidth={2} dot={{ fill: "#e94560", r: 3 }} /></RadarChart></ResponsiveContainer>) : (<div style={{ color: "#444", fontSize: 12, textAlign: "center", padding: 30 }}>Remplis tes symptômes</div>)}</div>
          <div className="card"><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>🌡️ Températures</div>{getTempChartData().length > 1 ? (<><ResponsiveContainer width="100%" height={180}><LineChart data={getTempChartData()}><XAxis dataKey="name" tick={{ fill: "#555", fontSize: 9 }} axisLine={{ stroke: "#1e1e4a" }} /><YAxis domain={[36, 37.5]} tick={{ fill: "#555", fontSize: 10 }} axisLine={{ stroke: "#1e1e4a" }} /><Tooltip contentStyle={{ background: "#0d0d24", border: "1px solid #2a2a5a", borderRadius: 8, fontSize: 11, color: "#fff" }} /><Line type="monotone" dataKey="reveil" stroke="#4caf50" strokeWidth={2} dot={{ r: 2 }} connectNulls /><Line type="monotone" dataKey="apres" stroke="#ff9800" strokeWidth={2} dot={{ r: 2 }} connectNulls /><Line type="monotone" dataKey="aprem" stroke="#e94560" strokeWidth={2} dot={{ r: 2 }} connectNulls /></LineChart></ResponsiveContainer><div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 8 }}>{[{ c: "#4caf50", l: "Réveil" }, { c: "#ff9800", l: "Repas" }, { c: "#e94560", l: "Aprem" }].map((x, i) => (<div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#888" }}><div style={{ width: 8, height: 8, borderRadius: 4, background: x.c }} />{x.l}</div>))}</div></>) : (<div style={{ color: "#444", fontSize: 12, textAlign: "center", padding: 30 }}>Quelques jours → courbes</div>)}</div>
        </div>)}

        {tab === "weight" && (<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="card"><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>⚖️ Mesures — S{getWeekNumber(selectedDate)}</div>{[{ id: "poids", label: "Poids (kg)", icon: "⚖️" }, { id: "taille_tour", label: "Tour de taille", icon: "📏" }, { id: "bras_d", label: "Bras droit", icon: "💪" }, { id: "bras_g", label: "Bras gauche", icon: "💪" }, { id: "cuisses", label: "Cuisses", icon: "🦵" }].map(f => (<div key={f.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}><span style={{ fontSize: 18 }}>{f.icon}</span><span style={{ flex: 1, fontSize: 12 }}>{f.label}</span><input type="number" step="0.1" value={data.weight[weekKey]?.[f.id] || ""} placeholder="-" onChange={e => setWeightData(f.id, e.target.value)} /></div>))}<div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 10, borderTop: "1px solid #1e1e4a" }}><span style={{ fontSize: 16 }}>📸</span><span style={{ fontSize: 12, flex: 1 }}>Photos ?</span>{["Face", "Profil", "Dos"].map(p => { const pk = `photo_${p.toLowerCase()}`; const done = data.weight[weekKey]?.[pk] || false; return (<div key={p} onClick={() => setWeightData(pk, !done)} style={{ padding: "4px 10px", borderRadius: 8, fontSize: 10, fontWeight: 600, cursor: "pointer", background: done ? "rgba(76,175,80,.15)" : "#0a0a1a", color: done ? "#4caf50" : "#555", border: `1px solid ${done ? "#4caf50" : "#1e1e4a"}` }}>{p} {done ? "✓" : ""}</div>); })}</div></div>
          {Object.keys(data.weight).length > 0 && <div className="card"><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>📊 Historique</div><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{Object.keys(data.weight).sort().map(wk => { const w = data.weight[wk]; if (!w?.poids) return null; return (<div key={wk} style={{ background: "#0a0a1a", borderRadius: 12, padding: "8px 14px", textAlign: "center", border: "1px solid #1e1e4a", minWidth: 60 }}><div style={{ fontSize: 9, color: "#555" }}>{wk.toUpperCase()}</div><div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Space Mono'", color: "#ffeb3b" }}>{w.poids}</div><div style={{ fontSize: 9, color: "#555" }}>kg</div></div>); })}</div></div>}
        </div>)}
      </div>

      {/* BOTTOM NAV */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "linear-gradient(0deg,#0a0a1a 60%,transparent)", padding: "20px 4px max(env(safe-area-inset-bottom, 6px), 6px)", zIndex: 100 }}>
        <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", gap: 1, background: "#0a0a18", borderRadius: 14, padding: 3, border: "1px solid #1a1a3a" }}>
          {tabs.map(t => (
            <button key={t.id} className={`tb ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
              <span style={{ fontSize: 15 }}>{t.label}</span>
              <span>{t.name}</span>
              {t.badge > 0 && <div style={{ position: "absolute", top: 2, right: 4, width: 14, height: 14, borderRadius: 7, background: "#e94560", fontSize: 8, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", animation: "pulse 1.5s infinite" }}>{t.badge}</div>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
