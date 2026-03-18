import { useState } from "react";
import {
  OBJECTIVES_PHYSIQUE, OBJECTIVE_BUSINESS, REWARDS_6W,
  SIX_WEEKS_DAYS, SIX_WEEKS_START, SIX_WEEKS_END,
  get6wDayNumber, get6wDaysRemaining, BUSINESS_PROJECTS, JOURNEE_BLOCKS,
} from "../constants/sixweeks.js";

export default function Tab6wObjectifs({ data, save, selectedDate }) {
  const today = new Date().toISOString().split("T")[0];
  const dayNum = get6wDayNumber(today);
  const daysLeft = get6wDaysRemaining();
  const globalProgress = Math.round((dayNum / SIX_WEEKS_DAYS) * 100);

  const sw = data.sixWeeks || {};

  // Calculate objective values from data
  const getObjectiveValue = (obj) => {
    const objectives = sw.objectives || {};
    return objectives[obj.id] !== undefined ? parseFloat(objectives[obj.id]) : obj.start;
  };

  const updateObjective = (id, value) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.sixWeeks) nd.sixWeeks = {};
    if (!nd.sixWeeks.objectives) nd.sixWeeks.objectives = {};
    nd.sixWeeks.objectives[id] = value;
    save(nd);
  };

  // Check if reward is unlocked
  const isRewardUnlocked = (reward) => dayNum >= reward.unlockDay;

  // Stats for summary
  const routineDays = Object.keys(sw.routine || {}).filter(dk => {
    const dayRoutine = sw.routine[dk];
    const count = JOURNEE_BLOCKS.filter(b => dayRoutine[b.id]).length;
    return count >= 5;
  }).length;

  const businessDone = BUSINESS_PROJECTS.flatMap(p => p.tasks).filter(t => sw.business?.[t.id]).length;
  const businessTotal = BUSINESS_PROJECTS.flatMap(p => p.tasks).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Big countdown */}
      <div className="card" style={{ textAlign: "center", padding: 24, position: "relative", overflow: "hidden" }}>
        <style>{`
          @keyframes objPulse{0%,100%{transform:scale(1);opacity:.8}50%{transform:scale(1.05);opacity:1}}
          @keyframes objGlow{0%,100%{box-shadow:0 0 20px rgba(233,69,96,.15)}50%{box-shadow:0 0 40px rgba(233,69,96,.35)}}
        `}</style>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: "radial-gradient(circle at center, rgba(233,69,96,.08), transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 11, color: "#888", letterSpacing: 3, fontFamily: "'Space Mono'", marginBottom: 8 }}>
            {daysLeft > 0 ? "IL RESTE" : "CHALLENGE TERMINE"}
          </div>
          <div style={{
            fontSize: 56, fontWeight: 900, fontFamily: "'Space Mono'",
            color: "#e94560",
            animation: "objPulse 3s ease infinite",
            lineHeight: 1,
          }}>
            {daysLeft > 0 ? daysLeft : "0"}
          </div>
          <div style={{ fontSize: 16, color: "#666", fontWeight: 700, marginBottom: 16 }}>
            {daysLeft > 0 ? "jours" : "BRAVO!"}
          </div>

          {/* Global progress bar */}
          <div style={{ maxWidth: 280, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: "#555" }}>Jour {dayNum}</span>
              <span style={{ fontSize: 10, color: "#555" }}>Jour {SIX_WEEKS_DAYS}</span>
            </div>
            <div style={{ height: 10, background: "rgba(255,255,255,.06)", borderRadius: 5 }}>
              <div style={{
                width: `${globalProgress}%`,
                height: "100%",
                background: "linear-gradient(90deg,#e94560,#ff6b81,#ffeb3b)",
                borderRadius: 5,
                transition: "width .5s",
                animation: "objGlow 3s ease infinite",
              }} />
            </div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{globalProgress}%</div>
          </div>

          {/* Quick stats */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
            <div style={{ padding: "6px 12px", borderRadius: 20, background: "rgba(76,175,80,.1)", fontSize: 10, fontWeight: 700, color: "#4caf50" }}>
              {routineDays} jours routine
            </div>
            <div style={{ padding: "6px 12px", borderRadius: 20, background: "rgba(74,144,217,.1)", fontSize: 10, fontWeight: 700, color: "#4a90d9" }}>
              {businessDone}/{businessTotal} business
            </div>
          </div>
        </div>
      </div>

      {/* Physical objectives */}
      <div className="card">
        <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 14 }}>💪 Objectifs Physiques</div>
        {OBJECTIVES_PHYSIQUE.map(obj => {
          const current = getObjectiveValue(obj);
          let progress;
          if (obj.id === "bf") {
            // Body fat: going DOWN from 22 to 17
            progress = obj.start > obj.target
              ? Math.min(100, Math.max(0, Math.round(((obj.start - current) / (obj.start - obj.target)) * 100)))
              : 0;
          } else {
            // Gain: going UP from 0 to target
            progress = obj.target > 0
              ? Math.min(100, Math.max(0, Math.round((current / obj.target) * 100)))
              : 0;
          }

          return (
            <div key={obj.id} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{obj.emoji}</span>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{obj.label}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="number"
                    step="0.1"
                    value={current || ""}
                    onChange={e => updateObjective(obj.id, e.target.value)}
                    style={{ width: 60, padding: "4px 6px", fontSize: 12, textAlign: "center" }}
                  />
                  <span style={{ fontSize: 10, color: "#888" }}>/ {obj.target}{obj.unit}</span>
                </div>
              </div>
              <div style={{ height: 8, background: "rgba(255,255,255,.06)", borderRadius: 4 }}>
                <div style={{
                  width: `${progress}%`,
                  height: "100%",
                  background: progress >= 100
                    ? "linear-gradient(90deg,#4caf50,#2e7d32)"
                    : progress >= 50
                      ? "linear-gradient(90deg,#ff9800,#ffb74d)"
                      : "linear-gradient(90deg,#e94560,#ff6b81)",
                  borderRadius: 4,
                  transition: "width .4s",
                }} />
              </div>
              <div style={{ textAlign: "right", fontSize: 10, color: "#666", marginTop: 2 }}>{progress}%</div>
            </div>
          );
        })}
      </div>

      {/* Business objective */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 24 }}>{OBJECTIVE_BUSINESS.emoji}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900 }}>Business</div>
            <div style={{ fontSize: 12, color: "#e94560", fontWeight: 700 }}>{OBJECTIVE_BUSINESS.label}</div>
          </div>
        </div>
        <div style={{ height: 6, background: "rgba(255,255,255,.06)", borderRadius: 3 }}>
          <div style={{
            width: `${Math.round((businessDone / businessTotal) * 100)}%`,
            height: "100%",
            background: "linear-gradient(90deg,#e94560,#ff6b81)",
            borderRadius: 3,
            transition: "width .4s",
          }} />
        </div>
        <div style={{ fontSize: 10, color: "#888", marginTop: 4 }}>
          {businessDone}/{businessTotal} taches — {Math.round((businessDone / businessTotal) * 100)}%
        </div>
      </div>

      {/* Rewards */}
      <div className="card">
        <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 14 }}>🎁 Recompenses</div>
        {REWARDS_6W.map(reward => {
          const unlocked = isRewardUnlocked(reward);
          return (
            <div key={reward.id} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "14px",
              borderRadius: 14,
              background: unlocked
                ? "linear-gradient(135deg, rgba(76,175,80,.08), rgba(255,235,59,.05))"
                : "rgba(255,255,255,.02)",
              border: unlocked
                ? "1px solid rgba(76,175,80,.3)"
                : "1px solid #1e1e4a",
              marginBottom: 8,
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Lock overlay for locked rewards */}
              {!unlocked && (
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                  background: "rgba(0,0,0,.4)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  zIndex: 2,
                }}>
                  <div style={{ fontSize: 24 }}>🔒</div>
                </div>
              )}

              <div style={{ fontSize: 28 }}>{reward.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: unlocked ? "#4caf50" : "#888" }}>
                  {reward.label}
                </div>
                <div style={{ fontSize: 10, color: "#666" }}>
                  {reward.budget}
                </div>
              </div>
              <div style={{
                fontSize: 9, color: unlocked ? "#4caf50" : "#555",
                fontFamily: "'Space Mono'", fontWeight: 700,
              }}>
                {unlocked ? "DEBLOQUE" : `Jour ${reward.unlockDay}`}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dates */}
      <div style={{ textAlign: "center", padding: "8px 0", fontSize: 10, color: "#444" }}>
        {SIX_WEEKS_START.split("-").reverse().join("/")} → {SIX_WEEKS_END.split("-").reverse().join("/")}
      </div>
    </div>
  );
}
