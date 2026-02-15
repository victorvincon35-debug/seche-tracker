import { useState, useEffect, useRef } from "react";
import { ROUTINES, DAILY_TARGET } from "../constants/routineDos.js";

export default function TabDos({ data, save, selectedDate }) {
  const [guidedRoutine, setGuidedRoutine] = useState(null);
  const [guidedStep, setGuidedStep] = useState(0);
  const [guidedTimer, setGuidedTimer] = useState(0);
  const [guidedRunning, setGuidedRunning] = useState(false);
  const timerRef = useRef(null);

  const routineDos = data.days[selectedDate]?.routineDos || [];
  const completedToday = routineDos.filter(r => r.completed).length;

  // Timer effect for guided mode
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
        osc.stop(ctx.currentTime + 0.3);
      } catch (e) { /* no audio */ }
      if (navigator.vibrate) navigator.vibrate(200);
    }
    return () => clearTimeout(timerRef.current);
  }, [guidedRunning, guidedTimer]);

  const getNextRoutineId = () => {
    if (routineDos.length === 0) return "A";
    const last = routineDos[routineDos.length - 1];
    const ids = ["A", "B", "C"];
    const idx = ids.indexOf(last.routine);
    return ids[(idx + 1) % 3];
  };

  const startGuided = (routineId) => {
    const routine = ROUTINES.find(r => r.id === routineId);
    if (!routine) return;
    setGuidedRoutine(routine);
    setGuidedStep(0);
    setGuidedTimer(routine.exercises[0].duration);
    setGuidedRunning(true);
  };

  const nextStep = () => {
    if (!guidedRoutine) return;
    const next = guidedStep + 1;
    if (next >= guidedRoutine.exercises.length) {
      // Routine complete
      finishRoutine(guidedRoutine.id);
      setGuidedRoutine(null);
      setGuidedRunning(false);
    } else {
      setGuidedStep(next);
      setGuidedTimer(guidedRoutine.exercises[next].duration);
      setGuidedRunning(true);
    }
  };

  const skipStep = () => nextStep();

  const finishRoutine = (routineId) => {
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

  const nextRoutineId = getNextRoutineId();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* GUIDED MODE OVERLAY */}
      {guidedRoutine && (() => {
        const ex = guidedRoutine.exercises[guidedStep];
        const pct = guidedTimer > 0 ? ((ex.duration - guidedTimer) / ex.duration) * 100 : 100;
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.95)", zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ fontSize: 10, color: guidedRoutine.color, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>
              {guidedRoutine.label.toUpperCase()}
            </div>
            <div style={{ fontSize: 12, color: "#555", marginBottom: 20 }}>
              Exercice {guidedStep + 1}/{guidedRoutine.exercises.length}
            </div>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{ex.emoji}</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{ex.label}</div>
            <div style={{ fontSize: 14, color: "#888", marginBottom: 24 }}>{ex.reps}</div>

            {/* Circular timer */}
            <div style={{ position: "relative", width: 140, height: 140, marginBottom: 24 }}>
              <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="70" cy="70" r="60" fill="none" stroke="#1a1a2e" strokeWidth="8" />
                <circle cx="70" cy="70" r="60" fill="none" stroke={guidedRoutine.color} strokeWidth="8"
                  strokeDasharray={377} strokeDashoffset={377 * (1 - pct / 100)}
                  strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s linear" }} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                <div style={{ fontSize: 36, fontWeight: 900, fontFamily: "'Space Mono'", color: "#fff" }}>{guidedTimer}</div>
                <div style={{ fontSize: 10, color: "#555" }}>sec</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <div onClick={() => { setGuidedRunning(!guidedRunning); }}
                style={{ padding: "12px 24px", borderRadius: 12, background: "rgba(255,255,255,.08)", color: "#888", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                {guidedRunning ? "⏸ Pause" : "▶ Reprendre"}
              </div>
              <div onClick={skipStep}
                style={{ padding: "12px 24px", borderRadius: 12, background: `${guidedRoutine.color}22`, color: guidedRoutine.color, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                {guidedStep < guidedRoutine.exercises.length - 1 ? "Suivant →" : "Terminer ✓"}
              </div>
            </div>
            <div onClick={() => { setGuidedRoutine(null); setGuidedRunning(false); }}
              style={{ marginTop: 20, fontSize: 12, color: "#555", cursor: "pointer" }}>
              Annuler
            </div>
          </div>
        );
      })()}

      {/* DAILY COUNTER */}
      <div className="card" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>Micro-routines aujourd'hui</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 8 }}>
          {[...Array(DAILY_TARGET)].map((_, i) => (
            <div key={i} style={{
              width: 40, height: 40, borderRadius: 12,
              background: i < completedToday ? "linear-gradient(135deg,#4caf50,#2e7d32)" : "#0a0a1a",
              border: `2px solid ${i < completedToday ? "#4caf50" : "#2a2a4a"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, color: i < completedToday ? "#fff" : "#333",
            }}>
              {i < completedToday ? "✓" : i + 1}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "'Space Mono'", color: completedToday >= DAILY_TARGET ? "#4caf50" : "#e94560" }}>
          {completedToday}/{DAILY_TARGET}
        </div>
        {completedToday >= DAILY_TARGET && (
          <div style={{ fontSize: 12, color: "#4caf50", fontWeight: 600, marginTop: 4 }}>Objectif atteint !</div>
        )}
      </div>

      {/* QUICK START */}
      <div className="card" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>🚀 Lancer la prochaine routine</div>
        <div onClick={() => startGuided(nextRoutineId)}
          style={{
            padding: "16px 0", borderRadius: 14, cursor: "pointer",
            background: `linear-gradient(135deg, ${ROUTINES.find(r => r.id === nextRoutineId).color}30, ${ROUTINES.find(r => r.id === nextRoutineId).color}10)`,
            border: `1px solid ${ROUTINES.find(r => r.id === nextRoutineId).color}50`,
          }}>
          <div style={{ fontSize: 32 }}>{ROUTINES.find(r => r.id === nextRoutineId).emoji}</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4, color: ROUTINES.find(r => r.id === nextRoutineId).color }}>
            Routine {nextRoutineId}
          </div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
            {ROUTINES.find(r => r.id === nextRoutineId).duration}
          </div>
        </div>
      </div>

      {/* ALL 3 ROUTINES */}
      {ROUTINES.map(routine => {
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
                <span style={{ flex: 1, fontSize: 12, color: "#aaa" }}>{ex.label}</span>
                <span style={{ fontSize: 10, color: "#555", fontFamily: "'Space Mono'" }}>{ex.reps}</span>
              </div>
            ))}
          </div>
        );
      })}

      {/* HISTORY */}
      {routineDos.length > 0 && (
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>📋 Historique du jour</div>
          {routineDos.map((r, i) => {
            const routine = ROUTINES.find(rt => rt.id === r.routine);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderTop: i > 0 ? "1px solid #0a0a1a" : "none" }}>
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
