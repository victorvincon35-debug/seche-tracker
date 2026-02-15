import { SYMPTOMS, NATURO } from "../constants/symptoms.js";
import { getWeekNumber } from "../utils/helpers.js";

export default function TabHealth({ dayData, weekData, selectedDate, setSymptom, setNaturo, setTemp, programNotStarted, daysUntilProgram }) {
  if (programNotStarted) return (
    <div className="card" style={{ textAlign: "center", padding: "32px 20px" }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>🚀</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#ffeb3b" }}>Début dans {daysUntilProgram} jour{daysUntilProgram > 1 ? "s" : ""}</div>
      <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Lundi 23 Février 2026</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>🌡️ Température — Ray Peat</div>
        {[
          { id: "reveil", label: "🌅 Réveil", norm: "36.6-37.0", lo: 36.6, hi: 37.0, warnLo: 36.4 },
          { id: "apres_repas", label: "🍳 Après repas", norm: "36.8-37.2", lo: 36.8, hi: 37.2, warnLo: 36.6 },
          { id: "aprem", label: "🌆 Fin aprem", norm: "36.8-37.2", lo: 36.8, hi: 37.2, warnLo: 36.6 },
        ].map(slot => {
          const val = dayData.temp?.[slot.id] || "";
          const n = parseFloat(val);
          let st = "", sc = "#555";
          if (val && !isNaN(n)) {
            if (n >= slot.lo && n <= slot.hi) { st = "✅"; sc = "#4caf50"; }
            else if (n < slot.warnLo) { st = "⚠️"; sc = "#e94560"; }
            else if (n < slot.lo) { st = "🟡"; sc = "#ff9800"; }
            else { st = "🔴"; sc = "#e94560"; }
          }
          return (
            <div key={slot.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0", borderBottom: "1px solid #111" }}>
              <span style={{ fontSize: 12, flex: 1 }}>{slot.label} <span style={{ color: "#4caf50", fontSize: 10 }}>({slot.norm})</span></span>
              <input type="number" step="0.1" min="35" max="39" value={val} placeholder="36.8" onChange={e => setTemp(slot.id, e.target.value)} style={{ width: 72 }} />
              <span style={{ fontSize: 12, color: sc, minWidth: 24 }}>{st}</span>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>⚠️ Symptômes — S{getWeekNumber(selectedDate)}</div>
        <div style={{ fontSize: 10, color: "#555", marginBottom: 10 }}>0 = catastrophe → 10 = excellent</div>
        {SYMPTOMS.map((s, i) => {
          const val = weekData.symptoms?.[s] ?? "";
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 0", borderBottom: "1px solid #0d0d24" }}>
              <span style={{ flex: 1, fontSize: 11 }}>{s}</span>
              <div style={{ display: "flex", gap: 2 }}>
                {[...Array(11)].map((_, n) => (
                  <div key={n} onClick={() => setSymptom(s, n)} style={{
                    width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "'Space Mono'",
                    background: val === n ? (n >= 7 ? "#2e7d32" : n >= 4 ? "#e65100" : "#c62828") : "#0a0a1a",
                    color: val === n ? "#fff" : "#444",
                    border: `1px solid ${val === n ? "transparent" : "#1e1e4a"}`
                  }}>{n}</div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>🌿 Naturopathie — S{getWeekNumber(selectedDate)}</div>
        {NATURO.map((n, i) => {
          const val = weekData.naturo?.[n.id] || "";
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #0d0d24" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12 }}>{n.label}</div>
                <div style={{ fontSize: 9, color: "#4caf50" }}>✓ {n.good}</div>
              </div>
              <input type="text" value={val} placeholder="..." onChange={e => setNaturo(n.id, e.target.value)}
                style={{ background: "#0a0a1a", border: "1px solid #1e1e4a", borderRadius: 8, color: "white", padding: "6px 8px", fontSize: 11, width: 110, fontFamily: "'Outfit'" }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
