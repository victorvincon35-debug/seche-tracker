import { NUTRITION_MEALS, NUTRITION_PRINCIPLES, NUTRITION_BONUS, get6wDayNumber, SIX_WEEKS_DAYS } from "../constants/sixweeks.js";

export default function Tab6wNutrition({ data, save, selectedDate }) {
  const dayNum = get6wDayNumber(selectedDate);

  const sw = data.sixWeeks || {};
  const nutritionDay = sw.nutrition?.[selectedDate] || {};

  const toggleMeal = (mealId) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.sixWeeks) nd.sixWeeks = {};
    if (!nd.sixWeeks.nutrition) nd.sixWeeks.nutrition = {};
    if (!nd.sixWeeks.nutrition[selectedDate]) nd.sixWeeks.nutrition[selectedDate] = {};
    nd.sixWeeks.nutrition[selectedDate][mealId] = !nd.sixWeeks.nutrition[selectedDate][mealId];
    save(nd);
  };

  const mealsEaten = NUTRITION_MEALS.filter(m => nutritionDay[m.id]).length;
  const totalItems = NUTRITION_MEALS.length + 1; // +1 for bonus
  const bonusDone = nutritionDay[NUTRITION_BONUS.id];
  const totalChecked = mealsEaten + (bonusDone ? 1 : 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Day header + progress */}
      <div className="card" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#888", letterSpacing: 2, fontFamily: "'Space Mono'", marginBottom: 8 }}>
          JOUR {dayNum} / {SIX_WEEKS_DAYS}
        </div>

        {/* Counter */}
        <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "'Space Mono'", marginBottom: 12 }}>
          <span style={{ color: totalChecked === totalItems ? "#4caf50" : "#e94560" }}>{totalChecked}</span>
          <span style={{ color: "#444" }}>/{totalItems}</span>
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
          {[...NUTRITION_MEALS.map(m => nutritionDay[m.id]), bonusDone].map((done, i) => (
            <div key={i} style={{
              width: 12, height: 12, borderRadius: 6,
              background: done
                ? "linear-gradient(135deg,#4caf50,#2e7d32)"
                : "rgba(255,255,255,.08)",
              border: done ? "none" : "1px solid #2a2a4a",
              transition: "all .3s",
            }} />
          ))}
        </div>
      </div>

      {/* Principles */}
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

      {/* Meal checkboxes */}
      <div className="card" style={{ padding: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>Repas du jour</div>
        {NUTRITION_MEALS.map((meal, idx) => {
          const eaten = nutritionDay[meal.id];
          return (
            <div
              key={meal.id}
              onClick={() => toggleMeal(meal.id)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 12px",
                marginBottom: idx < NUTRITION_MEALS.length - 1 ? 4 : 0,
                background: eaten ? "rgba(76,175,80,.08)" : "rgba(255,255,255,.02)",
                borderLeft: eaten ? "3px solid #4caf50" : "3px solid transparent",
                borderRadius: 10,
                cursor: "pointer",
                transition: "all .2s ease",
              }}
            >
              {/* Checkbox */}
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: eaten ? "linear-gradient(135deg,#4caf50,#2e7d32)" : "rgba(255,255,255,.06)",
                border: eaten ? "none" : "2px solid #2a2a4a",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 800, color: "white",
                transition: "all .2s ease",
                flexShrink: 0,
              }}>
                {eaten ? "✓" : ""}
              </div>

              {/* Emoji */}
              <span style={{ fontSize: 20, flexShrink: 0 }}>{meal.emoji}</span>

              {/* Label + detail */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 14, fontWeight: 800,
                  color: eaten ? "#4caf50" : "#ddd",
                  textDecoration: eaten ? "line-through" : "none",
                  opacity: eaten ? 0.7 : 1,
                }}>
                  {meal.label}
                </div>
                <div style={{ fontSize: 11, color: "#777", marginTop: 2 }}>{meal.detail}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bonus: pause active */}
      <div className="card" style={{ padding: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, color: "#ff9800" }}>Bonus</div>
        <div
          onClick={() => toggleMeal(NUTRITION_BONUS.id)}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "14px 12px",
            background: bonusDone ? "rgba(255,152,0,.08)" : "rgba(255,255,255,.02)",
            borderLeft: bonusDone ? "3px solid #ff9800" : "3px solid transparent",
            borderRadius: 10,
            cursor: "pointer",
            transition: "all .2s ease",
          }}
        >
          {/* Checkbox */}
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: bonusDone ? "linear-gradient(135deg,#ff9800,#f57c00)" : "rgba(255,255,255,.06)",
            border: bonusDone ? "none" : "2px solid #2a2a4a",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 800, color: "white",
            transition: "all .2s ease",
            flexShrink: 0,
          }}>
            {bonusDone ? "✓" : ""}
          </div>

          {/* Emoji */}
          <span style={{ fontSize: 20, flexShrink: 0 }}>{NUTRITION_BONUS.emoji}</span>

          {/* Label + detail */}
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 14, fontWeight: 800,
              color: bonusDone ? "#ff9800" : "#ddd",
              textDecoration: bonusDone ? "line-through" : "none",
              opacity: bonusDone ? 0.7 : 1,
            }}>
              {NUTRITION_BONUS.label}
            </div>
            <div style={{ fontSize: 11, color: "#777", marginTop: 2 }}>{NUTRITION_BONUS.detail}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
