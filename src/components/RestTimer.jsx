export default function RestTimer({ seconds, running, preset, onStop, onDismiss }) {
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
