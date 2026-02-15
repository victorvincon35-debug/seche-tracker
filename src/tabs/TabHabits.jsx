import { HABITS, SOCIAL_HABITS, SOCIAL_WEEKLY } from "../constants/habits.js";
import { getToday, getMonday, getWeekDates } from "../utils/helpers.js";

export default function TabHabits({ data, dayData, toggleItem, selectedDate, programNotStarted, daysUntilProgram }) {
  if (programNotStarted) return (
    <div className="card" style={{ textAlign: "center", padding: "32px 20px" }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>🚀</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#ffeb3b" }}>Début dans {daysUntilProgram} jour{daysUntilProgram > 1 ? "s" : ""}</div>
      <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Lundi 23 Février 2026</div>
    </div>
  );

  // Count social interactions this week
  const weekSocialCount = (() => {
    const monday = getMonday(selectedDate || getToday());
    const weekDates = getWeekDates(monday);
    let count = 0;
    for (const d of weekDates) {
      const day = data?.days?.[d];
      if (!day?.habits) continue;
      for (const sh of SOCIAL_HABITS) {
        if (day.habits[sh.id]) count++;
      }
      for (const sw of SOCIAL_WEEKLY) {
        if (day.habits[sw.id]) count++;
      }
    }
    return count;
  })();

  // Check if today has any social activity
  const hasSocialToday = SOCIAL_HABITS.some(h => dayData.habits?.[h.id]) || SOCIAL_WEEKLY.some(h => dayData.habits?.[h.id]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>✅ Habitudes du jour</div>
        {HABITS.map(h => {
          const done = dayData.habits?.[h.id] || false;
          return (
            <div key={h.id} className={`ci ${done ? "done" : ""}`} onClick={() => toggleItem("habits", h.id, h.xp)}>
              <div className="cb">{done ? "✓" : ""}</div>
              <span style={{ fontSize: 18 }}>{h.emoji}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: done ? 600 : 400 }}>{h.label}</span>
              <span className="xp">+{h.xp}</span>
            </div>
          );
        })}
      </div>

      {/* SOCIAL SECTION */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>👥 Social</div>
          <div style={{ fontSize: 11, fontFamily: "'Space Mono'", color: weekSocialCount > 0 ? "#4caf50" : "#555" }}>
            {weekSocialCount} cette semaine
          </div>
        </div>

        {/* Daily social habits */}
        {SOCIAL_HABITS.map(h => {
          const done = dayData.habits?.[h.id] || false;
          return (
            <div key={h.id} className={`ci ${done ? "done" : ""}`} onClick={() => toggleItem("habits", h.id, h.xp)}>
              <div className="cb">{done ? "✓" : ""}</div>
              <span style={{ fontSize: 18 }}>{h.emoji}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: done ? 600 : 400 }}>{h.label}</span>
              <span className="xp">+{h.xp}</span>
            </div>
          );
        })}

        {/* Weekly social habits */}
        {SOCIAL_WEEKLY.map(h => {
          const done = dayData.habits?.[h.id] || false;
          return (
            <div key={h.id} className={`ci ${done ? "done" : ""}`} onClick={() => toggleItem("habits", h.id, h.xp)}>
              <div className="cb">{done ? "✓" : ""}</div>
              <span style={{ fontSize: 18 }}>{h.emoji}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: done ? 600 : 400 }}>{h.label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 9, color: "#888", background: "#0a0a1a", padding: "2px 6px", borderRadius: 6 }}>1×/sem</span>
                <span className="xp">+{h.xp}</span>
              </div>
            </div>
          );
        })}

        {/* No social today reminder */}
        {!hasSocialToday && (
          <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 10, background: "rgba(255,152,0,.08)", border: "1px solid rgba(255,152,0,.2)", fontSize: 11, color: "#ff9800", display: "flex", alignItems: "center", gap: 6 }}>
            <span>💡</span> Pense à ta dose sociale du jour !
          </div>
        )}
      </div>
    </div>
  );
}
