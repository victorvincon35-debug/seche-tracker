// Programme Sport 1 — 16 semaines recomposition corporelle
// Lun=Upper(A), Mar=Lower(B), Mer=Cardio, Jeu=Upper(A), Ven=Lower(B), Sam-Dim=Cardio

// === ÉCHAUFFEMENTS ===

// Échauffement Upper Body (~8 min)
export const WARMUP_UPPER = [
  { id: "wu1", phase: "Cardio léger", label: "Rameur ou vélo", reps: "2 min — RPE 4/10, monter le rythme cardiaque", duration: 120, emoji: "🚣" },
  { id: "wu2", phase: "Mobilité articulaire", label: "Cercles d'épaules avant/arrière", reps: "10 par sens", duration: 30, emoji: "🔄" },
  { id: "wu3", phase: "Mobilité articulaire", label: "Cercles de bras (grands cercles)", reps: "10 par sens", duration: 30, emoji: "💫" },
  { id: "wu4", phase: "Mobilité articulaire", label: "Mobilité poignets", reps: "Cercles 10/sens + 4 pattes doigts avant 10x + doigts vers toi 10x", duration: 45, emoji: "🤲" },
  { id: "wu5", phase: "Mobilité articulaire", label: "Pass-throughs élastique", reps: "10 reps", duration: 30, emoji: "🎯" },
  { id: "wu6", phase: "Mobilité articulaire", label: "Rotations externes élastique coude au corps", reps: "10/côté", duration: 35, emoji: "🔴" },
  { id: "wu7", phase: "Mobilité articulaire", label: "Dislocations d'épaules élastique", reps: "10 reps", duration: 25, emoji: "🏹" },
  { id: "wu8", phase: "Activation musculaire", label: "Pompes lentes", reps: "8-10 reps", duration: 40, emoji: "💪" },
  { id: "wu9", phase: "Activation musculaire", label: "Band pull-aparts", reps: "15 reps", duration: 30, emoji: "🔴" },
  { id: "wu10", phase: "Activation musculaire", label: "Rotations de buste", reps: "10 par côté", duration: 30, emoji: "🔄" },
  { id: "wu11", phase: "Montée progressive", label: "Dév. incliné à 40%, 60%, 80%", reps: "2-3 séries × 5-6 reps — pas à l'échec", duration: 150, emoji: "📈" },
];

// Échauffement Lower Body (~8 min)
export const WARMUP_LOWER = [
  { id: "wl1", phase: "Cardio léger", label: "Rameur ou vélo", reps: "2 min — RPE 4/10", duration: 120, emoji: "🚣" },
  { id: "wl2", phase: "Mobilité articulaire", label: "Cercles de hanches", reps: "10 par sens par côté", duration: 35, emoji: "🔄" },
  { id: "wl3", phase: "Mobilité articulaire", label: "Balanciers jambe avant/arrière", reps: "10 par jambe", duration: 30, emoji: "🦵" },
  { id: "wl4", phase: "Mobilité articulaire", label: "Balanciers jambe gauche/droite", reps: "10 par jambe", duration: 30, emoji: "🦿" },
  { id: "wl5", phase: "Mobilité articulaire", label: "Squats profonds sans poids", reps: "10 reps, descendre lentement, hold 2s en bas", duration: 45, emoji: "🏋️" },
  { id: "wl6", phase: "Mobilité articulaire", label: "Fentes marchées sans poids", reps: "5 par jambe", duration: 30, emoji: "🏃" },
  { id: "wl7", phase: "Mobilité articulaire", label: "Mobilité chevilles (genou au mur)", reps: "10 par côté", duration: 30, emoji: "🦶" },
  { id: "wl8", phase: "Activation musculaire", label: "Glute bridges", reps: "15 reps, squeeze 2s en haut", duration: 45, emoji: "🍑" },
  { id: "wl9", phase: "Activation musculaire", label: "Clamshells", reps: "10/côté", duration: 40, emoji: "🐚" },
  { id: "wl10", phase: "Activation musculaire", label: "Bodyweight RDL (1 jambe)", reps: "8 par jambe", duration: 45, emoji: "🦩" },
  { id: "wl11", phase: "Montée progressive", label: "Hip thrust à 40%, 60%, 80%", reps: "2-3 séries × 5-6 reps — pas à l'échec", duration: 150, emoji: "📈" },
];

