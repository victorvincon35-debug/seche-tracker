import AvatarSVG from "../components/AvatarSVG.jsx";
import MapSVG from "../components/MapSVG.jsx";
import { AVATAR_STAGES } from "../constants/cities.js";
import { SPORT_DAYS } from "../constants/sport.js";
import { getCurrentNutritionStage } from "../utils/helpers.js";

export default function TabDashboard({ data, setTab, avatarStage, currentCity, nextCity }) {
  return (
    <div className="tab-grid" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="card" style={{ padding: 12 }}><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>🗺️ Paris → Rome</div><MapSVG xp={data.totalXP} /></div>
      <div className="card" style={{ textAlign: "center", padding: "16px 20px" }}><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>👤 Ma transformation</div><div style={{ fontSize: 10, color: "#888", marginBottom: 8 }}>{avatarStage.label}</div><div style={{ animation: "breathe 3s ease infinite" }}><AvatarSVG stage={avatarStage} size={140} /></div><div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 8 }}>{AVATAR_STAGES.map((s, i) => (<div key={i} style={{ width: 8, height: 8, borderRadius: 4, background: data.totalXP >= s.min ? "#e94560" : "#1e1e4a", transition: "all .3s" }} />))}</div></div>
      <div className="card"><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>📅 Planning</div>{(() => { const dow = new Date().getDay(); const s = SPORT_DAYS[dow]; const label = `${s.emoji} ${s.label}${s.subtitle ? " — " + s.subtitle : ""}`; return (<div style={{ display: "flex", gap: 6 }}><div style={{ flex: 1, background: "#0a0a1a", borderRadius: 12, padding: "10px 12px", border: "1px solid #1e1e4a", cursor: "pointer" }} onClick={() => setTab("sport")}><div style={{ fontSize: 16, marginBottom: 4 }}>☀️</div><div style={{ fontSize: 12, fontWeight: 600 }}>{label}</div></div></div>); })()}</div>
      {(() => { const ds = getCurrentNutritionStage(); return (<div className="card"><div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 8 }}><span style={{ fontSize: 12 }}>🔴</span><span style={{ fontSize: 11, fontWeight: 700, color: "#e94560" }}>SÈCHE — 2 300 kcal</span></div><div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>{[{ l: "Glucides", v: ds.stageInfo.macros.glucides, c: "#ffeb3b" }, { l: "Protéines", v: ds.stageInfo.macros.proteines, c: "#e94560" }, { l: "Lipides", v: ds.stageInfo.macros.lipides, c: "#4caf50" }].map((m, i) => (<div key={i}><div style={{ width: 48, height: 48, borderRadius: "50%", border: `2.5px solid ${m.c}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 4px", fontSize: 13, fontWeight: 800, fontFamily: "'Space Mono'" }}>{m.v}</div><div style={{ fontSize: 10, color: "#666" }}>{m.l}</div></div>))}</div><div style={{ textAlign: "center", marginTop: 10, fontSize: 18, fontWeight: 900, fontFamily: "'Space Mono'", color: "#e94560" }}>{ds.stageInfo.kcal.toLocaleString("fr-FR")} kcal</div></div>); })()}
    </div>
  );
}
