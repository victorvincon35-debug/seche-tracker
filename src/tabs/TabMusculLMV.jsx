import { useState, useEffect, useRef, useMemo } from "react";
import { LMV_DAYS, WARMUP_HALTERE, WARMUP_BATON, WARMUP_ARTIC, LMV_EXERCISES, LMV_REST_PRESETS } from "../constants/musculMV.js";

export default function TabMusculLMV({ data, save, selectedDate, timerPreset, setTimerPreset, setTimerSeconds, setTimerRunning }) {
  const [showHistory, setShowHistory] = useState(null); // exerciseId or null
  const [restTimer, setRestTimer] = useState(0);
  const [restTimerRunning, setRestTimerRunning] = useState(false);
  const restTimerRef = useRef(null);

  const dow = new Date(selectedDate).getDay();
  const session = LMV_DAYS[dow];
  const isTrainingDay = session.type === "muscu";
  const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const lmvData = data.days?.[selectedDate]?.lmv || {};

  // Rest timer effect
  useEffect(() => {
    if (restTimerRunning && restTimer > 0) {
      restTimerRef.current = setTimeout(() => setRestTimer(t => t - 1), 1000);
    } else if (restTimerRunning && restTimer <= 0) {
      setRestTimerRunning(false);
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 660; gain.gain.value = 0.2;
        osc.start();
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0, ctx.currentTime + 0.45);
        osc.stop(ctx.currentTime + 0.5);
      } catch (e) { /* no audio */ }
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
    return () => clearTimeout(restTimerRef.current);
  }, [restTimerRunning, restTimer]);

  const startRestTimer = (seconds) => {
    setRestTimer(seconds);
    setRestTimerRunning(true);
  };

  // Find previous session for comparison
  const getPreviousSessions = useMemo(() => {
    const sessions = [];
    const allDays = Object.keys(data.days || {}).sort().reverse();
    for (const d of allDays) {
      if (d >= selectedDate) continue;
      const dayDow = new Date(d).getDay();
      if (dayDow === 1 || dayDow === 3 || dayDow === 5) {
        if (data.days[d]?.lmv?.exercises) {
          sessions.push({ date: d, data: data.days[d].lmv });
        }
      }
      if (sessions.length >= 10) break;
    }
    return sessions;
  }, [data.days, selectedDate]);

  const lastSession = getPreviousSessions[0] || null;

  // Data helpers
  const updateSet = (exerciseId, setIndex, field, value) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.days[selectedDate]) nd.days[selectedDate] = {};
    if (!nd.days[selectedDate].lmv) nd.days[selectedDate].lmv = { exercises: {}, warmup: {}, notes: {} };
    if (!nd.days[selectedDate].lmv.exercises) nd.days[selectedDate].lmv.exercises = {};
    if (!nd.days[selectedDate].lmv.exercises[exerciseId]) nd.days[selectedDate].lmv.exercises[exerciseId] = { sets: [] };
    const ex = nd.days[selectedDate].lmv.exercises[exerciseId];
    if (!ex.sets[setIndex]) ex.sets[setIndex] = {};
    ex.sets[setIndex][field] = value;
    save(nd);
  };

  const toggleSetDone = (exerciseId, setIndex, restSeconds) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.days[selectedDate]) nd.days[selectedDate] = {};
    if (!nd.days[selectedDate].lmv) nd.days[selectedDate].lmv = { exercises: {}, warmup: {}, notes: {} };
    if (!nd.days[selectedDate].lmv.exercises) nd.days[selectedDate].lmv.exercises = {};
    if (!nd.days[selectedDate].lmv.exercises[exerciseId]) nd.days[selectedDate].lmv.exercises[exerciseId] = { sets: [] };
    const ex = nd.days[selectedDate].lmv.exercises[exerciseId];
    if (!ex.sets[setIndex]) ex.sets[setIndex] = {};
    const was = ex.sets[setIndex].done || false;
    ex.sets[setIndex].done = !was;
    save(nd);
    if (!was) startRestTimer(restSeconds);
  };

  const addSet = (exerciseId) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.days[selectedDate]) nd.days[selectedDate] = {};
    if (!nd.days[selectedDate].lmv) nd.days[selectedDate].lmv = { exercises: {}, warmup: {}, notes: {} };
    if (!nd.days[selectedDate].lmv.exercises) nd.days[selectedDate].lmv.exercises = {};
    if (!nd.days[selectedDate].lmv.exercises[exerciseId]) nd.days[selectedDate].lmv.exercises[exerciseId] = { sets: [] };
    nd.days[selectedDate].lmv.exercises[exerciseId].sets.push({});
    save(nd);
  };

  const removeSet = (exerciseId, setIndex) => {
    const nd = JSON.parse(JSON.stringify(data));
    nd.days[selectedDate].lmv.exercises[exerciseId].sets.splice(setIndex, 1);
    save(nd);
  };

  const toggleWarmup = (id) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.days[selectedDate]) nd.days[selectedDate] = {};
    if (!nd.days[selectedDate].lmv) nd.days[selectedDate].lmv = { exercises: {}, warmup: {}, notes: {} };
    if (!nd.days[selectedDate].lmv.warmup) nd.days[selectedDate].lmv.warmup = {};
    nd.days[selectedDate].lmv.warmup[id] = !nd.days[selectedDate].lmv.warmup[id];
    save(nd);
  };

  const setExerciseNotes = (exerciseId, notes) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.days[selectedDate]) nd.days[selectedDate] = {};
    if (!nd.days[selectedDate].lmv) nd.days[selectedDate].lmv = { exercises: {}, warmup: {}, notes: {} };
    if (!nd.days[selectedDate].lmv.notes) nd.days[selectedDate].lmv.notes = {};
    nd.days[selectedDate].lmv.notes[exerciseId] = notes;
    save(nd);
  };

  // Comparison helpers
  const getComparison = (exerciseId, setIndex, field, currentVal) => {
    if (!lastSession?.data?.exercises?.[exerciseId]?.sets?.[setIndex]) return null;
    const prev = lastSession.data.exercises[exerciseId].sets[setIndex][field];
    if (!prev || !currentVal) return null;
    const prevNum = parseFloat(prev);
    const curNum = parseFloat(currentVal);
    if (isNaN(prevNum) || isNaN(curNum)) return null;
    if (curNum > prevNum) return "up";
    if (curNum < prevNum) return "down";
    return "same";
  };

  const getLastPerf = (exerciseId, setIndex) => {
    if (!lastSession?.data?.exercises?.[exerciseId]?.sets?.[setIndex]) return null;
    const s = lastSession.data.exercises[exerciseId].sets[setIndex];
    return s;
  };

  // Next training day
  const getNextTrainingDay = () => {
    const days = { 1: "Lundi", 3: "Mercredi", 5: "Vendredi" };
    const today = new Date(selectedDate).getDay();
    const trainingDays = [1, 3, 5];
    for (const d of trainingDays) {
      if (d > today) return days[d];
    }
    return days[1]; // Next Monday
  };

  // Get exercise sets (from data or defaults)
  const getExSets = (ex) => {
    const saved = lmvData.exercises?.[ex.id]?.sets;
    if (saved && saved.length > 0) return saved;
    return ex.defaultSets.map(ds => ({ weight: "", reps: "", done: false }));
  };

  const formatTimerDisplay = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* WEEK OVERVIEW */}
      <div className="card" style={{ padding: 12 }}>
        <div style={{ display: "flex", gap: 4, justifyContent: "space-between" }}>
          {[1, 2, 3, 4, 5, 6, 0].map(d => {
            const s = LMV_DAYS[d];
            const isToday = d === dow;
            return (
              <div key={d} style={{ flex: 1, textAlign: "center", padding: "8px 2px", borderRadius: 12,
                background: isToday ? "rgba(233,69,96,.15)" : "transparent",
                border: isToday ? "1px solid #e94560" : "1px solid transparent",
              }}>
                <div style={{ fontSize: 9, color: isToday ? "#e94560" : "#555", fontWeight: 700 }}>{dayNames[d]}</div>
                <div style={{ fontSize: 14, marginTop: 2 }}>{s.emoji}</div>
                <div style={{ fontSize: 7, color: isToday ? "#fff" : "#444", marginTop: 2 }}>{s.type === "muscu" ? "Muscu" : "Repos"}</div>
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
        {isTrainingDay && (
          <div style={{ marginTop: 8, fontSize: 13, color: "#4caf50", fontWeight: 700 }}>
            C'est jour de muscu 💪
          </div>
        )}
        {!isTrainingDay && (
          <div style={{ marginTop: 8, fontSize: 12, color: "#888" }}>
            Prochain entraînement : {getNextTrainingDay()}
          </div>
        )}
      </div>

      {/* REST DAY */}
      {!isTrainingDay && (
        <div className="card" style={{ textAlign: "center", padding: "32px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🧘</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#4caf50" }}>Jour de repos</div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>Récupération — Prochain entraînement : {getNextTrainingDay()}</div>
        </div>
      )}

      {/* REST TIMER FLOATING */}
      {restTimerRunning && (
        <div style={{
          position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", zIndex: 999,
          background: restTimer <= 5 ? "linear-gradient(135deg,#e94560,#c23152)" : "linear-gradient(135deg,#1a1a3e,#0d0d24)",
          border: `2px solid ${restTimer <= 5 ? "#e94560" : "#4caf50"}`,
          borderRadius: 20, padding: "12px 28px", display: "flex", alignItems: "center", gap: 12,
          boxShadow: "0 4px 20px rgba(0,0,0,.5)",
        }}>
          <span style={{ fontSize: 20 }}>⏱️</span>
          <span style={{ fontSize: 28, fontWeight: 900, fontFamily: "'Space Mono'", color: restTimer <= 5 ? "#fff" : "#4caf50" }}>
            {formatTimerDisplay(restTimer)}
          </span>
          <div onClick={() => setRestTimerRunning(false)} style={{ cursor: "pointer", fontSize: 16, color: "#888", marginLeft: 8 }}>✕</div>
        </div>
      )}

      {isTrainingDay && (
        <>
          {/* ÉCHAUFFEMENT — Haltère léger */}
          <div className="card" style={{ padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 20 }}>🔥</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>Échauffement — Haltère léger</div>
                <div style={{ fontSize: 10, color: "#888" }}>Enchaîné sans pause</div>
              </div>
            </div>
            {WARMUP_HALTERE.map(item => {
              const done = lmvData.warmup?.[item.id] || false;
              return (
                <div key={item.id} className={`ci ${done ? "done" : ""}`} onClick={() => toggleWarmup(item.id)} style={{ padding: "10px 14px" }}>
                  <div className="cb">{done ? "✓" : ""}</div>
                  <span style={{ fontSize: 16 }}>{item.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 12, fontWeight: done ? 600 : 400 }}>{item.label}</span>
                    <div style={{ fontSize: 10, color: "#888" }}>{item.reps}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ÉCHAUFFEMENT — Bâton + Élastique */}
          <div className="card" style={{ padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 20 }}>🔥</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>Échauffement — Bâton + Élastique</div>
              </div>
            </div>
            {WARMUP_BATON.map(item => {
              const done = lmvData.warmup?.[item.id] || false;
              return (
                <div key={item.id} className={`ci ${done ? "done" : ""}`} onClick={() => toggleWarmup(item.id)} style={{ padding: "10px 14px" }}>
                  <div className="cb">{done ? "✓" : ""}</div>
                  <span style={{ fontSize: 16 }}>{item.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 12, fontWeight: done ? 600 : 400 }}>{item.label}</span>
                    <div style={{ fontSize: 10, color: "#888" }}>{item.reps}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ÉCHAUFFEMENT — Articulations */}
          <div className="card" style={{ padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 20 }}>🔥</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>Échauffement — Articulations</div>
                <div style={{ fontSize: 10, color: "#888" }}>15 tours chacune</div>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {WARMUP_ARTIC.map(item => {
                const done = lmvData.warmup?.[item.id] || false;
                return (
                  <div key={item.id} onClick={() => toggleWarmup(item.id)} style={{
                    padding: "8px 14px", borderRadius: 10, cursor: "pointer",
                    background: done ? "rgba(76,175,80,.15)" : "#0a0a1a",
                    border: `1px solid ${done ? "#4caf50" : "#1e1e4a"}`,
                    fontSize: 11, fontWeight: done ? 700 : 400,
                    color: done ? "#4caf50" : "#888",
                  }}>
                    {done ? "✓ " : ""}{item.label}
                  </div>
                );
              })}
            </div>
          </div>

          {/* EXERCISES */}
          {LMV_EXERCISES.map((ex, exIdx) => {
            const exSets = getExSets(ex);
            const exData = lmvData.exercises?.[ex.id] || { sets: [] };
            const doneCount = (exData.sets || []).filter(s => s?.done).length;
            const allDone = doneCount > 0 && doneCount >= exSets.length;
            const lastPerfs = lastSession?.data?.exercises?.[ex.id]?.sets || [];
            const exerciseNotes = lmvData.notes?.[ex.id] || "";

            return (
              <div key={ex.id} className="card" style={{ padding: 14, border: allDone ? "1px solid rgba(76,175,80,.3)" : undefined }}>
                {/* Exercise header */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(233,69,96,.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                    {ex.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>
                      {exIdx + 1}. {ex.label}
                      {allDone && <span style={{ marginLeft: 6 }}>✅</span>}
                    </div>
                    <div style={{ fontSize: 10, color: "#888" }}>
                      Objectif : {ex.objectif} — Repos : {ex.rest}s
                    </div>
                  </div>
                  {/* History toggle */}
                  <div onClick={() => setShowHistory(showHistory === ex.id ? null : ex.id)} style={{
                    padding: "4px 8px", borderRadius: 8, cursor: "pointer", fontSize: 10, fontWeight: 600,
                    background: showHistory === ex.id ? "rgba(74,144,217,.15)" : "rgba(255,255,255,.05)",
                    color: showHistory === ex.id ? "#4a90d9" : "#555",
                    border: `1px solid ${showHistory === ex.id ? "#4a90d9" : "#1e1e4a"}`,
                  }}>
                    📊
                  </div>
                </div>

                {/* Exercise notes (from program) */}
                {ex.notes && (
                  <div style={{ fontSize: 10, color: "#ffeb3b", marginBottom: 10, padding: "6px 10px", borderRadius: 8, background: "rgba(255,235,59,.06)", lineHeight: 1.5 }}>
                    💡 {ex.notes}
                  </div>
                )}

                {/* Sets */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {/* Header row */}
                  <div style={{ display: "flex", gap: 6, alignItems: "center", padding: "0 4px" }}>
                    <div style={{ width: 32, fontSize: 9, color: "#555", textAlign: "center" }}>Série</div>
                    <div style={{ flex: 1, fontSize: 9, color: "#555" }}>Poids (kg)</div>
                    <div style={{ flex: 1, fontSize: 9, color: "#555" }}>Reps</div>
                    <div style={{ width: 40, fontSize: 9, color: "#555", textAlign: "center" }}>Fait</div>
                  </div>

                  {exSets.map((defaultSet, si) => {
                    const setData = exData.sets?.[si] || {};
                    const done = setData.done || false;
                    const prevPerf = getLastPerf(ex.id, si);
                    const weightComp = getComparison(ex.id, si, "weight", setData.weight);
                    const repsComp = getComparison(ex.id, si, "reps", setData.reps);

                    return (
                      <div key={si}>
                        {/* Previous session info */}
                        {prevPerf && (prevPerf.weight || prevPerf.reps) && (
                          <div style={{ fontSize: 9, color: "#555", marginBottom: 2, paddingLeft: 38, fontFamily: "'Space Mono'" }}>
                            Dernière fois : {prevPerf.weight ? `${prevPerf.weight}kg` : "—"} × {prevPerf.reps || "—"} reps
                          </div>
                        )}
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          {/* Series number */}
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: done ? "rgba(76,175,80,.15)" : "#0a0a1a",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, fontWeight: 700, fontFamily: "'Space Mono'",
                            color: done ? "#4caf50" : "#555",
                          }}>
                            S{si + 1}
                          </div>

                          {/* Weight input */}
                          <div style={{ flex: 1, position: "relative" }}>
                            <input type="number" placeholder={ex.defaultSets[si]?.weight || "kg"}
                              value={setData.weight || ""}
                              onChange={e => updateSet(ex.id, si, "weight", e.target.value)}
                              style={{ width: "100%", padding: "8px 6px", borderRadius: 8, background: "#0a0a1a",
                                border: `1px solid ${weightComp === "up" ? "#4caf50" : weightComp === "down" ? "#e94560" : "#1e1e4a"}`,
                                color: "#ffeb3b", fontSize: 13, textAlign: "center", fontFamily: "'Space Mono'",
                                outline: "none", boxSizing: "border-box",
                              }}
                            />
                            {weightComp && (
                              <span style={{ position: "absolute", right: 4, top: 2, fontSize: 10,
                                color: weightComp === "up" ? "#4caf50" : weightComp === "down" ? "#e94560" : "#555",
                              }}>
                                {weightComp === "up" ? "▲" : weightComp === "down" ? "▼" : "="}
                              </span>
                            )}
                          </div>

                          {/* Reps input */}
                          <div style={{ flex: 1, position: "relative" }}>
                            <input type="number" placeholder={ex.defaultSets[si]?.reps || "reps"}
                              value={setData.reps || ""}
                              onChange={e => updateSet(ex.id, si, "reps", e.target.value)}
                              style={{ width: "100%", padding: "8px 6px", borderRadius: 8, background: "#0a0a1a",
                                border: `1px solid ${repsComp === "up" ? "#4caf50" : repsComp === "down" ? "#e94560" : "#1e1e4a"}`,
                                color: "#fff", fontSize: 13, textAlign: "center", fontFamily: "'Space Mono'",
                                outline: "none", boxSizing: "border-box",
                              }}
                            />
                            {repsComp && (
                              <span style={{ position: "absolute", right: 4, top: 2, fontSize: 10,
                                color: repsComp === "up" ? "#4caf50" : repsComp === "down" ? "#e94560" : "#555",
                              }}>
                                {repsComp === "up" ? "▲" : repsComp === "down" ? "▼" : "="}
                              </span>
                            )}
                          </div>

                          {/* Done button */}
                          <div onClick={() => toggleSetDone(ex.id, si, ex.rest)} style={{
                            width: 40, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", background: done ? "linear-gradient(135deg,#4caf50,#2e7d32)" : "#0a0a1a",
                            border: `2px solid ${done ? "#4caf50" : "#2a2a4a"}`, fontSize: 14, fontWeight: 800,
                            color: done ? "#fff" : "#555", transition: "all .2s",
                          }}>
                            {done ? "✓" : ""}
                          </div>
                        </div>
                        {/* Default set note */}
                        {ex.defaultSets[si]?.note && (
                          <div style={{ fontSize: 9, color: "#444", paddingLeft: 38, marginTop: 1 }}>{ex.defaultSets[si].note}</div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add/remove set */}
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <div onClick={() => addSet(ex.id)} style={{
                    flex: 1, padding: "6px 0", borderRadius: 8, textAlign: "center", cursor: "pointer",
                    fontSize: 11, color: "#555", border: "1px dashed #1e1e4a",
                  }}>+ Ajouter série</div>
                  {exSets.length > 1 && lmvData.exercises?.[ex.id]?.sets?.length > ex.defaultSets.length && (
                    <div onClick={() => removeSet(ex.id, exSets.length - 1)} style={{
                      padding: "6px 12px", borderRadius: 8, textAlign: "center", cursor: "pointer",
                      fontSize: 11, color: "#e94560", border: "1px dashed rgba(233,69,96,.3)",
                    }}>−</div>
                  )}
                </div>

                {/* User notes for this exercise */}
                <div style={{ marginTop: 8 }}>
                  <textarea value={exerciseNotes} onChange={e => setExerciseNotes(ex.id, e.target.value)}
                    placeholder="Notes (sensations, ajustements...)"
                    style={{ width: "100%", minHeight: 36, background: "#0a0a1a", border: "1px solid #1e1e4a",
                      borderRadius: 8, color: "#fff", padding: 8, fontSize: 11, fontFamily: "'Outfit'",
                      resize: "vertical", outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                {/* HISTORY PANEL */}
                {showHistory === ex.id && (
                  <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: "rgba(74,144,217,.06)", border: "1px solid rgba(74,144,217,.2)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#4a90d9", marginBottom: 8 }}>📊 Historique — {ex.label}</div>
                    {getPreviousSessions.length === 0 ? (
                      <div style={{ fontSize: 11, color: "#555" }}>Aucune donnée précédente</div>
                    ) : (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
                          <thead>
                            <tr>
                              <th style={{ textAlign: "left", padding: "4px 6px", color: "#555", fontWeight: 600 }}>Date</th>
                              <th style={{ textAlign: "center", padding: "4px 6px", color: "#555", fontWeight: 600 }}>Séries</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getPreviousSessions.map(sess => {
                              const exHist = sess.data.exercises?.[ex.id];
                              if (!exHist?.sets?.length) return null;
                              const dateObj = new Date(sess.date);
                              const dateStr = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
                              const dayLabel = dayNames[dateObj.getDay()];
                              return (
                                <tr key={sess.date} style={{ borderTop: "1px solid #0a0a1a" }}>
                                  <td style={{ padding: "4px 6px", color: "#aaa", fontSize: 10, fontFamily: "'Space Mono'" }}>
                                    {dayLabel} {dateStr}
                                  </td>
                                  <td style={{ padding: "4px 6px", color: "#fff", fontSize: 10, fontFamily: "'Space Mono'" }}>
                                    {exHist.sets.map((s, i) => (
                                      <span key={i} style={{ marginRight: 8 }}>
                                        {s?.weight || "—"}kg×{s?.reps || "—"}
                                      </span>
                                    ))}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* FIN DE SÉANCE */}
          <div className="card" style={{ textAlign: "center", padding: "20px 16px", background: "linear-gradient(145deg,#0d1a0d,#0d0d24)", border: "1px solid rgba(76,175,80,.3)" }}>
            <div style={{ fontSize: 32, marginBottom: 4 }}>🚶</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#4caf50" }}>Revenir à pied</div>
          </div>

          {/* REST TIMER CONTROLS */}
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>⏱️ Chrono récup</div>
            <div style={{ display: "flex", gap: 6 }}>
              {LMV_REST_PRESETS.map(p => (
                <div key={p.seconds} onClick={() => setTimerPreset(p.seconds)} style={{
                  flex: 1, padding: "8px 0", borderRadius: 10, textAlign: "center", cursor: "pointer",
                  fontSize: 13, fontWeight: 700, fontFamily: "'Space Mono'",
                  background: timerPreset === p.seconds ? "rgba(233,69,96,.15)" : "#0a0a1a",
                  border: `1px solid ${timerPreset === p.seconds ? "#e94560" : "#1e1e4a"}`,
                  color: timerPreset === p.seconds ? "#e94560" : "#555",
                }}>{p.label}</div>
              ))}
              <div onClick={() => startRestTimer(timerPreset)} style={{
                flex: 1, padding: "8px 0", borderRadius: 10, textAlign: "center", cursor: "pointer",
                fontSize: 13, fontWeight: 700, background: "linear-gradient(135deg,#e94560,#c23152)", color: "#fff",
              }}>GO</div>
            </div>
            {restTimerRunning && (
              <div style={{ marginTop: 10, textAlign: "center" }}>
                <div style={{ fontSize: 36, fontWeight: 900, fontFamily: "'Space Mono'", color: restTimer <= 5 ? "#e94560" : "#4caf50" }}>
                  {formatTimerDisplay(restTimer)}
                </div>
                <div onClick={() => setRestTimerRunning(false)} style={{ marginTop: 6, fontSize: 11, color: "#e94560", cursor: "pointer" }}>
                  Annuler
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
