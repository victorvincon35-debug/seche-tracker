export const STAGE_DAYS = 30;

export const NUTRITION_STAGES = [
  { id: 1, name: "REGAIN D'ÉNERGIE", emoji: "🟢", kcal: 3100, macros: { glucides: "485g", proteines: "130g", lipides: "71g" }, budget: "~15,90€/jour", color: "#4caf50" },
  { id: 2, name: "SÈCHE", emoji: "🔴", kcal: 2130, macros: { glucides: "175g", proteines: "200g", lipides: "70g" }, budget: "~14,63€/jour", color: "#e94560" },
  { id: 3, name: "REGAIN D'ÉNERGIE", emoji: "🟢", kcal: 3100, macros: { glucides: "485g", proteines: "130g", lipides: "71g" }, budget: "~15,90€/jour", color: "#4caf50" },
  { id: 4, name: "SÈCHE", emoji: "🔴", kcal: 2130, macros: { glucides: "175g", proteines: "200g", lipides: "70g" }, budget: "~14,63€/jour", color: "#e94560" },
];

export const MEALS_REGAIN = [
  { id: "jo", label: "Jus d'orange 2L", emoji: "🍊", xp: 5 },
  { id: "miel", label: "Miel 200g", emoji: "🍯", xp: 5 },
  { id: "banane", label: "Banane 800g (avec peau)", emoji: "🍌", xp: 5 },
  { id: "boeuf", label: "Bœuf haché 5% — 450g", emoji: "🥩", xp: 10 },
  { id: "oeufs", label: "6 œufs", emoji: "🥚", xp: 5 },
  { id: "collagene", label: "Collagène 45g", emoji: "💪", xp: 10 },
  { id: "beurre", label: "Beurre 15g", emoji: "🧈", xp: 3 },
  { id: "huile_coco", label: "Huile de coco 7ml", emoji: "🥥", xp: 3 },
];

export const MEALS_SECHE = [
  { id: "jo", label: "Jus d'orange 700ml", emoji: "🍊", xp: 5 },
  { id: "miel", label: "Miel 76g", emoji: "🍯", xp: 5 },
  { id: "banane", label: "Banane 265g (avec peau)", emoji: "🍌", xp: 5 },
  { id: "boeuf", label: "Bœuf haché 5% — 300g", emoji: "🥩", xp: 10 },
  { id: "oeufs", label: "6 œufs", emoji: "🥚", xp: 5 },
  { id: "whey", label: "Whey Dynveo 80g", emoji: "🥛", xp: 10 },
  { id: "collagene", label: "Collagène AM 50g", emoji: "💪", xp: 10 },
  { id: "beurre", label: "Beurre 28g", emoji: "🧈", xp: 3 },
  { id: "legumes", label: "Carottes + Champignons", emoji: "🥕", xp: 5 },
];

const STAGE_MEALS = { 1: MEALS_REGAIN, 2: MEALS_SECHE, 3: MEALS_REGAIN, 4: MEALS_SECHE };
export function getMealsForStage(stageNum) { return STAGE_MEALS[stageNum] || MEALS_SECHE; }
