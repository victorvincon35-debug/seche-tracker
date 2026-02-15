import { getCurrentNutritionStage } from "../utils/helpers.js";
import { getMealsForStage, STAGE_DAYS } from "../constants/nutrition.js";

export default function TabFood({ dayData, toggleItem }) {
  const ns = getCurrentNutritionStage();
  const { stage, dayInStage, stageInfo, complete, notStarted, daysUntilStart } = ns;
  const currentMeals = getMealsForStage(stage);
  const progressPct = notStarted ? 0 : (dayInStage / STAGE_DAYS) * 100;
  const isRegain = stageInfo.name.includes("REGAIN");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* STAGE INDICATOR */}
      <div className="card" style={{ background: `linear-gradient(145deg, ${stageInfo.color}15, #0d0d24)`, border: `1px solid ${stageInfo.color}40`, textAlign: "center", padding: "20px 16px" }}>
        <div style={{ fontSize: 11, color: "#888", letterSpacing: 2, fontFamily: "'Space Mono'" }}>ÉTAPE</div>
        <div style={{ fontSize: 42, fontWeight: 900, fontFamily: "'Space Mono'", color: "#fff" }}>
          {stage}<span style={{ fontSize: 20, color: "#888" }}>/4</span>
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, marginTop: 4 }}>{stageInfo.emoji} {stageInfo.name}</div>
        <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "'Space Mono'", color: stageInfo.color, marginTop: 8 }}>
          {stageInfo.kcal.toLocaleString("fr-FR")} kcal
        </div>

        {notStarted ? (
          <div style={{ marginTop: 12, padding: "10px 16px", background: "rgba(255,235,59,.08)", borderRadius: 12, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "#ffeb3b", fontWeight: 700 }}>Début dans {daysUntilStart} jour{daysUntilStart > 1 ? "s" : ""}</div>
            <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>Lundi 23 février 2026</div>
          </div>
        ) : (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: "#888" }}>Jour {dayInStage}/{STAGE_DAYS}</span>
              <span style={{ fontSize: 10, color: "#888", fontFamily: "'Space Mono'" }}>{Math.round(progressPct)}%</span>
            </div>
            <div style={{ height: 6, background: "#0a0a1a", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${Math.min(progressPct, 100)}%`, height: "100%", background: `linear-gradient(90deg, ${stageInfo.color}, ${stageInfo.color}cc)`, borderRadius: 3, transition: "width .5s" }} />
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-around", marginTop: 12 }}>
          {[{ l: "Glucides", v: stageInfo.macros.glucides, c: "#ffeb3b" }, { l: "Protéines", v: stageInfo.macros.proteines, c: "#e94560" }, { l: "Lipides", v: stageInfo.macros.lipides, c: "#4caf50" }].map((m, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Space Mono'", color: m.c }}>{m.v}</div>
              <div style={{ fontSize: 9, color: "#666" }}>{m.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* MEAL CHECKLIST */}
      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
          🍽️ {isRegain ? "Plan regain" : "Plan sèche"} — {stageInfo.kcal.toLocaleString("fr-FR")} kcal
        </div>
        {currentMeals.map(m => {
          const done = dayData.meals?.[m.id] || false;
          return (
            <div key={m.id} className={`ci ${done ? "done" : ""}`} onClick={() => toggleItem("meals", m.id, m.xp)}>
              <div className="cb">{done ? "✓" : ""}</div>
              <span style={{ fontSize: 18 }}>{m.emoji}</span>
              <span style={{ flex: 1, fontSize: 13 }}>{m.label}</span>
              <span className="xp">+{m.xp}</span>
            </div>
          );
        })}
        <div style={{ marginTop: 12, padding: 10, background: `rgba(${isRegain ? "76,175,80" : "233,69,96"},.06)`, borderRadius: 12, fontSize: 12, textAlign: "center" }}>
          Budget : <span style={{ color: "#ffeb3b", fontWeight: 700, fontFamily: "'Space Mono'" }}>{stageInfo.budget}</span>
        </div>
      </div>

      {complete && (
        <div className="card" style={{ textAlign: "center", padding: 24 }}>
          <div style={{ fontSize: 40 }}>🏆</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 8 }}>Cycle terminé !</div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>Tu as complété les 4 étapes (120 jours)</div>
        </div>
      )}
    </div>
  );
}
