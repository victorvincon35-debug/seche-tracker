import { useState, useEffect, useRef } from "react";
import { WARMUP_UPPER, WARMUP_LOWER, WARMUP_CARDIO, UPPER_EXERCISES, LOWER_EXERCISES, CARDIO_OPTIONS, CARDIO_RULES, PROGRESSION_PHASES, PROGRESSION_TABLE, SPORT1_DAYS, FORBIDDEN_EXERCISES } from "../constants/sport1.js";

export default function TabSport1({ data, save, selectedDate, timerPreset, setTimerPreset, setTimerSeconds, setTimerRunning }) {
  const [selectedCardio, setSelectedCardio] = useState(null);
  const [showProgression, setShowProgression] = useState(false);
  const [showForbidden, setShowForbidden] = useState(false);
  const [warmupTimer, setWarmupTimer] = useState(0);
  const [warmupTimerRunning, setWarmupTimerRunning] = useState(false);
  const [activeWarmupId, setActiveWarmupId] = useState(null);
  const warmupTimerRef = useRef(null);

  const dow = new Date(selectedDate).getDay();
  const session = SPORT1_DAYS[dow];
  const sport1Data = data.days[selectedDate]?.sport1 || {};
  const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

  // Get warmup exercises for current session type
  const warmupExercises = session.type === "upper" ? WARMUP_UPPER
    : session.type === "lower" ? WARMUP_LOWER
    : session.type === "cardio" ? WARMUP_CARDIO
    : [];

  // Check if warmup is complete
  const warmupData = sport1Data.warmup || {};
  const warmupDoneCount = warmupExercises.filter(e => warmupData[e.id]).length;
  const warmupComplete = sport1Data.warmupComplete || false;

  // Warmup timer
  useEffect(() => {
    if (warmupTimerRunning && warmupTimer > 0) {
      warmupTimerRef.current = setTimeout(() => setWarmupTimer(t => t - 1), 1000);
    } else if (warmupTimerRunning && warmupTimer <= 0) {
      setWarmupTimerRunning(false);
      setActiveWarmupId(null);
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 660; gain.gain.value = 0.2;
        osc.start(); gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0, ctx.currentTime + 0.45);
        osc.stop(ctx.currentTime + 0.5);
      } catch (e) { /* no audio */ }
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
    return () => clearTimeout(warmupTimerRef.current);
  }, [warmupTimerRunning, warmupTimer]);

  const exercises = session.type === "upper" ? UPPER_EXERCISES : session.type === "lower" ? LOWER_EXERCISES : [];

  const toggleSeries = (exerciseId, seriesIndex) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.days[selectedDate]) nd.days[selectedDate] = {};
    if (!nd.days[selectedDate].sport1) nd.days[selectedDate].sport1 = { exercises: {}, cardio: {}, warmup: {} };
    if (!nd.days[selectedDate].sport1.exercises[exerciseId]) nd.days[selectedDate].sport1.exercises[exerciseId] = { series: [], reps: [], weight: [] };
    const ex = nd.days[selectedDate].sport1.exercises[exerciseId];
    const was = ex.series[seriesIndex] || false;
    ex.series[seriesIndex] = !was;
    save(nd);
    if (!was) {
      // Smart timer: transition for first-in-superset, rest for second/solo
      const exercise = exercises.find(e => e.id === exerciseId);
      const time = exercise?.transition || exercise?.rest || timerPreset;
      setTimerSeconds(time);
      setTimerRunning(true);
    }
  };

  const setReps = (exerciseId, seriesIndex, value) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.days[selectedDate]) nd.days[selectedDate] = {};
    if (!nd.days[selectedDate].sport1) nd.days[selectedDate].sport1 = { exercises: {}, cardio: {}, warmup: {} };
    if (!nd.days[selectedDate].sport1.exercises[exerciseId]) nd.days[selectedDate].sport1.exercises[exerciseId] = { series: [], reps: [], weight: [] };
    nd.days[selectedDate].sport1.exercises[exerciseId].reps[seriesIndex] = value;
    save(nd);
  };

  const setWeight = (exerciseId, seriesIndex, value) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.days[selectedDate]) nd.days[selectedDate] = {};
    if (!nd.days[selectedDate].sport1) nd.days[selectedDate].sport1 = { exercises: {}, cardio: {}, warmup: {} };
    if (!nd.days[selectedDate].sport1.exercises[exerciseId]) nd.days[selectedDate].sport1.exercises[exerciseId] = { series: [], reps: [], weight: [] };
    nd.days[selectedDate].sport1.exercises[exerciseId].weight[seriesIndex] = value;
    save(nd);
  };

  const toggleWarmup = (id) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.days[selectedDate]) nd.days[selectedDate] = {};
    if (!nd.days[selectedDate].sport1) nd.days[selectedDate].sport1 = { exercises: {}, cardio: {}, warmup: {} };
    if (!nd.days[selectedDate].sport1.warmup) nd.days[selectedDate].sport1.warmup = {};
    nd.days[selectedDate].sport1.warmup[id] = !nd.days[selectedDate].sport1.warmup[id];
    save(nd);
  };

  const startWarmupTimer = (ex) => {
    if (activeWarmupId === ex.id && warmupTimerRunning) {
      setWarmupTimerRunning(false);
      return;
    }
    setActiveWarmupId(ex.id);
    setWarmupTimer(ex.duration);
    setWarmupTimerRunning(true);
  };

  const completeWarmup = () => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.days[selectedDate]) nd.days[selectedDate] = {};
    if (!nd.days[selectedDate].sport1) nd.days[selectedDate].sport1 = { exercises: {}, cardio: {}, warmup: {} };
    nd.days[selectedDate].sport1.warmupComplete = true;
    save(nd);
  };

  const setCardioData = (field, value) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.days[selectedDate]) nd.days[selectedDate] = {};
    if (!nd.days[selectedDate].sport1) nd.days[selectedDate].sport1 = { exercises: {}, cardio: {}, warmup: {} };
    if (!nd.days[selectedDate].sport1.cardio) nd.days[selectedDate].sport1.cardio = {};
    nd.days[selectedDate].sport1.cardio[field] = value;
    save(nd);
  };

  const setNotes = (notes) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.days[selectedDate]) nd.days[selectedDate] = {};
    if (!nd.days[selectedDate].sport1) nd.days[selectedDate].sport1 = { exercises: {}, cardio: {}, warmup: {} };
    nd.days[selectedDate].sport1.notes = notes;
    save(nd);
  };

  // Group into supersets
  const grouped = [];
  if (exercises.length > 0) {
    const used = new Set();
    for (const ex of exercises) {
      if (used.has(ex.id)) continue;
      const group = [ex];
      used.add(ex.id);
      if (ex.superset) {
        const next = exercises.find(e => e.id === ex.superset);
        if (next && !used.has(next.id)) {
          group.push(next);
          used.add(next.id);
        }
      }
      grouped.push(group);
    }
  }

  const totalSeries = exercises.reduce((sum, ex) => sum + ex.series, 0);
  const doneSeries = exercises.reduce((sum, ex) => {
    const exData = sport1Data.exercises?.[ex.id];
    return sum + (exData?.series || []).filter(Boolean).length;
  }, 0);

  const getWeekNum = () => {
    const start = new Date("2026-02-23");
    const now = new Date(selectedDate);
    return Math.max(1, Math.ceil((now - start) / (7 * 86400000)));
  };
  const weekNum = getWeekNum();
  const currentPhase = PROGRESSION_PHASES.find((p) => {
    const [s, e] = p.weeks.split("-").map(Number);
    return weekNum >= s && weekNum <= e;
  }) || PROGRESSION_PHASES[0];

  const REST_PRESETS = [
    { label: "30s", seconds: 30 },
    { label: "45s", seconds: 45 },
    { label: "60s", seconds: 60 },
    { label: "75s", seconds: 75 },
    { label: "90s", seconds: 90 },
  ];

  // Group warmup exercises by phase
  const warmupPhases = [];
  if (warmupExercises.length > 0) {
    let currentPhaseLabel = null;
    for (const ex of warmupExercises) {
      if (ex.phase !== currentPhaseLabel) {
        currentPhaseLabel = ex.phase;
        warmupPhases.push({ label: ex.phase, exercises: [] });
      }
      warmupPhases[warmupPhases.length - 1].exercises.push(ex);
    }
  }

  const showExercises = warmupComplete || session.type === "rest";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* WEEK OVERVIEW */}
      <div className="card" style={{ padding: 12 }}>
        <div style={{ display: "flex", gap: 4, justifyContent: "space-between" }}>
          {[1, 2, 3, 4, 5, 6, 0].map(d => {
            const s = SPORT1_DAYS[d];
            const isToday = d === dow;
            return (
              <div key={d} style={{ flex: 1, textAlign: "center", padding: "8px 2px", borderRadius: 12,
                background: isToday ? "rgba(233,69,96,.15)" : "transparent",
                border: isToday ? "1px solid #e94560" : "1px solid transparent",
              }}>
                <div style={{ fontSize: 9, color: isToday ? "#e94560" : "#555", fontWeight: 700 }}>{dayNames[d]}</div>
                <div style={{ fontSize: 14, marginTop: 2 }}>{s.emoji}</div>
                <div style={{ fontSize: 7, color: isToday ? "#fff" : "#444", marginTop: 2 }}>{s.type === "rest" ? "Repos" : s.type}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PHASE INDICATOR */}
      <div className="card" style={{ padding: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `${currentPhase.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
            {weekNum <= 4 ? "🌱" : weekNum <= 8 ? "🔨" : weekNum <= 12 ? "🔥" : "🏆"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: currentPhase.color }}>Sem. {weekNum} — {currentPhase.label}</div>
            <div style={{ fontSize: 10, color: "#888" }}>{currentPhase.desc}</div>
          </div>
          <div onClick={() => setShowProgression(!showProgression)} style={{ fontSize: 11, color: "#4a90d9", cursor: "pointer", fontWeight: 600 }}>
            {showProgression ? "Fermer" : "Plan 16s"}
          </div>
        </div>
        {showProgression && (
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            {PROGRESSION_PHASES.map(p => {
              const [s, e] = p.weeks.split("-").map(Number);
              const isCurrent = weekNum >= s && weekNum <= e;
              return (
                <div key={p.weeks} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10,
                  background: isCurrent ? `${p.color}15` : "transparent", border: `1px solid ${isCurrent ? p.color + "40" : "#0a0a1a"}` }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: p.color }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: isCurrent ? p.color : "#aaa" }}>Sem. {p.weeks} — {p.label}</div>
                    <div style={{ fontSize: 9, color: "#666" }}>{p.desc}</div>
                  </div>
                  {isCurrent && <span style={{ fontSize: 10, color: p.color }}>EN COURS</span>}
                </div>
              );
            })}

            {/* PROGRESSION TABLE */}
            <div style={{ marginTop: 8, padding: 10, borderRadius: 10, background: "rgba(255,255,255,.02)", border: "1px solid #1e1e4a" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#ffeb3b", letterSpacing: 1, marginBottom: 8 }}>OBJECTIFS CHARGES</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "4px 6px", color: "#555", fontWeight: 600 }}>Exercice</th>
                      {PROGRESSION_PHASES.map(p => (
                        <th key={p.weeks} style={{ textAlign: "center", padding: "4px 4px", color: p.color, fontWeight: 700, fontSize: 8 }}>S{p.weeks}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PROGRESSION_TABLE.map((row, i) => (
                      <tr key={i} style={{ borderTop: "1px solid #0a0a1a" }}>
                        <td style={{ padding: "4px 6px", color: "#aaa", fontSize: 9 }}>{row.exercise}</td>
                        {row.phases.map((val, j) => {
                          const phase = PROGRESSION_PHASES[j];
                          const [s, e] = phase.weeks.split("-").map(Number);
                          const isCurr = weekNum >= s && weekNum <= e;
                          return (
                            <td key={j} style={{ textAlign: "center", padding: "4px 4px", color: isCurr ? phase.color : "#666", fontWeight: isCurr ? 700 : 400, fontSize: 9 }}>{val}</td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SESSION HEADER */}
      <div className="card" style={{ background: "linear-gradient(145deg,#1a0a2e,#0d0d24)", border: "1px solid #2a1a4a", textAlign: "center", padding: "20px 16px" }}>
        <div style={{ fontSize: 36 }}>{session.emoji}</div>
        <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>{session.label}</div>
        <div style={{ fontSize: 12, color: "#888" }}>{session.subtitle}</div>
        {(session.type === "upper" || session.type === "lower") && (
          <div style={{ marginTop: 8, fontSize: 11, color: "#555" }}>
            {doneSeries}/{totalSeries} séries complétées
          </div>
        )}
      </div>

      {/* REST DAY — no rest day in this schedule, all days are upper/lower/cardio */}
      {session.type === "rest" && (
        <div className="card" style={{ textAlign: "center", padding: "32px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🧘</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#4caf50" }}>Jour de repos</div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>Récupération complète — étirements légers optionnels</div>
        </div>
      )}

      {/* WARMUP SECTION */}
      {session.type !== "rest" && warmupExercises.length > 0 && (
        <div className="card" style={{ padding: 14, border: warmupComplete ? "1px solid rgba(76,175,80,.3)" : "1px solid rgba(233,69,96,.3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 20 }}>🔥</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: warmupComplete ? "#4caf50" : "#e94560" }}>
                {warmupComplete ? "Échauffement terminé ✅" : `Échauffement ${session.type === "upper" ? "Upper Body" : session.type === "lower" ? "Lower Body" : "Cardio"}`}
              </div>
              <div style={{ fontSize: 10, color: "#888" }}>
                {warmupComplete ? "Séance déverrouillée" : `${warmupDoneCount}/${warmupExercises.length} exercices — ~${session.type === "cardio" ? "3" : "8"} min`}
              </div>
            </div>
          </div>

          {!warmupComplete && warmupPhases.map((phase, pi) => (
            <div key={pi} style={{ marginBottom: pi < warmupPhases.length - 1 ? 12 : 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#ffeb3b", letterSpacing: 1, marginBottom: 6, padding: "4px 8px", background: "rgba(255,235,59,.06)", borderRadius: 6 }}>
                {phase.label.toUpperCase()}
              </div>
              {phase.exercises.map(ex => {
                const done = warmupData[ex.id] || false;
                const isTimerActive = activeWarmupId === ex.id && warmupTimerRunning;
                return (
                  <div key={ex.id} style={{ marginBottom: 4 }}>
                    <div className={`ci ${done ? "done" : ""}`} style={{ padding: "10px 12px" }}>
                      <div onClick={() => toggleWarmup(ex.id)} className="cb" style={{ cursor: "pointer" }}>{done ? "✓" : ""}</div>
                      <span style={{ fontSize: 16 }}>{ex.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 12, fontWeight: done ? 600 : 400 }}>{ex.label}</span>
                        <div style={{ fontSize: 10, color: "#888" }}>{ex.reps}</div>
                      </div>
                      <div onClick={() => startWarmupTimer(ex)} style={{
                        padding: "4px 10px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700,
                        fontFamily: "'Space Mono'",
                        background: isTimerActive ? "rgba(233,69,96,.2)" : "rgba(255,255,255,.06)",
                        color: isTimerActive ? "#e94560" : "#555",
                        border: `1px solid ${isTimerActive ? "#e94560" : "#1e1e4a"}`,
                      }}>
                        {isTimerActive ? `${warmupTimer}s` : `${ex.duration}s`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Complete warmup button */}
          {!warmupComplete && (
            <div onClick={completeWarmup} style={{
              marginTop: 12, padding: "14px 0", borderRadius: 14, textAlign: "center", cursor: "pointer",
              background: warmupDoneCount === warmupExercises.length
                ? "linear-gradient(135deg,#4caf50,#2e7d32)"
                : "linear-gradient(135deg,#e94560,#c23152)",
              fontSize: 14, fontWeight: 800, color: "#fff",
              opacity: warmupDoneCount >= warmupExercises.length * 0.5 ? 1 : 0.5,
            }}>
              {warmupDoneCount === warmupExercises.length
                ? "Échauffement terminé → Lancer la séance 🚀"
                : `Terminer l'échauffement (${warmupDoneCount}/${warmupExercises.length})`}
            </div>
          )}
        </div>
      )}

      {/* LOCKED OVERLAY when warmup not done */}
      {session.type !== "rest" && !warmupComplete && (
        <div style={{ textAlign: "center", padding: "24px 16px", borderRadius: 16, background: "rgba(255,255,255,.02)", border: "1px dashed #2a2a4a" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#555" }}>Séance verrouillée</div>
          <div style={{ fontSize: 11, color: "#444", marginTop: 4 }}>Termine ton échauffement pour accéder aux exercices</div>
        </div>
      )}

      {/* EXERCISES (upper/lower) — only visible after warmup */}
      {showExercises && (session.type === "upper" || session.type === "lower") && grouped.map((group, gi) => {
        const isSuperset = group.length > 1;
        const groupLabel = group[0].groupLabel || (isSuperset ? `SUPERSET ${gi + 1}` : "");
        return (
          <div key={gi} className="card" style={{ padding: 14 }}>
            {groupLabel && (
              <div style={{ fontSize: 10, fontWeight: 700, color: isSuperset ? "#e94560" : "#ffeb3b", marginBottom: 8, letterSpacing: 1 }}>
                {isSuperset ? "🔄" : "🎯"} {groupLabel.toUpperCase()} — {group[0].series} {isSuperset ? "tours" : "séries"}
              </div>
            )}
            {group.map((ex, ei) => {
              const exData = sport1Data.exercises?.[ex.id] || { series: [], reps: [], weight: [] };
              const doneCount = (exData.series || []).filter(Boolean).length;
              return (
                <div key={ex.id}>
                  {/* Transition indicator between superset exercises */}
                  {isSuperset && ei === 1 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "6px 0", padding: "2px 0" }}>
                      <div style={{ flex: 1, height: 1, background: "#1e1e4a" }} />
                      <span style={{ fontSize: 9, color: "#e94560", fontWeight: 700, fontFamily: "'Space Mono'" }}>
                        ↕ {group[0].transition || 25}s transition
                      </span>
                      <div style={{ flex: 1, height: 1, background: "#1e1e4a" }} />
                    </div>
                  )}
                  <div style={{ marginBottom: ei < group.length - 1 ? 4 : 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 18 }}>{ex.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{ex.label}</div>
                        <div style={{ fontSize: 10, color: "#888" }}>
                          {ex.series}×{ex.reps} — {ex.transition ? `${ex.transition}s trans.` : `${ex.rest}s repos`} — <span style={{ color: "#555" }}>{ex.muscle}</span>
                          {doneCount > 0 && <span style={{ color: doneCount === ex.series ? "#4caf50" : "#e94560", fontWeight: 700 }}> {doneCount}/{ex.series}</span>}
                        </div>
                        {ex.notes && (
                          <div style={{ fontSize: 9, color: "#666", marginTop: 2, lineHeight: 1.4 }}>{ex.notes}</div>
                        )}
                      </div>
                      {doneCount === ex.series && <span style={{ fontSize: 16 }}>✅</span>}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {[...Array(ex.series)].map((_, i) => {
                        const done = exData.series?.[i] || false;
                        return (
                          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                            <div onClick={() => toggleSeries(ex.id, i)} style={{
                              width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                              cursor: "pointer", background: done ? "linear-gradient(135deg,#4caf50,#2e7d32)" : "#0a0a1a",
                              border: `2px solid ${done ? "#4caf50" : "#2a2a4a"}`, fontSize: 13, fontWeight: 800,
                              fontFamily: "'Space Mono'", color: done ? "#fff" : "#555", transition: "all .2s",
                            }}>
                              {done ? "✓" : `S${i + 1}`}
                            </div>
                            <input type="number" placeholder="kg" value={exData.weight?.[i] || ""}
                              onChange={e => setWeight(ex.id, i, e.target.value)}
                              style={{ width: 44, padding: "3px 2px", borderRadius: 6, background: "#0a0a1a",
                                border: "1px solid #1e1e4a", color: "#ffeb3b", fontSize: 10, textAlign: "center", fontFamily: "'Space Mono'" }}
                            />
                            <input type="number" placeholder={ex.reps.split("-")[0] || "-"} value={exData.reps?.[i] || ""}
                              onChange={e => setReps(ex.id, i, e.target.value)}
                              style={{ width: 44, padding: "3px 2px", borderRadius: 6, background: "#0a0a1a",
                                border: "1px solid #1e1e4a", color: "#fff", fontSize: 10, textAlign: "center", fontFamily: "'Space Mono'" }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Rest time after superset/bloc */}
            <div style={{ marginTop: 8, fontSize: 9, color: "#555", textAlign: "right", fontFamily: "'Space Mono'" }}>
              Repos : {group[group.length - 1].rest}s après {isSuperset ? "le couple" : "chaque série"}
            </div>
          </div>
        );
      })}

      {/* CARDIO SESSION — only visible after warmup */}
      {showExercises && session.type === "cardio" && (
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>🏃 Choisis ton cardio</div>
          <div style={{ fontSize: 10, color: "#4caf50", fontWeight: 600, marginBottom: 12, padding: "6px 10px", borderRadius: 8, background: "rgba(76,175,80,.06)", textAlign: "center" }}>
            {CARDIO_RULES}
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {CARDIO_OPTIONS.map(opt => {
              const isSelected = (sport1Data.cardio?.type || selectedCardio) === opt.id;
              return (
                <div key={opt.id} onClick={() => { setSelectedCardio(opt.id); setCardioData("type", opt.id); }}
                  style={{ flex: 1, textAlign: "center", padding: "14px 8px", borderRadius: 14, cursor: "pointer",
                    background: isSelected ? "rgba(233,69,96,.15)" : "#0a0a1a",
                    border: `1px solid ${isSelected ? "#e94560" : "#1e1e4a"}` }}>
                  <div style={{ fontSize: 28 }}>{opt.emoji}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? "#e94560" : "#888", marginTop: 4 }}>{opt.label}</div>
                  <div style={{ fontSize: 9, color: "#555", marginTop: 2 }}>{opt.duration}</div>
                </div>
              );
            })}
          </div>
          {(sport1Data.cardio?.type || selectedCardio) && (() => {
            const opt = CARDIO_OPTIONS.find(o => o.id === (sport1Data.cardio?.type || selectedCardio));
            return opt ? (
              <div style={{ padding: 12, borderRadius: 12, background: "rgba(76,175,80,.06)", border: "1px solid rgba(76,175,80,.2)" }}>
                <div style={{ fontSize: 12, color: "#4caf50", fontWeight: 600, marginBottom: 4 }}>📌 {opt.info}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: "#888", marginBottom: 2 }}>Durée (min)</div>
                    <input type="number" value={sport1Data.cardio?.duration || ""} onChange={e => setCardioData("duration", e.target.value)}
                      placeholder="35" style={{ width: "100%", padding: "8px", borderRadius: 8, background: "#0a0a1a", border: "1px solid #1e1e4a", color: "#fff", fontSize: 14, fontFamily: "'Space Mono'", textAlign: "center", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: "#888", marginBottom: 2 }}>Distance (km)</div>
                    <input type="number" value={sport1Data.cardio?.distance || ""} onChange={e => setCardioData("distance", e.target.value)}
                      placeholder="—" style={{ width: "100%", padding: "8px", borderRadius: 8, background: "#0a0a1a", border: "1px solid #1e1e4a", color: "#fff", fontSize: 14, fontFamily: "'Space Mono'", textAlign: "center", boxSizing: "border-box" }} />
                  </div>
                </div>
                <div onClick={() => setCardioData("completed", !sport1Data.cardio?.completed)}
                  style={{ marginTop: 10, padding: "10px 0", borderRadius: 10, textAlign: "center", cursor: "pointer",
                    background: sport1Data.cardio?.completed ? "linear-gradient(135deg,#4caf50,#2e7d32)" : "#0a0a1a",
                    border: `1px solid ${sport1Data.cardio?.completed ? "#4caf50" : "#2a2a4a"}`,
                    fontSize: 13, fontWeight: 700, color: sport1Data.cardio?.completed ? "#fff" : "#555" }}>
                  {sport1Data.cardio?.completed ? "✅ Terminé !" : "Marquer comme terminé"}
                </div>
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* REST TIMER */}
      {showExercises && (session.type === "upper" || session.type === "lower") && (
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>⏱️ Chrono récup</div>
          <div style={{ display: "flex", gap: 6 }}>
            {REST_PRESETS.map(p => (
              <div key={p.seconds} onClick={() => setTimerPreset(p.seconds)} style={{
                flex: 1, padding: "8px 0", borderRadius: 10, textAlign: "center", cursor: "pointer",
                fontSize: 12, fontWeight: 700, fontFamily: "'Space Mono'",
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

      {/* FORBIDDEN EXERCISES WARNING */}
      {showExercises && (session.type === "upper" || session.type === "lower") && (
        <div className="card" style={{ padding: 14 }}>
          <div onClick={() => setShowForbidden(!showForbidden)}
            style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <span style={{ fontSize: 18 }}>⛔</span>
            <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "#e94560" }}>Exercices INTERDITS</div>
            <span style={{ fontSize: 12, color: "#555", transform: showForbidden ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }}>▼</span>
          </div>
          {showForbidden && (
            <div style={{ marginTop: 10 }}>
              {FORBIDDEN_EXERCISES.map((ex, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 0", borderTop: i > 0 ? "1px solid #0a0a1a" : "none" }}>
                  <span style={{ fontSize: 14, marginTop: 2 }}>❌</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#e94560" }}>{ex.exercise}</div>
                    <div style={{ fontSize: 10, color: "#888" }}>{ex.reason}</div>
                  </div>
                  <div style={{ fontSize: 9, color: "#555", padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,.05)", whiteSpace: "nowrap" }}>
                    Reprise : {ex.resume}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* NOTES */}
      <div className="card" style={{ padding: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>📝 Notes</div>
        <textarea value={sport1Data.notes || ""} onChange={e => setNotes(e.target.value)}
          placeholder="Poids utilisés, sensations, RPE..."
          style={{ width: "100%", minHeight: 60, background: "#0a0a1a", border: "1px solid #1e1e4a",
            borderRadius: 10, color: "#fff", padding: 10, fontSize: 12, fontFamily: "'Outfit'",
            resize: "vertical", outline: "none", boxSizing: "border-box" }}
        />
      </div>
    </div>
  );
}
