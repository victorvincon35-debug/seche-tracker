import { useState, useRef } from "react";
import { compressImage } from "../utils/helpers.js";
import { PHOTO_CATEGORIES } from "./PhotoSlider.jsx";

export default function WeightForm({ weekNum, existing, onSave, onCancel }) {
  const [poids, setPoids] = useState(existing?.poids || "");
  const [tourTaille, setTourTaille] = useState(existing?.tour_taille || "");
  const [energie, setEnergie] = useState(existing?.energie || 0);
  const [uploading, setUploading] = useState(false);

  // Migrate old photos array to categorized object if needed
  const initPhotos = () => {
    if (existing?.photosV2) return existing.photosV2;
    if (existing?.photos?.length > 0) {
      const migrated = {};
      if (existing.photos[0]) migrated.face = existing.photos[0];
      if (existing.photos[1]) migrated.dos = existing.photos[1];
      return migrated;
    }
    return {};
  };
  const [photos, setPhotos] = useState(initPhotos);
  const fileRefs = useRef({});

  const handlePhoto = async (file, catId) => {
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file, 400, 0.6);
      setPhotos(prev => ({ ...prev, [catId]: compressed }));
    } catch (e) { console.error("Photo compression error:", e); }
    setUploading(false);
  };

  const handleSave = () => {
    if (!poids) return;
    // Also maintain legacy photos array for backward compat
    const legacyPhotos = [photos.face, photos.dos].filter(Boolean);
    onSave(weekNum, {
      poids: parseFloat(poids),
      tour_taille: tourTaille ? parseFloat(tourTaille) : null,
      energie,
      photos: legacyPhotos,
      photosV2: photos,
    });
  };

  const photoCount = Object.values(photos).filter(Boolean).length;

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>⚖️ Pesée — Semaine {weekNum}</div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 20 }}>⚖️</span>
        <span style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>Poids (kg)</span>
        <input type="number" step="0.1" value={poids} placeholder="Ex: 78.5" onChange={e => setPoids(e.target.value)}
          style={{ width: 100, background: "#0a0a1a", border: "1px solid #1e1e4a", borderRadius: 10, padding: "8px 12px", color: "#ffeb3b", fontSize: 16, fontWeight: 700, fontFamily: "'Space Mono'", textAlign: "right", outline: "none" }} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 20 }}>📏</span>
        <span style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>Tour de taille (cm) <span style={{ color: "#555", fontWeight: 400 }}>optionnel</span></span>
        <input type="number" step="0.5" value={tourTaille} placeholder="-" onChange={e => setTourTaille(e.target.value)}
          style={{ width: 100, background: "#0a0a1a", border: "1px solid #1e1e4a", borderRadius: 10, padding: "8px 12px", color: "#4a90d9", fontSize: 16, fontWeight: 700, fontFamily: "'Space Mono'", textAlign: "right", outline: "none" }} />
      </div>

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

      <div style={{ paddingTop: 12, borderTop: "1px solid #1e1e4a", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 20 }}>📸</span>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Photos physique ({photoCount}/6)</span>
          {uploading && <span style={{ fontSize: 10, color: "#e94560", animation: "pulse 1s infinite" }}>Compression...</span>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {PHOTO_CATEGORIES.map(cat => {
            const hasPhoto = photos[cat.id];
            return (
              <div key={cat.id}>
                <input ref={el => { fileRefs.current[cat.id] = el; }} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
                  onChange={e => { if (e.target.files[0]) handlePhoto(e.target.files[0], cat.id); }} />
                {hasPhoto ? (
                  <div style={{ position: "relative" }}>
                    <img src={photos[cat.id]} alt={cat.label} style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 10, border: "2px solid #4caf50" }} />
                    <div onClick={() => fileRefs.current[cat.id]?.click()}
                      style={{ position: "absolute", bottom: 4, right: 4, background: "rgba(0,0,0,.7)", borderRadius: 6, padding: "2px 6px", fontSize: 9, color: "#fff", cursor: "pointer" }}>Changer</div>
                    <div style={{ position: "absolute", top: 4, left: 4, background: "rgba(76,175,80,.9)", borderRadius: 4, padding: "1px 5px", fontSize: 8, fontWeight: 700, color: "#fff" }}>{cat.label} ✓</div>
                  </div>
                ) : (
                  <div onClick={() => fileRefs.current[cat.id]?.click()}
                    style={{ width: "100%", height: 90, borderRadius: 10, border: "2px dashed #1e1e4a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "#0a0a1a" }}>
                    <span style={{ fontSize: 18, opacity: .4 }}>{cat.emoji}</span>
                    <span style={{ fontSize: 9, color: "#555", marginTop: 2 }}>{cat.label}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

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
