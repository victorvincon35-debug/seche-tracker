import { CITIES } from "../constants/cities.js";
import { getCurrentCity, getNextCity } from "../utils/helpers.js";

export default function MapSVG({ xp }) {
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
