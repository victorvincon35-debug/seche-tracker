import { useState, useRef, useMemo } from "react";
import {
  TRAINING_SCHEDULE, EXERCISES_HAUT, EXERCISES_BAS,
  WARMUP_HAUT, WARMUP_BAS, STRETCHES, MEASUREMENTS,
  get6wDayNumber, SIX_WEEKS_DAYS, SIX_WEEKS_START, parseRestSeconds,
} from "../constants/sixweeks.js";
import { compressImage } from "../utils/helpers.js";

export default function Tab6wTraining({ data, save, selectedDate, timerPreset, setTimerPreset, setTimerSeconds, setTimerRunning }) {
  const [section, setSection] = useState("workout"); // workout | photos | mesures | etirements
  const [showWarmup, setShowWarmup] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const [expandedEx, setExpandedEx] = useState(null);
  const photoRef = useRef(null);
  const [photoType, setPhotoType] = useState("face");

  const dayNum = get6wDayNumber(selectedDate);
  const dow = new Date(selectedDate).getDay();
  const schedule = TRAINING_SCHEDULE[dow];
  const isTrainingDay = schedule.type === "haut" || schedule.type === "bas_ep";

  const exercises = schedule.type === "haut" ? EXERCISES_HAUT : schedule.type === "bas_ep" ? EXERCISES_BAS : [];
  const warmup = schedule.type === "haut" ? WARMUP_HAUT : schedule.type === "bas_ep" ? WARMUP_BAS : [];

  // Training data
  const sw = data.sixWeeks || {};
  const trainingDay = sw.training?.[selectedDate] || {};

  // Week number for measurements/photos
  const weekNum = Math.ceil(dayNum / 7);

  // Find previous session of same type for comparison
  const prevSessionDate = useMemo(() => {
    const d = new Date(selectedDate);
    for (let i = 1; i <= 14; i++) {
      d.setDate(d.getDate() - 1);
      const dk = d.toISOString().split("T")[0];
      const prevDow = d.getDay();
      const prevSched = TRAINING_SCHEDULE[prevDow];
      if (prevSched.type === schedule.type) return dk;
    }
    return null;
  }, [selectedDate, schedule.type]);

  const prevTraining = prevSessionDate ? (sw.training?.[prevSessionDate] || {}) : {};

  const updateExercise = (exId, setIdx, field, value) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.sixWeeks) nd.sixWeeks = {};
    if (!nd.sixWeeks.training) nd.sixWeeks.training = {};
    if (!nd.sixWeeks.training[selectedDate]) nd.sixWeeks.training[selectedDate] = {};
    if (!nd.sixWeeks.training[selectedDate][exId]) nd.sixWeeks.training[selectedDate][exId] = { sets: [] };
    const sets = nd.sixWeeks.training[selectedDate][exId].sets;
    while (sets.length <= setIdx) sets.push({ weight: "", reps: "", done: false });
    sets[setIdx][field] = value;
    save(nd);
  };

  const toggleSetDone = (exId, setIdx, restSec) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.sixWeeks) nd.sixWeeks = {};
    if (!nd.sixWeeks.training) nd.sixWeeks.training = {};
    if (!nd.sixWeeks.training[selectedDate]) nd.sixWeeks.training[selectedDate] = {};
    if (!nd.sixWeeks.training[selectedDate][exId]) nd.sixWeeks.training[selectedDate][exId] = { sets: [] };
    const sets = nd.sixWeeks.training[selectedDate][exId].sets;
    while (sets.length <= setIdx) sets.push({ weight: "", reps: "", done: false });
    const wasDone = sets[setIdx].done;
    sets[setIdx].done = !wasDone;
    save(nd);
    // Start rest timer when completing a set
    if (!wasDone) {
      setTimerSeconds(restSec);
      setTimerRunning(true);
    }
  };

  const updateNotes = (exId, notes) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.sixWeeks) nd.sixWeeks = {};
    if (!nd.sixWeeks.training) nd.sixWeeks.training = {};
    if (!nd.sixWeeks.training[selectedDate]) nd.sixWeeks.training[selectedDate] = {};
    if (!nd.sixWeeks.training[selectedDate][exId]) nd.sixWeeks.training[selectedDate][exId] = { sets: [] };
    nd.sixWeeks.training[selectedDate][exId].notes = notes;
    save(nd);
  };

  const toggleWarmupItem = (itemId) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.sixWeeks) nd.sixWeeks = {};
    if (!nd.sixWeeks.training) nd.sixWeeks.training = {};
    if (!nd.sixWeeks.training[selectedDate]) nd.sixWeeks.training[selectedDate] = {};
    if (!nd.sixWeeks.training[selectedDate]._warmup) nd.sixWeeks.training[selectedDate]._warmup = {};
    nd.sixWeeks.training[selectedDate]._warmup[itemId] = !nd.sixWeeks.training[selectedDate]._warmup[itemId];
    save(nd);
  };

  const toggleStretch = (stretchId) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.sixWeeks) nd.sixWeeks = {};
    if (!nd.sixWeeks.training) nd.sixWeeks.training = {};
    if (!nd.sixWeeks.training[selectedDate]) nd.sixWeeks.training[selectedDate] = {};
    if (!nd.sixWeeks.training[selectedDate]._stretches) nd.sixWeeks.training[selectedDate]._stretches = {};
    nd.sixWeeks.training[selectedDate]._stretches[stretchId] = !nd.sixWeeks.training[selectedDate]._stretches[stretchId];
    save(nd);
  };

  // Measurements
  const measurements = sw.measurements?.[`w${weekNum}`] || {};
  const updateMeasurement = (id, value) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.sixWeeks) nd.sixWeeks = {};
    if (!nd.sixWeeks.measurements) nd.sixWeeks.measurements = {};
    if (!nd.sixWeeks.measurements[`w${weekNum}`]) nd.sixWeeks.measurements[`w${weekNum}`] = {};
    nd.sixWeeks.measurements[`w${weekNum}`][id] = value;
    save(nd);
  };

  // Photos
  const photos = sw.photos?.[`w${weekNum}`] || {};
  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file, 600, 0.7);
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.sixWeeks) nd.sixWeeks = {};
    if (!nd.sixWeeks.photos) nd.sixWeeks.photos = {};
    if (!nd.sixWeeks.photos[`w${weekNum}`]) nd.sixWeeks.photos[`w${weekNum}`] = {};
    nd.sixWeeks.photos[`w${weekNum}`][photoType] = compressed;
    save(nd);
  };

  // Check progression (method Kilian): all sets at max reps → suggest weight increase
  const checkProgression = (ex) => {
    const exData = trainingDay[ex.id];
    if (!exData?.sets) return null;
    const completedSets = exData.sets.filter(s => s.done && s.reps);
    if (completedSets.length < ex.sets) return null;

    const allAtMax = completedSets.every(s => parseInt(s.reps) >= ex.repsMax);
    const twoOfThreeAtMax = completedSets.filter(s => parseInt(s.reps) >= ex.repsMax).length >= Math.ceil(ex.sets * 0.75);

    if (allAtMax) return { type: "up", msg: "Augmente +2.5kg!" };
    if (twoOfThreeAtMax) return { type: "maybe", msg: "75% au max — monter quand meme?" };
    return null;
  };

  // Recap: total volume, PRs
  const getRecap = () => {
    let totalVolume = 0;
    let totalSets = 0;
    let prs = [];

    exercises.forEach(ex => {
      const exData = trainingDay[ex.id];
      const prevExData = prevTraining[ex.id];
      if (!exData?.sets) return;

      exData.sets.forEach((s, idx) => {
        if (s.done && s.weight && s.reps) {
          const vol = parseFloat(s.weight) * parseInt(s.reps);
          totalVolume += vol;
          totalSets++;

          // Check PR vs previous
          if (prevExData?.sets?.[idx]) {
            const prevWeight = parseFloat(prevExData.sets[idx].weight) || 0;
            if (parseFloat(s.weight) > prevWeight && prevWeight > 0) {
              prs.push({ exercise: ex.label, weight: s.weight, prev: prevWeight });
            }
          }
        }
      });
    });

    return { totalVolume: Math.round(totalVolume), totalSets, prs };
  };

  // Section tabs
  const sections = [
    { id: "workout", label: "Seance", emoji: "🏋️" },
    { id: "photos", label: "Photos", emoji: "📸" },
    { id: "mesures", label: "Mesures", emoji: "📏" },
    { id: "etirements", label: "Etirements", emoji: "🧘" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Schedule for the week */}
      <div className="card" style={{ padding: 12 }}>
        <div style={{ fontSize: 11, color: "#888", marginBottom: 8, fontFamily: "'Space Mono'" }}>SEMAINE {weekNum}/6</div>
        <div style={{ display: "flex", gap: 3 }}>
          {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => {
            const dayIdx = i === 6 ? 0 : i + 1;
            const s = TRAINING_SCHEDULE[dayIdx];
            const isSelected = dayIdx === dow;
            return (
              <div key={i} style={{
                flex: 1, textAlign: "center", padding: "6px 2px", borderRadius: 8,
                background: isSelected ? `${s.color}25` : "rgba(255,255,255,.03)",
                border: isSelected ? `2px solid ${s.color}` : "1px solid transparent",
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: isSelected ? s.color : "#555" }}>{d}</div>
                <div style={{ fontSize: 8, color: isSelected ? s.color : "#444", fontWeight: 600, marginTop: 2 }}>{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's session type */}
      <div style={{
        textAlign: "center", padding: "8px 0",
        fontSize: 16, fontWeight: 900,
        color: schedule.color,
      }}>
        {schedule.emoji} {schedule.label}
      </div>

      {/* Sub-sections */}
      {isTrainingDay && (
        <div style={{ display: "flex", gap: 4, background: "#0d0d24", borderRadius: 12, padding: 3, border: "1px solid #1e1e4a" }}>
          {sections.map(s => (
            <div key={s.id} onClick={() => setSection(s.id)} style={{
              flex: 1, padding: "7px 2px", borderRadius: 10, textAlign: "center",
              cursor: "pointer", fontSize: 10, fontWeight: 700,
              background: section === s.id ? "rgba(233,69,96,.15)" : "transparent",
              color: section === s.id ? "#e94560" : "#555",
            }}>
              {s.emoji} {s.label}
            </div>
          ))}
        </div>
      )}

      {/* CARDIO DAY */}
      {schedule.type === "cardio" && (() => {
        const cardioDay = sw.training?.[selectedDate]?._cardio;
        const toggleCardio = () => {
          const nd = JSON.parse(JSON.stringify(data));
          if (!nd.sixWeeks) nd.sixWeeks = {};
          if (!nd.sixWeeks.training) nd.sixWeeks.training = {};
          if (!nd.sixWeeks.training[selectedDate]) nd.sixWeeks.training[selectedDate] = {};
          nd.sixWeeks.training[selectedDate]._cardio = !nd.sixWeeks.training[selectedDate]._cardio;
          save(nd);
        };
        return (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: "20px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>❤️</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#ff5722", marginBottom: 4 }}>Cardio fondamental</div>
              <div style={{ fontSize: 14, color: "#ccc", fontWeight: 600, marginBottom: 12 }}>45 min a 1h</div>
              <div style={{
                display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 16,
              }}>
                {["Velo", "Courir", "Sac de frappe", "Corde a sauter", "Autre"].map(opt => (
                  <span key={opt} style={{
                    padding: "5px 12px", borderRadius: 20,
                    background: "rgba(255,87,34,.1)", border: "1px solid rgba(255,87,34,.25)",
                    fontSize: 11, fontWeight: 600, color: "#ff8a65",
                  }}>
                    {opt}
                  </span>
                ))}
              </div>
              <div style={{
                padding: "10px 16px", borderRadius: 10,
                background: "rgba(255,87,34,.08)", border: "1px solid rgba(255,87,34,.2)",
                fontSize: 12, color: "#ff8a65", fontWeight: 600,
              }}>
                Zone fondamentale : tu dois pouvoir parler en pedalant/courant.
              </div>
            </div>
            {/* Toggle button */}
            <div
              onClick={toggleCardio}
              style={{
                padding: "14px 16px", textAlign: "center", cursor: "pointer",
                fontSize: 14, fontWeight: 800,
                background: cardioDay ? "rgba(76,175,80,.12)" : "rgba(255,87,34,.1)",
                color: cardioDay ? "#4caf50" : "#ff5722",
                borderTop: "1px solid rgba(255,255,255,.04)",
                transition: "all .2s",
              }}
            >
              {cardioDay ? "✓ Cardio fait !" : "Marquer comme fait"}
            </div>
          </div>
        );
      })()}

      {/* REST DAY (no training, no cardio) */}
      {!isTrainingDay && schedule.type !== "cardio" && (
        <div className="card" style={{ textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>{schedule.emoji}</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{schedule.label}</div>
          <div style={{ fontSize: 12, color: "#888" }}>Repos complet</div>
        </div>
      )}

      {/* WORKOUT SECTION */}
      {isTrainingDay && section === "workout" && (
        <>
          {/* Warmup */}
          <div className="card" style={{ padding: 12 }}>
            <div
              onClick={() => setShowWarmup(!showWarmup)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
            >
              <div style={{ fontSize: 13, fontWeight: 800 }}>
                🔥 Echauffement Kilian
              </div>
              <span style={{ fontSize: 12, color: "#555", transform: showWarmup ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }}>▼</span>
            </div>
            {showWarmup && (
              <div style={{ marginTop: 10 }}>
                {warmup.map(w => {
                  const done = trainingDay._warmup?.[w.id];
                  return (
                    <div key={w.id} className={`ci ${done ? "done" : ""}`} onClick={() => toggleWarmupItem(w.id)} style={{ padding: "8px 10px", marginBottom: 2 }}>
                      <div className="cb" style={{ width: 22, height: 22, borderRadius: 6, fontSize: 11 }}>{done ? "✓" : ""}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: done ? "#4caf50" : "#ccc" }}>{w.emoji} {w.label}</div>
                        <div style={{ fontSize: 10, color: "#555" }}>{w.sets}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Exercises */}
          {exercises.map((ex, exIdx) => {
            const exData = trainingDay[ex.id] || { sets: [] };
            const prevExData = prevTraining[ex.id] || { sets: [] };
            const isExpanded = expandedEx === ex.id;
            const completedSets = exData.sets?.filter(s => s.done).length || 0;
            const progression = checkProgression(ex);
            const restSec = parseRestSeconds(ex.rest);

            return (
              <div key={ex.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
                {/* Exercise header */}
                <div
                  onClick={() => setExpandedEx(isExpanded ? null : ex.id)}
                  style={{ padding: "14px 16px", cursor: "pointer" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontSize: 20 }}>{ex.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 800 }}>{ex.label}</div>
                      <div style={{ fontSize: 10, color: "#888" }}>
                        {ex.sets}x{ex.repsMin}-{ex.repsMax} · {ex.rest} · <span style={{ color: "#555" }}>{ex.muscle}</span>
                      </div>
                    </div>
                    <div style={{
                      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                      fontFamily: "'Space Mono'",
                      background: completedSets === ex.sets ? "rgba(76,175,80,.15)" : "rgba(255,255,255,.05)",
                      color: completedSets === ex.sets ? "#4caf50" : "#888",
                    }}>
                      {completedSets}/{ex.sets}
                    </div>
                  </div>

                  {/* Progression alert */}
                  {progression && (
                    <div style={{
                      marginTop: 8, padding: "6px 10px", borderRadius: 8,
                      background: progression.type === "up" ? "rgba(76,175,80,.12)" : "rgba(255,152,0,.12)",
                      border: `1px solid ${progression.type === "up" ? "rgba(76,175,80,.3)" : "rgba(255,152,0,.3)"}`,
                      fontSize: 11, fontWeight: 700,
                      color: progression.type === "up" ? "#4caf50" : "#ff9800",
                    }}>
                      📈 {progression.msg}
                    </div>
                  )}
                </div>

                {/* Expanded: sets detail */}
                {isExpanded && (
                  <div style={{ padding: "0 16px 14px", borderTop: "1px solid rgba(255,255,255,.04)" }}>
                    {/* Column headers */}
                    <div style={{ display: "flex", gap: 6, padding: "8px 0 4px", alignItems: "center" }}>
                      <div style={{ width: 36, fontSize: 9, color: "#555", textAlign: "center" }}>Serie</div>
                      <div style={{ flex: 1, fontSize: 9, color: "#555", textAlign: "center" }}>Poids (kg)</div>
                      <div style={{ flex: 1, fontSize: 9, color: "#555", textAlign: "center" }}>Reps</div>
                      <div style={{ width: 60, fontSize: 9, color: "#555", textAlign: "center" }}>Prev</div>
                      <div style={{ width: 44 }} />
                    </div>

                    {/* Series rows */}
                    {Array.from({ length: ex.sets }).map((_, setIdx) => {
                      const setData = exData.sets?.[setIdx] || {};
                      const prevSet = prevExData.sets?.[setIdx] || {};
                      const isDone = setData.done;

                      // Pre-fill weight from progression
                      const suggestedWeight = progression?.type === "up" && prevSet.weight
                        ? (parseFloat(prevSet.weight) + 2.5).toString()
                        : prevSet.weight || "";

                      return (
                        <div key={setIdx} style={{
                          display: "flex", gap: 6, alignItems: "center", padding: "4px 0",
                          opacity: isDone ? 0.6 : 1,
                        }}>
                          <div style={{
                            width: 36, height: 28, borderRadius: 8,
                            background: isDone ? "rgba(76,175,80,.15)" : "rgba(255,255,255,.04)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 12, fontWeight: 800, fontFamily: "'Space Mono'",
                            color: isDone ? "#4caf50" : "#666",
                          }}>
                            {setIdx + 1}
                          </div>

                          <input
                            type="number"
                            placeholder={suggestedWeight || "kg"}
                            value={setData.weight || ""}
                            onChange={e => updateExercise(ex.id, setIdx, "weight", e.target.value)}
                            style={{ flex: 1, width: "auto", padding: "6px 4px", fontSize: 13, textAlign: "center" }}
                          />

                          <input
                            type="number"
                            placeholder={`${ex.repsMin}-${ex.repsMax}`}
                            value={setData.reps || ""}
                            onChange={e => updateExercise(ex.id, setIdx, "reps", e.target.value)}
                            style={{ flex: 1, width: "auto", padding: "6px 4px", fontSize: 13, textAlign: "center" }}
                          />

                          {/* Previous session */}
                          <div style={{ width: 60, fontSize: 9, color: "#444", textAlign: "center", fontFamily: "'Space Mono'" }}>
                            {prevSet.weight && prevSet.reps
                              ? `${prevSet.weight}×${prevSet.reps}`
                              : "—"}
                          </div>

                          {/* Done button */}
                          <div
                            onClick={() => toggleSetDone(ex.id, setIdx, restSec)}
                            style={{
                              width: 44, height: 32, borderRadius: 8,
                              background: isDone ? "linear-gradient(135deg,#4caf50,#2e7d32)" : "rgba(233,69,96,.12)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              cursor: "pointer", fontSize: 12, fontWeight: 800,
                              color: isDone ? "white" : "#e94560",
                              transition: "all .2s",
                            }}
                          >
                            {isDone ? "✓" : "GO"}
                          </div>
                        </div>
                      );
                    })}

                    {/* Notes */}
                    <textarea
                      placeholder="Notes..."
                      value={exData.notes || ""}
                      onChange={e => updateNotes(ex.id, e.target.value)}
                      style={{
                        marginTop: 8, width: "100%", padding: "8px 10px",
                        background: "#0a0a1a", border: "1px solid #1e1e4a",
                        borderRadius: 10, color: "#aaa", fontSize: 11,
                        resize: "vertical", minHeight: 36, boxSizing: "border-box",
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* Recap button */}
          <div
            onClick={() => setShowRecap(!showRecap)}
            style={{
              padding: "12px 20px", borderRadius: 14, textAlign: "center",
              background: "linear-gradient(135deg,#e94560,#c23152)",
              cursor: "pointer", fontSize: 14, fontWeight: 800,
            }}
          >
            {showRecap ? "Masquer le recap" : "Voir le recap de seance"}
          </div>

          {/* Recap */}
          {showRecap && (() => {
            const recap = getRecap();
            return (
              <div className="card">
                <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 12 }}>Recap Seance</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  <div style={{ background: "rgba(255,255,255,.03)", borderRadius: 12, padding: 12, textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: "#888" }}>Volume total</div>
                    <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "'Space Mono'", color: "#e94560" }}>
                      {recap.totalVolume.toLocaleString()} <span style={{ fontSize: 10, color: "#666" }}>kg</span>
                    </div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,.03)", borderRadius: 12, padding: 12, textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: "#888" }}>Series faites</div>
                    <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "'Space Mono'", color: "#4a90d9" }}>
                      {recap.totalSets}
                    </div>
                  </div>
                </div>
                {recap.prs.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#ffeb3b", marginBottom: 6 }}>🏆 PRs battus!</div>
                    {recap.prs.map((pr, i) => (
                      <div key={i} style={{ fontSize: 11, color: "#ccc", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
                        {pr.exercise}: <span style={{ fontFamily: "'Space Mono'", color: "#4caf50" }}>{pr.weight}kg</span>
                        <span style={{ color: "#666" }}> (prev: {pr.prev}kg)</span>
                      </div>
                    ))}
                  </div>
                )}
                {recap.prs.length === 0 && recap.totalSets > 0 && (
                  <div style={{ fontSize: 11, color: "#666", textAlign: "center" }}>
                    Pas de PR aujourd'hui — la prochaine fois!
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}

      {/* ETIREMENTS SECTION */}
      {isTrainingDay && section === "etirements" && (
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>🧘 Etirements post-seance</div>
          {STRETCHES.map(st => {
            const done = trainingDay._stretches?.[st.id];
            return (
              <div key={st.id} className={`ci ${done ? "done" : ""}`} onClick={() => toggleStretch(st.id)} style={{ marginBottom: 2 }}>
                <div className="cb">{done ? "✓" : ""}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{st.emoji} {st.label}</div>
                  <div style={{ fontSize: 10, color: "#888" }}>{st.duration}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PHOTOS SECTION */}
      {isTrainingDay && section === "photos" && (
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>📸 Photos Semaine {weekNum}</div>
          <div style={{ fontSize: 10, color: "#888", marginBottom: 16 }}>Face, Profil, Dos — 1 fois par semaine</div>

          <input ref={photoRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{ display: "none" }} />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {["face", "profil", "dos"].map(type => (
              <div key={type} style={{ textAlign: "center" }}>
                <div
                  onClick={() => { setPhotoType(type); photoRef.current?.click(); }}
                  style={{
                    width: "100%", aspectRatio: "3/4", borderRadius: 12,
                    background: photos[type] ? `url(${photos[type]}) center/cover` : "rgba(255,255,255,.04)",
                    border: photos[type] ? "2px solid #4caf50" : "2px dashed #2a2a4a",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", fontSize: photos[type] ? 0 : 24, color: "#555",
                  }}
                >
                  {!photos[type] && "📷"}
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#888", marginTop: 4, textTransform: "capitalize" }}>
                  {type}
                </div>
              </div>
            ))}
          </div>

          {/* Photo history / comparison */}
          {weekNum > 1 && (
            <div style={{ marginTop: 16, padding: "12px 0", borderTop: "1px solid rgba(255,255,255,.04)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 8 }}>Galerie</div>
              <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                {Array.from({ length: weekNum }).map((_, wIdx) => {
                  const wk = `w${wIdx + 1}`;
                  const wPhotos = sw.photos?.[wk] || {};
                  const hasAny = wPhotos.face || wPhotos.profil || wPhotos.dos;
                  return hasAny ? (
                    <div key={wk} style={{ flexShrink: 0, textAlign: "center" }}>
                      <div style={{
                        width: 48, height: 64, borderRadius: 8,
                        background: wPhotos.face ? `url(${wPhotos.face}) center/cover` : "rgba(255,255,255,.04)",
                        border: "1px solid #2a2a4a",
                      }} />
                      <div style={{ fontSize: 8, color: "#555", marginTop: 2 }}>S{wIdx + 1}</div>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MESURES SECTION */}
      {isTrainingDay && section === "mesures" && (
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>📏 Mensurations Semaine {weekNum}</div>
          <div style={{ fontSize: 10, color: "#888", marginBottom: 16 }}>Hebdomadaire</div>

          {MEASUREMENTS.map(m => {
            const prev = weekNum > 1 ? sw.measurements?.[`w${weekNum - 1}`]?.[m.id] : null;
            const current = measurements[m.id] || "";
            const delta = current && prev ? (parseFloat(current) - parseFloat(prev)).toFixed(1) : null;
            return (
              <div key={m.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 0",
                borderBottom: "1px solid rgba(255,255,255,.04)",
              }}>
                <span style={{ fontSize: 18 }}>{m.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{m.label}</div>
                  {prev && (
                    <div style={{ fontSize: 9, color: "#555" }}>Sem. prec: {prev} {m.unit}</div>
                  )}
                </div>
                <input
                  type="number"
                  step="0.1"
                  placeholder={m.unit}
                  value={current}
                  onChange={e => updateMeasurement(m.id, e.target.value)}
                  style={{ width: 70, padding: "6px 4px", fontSize: 13, textAlign: "center" }}
                />
                {delta !== null && (
                  <div style={{
                    fontSize: 10, fontFamily: "'Space Mono'", fontWeight: 700,
                    color: parseFloat(delta) < 0 ? "#4caf50" : parseFloat(delta) > 0 ? "#e94560" : "#888",
                  }}>
                    {parseFloat(delta) > 0 ? "+" : ""}{delta}
                  </div>
                )}
              </div>
            );
          })}

          {/* Mini evolution graph (text-based) */}
          {weekNum > 1 && (
            <div style={{ marginTop: 16, padding: "12px 0", borderTop: "1px solid rgba(255,255,255,.04)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 8 }}>Evolution</div>
              {MEASUREMENTS.map(m => {
                const values = [];
                for (let w = 1; w <= weekNum; w++) {
                  const v = sw.measurements?.[`w${w}`]?.[m.id];
                  if (v) values.push({ week: w, val: parseFloat(v) });
                }
                if (values.length < 2) return null;
                const min = Math.min(...values.map(v => v.val));
                const max = Math.max(...values.map(v => v.val));
                const range = max - min || 1;
                return (
                  <div key={m.id} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, color: "#666", marginBottom: 4 }}>{m.emoji} {m.label}</div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 32 }}>
                      {values.map(v => (
                        <div key={v.week} style={{
                          flex: 1,
                          height: `${Math.max(15, ((v.val - min) / range) * 100)}%`,
                          background: "linear-gradient(180deg,#e94560,#c23152)",
                          borderRadius: 3,
                          position: "relative",
                        }}>
                          <div style={{
                            position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)",
                            fontSize: 8, color: "#888", whiteSpace: "nowrap", fontFamily: "'Space Mono'",
                          }}>
                            {v.val}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 3, marginTop: 2 }}>
                      {values.map(v => (
                        <div key={v.week} style={{ flex: 1, textAlign: "center", fontSize: 7, color: "#444" }}>S{v.week}</div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
