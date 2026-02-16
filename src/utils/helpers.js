import { CITIES, AVATAR_STAGES } from "../constants/cities.js";
import { STAGE_DAYS, NUTRITION_STAGES, FOOD_PLAN, FOOD_CATEGORIES, FOOD_TRACKING } from "../constants/nutrition.js";
import { HOUR_HEIGHT } from "../constants/planning.js";

export const STORAGE_KEY = "seche-tracker-v5";
export const START_DATE = "2026-02-23";
export const TOTAL_DAYS = 120;

export function getToday() { return new Date().toISOString().split("T")[0]; }
export function getDayNumber(d) { return Math.floor((new Date(d) - new Date(START_DATE)) / 86400000) + 1; }
export function getWeekNumber(d) { return Math.ceil(getDayNumber(d) / 7); }
export function getAvatarStage(xp) { let s = AVATAR_STAGES[0]; for (const a of AVATAR_STAGES) if (xp >= a.min) s = a; return s; }
export function getCurrentCity(xp) { let c = CITIES[0]; for (const city of CITIES) if (xp >= city.min) c = city; return c; }
export function getNextCity(xp) { for (const c of CITIES) if (xp < c.min) return c; return null; }

export function getMonday(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().split("T")[0];
}

export function getWeekDates(mondayStr) {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(mondayStr);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

export function doesRecur(event, dateStr) {
  if (!event.recurrence || event.recurrence.type === "none") return false;
  if (dateStr < event.date) return false;
  if (dateStr === event.date) return false;
  const dow = new Date(dateStr).getDay();
  const daysDiff = Math.round((new Date(dateStr) - new Date(event.date)) / 86400000);
  switch (event.recurrence.type) {
    case "daily": return true;
    case "weekly": return dow === new Date(event.date).getDay();
    case "biweekly": return dow === new Date(event.date).getDay() && daysDiff % 14 < 7;
    case "monthly": return new Date(dateStr).getDate() === new Date(event.date).getDate();
    case "weekdays": return dow >= 1 && dow <= 5;
    case "custom": return (event.recurrence.days || []).includes(dow);
    default: return false;
  }
}

export function getEventsForDate(planning, dateStr) {
  const results = [];
  for (const [id, e] of Object.entries(planning || {})) {
    const isExactDate = e.date === dateStr;
    const isRecurring = doesRecur(e, dateStr);
    if (!isExactDate && !isRecurring) continue;
    const exception = e.exceptions?.[dateStr];
    if (exception === "deleted") continue;
    let occ = { ...e, id, _occurrenceDate: dateStr, _isRecurring: !!(e.recurrence && e.recurrence.type !== "none") };
    if (exception && typeof exception === "object") {
      occ = { ...occ, ...exception };
    }
    results.push(occ);
  }
  return results.sort((a, b) => a.startH * 60 + a.startM - (b.startH * 60 + b.startM));
}

export function getEventPosition(event) {
  const startMinutes = (event.startH - 6) * 60 + event.startM;
  const endMinutes = (event.endH - 6) * 60 + event.endM;
  const top = (startMinutes / 60) * HOUR_HEIGHT;
  const height = Math.max(((endMinutes - startMinutes) / 60) * HOUR_HEIGHT, 20);
  return { top, height };
}

export function formatWeekRange(weekDates) {
  const months = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
  const first = new Date(weekDates[0]);
  const last = new Date(weekDates[6]);
  if (first.getMonth() === last.getMonth()) {
    return `${first.getDate()} — ${last.getDate()} ${months[first.getMonth()]} ${first.getFullYear()}`;
  }
  return `${first.getDate()} ${months[first.getMonth()]} — ${last.getDate()} ${months[last.getMonth()]}`;
}

export const defaultData = () => ({ days: {}, weeks: {}, weight: {}, planning: {}, totalXP: 0, bestStreak: 0, seenRewards: [], nutrition: { currentStage: 1, stageStartDate: null, cycleComplete: false }, reappro: {}, _migrations: {} });

export function migrateSuppsV2(d) {
  if (d._migrations?.supps_v2) return d;
  const nd = JSON.parse(JSON.stringify(d));
  Object.keys(nd.days || {}).forEach(dk => {
    const day = nd.days[dk];
    if (!day?.supps) return;
    if (day.supps.s_magnesium !== undefined) {
      const val = day.supps.s_magnesium;
      day.supps.s_mag_1 = val; day.supps.s_mag_2 = val; day.supps.s_mag_3 = val;
      delete day.supps.s_magnesium;
    }
    if (day.supps.s_calcium !== undefined) {
      const val = day.supps.s_calcium;
      day.supps.s_calcium_1 = val; day.supps.s_calcium_2 = val;
      delete day.supps.s_calcium;
    }
  });
  if (!nd._migrations) nd._migrations = {};
  nd._migrations.supps_v2 = true;
  if (!nd.reappro) nd.reappro = {};
  return nd;
}

export function migrateFoodPlan(d) {
  if (d.foodPlan) return d;
  const nd = JSON.parse(JSON.stringify(d));

  // Build flat items map from FOOD_CATEGORIES + FOOD_TRACKING
  const items = {};
  FOOD_CATEGORIES.forEach(cat => {
    cat.items.forEach(item => {
      const t = FOOD_TRACKING[item.id];
      items[item.id] = {
        id: item.id,
        label: item.label,
        emoji: item.emoji,
        xp: item.xp,
        type: t.type || "bar",
        max: t.max || 1,
        unit: t.unit || "",
        unitPlural: t.unitPlural || "",
        perUnit: t.perUnit || null,
        buttons: t.buttons || [],
        macros: { glucides: t.macros.glucides || 0, proteines: t.macros.proteines || 0, lipides: t.macros.lipides || 0 },
        qtyLabel: item.qty,
        macroLabel: item.macro,
        price: { min: item.priceMin, max: item.priceMax },
      };
    });
  });

  // Build categories
  const categories = FOOD_CATEGORIES.map(cat => ({
    id: cat.id,
    label: cat.label,
    target: cat.target || "",
    color: cat.color,
    emoji: cat.emoji,
    note: cat.note || "",
    itemIds: cat.items.map(it => it.id),
  }));

  nd.foodPlan = {
    name: "Plan Sèche 2300 kcal",
    startDate: FOOD_PLAN.startDate,
    totalDays: FOOD_PLAN.totalDays,
    targets: {
      kcal: FOOD_PLAN.kcal,
      glucides: FOOD_PLAN.macros.glucides,
      proteines: FOOD_PLAN.macros.proteines,
      lipides: FOOD_PLAN.macros.lipides,
    },
    budget: { perDay: { min: FOOD_PLAN.pricePerDay.min, max: FOOD_PLAN.pricePerDay.max } },
    categories,
    items,
  };

  // Save as first template
  nd.foodTemplates = [{
    id: "tpl_default",
    name: "Plan Sèche 2300 kcal",
    createdAt: new Date().toISOString(),
    plan: JSON.parse(JSON.stringify(nd.foodPlan)),
  }];

  if (!nd._migrations) nd._migrations = {};
  nd._migrations.food_plan_v1 = true;
  return nd;
}

export function getCurrentNutritionStage() {
  const today = new Date(getToday());
  const start = new Date(START_DATE);
  const diffDays = Math.floor((today - start) / 86400000);
  if (diffDays < 0) {
    return { stage: 1, dayInStage: 0, stageInfo: NUTRITION_STAGES[0], complete: false, notStarted: true, daysUntilStart: Math.abs(diffDays) };
  }
  const totalDays = STAGE_DAYS * 4;
  if (diffDays >= totalDays) {
    return { stage: 4, dayInStage: STAGE_DAYS, stageInfo: NUTRITION_STAGES[3], complete: true, notStarted: false };
  }
  const stageIndex = Math.min(3, Math.floor(diffDays / STAGE_DAYS));
  const dayInStage = (diffDays % STAGE_DAYS) + 1;
  return { stage: stageIndex + 1, dayInStage, stageInfo: NUTRITION_STAGES[stageIndex], complete: false, notStarted: false };
}

export function isMonday(dateStr) {
  return new Date(dateStr).getDay() === 1;
}

export function getNextMonday(dateStr) {
  const d = new Date(dateStr || getToday());
  const day = d.getDay();
  const daysUntil = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
  d.setDate(d.getDate() + daysUntil);
  return d.toISOString().split("T")[0];
}

export function getWeekInStage(data) {
  if (!data.nutrition?.stageStartDate) return 1;
  const stageStart = new Date(data.nutrition.stageStartDate);
  const today = new Date(getToday());
  const diffDays = Math.floor((today - stageStart) / 86400000);
  if (diffDays < 0) return 0;
  return Math.floor(diffDays / 7) + 1;
}

export function getStageType() {
  return "seche";
}

export function getWeightAlert(data, currentWeekNum) {
  const wk = `w${currentWeekNum}`;
  const prevWk = `w${currentWeekNum - 1}`;
  const prev2Wk = `w${currentWeekNum - 2}`;
  const currentPoids = data.weight[wk]?.poids ? parseFloat(data.weight[wk].poids) : null;
  const prevPoids = data.weight[prevWk]?.poids ? parseFloat(data.weight[prevWk].poids) : null;
  const prev2Poids = data.weight[prev2Wk]?.poids ? parseFloat(data.weight[prev2Wk].poids) : null;

  if (currentPoids === null || prevPoids === null) return null;

  const delta = currentPoids - prevPoids;
  const delta2 = prev2Poids !== null ? currentPoids - prev2Poids : null;
  const prevDelta = prev2Poids !== null ? prevPoids - prev2Poids : null;
  const weekInStage = getWeekInStage(data);

  if (weekInStage <= 2 && delta <= -1.5 && delta >= -2.5) {
    return { type: "ok", text: "Normal, c'est l'eau et le glycogène qui partent" };
  }
  if (weekInStage <= 2 && delta < -2.5) {
    return { type: "ok", text: "Grosse perte initiale — eau et glycogène, c'est normal" };
  }
  if (weekInStage > 2 && delta < -2) {
    return { type: "warning", text: "Trop rapide, tu risques de perdre du muscle" };
  }
  if (weekInStage >= 3 && prevDelta !== null && Math.abs(delta) < 0.3 && Math.abs(prevDelta) < 0.3) {
    return { type: "warning", text: "Plateau ! Ajoute 200 kcal de déficit" };
  }
  if (weekInStage >= 3 && delta >= -1.2 && delta <= -0.7) {
    return { type: "ok", text: "Parfait, sèche efficace" };
  }
  if (weekInStage <= 2 && delta < 0) {
    return { type: "ok", text: "Début de sèche, le corps s'adapte" };
  }
  if (weekInStage >= 3 && delta < 0) {
    return { type: "ok", text: "Sèche en cours, bonne progression" };
  }
  if (weekInStage <= 2 && Math.abs(delta) < 0.3) {
    return { type: "ok", text: "Le corps s'adapte, la perte va commencer" };
  }
  if (delta > 0) {
    return { type: "warning", text: "Prise de poids en sèche — vérifie ton déficit calorique" };
  }

  return { type: "ok", text: `${delta > 0 ? "+" : ""}${delta.toFixed(1)} kg cette semaine` };
}

export async function compressImage(file, maxWidth = 400, quality = 0.6) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
