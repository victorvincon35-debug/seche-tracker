export const STAGE_DAYS = 30;

// Legacy stages (kept for backward compatibility with helpers.js)
export const NUTRITION_STAGES = [
  { id: 1, name: "SÈCHE", emoji: "🔴", kcal: 2300, macros: { glucides: "218g", proteines: "200g", lipides: "70g" }, budget: "~14€/jour", color: "#e94560" },
  { id: 2, name: "SÈCHE", emoji: "🔴", kcal: 2300, macros: { glucides: "218g", proteines: "200g", lipides: "70g" }, budget: "~14€/jour", color: "#e94560" },
  { id: 3, name: "SÈCHE", emoji: "🔴", kcal: 2300, macros: { glucides: "218g", proteines: "200g", lipides: "70g" }, budget: "~14€/jour", color: "#e94560" },
  { id: 4, name: "SÈCHE", emoji: "🔴", kcal: 2300, macros: { glucides: "218g", proteines: "200g", lipides: "70g" }, budget: "~14€/jour", color: "#e94560" },
];

// ===== FIXED NUTRITION PLAN — 2 300 kcal/day, 120 days =====

export const FOOD_PLAN = {
  startDate: "2026-02-23",
  totalDays: 120,
  kcal: 2300,
  macros: { glucides: 218, proteines: 200, lipides: 70 },
  macrosPct: { glucides: 38, proteines: 35, lipides: 27 },
  pricePerDay: { min: 13.67, max: 14.61 },
  pricePerMonth: { min: 410, max: 438 },
  priceTotal: { min: 1640, max: 1752 },
};

export const FOOD_CATEGORIES = [
  {
    id: "glucides",
    label: "Glucides",
    target: "218g",
    targetKcal: 870,
    pct: 38,
    color: "#ff9800",
    emoji: "🌾",
    items: [
      { id: "jo", label: "Jus d'orange", qty: "700 ml", macro: "73g glucides", priceMin: 1.30, priceMax: 2.24, emoji: "🍊", xp: 5 },
      { id: "miel", label: "Miel", qty: "48g", macro: "39g glucides", priceMin: 0.72, priceMax: 0.72, emoji: "🍯", xp: 5 },
      { id: "banane", label: "Banane mûre (Guadeloupe/Martinique)", qty: "700g (~435g chair)", macro: "100g glucides", priceMin: 1.00, priceMax: 1.00, emoji: "🍌", xp: 5 },
    ],
  },
  {
    id: "proteines",
    label: "Protéines",
    target: "200g",
    targetKcal: 800,
    pct: 35,
    color: "#4a90d9",
    emoji: "🥩",
    items: [
      { id: "boeuf", label: "Bœuf haché 5%", qty: "300g", macro: "62g protéines", priceMin: 3.00, priceMax: 3.00, emoji: "🥩", xp: 10 },
      { id: "oeufs", label: "Œufs", qty: "6", macro: "36g protéines", priceMin: 1.25, priceMax: 1.25, emoji: "🥚", xp: 5 },
      { id: "whey", label: "Whey isolat Dynveo nature", qty: "80g", macro: "68g protéines", priceMin: 3.60, priceMax: 3.60, emoji: "🥛", xp: 10 },
      { id: "collagene", label: "Collagène AM Nutrition Peptan®", qty: "50g", macro: "34g protéines", priceMin: 2.25, priceMax: 2.25, emoji: "💪", xp: 10 },
    ],
  },
  {
    id: "lipides",
    label: "Lipides",
    target: "70g",
    targetKcal: 630,
    pct: 27,
    color: "#e94560",
    emoji: "🫒",
    note: "+46,5g inclus (bœuf 15g, œufs 30g, whey 1,5g)",
    items: [
      { id: "beurre", label: "Beurre", qty: "28g", macro: "23g lipides", priceMin: 0.15, priceMax: 0.15, emoji: "🧈", xp: 3 },
    ],
  },
  {
    id: "autres",
    label: "Légumes",
    target: "",
    color: "#4caf50",
    emoji: "🥬",
    items: [
      { id: "carottes", label: "Carottes", qty: "à volonté", macro: "", priceMin: 0.20, priceMax: 0.20, emoji: "🥕", xp: 3 },
      { id: "champignons", label: "Champignons de Paris", qty: "à volonté", macro: "", priceMin: 0.20, priceMax: 0.20, emoji: "🍄", xp: 3 },
    ],
  },
];