// Échauffement Cardio (~3 min)
export const WARMUP_CARDIO = [
  { id: "wc_velo", phase: "Échauffement", label: "Vélo : 3 min résistance très basse", reps: "Monter progressivement", duration: 180, emoji: "🚴" },
  { id: "wc_course", phase: "Échauffement", label: "Course : 3 min marche rapide → foulées", reps: "Marche → petites foulées → croisière", duration: 180, emoji: "🏃" },
  { id: "wc_rameur", phase: "Échauffement", label: "Rameur : 3 min 16-18 coups/min", reps: "Résistance basse, monter progressivement", duration: 180, emoji: "🚣" },
];

// === JOUR A — UPPER BODY ===
// Tempo: descente ~2s contrôlée, remontée explosive. RIR 1-2.
// Supersets antagonistes: enchaîne 2 exos, 20-30s transition, repos après le couple.

export const UPPER_EXERCISES = [
  // SUPERSET 1 — Poussée/Tirage lourd — 3 tours (~9 min)
  {
    id: "u1", label: "Dév. incliné haltères (30°)", emoji: "🏋️",
    series: 3, reps: "6-8", rest: 90, transition: 25,
    superset: "u2", groupLabel: "SUPERSET 1 — Poussée/Tirage lourd",
    muscle: "Haut des pecs",
    notes: "Banc 30° max. Prise neutre ou semi-pro selon poignets. Descente étirement pecs, remontée explosive.",
  },
  {
    id: "u2", label: "Tractions pronation", emoji: "🔝",
    series: 3, reps: "6-8", rest: 90,
    muscle: "Dos largeur",
    notes: "Prise pronation largeur épaules+. Tirer POITRINE vers barre, pas menton. Élastique ou négatives si besoin.",
  },
  // SUPERSET 2 — Poussée/Tirage modéré — 3 tours (~8 min)
  {
    id: "u3", label: "Dév. couché haltères (plat)", emoji: "💪",
    series: 3, reps: "8-10", rest: 75, transition: 25,
    superset: "u4", groupLabel: "SUPERSET 2 — Poussée/Tirage modéré",
    muscle: "Milieu/bas pecs + triceps",
    notes: "Omoplates serrées et enfoncées dans le banc.",
  },
  {
    id: "u4", label: "Rowing inversé", emoji: "🚣",
    series: 3, reps: "8-12", rest: 75,
    muscle: "Dos épaisseur + gainage transverse",
    notes: "Corps en planche. Progresser : pieds sol → surélevés → gilet lesté.",
  },
  // SUPERSET 3 — Épaules 3D — 3 tours (~5 min)
  {
    id: "u5", label: "Élévations latérales", emoji: "🦅",
    series: 3, reps: "12-15", rest: 45, transition: 20,
    superset: "u6", groupLabel: "SUPERSET 3 — Épaules 3D",
    muscle: "Deltoïde latéral",
    notes: "6-10 kg, pas d'élan. Coudes légèrement fléchis, rotation comme verser une bouteille.",
  },
  {
    id: "u6", label: "Face pulls (poulie, corde)", emoji: "🔴",
    series: 3, reps: "12-15", rest: 45,
    muscle: "Deltoïde postérieur + rotateurs",
    notes: "Poulie haute, tirer vers visage, écarter mains, coudes hauts. Squeeze 1s.",
  },
  // SUPERSET 4 — Bras finition — 2 tours (~4 min)
  {
    id: "u7", label: "Curl biceps haltères", emoji: "💪",
    series: 2, reps: "10-12", rest: 45, transition: 20,
    superset: "u8", groupLabel: "SUPERSET 4 — Bras finition",
    muscle: "Biceps",
    notes: "Excentrique 2-3s.",
  },
  {
    id: "u8", label: "Extension triceps poulie", emoji: "🔱",
    series: 2, reps: "10-12", rest: 45,
    muscle: "Triceps",
    notes: "Corde ou barre. Échec autorisé.",
  },
];

