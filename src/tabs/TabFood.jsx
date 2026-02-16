import { useState, useMemo } from "react";
import { getToday } from "../utils/helpers.js";

// ===== HELPERS =====

function getQty(value, config) {
  if (config.type === "checkbox") return value === true ? 1 : 0;
  if (value === true) return config.max; // backward compat
  if (typeof value === "number") return Math.max(0, Math.min(value, config.max));
  return 0;
}

function isComplete(value, config) {
  if (config.type === "checkbox") return value === true;
  return getQty(value, config) >= config.max;
}

function computeCurrentMacros(dayMeals, allItems, planItems) {
  let g = 0, p = 0, l = 0;
  allItems.forEach(item => {
    const config = planItems[item.id];
    if (!config || config.type === "checkbox") return;
    const ratio = getQty(dayMeals?.[item.id], config) / config.max;
    g += (config.macros.glucides || 0) * ratio;
    p += (config.macros.proteines || 0) * ratio;
    l += (config.macros.lipides || 0) * ratio;
  });
  return { glucides: Math.round(g), proteines: Math.round(p), lipides: Math.round(l), kcal: Math.round(g * 4 + p * 4 + l * 9) };
}

function getProgramStatus(foodPlan) {
  const today = new Date(getToday());
  const start = new Date(foodPlan.startDate);
  const diffDays = Math.floor((today - start) / 86400000);
  if (diffDays < 0) return { status: "before", daysUntil: -diffDays };
  if (diffDays >= foodPlan.totalDays) return { status: "after" };
  return { status: "during", dayNum: diffDays + 1 };
}

function computeAdherence(data, foodPlan, allItems, planItems) {
  const start = new Date(foodPlan.startDate);
  const today = new Date(getToday());
  const diffDays = Math.floor((today - start) / 86400000);
  if (diffDays < 0) return { totalElapsed: 0, validated: 0, pct: 0, streak: 0 };
  const totalElapsed = Math.min(diffDays + 1, foodPlan.totalDays);
  let validated = 0;
  for (let i = 0; i < totalElapsed; i++) {
    const d = new Date(start); d.setDate(d.getDate() + i);
    const dk = d.toISOString().split("T")[0];
    const meals = data.days[dk]?.meals || {};
    if (allItems.every(it => isComplete(meals[it.id], planItems[it.id]))) validated++;
  }
  let streak = 0;
  for (let i = totalElapsed - 1; i >= 0; i--) {
    const d = new Date(start); d.setDate(d.getDate() + i);
    const dk = d.toISOString().split("T")[0];
    const meals = data.days[dk]?.meals || {};
    if (allItems.every(it => isComplete(meals[it.id], planItems[it.id]))) streak++;
    else break;
  }
  return { totalElapsed, validated, pct: totalElapsed > 0 ? Math.round((validated / totalElapsed) * 100) : 0, streak };
}

function computeBudget(fp) {
  let minT = 0, maxT = 0;
  Object.values(fp.items).forEach(item => {
    minT += item.price?.min || 0;
    maxT += item.price?.max || item.price?.min || 0;
  });
  return { perDay: { min: Math.round(minT * 100) / 100, max: Math.round(maxT * 100) / 100 } };
}

function newItemDefaults(categoryId) {
  return {
    id: null, label: "", emoji: "🍽️", xp: 5,
    type: "bar", max: 100, unit: "g", unitPlural: "", perUnit: null,
    buttons: [{ label: "+50g", v: 50 }],
    macros: { glucides: 0, proteines: 0, lipides: 0 },
    qtyLabel: "", macroLabel: "",
    price: { min: 0, max: 0 },
    _categoryId: categoryId,
  };
}

// ===== BOTTOM SHEET WRAPPER =====

function BottomSheet({ onClose, title, children }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 500, maxHeight: "85vh", background: "#0d0d24", borderRadius: "20px 20px 0 0", padding: "20px 16px", overflowY: "auto", animation: "slideUp .3s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{title}</div>
          <div onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,.06)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, color: "#888" }}>✕</div>
        </div>
        {children}
      </div>
    </div>
  );
}

// ===== FOOD ITEM FORM =====

