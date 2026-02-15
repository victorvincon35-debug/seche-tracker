export const SUPP_TIMING_GROUPS = [
  { id: "reveil", label: "RÉVEIL (à jeun)", emoji: "🌅", color: "#ff9800" },
  { id: "30min", label: "30 MIN APRÈS LE RÉVEIL (jus d'orange, PAS de café/thé)", emoji: "☀️", color: "#ffeb3b" },
  { id: "midi", label: "MIDI (repas avec gras : bœuf + œufs + beurre)", emoji: "🌞", color: "#ffc107" },
  { id: "post_training", label: "POST-ENTRAÎNEMENT", emoji: "💪", color: "#e94560" },
  { id: "collation", label: "COLLATION (après-midi)", emoji: "🍎", color: "#4caf50" },
  { id: "diner", label: "DÎNER", emoji: "🌙", color: "#42a5f5" },
  { id: "avant_dormir", label: "AVANT DORMIR", emoji: "😴", color: "#ab47bc" },
];

export const SUPPS_DETAILED = [
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

export const SUPPS = SUPPS_DETAILED;

export function getSuppsForStage(stageNum) {
  const isRegain = stageNum === 1 || stageNum === 3;
  return isRegain ? SUPPS_DETAILED.filter(s => !s.secheOnly) : SUPPS_DETAILED;
}

export function getSuppsGrouped(stageNum) {
  const applicable = getSuppsForStage(stageNum);
  return SUPP_TIMING_GROUPS.map(g => ({ ...g, supps: applicable.filter(s => s.timing === g.id) })).filter(g => g.supps.length > 0);
}

export function getSuppsBudget(stageNum) {
  return getSuppsForStage(stageNum).reduce((sum, s) => sum + (s.price || 0), 0);
}
