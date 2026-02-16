import { useState, useEffect, useRef } from "react";
import { SEANCE_PRINCIPALE, MICRO_ROUTINES, FORBIDDEN_EXERCISES, PROGRESSION_TIMELINE, DAILY_TARGET } from "../constants/routineDos.js";

export default function TabDos({ data, save, selectedDate }) {
  const [guidedMode, setGuidedMode] = useState(null); // null | "seance" | routineId
  const [guidedStep, setGuidedStep] = useState(0);
  const [guidedTimer, setGuidedTimer] = useState(0);
  const [guidedRunning, setGuidedRunning] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showForbidden, setShowForbidden] = useState(false);
  const [expandedPhase, setExpandedPhase] = useState(null);
  const timerRef = useRef(null);

  const dosData = data.days[selectedDate]?.dos || {};
  const routineDos = data.days[selectedDate]?.routineDos || [];
  const seanceCompleted = dosData.seanceComplete || false;
  const seanceExercises = dosData.exercises || {};
  const completedMicro = routineDos.filter(r => r.completed).length;

  // Week number for progression
  const getWeekNum = () => {
    const start = new Date("2026-02-23");
    const now = new Date(selectedDate);
    return Math.max(1, Math.ceil((now - start) / (7 * 86400000)));
  };
  const weekNum = getWeekNum();

  // Get current volume for an exercise based on week
  const getCurrentVolume = (exercise) => {
    const prog = exercise.progression;
    for (let i = prog.length - 1; i >= 0; i--) {
      const range = prog[i].weeks;
      if (range.includes("+")) {
        const min = parseInt(range);
        if (weekNum >= min) return prog[i].volume;
      } else if (range.includes("-")) {
        const [s, e] = range.split("-").map(Number);
        if (weekNum >= s && weekNum <= e) return prog[i].volume;
      }
    }
    return prog[0].volume;
  };

  // Timer effect
  useEffect(() => {
    if (guidedRunning && guidedTimer > 0) {
      timerRef.current = setTimeout(() => setGuidedTimer(t => t - 1), 1000);
    } else if (guidedRunning && guidedTimer <= 0) {
      setGuidedRunning(false);
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
    return () => clearTimeout(timerRef.current);
  }, [guidedRunning, guidedTimer]);

  // Get exercises for current guided mode
  const getGuidedExercises = () => {
    if (guidedMode === "seance") return SEANCE_PRINCIPALE;
    const routine = MICRO_ROUTINES.find(r => r.id === guidedMode);
    return routine ? routine.exercises : [];
  };

  const startGuided = (mode) => {
    const exercises = mode === "seance" ? SEANCE_PRINCIPALE : (MICRO_ROUTINES.find(r => r.id === mode)?.exercises || []);
    if (exercises.length === 0) return;
    setGuidedMode(mode);
    setGuidedStep(0);
    setGuidedTimer(exercises[0].duration);
    setGuidedRunning(true);
  };

  const nextGuidedStep = () => {
    const exercises = getGuidedExercises();
    const next = guidedStep + 1;
    if (next >= exercises.length) {
      // Complete
      if (guidedMode === "seance") {
        finishSeance();
      } else {
        finishMicroRoutine(guidedMode);
      }
      setGuidedMode(null);
      setGuidedRunning(false);
    } else {
      setGuidedStep(next);
      setGuidedTimer(exercises[next].duration);
      setGuidedRunning(true);
    }
  };

  const toggleSeanceExercise = (exId) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.days[selectedDate]) nd.days[selectedDate] = {};
    if (!nd.days[selectedDate].dos) nd.days[selectedDate].dos = { exercises: {} };
    if (!nd.days[selectedDate].dos.exercises) nd.days[selectedDate].dos.exercises = {};
    nd.days[selectedDate].dos.exercises[exId] = !nd.days[selectedDate].dos.exercises[exId];
    save(nd);
  };

  const finishSeance = () => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.days[selectedDate]) nd.days[selectedDate] = {};
    if (!nd.days[selectedDate].dos) nd.days[selectedDate].dos = { exercises: {} };
    nd.days[selectedDate].dos.seanceComplete = true;
    // Mark all exercises as done
    SEANCE_PRINCIPALE.forEach(ex => {
      if (!nd.days[selectedDate].dos.exercises) nd.days[selectedDate].dos.exercises = {};
      nd.days[selectedDate].dos.exercises[ex.id] = true;
    });
    save(nd);
  };

  const finishMicroRoutine = (routineId) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.days[selectedDate]) nd.days[selectedDate] = {};
    if (!nd.days[selectedDate].routineDos) nd.days[selectedDate].routineDos = [];
    nd.days[selectedDate].routineDos.push({
      routine: routineId,
      time: new Date().toTimeString().slice(0, 5),
      completed: true,
    });
    save(nd);
  };

  const getNextRoutineId = () => {
    if (routineDos.length === 0) return "A";
    const last = routineDos[routineDos.length - 1];
    const ids = ["A", "B", "C"];
    const idx = ids.indexOf(last.routine);
    return ids[(idx + 1) % 3];
  };

  const nextRoutineId = getNextRoutineId();

  // Group séance principale by phase
  const phases = [];
  let currentPhaseNum = null;
  for (const ex of SEANCE_PRINCIPALE) {
    if (ex.phaseNum !== currentPhaseNum) {
      currentPhaseNum = ex.phaseNum;
      phases.push({ num: ex.phaseNum, label: ex.phase, duration: ex.phaseDuration, exercises: [] });
    }
    phases[phases.length - 1].exercises.push(ex);
  }

  const seanceDoneCount = SEANCE_PRINCIPALE.filter(ex => seanceExercises[ex.id]).length;
  const phaseColors = { 1: "#4a90d9", 2: "#ff9800", 3: "#e94560" };

  // Current timeline phase
  const currentTimelinePhase = PROGRESSION_TIMELINE.find(p => {
    const range = p.weeks;
    if (range.includes("+")) return weekNum >= parseInt(range);
    const [s, e] = range.split("-").map(Number);
    return weekNum >= s && weekNum <= e;
  }) || PROGRESSION_TIMELINE[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* GUIDED MODE OVERLAY */}
      {guidedMode && (() => {
        const exercises = getGuidedExercises();
        const ex = exercises[guidedStep];
        if (!ex) return null;
        const pct = guidedTimer > 0 ? ((ex.duration - guidedTimer) / ex.duration) * 100 : 100;
        const color = guidedMode === "seance" ? "#e94560" : (MICRO_ROUTINES.find(r => r.id === guidedMode)?.color || "#e94560");
        const label = guidedMode === "seance" ? "Séance principale" : (MICRO_ROUTINES.find(r => r.id === guidedMode)?.label || "");
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.95)", zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ fontSize: 10, color, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>
              {label.toUpperCase()}
            </div>
            <div style={{ fontSize: 12, color: "#555", marginBottom: 8 }}>
              Exercice {guidedStep + 1}/{exercises.length}
            </div>
            {guidedMode === "seance" && ex.phase && (
              <div style={{ fontSize: 10, color: phaseColors[ex.phaseNum] || "#888", fontWeight: 700, marginBottom: 12, padding: "2px 10px", borderRadius: 6, background: `${phaseColors[ex.phaseNum] || "#888"}15` }}>
                Phase {ex.phaseNum} — {ex.phase}
              </div>
            )}
            <div style={{ fontSize: 48, marginBottom: 12 }}>{ex.emoji}</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, textAlign: "center" }}>{ex.label}</div>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 8, textAlign: "center" }}>
              {guidedMode === "seance" ? getCurrentVolume(ex) : ex.reps}
            </div>
            {(ex.execution || ex.detail) && (
              <div style={{ fontSize: 11, color: "#666", maxWidth: 300, textAlign: "center", marginBottom: 20, lineHeight: 1.5 }}>
                {ex.execution || ex.detail}
              </div>
            )}

            {/* Circular timer */}
            <div style={{ position: "relative", width: 140, height: 140, marginBottom: 24 }}>
              <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="70" cy="70" r="60" fill="none" stroke="#1a1a2e" strokeWidth="8" />
                <circle cx="70" cy="70" r="60" fill="none" stroke={color} strokeWidth="8"
                  strokeDasharray={377} strokeDashoffset={377 * (1 - pct / 100)}
                  strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s linear" }} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                <div style={{ fontSize: 36, fontWeight: 900, fontFamily: "'Space Mono'", color: "#fff" }}>{guidedTimer}</div>
                <div style={{ fontSize: 10, color: "#555" }}>sec</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <div onClick={() => setGuidedRunning(!guidedRunning)}
                style={{ padding: "12px 24px", borderRadius: 12, background: "rgba(255,255,255,.08)", color: "#888", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                {guidedRunning ? "⏸ Pause" : "▶ Reprendre"}
              </div>
              <div onClick={nextGuidedStep}
                style={{ padding: "12px 24px", borderRadius: 12, background: `${color}22`, color, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                {guidedStep < exercises.length - 1 ? "Suivant →" : "Terminer ✓"}
              </div>
            </div>
            <div onClick={() => { setGuidedMode(null); setGuidedRunning(false); }}
              style={{ marginTop: 20, fontSize: 12, color: "#555", cursor: "pointer" }}>
              Annuler
            </div>
          </div>
        );
      })()}

      {/* SÉANCE PRINCIPALE */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: seanceCompleted ? "linear-gradient(135deg,#4caf50,#2e7d32)" : "linear-gradient(135deg,#e94560,#c23152)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
            {seanceCompleted ? "✅" : "🔙"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800 }}>Séance principale</div>
            <div style={{ fontSize: 11, color: "#888" }}>
              Correction posturale — 15-20 min — {seanceDoneCount}/{SEANCE_PRINCIPALE.length}
            </div>
          </div>
        </div>

        {/* Launch guided button */}
        {!seanceCompleted && (
          <div onClick={() => startGuided("seance")} style={{
            padding: "14px 0", borderRadius: 14, textAlign: "center", cursor: "pointer",
            background: "linear-gradient(135deg,#e94560,#c23152)", fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 12,
          }}>
            Lancer la séance guidée 🚀
          </div>
        )}

        {/* Exercises by phase */}
        {phases.map(phase => {
          const phaseDone = phase.exercises.filter(ex => seanceExercises[ex.id]).length;
          const isExpanded = expandedPhase === phase.num;
          return (
            <div key={phase.num} style={{ marginBottom: 8 }}>
              <div onClick={() => setExpandedPhase(isExpanded ? null : phase.num)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                  background: `${phaseColors[phase.num]}10`, border: `1px solid ${phaseColors[phase.num]}30` }}>
                <div style={{ width: 24, height: 24, borderRadius: 8, background: `${phaseColors[phase.num]}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: phaseColors[phase.num] }}>
                  {phase.num}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: phaseColors[phase.num] }}>
                    Phase {phase.num} — {phase.label}
                  </div>
                  <div style={{ fontSize: 10, color: "#888" }}>{phase.duration} — {phaseDone}/{phase.exercises.length}</div>
                </div>
                {phaseDone === phase.exercises.length && <span style={{ fontSize: 14 }}>✅</span>}
                <span style={{ fontSize: 12, color: "#555", transform: isExpanded ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }}>▼</span>
              </div>
              {isExpanded && phase.exercises.map(ex => {
                const done = seanceExercises[ex.id] || false;
                const volume = getCurrentVolume(ex);
                return (
                  <div key={ex.id} className={`ci ${done ? "done" : ""}`} onClick={() => toggleSeanceExercise(ex.id)}
                    style={{ padding: "10px 12px", marginTop: 4 }}>
                    <div className="cb">{done ? "✓" : ""}</div>
                    <span style={{ fontSize: 16 }}>{ex.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: done ? 600 : 400 }}>{ex.label}</div>
                      <div style={{ fontSize: 10, color: "#ffeb3b", fontWeight: 600 }}>{volume}</div>
                      <div style={{ fontSize: 10, color: "#666" }}>{ex.execution}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Mark seance complete manually */}
        {!seanceCompleted && seanceDoneCount === SEANCE_PRINCIPALE.length && (
          <div onClick={finishSeance} style={{
            marginTop: 8, padding: "12px 0", borderRadius: 12, textAlign: "center", cursor: "pointer",
            background: "linear-gradient(135deg,#4caf50,#2e7d32)", fontSize: 13, fontWeight: 700, color: "#fff",
          }}>
            Valider la séance ✓
          </div>
        )}
      </div>

      {/* MICRO-ROUTINES COUNTER */}
      <div className="card" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>Micro-routines aujourd'hui</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 8 }}>
          {[...Array(DAILY_TARGET)].map((_, i) => (
            <div key={i} style={{
              width: 40, height: 40, borderRadius: 12,
              background: i < completedMicro ? "linear-gradient(135deg,#4caf50,#2e7d32)" : "#0a0a1a",
              border: `2px solid ${i < completedMicro ? "#4caf50" : "#2a2a4a"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, color: i < completedMicro ? "#fff" : "#333",
            }}>
              {i < completedMicro ? "✓" : i + 1}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "'Space Mono'", color: completedMicro >= DAILY_TARGET ? "#4caf50" : "#e94560" }}>
          {completedMicro}/{DAILY_TARGET}
        </div>
        {completedMicro >= DAILY_TARGET && (
          <div style={{ fontSize: 12, color: "#4caf50", fontWeight: 600, marginTop: 4 }}>Objectif atteint !</div>
        )}
        <div style={{ fontSize: 10, color: "#555", marginTop: 6 }}>
          Alterner A → B → C toutes les 2h
        </div>
      </div>

      {/* QUICK START MICRO */}
      <div className="card" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>🚀 Lancer la prochaine routine</div>
        <div onClick={() => startGuided(nextRoutineId)}
          style={{
            padding: "16px 0", borderRadius: 14, cursor: "pointer",
            background: `linear-gradient(135deg, ${MICRO_ROUTINES.find(r => r.id === nextRoutineId).color}30, ${MICRO_ROUTINES.find(r => r.id === nextRoutineId).color}10)`,
            border: `1px solid ${MICRO_ROUTINES.find(r => r.id === nextRoutineId).color}50`,
          }}>
          <div style={{ fontSize: 32 }}>{MICRO_ROUTINES.find(r => r.id === nextRoutineId).emoji}</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4, color: MICRO_ROUTINES.find(r => r.id === nextRoutineId).color }}>
            Routine {nextRoutineId}
          </div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
            {MICRO_ROUTINES.find(r => r.id === nextRoutineId).duration}
          </div>
        </div>
      </div>

      {/* ALL 3 MICRO ROUTINES */}
      {MICRO_ROUTINES.map(routine => {
        const doneCount = routineDos.filter(r => r.routine === routine.id).length;
        return (
          <div key={routine.id} className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 22 }}>{routine.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{routine.label}</div>
                <div style={{ fontSize: 10, color: "#888" }}>{routine.duration} — {routine.exercises.length} exercices</div>
              </div>
              {doneCount > 0 && (
                <div style={{ fontSize: 11, fontWeight: 700, color: "#4caf50", fontFamily: "'Space Mono'" }}>×{doneCount}</div>
              )}
              <div onClick={() => startGuided(routine.id)}
                style={{ padding: "6px 14px", borderRadius: 10, background: `${routine.color}22`, color: routine.color, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                GO
              </div>
            </div>
            {routine.exercises.map(ex => (
              <div key={ex.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderTop: "1px solid #0a0a1a" }}>
                <span style={{ fontSize: 14, width: 24, textAlign: "center" }}>{ex.emoji}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 12, color: "#aaa" }}>{ex.label}</span>
                  {ex.detail && <div style={{ fontSize: 10, color: "#555" }}>{ex.detail}</div>}
                </div>
                <span style={{ fontSize: 10, color: "#555", fontFamily: "'Space Mono'" }}>{ex.reps}</span>
              </div>
            ))}
          </div>
        );
      })}

      {/* FORBIDDEN EXERCISES */}
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
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderTop: i > 0 ? "1px solid #0a0a1a" : "none" }}>
                <span style={{ fontSize: 14 }}>❌</span>
                <span style={{ fontSize: 12, color: "#e94560" }}>{ex}</span>
              </div>
            ))}
            <div style={{ marginTop: 8, fontSize: 10, color: "#666", lineHeight: 1.5, padding: 8, background: "rgba(233,69,96,.05)", borderRadius: 8 }}>
              Ces exercices aggravent l'antéversion du bassin et la lordose lombaire. Les remplacer par les exercices de la séance principale.
            </div>
          </div>
        )}
      </div>

      {/* PROGRESSION TIMELINE */}
      <div className="card" style={{ padding: 14 }}>
        <div onClick={() => setShowTimeline(!showTimeline)}
          style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <span style={{ fontSize: 18 }}>📈</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Progression</div>
            <div style={{ fontSize: 10, color: currentTimelinePhase.color, fontWeight: 600 }}>
              Sem. {weekNum} — {currentTimelinePhase.label}
            </div>
          </div>
          <span style={{ fontSize: 12, color: "#555", transform: showTimeline ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }}>▼</span>
        </div>
        {showTimeline && (
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            {PROGRESSION_TIMELINE.map((p, i) => {
              const range = p.weeks;
              let isCurrent = false;
              if (range.includes("+")) {
                isCurrent = weekNum >= parseInt(range);
              } else {
                const [s, e] = range.split("-").map(Number);
                isCurrent = weekNum >= s && weekNum <= e;
              }
              return (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 10px", borderRadius: 10,
                  background: isCurrent ? `${p.color}10` : "transparent", border: `1px solid ${isCurrent ? p.color + "30" : "transparent"}` }}>
                  <div style={{ width: 10, height: 10, borderRadius: 5, background: p.color, marginTop: 4, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: isCurrent ? p.color : "#888" }}>{p.label}</div>
                    <div style={{ fontSize: 10, color: "#666" }}>{p.desc}</div>
                  </div>
                  {isCurrent && <span style={{ fontSize: 9, color: p.color, fontWeight: 700, marginTop: 2 }}>EN COURS</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* HISTORY */}
      {routineDos.length > 0 && (
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>📋 Historique du jour</div>
          {seanceCompleted && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: routineDos.length > 0 ? "1px solid #0a0a1a" : "none" }}>
              <span style={{ fontSize: 16 }}>🔙</span>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>Séance principale</span>
              <span style={{ fontSize: 14 }}>✅</span>
            </div>
          )}
          {routineDos.map((r, i) => {
            const routine = MICRO_ROUTINES.find(rt => rt.id === r.routine);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderTop: i > 0 || seanceCompleted ? "1px solid #0a0a1a" : "none" }}>
                <span style={{ fontSize: 16 }}>{routine?.emoji || "🔙"}</span>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>Routine {r.routine}</span>
                <span style={{ fontSize: 11, color: "#888", fontFamily: "'Space Mono'" }}>{r.time}</span>
                <span style={{ fontSize: 14 }}>✅</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