// === JOUR B — LOWER BODY ===
// Fessiers/ischios prioritaires, psoas non sur-sollicité, abdos profonds ciblés.

export const LOWER_EXERCISES = [
  // SUPERSET 1 — Fessiers/Ischios lourd — 3 tours (~9 min)
  {
    id: "l1", label: "Hip thrust (barre)", emoji: "🍑",
    series: 3, reps: "8-10", rest: 90, transition: 25,
    superset: "l2", groupLabel: "SUPERSET 1 — Fessiers/Ischios lourd",
    muscle: "Fessiers",
    notes: "Squeeze fessiers MAX 1-2s + rétroversion en haut. NE PAS cambrer. 40-50 kg départ → 85-100 kg objectif.",
  },
  {
    id: "l2", label: "Soulevé de terre roumain", emoji: "🏋️",
    series: 3, reps: "8-10", rest: 90,
    muscle: "Ischios + fessiers",
    notes: "Jambes quasi tendues. Rétroversion active en haut à chaque rep.",
  },
  // BLOC SOLO — Nordic hamstring curl — 3 séries (~6 min)
  {
    id: "l3", label: "Nordic hamstring curl", emoji: "🦵",
    series: 3, reps: "4-8", rest: 90,
    groupLabel: "BLOC SOLO — Nordic hamstring curl",
    muscle: "Ischio-jambiers",
    notes: "Poids de corps excentrique. Début : négatives 4-5s, rattraper avec mains.",
  },
  // SUPERSET 3 — Quads/Fessiers — 3 tours (~8 min)
  {
    id: "l4", label: "Fentes bulgares (haltères)", emoji: "🏃",
    series: 3, reps: "10-12/jambe", rest: 60, transition: 25,
    superset: "l5", groupLabel: "SUPERSET 3 — Quads/Fessiers",
    muscle: "Fessiers + quads",
    notes: "Buste penché, pied avant loin, poussée du talon = fessiers.",
  },
  {
    id: "l5", label: "Leg extension (machine)", emoji: "🦿",
    series: 3, reps: "10-12", rest: 60,
    muscle: "Quadriceps",
    notes: "Isolation quad. ZÉRO psoas. Extension complète, descente 2s.",
  },
  // MOLLETS — 3 séries droites (~4 min)
  {
    id: "l6", label: "Mollets debout (machine)", emoji: "🦶",
    series: 3, reps: "12-15", rest: 60,
    groupLabel: "MOLLETS — Séries droites",
    muscle: "Mollets",
    notes: "Amplitude COMPLÈTE. Pause 1s haut ET bas.",
  },
  // SUPERSET 4 — Core anti-antéversion — 3 tours (~4 min)
  {
    id: "l7", label: "Dead bug (régressé)", emoji: "🪲",
    series: 3, reps: "8/côté", rest: 30, transition: 15,
    superset: "l8", groupLabel: "SUPERSET 4 — Core anti-antéversion",
    muscle: "Core (transverse)",
    notes: "Dos COLLÉ au sol. Expirer à fond. Si dos décolle = STOP, régresser.",
  },
  {
    id: "l8", label: "Planche RKC", emoji: "🧱",
    series: 3, reps: "20-30s", rest: 30,
    muscle: "Core profond",
    notes: "Fessiers serrés MAX = rétroversion. 100% contracté. 20-30s bien fait >> 2 min molle.",
  },
];

// === CARDIO TRANQUILLE — 3x/semaine (Mer, Sam, Dim) ===

