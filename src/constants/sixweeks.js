// === MODE 6 SEMAINES — CONSTANTES ===
// Challenge: 2 mars 2026 → 12 avril 2026 (42 jours)

export const SIX_WEEKS_START = "2026-03-02";
export const SIX_WEEKS_END = "2026-04-12";
export const SIX_WEEKS_DAYS = 42;

export function get6wDayNumber(dateStr) {
  const diff = Math.floor((new Date(dateStr) - new Date(SIX_WEEKS_START)) / 86400000) + 1;
  return Math.max(1, Math.min(diff, SIX_WEEKS_DAYS));
}

export function get6wDaysRemaining() {
  const today = new Date().toISOString().split("T")[0];
  const diff = Math.floor((new Date(SIX_WEEKS_END) - new Date(today)) / 86400000);
  return Math.max(0, diff);
}

export function get6wProgress(dateStr) {
  const day = get6wDayNumber(dateStr);
  return Math.min(100, Math.round((day / SIX_WEEKS_DAYS) * 100));
}

// === MA JOURNEE — BLOCS CHRONOLOGIQUES (routine + nutrition fusionnes) ===
export const JOURNEE_BLOCKS = [
  { id: "j1", label: "Lever + Manger + Sport", subtitle: "Skyr + miel + banane + Vitamine D, K2, B", time: "7h", emoji: "🏋️" },
  { id: "j2", label: "Travailler", emoji: "💻" },
  { id: "j3", label: "Manger", subtitle: "Julie + proteine", emoji: "🍽️" },
  { id: "j4", label: "Travailler", emoji: "💻" },
  { id: "j5", label: "Manger", subtitle: "Julie + proteine + Magnesium + Zinc", emoji: "🍽️" },
  { id: "j6", label: "Travailler", emoji: "💻" },
  { id: "j7", label: "Lire + Dodo", time: "22h / 22h30", emoji: "📖" },
];

export const NUTRITION_PRINCIPLES = [
  { emoji: "🍽️", text: "Manger a la faim" },
  { emoji: "🚫", text: "Le moins d'huile vegetale possible" },
  { emoji: "💪", text: "Complements proteines : 100g/jour (~33g par repas)" },
];

export const PAUSE_ACTIVE = { id: "pause_active", label: "Pause active", emoji: "🚶", detail: "Marcher / Baby-foot / Ping-pong / Just Dance" };

// === ENTRAINEMENT — PROGRAMME HAUT/BAS ===

// Planning semaine
export const TRAINING_SCHEDULE = {
  1: { type: "haut", label: "HAUT", emoji: "💪", color: "#e94560" },       // Lundi
  2: { type: "bas_ep", label: "BAS + EP", emoji: "🦵", color: "#4a90d9" },  // Mardi
  3: { type: "cardio", label: "CARDIO", emoji: "❤️", color: "#ff5722" },    // Mercredi
  4: { type: "haut", label: "HAUT", emoji: "💪", color: "#e94560" },       // Jeudi
  5: { type: "bas_ep", label: "BAS + EP", emoji: "🦵", color: "#4a90d9" },  // Vendredi
  6: { type: "cardio", label: "CARDIO", emoji: "❤️", color: "#ff5722" },   // Samedi
  0: { type: "cardio", label: "CARDIO", emoji: "❤️", color: "#ff5722" },   // Dimanche
};

// Echauffement protocole Kilian (2 disques 2.5kg)
export const WARMUP_HAUT = [
  { id: "wh1", label: "Curl supination+neutre+pronation", sets: "1x10+10+10", emoji: "💪" },
  { id: "wh2", label: "Elev frontales supination", sets: "1x10+10", emoji: "🙌" },
  { id: "wh3", label: "Oiseau pronation", sets: "1x10+10", emoji: "🦅" },
  { id: "wh4", label: "Rowing buste penche", sets: "1x15+15", emoji: "🚣" },
  { id: "wh5", label: "Developpe nul", sets: "1x10+10+10", emoji: "🏋️" },
  { id: "wh6", label: "Extensions nuque", sets: "1x10", emoji: "💫" },
];

export const WARMUP_BAS = [
  { id: "wb1", label: "RDL une jambe", sets: "1x10/jambe", emoji: "🦵" },
  { id: "wb2", label: "Goblet squat pause 3-4s", sets: "1x10", emoji: "🏋️" },
  { id: "wb3", label: "2-3 series montee progressive", sets: "", emoji: "📈" },
];

// SEANCE HAUT (Lundi & Jeudi)
export const EXERCISES_HAUT = [
  { id: "eh1", label: "Developpe decline Smith", sets: 3, repsMin: 7, repsMax: 10, rest: "4-5 min", emoji: "🏋️", muscle: "Pecs" },
  { id: "eh2", label: "Dips (leste quand possible)", sets: 3, repsMin: 6, repsMax: 10, rest: "3-5 min", emoji: "💪", muscle: "Pecs/Triceps" },
  { id: "eh3", label: "Ecartes elastiques (angle decline)", sets: 3, repsMin: 14, repsMax: 20, rest: "2-3 min", emoji: "🔴", muscle: "Pecs" },
  { id: "eh4", label: "Rowing planche (coudes 45deg)", sets: 3, repsMin: 7, repsMax: 10, rest: "3-5 min", emoji: "🚣", muscle: "Dos" },
  { id: "eh5", label: "Tractions prise neutre (anneaux)", sets: 3, repsMin: 6, repsMax: 10, rest: "3-5 min", emoji: "🔝", muscle: "Dos" },
  { id: "eh6", label: "Curl incline halteres", sets: 3, repsMin: 7, repsMax: 10, rest: "2-3 min", emoji: "💪", muscle: "Biceps" },
  { id: "eh7", label: "Magic triceps halteres", sets: 3, repsMin: 12, repsMax: 20, rest: "2-3 min", emoji: "🔱", muscle: "Triceps" },
];

