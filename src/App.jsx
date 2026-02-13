import { useState, useEffect, useCallback, useRef, Fragment } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area } from "recharts";
import { supabase, storage, syncOnLoad, debouncedPush } from "./supabase.js";

const STORAGE_KEY = "seche-tracker-v5";
const START_DATE = "2026-02-23";
const TOTAL_DAYS = 30;

const CITIES = [
  { name: "Paris", emoji: "🗼", min: 0, x: 20, y: 18 },
  { name: "Lyon", emoji: "🦁", min: 800, x: 28, y: 38 },
  { name: "Marseille", emoji: "⛵", min: 1600, x: 32, y: 58 },
  { name: "Nice", emoji: "🌴", min: 2400, x: 44, y: 62 },
  { name: "Gênes", emoji: "⚓", min: 3200, x: 55, y: 55 },
  { name: "Florence", emoji: "🎨", min: 4200, x: 62, y: 48 },
  { name: "Rome", emoji: "🏛️", min: 5500, x: 68, y: 62 },
];

const AVATAR_STAGES = [
  { min: 0, label: "Skinny Fat", bodyWidth: 42, armWidth: 8, chestWidth: 40, legWidth: 14, sixpack: 0, color: "#e8b89d", shorts: "#666" },
  { min: 800, label: "Début", bodyWidth: 40, armWidth: 9, chestWidth: 42, legWidth: 15, sixpack: 0, color: "#e0a88a", shorts: "#555" },
  { min: 1600, label: "En forme", bodyWidth: 38, armWidth: 11, chestWidth: 44, legWidth: 16, sixpack: 2, color: "#d49a7a", shorts: "#444" },
  { min: 2400, label: "Athlétique", bodyWidth: 36, armWidth: 13, chestWidth: 48, legWidth: 17, sixpack: 4, color: "#c88a6a", shorts: "#333" },
  { min: 3200, label: "Warrior", bodyWidth: 33, armWidth: 15, chestWidth: 50, legWidth: 18, sixpack: 6, color: "#bc7a5a", shorts: "#e94560" },
  { min: 4200, label: "Spartan", bodyWidth: 30, armWidth: 17, chestWidth: 54, legWidth: 19, sixpack: 6, color: "#b06a4a", shorts: "#c23152" },
  { min: 5500, label: "Titan 🇮🇹", bodyWidth: 28, armWidth: 19, chestWidth: 58, legWidth: 20, sixpack: 6, color: "#a05a3a", shorts: "#ffeb3b" },
];

const WEEKLY_REWARDS = [
  { week: 1, emoji: "🍦", title: "Gelato à Rome", desc: "Un gelato artisanal pour 2 dans le Trastevere", category: "food" },
  { week: 2, emoji: "🍝", title: "Restaurant Carbonara", desc: "Un vrai restaurant de carbonara romaine authentique", category: "food" },
  { week: 3, emoji: "🎨", title: "Visite des Offices", desc: "Entrée au musée des Offices à Florence", category: "culture" },
  { week: 4, emoji: "🌹", title: "Nuit Romantique", desc: "Soirée romantique avec vue sur le Colisée", category: "love" },
];

const HABITS = [
  { id: "respiration", label: "Respiration / CO2", emoji: "🫁", xp: 15 },
  { id: "meditation", label: "Méditation", emoji: "🧘", xp: 15 },
  { id: "steps", label: "12 000 pas", emoji: "🚶", xp: 20 },
  { id: "sport", label: "Sport 1h", emoji: "🏋️", xp: 30 },
  { id: "souplesse", label: "Souplesse", emoji: "🤸", xp: 15 },
  { id: "journaling", label: "Journaling", emoji: "📓", xp: 10 },
  { id: "rigoler", label: "Rigoler / s'amuser", emoji: "😂", xp: 10 },
  { id: "social", label: "Câlins / liens sociaux", emoji: "🤗", xp: 10 },
  { id: "noir_lire", label: "Noir + lire avant dodo", emoji: "📖", xp: 10 },
  { id: "dodo", label: "Dodo 9h régulier", emoji: "🌙", xp: 20 },
  { id: "psy", label: "Psy (1×/semaine)", emoji: "🧠", xp: 40, weekly: true },
];

const STAGE_DAYS = 30;

const NUTRITION_STAGES = [
  { id: 1, name: "REGAIN D'ÉNERGIE", emoji: "🟢", kcal: 3100, macros: { glucides: "485g", proteines: "130g", lipides: "71g" }, budget: "~15,90€/jour", color: "#4caf50" },
  { id: 2, name: "SÈCHE", emoji: "🔴", kcal: 2130, macros: { glucides: "175g", proteines: "200g", lipides: "70g" }, budget: "~14,63€/jour", color: "#e94560" },
  { id: 3, name: "REGAIN D'ÉNERGIE", emoji: "🟢", kcal: 3100, macros: { glucides: "485g", proteines: "130g", lipides: "71g" }, budget: "~15,90€/jour", color: "#4caf50" },
  { id: 4, name: "SÈCHE", emoji: "🔴", kcal: 2130, macros: { glucides: "175g", proteines: "200g", lipides: "70g" }, budget: "~14,63€/jour", color: "#e94560" },
];

const MEALS_REGAIN = [
  { id: "jo", label: "Jus d'orange 2L", emoji: "🍊", xp: 5 },
  { id: "miel", label: "Miel 200g", emoji: "🍯", xp: 5 },
  { id: "banane", label: "Banane 800g (avec peau)", emoji: "🍌", xp: 5 },
  { id: "boeuf", label: "Bœuf haché 5% — 450g", emoji: "🥩", xp: 10 },
  { id: "oeufs", label: "6 œufs", emoji: "🥚", xp: 5 },
  { id: "collagene", label: "Collagène 45g", emoji: "💪", xp: 10 },
  { id: "beurre", label: "Beurre 15g", emoji: "🧈", xp: 3 },
  { id: "huile_coco", label: "Huile de coco 7ml", emoji: "🥥", xp: 3 },
];

