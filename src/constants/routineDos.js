// Programme correction posturale — Onglet Dos
// Séance principale (15-20 min) + Micro-routines (3-5 min toutes les 2h)

// === SÉANCE PRINCIPALE — Correction posturale ===
// À faire TOUS LES JOURS avant la séance de sport OU seule les jours de repos.

export const SEANCE_PRINCIPALE = [
  // PHASE 1 — MOBILISATION (3 min)
  {
    id: "sp1", phase: "Mobilisation", phaseNum: 1, phaseDuration: "3 min",
    label: "Dos creux / Dos rond (Cat-Cow)", emoji: "🐱",
    execution: "À quatre pattes. Inspire : creuse le dos. Expire : arrondis au max, rentre le menton. Lent, sens chaque vertèbre.",
    progression: [
      { weeks: "1-4", volume: "2×12" },
      { weeks: "5-8", volume: "2×15" },
      { weeks: "9+", volume: "2×15 + pause 3s en dos rond" },
    ],
    duration: 60,
  },
  {
    id: "sp2", phase: "Mobilisation", phaseNum: 1, phaseDuration: "3 min",
    label: "Bascule du bassin (debout)", emoji: "🧍",
    execution: "Debout, pieds largeur épaules. Alterne creuser/arrondir le bas du dos. Apprends à contrôler ton bassin.",
    progression: [
      { weeks: "1-4", volume: "2×10" },
      { weeks: "5-8", volume: "2×15" },
      { weeks: "9+", volume: "yeux fermés" },
    ],
    duration: 50,
  },

  // PHASE 2 — ÉTIREMENTS (5 min)
  {
    id: "sp3", phase: "Étirements", phaseNum: 2, phaseDuration: "5 min",
    label: "Étirement psoas (fente au sol)", emoji: "🦵",
    execution: "Genou arrière au sol. SERRE les fesses côté arrière, pousse le bassin vers l'avant. Ne cambre pas le dos.",
    progression: [
      { weeks: "1-4", volume: "2×45s chaque côté" },
      { weeks: "5-8", volume: "2×60s chaque côté" },
      { weeks: "9+", volume: "2×60s + bras levé côté arrière" },
    ],
    duration: 90,
  },
  {
    id: "sp4", phase: "Étirements", phaseNum: 2, phaseDuration: "5 min",
    label: "Étirement quad (debout ou au sol)", emoji: "🦿",
    execution: "Attrape ton pied, tire vers la fesse. Serre la fesse pendant l'étirement. Tiens-toi au mur si besoin.",
    progression: [
      { weeks: "1-4", volume: "2×30s debout" },
      { weeks: "5-8", volume: "2×45s" },
      { weeks: "9+", volume: "au sol (couch stretch)" },
    ],
    duration: 60,
  },
  {
    id: "sp5", phase: "Étirements", phaseNum: 2, phaseDuration: "5 min",
    label: "Posture de l'enfant (child's pose)", emoji: "🙏",
    execution: "À genoux, assieds-toi sur tes talons, bras tendus devant. Relâche le bas du dos. Respire dans le ventre.",
    progression: [
      { weeks: "1-8", volume: "1×45s" },
      { weeks: "9+", volume: "1×45s + pigeon stretch 2×45s/côté" },
    ],
    duration: 45,
  },

  // PHASE 3 — RENFORCEMENT (8-10 min)
  {
    id: "sp6", phase: "Renforcement", phaseNum: 3, phaseDuration: "8-10 min",
    label: "Fausse pompe (prone press-up)", emoji: "🐍",
    execution: "Face au sol, TOUT le corps touche le sol. Seuls les bras poussent. Le bas du corps ne décolle JAMAIS. Tiens 2s en haut.",
    progression: [
      { weeks: "1-4", volume: "2×10" },
      { weeks: "5-8", volume: "2×12" },
      { weeks: "9+", volume: "3×12 + hold 5s en haut" },
    ],
    duration: 50,
  },
  {
    id: "sp7", phase: "Renforcement", phaseNum: 3, phaseDuration: "8-10 min",
    label: "Dead bug", emoji: "🪲",
    execution: "Allongé, bras vers le plafond, genoux à 90°. Tends bras + jambe opposée. Bas du dos COLLÉ au sol. ZÉRO espace.",
    progression: [
      { weeks: "1-4", volume: "3×8 genoux pliés" },
      { weeks: "5-8", volume: "3×10 jambes tendues" },
      { weeks: "9+", volume: "3×10 + élastique" },
    ],
    duration: 60,
  },
  {
    id: "sp8", phase: "Renforcement", phaseNum: 3, phaseDuration: "8-10 min",
    label: "Pont fessier (hip thrust au sol)", emoji: "🍑",
    execution: "Pieds au sol, genoux fléchis. Pousse hanches vers le plafond. SERRE fesses au max, tiens 2s. Dernière rep : hold 10s.",
    progression: [
      { weeks: "1-4", volume: "3×15 au sol" },
      { weeks: "5-8", volume: "3×12 UNILATÉRAL" },
      { weeks: "9+", volume: "3×12 unilat + haltère" },
    ],
    duration: 70,
  },
  {
    id: "sp9", phase: "Renforcement", phaseNum: 3, phaseDuration: "8-10 min",
    label: "Planche coudes", emoji: "🧱",
    execution: "Rétroverse le bassin. Dos PLAT ou légèrement arrondi. JAMAIS le dos creux. Mieux vaut 20s bien fait que 60s dos creux.",
    progression: [
      { weeks: "1-4", volume: "2×30s" },
      { weeks: "5-8", volume: "2×45s" },
      { weeks: "9+", volume: "2×60s ou planche lestée" },
    ],
    duration: 60,
  },
  {
    id: "sp10", phase: "Renforcement", phaseNum: 3, phaseDuration: "8-10 min",
    label: "Bird dog", emoji: "🐕",
    execution: "À quatre pattes. Tends bras droit + jambe gauche. Tiens 3s. Le dos ne bouge PAS.",
    progression: [
      { weeks: "1-4", volume: "2×8 (hold 3s)" },
      { weeks: "5-8", volume: "3×10 (hold 5s)" },
      { weeks: "9+", volume: "3×10 + élastique" },
    ],
    duration: 50,
  },
];

