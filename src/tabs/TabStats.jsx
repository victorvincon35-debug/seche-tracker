import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area } from "recharts";
import { SYMPTOMS } from "../constants/symptoms.js";
import { HABITS, SOCIAL_HABITS } from "../constants/habits.js";
import { DAILY_TARGET } from "../constants/routineDos.js";
import { START_DATE, getToday, getWeekNumber, getMonday, getWeekDates } from "../utils/helpers.js";
import { getMealsForStage } from "../constants/nutrition.js";
import { getSuppsForStage } from "../constants/supplements.js";

const PERIOD_FILTERS = [
  { id: "7d", label: "7j", days: 7 },
  { id: "30d", label: "30j", days: 30 },
  { id: "90d", label: "90j", days: 90 },
  { id: "all", label: "Tout", days: 999 },
];

export default function TabStats({ data, selectedDate, programNotStarted, daysUntilProgram }) {
  const [period, setPeriod] = useState("30d");

  if (programNotStarted) return (
    <div className="card" style={{ textAlign: "center", padding: "32px 20px" }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>🚀</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#ffeb3b" }}>Début dans {daysUntilProgram} jour{daysUntilProgram > 1 ? "s" : ""}</div>
      <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Lundi 23 Février 2026</div>
    </div>
  );

  const periodDays = PERIOD_FILTERS.find(p => p.id === period)?.days || 30;

  function getDatesInPeriod() {
    const today = new Date(getToday());
    const start = new Date(START_DATE);
    const dates = [];
    for (let i = 0; i < periodDays; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (d < start) break;
      dates.unshift(d.toISOString().split("T")[0]);
    }
    return dates;
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

  function getSymptomRadarData() {
    const wk = `w${getWeekNumber(selectedDate)}`;
    const syms = data.weeks[wk]?.symptoms || {};
    return SYMPTOMS.slice(0, 8).map(s => ({ subject: s, value: syms[s] ?? 0, fullMark: 10 }));
  }

  function getTempChartData() {
    const dates = getDatesInPeriod();
    const d = [];
    dates.forEach((k, i) => {
      const t = data.days[k]?.temp;
      if (t && (t.reveil || t.apres_repas || t.aprem))
        d.push({
          name: `J${i + 1}`,
          reveil: t.reveil ? parseFloat(t.reveil) : null,
          apres: t.apres_repas ? parseFloat(t.apres_repas) : null,
          aprem: t.aprem ? parseFloat(t.aprem) : null,
        });
    });
    return d;
  }

  // Habits heatmap data
  function getHabitsHeatmap() {
    const dates = getDatesInPeriod();
    return dates.map(dk => {
      const day = data.days[dk];
      if (!day) return { date: dk, pct: 0 };
      const total = HABITS.filter(h => !h.weekly).length;
      const done = HABITS.filter(h => !h.weekly).filter(h => day.habits?.[h.id]).length;
      return { date: dk, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
    });
  }

  // Supplement adherence
  function getSuppAdherence() {
    const dates = getDatesInPeriod();
    let totalPossible = 0;
    let totalDone = 0;
    const stage = data.nutrition?.currentStage || 1;
    const supps = getSuppsForStage(stage);
    for (const dk of dates) {
      const day = data.days[dk];
      totalPossible += supps.length;
      if (day?.supps) {
        totalDone += supps.filter(s => day.supps[s.id]).length;
      }
    }
    return totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;
  }

  // Routine dos weekly count
  function getRoutineDosWeekly() {
    const monday = getMonday(getToday());
    const weekDates = getWeekDates(monday);
    let count = 0;
    for (const d of weekDates) {
      const routines = data.days[d]?.routineDos || [];
      count += routines.filter(r => r.completed).length;
    }
    return count;
  }

  // Social interactions this week
  function getSocialWeekly() {
    const monday = getMonday(getToday());
    const weekDates = getWeekDates(monday);
    let count = 0;
    for (const d of weekDates) {
      const day = data.days[d];
      if (!day?.habits) continue;
      for (const sh of SOCIAL_HABITS) {
        if (day.habits[sh.id]) count++;
      }
    }
    return count;
  }

  // Savings progress
  function getEpargneTotal() {
    const transactions = data.epargne?.transactions || [];
    return transactions.reduce((sum, t) => sum + t.amount, 0);
  }

  // Global score
  function getGlobalScore() {
    const dates = getDatesInPeriod();
    if (dates.length === 0) return 0;
    let totalScore = 0;
    const stage = data.nutrition?.currentStage || 1;
    const meals = getMealsForStage(stage);
    const supps = getSuppsForStage(stage);
    for (const dk of dates) {
      const day = data.days[dk];
      if (!day) continue;
      let total = 0, done = 0;
      HABITS.filter(h => !h.weekly).forEach(() => total++);
      meals.forEach(() => total++);
      supps.forEach(() => total++);
      if (day.habits) Object.values(day.habits).forEach(v => { if (v) done++; });
      if (day.meals) Object.values(day.meals).forEach(v => { if (v) done++; });
      if (day.supps) Object.values(day.supps).forEach(v => { if (v) done++; });
      if (total > 0) totalScore += (done / total) * 100;
    }
    return Math.round(totalScore / dates.length);
  }

  const heatmap = getHabitsHeatmap();
  const suppAdherence = getSuppAdherence();
  const routineDosCount = getRoutineDosWeekly();
  const socialCount = getSocialWeekly();
  const epargneTotal = getEpargneTotal();
  const globalScore = getGlobalScore();

  return (
    <div className="tab-grid" style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* PERIOD FILTER */}
      <div style={{ display: "flex", gap: 6 }}>
        {PERIOD_FILTERS.map(f => (
          <div key={f.id} onClick={() => setPeriod(f.id)}
            style={{ flex: 1, padding: "8px 0", borderRadius: 10, textAlign: "center", cursor: "pointer",
              fontSize: 12, fontWeight: 700,
              background: period === f.id ? "rgba(233,69,96,.15)" : "#0d0d24",
              border: `1px solid ${period === f.id ? "#e94560" : "#1e1e4a"}`,
              color: period === f.id ? "#e94560" : "#555" }}>
            {f.label}
          </div>
        ))}
      </div>

      {/* GLOBAL SCORE */}
      <div className="card" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Score global</div>
        <div style={{ fontSize: 40, fontWeight: 900, fontFamily: "'Space Mono'", color: globalScore >= 80 ? "#4caf50" : globalScore >= 50 ? "#ff9800" : "#e94560" }}>
          {globalScore}<span style={{ fontSize: 16, color: "#555" }}>%</span>
        </div>
        <div style={{ height: 8, background: "#0a0a1a", borderRadius: 4, marginTop: 8, overflow: "hidden" }}>
          <div style={{ width: `${globalScore}%`, height: "100%", borderRadius: 4, transition: "width .5s",
            background: globalScore >= 80 ? "linear-gradient(90deg,#4caf50,#2e7d32)" : globalScore >= 50 ? "linear-gradient(90deg,#ff9800,#f57c00)" : "linear-gradient(90deg,#e94560,#c23152)" }} />
        </div>
      </div>

      {/* QUICK STATS ROW */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
        <div className="card" style={{ padding: 14, textAlign: "center" }}>
          <div style={{ fontSize: 9, color: "#888" }}>Suppléments</div>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Space Mono'", color: suppAdherence >= 80 ? "#4caf50" : "#ff9800" }}>{suppAdherence}%</div>
        </div>
        <div className="card" style={{ padding: 14, textAlign: "center" }}>
          <div style={{ fontSize: 9, color: "#888" }}>Routine Dos / sem</div>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Space Mono'", color: routineDosCount >= DAILY_TARGET * 5 ? "#4caf50" : "#4a90d9" }}>{routineDosCount}</div>
        </div>
        <div className="card" style={{ padding: 14, textAlign: "center" }}>
          <div style={{ fontSize: 9, color: "#888" }}>Social / sem</div>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Space Mono'", color: socialCount > 0 ? "#4caf50" : "#555" }}>{socialCount}</div>
        </div>
        <div className="card" style={{ padding: 14, textAlign: "center" }}>
          <div style={{ fontSize: 9, color: "#888" }}>Épargne</div>
          <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Space Mono'", color: "#ffeb3b" }}>{epargneTotal.toLocaleString("fr-FR")}€</div>
        </div>
      </div>

      {/* WEIGHT CHART */}
      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>📉 Poids</div>
        {getWeightChartData().length > 1 ? (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={getWeightChartData()}>
              <defs>
                <linearGradient id="wG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e94560" stopOpacity={.3} />
                  <stop offset="100%" stopColor="#e94560" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fill: "#555", fontSize: 10 }} axisLine={{ stroke: "#1e1e4a" }} />
              <YAxis domain={["dataMin-1", "dataMax+1"]} tick={{ fill: "#555", fontSize: 10 }} axisLine={{ stroke: "#1e1e4a" }} />
              <Tooltip contentStyle={{ background: "#0d0d24", border: "1px solid #2a2a5a", borderRadius: 8, fontSize: 12, color: "#fff" }} />
              <Area type="monotone" dataKey="poids" stroke="#e94560" strokeWidth={2} fill="url(#wG)" dot={{ fill: "#e94560", r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ color: "#444", fontSize: 12, textAlign: "center", padding: 30 }}>2+ semaines → graph</div>
        )}
      </div>

      {/* HABITS HEATMAP */}
      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>🟩 Habitudes — Heatmap</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          {heatmap.map(h => {
            const color = h.pct >= 80 ? "#4caf50" : h.pct >= 50 ? "#ff9800" : h.pct > 0 ? "#e94560" : "#1a1a2e";
            const opacity = h.pct > 0 ? Math.max(0.3, h.pct / 100) : 0.15;
            return (
              <div key={h.date} title={`${h.date}: ${h.pct}%`} style={{
                width: 14, height: 14, borderRadius: 3,
                background: color, opacity,
              }} />
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 9, color: "#555" }}>
          <span>Moins</span>
          {[0.15, 0.3, 0.5, 0.7, 1].map((o, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: "#4caf50", opacity: o }} />
          ))}
          <span>Plus</span>
        </div>
      </div>

      {/* SYMPTOM RADAR */}
      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>🎯 Radar santé</div>
        {getSymptomRadarData().some(d => d.value > 0) ? (
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={getSymptomRadarData()}>
              <PolarGrid stroke="#1e1e4a" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "#888", fontSize: 9 }} />
              <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
              <Radar name="Score" dataKey="value" stroke="#e94560" fill="#e94560" fillOpacity={.2} strokeWidth={2} dot={{ fill: "#e94560", r: 3 }} />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ color: "#444", fontSize: 12, textAlign: "center", padding: 30 }}>Remplis tes symptômes</div>
        )}
      </div>

      {/* TEMPERATURE CHART */}
      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>🌡️ Températures</div>
        {getTempChartData().length > 1 ? (
          <>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={getTempChartData()}>
                <XAxis dataKey="name" tick={{ fill: "#555", fontSize: 9 }} axisLine={{ stroke: "#1e1e4a" }} />
                <YAxis domain={[36, 37.5]} tick={{ fill: "#555", fontSize: 10 }} axisLine={{ stroke: "#1e1e4a" }} />
                <Tooltip contentStyle={{ background: "#0d0d24", border: "1px solid #2a2a5a", borderRadius: 8, fontSize: 11, color: "#fff" }} />
                <Line type="monotone" dataKey="reveil" stroke="#4caf50" strokeWidth={2} dot={{ r: 2 }} connectNulls />
                <Line type="monotone" dataKey="apres" stroke="#ff9800" strokeWidth={2} dot={{ r: 2 }} connectNulls />
                <Line type="monotone" dataKey="aprem" stroke="#e94560" strokeWidth={2} dot={{ r: 2 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 8 }}>
              {[{ c: "#4caf50", l: "Réveil" }, { c: "#ff9800", l: "Repas" }, { c: "#e94560", l: "Aprem" }].map((x, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#888" }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: x.c }} />{x.l}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ color: "#444", fontSize: 12, textAlign: "center", padding: 30 }}>Quelques jours → courbes</div>
        )}
      </div>

      {/* SAVINGS CHART */}
      {(data.epargne?.transactions || []).length > 1 && (() => {
        const sorted = [...data.epargne.transactions].sort((a, b) => a.date.localeCompare(b.date));
        const chartData = [];
        let running = 0;
        for (const t of sorted) {
          running += t.amount;
          const existing = chartData.find(d => d.date === t.date);
          if (existing) { existing.total = running; } else { chartData.push({ date: t.date, name: t.date.slice(5), total: running }); }
        }
        return (
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>💰 Épargne</div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="eGS" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4caf50" stopOpacity={.3} />
                    <stop offset="100%" stopColor="#4caf50" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fill: "#555", fontSize: 9 }} axisLine={{ stroke: "#1e1e4a" }} />
                <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={{ stroke: "#1e1e4a" }} />
                <Tooltip contentStyle={{ background: "#0d0d24", border: "1px solid #2a2a5a", borderRadius: 8, fontSize: 11, color: "#fff" }} formatter={(v) => [`${v.toLocaleString("fr-FR")}€`, "Total"]} />
                <Area type="monotone" dataKey="total" stroke="#4caf50" strokeWidth={2} fill="url(#eGS)" dot={{ fill: "#4caf50", r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );
      })()}
    </div>
  );
}