export const CARDIO_OPTIONS = [
  { id: "velo", label: "Vélo en salle", emoji: "🚴", duration: "30-40 min", info: "Zéro impact, idéal récup jambes. Pédalage continu, résistance légère." },
  { id: "course", label: "Course à pied", emoji: "🏃", duration: "30 min", info: "Jogging léger, rythme où tu peux parler. Dehors = soleil = vitamine D." },
  { id: "rameur", label: "Rameur", emoji: "🚣", duration: "30-40 min", info: "20-22 coups/min. Renforce chaîne postérieure." },
];

export const CARDIO_RULES = "Zone 2 · RPE 4-5/10 · FC 120-135 bpm";

// === EXERCICES INTERDITS ===

export const FORBIDDEN_EXERCISES = [
  { exercise: "Relevés de genoux", reason: "Travaille le PSOAS, aggrave l'antéversion", resume: "Mois 3-4" },
  { exercise: "Crunchs classiques", reason: "Compriment disques lombaires", resume: "Mois 3-4" },
  { exercise: "Sit-ups", reason: "Psoas + compression lombaire max", resume: "Mois 4+" },
  { exercise: "Superman/extensions", reason: "Dos déjà en extension, renforce mauvais schéma", resume: "Mois 3-4" },
];

// === PROGRESSION 16 SEMAINES ===

export const PROGRESSION_PHASES = [
  { weeks: "1-4", label: "Adaptation", desc: "Apprentissage technique, charges légères, 2-3 RIR", color: "#4a90d9" },
  { weeks: "5-8", label: "Construction", desc: "Augmentation progressive des charges, 1-2 RIR", color: "#4caf50" },
  { weeks: "9-12", label: "Intensification", desc: "Charges lourdes, 0-1 RIR, techniques d'intensification", color: "#ff9800" },
  { weeks: "13-16", label: "Peaking", desc: "PRs, deload semaine 16, bilan final", color: "#e94560" },
];

export const PROGRESSION_TABLE = [
  { exercise: "Dév. incliné haltères", phases: ["12-14 kg", "16-18 kg", "20-22 kg", "24-28 kg"] },
  { exercise: "Dév. couché haltères", phases: ["14-16 kg", "18-20 kg", "22-24 kg", "26-30 kg"] },
  { exercise: "Tractions (reps PdC)", phases: ["3×4-5", "3×6-7", "3×8-9", "3×10 → lestées"] },
  { exercise: "Rowing inversé", phases: ["Pieds sol", "Facile", "Pieds surélevés", "Gilet lesté"] },
  { exercise: "Hip thrust", phases: ["40-50 kg", "55-65 kg", "70-80 kg", "85-100 kg"] },
  { exercise: "Soulevé terre roumain", phases: ["40-50 kg", "55-65 kg", "70-80 kg", "85-100 kg"] },
  { exercise: "Nordic curl", phases: ["3×3-4 neg", "3×4-5", "3×5-6", "3×6-8"] },
  { exercise: "Fentes bulgares", phases: ["8-10 kg", "12-14 kg", "16-18 kg", "20-24 kg"] },
];

// === JOURS DE LA SEMAINE ===

export const SPORT1_DAYS = {
  1: { type: "upper", label: "Jour A — Upper Body", emoji: "💪", subtitle: "Push/Pull supersets — ~35 min" },
  2: { type: "lower", label: "Jour B — Lower Body", emoji: "🦵", subtitle: "Fessiers & ischios focus — ~40 min" },
  3: { type: "cardio", label: "Cardio Tranquille", emoji: "🚴", subtitle: "Zone 2 — 30-40 min" },
  4: { type: "upper", label: "Jour A — Upper Body", emoji: "💪", subtitle: "Push/Pull supersets — ~35 min" },
  5: { type: "lower", label: "Jour B — Lower Body", emoji: "🦵", subtitle: "Fessiers & ischios focus — ~40 min" },
  6: { type: "cardio", label: "Cardio Tranquille", emoji: "🏃", subtitle: "Zone 2 — 30-40 min" },
  0: { type: "cardio", label: "Cardio Tranquille", emoji: "🏃", subtitle: "Zone 2 — 30-40 min" },
};
