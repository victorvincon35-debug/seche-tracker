import { useState } from "react";
import { EVENT_COLORS } from "../constants/planning.js";
import { getToday } from "../utils/helpers.js";

const selectStyle = {
  background: "#0a0a1a", border: "1px solid #2a2a4a", borderRadius: 8,
  color: "white", padding: "8px 10px", fontSize: 13, fontFamily: "'Space Mono'",
  outline: "none", flex: 1, WebkitAppearance: "none", appearance: "none", colorScheme: "dark",
};

export default function EventModal({ event, onSave, onDelete, onClose }) {
  const [title, setTitle] = useState(event.title || "");
  const [date, setDate] = useState(event.date || getToday());
  const [startH, setStartH] = useState(event.startH ?? 9);
  const [startM, setStartM] = useState(event.startM ?? 0);
  const [endH, setEndH] = useState(event.endH ?? 10);
  const [endM, setEndM] = useState(event.endM ?? 0);
  const [color, setColor] = useState(event.color || EVENT_COLORS[0].hex);
  const [notes, setNotes] = useState(event.notes || "");
  const [recurrenceType, setRecurrenceType] = useState(event.recurrence?.type || "none");
  const [recurrenceDays, setRecurrenceDays] = useState(event.recurrence?.days || []);

  const isSingleEdit = event._editMode === "single";

  const weeklyDayLabel = (() => {
    const d = new Date(date || getToday());
    return ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"][d.getDay()];
  })();

  const handleSave = () => {
    if (!title.trim()) return;
    let sH = parseInt(startH), sM = parseInt(startM);
    let eH = parseInt(endH), eM = parseInt(endM);
    if (eH * 60 + eM <= sH * 60 + sM) { eH = Math.min(sH + 1, 23); eM = sM; }
    const result = { ...(event.id ? { id: event.id } : {}), title: title.trim(), date, startH: sH, startM: sM, endH: eH, endM: eM, color, notes };
    if (isSingleEdit) {
      result._editMode = "single";
      result._occurrenceDate = event._occurrenceDate;
    } else {
      if (recurrenceType !== "none") {
        result.recurrence = { type: recurrenceType };
        if (recurrenceType === "custom") result.recurrence.days = recurrenceDays;
      } else {
        result.recurrence = null;
      }
    }
    onSave(result);
  };

  const hourOptions = Array.from({ length: 18 }, (_, i) => i + 6);
  const minuteOptions = [0, 15, 30, 45];
  const dayToggleNames = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];

  const toggleCustomDay = (dayIdx) => {
    setRecurrenceDays(prev => prev.includes(dayIdx) ? prev.filter(d => d !== dayIdx) : [...prev, dayIdx]);
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "linear-gradient(145deg,#0d0d24,#151535)", border: "1px solid #1e1e4a", borderRadius: 20, padding: 20, width: "100%", maxWidth: 360, maxHeight: "85vh", overflowY: "auto", animation: "slideUp .3s ease" }}>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>{event.isNew ? "Nouvel événement" : "Modifier l'événement"}</div>

        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre" autoFocus
          style={{ width: "100%", padding: "12px 14px", marginBottom: 12, borderRadius: 12, border: "1px solid #2a2a4a", background: "#0a0a1a", color: "white", fontSize: 14, fontFamily: "'Outfit'", outline: "none", boxSizing: "border-box" }} />

        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ width: "100%", padding: "10px 14px", marginBottom: 12, borderRadius: 12, border: "1px solid #2a2a4a", background: "#0a0a1a", color: "white", fontSize: 13, fontFamily: "'Outfit'", outline: "none", boxSizing: "border-box", colorScheme: "dark" }} />

        <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: "#555", marginBottom: 4 }}>Début</div>
            <div style={{ display: "flex", gap: 4 }}>
              <select value={startH} onChange={e => setStartH(parseInt(e.target.value))} style={selectStyle}>
                {hourOptions.map(h => <option key={h} value={h}>{String(h).padStart(2,"0")}</option>)}
              </select>
              <span style={{ color: "#555", lineHeight: "36px" }}>:</span>
              <select value={startM} onChange={e => setStartM(parseInt(e.target.value))} style={selectStyle}>
                {minuteOptions.map(m => <option key={m} value={m}>{String(m).padStart(2,"0")}</option>)}
              </select>
            </div>
          </div>
          <span style={{ color: "#555", paddingTop: 18 }}>→</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: "#555", marginBottom: 4 }}>Fin</div>
            <div style={{ display: "flex", gap: 4 }}>
              <select value={endH} onChange={e => setEndH(parseInt(e.target.value))} style={selectStyle}>
                {hourOptions.map(h => <option key={h} value={h}>{String(h).padStart(2,"0")}</option>)}
              </select>
              <span style={{ color: "#555", lineHeight: "36px" }}>:</span>
              <select value={endM} onChange={e => setEndM(parseInt(e.target.value))} style={selectStyle}>
                {minuteOptions.map(m => <option key={m} value={m}>{String(m).padStart(2,"0")}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "#555", marginBottom: 6 }}>Couleur</div>
          <div style={{ display: "flex", gap: 8 }}>
            {EVENT_COLORS.map(c => (
              <div key={c.id} onClick={() => setColor(c.hex)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: c.hex, border: color === c.hex ? "3px solid #fff" : "3px solid transparent", transition: "all .15s" }} />
                <div style={{ fontSize: 8, color: color === c.hex ? "#fff" : "#444" }}>{c.label}</div>
              </div>
            ))}
          </div>
        </div>

        {!isSingleEdit && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: "#555", marginBottom: 6 }}>Répéter</div>
            <select value={recurrenceType} onChange={e => setRecurrenceType(e.target.value)}
              style={{ ...selectStyle, width: "100%", marginBottom: recurrenceType === "custom" ? 8 : 0 }}>
              <option value="none">Ne pas répéter</option>
              <option value="daily">Tous les jours</option>
              <option value="weekly">Toutes les semaines ({weeklyDayLabel})</option>
              <option value="biweekly">Toutes les 2 semaines ({weeklyDayLabel})</option>
              <option value="monthly">Tous les mois</option>
              <option value="weekdays">Du lundi au vendredi</option>
              <option value="custom">Personnalisé</option>
            </select>
            {recurrenceType === "custom" && (
              <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                {dayToggleNames.map((name, i) => (
                  <div key={i} onClick={() => toggleCustomDay(i)}
                    style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 700, cursor: "pointer", transition: "all .15s",
                      background: recurrenceDays.includes(i) ? "rgba(233,69,96,.2)" : "#0a0a1a",
                      border: `1px solid ${recurrenceDays.includes(i) ? "#e94560" : "#2a2a4a"}`,
                      color: recurrenceDays.includes(i) ? "#e94560" : "#555" }}>
                    {name}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optionnel)"
          style={{ width: "100%", minHeight: 50, marginBottom: 16, background: "#0a0a1a", border: "1px solid #2a2a4a", borderRadius: 12, color: "#fff", padding: 12, fontSize: 12, fontFamily: "'Outfit'", resize: "vertical", outline: "none", boxSizing: "border-box" }} />

        <div style={{ display: "flex", gap: 8 }}>
          {!event.isNew && (
            <button onClick={() => onDelete(event)} style={{ padding: "12px 16px", borderRadius: 12, border: "none", background: "rgba(233,69,96,.15)", color: "#e94560", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit'" }}>Supprimer</button>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #2a2a4a", background: "transparent", color: "#888", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit'" }}>Annuler</button>
          <button onClick={handleSave} style={{ padding: "12px 20px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#e94560,#c23152)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit'", opacity: title.trim() ? 1 : 0.5 }}>{event.isNew ? "Créer" : "Modifier"}</button>
        </div>
      </div>
    </div>
  );
}