const MEALS_SECHE = [
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
function getMealsForStage(stageNum) { return STAGE_MEALS[stageNum] || MEALS_SECHE; }

const SUPP_TIMING_GROUPS = [
  { id: "reveil", label: "RÉVEIL (à jeun)", emoji: "🌅", color: "#ff9800" },
  { id: "30min", label: "30 MIN APRÈS LE RÉVEIL (jus d'orange, PAS de café/thé)", emoji: "☀️", color: "#ffeb3b" },
  { id: "midi", label: "MIDI (repas avec gras : bœuf + œufs + beurre)", emoji: "🌞", color: "#ffc107" },
  { id: "post_training", label: "POST-ENTRAÎNEMENT", emoji: "💪", color: "#e94560" },
  { id: "collation", label: "COLLATION (après-midi)", emoji: "🍎", color: "#4caf50" },
  { id: "diner", label: "DÎNER", emoji: "🌙", color: "#42a5f5" },
  { id: "avant_dormir", label: "AVANT DORMIR", emoji: "😴", color: "#ab47bc" },
];

const SUPPS_DETAILED = [
  { id: "s_collagene", label: "Collagène Peptan® — 25g (prise 1/2)", emoji: "💊", timing: "reveil", brand: "AM Nutrition 1kg", dosage: "25g", price: 75, info: "Tendons, ligaments, articulations. Peptan® 2000 daltons = absorption max. À jeun pour éviter compétition avec d'autres protéines. La glycine aide aussi au sommeil (prise du soir)." },
  { id: "s_b", label: "Thiavite B-Complex", emoji: "💊", timing: "30min", brand: "Objective Nutrients", dosage: "1-3 gélules", price: 30, info: "Énergie, métabolisme, système nerveux. TTFD = B1 ultra-biodisponible. Éviter café/thé 1h avant ou 2h après." },
  { id: "s_creatine", label: "Créatine Creapure® 5g", emoji: "💊", timing: "30min", brand: "Nutripure 1kg (57,90€)", dosage: "5g", price: 8.70, info: "Force et récupération. Creapure® = pureté 99,95%. Dans le jus d'orange : l'insuline aide le transport." },
  { id: "s_mag_1", label: "Magnésium bisglycinate (1/3)", emoji: "💊", timing: "30min", brand: "Dynveo TRAACS®", dosage: "300mg", price: 30, info: "Anti-stress, sommeil, récupération. Bisglycinate TRAACS® = 4x mieux absorbé que le marin. Fractionné en 3 prises." },
  { id: "s_d3", label: "Vitamine D3 5000 UI", emoji: "💊", timing: "midi", brand: "Dynveo végétale", dosage: "5000 UI", price: 7.45, info: "Immunité, os, hormones. Végétale micro-encapsulée. Avec gras pour absorption max." },
  { id: "s_k2", label: "K2 MK7 300µg", emoji: "💊", timing: "midi", brand: "Dynveo", dosage: "300 µg", price: 30, info: "Fixe le calcium dans les os, pas les artères. Synergie obligatoire avec D3." },
  { id: "s_vite", label: "Vitamine E 300 UI", emoji: "💊", timing: "midi", brand: "Tocophérol naturel", dosage: "300 UI", price: 7.50, info: "Antioxydant, protège les muscles. Tocophérol naturel = 2x mieux retenu que synthétique." },
  { id: "s_calcium_1", label: "Calcium coquille d'œuf (1/2)", emoji: "🥚", timing: "midi", brand: "DIY", dosage: "500mg + vinaigre cidre", price: 2, info: "Os, contraction musculaire. Le vinaigre convertit le carbonate en forme biodisponible. Avec D3+K2 = synergie." },
  { id: "s_mag_2", label: "Magnésium bisglycinate (2/3)", emoji: "💊", timing: "midi", brand: "Dynveo TRAACS®", dosage: "300mg", price: 0, info: "Deuxième tiers de la dose journalière. Réparti pour meilleure tolérance digestive." },
  { id: "s_whey_1", label: "Whey Native Isolate (1/2)", emoji: "💊", timing: "post_training", brand: "Dynveo 1kg (44,90€)", dosage: "40g shake", price: 112, info: "95% protéines natives. Immunoglobulines + lactoferrine préservées. Fenêtre post-training = synthèse protéique max.", secheOnly: true },
  { id: "s_whey_2", label: "Whey Native Isolate (2/2)", emoji: "💊", timing: "collation", brand: "Dynveo", dosage: "40g shake", price: 0, info: "Deuxième shake en collation. Maintien de l'apport protéique en sèche.", secheOnly: true },
  { id: "s_calcium_2", label: "Calcium coquille d'œuf (2/2)", emoji: "🥚", timing: "collation", brand: "DIY", dosage: "500mg + vinaigre cidre", price: 0, info: "Deuxième moitié. Doses séparées pour meilleure absorption." },
  { id: "s_zinc", label: "Zinc bisglycinate 20mg", emoji: "💊", timing: "diner", brand: "Dynveo TRAACS®", dosage: "20mg", price: 5.45, info: "Testostérone, immunité, synthèse protéique. LOIN du calcium (midi) = pas de compétition d'absorption." },
  { id: "s_mag_3", label: "Magnésium bisglycinate (3/3)", emoji: "💊", timing: "diner", brand: "Dynveo TRAACS®", dosage: "300mg", price: 0, info: "Prise du soir : active les récepteurs GABA, prépare au sommeil. Synergie avec collagène + taurine." },
  { id: "s_collagene_2", label: "Collagène Peptan® — 25g (prise 2/2)", emoji: "💊", timing: "avant_dormir", brand: "AM Nutrition 1kg", dosage: "25g", price: 0, info: "Deuxième prise. La glycine du collagène le soir aide au sommeil. Synergie avec magnésium + taurine." },
  { id: "s_taurine", label: "Taurine 2-3g", emoji: "💊", timing: "avant_dormir", brand: "Nutrimuscle poudre", dosage: "2-3g", price: 2.50, info: "Agoniste GABA-A, calme le système nerveux. Synergie avec le magnésium et le collagène du soir." },
];

const SUPPS = SUPPS_DETAILED;

function getSuppsForStage(stageNum) {
  const isRegain = stageNum === 1 || stageNum === 3;
  return isRegain ? SUPPS_DETAILED.filter(s => !s.secheOnly) : SUPPS_DETAILED;
}

function getSuppsGrouped(stageNum) {
  const applicable = getSuppsForStage(stageNum);
  return SUPP_TIMING_GROUPS.map(g => ({ ...g, supps: applicable.filter(s => s.timing === g.id) })).filter(g => g.supps.length > 0);
}

function getSuppsBudget(stageNum) {
  return getSuppsForStage(stageNum).reduce((sum, s) => sum + (s.price || 0), 0);
}

const ABS_CIRCUIT = [
  { id: "abs_gainage", label: "Gainage face + chaque côté", emoji: "🧱", reps: "1min + 30s/côté", image: "abdos-gainage.jpg" },
  { id: "abs_oblique", label: "Oblique de chaque côté", emoji: "🔄", reps: "20 rep/côté", image: "abdos-oblique.jpg" },
  { id: "abs_releve_jambes", label: "Relevé de jambes à la barre", emoji: "🦵", reps: "Max rep", image: "abdos-releve-jambes-barre.jpg" },
  { id: "abs_roulette", label: "Roulette", emoji: "🛞", reps: "Max rep", image: "abdos-roulette.jpg" },
  { id: "abs_crunch", label: "Crunch jambes/bras tendues", emoji: "💪", reps: "10-20 rep", image: "abdos-crunch-jambes-bras-tendues.jpg" },
];

const WARMUP_HDC = [
  { id: "w_coiffe", label: "Coiffe des rotateurs", emoji: "🔄", reps: "20 rep de chaque", image: "echauff-hdc-coiffe-rotateurs.jpg" },
  { id: "w_mobilite_epaule", label: "Mobilité épaule élastique", emoji: "🔴", reps: "10 rep", image: "echauff-hdc-mobilite-epaule.jpg" },
  { id: "w_rotation_epaule", label: "Rotation circulaire épaule", emoji: "🔁", reps: "20 de chaque (avant/arrière)", image: "echauff-hdc-rotation-circulaire-epaule.jpg" },
  { id: "w_pompes_surel", label: "Pompes mains surélevées", emoji: "🫸", reps: "10-20 rep", image: "echauff-hdc-pompes-mains-surelevees.jpg" },
  { id: "w_aust_pronation", label: "Tractions australiennes pronation", emoji: "🇦🇺", reps: "10-20 rep", image: "echauff-hdc-tractions-australiennes-pronation.jpg" },
];

const WARMUP_BDC = [
  { id: "w_circulaire_bassin", label: "Mouvement circulaire bassin", emoji: "🔄", reps: "10 dans chaque sens", image: "echauff-bdc-mouvement-circulaire-bassin.jpg" },
  { id: "w_jambe_barriere", label: "Mouvement jambe contre barrière", emoji: "🦵", reps: "10 de chaque", image: "echauff-bdc-mouvement-jambe-barriere.jpg" },
  { id: "w_balancement", label: "Balancement de jambe", emoji: "🦿", reps: "10 de chaque", image: "echauff-bdc-balancement-jambe.jpg" },
  { id: "w_squat_iso", label: "Squat isométrique", emoji: "🧱", reps: "30 sec", image: "echauff-bdc-squat-isometrique.jpg" },
];

const SPORT_DAYS = {
  1: {
    id: "push", type: "muscu", label: "PUSH", subtitle: "Pec, Épaules, Triceps", emoji: "🏋️", hasAbsCircuit: true, warmup: "hdc",
    exercises: [
      { id: "push_t1a", label: "Muscle Up", emoji: "🔝", series: 5, reps: "5-10", rest: 90, superset: "push_t1b", image: "push-muscle-up.jpg" },
      { id: "push_t1b", label: "Dips Barre Parallèle", emoji: "⬇️", series: 5, reps: "10-20", rest: 90, superset: "push_t1c", image: "push-dips-barre-parallele.jpg" },
      { id: "push_t1c", label: "Pompes Classique", emoji: "🫸", series: 5, reps: "10-20", rest: 90, image: "push-pompes-classique.jpg" },
      { id: "push_t2a", label: "Dips Barre + Blocage Iso 90°", emoji: "⏸️", series: 5, reps: "15-20 + 15-20s", rest: 90, superset: "push_t2b", image: "push-dips-barre-blocage-isometrique.jpg" },
      { id: "push_t2b", label: "Élévation Frontale Élastique", emoji: "🔴", series: 5, reps: "15-20", rest: 90, image: "push-elevation-frontale-elastique.jpg" },
      { id: "push_t3a", label: "Dips Épaules Blocage 90° + Explosif", emoji: "💥", series: 5, reps: "15s + 15-20", rest: 90, superset: "push_t3b", image: "push-dips-epaules-blocage-explosif.jpg" },
      { id: "push_t3b", label: "Pompes Pieds Surélevées", emoji: "⬆️", series: 5, reps: "15-20", rest: 90, image: "push-pompes-pieds-surelevees.jpg" },
      { id: "push_t4a", label: "Barre au Front", emoji: "💪", series: 5, reps: "12", rest: 90, superset: "push_t4b", image: "push-barre-au-front.jpg" },
      { id: "push_t4b", label: "Dips sur Banc", emoji: "🪑", series: 5, reps: "15", rest: 90, superset: "push_t4c", image: "push-dips-sur-banc.jpg" },
      { id: "push_t4c", label: "Extension Triceps Élastique", emoji: "🔴", series: 5, reps: "15-20", rest: 90, image: "push-extension-triceps-elastique.jpg" },
    ],
  },
  2: {
    id: "nat_hiit", type: "natation", label: "NATATION HIIT", subtitle: "Sprints & intensité", emoji: "🏊",
    blocks: [
      { id: "warmup_brasse", label: "Échauffement — 100m brasse tranquille", distance: 100, emoji: "🐢" },
      { id: "warmup_crawl", label: "Échauffement — 100m crawl tranquille", distance: 100, emoji: "🐢" },
      { id: "b1_1", label: "50m crawl sprint (85-90%) — 30s récup", distance: 50, emoji: "⚡" },
      { id: "b1_2", label: "50m crawl sprint — 30s récup", distance: 50, emoji: "⚡" },
      { id: "b1_3", label: "50m crawl sprint — 30s récup", distance: 50, emoji: "⚡" },
      { id: "b1_4", label: "50m crawl sprint — 30s récup", distance: 50, emoji: "⚡" },
      { id: "b1_5", label: "50m crawl sprint — 30s récup", distance: 50, emoji: "⚡" },
      { id: "b1_6", label: "50m crawl sprint — 30s récup", distance: 50, emoji: "⚡" },
      { id: "b1_7", label: "50m crawl sprint — 30s récup", distance: 50, emoji: "⚡" },
      { id: "b1_8", label: "50m crawl sprint — 30s récup", distance: 50, emoji: "⚡" },
      { id: "b1_9", label: "50m crawl sprint — 30s récup", distance: 50, emoji: "⚡" },
      { id: "b1_10", label: "50m crawl sprint — 30s récup", distance: 50, emoji: "⚡" },
      { id: "b2_1", label: "50m brasse rapide — 20s récup", distance: 50, emoji: "🐸" },
      { id: "b2_2", label: "50m brasse rapide — 20s récup", distance: 50, emoji: "🐸" },
      { id: "b2_3", label: "50m brasse rapide — 20s récup", distance: 50, emoji: "🐸" },
      { id: "b2_4", label: "50m brasse rapide — 20s récup", distance: 50, emoji: "🐸" },
      { id: "b2_5", label: "50m brasse rapide — 20s récup", distance: 50, emoji: "🐸" },
      { id: "b2_6", label: "50m brasse rapide — 20s récup", distance: 50, emoji: "🐸" },
      { id: "b2_7", label: "50m brasse rapide — 20s récup", distance: 50, emoji: "🐸" },
      { id: "b2_8", label: "50m brasse rapide — 20s récup", distance: 50, emoji: "🐸" },
      { id: "b3_1", label: "50m crawl sprint MAX (95%) — 40s récup", distance: 50, emoji: "🔥" },
      { id: "b3_2", label: "50m crawl sprint MAX — 40s récup", distance: 50, emoji: "🔥" },
      { id: "b3_3", label: "50m crawl sprint MAX — 40s récup", distance: 50, emoji: "🔥" },
      { id: "b3_4", label: "50m crawl sprint MAX — 40s récup", distance: 50, emoji: "🔥" },
      { id: "b3_5", label: "50m crawl sprint MAX — 40s récup", distance: 50, emoji: "🔥" },
      { id: "b3_6", label: "50m crawl sprint MAX — 40s récup", distance: 50, emoji: "🔥" },
      { id: "b4_1", label: "25m papillon (ou crawl sprint) — 30s récup", distance: 25, emoji: "🦋" },
      { id: "b4_2", label: "25m papillon — 30s récup", distance: 25, emoji: "🦋" },
      { id: "b4_3", label: "25m papillon — 30s récup", distance: 25, emoji: "🦋" },
      { id: "b4_4", label: "25m papillon — 30s récup", distance: 25, emoji: "🦋" },
      { id: "cooldown", label: "Retour au calme — 200m brasse souple", distance: 200, emoji: "🐢" },
    ],
    totalDistance: 1600,
    info: "55 min — ~500-600 kcal — Crawl, brasse, papillon",
  },
  3: {
    id: "pull", type: "muscu", label: "PULL", subtitle: "Dos, Biceps", emoji: "🏋️", hasAbsCircuit: true, warmup: "hdc",
    exercises: [
      { id: "pull_s1a", label: "Traction Prise Pronation", emoji: "💪", series: 5, reps: "15", rest: 120, superset: "pull_s1b", image: "pull-traction-pronation.jpg" },
      { id: "pull_s1b", label: "Tirage Élastique Bûcheron", emoji: "🪓", series: 5, reps: "15/côté", rest: 120, image: "pull-tirage-elastique-bucheron.jpg" },
      { id: "pull_s2a", label: "Traction Supination Prise Serrée", emoji: "✊", series: 5, reps: "15", rest: 90, superset: "pull_s2b", image: "pull-traction-supination-prise-serree.jpg" },
      { id: "pull_s2b", label: "Curl Biceps Barre Dips", emoji: "💪", series: 5, reps: "blocage 5s + max rep", rest: 90, image: "pull-curl-biceps-barre-dips.jpg" },
      { id: "pull_s3a", label: "Traction Neutre Échelle Large", emoji: "↔️", series: 5, reps: "15", rest: 90, superset: "pull_s3b", image: "pull-traction-neutre-echelle-large.jpg" },
      { id: "pull_s3b", label: "Traction Australienne Barre Parallèle", emoji: "🇦🇺", series: 5, reps: "15", rest: 90, image: "pull-traction-australienne-barre-parallele.jpg" },
      { id: "pull_ex4", label: "Traction Pronation Serrée Tempo Dégressif", emoji: "⏱️", series: 5, reps: "descente 5-10s", rest: 90, image: "pull-traction-pronation-serree-tempo.jpg" },
    ],
  },
  4: {
    id: "nat_volume", type: "natation", label: "NATATION Volume", subtitle: "Endurance & distance", emoji: "🏊",
    blocks: [
      { id: "warmup", label: "Échauffement — 200m brasse tranquille", distance: 200, emoji: "🐢" },
      { id: "v1_1", label: "50m crawl allure modérée — 15s récup", distance: 50, emoji: "🌊" },
      { id: "v1_2", label: "50m crawl modéré — 15s récup", distance: 50, emoji: "🌊" },
      { id: "v1_3", label: "50m crawl modéré — 15s récup", distance: 50, emoji: "🌊" },
      { id: "v1_4", label: "50m crawl modéré — 15s récup", distance: 50, emoji: "🌊" },
      { id: "v1_5", label: "50m crawl modéré — 15s récup", distance: 50, emoji: "🌊" },
      { id: "v1_6", label: "50m crawl modéré — 15s récup", distance: 50, emoji: "🌊" },
      { id: "v1_7", label: "50m crawl modéré — 15s récup", distance: 50, emoji: "🌊" },
      { id: "v1_8", label: "50m crawl modéré — 15s récup", distance: 50, emoji: "🌊" },
      { id: "v2_1", label: "50m brasse allure modérée — 15s récup", distance: 50, emoji: "🐸" },
      { id: "v2_2", label: "50m brasse modérée — 15s récup", distance: 50, emoji: "🐸" },
      { id: "v2_3", label: "50m brasse modérée — 15s récup", distance: 50, emoji: "🐸" },
      { id: "v2_4", label: "50m brasse modérée — 15s récup", distance: 50, emoji: "🐸" },
      { id: "v2_5", label: "50m brasse modérée — 15s récup", distance: 50, emoji: "🐸" },
      { id: "v2_6", label: "50m brasse modérée — 15s récup", distance: 50, emoji: "🐸" },
      { id: "v2_7", label: "50m brasse modérée — 15s récup", distance: 50, emoji: "🐸" },
      { id: "v2_8", label: "50m brasse modérée — 15s récup", distance: 50, emoji: "🐸" },
      { id: "v3_1", label: "50m alternée crawl/brasse — 15s récup", distance: 50, emoji: "🔄" },
      { id: "v3_2", label: "50m alternée — 15s récup", distance: 50, emoji: "🔄" },
      { id: "v3_3", label: "50m alternée — 15s récup", distance: 50, emoji: "🔄" },
      { id: "v3_4", label: "50m alternée — 15s récup", distance: 50, emoji: "🔄" },
      { id: "v3_5", label: "50m alternée — 15s récup", distance: 50, emoji: "🔄" },
      { id: "v3_6", label: "50m alternée — 15s récup", distance: 50, emoji: "🔄" },
      { id: "v3_7", label: "50m alternée — 15s récup", distance: 50, emoji: "🔄" },
      { id: "v3_8", label: "50m alternée — 15s récup", distance: 50, emoji: "🔄" },
      { id: "cooldown", label: "Retour au calme — 200m brasse souple", distance: 200, emoji: "🐢" },
    ],
    totalDistance: 1600,
    info: "55 min — ~450-550 kcal — Crawl & brasse allure modérée",
  },
  5: {
    id: "fullhdc", type: "muscu", label: "FULL HDC", subtitle: "Full Haut du Corps", emoji: "🏋️", hasAbsCircuit: true, warmup: "hdc",
    exercises: [
      { id: "fhdc_s1a", label: "Dips en Haut de la Barre", emoji: "⬆️", series: 5, reps: "20", rest: 120, superset: "fhdc_s1b", image: "push-dips-barre-parallele.jpg" },
      { id: "fhdc_s1b", label: "Traction Pronation (sans lâcher)", emoji: "💪", series: 5, reps: "15", rest: 120, image: "pull-traction-pronation.jpg" },
      { id: "fhdc_s2a", label: "Dips Barre Parallèle", emoji: "⬇️", series: 5, reps: "20", rest: 90, superset: "fhdc_s2b", image: "push-dips-barre-parallele.jpg" },
      { id: "fhdc_s2b", label: "Traction Australienne Prise Neutre", emoji: "🇦🇺", series: 5, reps: "20", rest: 90, image: "pull-traction-australienne-barre-parallele.jpg" },
      { id: "fhdc_s3a", label: "Traction Australienne Pronation", emoji: "🔄", series: 5, reps: "30", rest: 90, superset: "fhdc_s3b", image: "fullhdc-traction-australienne-pronation.jpg" },
      { id: "fhdc_s3b", label: "Pompes", emoji: "🫸", series: 5, reps: "30", rest: 90, image: "push-pompes-classique.jpg" },
      { id: "fhdc_s4a", label: "Barre au Front", emoji: "💪", series: 5, reps: "15", rest: 90, superset: "fhdc_s4b", image: "push-barre-au-front.jpg" },
      { id: "fhdc_s4b", label: "Curl Biceps Barre Dips", emoji: "✊", series: 5, reps: "15", rest: 90, image: "pull-curl-biceps-barre-dips.jpg" },
    ],
  },
  6: {
    id: "legs", type: "muscu", label: "LEGS", subtitle: "Full Bas du Corps", emoji: "🦵", warmup: "bdc",
    exercises: [
      { id: "legs_s1a", label: "Squat Talon Surélevé + Isométrie", emoji: "🦵", series: 5, reps: "20 + 20s blocage", rest: 90, superset: "legs_s1b", image: "legs-squat-talon-sureleve-isometrie.jpg" },
      { id: "legs_s1b", label: "Marche des Canards", emoji: "🦆", series: 5, reps: "30 mètres", rest: 90, image: "legs-marche-canards.jpg" },
      { id: "legs_s2a", label: "Squat Bulgare", emoji: "🦵", series: 5, reps: "20/jambe", rest: 90, superset: "legs_s2b", image: "legs-squat-bulgare.jpg" },
      { id: "legs_s2b", label: "Ischio Unilatéral sur Chaise", emoji: "🪑", series: 5, reps: "20/jambe", rest: 90, image: "legs-ischio-unilateral-chaise.jpg" },
      { id: "legs_t3a", label: "Squat + Box Jump + Squat Sauté", emoji: "📦", series: 5, reps: "15 + 15 + 15", rest: 90, image: "legs-squat-box-jump-squat-saute.jpg" },
      { id: "legs_s4a", label: "Fentes Sautées Alternées", emoji: "🦘", series: 5, reps: "8/jambe", rest: 90, superset: "legs_s4b", image: "legs-fentes-sautees-alternees.jpg" },
      { id: "legs_s4b", label: "Saut en Longueur Pied Joint", emoji: "🏃", series: 5, reps: "10 sauts", rest: 90, image: "legs-saut-longueur-pied-joint.jpg" },
    ],
  },
  0: {
    id: "nat_pyramide", type: "natation", label: "NATATION Pyramide", subtitle: "Montée/descente", emoji: "🏊",
    blocks: [
      { id: "warmup", label: "Échauffement — 200m (brasse + crawl)", distance: 200, emoji: "🐢" },
      { id: "pyr_s1_25a", label: "25m crawl sprint — 15s récup", distance: 25, emoji: "📈" },
      { id: "pyr_s1_50a", label: "50m crawl sprint — 20s récup", distance: 50, emoji: "📈" },
      { id: "pyr_s1_50b", label: "50m brasse rapide — 20s récup", distance: 50, emoji: "🐸" },
      { id: "pyr_s1_50c", label: "50m crawl sprint — 20s récup", distance: 50, emoji: "📉" },
      { id: "pyr_s1_25b", label: "25m crawl sprint", distance: 25, emoji: "📉" },
      { id: "pyr_s2_25a", label: "25m crawl sprint — 15s récup", distance: 25, emoji: "📈" },
      { id: "pyr_s2_50a", label: "50m crawl sprint — 20s récup", distance: 50, emoji: "📈" },
      { id: "pyr_s2_50b", label: "50m brasse rapide — 20s récup", distance: 50, emoji: "🐸" },
      { id: "pyr_s2_50c", label: "50m crawl sprint — 20s récup", distance: 50, emoji: "📉" },
      { id: "pyr_s2_25b", label: "25m crawl sprint", distance: 25, emoji: "📉" },
      { id: "pyr_s3_25a", label: "25m crawl sprint — 15s récup", distance: 25, emoji: "📈" },
      { id: "pyr_s3_50a", label: "50m crawl sprint — 20s récup", distance: 50, emoji: "📈" },
      { id: "pyr_s3_50b", label: "50m brasse rapide — 20s récup", distance: 50, emoji: "🐸" },
      { id: "pyr_s3_50c", label: "50m crawl sprint — 20s récup", distance: 50, emoji: "📉" },
      { id: "pyr_s3_25b", label: "25m crawl sprint", distance: 25, emoji: "📉" },
      { id: "fin_1", label: "25m sprint MAX crawl — 20s récup", distance: 25, emoji: "🔥" },
      { id: "fin_2", label: "25m sprint MAX — 20s récup", distance: 25, emoji: "🔥" },
      { id: "fin_3", label: "25m sprint MAX — 20s récup", distance: 25, emoji: "🔥" },
      { id: "fin_4", label: "25m sprint MAX — 20s récup", distance: 25, emoji: "🔥" },
      { id: "fin_5", label: "25m sprint MAX — 20s récup", distance: 25, emoji: "🔥" },
      { id: "fin_6", label: "25m sprint MAX — 20s récup", distance: 25, emoji: "🔥" },
      { id: "fin_7", label: "25m sprint MAX — 20s récup", distance: 25, emoji: "🔥" },
      { id: "fin_8", label: "25m sprint MAX — 20s récup", distance: 25, emoji: "🔥" },
      { id: "cooldown", label: "Retour au calme — 200m brasse souple", distance: 200, emoji: "🐢" },
    ],
    totalDistance: 1400,
    info: "55 min — ~450-550 kcal — Pyramide ×3 + finisher 8×25m",
  },
};

const REST_PRESETS = [
  { label: "2:00", seconds: 120 },
  { label: "1:30", seconds: 90 },
  { label: "1:00", seconds: 60 },
];

const SYMPTOMS = ["Énergie","Humeur","Sommeil","Digestion","Peau","Cheveux","Dos","Mâchoire","Vue","Libido","Stress","Concentration","Articulations"];

const NATURO = [
  { id: "langue", label: "Langue", good: "Rose propre" },
  { id: "ongles", label: "Ongles", good: "Lisses, durs" },
  { id: "yeux", label: "Blanc des yeux", good: "Blanc pur" },
  { id: "cernes", label: "Cernes", good: "Légers" },
  { id: "selles", label: "Selles (Bristol)", good: "Type 3-4" },
  { id: "urine", label: "Urine", good: "Jaune paille" },
  { id: "mains_froides", label: "Mains/pieds froids", good: "Non" },
  { id: "cicatrisation", label: "Cicatrisation", good: "Rapide" },
  { id: "transpiration", label: "Transpiration", good: "Normale" },
  { id: "haleine", label: "Haleine réveil", good: "Neutre" },
  { id: "peau_seche", label: "Peau sèche", good: "Non" },
];

// ---- PLANNING CONSTANTS ----
const EVENT_COLORS = [
  { id: "red", hex: "#e94560", label: "Sport" },
  { id: "blue", hex: "#4a90d9", label: "Travail" },
  { id: "green", hex: "#4caf50", label: "Perso" },
  { id: "orange", hex: "#ff9800", label: "RDV" },
  { id: "purple", hex: "#9c27b0", label: "Autre" },
];
const PLANNING_HOURS = Array.from({ length: 18 }, (_, i) => i + 6);
const HOUR_HEIGHT = 60;

// Helpers
function getToday() { return new Date().toISOString().split("T")[0]; }
function getDayNumber(d) { return Math.floor((new Date(d) - new Date(START_DATE)) / 86400000) + 1; }
function getWeekNumber(d) { return Math.ceil(getDayNumber(d) / 7); }
function getAvatarStage(xp) { let s = AVATAR_STAGES[0]; for (const a of AVATAR_STAGES) if (xp >= a.min) s = a; return s; }
function getCurrentCity(xp) { let c = CITIES[0]; for (const city of CITIES) if (xp >= city.min) c = city; return c; }
function getNextCity(xp) { for (const c of CITIES) if (xp < c.min) return c; return null; }

function getMonday(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().split("T")[0];
}

function getWeekDates(mondayStr) {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(mondayStr);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

function doesRecur(event, dateStr) {
  if (!event.recurrence || event.recurrence.type === "none") return false;
  if (dateStr < event.date) return false;
  if (dateStr === event.date) return false; // exact date already matched as non-recurring
  const dow = new Date(dateStr).getDay();
  switch (event.recurrence.type) {
    case "daily": return true;
    case "weekly": return dow === new Date(event.date).getDay();
    case "weekdays": return dow >= 1 && dow <= 5;
    case "custom": return (event.recurrence.days || []).includes(dow);
    default: return false;
  }
}

function getEventsForDate(planning, dateStr) {
  const results = [];
  for (const [id, e] of Object.entries(planning || {})) {
    const isExactDate = e.date === dateStr;
    const isRecurring = doesRecur(e, dateStr);
    if (!isExactDate && !isRecurring) continue;
    // Check exceptions
    const exception = e.exceptions?.[dateStr];
    if (exception === "deleted") continue;
    // Build occurrence
    let occ = { ...e, id, _occurrenceDate: dateStr, _isRecurring: !!(e.recurrence && e.recurrence.type !== "none") };
    if (exception && typeof exception === "object") {
      occ = { ...occ, ...exception };
    }
    results.push(occ);
  }
  return results.sort((a, b) => a.startH * 60 + a.startM - (b.startH * 60 + b.startM));
}

function getEventPosition(event) {
  const startMinutes = (event.startH - 6) * 60 + event.startM;
  const endMinutes = (event.endH - 6) * 60 + event.endM;
  const top = (startMinutes / 60) * HOUR_HEIGHT;
  const height = Math.max(((endMinutes - startMinutes) / 60) * HOUR_HEIGHT, 20);
  return { top, height };
}

function formatWeekRange(weekDates) {
  const months = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
  const first = new Date(weekDates[0]);
  const last = new Date(weekDates[6]);
  if (first.getMonth() === last.getMonth()) {
    return `${first.getDate()} — ${last.getDate()} ${months[first.getMonth()]} ${first.getFullYear()}`;
  }
  return `${first.getDate()} ${months[first.getMonth()]} — ${last.getDate()} ${months[last.getMonth()]}`;
}

const defaultData = () => ({ days: {}, weeks: {}, weight: {}, planning: {}, totalXP: 0, bestStreak: 0, seenRewards: [], nutrition: { currentStage: 1, stageStartDate: null, cycleComplete: false }, reappro: {}, _migrations: {} });

function migrateSuppsV2(d) {
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

function getCurrentNutritionStage() {
  const today = new Date(getToday());
  const start = new Date(START_DATE);
  const diffDays = Math.floor((today - start) / 86400000);
  if (diffDays < 0) {
    return { stage: 1, dayInStage: 0, stageInfo: NUTRITION_STAGES[0], complete: false, notStarted: true, daysUntilStart: Math.abs(diffDays) };
  }
  const totalDays = STAGE_DAYS * 4; // 120 jours au total
  if (diffDays >= totalDays) {
    return { stage: 4, dayInStage: STAGE_DAYS, stageInfo: NUTRITION_STAGES[3], complete: true, notStarted: false };
  }
  const stageIndex = Math.min(3, Math.floor(diffDays / STAGE_DAYS));
  const dayInStage = (diffDays % STAGE_DAYS) + 1;
  return { stage: stageIndex + 1, dayInStage, stageInfo: NUTRITION_STAGES[stageIndex], complete: false, notStarted: false };
}

// ---- WEIGHT TRACKING UTILITIES ----
function isMonday(dateStr) {
  return new Date(dateStr).getDay() === 1;
}

function getNextMonday(dateStr) {
  const d = new Date(dateStr || getToday());
  const day = d.getDay();
  const daysUntil = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
  d.setDate(d.getDate() + daysUntil);
  return d.toISOString().split("T")[0];
}

function getWeekInStage(data) {
  if (!data.nutrition?.stageStartDate) return 1;
  const stageStart = new Date(data.nutrition.stageStartDate);
  const today = new Date(getToday());
  const diffDays = Math.floor((today - stageStart) / 86400000);
  if (diffDays < 0) return 0;
  return Math.floor(diffDays / 7) + 1;
}

function getStageType(stageNum) {
  return (stageNum === 1 || stageNum === 3) ? "regain" : "seche";
}

function getWeightAlert(data, currentWeekNum) {
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
  const stageNum = data.nutrition?.currentStage || 1;
  const type = getStageType(stageNum);
  const weekInStage = getWeekInStage(data);

  if (type === "regain") {
    // Baisse 2 semaines de suite
    if (prevDelta !== null && prevDelta < 0 && delta < 0) {
      return { type: "warning", text: "Tu perds du poids en regain ! Augmente tes calories de 100-200 kcal" };
    }
    // Monte trop vite (>+1kg/sem) — seulement à partir semaine 2
    if (delta > 1 && weekInStage >= 2) {
      return { type: "warning", text: "Tu prends trop vite, réduis un peu les glucides" };
    }
    // Monte vite semaine 1 = normal après sèche
    if (delta > 1 && weekInStage === 1) {
      return { type: "ok", text: "Normal après une sèche (eau + glycogène)" };
    }
    // Monte doucement
    if (delta >= 0.2 && delta <= 0.5) {
      return { type: "ok", text: "Parfait, regain efficace" };
    }
    // Stable
    if (Math.abs(delta) < 0.2) {
      return { type: "ok", text: "Bon maintien" };
    }
    // Monte un peu plus (0.5-1kg)
    if (delta > 0.5 && delta <= 1) {
      return { type: "ok", text: "Regain en cours, surveille la progression" };
    }
    // Perte légère
    if (delta < 0) {
      return { type: "warning", text: "Tu perds du poids en regain ! Augmente tes calories de 100-200 kcal" };
    }
  }

  if (type === "seche") {
    // Semaines 1-2 : perte 1.5-2.5kg normale
    if (weekInStage <= 2 && delta <= -1.5 && delta >= -2.5) {
      return { type: "ok", text: "Normal, c'est l'eau et le glycogène qui partent" };
    }
    // Semaines 1-2 : perte plus grande
    if (weekInStage <= 2 && delta < -2.5) {
      return { type: "ok", text: "Grosse perte initiale — eau et glycogène, c'est normal" };
    }
    // À partir semaine 3 : perte trop rapide (>2kg/sem)
    if (weekInStage > 2 && delta < -2) {
      return { type: "warning", text: "Trop rapide, tu risques de perdre du muscle" };
    }
    // À partir semaine 3 : plateau (stable 2 semaines de suite)
    if (weekInStage >= 3 && prevDelta !== null && Math.abs(delta) < 0.3 && Math.abs(prevDelta) < 0.3) {
      return { type: "warning", text: "Plateau ! Ajoute 200 kcal de déficit" };
    }
    // À partir semaine 3 : perte efficace (0.7-1.2kg/sem)
    if (weekInStage >= 3 && delta >= -1.2 && delta <= -0.7) {
      return { type: "ok", text: "Parfait, sèche efficace" };
    }
    // Semaines 1-2 : perte légère
    if (weekInStage <= 2 && delta < 0) {
      return { type: "ok", text: "Début de sèche, le corps s'adapte" };
    }
    // À partir semaine 3 : perte modérée
    if (weekInStage >= 3 && delta < 0) {
      return { type: "ok", text: "Sèche en cours, bonne progression" };
    }
    // Poids stable semaine 1-2
    if (weekInStage <= 2 && Math.abs(delta) < 0.3) {
      return { type: "ok", text: "Le corps s'adapte, la perte va commencer" };
    }
    // Prise de poids en sèche
    if (delta > 0) {
      return { type: "warning", text: "Prise de poids en sèche — vérifie ton déficit calorique" };
    }
  }

  return { type: "ok", text: `${delta > 0 ? "+" : ""}${delta.toFixed(1)} kg cette semaine` };
}

async function compressImage(file, maxWidth = 400, quality = 0.6) {
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


function getWeekAvgScore(data, weekNum) {
  let total = 0, days = 0;
  const start = new Date(START_DATE);
  for (let i = (weekNum - 1) * 7; i < weekNum * 7 && i < 30; i++) {
    const dt = new Date(start); dt.setDate(dt.getDate() + i);
    const key = dt.toISOString().split("T")[0];
    const day = data.days[key];
    if (day) {
      let t = 0, d2 = 0;
      HABITS.filter(h => !h.weekly).forEach(() => t++);
      getMealsForStage(data.nutrition?.currentStage || 1).forEach(() => t++); getSuppsForStage(data.nutrition?.currentStage || 1).forEach(() => t++);
      if (day.habits) Object.values(day.habits).forEach(v => { if (v) d2++; });
      if (day.meals) Object.values(day.meals).forEach(v => { if (v) d2++; });
      if (day.supps) Object.values(day.supps).forEach(v => { if (v) d2++; });
      if (t > 0) { total += (d2 / t) * 100; days++; }
    }
  }
  return days > 0 ? total / days : 0;
}

function isWeekComplete(data, weekNum) {
  const start = new Date(START_DATE);
  const lastDay = new Date(start); lastDay.setDate(lastDay.getDate() + weekNum * 7 - 1);
  return new Date(getToday()) >= lastDay && getWeekAvgScore(data, weekNum) >= 70;
}

const ACHIEVEMENT_REWARDS = [
  { id: "streak_7", emoji: "🏖️", title: "Plage à Nice", desc: "Pause plage sur la Côte d'Azur", condition: "7 jours de streak", check: (d) => d.bestStreak >= 7 },
  { id: "streak_14", emoji: "🛥️", title: "Balade en bateau", desc: "Tour en bateau à Gênes", condition: "14 jours de streak", check: (d) => d.bestStreak >= 14 },
  { id: "streak_21", emoji: "🎭", title: "Opéra à Florence", desc: "Spectacle dans un théâtre historique", condition: "21 jours de streak", check: (d) => d.bestStreak >= 21 },
  { id: "perfect_week", emoji: "🍕", title: "Pizza Napolitaine", desc: "La meilleure pizza de ta vie", condition: "1 semaine à 100%", check: (d) => { for (let w = 1; w <= 4; w++) if (getWeekAvgScore(d, w) >= 98) return true; return false; }},
  { id: "all_supps_10", emoji: "🏎️", title: "Tour en Vespa", desc: "Location Vespa pour explorer Rome à deux", condition: "10j suppléments complets", check: (d) => { let c = 0; const expected = getSuppsForStage(d.nutrition?.currentStage || 1).length; Object.values(d.days).forEach(day => { if (day.supps && Object.values(day.supps).filter(Boolean).length >= expected) c++; }); return c >= 10; }},
  { id: "weight_loss", emoji: "🛍️", title: "Shopping à Milan", desc: "Détour shopping pour ta nouvelle silhouette", condition: "Premier kg perdu", check: (d) => { const w1 = d.weight?.w1?.poids ? parseFloat(d.weight.w1.poids) : 0; const latest = Object.keys(d.weight || {}).sort().reverse().find(k => d.weight[k]?.poids); const last = latest ? parseFloat(d.weight[latest].poids) : 0; return w1 > 0 && last > 0 && w1 - last >= 1; }},
  { id: "all_temps", emoji: "🍷", title: "Dégustation de vin", desc: "Dégustation dans un vignoble toscan", condition: "Température 7j de suite", check: (d) => { let con = 0, max = 0; const start = new Date(START_DATE); for (let i = 0; i < 30; i++) { const dt = new Date(start); dt.setDate(dt.getDate() + i); const k = dt.toISOString().split("T")[0]; const t = d.days[k]?.temp; if (t && t.reveil && t.apres_repas && t.aprem) { con++; max = Math.max(max, con); } else con = 0; } return max >= 7; }},
  { id: "xp_3000", emoji: "📸", title: "Shooting Photo", desc: "Photos souvenirs devant la Fontaine de Trevi", condition: "Atteindre 3000 XP", check: (d) => d.totalXP >= 3000 },
  { id: "xp_5500", emoji: "🏆", title: "Dîner au Sommet", desc: "Dîner gastronomique panoramique sur Rome", condition: "Atteindre Rome (5500 XP)", check: (d) => d.totalXP >= 5500 },
];

// ---- AVATAR SVG ----
function AvatarSVG({ stage, size = 180 }) {
  const s = stage, cx = 60, headY = 22;
  return (
    <svg viewBox="0 0 120 160" width={size} height={size * 1.33}>
      <defs>
        <radialGradient id="sg" cx="50%" cy="30%"><stop offset="0%" stopColor={s.color} /><stop offset="100%" stopColor={`${s.color}dd`} /></radialGradient>
        <linearGradient id="shg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={s.shorts} /><stop offset="100%" stopColor={`${s.shorts}aa`} /></linearGradient>
      </defs>
      <rect x={cx-s.legWidth-3} y={110} width={s.legWidth} height={38} rx={s.legWidth/2} fill="url(#sg)"><animate attributeName="height" values="38;40;38" dur="2s" repeatCount="indefinite"/></rect>
      <rect x={cx+3} y={110} width={s.legWidth} height={38} rx={s.legWidth/2} fill="url(#sg)"><animate attributeName="height" values="40;38;40" dur="2s" repeatCount="indefinite"/></rect>
      <rect x={cx-s.chestWidth/2+2} y={100} width={s.chestWidth-4} height={22} rx={4} fill="url(#shg)" />
      <path d={`M${cx-s.chestWidth/2},${55} Q${cx-s.chestWidth/2-2},${80} ${cx-s.bodyWidth/2},${105} L${cx+s.bodyWidth/2},${105} Q${cx+s.chestWidth/2+2},${80} ${cx+s.chestWidth/2},${55} Z`} fill="url(#sg)" />
      {s.sixpack>=2&&<><line x1={cx} y1={65} x2={cx} y2={98} stroke={`${s.color}88`} strokeWidth="0.8"/><line x1={cx-8} y1={75} x2={cx+8} y2={75} stroke={`${s.color}88`} strokeWidth="0.5"/></>}
      {s.sixpack>=4&&<><line x1={cx-8} y1={83} x2={cx+8} y2={83} stroke={`${s.color}88`} strokeWidth="0.5"/><line x1={cx-7} y1={91} x2={cx+7} y2={91} stroke={`${s.color}88`} strokeWidth="0.5"/></>}
      {s.sixpack>=6&&<line x1={cx-6} y1={98} x2={cx+6} y2={98} stroke={`${s.color}88`} strokeWidth="0.5"/>}
      <ellipse cx={cx-s.chestWidth/4} cy={62} rx={s.chestWidth/4-2} ry={7+s.armWidth/3} fill={`${s.color}22`}/>
      <ellipse cx={cx+s.chestWidth/4} cy={62} rx={s.chestWidth/4-2} ry={7+s.armWidth/3} fill={`${s.color}22`}/>
      <rect x={cx-s.chestWidth/2-s.armWidth+2} y={55} width={s.armWidth} height={42} rx={s.armWidth/2} fill="url(#sg)" transform={`rotate(-8,${cx-s.chestWidth/2},55)`}><animate attributeName="y" values="55;53;55" dur="3s" repeatCount="indefinite"/></rect>
      <rect x={cx+s.chestWidth/2-2} y={55} width={s.armWidth} height={42} rx={s.armWidth/2} fill="url(#sg)" transform={`rotate(8,${cx+s.chestWidth/2},55)`}><animate attributeName="y" values="53;55;53" dur="3s" repeatCount="indefinite"/></rect>
      <rect x={cx-6} y={35} width={12} height={22} rx={6} fill="url(#sg)" />
      <circle cx={cx} cy={headY} r={16} fill="url(#sg)" />
      <path d={`M${cx-14},${headY-6} Q${cx-16},${headY-16} ${cx-6},${headY-18} Q${cx},${headY-20} ${cx+6},${headY-18} Q${cx+16},${headY-16} ${cx+14},${headY-6}`} fill="#2a1a0a"/>
      <circle cx={cx-5} cy={headY-1} r={2} fill="#1a1a2e"/><circle cx={cx+5} cy={headY-1} r={2} fill="#1a1a2e"/>
      <circle cx={cx-4.5} cy={headY-1.5} r={0.6} fill="white"/><circle cx={cx+5.5} cy={headY-1.5} r={0.6} fill="white"/>
      <path d={`M${cx-4},${headY+5} Q${cx},${headY+5+s.sixpack} ${cx+4},${headY+5}`} fill="none" stroke="#1a1a2e" strokeWidth="1.2" strokeLinecap="round"/>
      <ellipse cx={cx-s.legWidth/2-3} cy={150} rx={s.legWidth/2+3} ry={5} fill="#1a1a2e"/><ellipse cx={cx+s.legWidth/2+3} cy={150} rx={s.legWidth/2+3} ry={5} fill="#1a1a2e"/>
    </svg>
  );
}

// ---- MAP SVG ----
function MapSVG({ xp }) {
  const currentCity = getCurrentCity(xp), nextCity = getNextCity(xp);
  let prog = 0;
  if (nextCity) { const ci = CITIES.indexOf(currentCity); const seg = nextCity.min - currentCity.min; prog = ci + (seg > 0 ? (xp - currentCity.min) / seg : 0); }
  else prog = CITIES.length - 1;
  const idx = Math.floor(prog), frac = prog - idx;
  const cp = idx >= CITIES.length - 1 ? { x: CITIES[CITIES.length - 1].x, y: CITIES[CITIES.length - 1].y } : { x: CITIES[idx].x + (CITIES[idx + 1].x - CITIES[idx].x) * frac, y: CITIES[idx].y + (CITIES[idx + 1].y - CITIES[idx].y) * frac };

  return (
    <svg viewBox="0 0 100 80" style={{ width: "100%", height: "auto" }}>
      <defs>
        <radialGradient id="seaG" cx="50%" cy="50%"><stop offset="0%" stopColor="#0a1628" /><stop offset="100%" stopColor="#061020" /></radialGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="1" result="g" /><feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <rect width="100" height="80" fill="url(#seaG)" rx="8" />
      <path d="M10,10 L35,8 L40,15 L42,30 L38,50 L35,65 L25,70 L15,60 L8,45 L5,25 Z" fill="#12122a" stroke="#2a2a5a" strokeWidth="0.3" />
      <path d="M50,35 L58,30 L68,32 L72,40 L74,50 L70,58 L68,68 L65,73 L62,70 L60,62 L56,55 L52,48 L50,40 Z" fill="#12122a" stroke="#2a2a5a" strokeWidth="0.3" />
      <ellipse cx={65} cy={75} rx={4} ry={2.5} fill="#12122a" stroke="#2a2a5a" strokeWidth="0.3" />
      <path d={`M${CITIES.map(c => `${c.x},${c.y}`).join(" L")}`} fill="none" stroke="#333" strokeWidth="0.5" strokeDasharray="2,1" />
      {CITIES.map((c, i) => {
        if (!i) return null; const prev = CITIES[i - 1];
        if (xp >= c.min) return <line key={i} x1={prev.x} y1={prev.y} x2={c.x} y2={c.y} stroke="#e94560" strokeWidth="0.8" filter="url(#glow)" />;
        if (xp >= prev.min) { const f = (xp - prev.min) / (c.min - prev.min); return <line key={i} x1={prev.x} y1={prev.y} x2={prev.x + (c.x - prev.x) * f} y2={prev.y + (c.y - prev.y) * f} stroke="#e94560" strokeWidth="0.8" filter="url(#glow)" />; }
        return null;
      })}
      {CITIES.map((c, i) => {
        const reached = xp >= c.min;
        return (<g key={i}><circle cx={c.x} cy={c.y} r={reached ? 2.5 : 1.8} fill={reached ? "#e94560" : "#333"} stroke={reached ? "#ff6b81" : "#444"} strokeWidth="0.3">{reached && <animate attributeName="r" values="2.5;3;2.5" dur="2s" repeatCount="indefinite" />}</circle><text x={c.x} y={c.y - 4} textAnchor="middle" fill={reached ? "#fff" : "#555"} fontSize="3" fontWeight={reached ? "bold" : "normal"} fontFamily="Arial">{c.name}</text></g>);
      })}
      <g><text x={cp.x} y={cp.y - 1} textAnchor="middle" fontSize="5" filter="url(#glow)"><animate attributeName="y" values={`${cp.y - 1};${cp.y - 3};${cp.y - 1}`} dur="1.5s" repeatCount="indefinite" />✈️</text></g>
      <text x={25} y={76} fill="#1a2a4a" fontSize="2.5" fontStyle="italic" fontFamily="serif">Méditerranée</text>
    </svg>
  );
}

function RewardCard({ reward, unlocked, isNew, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: unlocked ? "linear-gradient(135deg,#1a0a2e,#2a1040,#1a0a2e)" : "linear-gradient(135deg,#0a0a14,#0d0d1e)",
      border: `1px solid ${unlocked ? (isNew ? "#ffeb3b" : "#6a3aaa") : "#1a1a2a"}`,
      borderRadius: 16, padding: 16, cursor: unlocked ? "pointer" : "default",
      position: "relative", overflow: "hidden", transition: "all .3s", opacity: unlocked ? 1 : 0.5,
    }}>
      {unlocked && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,#ffeb3b,transparent)", backgroundSize: "200% 100%", animation: isNew ? "shimmer 2s infinite" : "none" }} />}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
          background: unlocked ? "linear-gradient(135deg,#e94560,#c23152)" : "#111",
          boxShadow: unlocked ? "0 4px 20px rgba(233,69,96,.3)" : "none",
        }}>{unlocked ? reward.emoji : "🔒"}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: unlocked ? "#fff" : "#444" }}>{unlocked ? reward.title : "???"}</div>
          <div style={{ fontSize: 11, color: unlocked ? "#bbb" : "#333", marginTop: 2 }}>{unlocked ? reward.desc : (reward.condition || `Semaine ${reward.week} — Score ≥ 70%`)}</div>
        </div>
        {unlocked && isNew && <div style={{ background: "linear-gradient(135deg,#ffeb3b,#ff9800)", color: "#000", fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 20, animation: "pulse 1.5s infinite" }}>NEW!</div>}
        {unlocked && !isNew && <div style={{ fontSize: 20 }}>✨</div>}
      </div>
      {reward.category && unlocked && (
        <div style={{ marginTop: 8 }}>
          <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 10, background: "rgba(233,69,96,.15)", color: "#e94560", fontWeight: 600 }}>
            {{ food: "🍴 Gastronomie", culture: "🏛️ Culture", love: "❤️ Romantique" }[reward.category] || reward.category}
          </span>
        </div>
      )}
    </div>
  );
}