function FoodItemForm({ item, categoryId, categories, onSave, onClose }) {
  const [draft, setDraft] = useState(() => ({
    label: item?.label || "",
    emoji: item?.emoji || "🍽️",
    type: item?.type || "bar",
    max: item?.max || 100,
    unit: item?.unit || "g",
    unitPlural: item?.unitPlural || "",
    perUnit: item?.perUnit || "",
    xp: item?.xp || 5,
    glucides: item?.macros?.glucides || 0,
    proteines: item?.macros?.proteines || 0,
    lipides: item?.macros?.lipides || 0,
    priceMin: item?.price?.min || 0,
    priceMax: item?.price?.max || 0,
    buttons: item?.buttons ? JSON.parse(JSON.stringify(item.buttons)) : [{ label: "+50g", v: 50 }],
    catId: categoryId,
  }));

  const [newBtnLabel, setNewBtnLabel] = useState("");
  const [newBtnValue, setNewBtnValue] = useState("");

  const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #2a2a4a", background: "#0a0a1a", color: "#fff", fontSize: 13, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" };
  const labelStyle = { fontSize: 11, color: "#888", marginBottom: 4, display: "block" };
  const rowStyle = { marginBottom: 12 };

  const handleSave = () => {
    if (!draft.label.trim()) return;
    const saved = {
      ...(item?.id ? { id: item.id } : {}),
      label: draft.label.trim(),
      emoji: draft.emoji || "🍽️",
      xp: parseInt(draft.xp) || 5,
      type: draft.type,
      max: draft.type === "checkbox" ? 1 : (parseFloat(draft.max) || 100),
      unit: draft.type === "checkbox" ? "" : draft.unit,
      unitPlural: draft.unitPlural,
      perUnit: draft.perUnit ? parseFloat(draft.perUnit) : null,
      buttons: draft.type === "checkbox" ? [] : draft.buttons,
      macros: { glucides: parseFloat(draft.glucides) || 0, proteines: parseFloat(draft.proteines) || 0, lipides: parseFloat(draft.lipides) || 0 },
      qtyLabel: draft.type === "checkbox" ? "à volonté" : `${draft.max} ${draft.unit}`,
      macroLabel: (() => {
        const parts = [];
        if (parseFloat(draft.proteines)) parts.push(`${draft.proteines}g protéines`);
        if (parseFloat(draft.glucides)) parts.push(`${draft.glucides}g glucides`);
        if (parseFloat(draft.lipides)) parts.push(`${draft.lipides}g lipides`);
        return parts.join(", ") || "";
      })(),
      price: { min: parseFloat(draft.priceMin) || 0, max: parseFloat(draft.priceMax) || parseFloat(draft.priceMin) || 0 },
    };
    onSave(saved, draft.catId);
  };

  const addButton = () => {
    if (!newBtnLabel.trim() || !newBtnValue) return;
    setDraft(d => ({ ...d, buttons: [...d.buttons, { label: newBtnLabel.trim(), v: parseFloat(newBtnValue) }] }));
    setNewBtnLabel("");
    setNewBtnValue("");
  };

  const removeButton = (idx) => {
    setDraft(d => ({ ...d, buttons: d.buttons.filter((_, i) => i !== idx) }));
  };

  return (
    <BottomSheet onClose={onClose} title={item?.id ? "Modifier l'aliment" : "Ajouter un aliment"}>
      <div style={rowStyle}>
        <label style={labelStyle}>Nom</label>
        <input style={inputStyle} value={draft.label} onChange={e => setDraft(d => ({ ...d, label: e.target.value }))} placeholder="Ex: Riz complet" />
      </div>

      <div style={{ display: "flex", gap: 8, ...rowStyle }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Emoji</label>
          <input style={inputStyle} value={draft.emoji} onChange={e => setDraft(d => ({ ...d, emoji: e.target.value }))} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>XP</label>
          <input type="number" style={inputStyle} value={draft.xp} onChange={e => setDraft(d => ({ ...d, xp: e.target.value }))} />
        </div>
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>Type de tracking</label>
        <div style={{ display: "flex", gap: 4 }}>
          {[{ id: "bar", label: "Barre" }, { id: "dots", label: "Pastilles" }, { id: "checkbox", label: "Checkbox" }].map(t => (
            <div key={t.id} onClick={() => setDraft(d => ({ ...d, type: t.id }))}
              style={{ flex: 1, padding: "8px 4px", borderRadius: 8, textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 700, background: draft.type === t.id ? "rgba(233,69,96,.15)" : "rgba(255,255,255,.04)", border: `1px solid ${draft.type === t.id ? "rgba(233,69,96,.3)" : "#2a2a4a"}`, color: draft.type === t.id ? "#e94560" : "#666" }}>
              {t.label}
            </div>
          ))}
        </div>
      </div>

      {draft.type !== "checkbox" && (
        <>
          <div style={{ display: "flex", gap: 8, ...rowStyle }}>
            <div style={{ flex: 2 }}>
              <label style={labelStyle}>Quantité max</label>
              <input type="number" style={inputStyle} value={draft.max} onChange={e => setDraft(d => ({ ...d, max: e.target.value }))} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Unité</label>
              <select style={inputStyle} value={draft.unit} onChange={e => setDraft(d => ({ ...d, unit: e.target.value }))}>
                {["g", "ml", "pièces", "cuillères", "shakers", "œuf", "œufs"].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          {draft.type === "dots" && (
            <div style={rowStyle}>
              <label style={labelStyle}>Grammes par unité (optionnel)</label>
              <input type="number" style={inputStyle} value={draft.perUnit} onChange={e => setDraft(d => ({ ...d, perUnit: e.target.value }))} placeholder="Ex: 40 (pour 40g/shaker)" />
            </div>
          )}
        </>
      )}

      <div style={{ fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 8 }}>Macros (au max quotidien)</div>
      <div style={{ display: "flex", gap: 8, ...rowStyle }}>
        {[{ key: "proteines", label: "Prot (g)", color: "#4a90d9" }, { key: "glucides", label: "Gluc (g)", color: "#ff9800" }, { key: "lipides", label: "Lip (g)", color: "#e94560" }].map(m => (
          <div key={m.key} style={{ flex: 1 }}>
            <label style={{ ...labelStyle, color: m.color }}>{m.label}</label>
            <input type="number" style={inputStyle} value={draft[m.key]} onChange={e => setDraft(d => ({ ...d, [m.key]: e.target.value }))} />
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, ...rowStyle }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Prix min (€)</label>
          <input type="number" step="0.01" style={inputStyle} value={draft.priceMin} onChange={e => setDraft(d => ({ ...d, priceMin: e.target.value }))} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Prix max (€)</label>
          <input type="number" step="0.01" style={inputStyle} value={draft.priceMax} onChange={e => setDraft(d => ({ ...d, priceMax: e.target.value }))} />
        </div>
      </div>

      <div style={rowStyle}>
        <label style={labelStyle}>Catégorie</label>
        <select style={inputStyle} value={draft.catId} onChange={e => setDraft(d => ({ ...d, catId: e.target.value }))}>
          {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
        </select>
      </div>

      {draft.type !== "checkbox" && (
        <div style={rowStyle}>
          <label style={labelStyle}>Boutons rapides</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
            {draft.buttons.map((btn, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: "rgba(255,255,255,.04)", borderRadius: 8, border: "1px solid #2a2a4a" }}>
                <span style={{ flex: 1, fontSize: 12, color: "#ccc" }}>{btn.label}</span>
                <span style={{ fontSize: 11, color: "#666", fontFamily: "'Space Mono'" }}>= {btn.v}</span>
                <div onClick={() => removeButton(i)} style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(233,69,96,.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 12, color: "#e94560" }}>✕</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
            <div style={{ flex: 2 }}>
              <input style={inputStyle} value={newBtnLabel} onChange={e => setNewBtnLabel(e.target.value)} placeholder="Label (ex: +100ml)" />
            </div>
            <div style={{ flex: 1 }}>
              <input type="number" style={inputStyle} value={newBtnValue} onChange={e => setNewBtnValue(e.target.value)} placeholder="Valeur" />
            </div>
            <div onClick={addButton} style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(76,175,80,.12)", border: "1px solid rgba(76,175,80,.3)", color: "#4caf50", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>+</div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <div onClick={onClose} style={{ flex: 1, padding: "14px 0", borderRadius: 14, textAlign: "center", fontSize: 13, fontWeight: 700, cursor: "pointer", background: "rgba(255,255,255,.06)", border: "1px solid #2a2a4a", color: "#888" }}>Annuler</div>
        <div onClick={handleSave} style={{ flex: 1, padding: "14px 0", borderRadius: 14, textAlign: "center", fontSize: 13, fontWeight: 800, cursor: "pointer", background: "linear-gradient(135deg, #e94560, #c23152)", color: "#fff", opacity: draft.label.trim() ? 1 : 0.4 }}>Sauvegarder</div>
      </div>
    </BottomSheet>
  );
}

// ===== MACRO TARGETS FORM =====

function MacroTargetsForm({ targets, onSave, onClose }) {
  const [draft, setDraft] = useState({ ...targets });
  const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #2a2a4a", background: "#0a0a1a", color: "#fff", fontSize: 13, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" };
  const labelStyle = { fontSize: 11, color: "#888", marginBottom: 4, display: "block" };

  return (
    <BottomSheet onClose={onClose} title="Objectifs macros">
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Calories cibles (kcal)</label>
        <input type="number" style={inputStyle} value={draft.kcal} onChange={e => setDraft(d => ({ ...d, kcal: e.target.value }))} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[{ key: "proteines", label: "Protéines (g)", color: "#4a90d9" }, { key: "glucides", label: "Glucides (g)", color: "#ff9800" }, { key: "lipides", label: "Lipides (g)", color: "#e94560" }].map(m => (
          <div key={m.key} style={{ flex: 1 }}>
            <label style={{ ...labelStyle, color: m.color }}>{m.label}</label>
            <input type="number" style={inputStyle} value={draft[m.key]} onChange={e => setDraft(d => ({ ...d, [m.key]: e.target.value }))} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <div onClick={onClose} style={{ flex: 1, padding: "14px 0", borderRadius: 14, textAlign: "center", fontSize: 13, fontWeight: 700, cursor: "pointer", background: "rgba(255,255,255,.06)", border: "1px solid #2a2a4a", color: "#888" }}>Annuler</div>
        <div onClick={() => onSave({ kcal: parseInt(draft.kcal) || 2000, glucides: parseInt(draft.glucides) || 0, proteines: parseInt(draft.proteines) || 0, lipides: parseInt(draft.lipides) || 0 })} style={{ flex: 1, padding: "14px 0", borderRadius: 14, textAlign: "center", fontSize: 13, fontWeight: 800, cursor: "pointer", background: "linear-gradient(135deg, #e94560, #c23152)", color: "#fff" }}>Sauvegarder</div>
      </div>
    </BottomSheet>
  );
}

// ===== TEMPLATES PANEL =====

function TemplatesPanel({ templates, currentPlanName, onLoad, onSaveAs, onDelete, onClose }) {
  const [saveName, setSaveName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [confirmLoad, setConfirmLoad] = useState(null);
  const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #2a2a4a", background: "#0a0a1a", color: "#fff", fontSize: 13, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" };

  return (
    <BottomSheet onClose={onClose} title="Templates">
      <div style={{ padding: "10px 12px", background: "rgba(233,69,96,.08)", borderRadius: 10, marginBottom: 16, fontSize: 12 }}>
        <span style={{ color: "#888" }}>Plan actuel : </span>
        <span style={{ color: "#e94560", fontWeight: 700 }}>{currentPlanName}</span>
      </div>

      {/* Save as template */}
      {showSaveInput ? (
        <div style={{ marginBottom: 16 }}>
          <input style={{ ...inputStyle, marginBottom: 8 }} value={saveName} onChange={e => setSaveName(e.target.value)} placeholder="Nom du template" autoFocus />
          <div style={{ display: "flex", gap: 8 }}>
            <div onClick={() => setShowSaveInput(false)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, textAlign: "center", fontSize: 12, fontWeight: 700, cursor: "pointer", background: "rgba(255,255,255,.06)", border: "1px solid #2a2a4a", color: "#888" }}>Annuler</div>
            <div onClick={() => { if (saveName.trim()) { onSaveAs(saveName.trim()); setShowSaveInput(false); setSaveName(""); } }}
              style={{ flex: 1, padding: "10px 0", borderRadius: 10, textAlign: "center", fontSize: 12, fontWeight: 800, cursor: "pointer", background: "rgba(76,175,80,.12)", border: "1px solid rgba(76,175,80,.3)", color: "#4caf50", opacity: saveName.trim() ? 1 : 0.4 }}>
              Sauvegarder
            </div>
          </div>
        </div>
      ) : (
        <div onClick={() => setShowSaveInput(true)} style={{ padding: "12px 0", borderRadius: 12, textAlign: "center", fontSize: 13, fontWeight: 700, cursor: "pointer", background: "rgba(76,175,80,.08)", border: "1px solid rgba(76,175,80,.2)", color: "#4caf50", marginBottom: 16 }}>
          + Sauvegarder comme template
        </div>
      )}

      {/* Templates list */}
      <div style={{ fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 8 }}>Templates sauvegardés</div>
      {(templates || []).length === 0 ? (
        <div style={{ textAlign: "center", padding: 20, color: "#555", fontSize: 12 }}>Aucun template sauvegardé</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {templates.map(tpl => (
            <div key={tpl.id} style={{ padding: "12px 14px", background: "rgba(255,255,255,.03)", borderRadius: 12, border: "1px solid #1e1e4a" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{tpl.name}</div>
                  <div style={{ fontSize: 10, color: "#555" }}>{new Date(tpl.createdAt).toLocaleDateString("fr-FR")}</div>
                </div>
                <div onClick={() => onDelete(tpl.id)} style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(233,69,96,.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 12, color: "#e94560" }}>✕</div>
              </div>
              {confirmLoad === tpl.id ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <div onClick={() => setConfirmLoad(null)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, textAlign: "center", fontSize: 11, fontWeight: 700, cursor: "pointer", background: "rgba(255,255,255,.06)", border: "1px solid #2a2a4a", color: "#888" }}>Annuler</div>
                  <div onClick={() => { onLoad(tpl.id); setConfirmLoad(null); }} style={{ flex: 1, padding: "8px 0", borderRadius: 8, textAlign: "center", fontSize: 11, fontWeight: 800, cursor: "pointer", background: "rgba(233,69,96,.12)", border: "1px solid rgba(233,69,96,.3)", color: "#e94560" }}>Confirmer</div>
                </div>
              ) : (
                <div onClick={() => setConfirmLoad(tpl.id)} style={{ padding: "8px 0", borderRadius: 8, textAlign: "center", fontSize: 12, fontWeight: 700, cursor: "pointer", background: "rgba(233,69,96,.08)", border: "1px solid rgba(233,69,96,.15)", color: "#e94560" }}>Charger ce template</div>
              )}
            </div>
          ))}
        </div>
      )}
    </BottomSheet>
  );
}

// ===== COMPONENT =====

export default function TabFood({ data, save, dayData, selectedDate }) {
  const [view, setView] = useState("plan");
  const [shoppingWeeks, setShoppingWeeks] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // { item, categoryId }
  const [editingTargets, setEditingTargets] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  // Derive plan data from data.foodPlan
  const foodPlan = data.foodPlan;
  const planItems = foodPlan.items;
  const planCategories = foodPlan.categories;
  const planTargets = foodPlan.targets;

  // Build ordered list of all items (with display fields merged from planItems)
  const allFoodItems = useMemo(() =>
    planCategories.flatMap(cat =>
      cat.itemIds.map(id => planItems[id]).filter(Boolean)
    ), [planCategories, planItems]
  );

  const programStatus = getProgramStatus(foodPlan);
  const currentMacros = computeCurrentMacros(dayData.meals, allFoodItems, planItems);
  const completedCount = allFoodItems.filter(it => isComplete(dayData.meals?.[it.id], planItems[it.id])).length;
  const allDone = completedCount === allFoodItems.length;
  const hasAnyProgress = allFoodItems.some(it => { const v = dayData.meals?.[it.id]; return v && v !== 0; });
  const adherence = useMemo(() => computeAdherence(data, foodPlan, allFoodItems, planItems), [data, foodPlan, allFoodItems, planItems]);

  // Budget derived from plan
  const budget = foodPlan.budget || computeBudget(foodPlan);
  const budgetPerMonth = { min: Math.round(budget.perDay.min * 30), max: Math.round(budget.perDay.max * 30) };
  const budgetTotal = { min: Math.round(budget.perDay.min * foodPlan.totalDays), max: Math.round(budget.perDay.max * foodPlan.totalDays) };

  // Shopping list computed dynamically
  const shoppingList = useMemo(() =>
    allFoodItems.map(item => ({
      label: item.label,
      emoji: item.emoji,
      qtyWeek: item.type === "checkbox" ? "à volonté" : `${item.max * 7} ${item.unit}`,
      qty2Weeks: item.type === "checkbox" ? "à volonté" : `${item.max * 14} ${item.unit}`,
    })), [allFoodItems]
  );

  // ===== TRACKING ACTIONS =====

  const updateItemQty = (itemId, newQty) => {
    const nd = JSON.parse(JSON.stringify(data));
    const dk = selectedDate;
    if (!nd.days[dk]) nd.days[dk] = {};
    if (!nd.days[dk].meals) nd.days[dk].meals = {};
    const item = nd.foodPlan.items[itemId];
    if (!item) return;
    const wasComplete = isComplete(nd.days[dk].meals[itemId], item);
    const finalQty = item.type === "checkbox" ? newQty : Math.max(0, Math.min(newQty, item.max));
    nd.days[dk].meals[itemId] = finalQty;
    const nowComplete = isComplete(finalQty, item);
    if (nowComplete && !wasComplete) nd.totalXP = (nd.totalXP || 0) + item.xp;
    else if (!nowComplete && wasComplete) nd.totalXP = Math.max(0, (nd.totalXP || 0) - item.xp);
    save(nd);
  };

  const addQty = (itemId, delta) => {
    const config = planItems[itemId];
    const current = getQty(dayData.meals?.[itemId], config);
    updateItemQty(itemId, current + delta);
  };

  const validateAll = () => {
    const nd = JSON.parse(JSON.stringify(data));
    const dk = selectedDate;
    if (!nd.days[dk]) nd.days[dk] = {};
    if (!nd.days[dk].meals) nd.days[dk].meals = {};
    let xpGain = 0;
    allFoodItems.forEach(item => {
      const config = nd.foodPlan.items[item.id];
      if (!config) return;
      if (!isComplete(nd.days[dk].meals[item.id], config)) {
        nd.days[dk].meals[item.id] = config.type === "checkbox" ? true : config.max;
        xpGain += item.xp;
      }
    });
    nd.totalXP = (nd.totalXP || 0) + xpGain;
    save(nd);
  };

  const resetDay = () => {
    const nd = JSON.parse(JSON.stringify(data));
    const dk = selectedDate;
    if (!nd.days[dk]?.meals) return;
    let xpLoss = 0;
    allFoodItems.forEach(item => {
      const config = nd.foodPlan.items[item.id];
      if (!config) return;
      if (isComplete(nd.days[dk].meals[item.id], config)) xpLoss += item.xp;
    });
    nd.days[dk].meals = {};
    nd.totalXP = Math.max(0, (nd.totalXP || 0) - xpLoss);
    save(nd);
  };

  const handleBarClick = (itemId, config) => {
    const current = getQty(dayData.meals?.[itemId], config);
    const input = prompt(`Quantité (${config.unit}) :`, current.toString());
    if (input !== null) { const val = parseFloat(input); if (!isNaN(val)) updateItemQty(itemId, val); }
  };

  // ===== PLAN EDIT ACTIONS =====

  const savePlanItem = (item, categoryId) => {
    const nd = JSON.parse(JSON.stringify(data));
    const fp = nd.foodPlan;

    if (!item.id) {
      // New item
      item.id = "custom_" + Date.now();
      fp.items[item.id] = item;
      const cat = fp.categories.find(c => c.id === categoryId);
      if (cat) cat.itemIds.push(item.id);
    } else {
      // Update existing item
      fp.items[item.id] = { ...fp.items[item.id], ...item };
      // Handle category change
      const oldCat = fp.categories.find(c => c.itemIds.includes(item.id));
      const newCat = fp.categories.find(c => c.id === categoryId);
      if (oldCat && newCat && oldCat.id !== newCat.id) {
        oldCat.itemIds = oldCat.itemIds.filter(id => id !== item.id);
        newCat.itemIds.push(item.id);
      }
    }

    fp.budget = computeBudget(fp);
    save(nd);
    setEditingItem(null);
  };

  const deletePlanItem = (itemId) => {
    if (!confirm("Supprimer cet aliment du plan ?")) return;
    const nd = JSON.parse(JSON.stringify(data));
    const fp = nd.foodPlan;
    delete fp.items[itemId];
    fp.categories.forEach(cat => {
      cat.itemIds = cat.itemIds.filter(id => id !== itemId);
    });
    fp.budget = computeBudget(fp);
    save(nd);
  };

  const saveTargets = (newTargets) => {
    const nd = JSON.parse(JSON.stringify(data));
    nd.foodPlan.targets = newTargets;
    save(nd);
    setEditingTargets(false);
  };

  const saveAsTemplate = (name) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.foodTemplates) nd.foodTemplates = [];
    nd.foodTemplates.push({
      id: "tpl_" + Date.now(),
      name,
      createdAt: new Date().toISOString(),
      plan: JSON.parse(JSON.stringify(nd.foodPlan)),
    });
    save(nd);
  };

  const loadTemplate = (templateId) => {
    const nd = JSON.parse(JSON.stringify(data));
    const tpl = nd.foodTemplates.find(t => t.id === templateId);
    if (!tpl) return;
    nd.foodPlan = JSON.parse(JSON.stringify(tpl.plan));
    save(nd);
    setShowTemplates(false);
  };

  const deleteTemplate = (templateId) => {
    if (!confirm("Supprimer ce template ?")) return;
    const nd = JSON.parse(JSON.stringify(data));
    nd.foodTemplates = (nd.foodTemplates || []).filter(t => t.id !== templateId);
    save(nd);
  };

  // ===== RENDER HELPERS =====

  const kcalPct = Math.min(100, Math.round((currentMacros.kcal / planTargets.kcal) * 100));

  const renderProgressItem = (item, config, catColor) => {
    const qty = getQty(dayData.meals?.[item.id], config);
    const pct = Math.round((qty / config.max) * 100);
    const done = qty >= config.max;
    const decrement = config.buttons?.[0]?.v || 1;

    let progressText = `${qty} / ${config.max} ${config.unit}`;
    if (config.perUnit) {
      const count = Math.round(qty / config.perUnit);
      progressText = `${qty}g / ${config.max}g (~${count} banane${count !== 1 ? "s" : ""})`;
    }

    return (
      <div key={item.id} style={{ background: "rgba(255,255,255,.02)", border: done ? "1px solid rgba(76,175,80,.35)" : editMode ? "1px dashed rgba(255,255,255,.15)" : "1px solid #1e1e4a", borderRadius: 14, padding: "14px 12px", marginBottom: 8, boxShadow: done ? "0 0 12px rgba(76,175,80,.08)" : "none", transition: "all .3s", position: "relative" }}>
        {editMode && (
          <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 4, zIndex: 2 }}>
            <div onClick={() => setEditingItem({ item, categoryId: planCategories.find(c => c.itemIds.includes(item.id))?.id })}
              style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 12 }}>✏️</div>
            <div onClick={() => deletePlanItem(item.id)}
              style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(233,69,96,.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 12, color: "#e94560" }}>✕</div>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 22 }}>{item.emoji}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
              {item.label} {done && <span style={{ fontSize: 13 }}>✅</span>}
            </div>
            <div style={{ fontSize: 10, color: "#666" }}>{item.qtyLabel} · {item.macroLabel}</div>
          </div>
          {!editMode && (
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 10, color: "#666", fontFamily: "'Space Mono'" }}>
                {item.price.min === item.price.max ? `${item.price.min.toFixed(2)}€` : `${item.price.min.toFixed(2)}–${item.price.max.toFixed(2)}€`}
              </div>
              <span className="xp" style={{ fontSize: 9 }}>+{item.xp}</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontSize: 11, color: "#999", fontFamily: "'Space Mono'" }}>{progressText}</span>
            <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'Space Mono'", color: done ? "#4caf50" : catColor }}>{pct}%</span>
          </div>
          <div onClick={() => handleBarClick(item.id, config)} style={{ height: 10, background: "#0a0a1a", borderRadius: 5, overflow: "hidden", cursor: "pointer" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: done ? "linear-gradient(90deg, #4caf50, #2e7d32)" : `linear-gradient(90deg, ${catColor}, ${catColor}cc)`, borderRadius: 5, transition: "width .3s ease" }} />
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {qty > 0 && (
            <div className="food-btn food-btn-minus" onClick={() => addQty(item.id, -decrement)}>−</div>
          )}
          {(config.buttons || []).map((btn, i) => (
            <div key={i} className={`food-btn ${done ? "food-btn-disabled" : ""}`}
              onClick={() => { if (!done) addQty(item.id, btn.v); }}
              style={done ? { opacity: 0.3, pointerEvents: "none" } : {}}>
              {btn.label}
            </div>
          ))}
          {!done && (
            <div className="food-btn food-btn-accent" onClick={() => updateItemQty(item.id, config.max)}>Tout ✓</div>
          )}
        </div>
      </div>
    );
  };

  const renderDotsItem = (item, config, catColor) => {
    const qty = getQty(dayData.meals?.[item.id], config);
    const done = qty >= config.max;
    const decrement = config.buttons?.[0]?.v || 1;

    let displayText;
    if (config.perUnit) {
      displayText = `${qty}/${config.max} ${qty <= 1 ? config.unit : config.unitPlural} (${qty * config.perUnit}g/${config.max * config.perUnit}g)`;
    } else {
      displayText = `${qty}/${config.max} ${qty <= 1 ? config.unit : (config.unitPlural || config.unit)}`;
    }
    const pct = Math.round((qty / config.max) * 100);

    return (
      <div key={item.id} style={{ background: "rgba(255,255,255,.02)", border: done ? "1px solid rgba(76,175,80,.35)" : editMode ? "1px dashed rgba(255,255,255,.15)" : "1px solid #1e1e4a", borderRadius: 14, padding: "14px 12px", marginBottom: 8, boxShadow: done ? "0 0 12px rgba(76,175,80,.08)" : "none", transition: "all .3s", position: "relative" }}>
        {editMode && (
          <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 4, zIndex: 2 }}>
            <div onClick={() => setEditingItem({ item, categoryId: planCategories.find(c => c.itemIds.includes(item.id))?.id })}
              style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 12 }}>✏️</div>
            <div onClick={() => deletePlanItem(item.id)}
              style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(233,69,96,.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 12, color: "#e94560" }}>✕</div>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 22 }}>{item.emoji}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
              {item.label} {done && <span style={{ fontSize: 13 }}>✅</span>}
            </div>
            <div style={{ fontSize: 10, color: "#666" }}>{item.qtyLabel} · {item.macroLabel}</div>
          </div>
          {!editMode && (
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 10, color: "#666", fontFamily: "'Space Mono'" }}>{item.price.min.toFixed(2)}€</div>
              <span className="xp" style={{ fontSize: 9 }}>+{item.xp}</span>
            </div>
          )}
        </div>

        {/* Dots */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {Array.from({ length: config.max }, (_, i) => (
              <div key={i} onClick={() => updateItemQty(item.id, i < qty ? i : i + 1)}
                style={{ width: 28, height: 28, borderRadius: "50%", background: i < qty ? (done ? "#4caf50" : catColor) : "#1a1a2e", border: `2px solid ${i < qty ? (done ? "#4caf50" : catColor) : "#2a2a4a"}`, cursor: "pointer", transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "white", fontWeight: 700 }}>
                {i < qty ? "✓" : ""}
              </div>
            ))}
          </div>
          <span style={{ fontSize: 11, color: "#999", fontFamily: "'Space Mono'" }}>{displayText} ({pct}%)</span>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {qty > 0 && (
            <div className="food-btn food-btn-minus" onClick={() => addQty(item.id, -decrement)}>−</div>
          )}
          {(config.buttons || []).map((btn, i) => (
            <div key={i} className={`food-btn ${done ? "food-btn-disabled" : ""}`}
              onClick={() => { if (!done) addQty(item.id, btn.v); }}
              style={done ? { opacity: 0.3, pointerEvents: "none" } : {}}>
              {btn.label}
            </div>
          ))}
          {!done && (
            <div className="food-btn food-btn-accent" onClick={() => updateItemQty(item.id, config.max)}>
              {config.max <= 2 ? "Tout ✓" : `Tous ✓`}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCheckboxItem = (item, catColor) => {
    const config = planItems[item.id];
    const done = dayData.meals?.[item.id] === true;
    return (
      <div key={item.id} className={`ci ${done ? "done food-done" : ""}`}
        onClick={() => { if (!editMode) updateItemQty(item.id, !done); }}
        style={{ padding: "12px 8px", marginBottom: 2, position: "relative", border: editMode ? "1px dashed rgba(255,255,255,.15)" : "none", borderRadius: editMode ? 10 : 0 }}>
        {editMode && (
          <div style={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 4, zIndex: 2 }}>
            <div onClick={(e) => { e.stopPropagation(); setEditingItem({ item, categoryId: planCategories.find(c => c.itemIds.includes(item.id))?.id }); }}
              style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 11 }}>✏️</div>
            <div onClick={(e) => { e.stopPropagation(); deletePlanItem(item.id); }}
              style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(233,69,96,.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 11, color: "#e94560" }}>✕</div>
          </div>
        )}
        <div className="cb">{done ? "✓" : ""}</div>
        <span style={{ fontSize: 20 }}>{item.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
          <div style={{ fontSize: 10, color: "#666" }}>{item.qtyLabel}</div>
        </div>
        {!editMode && (
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: "#666", fontFamily: "'Space Mono'" }}>{item.price.min.toFixed(2)}€</div>
            <span className="xp" style={{ fontSize: 9 }}>+{item.xp}</span>
          </div>
        )}
      </div>
    );
  };

  const renderItem = (item, catColor) => {
    const config = planItems[item.id];
    if (!config) return null;
    if (config.type === "checkbox") return renderCheckboxItem(item, catColor);
    if (config.type === "dots") return renderDotsItem(item, config, catColor);
    return renderProgressItem(item, config, catColor);
  };

  // ===== RENDER =====

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <style>{`
        @keyframes checkPop { 0% { transform: scale(0.7); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .food-done .cb { animation: checkPop .3s cubic-bezier(.175,.885,.32,1.275); }
        .food-btn { flex: 1; padding: 9px 6px; border-radius: 8px; border: 1px solid #2a2a4a; background: rgba(255,255,255,.06); color: #ccc; font-size: 11px; font-weight: 700; cursor: pointer; font-family: 'Outfit',sans-serif; min-height: 36px; display: flex; align-items: center; justify-content: center; transition: transform .1s; -webkit-tap-highlight-color: transparent; user-select: none; }
        .food-btn:active { transform: scale(0.93); }
        .food-btn-accent { background: rgba(76,175,80,.12); border-color: rgba(76,175,80,.3); color: #4caf50; }
        .food-btn-minus { flex: none; width: 38px; min-width: 38px; background: rgba(233,69,96,.08); border-color: rgba(233,69,96,.2); color: #e94560; font-size: 16px; }
      `}</style>

      {/* SUB-NAV */}
      <div style={{ display: "flex", gap: 4, background: "#0d0d24", borderRadius: 12, padding: 3, border: "1px solid #1e1e4a" }}>
        {[{ id: "plan", label: "🍽️ Plan du jour" }, { id: "courses", label: "🛒 Courses" }].map(v => (
          <div key={v.id} onClick={() => setView(v.id)}
            style={{ flex: 1, padding: "8px 0", borderRadius: 10, textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700, background: view === v.id ? "rgba(233,69,96,.15)" : "transparent", color: view === v.id ? "#e94560" : "#555", transition: "all .2s" }}>
            {v.label}
          </div>
        ))}
      </div>

      {/* ===== PLAN DU JOUR ===== */}
      {view === "plan" && (
        <>
          {/* EDIT MODE + TEMPLATES TOGGLE */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
            <div onClick={() => setShowTemplates(true)} style={{ padding: "6px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "rgba(255,255,255,.06)", border: "1px solid #2a2a4a", color: "#888" }}>
              📋 Templates
            </div>
            <div onClick={() => setEditMode(!editMode)} style={{
              padding: "6px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer",
              background: editMode ? "rgba(233,69,96,.15)" : "rgba(255,255,255,.06)",
              border: `1px solid ${editMode ? "rgba(233,69,96,.3)" : "#2a2a4a"}`,
              color: editMode ? "#e94560" : "#888",
            }}>
              ✏️ {editMode ? "Terminer" : "Modifier"}
            </div>
          </div>

          {/* PROGRAM COUNTER */}
          <div className="card" style={{ textAlign: "center", padding: "16px 20px" }}>
            {programStatus.status === "before" ? (
              <>
                <div style={{ fontSize: 11, color: "#ff9800", fontWeight: 700, letterSpacing: 2, fontFamily: "'Space Mono'" }}>PROGRAMME SÈCHE</div>
                <div style={{ fontSize: 13, color: "#888", marginTop: 8 }}>Le programme commence dans</div>
                <div style={{ fontSize: 36, fontWeight: 900, fontFamily: "'Space Mono'", color: "#ffeb3b", margin: "4px 0" }}>
                  {programStatus.daysUntil} <span style={{ fontSize: 16, color: "#888" }}>jour{programStatus.daysUntil > 1 ? "s" : ""}</span>
                </div>
                <div style={{ fontSize: 11, color: "#555" }}>Début : lundi 23 février 2026</div>
              </>
            ) : programStatus.status === "after" ? (
              <>
                <div style={{ fontSize: 40 }}>🏆</div>
                <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>Programme terminé !</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{foodPlan.totalDays} jours de sèche complétés</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 11, color: "#888", letterSpacing: 2, fontFamily: "'Space Mono'" }}>PROGRAMME SÈCHE</div>
                <div style={{ fontSize: 36, fontWeight: 900, fontFamily: "'Space Mono'", color: "#fff", margin: "4px 0" }}>
                  {programStatus.dayNum}<span style={{ fontSize: 18, color: "#555" }}>/{foodPlan.totalDays}</span>
                </div>
                <div style={{ height: 6, background: "#0a0a1a", borderRadius: 3, overflow: "hidden", marginTop: 8 }}>
                  <div style={{ width: `${(programStatus.dayNum / foodPlan.totalDays) * 100}%`, height: "100%", background: "linear-gradient(90deg, #e94560, #ff6b81)", borderRadius: 3, transition: "width .5s" }} />
                </div>
                <div style={{ fontSize: 10, color: "#555", marginTop: 4 }}>23 fév — 22 juin 2026</div>
              </>
            )}
          </div>

          {/* DYNAMIC MACRO SUMMARY */}
          <div className="card" style={{ padding: 14, position: "relative" }}>
            {editMode && (
              <div onClick={() => setEditingTargets(true)} style={{ position: "absolute", top: 10, right: 10, width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 13, zIndex: 2 }}>✏️</div>
            )}
            {/* Kcal header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <div>
                <span style={{ fontSize: 22, fontWeight: 900, fontFamily: "'Space Mono'", color: "#ffeb3b" }}>
                  {currentMacros.kcal.toLocaleString("fr-FR")}
                </span>
                <span style={{ fontSize: 12, color: "#666" }}> / {planTargets.kcal.toLocaleString("fr-FR")} kcal</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "'Space Mono'", color: kcalPct >= 100 ? "#4caf50" : "#ffeb3b" }}>{kcalPct}%</span>
            </div>

            {/* Kcal progress bar */}
            <div style={{ height: 10, background: "#0a0a1a", borderRadius: 5, overflow: "hidden", marginBottom: 12 }}>
              <div style={{ width: `${kcalPct}%`, height: "100%", background: kcalPct >= 100 ? "linear-gradient(90deg, #4caf50, #2e7d32)" : "linear-gradient(90deg, #ffeb3b, #ff9800)", borderRadius: 5, transition: "width .3s ease" }} />
            </div>

            {/* Macro boxes */}
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { label: "Glucides", current: currentMacros.glucides, target: planTargets.glucides, color: "#ff9800" },
                { label: "Protéines", current: currentMacros.proteines, target: planTargets.proteines, color: "#4a90d9" },
                { label: "Lipides", current: currentMacros.lipides, target: planTargets.lipides, color: "#e94560" },
              ].map((m, i) => {
                const mp = Math.min(100, Math.round((m.current / m.target) * 100));
                return (
                  <div key={i} style={{ flex: 1, textAlign: "center", padding: "8px 4px", background: `${m.color}10`, borderRadius: 10, border: `1px solid ${m.color}25` }}>
                    <div style={{ fontSize: 13, fontWeight: 800, fontFamily: "'Space Mono'", color: m.color }}>
                      {m.current}g<span style={{ fontSize: 10, color: "#666" }}>/{m.target}g</span>
                    </div>
                    <div style={{ height: 4, background: "#0a0a1a", borderRadius: 2, margin: "5px 0", overflow: "hidden" }}>
                      <div style={{ width: `${mp}%`, height: "100%", background: mp >= 100 ? "#4caf50" : m.color, borderRadius: 2, transition: "width .3s ease" }} />
                    </div>
                    <div style={{ fontSize: 9, color: "#666" }}>{m.label} ({mp}%)</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DAY STATUS */}
          {allDone ? (
            <div style={{ textAlign: "center", padding: "14px 16px", background: "rgba(76,175,80,.1)", border: "1px solid rgba(76,175,80,.3)", borderRadius: 14, fontSize: 14, fontWeight: 700, color: "#4caf50", animation: "slideUp .4s ease" }}>
              ✅ Jour validé — {completedCount}/{allFoodItems.length} aliments
            </div>
          ) : completedCount > 0 ? (
            <div style={{ textAlign: "center", padding: "8px 16px", background: "rgba(255,152,0,.06)", borderRadius: 12, fontSize: 12, color: "#ff9800" }}>
              {completedCount}/{allFoodItems.length} aliments complétés — {allFoodItems.length - completedCount} restant{allFoodItems.length - completedCount > 1 ? "s" : ""}
            </div>
          ) : null}

          {/* FOOD CATEGORIES */}
          {planCategories.map(cat => {
            const catItems = cat.itemIds.map(id => planItems[id]).filter(Boolean);
            const catCompleted = catItems.filter(it => isComplete(dayData.meals?.[it.id], planItems[it.id])).length;
            const catDone = catCompleted === catItems.length && catItems.length > 0;
            const isCheckboxCat = catItems.length > 0 && catItems.every(it => planItems[it.id]?.type === "checkbox");

            return (
              <div key={cat.id}>
                {/* Category header */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px 6px 0", marginBottom: 4 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: `${cat.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>
                    {cat.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: cat.color }}>{cat.label}</span>
                      {cat.target && <span style={{ fontSize: 10, color: "#555" }}>— {cat.target}</span>}
                      {catDone && <span style={{ fontSize: 12 }}>✅</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontFamily: "'Space Mono'", fontWeight: 700, color: catDone ? "#4caf50" : "#555" }}>
                    {catCompleted}/{catItems.length}
                  </span>
                </div>

                {/* Category note */}
                {cat.note && (
                  <div style={{ fontSize: 10, color: "#777", padding: "5px 10px", background: `${cat.color}08`, borderRadius: 8, marginBottom: 6, borderLeft: `2px solid ${cat.color}40` }}>
                    {cat.note}
                  </div>
                )}

                {/* Items */}
                {isCheckboxCat ? (
                  <div className="card" style={{ padding: "8px 12px", marginBottom: 8 }}>
                    {catItems.map(item => renderCheckboxItem(item, cat.color))}
                  </div>
                ) : (
                  catItems.map(item => renderItem(item, cat.color))
                )}

                {/* Add item button (edit mode) */}
                {editMode && (
                  <div onClick={() => setEditingItem({ item: newItemDefaults(cat.id), categoryId: cat.id })}
                    style={{ padding: "10px 0", borderRadius: 10, textAlign: "center", fontSize: 12, fontWeight: 700, cursor: "pointer", background: "rgba(76,175,80,.06)", border: "1px dashed rgba(76,175,80,.25)", color: "#4caf50", marginBottom: 8 }}>
                    + Ajouter un aliment
                  </div>
                )}
              </div>
            );
          })}

          {/* VALIDATE ALL / RESET */}
          <div style={{ display: "flex", gap: 8 }}>
            {!allDone && (
              <div onClick={validateAll}
                style={{ flex: 1, padding: "14px 0", borderRadius: 14, textAlign: "center", fontSize: 14, fontWeight: 800, cursor: "pointer", background: "linear-gradient(135deg, #e94560, #c23152)", color: "#fff", boxShadow: "0 4px 20px rgba(233,69,96,.3)", WebkitTapHighlightColor: "transparent" }}
                onTouchStart={e => e.currentTarget.style.transform = "scale(0.97)"}
                onTouchEnd={e => e.currentTarget.style.transform = "scale(1)"}>
                ✅ Tout valider ({allFoodItems.length - completedCount})
              </div>
            )}
            {hasAnyProgress && (
              <div onClick={resetDay}
                style={{ padding: "14px 16px", borderRadius: 14, textAlign: "center", fontSize: 12, fontWeight: 700, cursor: "pointer", background: "rgba(233,69,96,.08)", border: "1px solid rgba(233,69,96,.2)", color: "#e94560", WebkitTapHighlightColor: "transparent", whiteSpace: "nowrap" }}>
                🔄 Reset
              </div>
            )}
          </div>

          {/* BUDGET */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 16 }}>💰</span> Budget
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Par jour", value: `${budget.perDay.min.toFixed(2)}€ — ${budget.perDay.max.toFixed(2)}€` },
                { label: "Par mois", value: `${budgetPerMonth.min}€ — ${budgetPerMonth.max}€` },
                { label: `Total (${Math.round(foodPlan.totalDays / 30)} mois)`, value: `${budgetTotal.min.toLocaleString("fr-FR")}€ — ${budgetTotal.max.toLocaleString("fr-FR")}€` },
              ].map((b, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", borderBottom: i < 2 ? "1px solid #1a1a2e" : "none" }}>
                  <span style={{ color: "#888" }}>{b.label}</span>
                  <span style={{ fontWeight: 700, fontFamily: "'Space Mono'", color: "#ffeb3b", fontSize: 11 }}>{b.value}</span>
                </div>
              ))}
            </div>
            {adherence.validated > 0 && (
              <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(76,175,80,.06)", borderRadius: 10, fontSize: 11 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "#888" }}>Dépensé ({adherence.validated}j)</span>
                  <span style={{ color: "#4caf50", fontWeight: 700, fontFamily: "'Space Mono'" }}>
                    ~{Math.round(adherence.validated * ((budget.perDay.min + budget.perDay.max) / 2))}€
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#888" }}>Restant ({foodPlan.totalDays - adherence.validated}j)</span>
                  <span style={{ color: "#666", fontFamily: "'Space Mono'" }}>
                    ~{Math.round((foodPlan.totalDays - adherence.validated) * ((budget.perDay.min + budget.perDay.max) / 2))}€
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ADHERENCE */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 16 }}>📊</span> Adhérence
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { label: "Jours validés", value: `${adherence.validated}/${adherence.totalElapsed}`, color: "#4caf50" },
                { label: "Adhérence", value: `${adherence.pct}%`, color: adherence.pct >= 80 ? "#4caf50" : adherence.pct >= 50 ? "#ff9800" : "#e94560" },
                { label: "Streak", value: `${adherence.streak}🔥`, color: "#ff9800" },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, textAlign: "center", padding: "10px 4px", background: "#0a0a1a", borderRadius: 12, border: "1px solid #1a1a2e" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Space Mono'", color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: "#555", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
            {adherence.totalElapsed > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ height: 6, background: "#0a0a1a", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${adherence.pct}%`, height: "100%", background: adherence.pct >= 80 ? "linear-gradient(90deg, #4caf50, #2e7d32)" : adherence.pct >= 50 ? "linear-gradient(90deg, #ff9800, #e65100)" : "linear-gradient(90deg, #e94560, #c23152)", borderRadius: 3, transition: "width .5s" }} />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ===== LISTE DE COURSES ===== */}
      {view === "courses" && (
        <>
          <div style={{ display: "flex", gap: 4, background: "#0d0d24", borderRadius: 10, padding: 3, border: "1px solid #1e1e4a" }}>
            {[1, 2].map(w => (
              <div key={w} onClick={() => setShoppingWeeks(w)}
                style={{ flex: 1, padding: "8px 0", borderRadius: 8, textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700, background: shoppingWeeks === w ? "rgba(233,69,96,.15)" : "transparent", color: shoppingWeeks === w ? "#e94560" : "#555", transition: "all .2s" }}>
                {w} semaine{w > 1 ? "s" : ""}
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 16 }}>🛒</span> Liste de courses — {shoppingWeeks} semaine{shoppingWeeks > 1 ? "s" : ""}
            </div>
            {shoppingList.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 0", borderBottom: i < shoppingList.length - 1 ? "1px solid #1a1a2e" : "none" }}>
                <span style={{ fontSize: 20, width: 30, textAlign: "center" }}>{item.emoji}</span>
                <span style={{ flex: 1, fontSize: 13 }}>{item.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Space Mono'", color: "#ffeb3b" }}>
                  {shoppingWeeks === 1 ? item.qtyWeek : item.qty2Weeks}
                </span>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Estimation prix — {shoppingWeeks} semaine{shoppingWeeks > 1 ? "s" : ""}</div>
            <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "'Space Mono'", color: "#ffeb3b" }}>
              {Math.round(budget.perDay.min * 7 * shoppingWeeks)}€ — {Math.round(budget.perDay.max * 7 * shoppingWeeks)}€
            </div>
            <div style={{ fontSize: 10, color: "#555", marginTop: 4 }}>
              soit {budget.perDay.min.toFixed(2)}€ — {budget.perDay.max.toFixed(2)}€ par jour
            </div>
          </div>
        </>
      )}

      {/* ===== MODALS ===== */}
      {editingItem && (
        <FoodItemForm
          item={editingItem.item}
          categoryId={editingItem.categoryId}
          categories={planCategories}
          onSave={savePlanItem}
          onClose={() => setEditingItem(null)}
        />
      )}
      {editingTargets && (
        <MacroTargetsForm
          targets={planTargets}
          onSave={saveTargets}
          onClose={() => setEditingTargets(false)}
        />
      )}
      {showTemplates && (
        <TemplatesPanel
          templates={data.foodTemplates || []}
          currentPlanName={foodPlan.name}
          onLoad={loadTemplate}
          onSaveAs={saveAsTemplate}
          onDelete={deleteTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
}
