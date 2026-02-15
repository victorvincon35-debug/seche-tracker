import { SPORT_DAYS, ABS_CIRCUIT, WARMUP_HDC, WARMUP_BDC, REST_PRESETS } from "../constants/sport.js";

export default function TabSport({ dayData, selectedDate, toggleSportSeries, setSportReps, toggleSportBlock, setSportNotes, timerPreset, setTimerPreset, setTimerSeconds, setTimerRunning }) {
  const dow = new Date(selectedDate).getDay();
  const session = SPORT_DAYS[dow];
  const sportData = dayData.sport || {};
  const isMuscu = session.type === "muscu";
  const dayNames = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];

  // Group exercises into supersets for muscu
  const groupedExercises = [];
  if (isMuscu && session.exercises) {
    const used = new Set();
    for (const ex of session.exercises) {
      if (used.has(ex.id)) continue;
      const group = [ex];
      used.add(ex.id);
      if (ex.superset) {
        let next = session.exercises.find(e => e.id === ex.superset);
        while (next && !used.has(next.id)) {
          group.push(next);
          used.add(next.id);
          next = next.superset ? session.exercises.find(e => e.id === next.superset) : null;
        }
      }
      groupedExercises.push(group);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* WEEK OVERVIEW */}
      <div className="card" style={{ padding: 12 }}>
        <div style={{ display: "flex", gap: 4, justifyContent: "space-between" }}>
          {[1,2,3,4,5,6,0].map(d => {
            const s = SPORT_DAYS[d];
            const isToday = d === dow;
            return (
              <div key={d} style={{ flex: 1, textAlign: "center", padding: "8px 2px", borderRadius: 12,
                background: isToday ? "rgba(233,69,96,.15)" : "transparent",
                border: isToday ? "1px solid #e94560" : "1px solid transparent",
              }}>
                <div style={{ fontSize: 9, color: isToday ? "#e94560" : "#555", fontWeight: 700 }}>{dayNames[d]}</div>
                <div style={{ fontSize: 14, marginTop: 2 }}>{s.emoji}</div>
                <div style={{ fontSize: 7, color: isToday ? "#fff" : "#444", marginTop: 2 }}>{s.label.split(" ")[0]}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SESSION HEADER */}
      <div className="card" style={{ background: "linear-gradient(145deg,#1a0a2e,#0d0d24)", border: "1px solid #2a1a4a", textAlign: "center", padding: "20px 16px" }}>
        <div style={{ fontSize: 36 }}>{session.emoji}</div>
        <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>{session.label}</div>
        <div style={{ fontSize: 12, color: "#888" }}>{session.subtitle}</div>
        {!isMuscu && (<div style={{ marginTop: 8 }}><span style={{ background: "linear-gradient(135deg,#e94560,#c23152)", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, fontFamily: "'Space Mono'" }}>{session.totalDistance}m</span></div>)}
        {!isMuscu && session.info && <div style={{ marginTop: 8, fontSize: 11, color: "#666" }}>{session.info}</div>}
      </div>

      {/* WARMUP CIRCUIT */}
      {isMuscu && session.warmup && (() => {
        const warmupItems = session.warmup === "hdc" ? WARMUP_HDC : WARMUP_BDC;
        const warmupLabel = session.warmup === "hdc" ? "Haut du Corps" : "Bas du Corps";
        const warmupPasses = "3 passages sans récup";
        return (
          <div className="card" style={{ padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 20 }}>🔥</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>Circuit Échauffement</div>
                <div style={{ fontSize: 10, color: "#888" }}>{warmupLabel} — {warmupPasses}</div>
              </div>
            </div>
            {warmupItems.map(item => {
              const done = sportData.exercises?.[item.id]?.series?.[0] || false;
              return (
                <div key={item.id}>
                  <div className={`ci ${done ? "done" : ""}`} onClick={() => toggleSportSeries(item.id, 0)} style={{ padding: "10px 14px" }}>
                    <div className="cb">{done ? "✓" : ""}</div>
                    <span style={{ fontSize: 16 }}>{item.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 12, fontWeight: done ? 600 : 400 }}>{item.label}</span>
                      <div style={{ fontSize: 10, color: "#888" }}>{item.reps}</div>
                    </div>
                  </div>
                  {item.image && <img src={`/exercises/${item.image}`} alt={item.label} style={{ width: "100%", maxHeight: 180, objectFit: "contain", borderRadius: 8, marginBottom: 6, background: "#0a0a1a" }} />}
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* ABS CIRCUIT */}
      {isMuscu && session.hasAbsCircuit && (
        <div className="card" style={{ padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>🔥</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>Circuit Abdos</div>
              <div style={{ fontSize: 10, color: "#888" }}>3 passages — 1 min récup</div>
            </div>
          </div>
          {ABS_CIRCUIT.map(ab => {
            const done = sportData.exercises?.[ab.id]?.series?.[0] || false;
            return (
              <div key={ab.id}>
                <div className={`ci ${done ? "done" : ""}`} onClick={() => toggleSportSeries(ab.id, 0)} style={{ padding: "10px 14px" }}>
                  <div className="cb">{done ? "✓" : ""}</div>
                  <span style={{ fontSize: 16 }}>{ab.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 12, fontWeight: done ? 600 : 400 }}>{ab.label}</span>
                    <div style={{ fontSize: 10, color: "#888" }}>{ab.reps}</div>
                  </div>
                </div>
                {ab.image && <img src={`/exercises/${ab.image}`} alt={ab.label} style={{ width: "100%", maxHeight: 180, objectFit: "contain", borderRadius: 8, marginBottom: 6, background: "#0a0a1a" }} />}
              </div>
            );
          })}
        </div>
      )}

      {/* MUSCULATION EXERCISES */}
      {isMuscu && groupedExercises.map((group, gi) => {
        const isSuperset = group.length > 1;
        return (
          <div key={gi} className="card" style={{ padding: 14 }}>
            {isSuperset && (
              <div style={{ fontSize: 10, fontWeight: 700, color: "#e94560", marginBottom: 8, letterSpacing: 1 }}>
                🔄 SUPERSET {gi + 1}
              </div>
            )}
            {group.map(ex => {
              const exData = sportData.exercises?.[ex.id] || { series: [], reps: [] };
              const doneCount = (exData.series || []).filter(Boolean).length;
              return (
                <div key={ex.id} style={{ marginBottom: group.indexOf(ex) < group.length - 1 ? 14 : 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 18 }}>{ex.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{ex.label}</div>
                      <div style={{ fontSize: 10, color: "#888" }}>
                        {ex.series}×{ex.reps}{ex.tempo ? ` — ${ex.tempo}` : ""} — {ex.rest}s récup
                        {doneCount > 0 && <span style={{ color: doneCount === ex.series ? "#4caf50" : "#e94560", fontWeight: 700 }}> {doneCount}/{ex.series}</span>}
                      </div>
                    </div>
                    {doneCount === ex.series && <span style={{ fontSize: 16 }}>✅</span>}
                  </div>
                  {ex.image && <img src={`/exercises/${ex.image}`} alt={ex.label} style={{ width: "100%", maxHeight: 180, objectFit: "contain", borderRadius: 8, marginBottom: 8, background: "#0a0a1a" }} />}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {[...Array(ex.series)].map((_, i) => {
                      const done = exData.series?.[i] || false;
                      return (
                        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                          <div onClick={() => toggleSportSeries(ex.id, i)} style={{
                            width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", background: done ? "linear-gradient(135deg,#4caf50,#2e7d32)" : "#0a0a1a",
                            border: `2px solid ${done ? "#4caf50" : "#2a2a4a"}`, fontSize: 13, fontWeight: 800,
                            fontFamily: "'Space Mono'", color: done ? "#fff" : "#555", transition: "all .2s",
                          }}>
                            {done ? "✓" : `S${i + 1}`}
                          </div>
                          <input type="number" placeholder={ex.reps.split("-")[0] || "-"} value={exData.reps?.[i] || ""}
                            onChange={e => setSportReps(ex.id, i, e.target.value)}
                            style={{ width: 44, padding: "4px 2px", borderRadius: 8, background: "#0a0a1a",
                              border: "1px solid #1e1e4a", color: "#fff", fontSize: 11, textAlign: "center", fontFamily: "'Space Mono'" }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* NATATION BLOCKS */}
      {!isMuscu && (
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>🏊 Programme</div>
          {session.blocks.map(block => {
            const done = sportData.blocks?.[block.id] || false;
            return (
              <div key={block.id} className={`ci ${done ? "done" : ""}`} onClick={() => toggleSportBlock(block.id)}>
                <div className="cb">{done ? "✓" : ""}</div>
                <span style={{ fontSize: 18 }}>{block.emoji}</span>
                <span style={{ flex: 1, fontSize: 13 }}>{block.label}</span>
                <span style={{ fontSize: 11, fontFamily: "'Space Mono'", color: done ? "#4caf50" : "#555" }}>{block.distance}m</span>
              </div>
            );
          })}
        </div>
      )}

      {/* NATATION PROGRESS */}
      {!isMuscu && (() => {
        const completedDist = session.blocks.filter(b => sportData.blocks?.[b.id]).reduce((sum, b) => sum + b.distance, 0);
        return (
          <div className="card" style={{ padding: 14, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>Distance</div>
            <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "'Space Mono'", color: completedDist >= session.totalDistance ? "#4caf50" : "#e94560" }}>
              {completedDist}<span style={{ fontSize: 14, color: "#555" }}>/{session.totalDistance}m</span>
            </div>
            <div style={{ height: 6, background: "#0a0a1a", borderRadius: 3, marginTop: 8, overflow: "hidden" }}>
              <div style={{ width: `${Math.min((completedDist / session.totalDistance) * 100, 100)}%`, height: "100%",
                background: "linear-gradient(90deg,#4caf50,#2e7d32)", borderRadius: 3, transition: "width .5s" }} />
            </div>
          </div>
        );
      })()}

      {/* REST TIMER CONTROLS */}
      {isMuscu && (
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>⏱️ Chrono récup</div>
          <div style={{ display: "flex", gap: 6 }}>
            {REST_PRESETS.map(p => (
              <div key={p.seconds} onClick={() => setTimerPreset(p.seconds)} style={{
                flex: 1, padding: "8px 0", borderRadius: 10, textAlign: "center", cursor: "pointer",
                fontSize: 13, fontWeight: 700, fontFamily: "'Space Mono'",
                background: timerPreset === p.seconds ? "rgba(233,69,96,.15)" : "#0a0a1a",
                border: `1px solid ${timerPreset === p.seconds ? "#e94560" : "#1e1e4a"}`,
                color: timerPreset === p.seconds ? "#e94560" : "#555",
              }}>{p.label}</div>
            ))}
            <div onClick={() => { setTimerSeconds(timerPreset); setTimerRunning(true); }} style={{
              flex: 1, padding: "8px 0", borderRadius: 10, textAlign: "center", cursor: "pointer",
              fontSize: 13, fontWeight: 700, background: "linear-gradient(135deg,#e94560,#c23152)", color: "#fff",
            }}>GO</div>
          </div>
        </div>
      )}

      {/* NOTES */}
      <div className="card" style={{ padding: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>📝 Notes</div>
        <textarea value={sportData.notes || ""} onChange={e => setSportNotes(e.target.value)}
          placeholder="Poids utilisés, sensations..."
          style={{ width: "100%", minHeight: 60, background: "#0a0a1a", border: "1px solid #1e1e4a",
            borderRadius: 10, color: "#fff", padding: 10, fontSize: 12, fontFamily: "'Outfit'",
            resize: "vertical", outline: "none", boxSizing: "border-box" }}
        />
      </div>

    </div>
  );
}