// ---- REST TIMER ----
function RestTimer({ seconds, running, preset, onStop, onDismiss }) {
  if (!running && seconds <= 0) return null;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const pct = preset > 0 ? (seconds / preset) * 100 : 0;
  const isLow = seconds <= 10 && seconds > 0;
  const isDone = !running && seconds <= 0;
  const r = 20, circ = 2 * Math.PI * r;

  return (
    <div style={{
      position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
      background: "linear-gradient(135deg,#0d0d24,#1a1a3a)", border: `2px solid ${isDone ? "#ffeb3b" : isLow ? "#e94560" : "#4caf50"}`,
      borderRadius: 20, padding: "12px 20px", zIndex: 200, display: "flex", alignItems: "center", gap: 14,
      boxShadow: `0 8px 32px rgba(${isLow ? "233,69,96" : "76,175,80"},.3)`,
      animation: isLow ? "pulse 0.5s infinite" : "none", minWidth: 200, justifyContent: "center",
    }}>
      <div style={{ width: 48, height: 48, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={48} height={48} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={24} cy={24} r={r} fill="none" stroke="#1e1e4a" strokeWidth={3} />
          <circle cx={24} cy={24} r={r} fill="none" stroke={isLow ? "#e94560" : "#4caf50"}
            strokeWidth={3} strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
            strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s linear" }} />
        </svg>
        <span style={{ position: "absolute", fontSize: 14, fontWeight: 800, fontFamily: "'Space Mono'", color: isLow ? "#e94560" : "#fff" }}>
          {mins}:{secs.toString().padStart(2, "0")}
        </span>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {running ? (
          <div onClick={onStop} style={{ padding: "6px 14px", borderRadius: 10, background: "rgba(233,69,96,.2)", color: "#e94560", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Stop</div>
        ) : (
          <div onClick={onDismiss} style={{ padding: "6px 14px", borderRadius: 10, background: "rgba(76,175,80,.2)", color: "#4caf50", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>OK</div>
        )}
      </div>
    </div>
  );
}

// ---- EVENT MODAL ----
const selectStyle = {
  background: "#0a0a1a", border: "1px solid #2a2a4a", borderRadius: 8,
  color: "white", padding: "8px 10px", fontSize: 13, fontFamily: "'Space Mono'",
  outline: "none", flex: 1, WebkitAppearance: "none", appearance: "none", colorScheme: "dark",
};

function EventModal({ event, onSave, onDelete, onClose }) {
  const [title, setTitle] = useState(event.title || "");
  const [date, setDate] = useState(event.date || getToday());
  const [startH, setStartH] = useState(event.startH ?? 9);
  const [startM, setStartM] = useState(event.startM ?? 0);
  const [endH, setEndH] = useState(event.endH ?? 10);
  const [endM, setEndM] = useState(event.endM ?? 0);
  const [color, setColor] = useState(event.color || EVENT_COLORS[0].hex);
  const [notes, setNotes] = useState(event.notes || "");
  const [recurrenceType, setRecurrenceType] = useState(event.recurrence?.type || "none");
  const [recurrenceDays, setRecurrenceDays] = useState(event.recurrence?.days || []);

  const isSingleEdit = event._editMode === "single";

  const weeklyDayLabel = (() => {
    const d = new Date(date || getToday());
    return ["dimanche","lundi","mardi","mercredi","jeudi","vendredi","samedi"][d.getDay()];
  })();

  const handleSave = () => {
    if (!title.trim()) return;
    let sH = parseInt(startH), sM = parseInt(startM);
    let eH = parseInt(endH), eM = parseInt(endM);
    if (eH * 60 + eM <= sH * 60 + sM) { eH = Math.min(sH + 1, 23); eM = sM; }
    const result = { ...(event.id ? { id: event.id } : {}), title: title.trim(), date, startH: sH, startM: sM, endH: eH, endM: eM, color, notes };
    if (isSingleEdit) {
      result._editMode = "single";
      result._occurrenceDate = event._occurrenceDate;
    } else {
      if (recurrenceType !== "none") {
        result.recurrence = { type: recurrenceType };
        if (recurrenceType === "custom") result.recurrence.days = recurrenceDays;
      } else {
        result.recurrence = null;
      }
    }
    onSave(result);
  };

  const hourOptions = Array.from({ length: 18 }, (_, i) => i + 6);
  const minuteOptions = [0, 15, 30, 45];
  const dayToggleNames = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];

  const toggleCustomDay = (dayIdx) => {
    setRecurrenceDays(prev => prev.includes(dayIdx) ? prev.filter(d => d !== dayIdx) : [...prev, dayIdx]);
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "linear-gradient(145deg,#0d0d24,#151535)", border: "1px solid #1e1e4a", borderRadius: 20, padding: 20, width: "100%", maxWidth: 360, maxHeight: "85vh", overflowY: "auto", animation: "slideUp .3s ease" }}>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>{event.isNew ? "Nouvel événement" : "Modifier l'événement"}</div>

        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Titre" autoFocus
          style={{ width: "100%", padding: "12px 14px", marginBottom: 12, borderRadius: 12, border: "1px solid #2a2a4a", background: "#0a0a1a", color: "white", fontSize: 14, fontFamily: "'Outfit'", outline: "none", boxSizing: "border-box" }} />

        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ width: "100%", padding: "10px 14px", marginBottom: 12, borderRadius: 12, border: "1px solid #2a2a4a", background: "#0a0a1a", color: "white", fontSize: 13, fontFamily: "'Outfit'", outline: "none", boxSizing: "border-box", colorScheme: "dark" }} />

        <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: "#555", marginBottom: 4 }}>Début</div>
            <div style={{ display: "flex", gap: 4 }}>
              <select value={startH} onChange={e => setStartH(parseInt(e.target.value))} style={selectStyle}>
                {hourOptions.map(h => <option key={h} value={h}>{String(h).padStart(2,"0")}</option>)}
              </select>
              <span style={{ color: "#555", lineHeight: "36px" }}>:</span>
              <select value={startM} onChange={e => setStartM(parseInt(e.target.value))} style={selectStyle}>
                {minuteOptions.map(m => <option key={m} value={m}>{String(m).padStart(2,"0")}</option>)}
              </select>
            </div>
          </div>
          <span style={{ color: "#555", paddingTop: 18 }}>→</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: "#555", marginBottom: 4 }}>Fin</div>
            <div style={{ display: "flex", gap: 4 }}>
              <select value={endH} onChange={e => setEndH(parseInt(e.target.value))} style={selectStyle}>
                {hourOptions.map(h => <option key={h} value={h}>{String(h).padStart(2,"0")}</option>)}
              </select>
              <span style={{ color: "#555", lineHeight: "36px" }}>:</span>
              <select value={endM} onChange={e => setEndM(parseInt(e.target.value))} style={selectStyle}>
                {minuteOptions.map(m => <option key={m} value={m}>{String(m).padStart(2,"0")}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "#555", marginBottom: 6 }}>Couleur</div>
          <div style={{ display: "flex", gap: 8 }}>
            {EVENT_COLORS.map(c => (
              <div key={c.id} onClick={() => setColor(c.hex)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: c.hex, border: color === c.hex ? "3px solid #fff" : "3px solid transparent", transition: "all .15s" }} />
                <div style={{ fontSize: 8, color: color === c.hex ? "#fff" : "#444" }}>{c.label}</div>
              </div>
            ))}
          </div>
        </div>

        {!isSingleEdit && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: "#555", marginBottom: 6 }}>Répéter</div>
            <select value={recurrenceType} onChange={e => setRecurrenceType(e.target.value)}
              style={{ ...selectStyle, width: "100%", marginBottom: recurrenceType === "custom" ? 8 : 0 }}>
              <option value="none">Ne pas répéter</option>
              <option value="daily">Tous les jours</option>
              <option value="weekly">Chaque semaine le {weeklyDayLabel}</option>
              <option value="weekdays">Du lundi au vendredi</option>
              <option value="custom">Personnalisé</option>
            </select>
            {recurrenceType === "custom" && (
              <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                {dayToggleNames.map((name, i) => (
                  <div key={i} onClick={() => toggleCustomDay(i)}
                    style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 700, cursor: "pointer", transition: "all .15s",
                      background: recurrenceDays.includes(i) ? "rgba(233,69,96,.2)" : "#0a0a1a",
                      border: `1px solid ${recurrenceDays.includes(i) ? "#e94560" : "#2a2a4a"}`,
                      color: recurrenceDays.includes(i) ? "#e94560" : "#555" }}>
                    {name}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optionnel)"
          style={{ width: "100%", minHeight: 50, marginBottom: 16, background: "#0a0a1a", border: "1px solid #2a2a4a", borderRadius: 12, color: "#fff", padding: 12, fontSize: 12, fontFamily: "'Outfit'", resize: "vertical", outline: "none", boxSizing: "border-box" }} />

        <div style={{ display: "flex", gap: 8 }}>
          {!event.isNew && (
            <button onClick={() => onDelete(event)} style={{ padding: "12px 16px", borderRadius: 12, border: "none", background: "rgba(233,69,96,.15)", color: "#e94560", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit'" }}>Supprimer</button>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #2a2a4a", background: "transparent", color: "#888", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit'" }}>Annuler</button>
          <button onClick={handleSave} style={{ padding: "12px 20px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#e94560,#c23152)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit'", opacity: title.trim() ? 1 : 0.5 }}>{event.isNew ? "Créer" : "Modifier"}</button>
        </div>
      </div>
    </div>
  );
}

// ---- WEIGHT FORM ----
function WeightForm({ weekNum, existing, onSave, onCancel, photoInputRef1, photoInputRef2 }) {
  const [poids, setPoids] = useState(existing?.poids || "");
  const [tourTaille, setTourTaille] = useState(existing?.tour_taille || "");
  const [energie, setEnergie] = useState(existing?.energie || 0);
  const [photos, setPhotos] = useState(existing?.photos || []);
  const [uploading, setUploading] = useState(false);

  const handlePhoto = async (file, index) => {
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file, 400, 0.6);
      setPhotos(prev => {
        const np = [...prev];
        np[index] = compressed;
        return np;
      });
    } catch (e) { console.error("Photo compression error:", e); }
    setUploading(false);
  };

  const handleSave = () => {
    if (!poids) return;
    onSave(weekNum, {
      poids: parseFloat(poids),
      tour_taille: tourTaille ? parseFloat(tourTaille) : null,
      energie,
      photos: photos.filter(Boolean),
    });
  };

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>⚖️ Pesée — Semaine {weekNum}</div>

      {/* Poids */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 20 }}>⚖️</span>
        <span style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>Poids (kg)</span>
        <input type="number" step="0.1" value={poids} placeholder="Ex: 78.5" onChange={e => setPoids(e.target.value)}
          style={{ width: 100, background: "#0a0a1a", border: "1px solid #1e1e4a", borderRadius: 10, padding: "8px 12px", color: "#ffeb3b", fontSize: 16, fontWeight: 700, fontFamily: "'Space Mono'", textAlign: "right", outline: "none" }} />
      </div>

      {/* Tour de taille */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 20 }}>📏</span>
        <span style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>Tour de taille (cm) <span style={{ color: "#555", fontWeight: 400 }}>optionnel</span></span>
        <input type="number" step="0.5" value={tourTaille} placeholder="-" onChange={e => setTourTaille(e.target.value)}
          style={{ width: 100, background: "#0a0a1a", border: "1px solid #1e1e4a", borderRadius: 10, padding: "8px 12px", color: "#4a90d9", fontSize: 16, fontWeight: 700, fontFamily: "'Space Mono'", textAlign: "right", outline: "none" }} />
      </div>

      {/* Énergie */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 20 }}>⚡</span>
        <span style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>Ressenti énergie</span>
        <div style={{ display: "flex", gap: 4 }}>
          {[1, 2, 3, 4, 5].map(n => (
            <span key={n} onClick={() => setEnergie(n)} style={{ fontSize: 22, cursor: "pointer", transition: "transform .15s", transform: n <= energie ? "scale(1.1)" : "scale(1)" }}>
              {n <= energie ? "⭐" : "☆"}
            </span>
          ))}
        </div>
      </div>

      {/* Photos */}
      <div style={{ paddingTop: 12, borderTop: "1px solid #1e1e4a", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 20 }}>📸</span>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Photos physique</span>
          {uploading && <span style={{ fontSize: 10, color: "#e94560", animation: "pulse 1s infinite" }}>Compression...</span>}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {["Face", "Profil"].map((label, idx) => (
            <div key={label} style={{ flex: 1 }}>
              <input ref={idx === 0 ? photoInputRef1 : photoInputRef2} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
                onChange={e => { if (e.target.files[0]) handlePhoto(e.target.files[0], idx); }} />
              {photos[idx] ? (
                <div style={{ position: "relative" }}>
                  <img src={photos[idx]} alt={label} style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 12, border: "2px solid #4caf50" }} />
                  <div onClick={() => (idx === 0 ? photoInputRef1 : photoInputRef2).current?.click()}
                    style={{ position: "absolute", bottom: 6, right: 6, background: "rgba(0,0,0,.7)", borderRadius: 8, padding: "3px 8px", fontSize: 10, color: "#fff", cursor: "pointer" }}>Changer</div>
                  <div style={{ position: "absolute", top: 6, left: 6, background: "rgba(76,175,80,.9)", borderRadius: 6, padding: "2px 6px", fontSize: 9, fontWeight: 700, color: "#fff" }}>{label} ✓</div>
                </div>
              ) : (
                <div onClick={() => (idx === 0 ? photoInputRef1 : photoInputRef2).current?.click()}
                  style={{ width: "100%", height: 120, borderRadius: 12, border: "2px dashed #1e1e4a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "#0a0a1a" }}>
                  <span style={{ fontSize: 24, opacity: .4 }}>📷</span>
                  <span style={{ fontSize: 10, color: "#555", marginTop: 4 }}>{label}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Boutons */}
      <div style={{ display: "flex", gap: 10 }}>
        {existing?.poids && (
          <button onClick={onCancel} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1px solid #1e1e4a", background: "transparent", color: "#888", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Annuler</button>
        )}
        <button onClick={handleSave} disabled={!poids}
          style={{ flex: 2, padding: "12px", borderRadius: 12, border: "none", background: poids ? "linear-gradient(135deg, #e94560, #c23152)" : "#1e1e4a", color: poids ? "#fff" : "#555", fontSize: 13, fontWeight: 700, cursor: poids ? "pointer" : "default", transition: "all .2s" }}>
          {existing?.poids ? "Mettre à jour" : "Enregistrer la pesée"} ⚖️
        </button>
      </div>
    </div>
  );
}

// ---- LOGIN SCREEN ----
function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error: err } = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    if (err) setError(err.message);
    setBusy(false);
  };

  return (
    <div style={{ fontFamily: "'Outfit',sans-serif", background: "#0a0a1a", minHeight: "100vh", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}body{background:#0a0a1a}`}</style>
      <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 360, padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>✈️🇮🇹</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Sèche Tracker</div>
          <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>{mode === "login" ? "Connexion" : "Créer un compte"}</div>
        </div>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required style={{ width: "100%", padding: "14px 16px", marginBottom: 10, borderRadius: 12, border: "1px solid #2a2a4a", background: "#0d0d24", color: "white", fontSize: 14, fontFamily: "'Outfit'", outline: "none" }} />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mot de passe" required minLength={6} style={{ width: "100%", padding: "14px 16px", marginBottom: 16, borderRadius: 12, border: "1px solid #2a2a4a", background: "#0d0d24", color: "white", fontSize: 14, fontFamily: "'Outfit'", outline: "none" }} />
        {error && <div style={{ color: "#e94560", fontSize: 12, marginBottom: 12, textAlign: "center" }}>{error}</div>}
        <button type="submit" disabled={busy} style={{ width: "100%", padding: "14px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#e94560,#c23152)", color: "white", fontSize: 15, fontWeight: 700, fontFamily: "'Outfit'", cursor: busy ? "wait" : "pointer", opacity: busy ? 0.6 : 1 }}>
          {busy ? "..." : mode === "login" ? "Se connecter" : "Créer le compte"}
        </button>
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <span onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }} style={{ color: "#e94560", fontSize: 12, cursor: "pointer" }}>
            {mode === "login" ? "Créer un compte" : "J'ai déjà un compte"}
          </span>
        </div>
      </form>
    </div>
  );
}

