import { useState, useRef } from "react";

const PHOTO_CATEGORIES = [
  { id: "face", label: "Face", emoji: "😊" },
  { id: "dos", label: "Dos", emoji: "🔙" },
  { id: "gauche", label: "Côté G", emoji: "👈" },
  { id: "droite", label: "Côté D", emoji: "👉" },
  { id: "abdos", label: "Abdos", emoji: "💪" },
  { id: "bras", label: "Bras", emoji: "🦾" },
];

export { PHOTO_CATEGORIES };

export default function PhotoSlider({ beforePhoto, afterPhoto, beforeLabel, afterLabel }) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef(null);

  if (!beforePhoto || !afterPhoto) return null;

  const handleMove = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  };

  return (
    <div ref={containerRef}
      onMouseMove={e => { if (e.buttons === 1) handleMove(e.clientX); }}
      onTouchMove={e => handleMove(e.touches[0].clientX)}
      onClick={e => handleMove(e.clientX)}
      style={{ position: "relative", width: "100%", height: 280, borderRadius: 16, overflow: "hidden", cursor: "col-resize", userSelect: "none", WebkitUserSelect: "none" }}>

      {/* After (background) */}
      <img src={afterPhoto} alt="Après" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />

      {/* Before (clipped) */}
      <div style={{ position: "absolute", inset: 0, width: `${sliderPos}%`, overflow: "hidden" }}>
        <img src={beforePhoto} alt="Avant" style={{ position: "absolute", top: 0, left: 0, width: containerRef.current?.offsetWidth || "100%", height: "100%", objectFit: "cover" }} />
      </div>

      {/* Slider line */}
      <div style={{ position: "absolute", top: 0, bottom: 0, left: `${sliderPos}%`, width: 3, background: "#fff", zIndex: 5, transform: "translateX(-1.5px)" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 32, height: 32, borderRadius: 16, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, boxShadow: "0 2px 8px rgba(0,0,0,.4)" }}>
          ⟷
        </div>
      </div>

      {/* Labels */}
      <div style={{ position: "absolute", top: 8, left: 8, background: "rgba(0,0,0,.7)", padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, color: "#fff", zIndex: 6 }}>
        {beforeLabel || "Avant"}
      </div>
      <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,.7)", padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, color: "#fff", zIndex: 6 }}>
        {afterLabel || "Après"}
      </div>
    </div>
  );
}
