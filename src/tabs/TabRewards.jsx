import RewardCard from "../components/RewardCard.jsx";
import { WEEKLY_REWARDS } from "../constants/cities.js";
import { isWeekComplete, getWeekAvgScore, ACHIEVEMENT_REWARDS } from "../utils/scoring.js";

export default function TabRewards({ data, markRewardSeen, unlockedCount, totalRewards }) {
  return (
    <div className="tab-grid" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card" style={{ textAlign: "center", padding: 20, background: "linear-gradient(145deg,#0d0d24,#1a0a2e,#0d0d24)", border: "1px solid #2a1a4a" }}>
        <div style={{ fontSize: 11, color: "#ffeb3b", fontWeight: 700, letterSpacing: 2, fontFamily: "'Space Mono'", marginBottom: 8 }}>🎁 CADEAUX ITALIE 🇮🇹</div>
        <div style={{ fontSize: 42, fontWeight: 900, background: "linear-gradient(135deg,#e94560,#ffeb3b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{unlockedCount}<span style={{ fontSize: 20 }}>/{totalRewards}</span></div>
        <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>débloqués pour ton voyage</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 12 }}>
          {[...Array(totalRewards)].map((_, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: 5, background: i < unlockedCount ? "linear-gradient(135deg,#e94560,#ffeb3b)" : "#1e1e4a" }} />
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>📅 Récompenses Hebdo</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {WEEKLY_REWARDS.map(r => {
            const unlocked = isWeekComplete(data, r.week);
            const ws = Math.round(getWeekAvgScore(data, r.week));
            return (
              <div key={r.week}>
                <RewardCard reward={r} unlocked={unlocked} isNew={false} onClick={() => {}} />
                {!unlocked && (
                  <div style={{ marginTop: 4, padding: "0 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <span style={{ fontSize: 10, color: "#444" }}>Semaine {r.week}</span>
                      <span style={{ fontSize: 10, color: "#555", fontFamily: "'Space Mono'" }}>{ws}%/70%</span>
                    </div>
                    <div style={{ height: 3, background: "#111", borderRadius: 2 }}>
                      <div style={{ width: `${Math.min((ws / 70) * 100, 100)}%`, height: "100%", background: ws >= 70 ? "#4caf50" : "#e94560", borderRadius: 2 }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>🏆 Achievements</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {ACHIEVEMENT_REWARDS.map(r => {
            const unlocked = r.check(data);
            const isNew = unlocked && !(data.seenRewards || []).includes(r.id);
            return (
              <RewardCard key={r.id} reward={r} unlocked={unlocked} isNew={isNew}
                onClick={() => { if (isNew) markRewardSeen(r.id); }} />
            );
          })}
        </div>
      </div>
    </div>
  );
}