// SEANCE BAS + EPAULES (Mardi & Vendredi)
export const EXERCISES_BAS = [
  { id: "eb1", label: "Hip thrust", sets: 3, repsMin: 7, repsMax: 10, rest: "3-5 min", emoji: "🍑", muscle: "Fessiers" },
  { id: "eb2", label: "Squat bulgare Smith", sets: 3, repsMin: 7, repsMax: 10, rest: "3-5 min", emoji: "🦵", muscle: "Quads/Fessiers" },
  { id: "eb3", label: "RDL unilateral", sets: 3, repsMin: 7, repsMax: 10, rest: "3-4 min", emoji: "🏋️", muscle: "Ischio" },
  { id: "eb4", label: "Oiseau poulie basse unilateral", sets: 3, repsMin: 12, repsMax: 20, rest: "2-3 min", emoji: "🦅", muscle: "Epaules post" },
  { id: "eb5", label: "Laterales profil banc incline", sets: 3, repsMin: 12, repsMax: 20, rest: "2-3 min", emoji: "🙌", muscle: "Epaules lat" },
  { id: "eb6", label: "Laterales poulie basse", sets: 3, repsMin: 12, repsMax: 20, rest: "2-3 min", emoji: "🦅", muscle: "Epaules lat" },
  { id: "eb7", label: "Mollets (extensions)", sets: 3, repsMin: 12, repsMax: 20, rest: "2-3 min", emoji: "🦶", muscle: "Mollets" },
];

// Etirements post-seance
export const STRETCHES = [
  { id: "st1", label: "Psoas", duration: "30-60s/cote", emoji: "🧘" },
  { id: "st2", label: "Quadriceps", duration: "30-60s/cote", emoji: "🦵" },
  { id: "st3", label: "Isquios", duration: "30s/cote", emoji: "🙆" },
];

// Mensurations a suivre
export const MEASUREMENTS = [
  { id: "taille", label: "Tour de taille", unit: "cm", emoji: "📏" },
  { id: "bras", label: "Tour de bras", unit: "cm", emoji: "💪" },
  { id: "cuisse", label: "Tour de cuisse", unit: "cm", emoji: "🦵" },
  { id: "poids", label: "Poids", unit: "kg", emoji: "⚖️" },
];

// === BUSINESS — PROJETS ET TACHES ===
export const BUSINESS_PROJECTS = [
  {
    id: "arty",
    label: "ARTY",
    emoji: "🎨",
    color: "#e94560",
    tasks: [
      { id: "ar1", label: "VSL + planning" },
      { id: "ar2", label: "Video remerciement + rappel" },
      { id: "ar3", label: "Sequence mail RDV" },
      { id: "ar4", label: "IA miniatures/titres/contenu/ameliorations" },
      { id: "ar5", label: "Full contenu 3/jour Insta + 1/sem YTB" },
    ],
  },
  {
    id: "okan",
    label: "OKAN",
    emoji: "🏗️",
    color: "#ff9800",
    tasks: [
      { id: "ok1", label: "Reconnecter WhatsApp + auto" },
      { id: "ok2", label: "Relances clients" },
      { id: "ok3", label: "Temoignages" },
      { id: "ok4", label: "Focus isolation ext + upsell enduit chaux" },
      { id: "ok5", label: "Google Ads" },
      { id: "ok6", label: "Facebook Ads" },
      { id: "ok7", label: "Contacter syndics" },
      { id: "ok8", label: "Relancer TOUS devis meme 5 ans" },
      { id: "ok9", label: "Bot appels ads" },
    ],
  },
  {
    id: "app",
    label: "APP",
    emoji: "📱",
    color: "#4caf50",
    tasks: [
      { id: "ap1", label: "Selectionner 30 influenceurs +100K avec haut taux d'engagement" },
      { id: "ap2", label: "Creer demo application" },
      { id: "ap3", label: "Envoyer sur toutes les plateformes avec relances" },
    ],
    counters: [
      { id: "cnt_contrats", label: "Contrats signes", emoji: "📝" },
      { id: "cnt_videos", label: "Videos envoyees", emoji: "🎬" },
      { id: "cnt_relances", label: "Relances par envoi", emoji: "📩" },
    ],
  },
];

// === OBJECTIFS ===
export const OBJECTIVES_PHYSIQUE = [
  { id: "bf", label: "Body fat", start: 22, target: 17, unit: "%", emoji: "📉" },
  { id: "fat_loss", label: "Perdre gras", start: 0, target: 4.5, unit: "kg", emoji: "🔥" },
  { id: "muscle_gain", label: "Prendre muscle sec", start: 0, target: 1.5, unit: "kg", emoji: "💪" },
];

export const OBJECTIVE_BUSINESS = { label: "100K euros/mois", emoji: "💰" };

export const REWARDS_6W = [
  { id: "rw1", label: "1 semaine Julie au Maroc", budget: "300-500€", emoji: "🇲🇦", unlockDay: 21 },
  { id: "rw2", label: "1 semaine Antoine Portugal surf", budget: "500-700€", emoji: "🇵🇹🏄", unlockDay: 42 },
];

// Jours de la semaine en francais
export const JOURS_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
export const MOIS_FR = ["Jan", "Fev", "Mar", "Avr", "Mai", "Jun", "Jul", "Aou", "Sep", "Oct", "Nov", "Dec"];

// Helper: rest time en secondes a partir d'un string "3-5 min"
export function parseRestSeconds(restStr) {
  const match = restStr.match(/(\d+)-?(\d+)?\s*min/);
  if (!match) return 180;
  const min = parseInt(match[1]);
  return min * 60;
}