// ===== MAIN APP =====
export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [showUnlock, setShowUnlock] = useState(null);
  const [showRewardPopup, setShowRewardPopup] = useState(null);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerPreset, setTimerPreset] = useState(90);
  const timerRef = useRef(null);
  const [planWeekStart, setPlanWeekStart] = useState(() => getMonday(getToday()));
  const [planViewMode, setPlanViewMode] = useState("day");
  const [editingEvent, setEditingEvent] = useState(null);
  const [recurActionPrompt, setRecurActionPrompt] = useState(null);
  const [weightPhotoModal, setWeightPhotoModal] = useState(null);
  const [weightEditMode, setWeightEditMode] = useState(false);
  const [showSuppInfo, setShowSuppInfo] = useState(null);
  const [reapproEdit, setReapproEdit] = useState(null);
  const photoInputRef1 = useRef(null);
  const photoInputRef2 = useRef(null);

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => setSession(s)
    );
    return () => subscription.unsubscribe();
  }, []);

  // Load local data immediately
  useEffect(() => {
    const saved = storage.get(STORAGE_KEY);
    let d = saved || defaultData();
    if (!d.nutrition) {
      d.nutrition = { currentStage: 1, stageStartDate: "2026-02-23", cycleComplete: false };
    }
    d = migrateSuppsV2(d);
    storage.set(STORAGE_KEY, d);
    setData(d);
    setLoading(false);
  }, []);

  // Sync with Supabase when session becomes available
  useEffect(() => {
    if (!session || !data) return;
    syncOnLoad(data, session.user.id).then(synced => {
      if (synced && JSON.stringify(synced) !== JSON.stringify(data)) {
        // Preserve local planning data if remote doesn't have it
        if (!synced.planning && data.planning && Object.keys(data.planning).length > 0) {
          synced.planning = data.planning;
        }
        const migrated = migrateSuppsV2(synced);
        storage.set(STORAGE_KEY, migrated);
        setData(migrated);
      }
    });
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-sync when coming back online
  useEffect(() => {
    const handleOnline = () => {
      if (session && data) {
        debouncedPush(data, session.user.id, 100);
      }
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [session, data]);

  // Rest timer
  useEffect(() => {
    if (timerRunning && timerSeconds > 0) {
      timerRef.current = setTimeout(() => setTimerSeconds(s => s - 1), 1000);
    } else if (timerRunning && timerSeconds <= 0) {
      setTimerRunning(false);
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 880; gain.gain.value = 0.3;
        osc.start();
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0, ctx.currentTime + 0.45);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0, ctx.currentTime + 0.75);
        osc.stop(ctx.currentTime + 0.8);
      } catch (e) { /* audio not available */ }
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
    return () => clearTimeout(timerRef.current);
  }, [timerRunning, timerSeconds]);

  const save = useCallback((nd) => {
    setData(nd);
    storage.set(STORAGE_KEY, nd);
    if (session?.user?.id) {
      debouncedPush(nd, session.user.id);
    }
  }, [session]);

  const saveReappro = useCallback((suppId, purchaseDate, quantityDays) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.reappro) nd.reappro = {};
    nd.reappro[suppId] = { purchaseDate, quantityDays: parseInt(quantityDays) };
    save(nd);
    setReapproEdit(null);
  }, [data, save]);

  function getReapproAlerts() {
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

  const toggleItem = useCallback((cat, id, xpVal = 5) => {
    const dk = selectedDate;
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.days[dk]) nd.days[dk] = {};
    if (!nd.days[dk][cat]) nd.days[dk][cat] = {};
    const was = nd.days[dk][cat][id];
    nd.days[dk][cat][id] = !was;
    nd.totalXP = Math.max(0, nd.totalXP + (was ? -xpVal : xpVal));

    const oldCity = getCurrentCity(data.totalXP);
    const newCity = getCurrentCity(nd.totalXP);
    if (newCity.min > oldCity.min && !was) { setShowUnlock(newCity); setTimeout(() => setShowUnlock(null), 3500); }

    const streak = calcStreak(nd);
    if (streak > nd.bestStreak) nd.bestStreak = streak;
    if (!nd.seenRewards) nd.seenRewards = [];

    ACHIEVEMENT_REWARDS.forEach(r => {
      if (r.check(nd) && !nd.seenRewards.includes(r.id)) {
        setTimeout(() => { setShowRewardPopup(r); setTimeout(() => setShowRewardPopup(null), 4000); }, showUnlock ? 3600 : 300);
      }
    });
    save(nd);
  }, [data, selectedDate, save, showUnlock]);

  const markRewardSeen = useCallback((id) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.seenRewards) nd.seenRewards = [];
    if (!nd.seenRewards.includes(id)) { nd.seenRewards.push(id); save(nd); }
  }, [data, save]);

  const setSymptom = useCallback((s, v) => { const wk = `w${getWeekNumber(selectedDate)}`; const nd = JSON.parse(JSON.stringify(data)); if (!nd.weeks[wk]) nd.weeks[wk] = {}; if (!nd.weeks[wk].symptoms) nd.weeks[wk].symptoms = {}; nd.weeks[wk].symptoms[s] = v; save(nd); }, [data, selectedDate, save]);
  const setNaturo = useCallback((id, v) => { const wk = `w${getWeekNumber(selectedDate)}`; const nd = JSON.parse(JSON.stringify(data)); if (!nd.weeks[wk]) nd.weeks[wk] = {}; if (!nd.weeks[wk].naturo) nd.weeks[wk].naturo = {}; nd.weeks[wk].naturo[id] = v; save(nd); }, [data, selectedDate, save]);
  const setTemp = useCallback((slot, v) => { const nd = JSON.parse(JSON.stringify(data)); if (!nd.days[selectedDate]) nd.days[selectedDate] = {}; if (!nd.days[selectedDate].temp) nd.days[selectedDate].temp = {}; nd.days[selectedDate].temp[slot] = v; save(nd); }, [data, selectedDate, save]);
  const saveWeightEntry = useCallback((weekNum, entry) => {
    const wk = `w${weekNum}`;
    const nd = JSON.parse(JSON.stringify(data));
    nd.weight[wk] = { ...entry, date: getToday() };
    save(nd);
    setWeightEditMode(false);
  }, [data, save]);
  const setWeightData = useCallback((f, v) => { const wk = `w${getWeekNumber(selectedDate)}`; const nd = JSON.parse(JSON.stringify(data)); if (!nd.weight[wk]) nd.weight[wk] = {}; nd.weight[wk][f] = v; save(nd); }, [data, selectedDate, save]);

  // Stages are now automatic based on START_DATE — no manual set/restart needed

  const toggleSportSeries = useCallback((exerciseId, seriesIndex) => {
    const dk = selectedDate;
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.days[dk]) nd.days[dk] = {};
    if (!nd.days[dk].sport) nd.days[dk].sport = { exercises: {}, blocks: {} };
    if (!nd.days[dk].sport.exercises[exerciseId]) nd.days[dk].sport.exercises[exerciseId] = { series: [], reps: [] };
    const ex = nd.days[dk].sport.exercises[exerciseId];
    const was = ex.series[seriesIndex] || false;
    ex.series[seriesIndex] = !was;
    if (!was) { setTimerSeconds(timerPreset); setTimerRunning(true); }
    save(nd);
  }, [data, selectedDate, save, timerPreset]);

  const setSportReps = useCallback((exerciseId, seriesIndex, reps) => {
    const dk = selectedDate;
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.days[dk]) nd.days[dk] = {};
    if (!nd.days[dk].sport) nd.days[dk].sport = { exercises: {}, blocks: {} };
    if (!nd.days[dk].sport.exercises[exerciseId]) nd.days[dk].sport.exercises[exerciseId] = { series: [], reps: [] };
    nd.days[dk].sport.exercises[exerciseId].reps[seriesIndex] = reps;
    save(nd);
  }, [data, selectedDate, save]);

  const toggleSportBlock = useCallback((blockId) => {
    const dk = selectedDate;
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.days[dk]) nd.days[dk] = {};
    if (!nd.days[dk].sport) nd.days[dk].sport = { exercises: {}, blocks: {} };
    const was = nd.days[dk].sport.blocks[blockId] || false;
    nd.days[dk].sport.blocks[blockId] = !was;
    save(nd);
  }, [data, selectedDate, save]);

  const setSportNotes = useCallback((notes) => {
    const dk = selectedDate;
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.days[dk]) nd.days[dk] = {};
    if (!nd.days[dk].sport) nd.days[dk].sport = { exercises: {}, blocks: {} };
    nd.days[dk].sport.notes = notes;
    save(nd);
  }, [data, selectedDate, save]);

  const saveEvent = useCallback((event) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.planning) nd.planning = {};
    const id = event.id || Date.now().toString(36);
    if (event._editMode === "single" && event._occurrenceDate) {
      // Save as exception override on the template
      const template = nd.planning[id];
      if (template) {
        if (!template.exceptions) template.exceptions = {};
        const { id: _id, isNew: _isNew, _editMode: _em, _occurrenceDate: _od, _isRecurring: _ir, recurrence: _rec, exceptions: _ex, date: _date, ...overrides } = event;
        template.exceptions[event._occurrenceDate] = overrides;
      }
    } else {
      // Save template normally, preserve existing exceptions
      const existingExceptions = nd.planning[id]?.exceptions;
      const { id: _id, isNew: _isNew, _editMode: _em, _occurrenceDate: _od, _isRecurring: _ir, ...eventData } = event;
      nd.planning[id] = eventData;
      if (existingExceptions) nd.planning[id].exceptions = existingExceptions;
    }
    save(nd);
    setEditingEvent(null);
  }, [data, save]);

  const deleteEvent = useCallback((event) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.planning) { setEditingEvent(null); return; }
    if (event._isRecurring) {
      // Show the recurrence action prompt
      setEditingEvent(null);
      setRecurActionPrompt({ event, action: "delete" });
      return;
    }
    delete nd.planning[event.id];
    save(nd);
    setEditingEvent(null);
  }, [data, save]);

  const deleteEventConfirmed = useCallback((event, mode) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.planning) return;
    if (mode === "single" && event._occurrenceDate) {
      const template = nd.planning[event.id];
      if (template) {
        if (!template.exceptions) template.exceptions = {};
        template.exceptions[event._occurrenceDate] = "deleted";
      }
    } else {
      delete nd.planning[event.id];
    }
    save(nd);
    setRecurActionPrompt(null);
  }, [data, save]);

  const navigatePlanWeek = useCallback((dir) => {
    const d = new Date(planWeekStart);
    d.setDate(d.getDate() + dir * 7);
    setPlanWeekStart(d.toISOString().split("T")[0]);
  }, [planWeekStart]);

  function calcStreak(d) {
    let streak = 0; const today = new Date(getToday());
    for (let i = 0; i < 60; i++) { const dt = new Date(today); dt.setDate(dt.getDate() - i); const k = dt.toISOString().split("T")[0]; const dd = d.days[k]; if (!dd) break; const h = dd.habits ? Object.values(dd.habits).filter(Boolean).length : 0; const m = dd.meals ? Object.values(dd.meals).filter(Boolean).length : 0; if (h + m >= 8) streak++; else break; }
    return streak;
  }

  function calcSuppsStreak(d) {
    let streak = 0; const today = new Date(getToday());
    const expected = getSuppsForStage(d.nutrition?.currentStage || 1).length;
    for (let i = 0; i < 120; i++) { const dt = new Date(today); dt.setDate(dt.getDate() - i); const k = dt.toISOString().split("T")[0]; const dd = d.days[k]; if (!dd?.supps) break; const checked = Object.values(dd.supps).filter(Boolean).length; if (checked >= expected) streak++; else break; }
    return streak;
  }

  function getDayScore(dk) {
    const day = data?.days?.[dk]; if (!day) return 0; let total = 0, done = 0;
    HABITS.filter(h => !h.weekly).forEach(() => total++); getMealsForStage(data?.nutrition?.currentStage || 1).forEach(() => total++); getSuppsForStage(data?.nutrition?.currentStage || 1).forEach(() => total++);
    if (day.habits) Object.values(day.habits).forEach(v => { if (v) done++; }); if (day.meals) Object.values(day.meals).forEach(v => { if (v) done++; }); if (day.supps) Object.values(day.supps).forEach(v => { if (v) done++; });
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }

  function getWeightChartData() {
    const d = [];
    const maxWeek = Math.max(...Object.keys(data.weight || {}).map(k => parseInt(k.replace("w", "")) || 0), 0);
    for (let w = 1; w <= Math.max(maxWeek, 20); w++) {
      const wk = data.weight[`w${w}`];
      if (wk?.poids) d.push({ name: `S${w}`, poids: parseFloat(wk.poids), week: w });
    }
    return d;
  }
  function getSymptomRadarData() { const wk = `w${getWeekNumber(selectedDate)}`; const syms = data.weeks[wk]?.symptoms || {}; return SYMPTOMS.slice(0, 8).map(s => ({ subject: s, value: syms[s] ?? 0, fullMark: 10 })); }
  function getTempChartData() { const d = []; const start = new Date(START_DATE); for (let i = 0; i < 30; i++) { const dt = new Date(start); dt.setDate(dt.getDate() + i); const k = dt.toISOString().split("T")[0]; const t = data.days[k]?.temp; if (t && (t.reveil || t.apres_repas || t.aprem)) d.push({ name: `J${i + 1}`, reveil: t.reveil ? parseFloat(t.reveil) : null, apres: t.apres_repas ? parseFloat(t.apres_repas) : null, aprem: t.aprem ? parseFloat(t.aprem) : null }); } return d; }

  function countUnlocked() { let n = 0; WEEKLY_REWARDS.forEach(r => { if (isWeekComplete(data, r.week)) n++; }); ACHIEVEMENT_REWARDS.forEach(r => { if (r.check(data)) n++; }); return n; }
  function countNew() { let n = 0; ACHIEVEMENT_REWARDS.forEach(r => { if (r.check(data) && !(data.seenRewards || []).includes(r.id)) n++; }); return n; }

  if (authLoading || loading || !data) return (<div style={{ background: "#0a0a1a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Outfit'" }}><div style={{ color: "#e94560", fontSize: 24 }}>✈️</div></div>);

  if (!session) return <LoginScreen />;

  const programNotStarted = new Date(getToday()) < new Date(START_DATE);
  const daysUntilProgram = programNotStarted ? Math.ceil((new Date(START_DATE) - new Date(getToday())) / 86400000) : 0;
  const avatarStage = getAvatarStage(data.totalXP);
  const currentCity = getCurrentCity(data.totalXP);
  const nextCity = getNextCity(data.totalXP);
  const streak = programNotStarted ? 0 : calcStreak(data);
  const dayNum = Math.max(1, Math.min(getDayNumber(getToday()), 30));
  const dayScore = programNotStarted ? 0 : getDayScore(selectedDate);
  const dayData = data.days[selectedDate] || {};
  const weekKey = `w${getWeekNumber(selectedDate)}`;
  const weekData = data.weeks[weekKey] || {};
  const unlockedCount = programNotStarted ? 0 : countUnlocked();
  const newCount = programNotStarted ? 0 : countNew();
  const totalRewards = WEEKLY_REWARDS.length + ACHIEVEMENT_REWARDS.length;

  const navigateDay = (dir) => { const d = new Date(selectedDate); d.setDate(d.getDate() + dir); setSelectedDate(d.toISOString().split("T")[0]); };
  const dateLabel = (() => { const d = new Date(selectedDate); return `${["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"][d.getDay()]} ${d.getDate()} ${["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"][d.getMonth()]}`; })();

  const tabs = [
    { id: "dashboard", label: "🏠", name: "Home" },
    { id: "habits", label: "✅", name: "Habitudes" },
    { id: "sport", label: "💪", name: "Sport" },
    { id: "planning", label: "📅", name: "Plan" },
    { id: "food", label: "🍽️", name: "Repas" },
    { id: "supps", label: "💊", name: "Suppl." },
    { id: "health", label: "🩺", name: "Santé" },
    { id: "rewards", label: "🎁", name: "Cadeaux", badge: newCount },
    { id: "stats", label: "📊", name: "Stats" },
    { id: "weight", label: "⚖️", name: "Poids" },
  ];

  return (
    <div className="app-root" style={{ fontFamily: "'Outfit',sans-serif", background: "#0a0a1a", minHeight: "100vh", color: "white", maxWidth: 480, margin: "0 auto", paddingBottom: 80, position: "relative", WebkitOverflowScrolling: "touch" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}body{background:#0a0a1a}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#e94560;border-radius:2px}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes unlockPop{0%{transform:scale(0) rotate(-10deg);opacity:0}60%{transform:scale(1.15) rotate(3deg)}100%{transform:scale(1) rotate(0);opacity:1}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}
        @keyframes confettiDrop{0%{opacity:1;transform:translateY(0) rotate(0)}100%{opacity:0;transform:translateY(80px) rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes rewardSlide{0%{transform:translateY(100%) scale(.8);opacity:0}50%{transform:translateY(-10%) scale(1.05)}100%{transform:translateY(0) scale(1);opacity:1}}
        @keyframes sparkle{0%,100%{opacity:0;transform:scale(0) rotate(0)}50%{opacity:1;transform:scale(1) rotate(180deg)}}
        .card{background:linear-gradient(145deg,#0d0d24,#151535);border:1px solid #1e1e4a;border-radius:20px;padding:20px;animation:slideUp .4s ease}
        .ci{display:flex;align-items:center;gap:12px;padding:14px;border-radius:14px;cursor:pointer;transition:all .15s;border:1px solid transparent;user-select:none;-webkit-tap-highlight-color:transparent}
        .ci:active{transform:scale(.98)}.ci.done{background:rgba(76,175,80,.08);border-color:rgba(76,175,80,.25)}
        .cb{width:28px;height:28px;border-radius:8px;border:2px solid #3a3a5a;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s;font-size:14px;font-weight:700;color:white}
        .ci.done .cb{background:linear-gradient(135deg,#4caf50,#2e7d32);border-color:#4caf50}
        .xp{background:linear-gradient(135deg,#e94560,#c23152);padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;color:white;font-family:'Space Mono',monospace}
        .tb{flex:1;padding:8px 2px;border:none;background:transparent;color:#555;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:8px;font-family:'Outfit';transition:all .2s;border-radius:12px;position:relative;-webkit-tap-highlight-color:transparent}
        .tb.active{color:#e94560;background:rgba(233,69,96,.12)}
        .na{width:40px;height:40px;border-radius:12px;border:1px solid #2a2a4a;background:#0d0d24;color:white;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;transition:all .15s;-webkit-tap-highlight-color:transparent}
        .na:active{transform:scale(.95);border-color:#e94560}
        .plan-cell{cursor:pointer;transition:background .12s;-webkit-tap-highlight-color:transparent}.plan-cell:hover{background:rgba(233,69,96,.1)!important}.plan-cell:active{background:rgba(233,69,96,.18)!important}
        input[type=number],input[type=text]{background:#0d0d24;border:1px solid #2a2a4a;border-radius:10px;color:white;padding:10px 12px;font-family:'Space Mono';font-size:14px;width:80px;text-align:center;outline:none;-webkit-appearance:none}
        input:focus,textarea:focus{border-color:#e94560!important}
        textarea{-webkit-appearance:none;font-family:'Outfit',sans-serif}
        select{-webkit-appearance:none;appearance:none;color-scheme:dark}
        input[type=date]{color-scheme:dark}
        .recharts-text{fill:#888!important;font-size:10px!important}
        @media(min-width:769px){
          .app-root{max-width:1200px!important;padding-bottom:0!important;display:flex!important;flex-direction:row!important}
          .main-col{flex:1!important;min-width:0!important;display:flex!important;flex-direction:column!important;overflow-y:auto!important;height:100vh!important}
          .app-header{padding:16px 32px 20px!important}
          .nav-outer{position:sticky!important;top:0!important;bottom:auto!important;left:auto!important;right:auto!important;width:220px!important;min-width:220px!important;height:100vh!important;background:#0a0a1a!important;padding:24px 12px!important;border-right:1px solid #1e1e4a!important;overflow-y:auto!important;order:-1!important;z-index:50!important}
          .nav-inner{flex-direction:column!important;gap:4px!important;max-width:none!important;background:transparent!important;border:none!important;border-radius:0!important;padding:0!important}
          .nav-inner .tb{flex-direction:row!important;justify-content:flex-start!important;padding:12px 14px!important;font-size:13px!important;gap:10px!important;border-radius:12px!important}
          .nav-inner .tb span:first-child{font-size:18px!important}
          .nav-inner .tb.active{background:rgba(233,69,96,.15)!important}
          .nav-inner .tb:hover:not(.active){background:rgba(255,255,255,.04)!important;color:#999!important}
          .content-area{flex:1!important;padding:0 32px 32px!important;min-width:0!important}
          .tab-grid{display:grid!important;grid-template-columns:repeat(2,1fr)!important;gap:16px!important}
          .tab-grid>.card:first-child{grid-column:1/-1}
          .card{padding:24px!important;border-radius:22px!important}
          .card:hover{border-color:#2a2a5a!important;box-shadow:0 4px 24px rgba(233,69,96,.06)!important}
          .ci{padding:16px!important}
          .ci:hover{background:rgba(255,255,255,.03)!important;border-color:rgba(255,255,255,.06)!important}
          .ci:active{transform:scale(.995)!important}
          .na:hover{border-color:#e94560!important;background:rgba(233,69,96,.08)!important}
          .xp{font-size:11px!important;padding:3px 10px!important}
        }
        @media(min-width:1100px){
          .tab-grid{grid-template-columns:repeat(3,1fr)!important}
          .tab-grid>.card:first-child{grid-column:1/-1}
        }
      `}</style>

      {/* CITY UNLOCK */}
      {showUnlock && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.92)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", animation: "unlockPop .5s ease" }}>
          {[...Array(12)].map((_, i) => (<div key={i} style={{ position: "absolute", left: `${10 + Math.random() * 80}%`, top: `${20 + Math.random() * 40}%`, fontSize: 20, animation: `confettiDrop ${1 + Math.random()}s ease ${Math.random() * .5}s infinite` }}>{"🎉⭐🔥✨💪🇮🇹"[i % 6] || "🎉"}</div>))}
          <div style={{ fontSize: 60, marginBottom: 8 }}>{showUnlock.emoji}</div>
          <div style={{ fontSize: 28, fontWeight: 900, background: "linear-gradient(135deg,#e94560,#ffeb3b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>VILLE DÉBLOQUÉE!</div>
          <div style={{ fontSize: 20, color: "#ccc", marginTop: 4 }}>{showUnlock.name}</div>
        </div>
      )}

      {/* REWARD POPUP */}
      {showRewardPopup && !showUnlock && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.92)", zIndex: 998, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", animation: "rewardSlide .6s ease" }}>
          {[...Array(8)].map((_, i) => (<div key={i} style={{ position: "absolute", left: `${15 + Math.random() * 70}%`, top: `${25 + Math.random() * 50}%`, fontSize: 16, animation: `sparkle ${1.5 + Math.random()}s ease ${Math.random() * .8}s infinite` }}>✨</div>))}
          <div style={{ fontSize: 14, color: "#ffeb3b", fontWeight: 700, letterSpacing: 3, marginBottom: 12, fontFamily: "'Space Mono'" }}>🎁 CADEAU DÉBLOQUÉ 🎁</div>
          <div style={{ width: 80, height: 80, borderRadius: 20, background: "linear-gradient(135deg,#e94560,#c23152)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, boxShadow: "0 8px 40px rgba(233,69,96,.4)", marginBottom: 16 }}>{showRewardPopup.emoji}</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{showRewardPopup.title}</div>
          <div style={{ fontSize: 13, color: "#999", maxWidth: 280, textAlign: "center" }}>{showRewardPopup.desc}</div>
        </div>
      )}


      {/* SUPPLEMENT INFO MODAL */}
      {showSuppInfo && (
        <div onClick={() => setShowSuppInfo(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 999, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 0 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "linear-gradient(145deg,#0d0d24,#151535)", border: "1px solid #1e1e4a", borderRadius: "20px 20px 0 0", padding: 24, width: "100%", maxWidth: 480, animation: "slideUp .3s ease", maxHeight: "70vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `${(SUPP_TIMING_GROUPS.find(g => g.id === showSuppInfo.timing) || {}).color || "#e94560"}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{showSuppInfo.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{showSuppInfo.label}</div>
                <div style={{ fontSize: 11, color: "#888" }}>{showSuppInfo.brand}</div>
              </div>
              <div onClick={() => setShowSuppInfo(null)} style={{ fontSize: 18, color: "#555", cursor: "pointer", padding: 4 }}>✕</div>
            </div>
            {[
              { label: "Dosage", value: showSuppInfo.dosage },
              { label: "Timing", value: (SUPP_TIMING_GROUPS.find(g => g.id === showSuppInfo.timing) || {}).label || "" },
              { label: "Prix/mois", value: showSuppInfo.price > 0 ? `${showSuppInfo.price.toFixed(2)}€` : "Inclus" },
              showSuppInfo.secheOnly ? { label: "Phase", value: "Sèche uniquement" } : null,
            ].filter(Boolean).map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1a1a2e", fontSize: 12 }}>
                <span style={{ color: "#888" }}>{item.label}</span>
                <span style={{ fontWeight: 600 }}>{item.value}</span>
              </div>
            ))}
            <div style={{ marginTop: 12, padding: 12, background: "rgba(255,235,59,.05)", borderRadius: 12, fontSize: 12, color: "#ccc", lineHeight: 1.5 }}>
              💡 {showSuppInfo.info}
            </div>
            <div onClick={() => { setReapproEdit({ suppId: showSuppInfo.id, purchaseDate: getToday(), quantityDays: 30 }); setShowSuppInfo(null); }}
              style={{ marginTop: 16, textAlign: "center", padding: "12px 0", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", background: "rgba(255,255,255,.06)", border: "1px solid #2a2a4a", color: "#888" }}>
              📦 Enregistrer un achat
            </div>
          </div>
        </div>
      )}

      {/* REAPPRO EDIT MODAL */}
      {reapproEdit && (
        <div onClick={() => setReapproEdit(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "linear-gradient(145deg,#0d0d24,#151535)", border: "1px solid #1e1e4a", borderRadius: 20, padding: 20, width: "100%", maxWidth: 340, animation: "slideUp .3s ease" }}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>📦 Enregistrer un achat</div>
            {!reapproEdit.suppId ? (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>Supplément</div>
                {SUPPS_DETAILED.map(s => (
                  <div key={s.id} onClick={() => setReapproEdit({ ...reapproEdit, suppId: s.id })}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10, cursor: "pointer", fontSize: 12, marginBottom: 2, background: "rgba(255,255,255,.03)", border: "1px solid #1a1a2e" }}>
                    <span>{s.emoji}</span> <span>{s.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  {(SUPPS_DETAILED.find(s => s.id === reapproEdit.suppId) || {}).emoji} {(SUPPS_DETAILED.find(s => s.id === reapproEdit.suppId) || {}).label}
                </div>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Date d'achat</div>
                <input type="date" value={reapproEdit.purchaseDate} onChange={e => setReapproEdit({ ...reapproEdit, purchaseDate: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #2a2a4a", background: "#0a0a1a", color: "#fff", fontSize: 13, fontFamily: "'Space Mono'", marginBottom: 12, boxSizing: "border-box" }} />
                <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Durée du stock (jours)</div>
                <input type="number" value={reapproEdit.quantityDays} onChange={e => setReapproEdit({ ...reapproEdit, quantityDays: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #2a2a4a", background: "#0a0a1a", color: "#fff", fontSize: 13, fontFamily: "'Space Mono'", boxSizing: "border-box" }} />
                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  <div onClick={() => { if (reapproEdit.suppId) saveReappro(reapproEdit.suppId, reapproEdit.purchaseDate, reapproEdit.quantityDays); }}
                    style={{ flex: 1, padding: "12px 0", borderRadius: 12, textAlign: "center", fontSize: 14, fontWeight: 700, cursor: "pointer", background: "linear-gradient(135deg,#e94560,#c23152)", color: "#fff" }}>
                    Sauvegarder
                  </div>
                  <div onClick={() => setReapproEdit(null)}
                    style={{ padding: "12px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer", background: "rgba(255,255,255,.06)", color: "#888" }}>
                    Annuler
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* REST TIMER FLOATING */}
      <RestTimer seconds={timerSeconds} running={timerRunning} preset={timerPreset}
        onStop={() => setTimerRunning(false)} onDismiss={() => { setTimerSeconds(0); setTimerRunning(false); }} />

      {/* EVENT MODAL */}
      {editingEvent && <EventModal event={editingEvent} onSave={saveEvent} onDelete={deleteEvent} onClose={() => setEditingEvent(null)} />}

      {/* RECURRENCE ACTION DIALOG */}
      {recurActionPrompt && (
        <div onClick={() => setRecurActionPrompt(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 998, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "linear-gradient(145deg,#0d0d24,#151535)", border: "1px solid #1e1e4a", borderRadius: 20, padding: 24, width: "100%", maxWidth: 320, animation: "slideUp .3s ease" }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>
              {recurActionPrompt.action === "delete" ? "Supprimer l'événement" : "Modifier l'événement"}
            </div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 20 }}>
              Cet événement est récurrent.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={() => {
                const evt = recurActionPrompt.event;
                if (recurActionPrompt.action === "delete") {
                  deleteEventConfirmed(evt, "single");
                } else {
                  setRecurActionPrompt(null);
                  setEditingEvent({ ...evt, isNew: false, _editMode: "single" });
                }
              }} style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #2a2a4a", background: "rgba(74,144,217,.1)", color: "#4a90d9", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit'", textAlign: "left" }}>
                Cet événement uniquement
              </button>
              <button onClick={() => {
                const evt = recurActionPrompt.event;
                if (recurActionPrompt.action === "delete") {
                  deleteEventConfirmed(evt, "all");
                } else {
                  setRecurActionPrompt(null);
                  setEditingEvent({ ...evt, isNew: false });
                }
              }} style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #2a2a4a", background: "rgba(233,69,96,.1)", color: "#e94560", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit'", textAlign: "left" }}>
                Tous les événements
              </button>
              <button onClick={() => setRecurActionPrompt(null)}
                style={{ padding: "10px 16px", borderRadius: 12, border: "none", background: "transparent", color: "#555", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit'" }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT COLUMN */}
      <div className="main-col">

      {/* HEADER */}
      <div className="app-header" style={{ background: "linear-gradient(180deg,#e94560 0%,#0a0a1a 100%)", padding: "max(env(safe-area-inset-top), 16px) 16px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.5)", fontFamily: "'Space Mono'", letterSpacing: 3, textTransform: "uppercase" }}>Destination</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>🇮🇹 Rome avec ma copine</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "'Space Mono'", color: "#ffeb3b" }}>{dayNum}<span style={{ fontSize: 13, color: "rgba(255,255,255,.3)" }}>/30</span></div>
            <div onClick={() => supabase.auth.signOut()} style={{ fontSize: 9, color: "rgba(255,255,255,.3)", cursor: "pointer", marginTop: 2 }}>Déconnexion</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,.3)", borderRadius: 12, padding: "8px 12px" }}>
          <div style={{ fontSize: 22 }}>{currentCity.emoji}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 12, fontWeight: 700 }}>{currentCity.name}</span>
              <span style={{ fontSize: 11, fontFamily: "'Space Mono'", color: "#e94560" }}>{data.totalXP} XP</span>
            </div>
            <div style={{ height: 5, background: "rgba(255,255,255,.08)", borderRadius: 3 }}>
              <div style={{ width: `${nextCity ? ((data.totalXP - currentCity.min) / (nextCity.min - currentCity.min)) * 100 : 100}%`, height: "100%", background: "linear-gradient(90deg,#e94560,#ff6b81)", borderRadius: 3, transition: "width .5s" }} />
            </div>
            {nextCity && <div style={{ fontSize: 9, color: "rgba(255,255,255,.35)", marginTop: 2 }}>{nextCity.min - data.totalXP} XP → {nextCity.name} {nextCity.emoji}</div>}
          </div>
        </div>
      </div>

      {/* MONDAY WEIGH-IN REMINDER */}
      {isMonday(getToday()) && !data.weight[`w${getWeekNumber(getToday())}`]?.poids && (
        <div onClick={() => setTab("weight")} style={{ margin: "0 16px", padding: "10px 16px", borderRadius: 12, background: "linear-gradient(135deg, rgba(233,69,96,.15), rgba(255,235,59,.1))", border: "1px solid rgba(233,69,96,.3)", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", animation: "slideUp .4s ease" }}>
          <span style={{ fontSize: 22 }}>📸</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#e94560" }}>C'est le jour de la pesée !</div>
            <div style={{ fontSize: 10, color: "#888" }}>Enregistre ton poids et tes photos</div>
          </div>
          <span style={{ marginLeft: "auto", fontSize: 16, color: "#e94560" }}>→</span>
        </div>
      )}

      {/* DATE NAV */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, padding: "10px 16px" }}>
        <button className="na" onClick={() => navigateDay(-1)}>←</button>
        <div style={{ textAlign: "center", minWidth: 120 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{dateLabel}</div>
          {selectedDate === getToday() && <div style={{ fontSize: 9, color: "#4caf50", fontWeight: 700, letterSpacing: 1 }}>AUJOURD'HUI</div>}
        </div>
        <button className="na" onClick={() => navigateDay(1)}>→</button>
      </div>

      {/* STATS */}
      <div style={{ display: "flex", gap: 6, padding: "0 16px 12px" }}>
        {[{ label: "Score", value: `${dayScore}%`, color: dayScore >= 80 ? "#4caf50" : dayScore >= 50 ? "#ff9800" : "#e94560" }, { label: "Streak", value: `${streak}🔥`, color: "#ff9800" }, { label: "Cadeaux", value: `${unlockedCount}/${totalRewards}`, color: "#ffeb3b" }].map((s, i) => (
          <div key={i} style={{ flex: 1, background: "#0d0d24", border: "1px solid #1e1e4a", borderRadius: 14, padding: "8px 6px", textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "#555" }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Space Mono'", color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="content-area" style={{ padding: "0 16px" }}>

        {tab === "dashboard" && (<div className="tab-grid" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {programNotStarted && (
            <div className="card" style={{ textAlign: "center", padding: "32px 20px", background: "linear-gradient(145deg, rgba(233,69,96,.12), rgba(255,235,59,.06))", border: "1px solid rgba(233,69,96,.3)" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🚀</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: 1 }}>DÉBUT DU PROGRAMME</div>
              <div style={{ fontSize: 64, fontWeight: 900, fontFamily: "'Space Mono'", color: "#e94560", margin: "8px 0" }}>
                {daysUntilProgram}<span style={{ fontSize: 20, color: "#888" }}> jour{daysUntilProgram > 1 ? "s" : ""}</span>
              </div>
              <div style={{ fontSize: 14, color: "#ffeb3b", fontWeight: 700 }}>Lundi 23 Février 2026</div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 8 }}>Prépare-toi, le voyage Paris → Rome commence bientôt !</div>
            </div>
          )}
          <div className="card" style={{ padding: 12 }}><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>🗺️ Paris → Rome</div><MapSVG xp={data.totalXP} /></div>
          <div className="card" style={{ textAlign: "center", padding: "16px 20px" }}><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>👤 Ma transformation</div><div style={{ fontSize: 10, color: "#888", marginBottom: 8 }}>{avatarStage.label}</div><div style={{ animation: "breathe 3s ease infinite" }}><AvatarSVG stage={avatarStage} size={140} /></div><div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 8 }}>{AVATAR_STAGES.map((s, i) => (<div key={i} style={{ width: 8, height: 8, borderRadius: 4, background: data.totalXP >= s.min ? "#e94560" : "#1e1e4a", transition: "all .3s" }} />))}</div></div>
          {(() => { const nw = WEEKLY_REWARDS.find(r => !isWeekComplete(data, r.week)); const na = ACHIEVEMENT_REWARDS.find(r => !r.check(data)); const next = nw || na; if (!next) return null; return (<div className="card" style={{ padding: 14, cursor: "pointer", border: "1px solid #2a1a4a" }} onClick={() => setTab("rewards")}><div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 44, height: 44, borderRadius: 12, background: "#111", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🔒</div><div style={{ flex: 1 }}><div style={{ fontSize: 11, color: "#ffeb3b", fontWeight: 700 }}>Prochain cadeau</div><div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{next.condition || `Semaine ${next.week} — Score ≥ 70%`}</div></div><div style={{ fontSize: 18, color: "#444" }}>→</div></div></div>); })()}
          <div className="card"><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>📅 Planning</div>{(() => { const dow = new Date(selectedDate).getDay(); const s = SPORT_DAYS[dow]; const label = `${s.emoji} ${s.label}${s.subtitle ? " — " + s.subtitle : ""}`; return (<div style={{ display: "flex", gap: 6 }}>{[{ t: "☀️", v: label }, { t: "🌙", v: "Souplesse 60min" }].map((x, i) => (<div key={i} style={{ flex: 1, background: "#0a0a1a", borderRadius: 12, padding: "10px 12px", border: "1px solid #1e1e4a", cursor: i === 0 ? "pointer" : "default" }} onClick={i === 0 ? () => setTab("sport") : undefined}><div style={{ fontSize: 16, marginBottom: 4 }}>{x.t}</div><div style={{ fontSize: 12, fontWeight: 600 }}>{x.v}</div></div>))}</div>); })()}</div>
          {(() => { const ds = getCurrentNutritionStage(); return (<div className="card"><div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 8 }}><span style={{ fontSize: 12 }}>{ds.stageInfo.emoji}</span><span style={{ fontSize: 11, fontWeight: 700, color: ds.stageInfo.color }}>Étape {ds.stage}/4 — {ds.stageInfo.name}</span></div><div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>{[{ l: "Glucides", v: ds.stageInfo.macros.glucides, c: "#ffeb3b" }, { l: "Protéines", v: ds.stageInfo.macros.proteines, c: "#e94560" }, { l: "Lipides", v: ds.stageInfo.macros.lipides, c: "#4caf50" }].map((m, i) => (<div key={i}><div style={{ width: 48, height: 48, borderRadius: "50%", border: `2.5px solid ${m.c}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 4px", fontSize: 13, fontWeight: 800, fontFamily: "'Space Mono'" }}>{m.v}</div><div style={{ fontSize: 10, color: "#666" }}>{m.l}</div></div>))}</div><div style={{ textAlign: "center", marginTop: 10, fontSize: 18, fontWeight: 900, fontFamily: "'Space Mono'", color: ds.stageInfo.color }}>{ds.stageInfo.kcal.toLocaleString("fr-FR")} kcal</div></div>); })()}
        </div>)}

        {tab === "habits" && (programNotStarted ? (
          <div className="card" style={{ textAlign: "center", padding: "32px 20px" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🚀</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#ffeb3b" }}>Début dans {daysUntilProgram} jour{daysUntilProgram > 1 ? "s" : ""}</div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Lundi 23 Février 2026</div>
          </div>
        ) : (
          <div className="card"><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>✅ Habitudes du jour</div>{HABITS.map(h => { const done = dayData.habits?.[h.id] || false; return (<div key={h.id} className={`ci ${done ? "done" : ""}`} onClick={() => toggleItem("habits", h.id, h.xp)}><div className="cb">{done ? "✓" : ""}</div><span style={{ fontSize: 18 }}>{h.emoji}</span><span style={{ flex: 1, fontSize: 13, fontWeight: done ? 600 : 400 }}>{h.label}</span><span className="xp">+{h.xp}</span></div>); })}</div>
        ))}

        {tab === "planning" && (() => {
          const today = getToday();
          const weekDates = getWeekDates(planWeekStart);
          const isCurrentWeek = planWeekStart === getMonday(today);
          const dayNames = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
          const isDesktop = typeof window !== "undefined" && window.innerWidth >= 769;
          const effectiveView = isDesktop ? "week" : planViewMode;

          const openNewEvent = (dateStr, hour) => {
            console.log("cellule cliquée", dateStr, hour);
            setEditingEvent({ isNew: true, date: dateStr, startH: hour, startM: 0, endH: Math.min(hour + 1, 23), endM: 0, color: EVENT_COLORS[0].hex, title: "", notes: "", recurrence: null });
          };

          const renderEventBlock = (evt, isWeekView) => {
            const { top, height } = getEventPosition(evt);
            const handleClick = (e) => {
              e.stopPropagation();
              if (evt._isRecurring) {
                setRecurActionPrompt({ event: evt, action: "edit" });
              } else {
                setEditingEvent({ ...evt, isNew: false });
              }
            };
            return (
              <div key={`${evt.id}-${evt._occurrenceDate}`} onClick={handleClick}
                style={{ position: "absolute", top, left: isWeekView ? 2 : 48, right: isWeekView ? 2 : 8, height,
                  background: `${evt.color}22`, borderLeft: `${isWeekView ? 3 : 4}px solid ${evt.color}`,
                  borderRadius: isWeekView ? 6 : 8, padding: isWeekView ? "2px 4px" : "6px 10px",
                  cursor: "pointer", overflow: "hidden", zIndex: 10 }}>
                <div style={{ fontSize: isWeekView ? 9 : 12, fontWeight: 700, color: evt.color, lineHeight: 1.2 }}>
                  {evt._isRecurring && !isWeekView && <span style={{ opacity: 0.5, marginRight: 4 }}>🔄</span>}
                  {evt.title}
                </div>
                {height > (isWeekView ? 30 : 24) && (
                  <div style={{ fontSize: isWeekView ? 8 : 10, color: "#888" }}>
                    {evt.startH}:{String(evt.startM).padStart(2,"0")} — {evt.endH}:{String(evt.endM).padStart(2,"0")}
                  </div>
                )}
                {!isWeekView && evt.notes && height > 50 && <div style={{ fontSize: 9, color: "#555", marginTop: 2 }}>{evt.notes}</div>}
              </div>
            );
          };

          const renderTimeLine = (leftOffset) => {
            const now = new Date();
            const nowH = now.getHours(), nowM = now.getMinutes();
            if (nowH < 6 || nowH > 23) return null;
            const topPx = ((nowH - 6) * 60 + nowM) / 60 * HOUR_HEIGHT;
            return (
              <div style={{ position: "absolute", top: topPx, left: leftOffset, right: 0, height: 2, background: "#e94560", zIndex: 20, pointerEvents: "none" }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: "#e94560", position: "absolute", left: -4, top: -3 }} />
              </div>
            );
          };

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

              {/* WEEK NAVIGATION */}
              <div className="card" style={{ padding: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <button className="na" onClick={() => navigatePlanWeek(-1)}>←</button>
                  <div style={{ textAlign: "center", fontSize: 13, fontWeight: 700 }}>{formatWeekRange(weekDates)}</div>
                  <button className="na" onClick={() => navigatePlanWeek(1)}>→</button>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 8, justifyContent: "center" }}>
                  {!isCurrentWeek && (
                    <div onClick={() => setPlanWeekStart(getMonday(today))}
                      style={{ padding: "4px 12px", borderRadius: 10, fontSize: 11, fontWeight: 600, cursor: "pointer", background: "rgba(233,69,96,.15)", color: "#e94560" }}>
                      Aujourd'hui
                    </div>
                  )}
                  {!isDesktop && (
                    <div onClick={() => setPlanViewMode(planViewMode === "day" ? "week" : "day")}
                      style={{ padding: "4px 12px", borderRadius: 10, fontSize: 11, fontWeight: 600, cursor: "pointer", background: "rgba(74,144,217,.15)", color: "#4a90d9" }}>
                      {planViewMode === "day" ? "Vue semaine" : "Vue jour"}
                    </div>
                  )}
                </div>
              </div>

              {/* DAY SELECTOR (day view) */}
              {effectiveView === "day" && (
                <div style={{ display: "flex", gap: 4, padding: "0 4px" }}>
                  {weekDates.map((dateStr, i) => {
                    const isToday = dateStr === today;
                    const isSelected = dateStr === selectedDate;
                    const dayNum = new Date(dateStr).getDate();
                    return (
                      <div key={dateStr} onClick={() => setSelectedDate(dateStr)}
                        style={{ flex: 1, textAlign: "center", padding: "8px 2px", borderRadius: 12, cursor: "pointer",
                          background: isSelected ? "rgba(233,69,96,.15)" : "transparent",
                          border: `1px solid ${isSelected ? "#e94560" : isToday ? "rgba(76,175,80,.4)" : "transparent"}` }}>
                        <div style={{ fontSize: 9, color: isSelected ? "#e94560" : "#555", fontWeight: 700 }}>{dayNames[i]}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: isToday ? "#4caf50" : isSelected ? "#fff" : "#888" }}>{dayNum}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* WEEK GRID */}
              {effectiveView === "week" && (
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                  {/* Header row: day names */}
                  <div style={{ display: "grid", gridTemplateColumns: "40px repeat(7, 1fr)", borderBottom: "1px solid #1e1e4a" }}>
                    <div />
                    {weekDates.map((dateStr, i) => {
                      const isToday = dateStr === today;
                      const dayNum = new Date(dateStr).getDate();
                      return (
                        <div key={dateStr} style={{ textAlign: "center", padding: "8px 2px", borderLeft: "1px solid #1a1a2e", background: isToday ? "rgba(76,175,80,.06)" : "transparent" }}>
                          <div style={{ fontSize: 9, color: isToday ? "#4caf50" : "#555", fontWeight: 700 }}>{dayNames[i]}</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: isToday ? "#4caf50" : "#fff",
                            width: 24, height: 24, borderRadius: 12, background: isToday ? "rgba(76,175,80,.2)" : "transparent",
                            display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{dayNum}</div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Scrollable body */}
                  <div style={{ overflowY: "auto", maxHeight: "60vh", position: "relative" }}>
                    {/* Flat grid: each cell is its own grid item */}
                    <div style={{ display: "grid", gridTemplateColumns: "40px repeat(7, 1fr)", gridTemplateRows: `repeat(${PLANNING_HOURS.length}, ${HOUR_HEIGHT}px)` }}>
                      {PLANNING_HOURS.map((h, rowIdx) => (
                        <Fragment key={`row-${h}`}>
                          {/* Hour label */}
                          <div style={{ gridColumn: 1, gridRow: rowIdx + 1, height: HOUR_HEIGHT, borderTop: "1px solid #111",
                            display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 4,
                            fontSize: 9, color: "#444", fontFamily: "'Space Mono'" }}>{h}h</div>
                          {/* 7 clickable day cells for this hour */}
                          {weekDates.map((dateStr, colIdx) => (
                            <div key={`${dateStr}-${h}`} className="plan-cell"
                              onClick={() => openNewEvent(dateStr, h)}
                              style={{ gridColumn: colIdx + 2, gridRow: rowIdx + 1, height: HOUR_HEIGHT, minHeight: 60,
                                borderTop: "1px solid #111", borderLeft: "1px solid #1a1a2e",
                                background: dateStr === today ? "rgba(76,175,80,.03)" : "transparent",
                                cursor: "pointer", position: "relative", zIndex: 1 }} />
                          ))}
                        </Fragment>
                      ))}
                    </div>
                    {/* Event overlays — positioned absolutely on top of the grid */}
                    {weekDates.map((dateStr, colIdx) => {
                      const events = getEventsForDate(data.planning, dateStr);
                      if (events.length === 0) return null;
                      return (
                        <div key={`evts-${dateStr}`} style={{ position: "absolute", top: 0, left: `calc(40px + ${colIdx} * (100% - 40px) / 7)`,
                          width: `calc((100% - 40px) / 7)`, height: PLANNING_HOURS.length * HOUR_HEIGHT, pointerEvents: "none" }}>
                          {events.map(evt => {
                            const { top, height } = getEventPosition(evt);
                            const handleClick = (e) => {
                              e.stopPropagation();
                              if (evt._isRecurring) {
                                setRecurActionPrompt({ event: evt, action: "edit" });
                              } else {
                                setEditingEvent({ ...evt, isNew: false });
                              }
                            };
                            return (
                              <div key={`${evt.id}-${evt._occurrenceDate}`} onClick={handleClick}
                                style={{ position: "absolute", top, left: 2, right: 2, height,
                                  background: `${evt.color}22`, borderLeft: `3px solid ${evt.color}`,
                                  borderRadius: 6, padding: "2px 4px",
                                  cursor: "pointer", overflow: "hidden", zIndex: 10, pointerEvents: "auto" }}>
                                <div style={{ fontSize: 9, fontWeight: 700, color: evt.color, lineHeight: 1.2 }}>
                                  {evt.title}
                                </div>
                                {height > 30 && (
                                  <div style={{ fontSize: 8, color: "#888" }}>
                                    {evt.startH}:{String(evt.startM).padStart(2,"0")} — {evt.endH}:{String(evt.endM).padStart(2,"0")}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                    {/* Current time indicator */}
                    {isCurrentWeek && (() => {
                      const todayCol = weekDates.indexOf(today);
                      if (todayCol === -1) return null;
                      const now = new Date();
                      const nowH = now.getHours(), nowM = now.getMinutes();
                      if (nowH < 6 || nowH > 23) return null;
                      const topPx = ((nowH - 6) * 60 + nowM) / 60 * HOUR_HEIGHT;
                      return (
                        <div style={{ position: "absolute", top: topPx, left: `calc(40px + ${todayCol} * (100% - 40px) / 7)`,
                          width: `calc((100% - 40px) / 7)`, height: 2, background: "#e94560", zIndex: 20, pointerEvents: "none" }}>
                          <div style={{ width: 8, height: 8, borderRadius: 4, background: "#e94560", position: "absolute", left: -4, top: -3 }} />
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* DAY GRID */}
              {effectiveView === "day" && (
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #1e1e4a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <button className="na" style={{ width: 32, height: 32 }} onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d.toISOString().split("T")[0]); }}>←</button>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>
                        {dayNames[(new Date(selectedDate).getDay() + 6) % 7]} {new Date(selectedDate).getDate()} {["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"][new Date(selectedDate).getMonth()]}
                      </div>
                      {selectedDate === today && <div style={{ fontSize: 9, color: "#4caf50", fontWeight: 700 }}>AUJOURD'HUI</div>}
                    </div>
                    <button className="na" style={{ width: 32, height: 32 }} onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d.toISOString().split("T")[0]); }}>→</button>
                  </div>
                  <div style={{ position: "relative", overflowY: "auto", maxHeight: "65vh" }}>
                    {PLANNING_HOURS.map(h => (
                      <div key={h} className="plan-cell"
                        onClick={() => openNewEvent(selectedDate, h)}
                        style={{ display: "flex", height: HOUR_HEIGHT, minHeight: 60, borderTop: "1px solid #111",
                          cursor: "pointer", position: "relative", zIndex: 1 }}>
                        <div style={{ width: 44, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 4,
                          fontSize: 10, color: "#444", fontFamily: "'Space Mono'", pointerEvents: "none" }}>{h}:00</div>
                        <div style={{ flex: 1, pointerEvents: "none" }} />
                      </div>
                    ))}
                    {getEventsForDate(data.planning, selectedDate).map(evt => renderEventBlock(evt, false))}
                    {selectedDate === today && renderTimeLine(44)}
                  </div>
                </div>
              )}

              {/* FAB (mobile day view) */}
              {effectiveView === "day" && (
                <div onClick={() => { const h = Math.max(6, Math.min(22, new Date().getHours())); openNewEvent(selectedDate, h); }}
                  style={{ position: "fixed", bottom: 100, right: 20, width: 48, height: 48, borderRadius: 24,
                    background: "linear-gradient(135deg,#e94560,#c23152)", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 24, color: "#fff", cursor: "pointer", zIndex: 90, boxShadow: "0 4px 20px rgba(233,69,96,.4)", fontWeight: 300 }}>+</div>
              )}

            </div>
          );
        })()}

        {tab === "food" && (() => {
          const ns = getCurrentNutritionStage();
          const { stage, dayInStage, stageInfo, complete, notStarted, daysUntilStart } = ns;
          const currentMeals = getMealsForStage(stage);
          const progressPct = notStarted ? 0 : (dayInStage / STAGE_DAYS) * 100;
          const isRegain = stageInfo.name.includes("REGAIN");

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

              {/* STAGE INDICATOR */}
              <div className="card" style={{ background: `linear-gradient(145deg, ${stageInfo.color}15, #0d0d24)`, border: `1px solid ${stageInfo.color}40`, textAlign: "center", padding: "20px 16px" }}>
                <div style={{ fontSize: 11, color: "#888", letterSpacing: 2, fontFamily: "'Space Mono'" }}>ÉTAPE</div>
                <div style={{ fontSize: 42, fontWeight: 900, fontFamily: "'Space Mono'", color: "#fff" }}>
                  {stage}<span style={{ fontSize: 20, color: "#888" }}>/4</span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, marginTop: 4 }}>{stageInfo.emoji} {stageInfo.name}</div>
                <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "'Space Mono'", color: stageInfo.color, marginTop: 8 }}>
                  {stageInfo.kcal.toLocaleString("fr-FR")} kcal
                </div>

                {/* Progress bar or countdown */}
                {notStarted ? (
                  <div style={{ marginTop: 12, padding: "10px 16px", background: "rgba(255,235,59,.08)", borderRadius: 12, textAlign: "center" }}>
                    <div style={{ fontSize: 12, color: "#ffeb3b", fontWeight: 700 }}>Début dans {daysUntilStart} jour{daysUntilStart > 1 ? "s" : ""}</div>
                    <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>Lundi 23 février 2026</div>
                  </div>
                ) : (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: "#888" }}>Jour {dayInStage}/{STAGE_DAYS}</span>
                      <span style={{ fontSize: 10, color: "#888", fontFamily: "'Space Mono'" }}>{Math.round(progressPct)}%</span>
                    </div>
                    <div style={{ height: 6, background: "#0a0a1a", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(progressPct, 100)}%`, height: "100%", background: `linear-gradient(90deg, ${stageInfo.color}, ${stageInfo.color}cc)`, borderRadius: 3, transition: "width .5s" }} />
                    </div>
                  </div>
                )}

                {/* Macros */}
                <div style={{ display: "flex", justifyContent: "space-around", marginTop: 12 }}>
                  {[{ l: "Glucides", v: stageInfo.macros.glucides, c: "#ffeb3b" }, { l: "Protéines", v: stageInfo.macros.proteines, c: "#e94560" }, { l: "Lipides", v: stageInfo.macros.lipides, c: "#4caf50" }].map((m, i) => (
                    <div key={i} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Space Mono'", color: m.c }}>{m.v}</div>
                      <div style={{ fontSize: 9, color: "#666" }}>{m.l}</div>
                    </div>
                  ))}
                </div>

              </div>

              {/* MEAL CHECKLIST */}
              <div className="card">
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
                  🍽️ {isRegain ? "Plan regain" : "Plan sèche"} — {stageInfo.kcal.toLocaleString("fr-FR")} kcal
                </div>
                {currentMeals.map(m => {
                  const done = dayData.meals?.[m.id] || false;
                  return (
                    <div key={m.id} className={`ci ${done ? "done" : ""}`} onClick={() => toggleItem("meals", m.id, m.xp)}>
                      <div className="cb">{done ? "✓" : ""}</div>
                      <span style={{ fontSize: 18 }}>{m.emoji}</span>
                      <span style={{ flex: 1, fontSize: 13 }}>{m.label}</span>
                      <span className="xp">+{m.xp}</span>
                    </div>
                  );
                })}
                <div style={{ marginTop: 12, padding: 10, background: `rgba(${isRegain ? "76,175,80" : "233,69,96"},.06)`, borderRadius: 12, fontSize: 12, textAlign: "center" }}>
                  Budget : <span style={{ color: "#ffeb3b", fontWeight: 700, fontFamily: "'Space Mono'" }}>{stageInfo.budget}</span>
                </div>
              </div>

              {/* CYCLE COMPLETE */}
              {complete && (
                <div className="card" style={{ textAlign: "center", padding: 24 }}>
                  <div style={{ fontSize: 40 }}>🏆</div>
                  <div style={{ fontSize: 18, fontWeight: 800, marginTop: 8 }}>Cycle terminé !</div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>Tu as complété les 4 étapes (120 jours)</div>
                </div>
              )}
            </div>
          );
        })()}

        {tab === "supps" && (() => {
          // TODO: remettre le countdown après test
          // if (programNotStarted) return (
          //   <div className="card" style={{ textAlign: "center", padding: "32px 20px" }}>
          //     <div style={{ fontSize: 36, marginBottom: 8 }}>🚀</div>
          //     <div style={{ fontSize: 14, fontWeight: 700, color: "#ffeb3b" }}>Début dans {daysUntilProgram} jour{daysUntilProgram > 1 ? "s" : ""}</div>
          //     <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Lundi 23 Février 2026</div>
          //   </div>
          // );

          const ns = getCurrentNutritionStage();
          const isRegain = ns.stage === 1 || ns.stage === 3;
          const groups = getSuppsGrouped(ns.stage);
          const applicableSupps = getSuppsForStage(ns.stage);
          const checkedCount = applicableSupps.filter(s => dayData.supps?.[s.id]).length;
          const totalCount = applicableSupps.length;
          const suppsStreak = calcSuppsStreak(data);
          const budget = getSuppsBudget(ns.stage);
          const reapproAlerts = getReapproAlerts();

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
        })()}

        {tab === "sport" && (() => {
          const dow = new Date(selectedDate).getDay();
          const session = SPORT_DAYS[dow];
          const sportData = dayData.sport || {};
          const isMuscu = session.type === "muscu";
          const dayNames = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];

          // Group exercises into supersets for muscu
          const groupedExercises = [];
          if (isMuscu && session.exercises) {
            const used = new Set();
            for (const ex of session.exercises) {
              if (used.has(ex.id)) continue;
              const group = [ex];
              used.add(ex.id);
              if (ex.superset) {
                let next = session.exercises.find(e => e.id === ex.superset);
                while (next && !used.has(next.id)) {
                  group.push(next);
                  used.add(next.id);
                  next = next.superset ? session.exercises.find(e => e.id === next.superset) : null;
                }
              }
              groupedExercises.push(group);
            }
          }

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

              {/* WEEK OVERVIEW */}
              <div className="card" style={{ padding: 12 }}>
                <div style={{ display: "flex", gap: 4, justifyContent: "space-between" }}>
                  {[1,2,3,4,5,6,0].map(d => {
                    const s = SPORT_DAYS[d];
                    const isToday = d === dow;
                    return (
                      <div key={d} style={{ flex: 1, textAlign: "center", padding: "8px 2px", borderRadius: 12,
                        background: isToday ? "rgba(233,69,96,.15)" : "transparent",
                        border: isToday ? "1px solid #e94560" : "1px solid transparent",
                      }}>
                        <div style={{ fontSize: 9, color: isToday ? "#e94560" : "#555", fontWeight: 700 }}>{dayNames[d]}</div>
                        <div style={{ fontSize: 14, marginTop: 2 }}>{s.emoji}</div>
                        <div style={{ fontSize: 7, color: isToday ? "#fff" : "#444", marginTop: 2 }}>{s.label.split(" ")[0]}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SESSION HEADER */}
              <div className="card" style={{ background: "linear-gradient(145deg,#1a0a2e,#0d0d24)", border: "1px solid #2a1a4a", textAlign: "center", padding: "20px 16px" }}>
                <div style={{ fontSize: 36 }}>{session.emoji}</div>
                <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>{session.label}</div>
                <div style={{ fontSize: 12, color: "#888" }}>{session.subtitle}</div>
                {!isMuscu && (<div style={{ marginTop: 8 }}><span style={{ background: "linear-gradient(135deg,#e94560,#c23152)", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, fontFamily: "'Space Mono'" }}>{session.totalDistance}m</span></div>)}
                {!isMuscu && session.info && <div style={{ marginTop: 8, fontSize: 11, color: "#666" }}>{session.info}</div>}
              </div>

              {/* WARMUP CIRCUIT */}
              {isMuscu && session.warmup && (() => {
                const warmupItems = session.warmup === "hdc" ? WARMUP_HDC : WARMUP_BDC;
                const warmupLabel = session.warmup === "hdc" ? "Haut du Corps" : "Bas du Corps";
                const warmupPasses = session.warmup === "hdc" ? "3 passages sans récup" : "3 passages sans récup";
                return (
                  <div className="card" style={{ padding: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 20 }}>🔥</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>Circuit Échauffement</div>
                        <div style={{ fontSize: 10, color: "#888" }}>{warmupLabel} — {warmupPasses}</div>
                      </div>
                    </div>
                    {warmupItems.map(item => {
                      const done = sportData.exercises?.[item.id]?.series?.[0] || false;
                      return (
                        <div key={item.id}>
                          <div className={`ci ${done ? "done" : ""}`} onClick={() => toggleSportSeries(item.id, 0)} style={{ padding: "10px 14px" }}>
                            <div className="cb">{done ? "✓" : ""}</div>
                            <span style={{ fontSize: 16 }}>{item.emoji}</span>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: 12, fontWeight: done ? 600 : 400 }}>{item.label}</span>
                              <div style={{ fontSize: 10, color: "#888" }}>{item.reps}</div>
                            </div>
                          </div>
                          {item.image && <img src={`/exercises/${item.image}`} alt={item.label} style={{ width: "100%", maxHeight: 180, objectFit: "contain", borderRadius: 8, marginBottom: 6, background: "#0a0a1a" }} />}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* ABS CIRCUIT (muscu days with abs) */}
              {isMuscu && session.hasAbsCircuit && (
                <div className="card" style={{ padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 20 }}>🔥</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>Circuit Abdos</div>
                      <div style={{ fontSize: 10, color: "#888" }}>3 passages — 1 min récup</div>
                    </div>
                  </div>
                  {ABS_CIRCUIT.map(ab => {
                    const done = sportData.exercises?.[ab.id]?.series?.[0] || false;
                    return (
                      <div key={ab.id}>
                        <div className={`ci ${done ? "done" : ""}`} onClick={() => toggleSportSeries(ab.id, 0)} style={{ padding: "10px 14px" }}>
                          <div className="cb">{done ? "✓" : ""}</div>
                          <span style={{ fontSize: 16 }}>{ab.emoji}</span>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 12, fontWeight: done ? 600 : 400 }}>{ab.label}</span>
                            <div style={{ fontSize: 10, color: "#888" }}>{ab.reps}</div>
                          </div>
                        </div>
                        {ab.image && <img src={`/exercises/${ab.image}`} alt={ab.label} style={{ width: "100%", maxHeight: 180, objectFit: "contain", borderRadius: 8, marginBottom: 6, background: "#0a0a1a" }} />}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* MUSCULATION EXERCISES */}
              {isMuscu && groupedExercises.map((group, gi) => {
                const isSuperset = group.length > 1;
                return (
                  <div key={gi} className="card" style={{ padding: 14 }}>
                    {isSuperset && (
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#e94560", marginBottom: 8, letterSpacing: 1 }}>
                        🔄 SUPERSET {gi + 1}
                      </div>
                    )}
                    {group.map(ex => {
                      const exData = sportData.exercises?.[ex.id] || { series: [], reps: [] };
                      const doneCount = (exData.series || []).filter(Boolean).length;
                      return (
                        <div key={ex.id} style={{ marginBottom: group.indexOf(ex) < group.length - 1 ? 14 : 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <span style={{ fontSize: 18 }}>{ex.emoji}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 12, fontWeight: 700 }}>{ex.label}</div>
                              <div style={{ fontSize: 10, color: "#888" }}>
                                {ex.series}×{ex.reps}{ex.tempo ? ` — ${ex.tempo}` : ""} — {ex.rest}s récup
                                {doneCount > 0 && <span style={{ color: doneCount === ex.series ? "#4caf50" : "#e94560", fontWeight: 700 }}> {doneCount}/{ex.series}</span>}
                              </div>
                            </div>
                            {doneCount === ex.series && <span style={{ fontSize: 16 }}>✅</span>}
                          </div>
                          {ex.image && <img src={`/exercises/${ex.image}`} alt={ex.label} style={{ width: "100%", maxHeight: 180, objectFit: "contain", borderRadius: 8, marginBottom: 8, background: "#0a0a1a" }} />}
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {[...Array(ex.series)].map((_, i) => {
                              const done = exData.series?.[i] || false;
                              return (
                                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                  <div onClick={() => toggleSportSeries(ex.id, i)} style={{
                                    width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                                    cursor: "pointer", background: done ? "linear-gradient(135deg,#4caf50,#2e7d32)" : "#0a0a1a",
                                    border: `2px solid ${done ? "#4caf50" : "#2a2a4a"}`, fontSize: 13, fontWeight: 800,
                                    fontFamily: "'Space Mono'", color: done ? "#fff" : "#555", transition: "all .2s",
                                  }}>
                                    {done ? "✓" : `S${i + 1}`}
                                  </div>
                                  <input type="number" placeholder={ex.reps.split("-")[0] || "-"} value={exData.reps?.[i] || ""}
                                    onChange={e => setSportReps(ex.id, i, e.target.value)}
                                    style={{ width: 44, padding: "4px 2px", borderRadius: 8, background: "#0a0a1a",
                                      border: "1px solid #1e1e4a", color: "#fff", fontSize: 11, textAlign: "center", fontFamily: "'Space Mono'" }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {/* NATATION BLOCKS */}
              {!isMuscu && (
                <div className="card">
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>🏊 Programme</div>
                  {session.blocks.map(block => {
                    const done = sportData.blocks?.[block.id] || false;
                    return (
                      <div key={block.id} className={`ci ${done ? "done" : ""}`} onClick={() => toggleSportBlock(block.id)}>
                        <div className="cb">{done ? "✓" : ""}</div>
                        <span style={{ fontSize: 18 }}>{block.emoji}</span>
                        <span style={{ flex: 1, fontSize: 13 }}>{block.label}</span>
                        <span style={{ fontSize: 11, fontFamily: "'Space Mono'", color: done ? "#4caf50" : "#555" }}>{block.distance}m</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* NATATION PROGRESS */}
              {!isMuscu && (() => {
                const completedDist = session.blocks.filter(b => sportData.blocks?.[b.id]).reduce((sum, b) => sum + b.distance, 0);
                return (
                  <div className="card" style={{ padding: 14, textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>Distance</div>
                    <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "'Space Mono'", color: completedDist >= session.totalDistance ? "#4caf50" : "#e94560" }}>
                      {completedDist}<span style={{ fontSize: 14, color: "#555" }}>/{session.totalDistance}m</span>
                    </div>
                    <div style={{ height: 6, background: "#0a0a1a", borderRadius: 3, marginTop: 8, overflow: "hidden" }}>
                      <div style={{ width: `${Math.min((completedDist / session.totalDistance) * 100, 100)}%`, height: "100%",
                        background: "linear-gradient(90deg,#4caf50,#2e7d32)", borderRadius: 3, transition: "width .5s" }} />
                    </div>
                  </div>
                );
              })()}

              {/* REST TIMER CONTROLS (muscu only) */}
              {isMuscu && (
                <div className="card" style={{ padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>⏱️ Chrono récup</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {REST_PRESETS.map(p => (
                      <div key={p.seconds} onClick={() => setTimerPreset(p.seconds)} style={{
                        flex: 1, padding: "8px 0", borderRadius: 10, textAlign: "center", cursor: "pointer",
                        fontSize: 13, fontWeight: 700, fontFamily: "'Space Mono'",
                        background: timerPreset === p.seconds ? "rgba(233,69,96,.15)" : "#0a0a1a",
                        border: `1px solid ${timerPreset === p.seconds ? "#e94560" : "#1e1e4a"}`,
                        color: timerPreset === p.seconds ? "#e94560" : "#555",
                      }}>{p.label}</div>
                    ))}
                    <div onClick={() => { setTimerSeconds(timerPreset); setTimerRunning(true); }} style={{
                      flex: 1, padding: "8px 0", borderRadius: 10, textAlign: "center", cursor: "pointer",
                      fontSize: 13, fontWeight: 700, background: "linear-gradient(135deg,#e94560,#c23152)", color: "#fff",
                    }}>GO</div>
                  </div>
                </div>
              )}

              {/* NOTES */}
              <div className="card" style={{ padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>📝 Notes</div>
                <textarea value={sportData.notes || ""} onChange={e => setSportNotes(e.target.value)}
                  placeholder="Poids utilisés, sensations..."
                  style={{ width: "100%", minHeight: 60, background: "#0a0a1a", border: "1px solid #1e1e4a",
                    borderRadius: 10, color: "#fff", padding: 10, fontSize: 12, fontFamily: "'Outfit'",
                    resize: "vertical", outline: "none", boxSizing: "border-box" }}
                />
              </div>

            </div>
          );
        })()}

        {tab === "health" && (programNotStarted ? (
          <div className="card" style={{ textAlign: "center", padding: "32px 20px" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🚀</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#ffeb3b" }}>Début dans {daysUntilProgram} jour{daysUntilProgram > 1 ? "s" : ""}</div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Lundi 23 Février 2026</div>
          </div>
        ) : <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="card"><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>🌡️ Température — Ray Peat</div>{[{ id: "reveil", label: "🌅 Réveil", norm: "36.6-37.0", lo: 36.6, hi: 37.0, warnLo: 36.4 }, { id: "apres_repas", label: "🍳 Après repas", norm: "36.8-37.2", lo: 36.8, hi: 37.2, warnLo: 36.6 }, { id: "aprem", label: "🌆 Fin aprem", norm: "36.8-37.2", lo: 36.8, hi: 37.2, warnLo: 36.6 }].map(slot => { const val = dayData.temp?.[slot.id] || ""; const n = parseFloat(val); let st = "", sc = "#555"; if (val && !isNaN(n)) { if (n >= slot.lo && n <= slot.hi) { st = "✅"; sc = "#4caf50"; } else if (n < slot.warnLo) { st = "⚠️"; sc = "#e94560"; } else if (n < slot.lo) { st = "🟡"; sc = "#ff9800"; } else { st = "🔴"; sc = "#e94560"; } } return (<div key={slot.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0", borderBottom: "1px solid #111" }}><span style={{ fontSize: 12, flex: 1 }}>{slot.label} <span style={{ color: "#4caf50", fontSize: 10 }}>({slot.norm})</span></span><input type="number" step="0.1" min="35" max="39" value={val} placeholder="36.8" onChange={e => setTemp(slot.id, e.target.value)} style={{ width: 72 }} /><span style={{ fontSize: 12, color: sc, minWidth: 24 }}>{st}</span></div>); })}</div>
          <div className="card"><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>⚠️ Symptômes — S{getWeekNumber(selectedDate)}</div><div style={{ fontSize: 10, color: "#555", marginBottom: 10 }}>0 = catastrophe → 10 = excellent</div>{SYMPTOMS.map((s, i) => { const val = weekData.symptoms?.[s] ?? ""; return (<div key={i} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 0", borderBottom: "1px solid #0d0d24" }}><span style={{ flex: 1, fontSize: 11 }}>{s}</span><div style={{ display: "flex", gap: 2 }}>{[...Array(11)].map((_, n) => (<div key={n} onClick={() => setSymptom(s, n)} style={{ width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "'Space Mono'", background: val === n ? (n >= 7 ? "#2e7d32" : n >= 4 ? "#e65100" : "#c62828") : "#0a0a1a", color: val === n ? "#fff" : "#444", border: `1px solid ${val === n ? "transparent" : "#1e1e4a"}` }}>{n}</div>))}</div></div>); })}</div>
          <div className="card"><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>🌿 Naturopathie — S{getWeekNumber(selectedDate)}</div>{NATURO.map((n, i) => { const val = weekData.naturo?.[n.id] || ""; return (<div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #0d0d24" }}><div style={{ flex: 1 }}><div style={{ fontSize: 12 }}>{n.label}</div><div style={{ fontSize: 9, color: "#4caf50" }}>✓ {n.good}</div></div><input type="text" value={val} placeholder="..." onChange={e => setNaturo(n.id, e.target.value)} style={{ background: "#0a0a1a", border: "1px solid #1e1e4a", borderRadius: 8, color: "white", padding: "6px 8px", fontSize: 11, width: 110, fontFamily: "'Outfit'" }} /></div>); })}</div>
        </div>)}

        {tab === "rewards" && (<div className="tab-grid" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card" style={{ textAlign: "center", padding: 20, background: "linear-gradient(145deg,#0d0d24,#1a0a2e,#0d0d24)", border: "1px solid #2a1a4a" }}>
            <div style={{ fontSize: 11, color: "#ffeb3b", fontWeight: 700, letterSpacing: 2, fontFamily: "'Space Mono'", marginBottom: 8 }}>🎁 CADEAUX ITALIE 🇮🇹</div>
            <div style={{ fontSize: 42, fontWeight: 900, background: "linear-gradient(135deg,#e94560,#ffeb3b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{unlockedCount}<span style={{ fontSize: 20 }}>/{totalRewards}</span></div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>débloqués pour ton voyage</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 12 }}>{[...Array(totalRewards)].map((_, i) => (<div key={i} style={{ width: 10, height: 10, borderRadius: 5, background: i < unlockedCount ? "linear-gradient(135deg,#e94560,#ffeb3b)" : "#1e1e4a" }} />))}</div>
          </div>
          <div><div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>📅 Récompenses Hebdo</div><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{WEEKLY_REWARDS.map(r => { const unlocked = isWeekComplete(data, r.week); const ws = Math.round(getWeekAvgScore(data, r.week)); return (<div key={r.week}><RewardCard reward={r} unlocked={unlocked} isNew={false} onClick={() => { }} />{!unlocked && <div style={{ marginTop: 4, padding: "0 16px" }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}><span style={{ fontSize: 10, color: "#444" }}>Semaine {r.week}</span><span style={{ fontSize: 10, color: "#555", fontFamily: "'Space Mono'" }}>{ws}%/70%</span></div><div style={{ height: 3, background: "#111", borderRadius: 2 }}><div style={{ width: `${Math.min((ws / 70) * 100, 100)}%`, height: "100%", background: ws >= 70 ? "#4caf50" : "#e94560", borderRadius: 2 }} /></div></div>}</div>); })}</div></div>
          <div><div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>🏆 Achievements</div><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{ACHIEVEMENT_REWARDS.map(r => { const unlocked = r.check(data); const isNew = unlocked && !(data.seenRewards || []).includes(r.id); return (<RewardCard key={r.id} reward={r} unlocked={unlocked} isNew={isNew} onClick={() => { if (isNew) markRewardSeen(r.id); }} />); })}</div></div>
        </div>)}

        {tab === "stats" && (programNotStarted ? (
          <div className="card" style={{ textAlign: "center", padding: "32px 20px" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🚀</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#ffeb3b" }}>Début dans {daysUntilProgram} jour{daysUntilProgram > 1 ? "s" : ""}</div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Lundi 23 Février 2026</div>
          </div>
        ) : <div className="tab-grid" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="card"><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>📉 Poids</div>{getWeightChartData().length > 1 ? (<ResponsiveContainer width="100%" height={180}><AreaChart data={getWeightChartData()}><defs><linearGradient id="wG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e94560" stopOpacity={.3} /><stop offset="100%" stopColor="#e94560" stopOpacity={0} /></linearGradient></defs><XAxis dataKey="name" tick={{ fill: "#555", fontSize: 10 }} axisLine={{ stroke: "#1e1e4a" }} /><YAxis domain={["dataMin-1", "dataMax+1"]} tick={{ fill: "#555", fontSize: 10 }} axisLine={{ stroke: "#1e1e4a" }} /><Tooltip contentStyle={{ background: "#0d0d24", border: "1px solid #2a2a5a", borderRadius: 8, fontSize: 12, color: "#fff" }} /><Area type="monotone" dataKey="poids" stroke="#e94560" strokeWidth={2} fill="url(#wG)" dot={{ fill: "#e94560", r: 4 }} /></AreaChart></ResponsiveContainer>) : (<div style={{ color: "#444", fontSize: 12, textAlign: "center", padding: 30 }}>2+ semaines → graph</div>)}</div>
          <div className="card"><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>🎯 Radar santé</div>{getSymptomRadarData().some(d => d.value > 0) ? (<ResponsiveContainer width="100%" height={220}><RadarChart data={getSymptomRadarData()}><PolarGrid stroke="#1e1e4a" /><PolarAngleAxis dataKey="subject" tick={{ fill: "#888", fontSize: 9 }} /><PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} /><Radar name="Score" dataKey="value" stroke="#e94560" fill="#e94560" fillOpacity={.2} strokeWidth={2} dot={{ fill: "#e94560", r: 3 }} /></RadarChart></ResponsiveContainer>) : (<div style={{ color: "#444", fontSize: 12, textAlign: "center", padding: 30 }}>Remplis tes symptômes</div>)}</div>
          <div className="card"><div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>🌡️ Températures</div>{getTempChartData().length > 1 ? (<><ResponsiveContainer width="100%" height={180}><LineChart data={getTempChartData()}><XAxis dataKey="name" tick={{ fill: "#555", fontSize: 9 }} axisLine={{ stroke: "#1e1e4a" }} /><YAxis domain={[36, 37.5]} tick={{ fill: "#555", fontSize: 10 }} axisLine={{ stroke: "#1e1e4a" }} /><Tooltip contentStyle={{ background: "#0d0d24", border: "1px solid #2a2a5a", borderRadius: 8, fontSize: 11, color: "#fff" }} /><Line type="monotone" dataKey="reveil" stroke="#4caf50" strokeWidth={2} dot={{ r: 2 }} connectNulls /><Line type="monotone" dataKey="apres" stroke="#ff9800" strokeWidth={2} dot={{ r: 2 }} connectNulls /><Line type="monotone" dataKey="aprem" stroke="#e94560" strokeWidth={2} dot={{ r: 2 }} connectNulls /></LineChart></ResponsiveContainer><div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 8 }}>{[{ c: "#4caf50", l: "Réveil" }, { c: "#ff9800", l: "Repas" }, { c: "#e94560", l: "Aprem" }].map((x, i) => (<div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#888" }}><div style={{ width: 8, height: 8, borderRadius: 4, background: x.c }} />{x.l}</div>))}</div></>) : (<div style={{ color: "#444", fontSize: 12, textAlign: "center", padding: 30 }}>Quelques jours → courbes</div>)}</div>
        </div>)}

        {tab === "weight" && (() => {
          if (programNotStarted) return (
            <div className="card" style={{ textAlign: "center", padding: "32px 20px" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>⚖️</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#ffeb3b" }}>Première pesée le 23 Février</div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Lundi 23 Février 2026</div>
            </div>
          );
          const currentWeekNum = getWeekNumber(getToday());
          const currentWeekKey = `w${currentWeekNum}`;
          const currentEntry = data.weight[currentWeekKey];
          const prevEntry = data.weight[`w${currentWeekNum - 1}`];
          const hasEntry = currentEntry?.poids;
          const stageInfo = getCurrentNutritionStage();
          const stageType = getStageType(stageInfo.stage);
          const weekInStage = getWeekInStage(data);
          const totalWeeksInStage = Math.ceil(STAGE_DAYS / 7);
          const alert = hasEntry ? getWeightAlert(data, currentWeekNum) : null;
          const todayIsMonday = isMonday(getToday());
          const nextMonday = getNextMonday(getToday());
          const nextMondayLabel = (() => { const d = new Date(nextMonday); return `${["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"][d.getDay()]} ${d.getDate()} ${["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"][d.getMonth()]}`; })();
          const showForm = !hasEntry || weightEditMode;
          const delta = hasEntry && prevEntry?.poids ? parseFloat(currentEntry.poids) - parseFloat(prevEntry.poids) : null;

          return (<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* SECTION A — Bandeau étape actuelle */}
            <div className="card" style={{ background: `linear-gradient(145deg, ${stageInfo.stageInfo.color}15, ${stageInfo.stageInfo.color}08)`, borderColor: `${stageInfo.stageInfo.color}40` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 28 }}>{stageInfo.stageInfo.emoji}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: stageInfo.stageInfo.color }}>ÉTAPE {stageInfo.stage} — {stageInfo.stageInfo.name}</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>Semaine {weekInStage}/{totalWeeksInStage} de cette étape</div>
                </div>
              </div>
            </div>

            {/* SECTION B — Delta poids */}
            {hasEntry && (
              <div className="card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Cette semaine</div>
                    <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "'Space Mono'", color: "#ffeb3b" }}>{currentEntry.poids}<span style={{ fontSize: 14, color: "#888" }}> kg</span></div>
                  </div>
                  {delta !== null && (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>vs semaine dernière</div>
                      <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Space Mono'", color: delta > 0 ? (stageType === "regain" ? "#4caf50" : "#e94560") : (stageType === "seche" ? "#4caf50" : "#ff9800") }}>
                        {delta > 0 ? "+" : ""}{delta.toFixed(1)} kg {delta > 0 ? "↗️" : delta < 0 ? "↘️" : "→"}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SECTION C — Alerte intelligente */}
            {alert && (
              <div style={{ padding: "12px 16px", borderRadius: 14, background: alert.type === "ok" ? "rgba(76,175,80,.1)" : "rgba(255,152,0,.1)", border: `1px solid ${alert.type === "ok" ? "rgba(76,175,80,.3)" : "rgba(255,152,0,.3)"}`, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>{alert.type === "ok" ? "✅" : "⚠️"}</span>
                <span style={{ fontSize: 12, color: alert.type === "ok" ? "#4caf50" : "#ff9800", fontWeight: 600 }}>{alert.text}</span>
              </div>
            )}

            {/* SECTION D — Formulaire ou résumé */}
            <div className="card">
              {!showForm ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>✅ Pesée enregistrée — S{currentWeekNum}</div>
                    <div onClick={() => setWeightEditMode(true)} style={{ fontSize: 11, color: "#e94560", cursor: "pointer", fontWeight: 600 }}>Modifier</div>
                  </div>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: "#555" }}>Poids</div>
                      <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Space Mono'", color: "#ffeb3b" }}>{currentEntry.poids} kg</div>
                    </div>
                    {currentEntry.tour_taille && (
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 9, color: "#555" }}>Tour de taille</div>
                        <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Space Mono'", color: "#4a90d9" }}>{currentEntry.tour_taille} cm</div>
                      </div>
                    )}
                    {currentEntry.energie && (
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 9, color: "#555" }}>Énergie</div>
                        <div style={{ fontSize: 18 }}>{"⭐".repeat(currentEntry.energie)}{"☆".repeat(5 - currentEntry.energie)}</div>
                      </div>
                    )}
                    {currentEntry.photos?.length > 0 && (
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 9, color: "#555" }}>Photos</div>
                        <div style={{ fontSize: 18, color: "#4caf50" }}>📸 {currentEntry.photos.length}/2</div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <WeightForm
                  weekNum={currentWeekNum}
                  existing={currentEntry}
                  onSave={saveWeightEntry}
                  onCancel={() => setWeightEditMode(false)}
                  photoInputRef1={photoInputRef1}
                  photoInputRef2={photoInputRef2}
                />
              )}
            </div>

            {/* Prochain jour de pesée */}
            {!todayIsMonday && !hasEntry && (
              <div style={{ padding: "10px 16px", borderRadius: 12, background: "rgba(233,69,96,.08)", border: "1px solid rgba(233,69,96,.2)", textAlign: "center" }}>
                <span style={{ fontSize: 12, color: "#e94560" }}>📅 Prochaine pesée : <strong>{nextMondayLabel}</strong></span>
              </div>
            )}

            {/* SECTION E — Graphique d'évolution */}
            {getWeightChartData().length > 1 && (
              <div className="card">
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>📈 Évolution du poids</div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={getWeightChartData()}>
                    <defs>
                      <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e94560" stopOpacity={.3} />
                        <stop offset="100%" stopColor="#e94560" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" tick={{ fill: "#555", fontSize: 10 }} axisLine={{ stroke: "#1e1e4a" }} />
                    <YAxis domain={["dataMin-1", "dataMax+1"]} tick={{ fill: "#555", fontSize: 10 }} axisLine={{ stroke: "#1e1e4a" }} />
                    <Tooltip contentStyle={{ background: "#0d0d24", border: "1px solid #2a2a5a", borderRadius: 8, fontSize: 12, color: "#fff" }} formatter={(v) => [`${v} kg`, "Poids"]} />
                    <Area type="monotone" dataKey="poids" stroke="#e94560" strokeWidth={2} fill="url(#wGrad)" dot={{ fill: "#e94560", r: 4 }} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* SECTION F — Galerie photos */}
            {(() => {
              const weeksWithPhotos = Object.keys(data.weight).sort().filter(wk => data.weight[wk]?.photos?.length > 0);
              if (weeksWithPhotos.length === 0) return null;
              return (
                <div className="card">
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>📸 Évolution physique</div>
                  <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8, WebkitOverflowScrolling: "touch" }}>
                    {weeksWithPhotos.map(wk => {
                      const w = data.weight[wk];
                      const weekNum = parseInt(wk.replace("w", ""));
                      return (
                        <div key={wk} onClick={() => setWeightPhotoModal({ weekKey: wk, weekNum })} style={{ flexShrink: 0, cursor: "pointer" }}>
                          <div style={{ width: 80, height: 100, borderRadius: 12, overflow: "hidden", border: "2px solid #1e1e4a", position: "relative" }}>
                            <img src={w.photos[0]} alt={`S${weekNum}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,.8))", padding: "4px 6px", textAlign: "center" }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>S{weekNum}</div>
                              {w.poids && <div style={{ fontSize: 8, color: "#ffeb3b", fontFamily: "'Space Mono'" }}>{w.poids}kg</div>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Modale photo plein écran */}
            {weightPhotoModal && (() => {
              const wk = data.weight[weightPhotoModal.weekKey];
              if (!wk?.photos?.length) return null;
              return (
                <div onClick={() => setWeightPhotoModal(null)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,.95)", zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 12 }}>Semaine {weightPhotoModal.weekNum} {wk.poids && <span style={{ color: "#ffeb3b", fontFamily: "'Space Mono'" }}>— {wk.poids} kg</span>}</div>
                  <div style={{ display: "flex", gap: 12, maxWidth: "100%", overflow: "auto" }}>
                    {wk.photos.map((photo, i) => (
                      <img key={i} src={photo} alt={`Photo ${i + 1}`} style={{ maxHeight: "70vh", maxWidth: "45vw", borderRadius: 12, objectFit: "contain" }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 12 }}>Toucher pour fermer</div>
                </div>
              );
            })()}

          </div>);
        })()}
      </div>

      </div>{/* END MAIN CONTENT COLUMN */}

      {/* BOTTOM NAV */}
      <div className="nav-outer" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "linear-gradient(0deg,#0a0a1a 60%,transparent)", padding: "20px 4px max(env(safe-area-inset-bottom, 6px), 6px)", zIndex: 100 }}>
        <div className="nav-inner" style={{ maxWidth: 480, margin: "0 auto", display: "flex", gap: 1, background: "#0a0a18", borderRadius: 14, padding: 3, border: "1px solid #1a1a3a" }}>
          {tabs.map(t => (
            <button key={t.id} className={`tb ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
              <span style={{ fontSize: 15 }}>{t.label}</span>
              <span>{t.name}</span>
              {t.badge > 0 && <div style={{ position: "absolute", top: 2, right: 4, width: 14, height: 14, borderRadius: 7, background: "#e94560", fontSize: 8, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", animation: "pulse 1.5s infinite" }}>{t.badge}</div>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
