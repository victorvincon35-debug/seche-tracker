// Programme Muscu LMV — Lundi Mercredi Vendredi (même séance)

export const LMV_DAYS = {
  1: { type: "muscu", label: "MUSCU LMV", emoji: "💪", subtitle: "Séance complète" },
  2: { type: "rest", label: "Repos", emoji: "🧘", subtitle: "Récupération" },
  3: { type: "muscu", label: "MUSCU LMV", emoji: "💪", subtitle: "Séance complète" },
  4: { type: "rest", label: "Repos", emoji: "🧘", subtitle: "Récupération" },
  5: { type: "muscu", label: "MUSCU LMV", emoji: "💪", subtitle: "Séance complète" },
  6: { type: "rest", label: "Repos", emoji: "🧘", subtitle: "Récupération" },
  0: { type: "rest", label: "Repos", emoji: "🧘", subtitle: "Récupération" },
};

// Échauffement — Haltère léger curl enchaîné sans pause
export const WARMUP_HALTERE = [
  { id: "wlmv_biceps_curl", label: "Biceps curl", emoji: "💪", reps: "10 reps" },
  { id: "wlmv_curl_inverse", label: "Curl inversé (reverse curl)", emoji: "🔄", reps: "10 reps" },
  { id: "wlmv_curl_brachial", label: "Curl brachial (hammer curl)", emoji: "🔨", reps: "10 reps" },
  { id: "wlmv_elev_lat", label: "Élévation latérale", emoji: "🦅", reps: "10 reps" },
  { id: "wlmv_oiseau", label: "Oiseau (rear delt fly)", emoji: "🐦", reps: "10 reps" },
  { id: "wlmv_traction_elast", label: "Traction élastique", emoji: "🔴", reps: "10 reps" },
];

// Échauffement — Bâton + Élastique
export const WARMUP_BATON = [
  { id: "wlmv_baton", label: "Bâton (rotations, passes par-dessus)", emoji: "🏒", reps: "15 reps" },
  { id: "wlmv_elastique", label: "Élastique (pull-apart, dislocations)", emoji: "🔴", reps: "15 reps" },
];

// Échauffement — Articulations
export const WARMUP_ARTIC = [
  { id: "wlmv_epaules", label: "Épaules", emoji: "🔄", reps: "15 tours" },
  { id: "wlmv_nuque", label: "Nuque", emoji: "🔄", reps: "15 tours" },
  { id: "wlmv_poignets", label: "Poignets", emoji: "🔄", reps: "15 tours" },
  { id: "wlmv_coudes", label: "Coudes", emoji: "🔄", reps: "15 tours" },
  { id: "wlmv_genoux", label: "Genoux", emoji: "🔄", reps: "15 tours" },
  { id: "wlmv_hanches", label: "Hanches", emoji: "🔄", reps: "15 tours" },
];

// Exercices principaux
export const LMV_EXERCISES = [
  {
    id: "lmv_dev_decline", label: "Développé décliné", emoji: "🏋️",
    defaultSets: [
      { weight: "50", reps: "10", note: "Série 1" },
      { weight: "70", reps: "7", note: "Série 2" },
      { weight: "90", reps: "3", note: "Série 3" },
    ],
    objectif: "6-10 reps",
    rest: 90,
    notes: "Montée progressive, pousse à fond sur la dernière série",
  },
  {
    id: "lmv_dips", label: "Dips", emoji: "⬇️",
    defaultSets: [
      { weight: "0", reps: "6", note: "Échauffement à vide, lentes" },
      { weight: "0", reps: "0", note: "À l'échec" },
    ],
    objectif: "6-10 reps",
    rest: 90,
    notes: "Se pencher en avant. Descendre un poil plus que 90°, pas plus.",
  },
  {
    id: "lmv_tractions", label: "Tractions", emoji: "🔝",
    defaultSets: [
      { weight: "0", reps: "0", note: "" },
    ],
    objectif: "6-10 reps",
    rest: 90,
    notes: "Serrer les omoplates, amener la poitrine à la barre, corps gainé",
  },
  {
    id: "lmv_rowing", label: "Rowing", emoji: "🚣",
    defaultSets: [
      { weight: "0", reps: "0", note: "" },
    ],
    objectif: "6-10 reps",
    rest: 90,
    notes: "",
  },
  {
    id: "lmv_elev_lat", label: "Élévations latérales — Reps longues", emoji: "🦅",
    defaultSets: [
      { weight: "0", reps: "0", note: "" },
    ],
    objectif: "12-20 reps",
    rest: 60,
    notes: "",
  },
  {
    id: "lmv_fente_bulgare", label: "Fente bulgare (Smith Machine)", emoji: "🦵",
    defaultSets: [
      { weight: "0", reps: "0", note: "Échauffement poids du corps" },
      { weight: "0", reps: "0", note: "" },
    ],
    objectif: "8-12 reps",
    rest: 90,
    notes: "Grand pas en avant, buste penché, descente profonde",
  },
  {
    id: "lmv_ischio", label: "Ischio-jambiers (leg curl)", emoji: "🦿",
    defaultSets: [
      { weight: "0", reps: "0", note: "" },
    ],
    objectif: "12-20 reps",
    rest: 60,
    notes: "Contrôler la descente",
  },
  {
    id: "lmv_mollets", label: "Mollets", emoji: "🦶",
    defaultSets: [
      { weight: "0", reps: "0", note: "" },
    ],
    objectif: "20-30 reps",
    rest: 60,
    notes: "Lent, full range",
  },
];

export const LMV_REST_PRESETS = [
  { label: "1:00", seconds: 60 },
  { label: "1:30", seconds: 90 },
  { label: "2:00", seconds: 120 },
];