// === MICRO-ROUTINES — Pauses travail (3-5 min toutes les 2h) ===
// Alterner A → B → C → A → B → C au fil des pauses.

export const MICRO_ROUTINES = [
  {
    id: "A",
    label: "Routine A — Étirement express",
    emoji: "🔵",
    color: "#4a90d9",
    duration: "3 min",
    exercises: [
      { id: "ma1", label: "Étirement psoas debout (fente avant)", reps: "30s chaque côté", detail: "Grand pas en avant, serre la fesse arrière, pousse le bassin en avant", duration: 60, emoji: "🦵" },
      { id: "ma2", label: "Étirement quad debout", reps: "30s chaque côté", detail: "Attrape ton pied, tire vers la fesse, serre la fesse, bassin neutre", duration: 60, emoji: "🦿" },
      { id: "ma3", label: "Bascule du bassin debout", reps: "10 reps", detail: "Alterne antéversion/rétroversion lentement", duration: 40, emoji: "🧍" },
    ],
  },
  {
    id: "B",
    label: "Routine B — Activation fessiers",
    emoji: "🟢",
    color: "#4caf50",
    duration: "3 min",
    exercises: [
      { id: "mb1", label: "Squeezes fessiers debout", reps: "3×10 (hold 5s)", detail: "Serre les fesses AU MAXIMUM 5s", duration: 60, emoji: "🍑" },
      { id: "mb2", label: "Fire hydrant (ou abductions debout)", reps: "10 chaque côté", detail: "Lève la jambe sur le côté. Active le moyen fessier", duration: 50, emoji: "🔥" },
      { id: "mb3", label: "Pont fessier rapide", reps: "15 reps", detail: "Au sol si possible", duration: 40, emoji: "🌉" },
    ],
  },
  {
    id: "C",
    label: "Routine C — Gainage postural",
    emoji: "🟠",
    color: "#ff9800",
    duration: "4 min",
    exercises: [
      { id: "mc1", label: "Planche sur coudes", reps: "30-45s", detail: "Bassin rétroversé, dos plat. JAMAIS dos creux", duration: 45, emoji: "🧱" },
      { id: "mc2", label: "Planche latérale", reps: "20-30s chaque côté", detail: "Corps aligné. Obliques + carré des lombes", duration: 60, emoji: "📐" },
      { id: "mc3", label: "Dos creux / Dos rond", reps: "10 reps", detail: "Remobilise la colonne pour finir", duration: 40, emoji: "🐱" },
    ],
  },
];

// Exercices INTERDITS
export const FORBIDDEN_EXERCISES = [
  "Crunchs",
  "Relevés de genoux (hanging knee raises)",
  "Sit-ups",
  "Superman (extension lombaire complète)",
];

// Timeline de progression
export const PROGRESSION_TIMELINE = [
  { weeks: "1-2", label: "Semaines 1-2", desc: "Apprentissage des mouvements. Priorité = qualité d'exécution. Ne force pas.", color: "#4a90d9" },
  { weeks: "3-4", label: "Semaines 3-4", desc: "Les exercices deviennent naturels. Augmente les volumes (reps/durées).", color: "#4a90d9" },
  { weeks: "5-8", label: "Mois 2", desc: "Progression automatique : volumes augmentés, variantes plus dures.", color: "#4caf50" },
  { weeks: "9-16", label: "Mois 3-4", desc: "Variantes avancées, unilatéral, ajout de résistance (élastique/haltère).", color: "#ff9800" },
  { weeks: "17+", label: "Mois 6+", desc: "Maintien. 3-4 séances/semaine suffisent. Focus performance sportive.", color: "#e94560" },
];

// Objectif quotidien de micro-routines
export const DAILY_TARGET = 4;
