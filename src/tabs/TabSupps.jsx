import { SUPPS_DETAILED, SUPP_TIMING_GROUPS, getSuppsGrouped, getSuppsForStage, getSuppsBudget } from "../constants/supplements.js";
import { getCurrentNutritionStage, getToday } from "../utils/helpers.js";

function calcSuppsStreak(data) {
  let streak = 0;
  const today = new Date(getToday());
  const expected = getSuppsForStage(data.nutrition?.currentStage || 1).length;
  for (let i = 0; i < 120; i++) {
    const dt = new Date(today);
    dt.setDate(dt.getDate() - i);
    const k = dt.toISOString().split("T")[0];
    const dd = data.days[k];
    if (!dd?.supps) break;
    const checked = Object.values(dd.supps).filter(Boolean).length;
    if (checked >= expected) streak++;
    else break;
  }
  return streak;
}

function getReapproAlerts(data) {
  if (!data?.reappro) return [];
  const today = new Date(getToday());
  const alerts = [];
  Object.entries(data.reappro).forEach(([suppId, r]) => {
    if (!r.purchaseDate || !r.quantityDays) return;
    const endDate = new Date(r.purchaseDate);
    endDate.setDate(endDate.getDate() + r.quantityDays);
    const daysLeft = Math.ceil((endDate - today) / 86400000);
    if (daysLeft <= 5) {
      const supp = SUPPS_DETAILED.find(s => s.id === suppId);
      if (supp) alerts.push({ ...supp, daysLeft, reorderDate: endDate.toISOString().split("T")[0] });
    }
  });
  return alerts.sort((a, b) => a.daysLeft - b.daysLeft);
}

export default function TabSupps({ data, dayData, toggleItem, setShowSuppInfo, setReapproEdit }) {
  const ns = getCurrentNutritionStage();
  const isRegain = ns.stage === 1 || ns.stage === 3;
  const groups = getSuppsGrouped(ns.stage);
  const applicableSupps = getSuppsForStage(ns.stage);
  const checkedCount = applicableSupps.filter(s => dayData.supps?.[s.id]).length;
  const totalCount = applicableSupps.length;
  const suppsStreak = calcSuppsStreak(data);
  const budget = getSuppsBudget(ns.stage);
  const reapproAlerts = getReapproAlerts(data);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* PROGRESS HEADER */}
      <div className="card" style={{ textAlign: "center", padding: "16px 16px 20px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: ns.stageInfo.color }}>
          ÉTAPE {ns.stage}/4 — {ns.stageInfo.emoji} {ns.stageInfo.name}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: "#888" }}>{checkedCount}/{totalCount} pris</span>
          <span style={{ fontSize: 11, color: "#888", fontFamily: "'Space Mono'" }}>
            {totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0}%
          </span>
        </div>
        <div style={{ height: 6, background: "#0a0a1a", borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%`, height: "100%",
            background: checkedCount === totalCount && totalCount > 0
              ? "linear-gradient(90deg,#4caf50,#2e7d32)"
              : "linear-gradient(90deg,#e94560,#c23152)",
            borderRadius: 3, transition: "width .5s"
          }} />
        </div>
        {suppsStreak > 0 && (
          <div style={{ marginTop: 8, fontSize: 11, color: "#ffeb3b", fontWeight: 700 }}>
            🔥 {suppsStreak} jour{suppsStreak > 1 ? "s" : ""} de streak supps
          </div>
        )}
      </div>

      {/* TIMING GROUPS */}
      {groups.map(g => (
        <div key={g.id} className="card" style={{ borderLeft: `3px solid ${g.color}`, padding: "14px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 8, color: g.color, display: "flex", alignItems: "center", gap: 6 }}>
            <span>{g.emoji}</span> {g.label}
            {g.supps.every(s => s.secheOnly) && (
              <span style={{ fontSize: 9, background: "#e9456020", color: "#e94560", padding: "2px 6px", borderRadius: 6, fontWeight: 600 }}>SÈCHE ONLY</span>
            )}
          </div>
          {g.supps.map(s => {
            const done = dayData.supps?.[s.id] || false;
            return (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div className={`ci ${done ? "done" : ""}`} style={{ flex: 1 }} onClick={() => toggleItem("supps", s.id, 5)}>
                  <div className="cb">{done ? "✓" : ""}</div>
                  <span style={{ fontSize: 16 }}>{s.emoji}</span>
                  <span style={{ flex: 1, fontSize: 12 }}>{s.label}</span>
                  <span className="xp">+5</span>
                </div>
                <div onClick={(e) => { e.stopPropagation(); setShowSuppInfo(s); }}
                  style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,.06)", border: "1px solid #2a2a4a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, cursor: "pointer", color: "#888", flexShrink: 0 }}>
                  ℹ️
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* BUDGET */}
      <div className="card" style={{ textAlign: "center", padding: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>💰 Budget mensuel suppléments</div>
        <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "'Space Mono'", color: "#ffeb3b" }}>
          {budget.toFixed(0)}€<span style={{ fontSize: 12, color: "#888" }}>/mois</span>
        </div>
        <div style={{ fontSize: 10, color: "#666", marginTop: 2 }}>
          {isRegain ? "Regain (sans whey)" : "Sèche (avec whey)"}
        </div>
      </div>

      {/* RÉAPPRO */}
      <div className="card" style={{ padding: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>⚠️ Réappro — alertes stock</div>
        {reapproAlerts.length > 0 ? (
          reapproAlerts.map(a => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid #1a1a2e", fontSize: 12 }}>
              <span>{a.emoji}</span>
              <span style={{ flex: 1 }}>{a.label}</span>
              <span style={{ color: a.daysLeft <= 0 ? "#e94560" : "#ff9800", fontWeight: 700, fontFamily: "'Space Mono'" }}>
                {a.daysLeft <= 0 ? "ÉPUISÉ" : `${a.daysLeft}j`}
              </span>
            </div>
          ))
        ) : (
          <div style={{ fontSize: 11, color: "#666", textAlign: "center", padding: "8px 0" }}>
            Aucune alerte. Clique ℹ️ sur un supplément pour enregistrer un achat.
          </div>
        )}
        <div onClick={() => setReapproEdit({ suppId: "", purchaseDate: getToday(), quantityDays: 30 })}
          style={{ marginTop: 8, textAlign: "center", padding: "8px 0", fontSize: 11, color: "#e94560", cursor: "pointer", fontWeight: 600 }}>
          + Enregistrer un achat
        </div>
      </div>

    </div>
  );
}
