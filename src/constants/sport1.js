// Programme Sport 1 — 16 semaines recomposition corporelle
// Lun=Upper, Mar=Lower, Mer=Cardio, Jeu=Upper, Ven=Lower, Sam-Dim=Cardio/Repos

export const CORRECTION_POSTURALE = [
  { id: "cp1", label: "Rétraction scapulaire", reps: "15 reps", duration: 40, emoji: "💎" },
  { id: "cp2", label: "Chin tucks", reps: "12 reps", duration: 30, emoji: "🙆" },
  { id: "cp3", label: "Rotation thoracique", reps: "10 chaque côté", duration: 50, emoji: "🔄" },
  { id: "cp4", label: "Stretch pectoraux", reps: "20s chaque côté", duration: 45, emoji: "🚪" },
  { id: "cp5", label: "Activation fessiers (bridge)", reps: "15 reps", duration: 40, emoji: "🍑" },
  { id: "cp6", label: "Dead bug", reps: "8 chaque côté", duration: 45, emoji: "🪲" },
  { id: "cp7", label: "Stretch psoas", reps: "20s chaque côté", duration: 45, emoji: "🦵" },
];

export const UPPER_EXERCISES = [
  // Superset 1
  { id: "u1", label: "Développé incliné haltères", emoji: "🏋️", series: 4, reps: "8-12", rest: 90, superset: "u2", muscle: "Pectoraux" },
  { id: "u2", label: "Tractions (ou assistées)", emoji: "🔝", series: 4, reps: "6-10", rest: 90, muscle: "Dos" },
  // Superset 2
  { id: "u3", label: "Développé couché haltères", emoji: "💪", series: 3, reps: "10-12", rest: 75, superset: "u4", muscle: "Pectoraux" },
  { id: "u4", label: "Rowing haltère 1 bras", emoji: "🚣", series: 3, reps: "10-12", rest: 75, muscle: "Dos" },
  // Superset 3
  { id: "u5", label: "Élévations latérales", emoji: "🦅", series: 3, reps: "12-15", rest: 60, superset: "u6", muscle: "Épaules" },
  { id: "u6", label: "Face pulls (élastique/poulie)", emoji: "🔴", series: 3, reps: "15-20", rest: 60, muscle: "Épaules post." },
  // Superset 4
  { id: "u7", label: "Curl biceps haltères", emoji: "💪", series: 3, reps: "10-12", rest: 60, superset: "u8", muscle: "Biceps" },
  { id: "u8", label: "Extensions triceps poulie/haltère", emoji: "🔱", series: 3, reps: "10-12", rest: 60, muscle: "Triceps" },
];

export const LOWER_EXERCISES = [
  { id: "l1", label: "Hip thrust (barre/haltère)", emoji: "🍑", series: 4, reps: "8-12", rest: 90, muscle: "Fessiers" },
  { id: "l2", label: "Soulevé de terre roumain", emoji: "🏋️", series: 4, reps: "8-10", rest: 90, muscle: "Ischio-jambiers" },
  { id: "l3", label: "Nordic curl (ou excentrique)", emoji: "🦵", series: 3, reps: "5-8", rest: 90, muscle: "Ischio-jambiers" },
  { id: "l4", label: "Fentes bulgares", emoji: "🏃", series: 3, reps: "10-12/jambe", rest: 75, muscle: "Quadriceps" },
  { id: "l5", label: "Leg extension", emoji: "🦿", series: 3, reps: "12-15", rest: 60, muscle: "Quadriceps" },
  { id: "l6", label: "Mollets debout", emoji: "🦶", series: 3, reps: "15-20", rest: 45, muscle: "Mollets" },
  { id: "l7", label: "Dead bug", emoji: "🪲", series: 3, reps: "8/côté", rest: 30, muscle: "Core" },
  { id: "l8", label: "Planche RKC", emoji: "🧱", series: 2, reps: "20-30s", rest: 30, muscle: "Core" },
];

export const CARDIO_OPTIONS = [
  { id: "velo", label: "Vélo", emoji: "🚴", duration: "30-40 min", info: "Zone 2 (130-150 bpm)" },
  { id: "course", label: "Course", emoji: "🏃", duration: "30-40 min", info: "Allure confort, conversation possible" },
  { id: "rameur", label: "Rameur", emoji: "🚣", duration: "30-40 min", info: "Cadence régulière, technique prioritaire" },
];

export const FORBIDDEN_EXERCISES = ["Crunchs", "Sit-ups", "Superman", "Relevés de buste"];

// Progression 16 semaines
export const PROGRESSION_PHASES = [
  { weeks: "1-4", label: "Adaptation", desc: "Apprentissage technique, charges légères, 2-3 RIR", color: "#4a90d9" },
  { weeks: "5-8", label: "Construction", desc: "Augmentation progressive des charges, 1-2 RIR", color: "#4caf50" },
  { weeks: "9-12", label: "Intensification", desc: "Charges lourdes, 0-1 RIR, techniques d'intensification", color: "#ff9800" },
  { weeks: "13-16", label: "Peaking", desc: "PRs, deload semaine 16, bilan final", color: "#e94560" },
];

export const SPORT1_DAYS = {
  1: { type: "upper", label: "Upper Body A", emoji: "💪", subtitle: "Push/Pull supersets" },
  2: { type: "lower", label: "Lower Body A", emoji: "🦵", subtitle: "Fessiers & ischio focus" },
  3: { type: "cardio", label: "Cardio", emoji: "🚴", subtitle: "Zone 2 — 30-40 min" },
  4: { type: "upper", label: "Upper Body B", emoji: "💪", subtitle: "Push/Pull supersets" },
  5: { type: "lower", label: "Lower Body B", emoji: "🦵", subtitle: "Quadriceps & core focus" },
  6: { type: "cardio", label: "Cardio / Repos", emoji: "🏃", subtitle: "Optionnel — récupération active" },
  0: { type: "rest", label: "Repos", emoji: "🧘", subtitle: "Récupération complète" },
};
