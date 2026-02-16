import { useState } from "react";
import AvatarSVG from "../components/AvatarSVG.jsx";
import MapSVG from "../components/MapSVG.jsx";
import { AVATAR_STAGES } from "../constants/cities.js";
import { SPORT_DAYS } from "../constants/sport.js";
import { getCurrentNutritionStage } from "../utils/helpers.js";

export default function TabDashboard({ data, save, setTab, avatarStage, currentCity, nextCity }) {
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [eventTime, setEventTime] = useState("09:00");
  const [eventDesc, setEventDesc] = useState("");

  const today = new Date().toISOString().split("T")[0];

  // Read all events from data.planning (single source of truth)
  const allEvents = Object.entries(data.planning || {}).map(([id, e]) => ({
    id,
    title: e.title,
    date: e.date,
    time: `${String(e.startH).padStart(2, "0")}:${String(e.startM).padStart(2, "0")}`,
    description: e.notes || "",
    color: e.color,
  }));

  // Upcoming events: today + future, sorted chronologically
  const upcoming = allEvents
    .filter(e => e.date >= today)
    .sort((a, b) => a.date === b.date ? (a.time || "").localeCompare(b.time || "") : a.date.localeCompare(b.date));

  const addEvent = () => {
    if (!eventTitle.trim()) return;
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.planning) nd.planning = {};
    const id = Date.now().toString(36);
    const [h, m] = eventTime.split(":").map(Number);
    nd.planning[id] = {
      title: eventTitle.trim(),
      date: eventDate,
      startH: h,
      startM: m,
      endH: Math.min(h + 1, 23),
      endM: m,
      color: "#ff9800",
      notes: eventDesc.trim(),
      recurrence: null,
    };
    save(nd);
    setEventTitle("");
    setEventDesc("");
    setShowAddEvent(false);
  };

  const deleteEvent = (id) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (nd.planning) delete nd.planning[id];
    save(nd);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    const months = ["jan", "fév", "mar", "avr", "mai", "jun", "jul", "aoû", "sep", "oct", "nov", "déc"];
    return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
  };

  const isToday = (dateStr) => dateStr === today;

  return (
    <div className="tab-grid" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="card" style={{ padding: 12 }}><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>🗺️ Paris → Rome</div><MapSVG xp={data.totalXP} /></div>
      <div className="card" style={{ textAlign: "center", padding: "16px 20px" }}><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>👤 Ma transformation</div><div style={{ fontSize: 10, color: "#888", marginBottom: 8 }}>{avatarStage.label}</div><div style={{ animation: "breathe 3s ease infinite" }}><AvatarSVG stage={avatarStage} size={140} /></div><div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 8 }}>{AVATAR_STAGES.map((s, i) => (<div key={i} style={{ width: 8, height: 8, borderRadius: 4, background: data.totalXP >= s.min ? "#e94560" : "#1e1e4a", transition: "all .3s" }} />))}</div></div>

      {/* EVENTS SECTION */}
      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>📆 Rendez-vous</div>
          <div onClick={() => setShowAddEvent(!showAddEvent)}
            style={{ fontSize: 11, fontWeight: 600, color: "#e94560", cursor: "pointer", padding: "4px 10px", borderRadius: 8, background: "rgba(233,69,96,.1)" }}>
            {showAddEvent ? "✕ Fermer" : "+ Ajouter"}
          </div>
        </div>

        {/* Add event form */}
        {showAddEvent && (
          <div style={{ background: "#0a0a1a", borderRadius: 12, padding: 12, marginBottom: 10, border: "1px solid #1e1e4a" }}>
            <input type="text" placeholder="Titre du rendez-vous" value={eventTitle}
              onChange={e => setEventTitle(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, background: "#1a1a2e", border: "1px solid #2a2a4a", color: "#fff", fontSize: 13, fontFamily: "'Outfit'", outline: "none", marginBottom: 8, boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)}
                style={{ flex: 1, padding: "8px 10px", borderRadius: 8, background: "#1a1a2e", border: "1px solid #2a2a4a", color: "#fff", fontSize: 12, fontFamily: "'Outfit'", outline: "none", boxSizing: "border-box" }} />
              <input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)}
                style={{ width: 100, padding: "8px 10px", borderRadius: 8, background: "#1a1a2e", border: "1px solid #2a2a4a", color: "#fff", fontSize: 12, fontFamily: "'Outfit'", outline: "none", boxSizing: "border-box" }} />
            </div>
            <input type="text" placeholder="Description (optionnel)" value={eventDesc}
              onChange={e => setEventDesc(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: 8, background: "#1a1a2e", border: "1px solid #2a2a4a", color: "#fff", fontSize: 12, fontFamily: "'Outfit'", outline: "none", marginBottom: 10, boxSizing: "border-box" }} />
            <div onClick={addEvent}
              style={{ textAlign: "center", padding: "10px 0", borderRadius: 10, background: eventTitle.trim() ? "linear-gradient(135deg, #e94560, #c23152)" : "#1a1a2e",
                color: eventTitle.trim() ? "#fff" : "#555", fontSize: 13, fontWeight: 600, cursor: eventTitle.trim() ? "pointer" : "default" }}>
              Ajouter
            </div>
          </div>
        )}

        {/* Events list */}
        {upcoming.length === 0 ? (
          <div style={{ textAlign: "center", padding: "12px 0", color: "#555", fontSize: 12 }}>
            Aucun rendez-vous à venir
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {upcoming.slice(0, 8).map(ev => (
              <div key={ev.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#0a0a1a", borderRadius: 10, padding: "10px 12px", border: isToday(ev.date) ? "1px solid rgba(233,69,96,.4)" : "1px solid #1e1e4a" }}>
                <div style={{ minWidth: 42, textAlign: "center" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: isToday(ev.date) ? "#e94560" : "#888", textTransform: "uppercase" }}>
                    {isToday(ev.date) ? "Auj." : formatDate(ev.date).split(" ")[0]}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Space Mono'", color: isToday(ev.date) ? "#e94560" : "#ccc" }}>
                    {new Date(ev.date).getDate()}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {ev.color && <div style={{ width: 8, height: 8, borderRadius: 4, background: ev.color, flexShrink: 0 }} />}
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{ev.title}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                    {ev.time}{ev.description ? " — " + ev.description : ""}
                  </div>
                </div>
                <div onClick={() => deleteEvent(ev.id)}
                  style={{ fontSize: 14, color: "#555", cursor: "pointer", padding: "2px 4px", flexShrink: 0 }}>
                  ✕
                </div>
              </div>
            ))}
            {upcoming.length > 8 && (
              <div style={{ textAlign: "center", fontSize: 11, color: "#555" }}>
                +{upcoming.length - 8} autres rendez-vous
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card"><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>📅 Planning</div>{(() => { const dow = new Date().getDay(); const s = SPORT_DAYS[dow]; const label = `${s.emoji} ${s.label}${s.subtitle ? " — " + s.subtitle : ""}`; return (<div style={{ display: "flex", gap: 6 }}><div style={{ flex: 1, background: "#0a0a1a", borderRadius: 12, padding: "10px 12px", border: "1px solid #1e1e4a", cursor: "pointer" }} onClick={() => setTab("sport")}><div style={{ fontSize: 16, marginBottom: 4 }}>☀️</div><div style={{ fontSize: 12, fontWeight: 600 }}>{label}</div></div></div>); })()}</div>
      {(() => { const ds = getCurrentNutritionStage(); return (<div className="card"><div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 8 }}><span style={{ fontSize: 12 }}>🔴</span><span style={{ fontSize: 11, fontWeight: 700, color: "#e94560" }}>SÈCHE — 2 300 kcal</span></div><div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>{[{ l: "Glucides", v: ds.stageInfo.macros.glucides, c: "#ffeb3b" }, { l: "Protéines", v: ds.stageInfo.macros.proteines, c: "#e94560" }, { l: "Lipides", v: ds.stageInfo.macros.lipides, c: "#4caf50" }].map((m, i) => (<div key={i}><div style={{ width: 48, height: 48, borderRadius: "50%", border: `2.5px solid ${m.c}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 4px", fontSize: 13, fontWeight: 800, fontFamily: "'Space Mono'" }}>{m.v}</div><div style={{ fontSize: 10, color: "#666" }}>{m.l}</div></div>))}</div><div style={{ textAlign: "center", marginTop: 10, fontSize: 18, fontWeight: 900, fontFamily: "'Space Mono'", color: "#e94560" }}>{ds.stageInfo.kcal.toLocaleString("fr-FR")} kcal</div></div>); })()}
    </div>
  );
}
