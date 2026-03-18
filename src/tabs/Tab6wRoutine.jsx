import { useState } from "react";
import {
  JOURNEE_BLOCKS, NUTRITION_PRINCIPLES, PAUSE_ACTIVE,
  SIX_WEEKS_DAYS, SIX_WEEKS_START, SIX_WEEKS_END,
  get6wDayNumber, get6wDaysRemaining,
} from "../constants/sixweeks.js";

export default function Tab6wRoutine({ data, save, selectedDate }) {
  const [showCalendar, setShowCalendar] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const dayNum = get6wDayNumber(selectedDate);
  const daysLeft = get6wDaysRemaining();

  const sw = data.sixWeeks || {};
  const journeeDay = sw.routine?.[selectedDate] || {};

  const toggleBlock = (blockId) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.sixWeeks) nd.sixWeeks = {};
    if (!nd.sixWeeks.routine) nd.sixWeeks.routine = {};
    if (!nd.sixWeeks.routine[selectedDate]) nd.sixWeeks.routine[selectedDate] = {};
    nd.sixWeeks.routine[selectedDate][blockId] = !nd.sixWeeks.routine[selectedDate][blockId];
    save(nd);
  };

  const allItems = [...JOURNEE_BLOCKS, PAUSE_ACTIVE];
  const checkedCount = allItems.filter(b => journeeDay[b.id]).length;
  const progress = Math.round((checkedCount / allItems.length) * 100);

  // Calculate streak
  const calcStreak = () => {
    let streak = 0;
    const d = new Date(today);
    for (let i = 0; i < 42; i++) {
      const dk = d.toISOString().split("T")[0];
      if (dk < SIX_WEEKS_START) break;
      const dayRoutine = sw.routine?.[dk] || {};
      const count = JOURNEE_BLOCKS.filter(b => dayRoutine[b.id]).length;
      if (count >= 5) streak++;
      else if (i > 0) break;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  };
  const streak = calcStreak();

  // Calendar data
  const getCalendarDays = () => {
    const days = [];
    const start = new Date(SIX_WEEKS_START);
    for (let i = 0; i < SIX_WEEKS_DAYS; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dk = d.toISOString().split("T")[0];
      const dayRoutine = sw.routine?.[dk] || {};
      const count = JOURNEE_BLOCKS.filter(b => dayRoutine[b.id]).length;
      const pct = count / JOURNEE_BLOCKS.length;
      days.push({ date: dk, day: i + 1, count, pct, dow: d.getDay() });
    }
    return days;
  };

  const pauseDone = journeeDay[PAUSE_ACTIVE.id];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Day counter + progress */}
      <div className="card" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#888", letterSpacing: 2, fontFamily: "'Space Mono'", marginBottom: 4 }}>
          JOUR {dayNum} / {SIX_WEEKS_DAYS}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "'Space Mono'", color: "#e94560" }}>
            {progress}%
          </div>
          {streak > 0 && (
            <div style={{ padding: "4px 12px", borderRadius: 20, background: "rgba(255,152,0,.12)", border: "1px solid rgba(255,152,0,.25)", fontSize: 13, fontWeight: 700, color: "#ff9800" }}>
              {streak} jours
            </div>
          )}
        </div>
        {/* Progress bar */}
        <div style={{ height: 8, background: "rgba(255,255,255,.06)", borderRadius: 4 }}>
          <div style={{
            width: `${progress}%`,
            height: "100%",
            background: progress === 100
              ? "linear-gradient(90deg,#4caf50,#2e7d32)"
              : progress >= 70
                ? "linear-gradient(90deg,#4caf50,#66bb6a)"
                : progress >= 40
                  ? "linear-gradient(90deg,#ff9800,#ffb74d)"
                  : "linear-gradient(90deg,#e94560,#ff6b81)",
            borderRadius: 4,
            transition: "width .4s ease",
          }} />
        </div>
        <div style={{ fontSize: 11, color: "#666", marginTop: 6 }}>
          {checkedCount}/{allItems.length} completes
          {daysLeft > 0 && <span> · {daysLeft}j restants</span>}
        </div>
      </div>

      {/* Checklist du jour */}
      <div className="card" style={{ padding: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>Ma journee</div>
        {JOURNEE_BLOCKS.map((block, idx) => {
          const done = journeeDay[block.id];
          return (
            <div
              key={block.id}
              onClick={() => toggleBlock(block.id)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 12px",
                marginBottom: idx < JOURNEE_BLOCKS.length - 1 ? 4 : 0,
                background: done ? "rgba(76,175,80,.08)" : "rgba(255,255,255,.02)",
                borderLeft: done ? "3px solid #4caf50" : "3px solid transparent",
                borderRadius: 10,
                cursor: "pointer",
                transition: "all .2s ease",
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: done ? "linear-gradient(135deg,#4caf50,#2e7d32)" : "rgba(255,255,255,.06)",
                border: done ? "none" : "2px solid #2a2a4a",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 800, color: "white",
                transition: "all .2s ease",
                flexShrink: 0,
              }}>
                {done ? "✓" : ""}
              </div>

              <span style={{ fontSize: 20, flexShrink: 0 }}>{block.emoji}</span>

              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 14, fontWeight: 700,
                  color: done ? "#4caf50" : "#ddd",
                  textDecoration: done ? "line-through" : "none",
                  opacity: done ? 0.7 : 1,
                }}>
                  {block.label}
                </div>
                {block.subtitle && (
                  <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{block.subtitle}</div>
                )}
              </div>

              {block.time && (
                <div style={{
                  fontSize: 10, color: "#555",
                  fontFamily: "'Space Mono'",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}>
                  {block.time}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Principes nutrition */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, color: "#e94560" }}>Principes</div>
        {NUTRITION_PRINCIPLES.map((p, idx) => (
          <div key={idx} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 0",
            borderBottom: idx < NUTRITION_PRINCIPLES.length - 1 ? "1px solid rgba(255,255,255,.04)" : "none",
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{p.emoji}</span>
            <span style={{ fontSize: 13, color: "#ccc", fontWeight: 600 }}>{p.text}</span>
          </div>
        ))}
      </div>

      {/* Pause active */}
      <div className="card" style={{ padding: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, color: "#ff9800" }}>Bonus</div>
        <div
          onClick={() => toggleBlock(PAUSE_ACTIVE.id)}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "14px 12px",
            background: pauseDone ? "rgba(255,152,0,.08)" : "rgba(255,255,255,.02)",
            borderLeft: pauseDone ? "3px solid #ff9800" : "3px solid transparent",
            borderRadius: 10,
            cursor: "pointer",
            transition: "all .2s ease",
          }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: pauseDone ? "linear-gradient(135deg,#ff9800,#f57c00)" : "rgba(255,255,255,.06)",
            border: pauseDone ? "none" : "2px solid #2a2a4a",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 800, color: "white",
            transition: "all .2s ease",
            flexShrink: 0,
          }}>
            {pauseDone ? "✓" : ""}
          </div>
          <span style={{ fontSize: 20, flexShrink: 0 }}>{PAUSE_ACTIVE.emoji}</span>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 14, fontWeight: 800,
              color: pauseDone ? "#ff9800" : "#ddd",
              textDecoration: pauseDone ? "line-through" : "none",
              opacity: pauseDone ? 0.7 : 1,
            }}>
              {PAUSE_ACTIVE.label}
            </div>
            <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{PAUSE_ACTIVE.detail}</div>
          </div>
        </div>
      </div>

      {/* Calendar toggle */}
      <div
        onClick={() => setShowCalendar(!showCalendar)}
        style={{
          textAlign: "center", padding: "10px 0", fontSize: 12, color: "#888",
          cursor: "pointer", fontWeight: 600,
        }}
      >
        {showCalendar ? "Masquer le calendrier" : "Voir le calendrier"}
      </div>

      {/* Calendar */}
      {showCalendar && (
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>Calendrier 6 Semaines</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 6 }}>
            {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
              <div key={i} style={{ textAlign: "center", fontSize: 9, color: "#555", fontWeight: 700 }}>{d}</div>
            ))}
          </div>
          {(() => {
            const calDays = getCalendarDays();
            const firstDow = calDays[0]?.dow || 1;
            const offset = firstDow === 0 ? 6 : firstDow - 1;
            const cells = [];
            for (let i = 0; i < offset; i++) cells.push(<div key={`e${i}`} />);
            calDays.forEach(cd => {
              const isToday = cd.date === today;
              const isFuture = cd.date > today;
              const bg = isFuture
                ? "rgba(255,255,255,.03)"
                : cd.pct >= 0.8
                  ? "rgba(76,175,80,.3)"
                  : cd.pct >= 0.5
                    ? "rgba(255,152,0,.3)"
                    : cd.pct > 0
                      ? "rgba(233,69,96,.2)"
                      : "rgba(255,255,255,.03)";
              cells.push(
                <div key={cd.date} style={{
                  textAlign: "center", padding: "6px 2px", borderRadius: 8,
                  background: bg,
                  border: isToday ? "2px solid #e94560" : "1px solid transparent",
                  fontSize: 10, fontWeight: isToday ? 800 : 500,
                  color: isFuture ? "#444" : cd.pct >= 0.8 ? "#4caf50" : "#aaa",
                  fontFamily: "'Space Mono'",
                }}>
                  {cd.day}
                </div>
              );
            });
            return (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
                {cells}
              </div>
            );
          })()}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 10 }}>
            {[
              { color: "rgba(76,175,80,.4)", label: "80%+" },
              { color: "rgba(255,152,0,.4)", label: "50%+" },
              { color: "rgba(233,69,96,.3)", label: "<50%" },
            ].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, color: "#666" }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