export const ALL_FOOD_ITEMS = FOOD_CATEGORIES.flatMap(c => c.items);

export const SHOPPING_LIST = [
  { label: "Jus d'orange", qtyWeek: "4,9 L", qty2Weeks: "9,8 L", emoji: "🍊" },
  { label: "Miel", qtyWeek: "336g", qty2Weeks: "672g", emoji: "🍯" },
  { label: "Bananes (Guadeloupe/Martinique)", qtyWeek: "4,9 kg", qty2Weeks: "9,8 kg", emoji: "🍌" },
  { label: "Bœuf haché 5%", qtyWeek: "2,1 kg", qty2Weeks: "4,2 kg", emoji: "🥩" },
  { label: "Œufs", qtyWeek: "42 (7 boîtes de 6)", qty2Weeks: "84 (14 boîtes de 6)", emoji: "🥚" },
  { label: "Whey isolat Dynveo", qtyWeek: "560g", qty2Weeks: "1,12 kg", emoji: "🥛" },
  { label: "Collagène AM Nutrition", qtyWeek: "350g", qty2Weeks: "700g", emoji: "💪" },
  { label: "Beurre", qtyWeek: "196g", qty2Weeks: "392g", emoji: "🧈" },
  { label: "Carottes", qtyWeek: "à volonté", qty2Weeks: "à volonté", emoji: "🥕" },
  { label: "Champignons de Paris", qtyWeek: "à volonté", qty2Weeks: "à volonté", emoji: "🍄" },
];

// ===== PROGRESSIVE TRACKING CONFIG =====

export const FOOD_TRACKING = {
  jo: {
    max: 700, unit: "ml",
    buttons: [{ label: "+100ml", v: 100 }, { label: "+200ml", v: 200 }, { label: "+350ml", v: 350 }],
    macros: { glucides: 73 },
  },
  miel: {
    max: 48, unit: "g",
    buttons: [{ label: "+12g", v: 12 }, { label: "+24g", v: 24 }],
    macros: { glucides: 39 },
  },
  banane: {
    max: 435, unit: "g", perUnit: 130,
    buttons: [{ label: "+1 🍌", v: 130 }],
    macros: { glucides: 100 },
  },
  boeuf: {
    max: 300, unit: "g",
    buttons: [{ label: "+50g", v: 50 }, { label: "+100g", v: 100 }, { label: "+150g", v: 150 }],
    macros: { proteines: 62, lipides: 15 },
  },
  oeufs: {
    type: "dots", max: 6, unit: "œuf", unitPlural: "œufs",
    buttons: [{ label: "+1 œuf", v: 1 }, { label: "+2 œufs", v: 2 }],
    macros: { proteines: 36, lipides: 30, glucides: 3 },
  },
  whey: {
    type: "dots", max: 2, unit: "shaker", unitPlural: "shakers", perUnit: 40,
    buttons: [{ label: "+1 shaker", v: 1 }],
    macros: { proteines: 68, lipides: 1.5, glucides: 3 },
  },
  collagene: {
    max: 50, unit: "g",
    buttons: [{ label: "+25g", v: 25 }],
    macros: { proteines: 34 },
  },
  beurre: {
    max: 28, unit: "g",
    buttons: [{ label: "+14g", v: 14 }],
    macros: { lipides: 23 },
  },
  carottes: { type: "checkbox", macros: {} },
  champignons: { type: "checkbox", macros: {} },
};

// Backward compatibility for getDayScore in App.jsx
export function getMealsForStage() {
  return ALL_FOOD_ITEMS;
}
