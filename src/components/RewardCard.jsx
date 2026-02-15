export default function RewardCard({ reward, unlocked, isNew, onClick }) {
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
