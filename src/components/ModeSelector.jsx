import { useState, useEffect } from "react";
import { SIX_WEEKS_START, SIX_WEEKS_END, SIX_WEEKS_DAYS, get6wDaysRemaining } from "../constants/sixweeks.js";

export default function ModeSelector({ onSelectMode }) {
  const [daysLeft, setDaysLeft] = useState(get6wDaysRemaining());
  const [appeared, setAppeared] = useState(false);

  useEffect(() => {
    setTimeout(() => setAppeared(true), 100);
    const interval = setInterval(() => setDaysLeft(get6wDaysRemaining()), 60000);
    return () => clearInterval(interval);
  }, []);

  const today = new Date();
  const start = new Date(SIX_WEEKS_START);
  const end = new Date(SIX_WEEKS_END);
  const hasStarted = today >= start;
  const isOver = today > end;
  const dayNum = hasStarted ? Math.min(SIX_WEEKS_DAYS, Math.floor((today - start) / 86400000) + 1) : 0;

  // Countdown display
  const hours = Math.floor((daysLeft * 24 * 3600000 - (today - new Date(today.toISOString().split("T")[0]))) / 3600000) % 24;

  return (
    <div style={{
      fontFamily: "'Outfit',sans-serif",
      background: "#0a0a1a",
      minHeight: "100vh",
      color: "white",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 20px",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes msPulse{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.02)}}
        @keyframes msGlow{0%,100%{box-shadow:0 0 20px rgba(233,69,96,.2)}50%{box-shadow:0 0 40px rgba(233,69,96,.4)}}
        @keyframes msSlideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
        @keyframes msFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes msFire{0%{text-shadow:0 0 4px #e94560}50%{text-shadow:0 0 16px #e94560,0 0 30px #ff6b81}100%{text-shadow:0 0 4px #e94560}}
        @keyframes msCountdown{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
        @keyframes msParticle{0%{opacity:0;transform:translateY(0) scale(0)}50%{opacity:.8}100%{opacity:0;transform:translateY(-60px) scale(1)}}
      `}</style>

      {/* Background particles */}
      {[...Array(8)].map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${10 + Math.random() * 80}%`,
          bottom: `${Math.random() * 40}%`,
          fontSize: 8 + Math.random() * 12,
          opacity: 0,
          animation: `msParticle ${3 + Math.random() * 4}s ease ${Math.random() * 3}s infinite`,
          color: i % 2 === 0 ? "#e94560" : "#ff6b81",
        }}>{"●◆▲★"[i % 4]}</div>
      ))}

      {/* Title */}
      <div style={{
        opacity: appeared ? 1 : 0,
        transform: appeared ? "translateY(0)" : "translateY(30px)",
        transition: "all .6s ease",
        textAlign: "center",
        marginBottom: 40,
      }}>
        <div style={{ fontSize: 14, fontFamily: "'Space Mono'", letterSpacing: 4, color: "#e94560", marginBottom: 8, textTransform: "uppercase" }}>
          Seche Tracker
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.2 }}>
          Choisis ton <span style={{ background: "linear-gradient(135deg,#e94560,#ff6b81)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>mode</span>
        </div>
      </div>

      {/* Card: CHALLENGE 6 SEMAINES */}
      <div
        onClick={() => onSelectMode("6weeks")}
        style={{
          width: "100%",
          maxWidth: 380,
          background: "linear-gradient(145deg, #1a0a12, #0d0d24)",
          border: "2px solid #e94560",
          borderRadius: 24,
          padding: "28px 24px",
          marginBottom: 16,
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
          opacity: appeared ? 1 : 0,
          transform: appeared ? "translateY(0)" : "translateY(40px)",
          transition: "all .6s ease .15s",
          animation: "msGlow 3s ease infinite",
        }}
      >
        {/* Gradient overlay */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: "linear-gradient(135deg, rgba(233,69,96,.08), transparent 60%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: "linear-gradient(135deg,#e94560,#c23152)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26, animation: "msFloat 3s ease infinite",
            }}>🔥</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, animation: "msFire 2s ease infinite" }}>
                CHALLENGE 6 SEMAINES
              </div>
              <div style={{ fontSize: 12, color: "#ff6b81", fontWeight: 600 }}>
                42 jours pour tout changer
              </div>
            </div>
          </div>

          {/* Countdown / Progress */}
          {!isOver && (
            <div style={{
              background: "rgba(233,69,96,.1)",
              border: "1px solid rgba(233,69,96,.2)",
              borderRadius: 14,
              padding: "12px 16px",
              marginTop: 8,
            }}>
              {hasStarted ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: "#888" }}>Jour {dayNum}/{SIX_WEEKS_DAYS}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, fontFamily: "'Space Mono'", color: "#e94560", animation: "msCountdown 2s ease infinite" }}>
                      {daysLeft}j restants
                    </span>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,.06)", borderRadius: 3 }}>
                    <div style={{
                      width: `${(dayNum / SIX_WEEKS_DAYS) * 100}%`,
                      height: "100%",
                      background: "linear-gradient(90deg,#e94560,#ff6b81)",
                      borderRadius: 3,
                      transition: "width .5s",
                    }} />
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Debut le 2 mars 2026</div>
                  <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "'Space Mono'", color: "#e94560" }}>
                    J-{Math.max(0, Math.ceil((start - today) / 86400000))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Features preview */}
          <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
            {["Routine", "Nutrition", "Training", "Business", "Objectifs"].map(f => (
              <span key={f} style={{
                padding: "4px 10px", borderRadius: 20,
                background: "rgba(233,69,96,.12)",
                fontSize: 10, fontWeight: 600, color: "#e94560",
              }}>{f}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Card: MODE NORMAL */}
      <div
        onClick={() => onSelectMode("normal")}
        style={{
          width: "100%",
          maxWidth: 380,
          background: "linear-gradient(145deg, #0d0d24, #151535)",
          border: "1px solid #2a2a4a",
          borderRadius: 24,
          padding: "24px 24px",
          cursor: "pointer",
          opacity: appeared ? 1 : 0,
          transform: appeared ? "translateY(0)" : "translateY(40px)",
          transition: "all .6s ease .3s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: "rgba(255,255,255,.06)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24,
          }}>🇮🇹</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>MODE NORMAL</div>
            <div style={{ fontSize: 12, color: "#888" }}>Suivi classique</div>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 20, color: "#555" }}>→</div>
        </div>
      </div>

      {/* Bottom hint */}
      <div style={{
        marginTop: 32,
        fontSize: 11,
        color: "#444",
        textAlign: "center",
        opacity: appeared ? 1 : 0,
        transition: "opacity .6s ease .5s",
      }}>
        Tu peux changer de mode a tout moment
      </div>
    </div>
  );
}
