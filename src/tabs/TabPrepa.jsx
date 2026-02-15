import { PREPA_CATEGORIES, getAllPrepaItems } from "../constants/prepa.js";

export default function TabPrepa({ data, save }) {
  const prepa = data.prepa || {};
  const allItems = getAllPrepaItems();
  const doneCount = allItems.filter(i => prepa[i.id]).length;
  const totalCount = allItems.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const allDone = doneCount === totalCount;

  const toggle = (itemId) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.prepa) nd.prepa = {};
    nd.prepa[itemId] = !nd.prepa[itemId];
    save(nd);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* PROGRESS HEADER */}
      <div className="card" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>{allDone ? "🎉" : "📋"}</div>
        {allDone ? (
          <>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#4caf50" }}>Tu es prêt !</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>Tout le matériel est rassemblé</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Préparation du matériel</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{doneCount}/{totalCount} items prêts</div>
          </>
        )}
        <div style={{ height: 8, background: "#0a0a1a", borderRadius: 4, marginTop: 12, overflow: "hidden" }}>
          <div style={{
            width: `${pct}%`, height: "100%",
            background: allDone ? "linear-gradient(90deg,#4caf50,#2e7d32)" : "linear-gradient(90deg,#e94560,#ff6b81)",
            borderRadius: 4, transition: "width .5s"
          }} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "'Space Mono'", color: allDone ? "#4caf50" : "#e94560", marginTop: 8 }}>
          {pct}%
        </div>
      </div>

      {/* CATEGORIES */}
      {PREPA_CATEGORIES.map(cat => {
        const catDone = cat.items.filter(i => prepa[i.id]).length;
        const catComplete = catDone === cat.items.length;
        return (
          <div key={cat.id} className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 20 }}>{cat.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{cat.label}</div>
                <div style={{ fontSize: 10, color: "#888" }}>{catDone}/{cat.items.length}</div>
              </div>
              {catComplete && <span style={{ fontSize: 16 }}>✅</span>}
            </div>
            {cat.items.map(item => {
              const done = prepa[item.id] || false;
              return (
                <div key={item.id} className={`ci ${done ? "done" : ""}`} onClick={() => toggle(item.id)}>
                  <div className="cb">{done ? "✓" : ""}</div>
                  <span style={{ fontSize: 18 }}>{item.emoji}</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: done ? 600 : 400 }}>{item.label}</span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
