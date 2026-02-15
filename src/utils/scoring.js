import { HABITS } from "../constants/habits.js";
import { getMealsForStage } from "../constants/nutrition.js";
import { getSuppsForStage } from "../constants/supplements.js";
import { START_DATE, getToday, getWeekNumber } from "./helpers.js";

export function getWeekAvgScore(data, weekNum) {
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

export function isWeekComplete(data, weekNum) {
  const start = new Date(START_DATE);
  const lastDay = new Date(start); lastDay.setDate(lastDay.getDate() + weekNum * 7 - 1);
  return new Date(getToday()) >= lastDay && getWeekAvgScore(data, weekNum) >= 70;
}

export const ACHIEVEMENT_REWARDS = [
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
