import { useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import WeightForm from "../components/WeightForm.jsx";
import PhotoSlider, { PHOTO_CATEGORIES } from "../components/PhotoSlider.jsx";
import { getCurrentNutritionStage, getWeekNumber, getToday, isMonday, getNextMonday, getWeekInStage, getWeightAlert } from "../utils/helpers.js";

export default function TabWeight({ data, save, programNotStarted }) {
  const [weightEditMode, setWeightEditMode] = useState(false);
  const [weightPhotoModal, setWeightPhotoModal] = useState(null);
  const [sliderCategory, setSliderCategory] = useState("face");
  const [showSlider, setShowSlider] = useState(false);

  if (programNotStarted) return (
    <div className="card" style={{ textAlign: "center", padding: "32px 20px" }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>⚖️</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#ffeb3b" }}>Première pesée le 23 Février</div>
      <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Lundi 23 Février 2026</div>
    </div>
  );

  const currentWeekNum = getWeekNumber(getToday());
  const currentWeekKey = `w${currentWeekNum}`;
  const currentEntry = data.weight[currentWeekKey];
  const prevEntry = data.weight[`w${currentWeekNum - 1}`];
  const hasEntry = currentEntry?.poids;
  const stageInfo = getCurrentNutritionStage();
  const weekInStage = getWeekInStage(data);
  const alert = hasEntry ? getWeightAlert(data, currentWeekNum) : null;
  const todayIsMonday = isMonday(getToday());
  const nextMonday = getNextMonday(getToday());
  const nextMondayLabel = (() => { const d = new Date(nextMonday); return `${["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"][d.getDay()]} ${d.getDate()} ${["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"][d.getMonth()]}`; })();
  const showForm = !hasEntry || weightEditMode;
  const delta = hasEntry && prevEntry?.poids ? parseFloat(currentEntry.poids) - parseFloat(prevEntry.poids) : null;

  const saveWeightEntry = (weekNum, entry) => {
    const wk = `w${weekNum}`;
    const nd = JSON.parse(JSON.stringify(data));
    nd.weight[wk] = { ...entry, date: getToday() };
    save(nd);
    setWeightEditMode(false);
  };

  function getWeightChartData() {
    const d = [];
    const maxWeek = Math.max(...Object.keys(data.weight || {}).map(k => parseInt(k.replace("w", "")) || 0), 0);
    for (let w = 1; w <= Math.max(maxWeek, 20); w++) {
      const wk = data.weight[`w${w}`];
      if (wk?.poids) d.push({ name: `S${w}`, poids: parseFloat(wk.poids), week: w });
    }
    return d;
  }

  // Get all photos for a category across weeks
  function getPhotosForCategory(catId) {
    const result = [];
    const weeks = Object.keys(data.weight).sort();
    for (const wk of weeks) {
      const w = data.weight[wk];
      const weekNum = parseInt(wk.replace("w", ""));
      // Check photosV2 first, then fallback to legacy
      const photo = w?.photosV2?.[catId] || (catId === "face" ? w?.photos?.[0] : catId === "dos" ? w?.photos?.[1] : null);
      if (photo) result.push({ weekKey: wk, weekNum, photo, poids: w.poids });
    }
    return result;
  }

  // Find first and last photo for slider
  function getSliderPhotos(catId) {
    const photos = getPhotosForCategory(catId);
    if (photos.length < 2) return null;
    return { before: photos[0], after: photos[photos.length - 1] };
  }

  const hasAnyPhotos = Object.keys(data.weight).some(wk => {
    const w = data.weight[wk];
    return (w?.photosV2 && Object.values(w.photosV2).some(Boolean)) || w?.photos?.length > 0;
  });

  const photoCount = currentEntry?.photosV2 ? Object.values(currentEntry.photosV2).filter(Boolean).length : (currentEntry?.photos?.length || 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* SECTION A — Bandeau sèche */}
      <div className="card" style={{ background: "linear-gradient(145deg, #e9456015, #e9456008)", borderColor: "#e9456040" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 28 }}>🔴</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#e94560" }}>SÈCHE — Semaine {weekInStage}</div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>23 Février → 23 Juin 2026</div>
          </div>
        </div>
      </div>

      {/* SECTION B — Delta poids */}
      {hasEntry && (
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Cette semaine</div>
              <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "'Space Mono'", color: "#ffeb3b" }}>{currentEntry.poids}<span style={{ fontSize: 14, color: "#888" }}> kg</span></div>
            </div>
            {delta !== null && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>vs semaine dernière</div>
                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Space Mono'", color: delta > 0 ? "#e94560" : "#4caf50" }}>
                  {delta > 0 ? "+" : ""}{delta.toFixed(1)} kg {delta > 0 ? "↗️" : delta < 0 ? "↘️" : "→"}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION C — Alerte intelligente */}
      {alert && (
        <div style={{ padding: "12px 16px", borderRadius: 14, background: alert.type === "ok" ? "rgba(76,175,80,.1)" : "rgba(255,152,0,.1)", border: `1px solid ${alert.type === "ok" ? "rgba(76,175,80,.3)" : "rgba(255,152,0,.3)"}`, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>{alert.type === "ok" ? "✅" : "⚠️"}</span>
          <span style={{ fontSize: 12, color: alert.type === "ok" ? "#4caf50" : "#ff9800", fontWeight: 600 }}>{alert.text}</span>
        </div>
      )}

      {/* SECTION D — Formulaire ou résumé */}
      <div className="card">
        {!showForm ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>✅ Pesée enregistrée — S{currentWeekNum}</div>
              <div onClick={() => setWeightEditMode(true)} style={{ fontSize: 11, color: "#e94560", cursor: "pointer", fontWeight: 600 }}>Modifier</div>
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#555" }}>Poids</div>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Space Mono'", color: "#ffeb3b" }}>{currentEntry.poids} kg</div>
              </div>
              {currentEntry.tour_taille && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "#555" }}>Tour de taille</div>
                  <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Space Mono'", color: "#4a90d9" }}>{currentEntry.tour_taille} cm</div>
                </div>
              )}
              {currentEntry.energie && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "#555" }}>Énergie</div>
                  <div style={{ fontSize: 18 }}>{"⭐".repeat(currentEntry.energie)}{"☆".repeat(5 - currentEntry.energie)}</div>
                </div>
              )}
              {photoCount > 0 && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "#555" }}>Photos</div>
                  <div style={{ fontSize: 18, color: "#4caf50" }}>📸 {photoCount}/6</div>
                </div>
              )}
            </div>
          </>
        ) : (
          <WeightForm
            weekNum={currentWeekNum}
            existing={currentEntry}
            onSave={saveWeightEntry}
            onCancel={() => setWeightEditMode(false)}
          />
        )}
      </div>

      {/* Prochain jour de pesée */}
      {!todayIsMonday && !hasEntry && (
        <div style={{ padding: "10px 16px", borderRadius: 12, background: "rgba(233,69,96,.08)", border: "1px solid rgba(233,69,96,.2)", textAlign: "center" }}>
          <span style={{ fontSize: 12, color: "#e94560" }}>📅 Prochaine pesée : <strong>{nextMondayLabel}</strong></span>
        </div>
      )}

      {/* SECTION E — Graphique d'évolution */}
      {getWeightChartData().length > 1 && (
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>📈 Évolution du poids</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={getWeightChartData()}>
              <defs>
                <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e94560" stopOpacity={.3} />
                  <stop offset="100%" stopColor="#e94560" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fill: "#555", fontSize: 10 }} axisLine={{ stroke: "#1e1e4a" }} />
              <YAxis domain={["dataMin-1", "dataMax+1"]} tick={{ fill: "#555", fontSize: 10 }} axisLine={{ stroke: "#1e1e4a" }} />
              <Tooltip contentStyle={{ background: "#0d0d24", border: "1px solid #2a2a5a", borderRadius: 8, fontSize: 12, color: "#fff" }} formatter={(v) => [`${v} kg`, "Poids"]} />
              <Area type="monotone" dataKey="poids" stroke="#e94560" strokeWidth={2} fill="url(#wGrad)" dot={{ fill: "#e94560", r: 4 }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* BEFORE/AFTER SLIDER */}
      {hasAnyPhotos && (
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>🔄 Avant / Après</div>
            <div onClick={() => setShowSlider(!showSlider)} style={{ fontSize: 11, color: "#4a90d9", cursor: "pointer", fontWeight: 600 }}>
              {showSlider ? "Fermer" : "Voir"}
            </div>
          </div>
          {showSlider && (
            <>
              <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
                {PHOTO_CATEGORIES.map(cat => {
                  const hasPhotos = getSliderPhotos(cat.id);
                  return (
                    <div key={cat.id} onClick={() => hasPhotos && setSliderCategory(cat.id)}
                      style={{ padding: "4px 10px", borderRadius: 8, fontSize: 10, fontWeight: 600, cursor: hasPhotos ? "pointer" : "default",
                        background: sliderCategory === cat.id ? "rgba(233,69,96,.15)" : "transparent",
                        border: `1px solid ${sliderCategory === cat.id ? "#e94560" : hasPhotos ? "#1e1e4a" : "#0a0a1a"}`,
                        color: sliderCategory === cat.id ? "#e94560" : hasPhotos ? "#888" : "#333",
                        opacity: hasPhotos ? 1 : 0.4 }}>
                      {cat.emoji} {cat.label}
                    </div>
                  );
                })}
              </div>
              {(() => {
                const slider = getSliderPhotos(sliderCategory);
                return slider ? (
                  <PhotoSlider
                    beforePhoto={slider.before.photo}
                    afterPhoto={slider.after.photo}
                    beforeLabel={`S${slider.before.weekNum} — ${slider.before.poids}kg`}
                    afterLabel={`S${slider.after.weekNum} — ${slider.after.poids}kg`}
                  />
                ) : (
                  <div style={{ textAlign: "center", padding: 20, color: "#444", fontSize: 12 }}>
                    2+ semaines avec photos "{PHOTO_CATEGORIES.find(c => c.id === sliderCategory)?.label}" pour le slider
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}

      {/* SECTION F — Galerie photos par catégorie */}
      {hasAnyPhotos && (
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>📸 Évolution physique</div>
          {PHOTO_CATEGORIES.map(cat => {
            const photos = getPhotosForCategory(cat.id);
            if (photos.length === 0) return null;
            return (
              <div key={cat.id} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: "#888", fontWeight: 600, marginBottom: 6 }}>{cat.emoji} {cat.label}</div>
                <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, WebkitOverflowScrolling: "touch" }}>
                  {photos.map(p => (
                    <div key={p.weekKey} onClick={() => setWeightPhotoModal({ weekKey: p.weekKey, weekNum: p.weekNum, category: cat.id })} style={{ flexShrink: 0, cursor: "pointer" }}>
                      <div style={{ width: 70, height: 90, borderRadius: 10, overflow: "hidden", border: "2px solid #1e1e4a", position: "relative" }}>
                        <img src={p.photo} alt={`S${p.weekNum}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,.8))", padding: "3px 4px", textAlign: "center" }}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: "#fff" }}>S{p.weekNum}</div>
                          {p.poids && <div style={{ fontSize: 7, color: "#ffeb3b", fontFamily: "'Space Mono'" }}>{p.poids}kg</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modale photo plein écran */}
      {weightPhotoModal && (() => {
        const wk = data.weight[weightPhotoModal.weekKey];
        if (!wk) return null;
        const allPhotos = [];
        if (wk.photosV2) {
          for (const cat of PHOTO_CATEGORIES) {
            if (wk.photosV2[cat.id]) allPhotos.push({ label: cat.label, src: wk.photosV2[cat.id] });
          }
        } else if (wk.photos?.length) {
          wk.photos.forEach((p, i) => { if (p) allPhotos.push({ label: i === 0 ? "Face" : "Dos", src: p }); });
        }
        if (allPhotos.length === 0) return null;
        return (
          <div onClick={() => setWeightPhotoModal(null)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,.95)", zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 12 }}>Semaine {weightPhotoModal.weekNum} {wk.poids && <span style={{ color: "#ffeb3b", fontFamily: "'Space Mono'" }}>— {wk.poids} kg</span>}</div>
            <div style={{ display: "flex", gap: 10, maxWidth: "100%", overflow: "auto", flexWrap: "wrap", justifyContent: "center" }}>
              {allPhotos.map((photo, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <img src={photo.src} alt={photo.label} style={{ maxHeight: "55vh", maxWidth: "40vw", borderRadius: 12, objectFit: "contain" }} />
                  <div style={{ fontSize: 10, color: "#888", marginTop: 4 }}>{photo.label}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 12 }}>Toucher pour fermer</div>
          </div>
        );
      })()}

    </div>
  );
}
