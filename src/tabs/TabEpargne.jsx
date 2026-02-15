import { useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

const TARGET = 30000;
const MILESTONES = [
  { amount: 5000, emoji: "🥉", label: "5K" },
  { amount: 10000, emoji: "🥈", label: "10K" },
  { amount: 15000, emoji: "🥇", label: "15K" },
  { amount: 20000, emoji: "💎", label: "20K" },
  { amount: 25000, emoji: "👑", label: "25K" },
  { amount: 30000, emoji: "🏆", label: "30K" },
];

const CATEGORIES = [
  { id: "salaire", label: "Salaire", emoji: "💼", color: "#4caf50" },
  { id: "freelance", label: "Freelance", emoji: "💻", color: "#4a90d9" },
  { id: "economies", label: "Économies", emoji: "🏦", color: "#ff9800" },
  { id: "ventes", label: "Ventes", emoji: "🏷️", color: "#e94560" },
  { id: "autre", label: "Autre", emoji: "📦", color: "#9c27b0" },
];

export default function TabEpargne({ data, save }) {
  const [showForm, setShowForm] = useState(false);
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState("salaire");
  const [formNote, setFormNote] = useState("");
  const [formIsWithdrawal, setFormIsWithdrawal] = useState(false);

  const epargne = data.epargne || { target: TARGET, transactions: [] };
  const transactions = epargne.transactions || [];
  const currentTotal = transactions.reduce((sum, t) => sum + t.amount, 0);
  const pct = Math.min(Math.round((currentTotal / TARGET) * 100), 100);

  const addTransaction = () => {
    const amount = parseFloat(formAmount);
    if (!amount || amount <= 0) return;
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.epargne) nd.epargne = { target: TARGET, transactions: [] };
    if (!nd.epargne.transactions) nd.epargne.transactions = [];
    nd.epargne.transactions.push({
      id: Date.now().toString(36),
      date: new Date().toISOString().split("T")[0],
      amount: formIsWithdrawal ? -amount : amount,
      category: formCategory,
      note: formNote,
    });
    save(nd);
    setFormAmount("");
    setFormNote("");
    setShowForm(false);
  };

  const getChartData = () => {
    if (transactions.length === 0) return [];
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    const data = [];
    let running = 0;
    for (const t of sorted) {
      running += t.amount;
      const existing = data.find(d => d.date === t.date);
      if (existing) {
        existing.total = running;
      } else {
        data.push({ date: t.date, name: t.date.slice(5), total: running });
      }
    }
    return data;
  };

  const getProjection = () => {
    if (transactions.length < 2) return null;
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    const first = new Date(sorted[0].date);
    const last = new Date(sorted[sorted.length - 1].date);
    const daysDiff = Math.max(1, (last - first) / 86400000);
    const dailyRate = currentTotal / daysDiff;
    if (dailyRate <= 0) return null;
    const remaining = TARGET - currentTotal;
    const daysNeeded = Math.ceil(remaining / dailyRate);
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysNeeded);
    const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
    return `${targetDate.getDate()} ${months[targetDate.getMonth()]} ${targetDate.getFullYear()}`;
  };

  const getCategoryTotals = () => {
    const totals = {};
    for (const t of transactions) {
      if (t.amount > 0) {
        totals[t.category] = (totals[t.category] || 0) + t.amount;
      }
    }
    return CATEGORIES.map(c => ({ ...c, total: totals[c.id] || 0 })).filter(c => c.total > 0);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* MAIN PROGRESS */}
      <div className="card" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>Objectif Épargne</div>
        <div style={{ fontSize: 36, fontWeight: 900, fontFamily: "'Space Mono'", color: currentTotal >= TARGET ? "#4caf50" : "#ffeb3b" }}>
          {currentTotal.toLocaleString("fr-FR")}<span style={{ fontSize: 16, color: "#555" }}>€</span>
        </div>
        <div style={{ fontSize: 12, color: "#888" }}>/ {TARGET.toLocaleString("fr-FR")}€</div>

        {/* Progress bar */}
        <div style={{ height: 12, background: "#0a0a1a", borderRadius: 6, marginTop: 16, overflow: "hidden", position: "relative" }}>
          <div style={{
            width: `${pct}%`, height: "100%",
            background: currentTotal >= TARGET ? "linear-gradient(90deg,#4caf50,#2e7d32)" : "linear-gradient(90deg,#e94560,#ff6b81,#ffeb3b)",
            borderRadius: 6, transition: "width .5s",
          }} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Space Mono'", color: "#e94560", marginTop: 8 }}>{pct}%</div>

        {/* Milestones */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, padding: "0 4px" }}>
          {MILESTONES.map(m => {
            const reached = currentTotal >= m.amount;
            return (
              <div key={m.amount} style={{ textAlign: "center", opacity: reached ? 1 : 0.3 }}>
                <div style={{ fontSize: 18 }}>{m.emoji}</div>
                <div style={{ fontSize: 8, color: reached ? "#4caf50" : "#555", fontWeight: 700, fontFamily: "'Space Mono'" }}>{m.label}</div>
              </div>
            );
          })}
        </div>

        {/* Projection */}
        {getProjection() && currentTotal < TARGET && (
          <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 10, background: "rgba(74,144,217,.1)", border: "1px solid rgba(74,144,217,.2)", fontSize: 11, color: "#4a90d9" }}>
            📈 À ce rythme, 30K le <strong>{getProjection()}</strong>
          </div>
        )}
      </div>

      {/* ADD BUTTON */}
      {!showForm && (
        <div onClick={() => setShowForm(true)}
          style={{ padding: "14px 0", borderRadius: 14, textAlign: "center", cursor: "pointer",
            background: "linear-gradient(135deg,#e94560,#c23152)", fontSize: 14, fontWeight: 700, color: "#fff" }}>
          + Ajouter une transaction
        </div>
      )}

      {/* FORM */}
      {showForm && (
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>💰 Nouvelle transaction</div>

          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <div onClick={() => setFormIsWithdrawal(false)}
              style={{ flex: 1, padding: "10px 0", borderRadius: 10, textAlign: "center", cursor: "pointer",
                background: !formIsWithdrawal ? "rgba(76,175,80,.15)" : "#0a0a1a",
                border: `1px solid ${!formIsWithdrawal ? "#4caf50" : "#1e1e4a"}`,
                color: !formIsWithdrawal ? "#4caf50" : "#555", fontSize: 12, fontWeight: 700 }}>
              + Dépôt
            </div>
            <div onClick={() => setFormIsWithdrawal(true)}
              style={{ flex: 1, padding: "10px 0", borderRadius: 10, textAlign: "center", cursor: "pointer",
                background: formIsWithdrawal ? "rgba(233,69,96,.15)" : "#0a0a1a",
                border: `1px solid ${formIsWithdrawal ? "#e94560" : "#1e1e4a"}`,
                color: formIsWithdrawal ? "#e94560" : "#555", fontSize: 12, fontWeight: 700 }}>
              − Retrait
            </div>
          </div>

          <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Montant (€)</div>
          <input type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)} placeholder="0"
            style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1px solid #2a2a4a", background: "#0a0a1a", color: "#fff", fontSize: 18, fontFamily: "'Space Mono'", textAlign: "center", marginBottom: 12, boxSizing: "border-box" }} />

          <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>Catégorie</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {CATEGORIES.map(c => (
              <div key={c.id} onClick={() => setFormCategory(c.id)}
                style={{ padding: "6px 12px", borderRadius: 10, cursor: "pointer", fontSize: 11, fontWeight: 600,
                  background: formCategory === c.id ? `${c.color}22` : "#0a0a1a",
                  border: `1px solid ${formCategory === c.id ? c.color : "#1e1e4a"}`,
                  color: formCategory === c.id ? c.color : "#555" }}>
                {c.emoji} {c.label}
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Note (optionnel)</div>
          <input type="text" value={formNote} onChange={e => setFormNote(e.target.value)} placeholder="Description..."
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #2a2a4a", background: "#0a0a1a", color: "#fff", fontSize: 12, fontFamily: "'Outfit'", marginBottom: 12, boxSizing: "border-box" }} />

          <div style={{ display: "flex", gap: 8 }}>
            <div onClick={addTransaction}
              style={{ flex: 1, padding: "12px 0", borderRadius: 12, textAlign: "center", fontSize: 14, fontWeight: 700, cursor: "pointer", background: "linear-gradient(135deg,#e94560,#c23152)", color: "#fff" }}>
              Sauvegarder
            </div>
            <div onClick={() => setShowForm(false)}
              style={{ padding: "12px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer", background: "rgba(255,255,255,.06)", color: "#888" }}>
              Annuler
            </div>
          </div>
        </div>
      )}

      {/* CHART */}
      {getChartData().length > 1 && (
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>📈 Évolution</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={getChartData()}>
              <defs>
                <linearGradient id="eG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4caf50" stopOpacity={.3} />
                  <stop offset="100%" stopColor="#4caf50" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fill: "#555", fontSize: 10 }} axisLine={{ stroke: "#1e1e4a" }} />
              <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={{ stroke: "#1e1e4a" }} />
              <Tooltip contentStyle={{ background: "#0d0d24", border: "1px solid #2a2a5a", borderRadius: 8, fontSize: 12, color: "#fff" }} formatter={(v) => [`${v.toLocaleString("fr-FR")}€`, "Total"]} />
              <Area type="monotone" dataKey="total" stroke="#4caf50" strokeWidth={2} fill="url(#eG)" dot={{ fill: "#4caf50", r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* CATEGORY BREAKDOWN */}
      {getCategoryTotals().length > 0 && (
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>📊 Par catégorie</div>
          {getCategoryTotals().map(c => {
            const barPct = currentTotal > 0 ? (c.total / currentTotal) * 100 : 0;
            return (
              <div key={c.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "#aaa" }}>{c.emoji} {c.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "'Space Mono'", color: c.color }}>{c.total.toLocaleString("fr-FR")}€</span>
                </div>
                <div style={{ height: 6, background: "#0a0a1a", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${barPct}%`, height: "100%", background: c.color, borderRadius: 3, transition: "width .3s" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RECENT TRANSACTIONS */}
      {transactions.length > 0 && (
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>📋 Transactions récentes</div>
          {[...transactions].reverse().slice(0, 10).map(t => {
            const cat = CATEGORIES.find(c => c.id === t.category);
            return (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderTop: "1px solid #0a0a1a" }}>
                <span style={{ fontSize: 16 }}>{cat?.emoji || "📦"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{cat?.label || t.category}{t.note ? ` — ${t.note}` : ""}</div>
                  <div style={{ fontSize: 10, color: "#555" }}>{t.date}</div>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Space Mono'", color: t.amount > 0 ? "#4caf50" : "#e94560" }}>
                  {t.amount > 0 ? "+" : ""}{t.amount.toLocaleString("fr-FR")}€
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
