import { Fragment } from "react";
import { EVENT_COLORS, PLANNING_HOURS, HOUR_HEIGHT } from "../constants/planning.js";
import { getToday, getMonday, getWeekDates, getEventsForDate, getEventPosition, formatWeekRange } from "../utils/helpers.js";

export default function TabPlanning({ data, selectedDate, setSelectedDate, planWeekStart, setPlanWeekStart, planViewMode, setPlanViewMode, setEditingEvent, setRecurActionPrompt, navigatePlanWeek }) {
  const today = getToday();
  const weekDates = getWeekDates(planWeekStart);
  const isCurrentWeek = planWeekStart === getMonday(today);
  const dayNames = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
  const isDesktop = typeof window !== "undefined" && window.innerWidth >= 769;
  const effectiveView = isDesktop ? "week" : planViewMode;

  const openNewEvent = (dateStr, hour) => {
    setEditingEvent({ isNew: true, date: dateStr, startH: hour, startM: 0, endH: Math.min(hour + 1, 23), endM: 0, color: EVENT_COLORS[0].hex, title: "", notes: "", recurrence: null });
  };

  const handleEventClick = (evt, e) => {
    e.stopPropagation();
    if (evt._isRecurring) {
      setRecurActionPrompt({ event: evt, action: "edit" });
    } else {
      setEditingEvent({ ...evt, isNew: false });
    }
  };

  const renderTimeLine = (leftOffset) => {
    const now = new Date();
    const nowH = now.getHours(), nowM = now.getMinutes();
    if (nowH < 6 || nowH > 23) return null;
    const topPx = ((nowH - 6) * 60 + nowM) / 60 * HOUR_HEIGHT;
    return (
      <div style={{ position: "absolute", top: topPx, left: leftOffset, right: 0, height: 2, background: "#e94560", zIndex: 20, pointerEvents: "none" }}>
        <div style={{ width: 8, height: 8, borderRadius: 4, background: "#e94560", position: "absolute", left: -4, top: -3 }} />
      </div>
    );
  };

  const renderEventBlock = (evt, isWeekView) => {
    const { top, height } = getEventPosition(evt);
    return (
      <div key={`${evt.id}-${evt._occurrenceDate}`} onClick={(e) => handleEventClick(evt, e)}
        style={{ position: "absolute", top, left: isWeekView ? 2 : 48, right: isWeekView ? 2 : 8, height,
          background: `${evt.color}22`, borderLeft: `${isWeekView ? 3 : 4}px solid ${evt.color}`,
          borderRadius: isWeekView ? 6 : 8, padding: isWeekView ? "2px 4px" : "6px 10px",
          cursor: "pointer", overflow: "hidden", zIndex: 10 }}>
        <div style={{ fontSize: isWeekView ? 9 : 12, fontWeight: 700, color: evt.color, lineHeight: 1.2 }}>
          {evt._isRecurring && !isWeekView && <span style={{ opacity: 0.5, marginRight: 4 }}>🔄</span>}
          {evt.title}
        </div>
        {height > (isWeekView ? 30 : 24) && (
          <div style={{ fontSize: isWeekView ? 8 : 10, color: "#888" }}>
            {evt.startH}:{String(evt.startM).padStart(2,"0")} — {evt.endH}:{String(evt.endM).padStart(2,"0")}
          </div>
        )}
        {!isWeekView && evt.notes && height > 50 && <div style={{ fontSize: 9, color: "#555", marginTop: 2 }}>{evt.notes}</div>}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* WEEK NAVIGATION */}
      <div className="card" style={{ padding: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button className="na" onClick={() => navigatePlanWeek(-1)}>←</button>
          <div style={{ textAlign: "center", fontSize: 13, fontWeight: 700 }}>{formatWeekRange(weekDates)}</div>
          <button className="na" onClick={() => navigatePlanWeek(1)}>→</button>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 8, justifyContent: "center" }}>
          {!isCurrentWeek && (
            <div onClick={() => setPlanWeekStart(getMonday(today))}
              style={{ padding: "4px 12px", borderRadius: 10, fontSize: 11, fontWeight: 600, cursor: "pointer", background: "rgba(233,69,96,.15)", color: "#e94560" }}>
              Aujourd'hui
            </div>
          )}
          {!isDesktop && (
            <div onClick={() => setPlanViewMode(planViewMode === "day" ? "week" : "day")}
              style={{ padding: "4px 12px", borderRadius: 10, fontSize: 11, fontWeight: 600, cursor: "pointer", background: "rgba(74,144,217,.15)", color: "#4a90d9" }}>
              {planViewMode === "day" ? "Vue semaine" : "Vue jour"}
            </div>
          )}
        </div>
      </div>

      {/* DAY SELECTOR (day view) */}
      {effectiveView === "day" && (
        <div style={{ display: "flex", gap: 4, padding: "0 4px" }}>
          {weekDates.map((dateStr, i) => {
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            const dayNum = new Date(dateStr).getDate();
            return (
              <div key={dateStr} onClick={() => setSelectedDate(dateStr)}
                style={{ flex: 1, textAlign: "center", padding: "8px 2px", borderRadius: 12, cursor: "pointer",
                  background: isSelected ? "rgba(233,69,96,.15)" : "transparent",
                  border: `1px solid ${isSelected ? "#e94560" : isToday ? "rgba(76,175,80,.4)" : "transparent"}` }}>
                <div style={{ fontSize: 9, color: isSelected ? "#e94560" : "#555", fontWeight: 700 }}>{dayNames[i]}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: isToday ? "#4caf50" : isSelected ? "#fff" : "#888" }}>{dayNum}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* WEEK GRID */}
      {effectiveView === "week" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "40px repeat(7, 1fr)", borderBottom: "1px solid #1e1e4a" }}>
            <div />
            {weekDates.map((dateStr, i) => {
              const isToday = dateStr === today;
              const dayNum = new Date(dateStr).getDate();
              return (
                <div key={dateStr} style={{ textAlign: "center", padding: "8px 2px", borderLeft: "1px solid #1a1a2e", background: isToday ? "rgba(76,175,80,.06)" : "transparent" }}>
                  <div style={{ fontSize: 9, color: isToday ? "#4caf50" : "#555", fontWeight: 700 }}>{dayNames[i]}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isToday ? "#4caf50" : "#fff",
                    width: 24, height: 24, borderRadius: 12, background: isToday ? "rgba(76,175,80,.2)" : "transparent",
                    display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{dayNum}</div>
                </div>
              );
            })}
          </div>
          <div style={{ overflowY: "auto", maxHeight: "60vh", position: "relative" }}>
            <div style={{ display: "grid", gridTemplateColumns: "40px repeat(7, 1fr)", gridTemplateRows: `repeat(${PLANNING_HOURS.length}, ${HOUR_HEIGHT}px)` }}>
              {PLANNING_HOURS.map((h, rowIdx) => (
                <Fragment key={`row-${h}`}>
                  <div style={{ gridColumn: 1, gridRow: rowIdx + 1, height: HOUR_HEIGHT, borderTop: "1px solid #111",
                    display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 4,
                    fontSize: 9, color: "#444", fontFamily: "'Space Mono'" }}>{h}h</div>
                  {weekDates.map((dateStr, colIdx) => (
                    <div key={`${dateStr}-${h}`} className="plan-cell"
                      onClick={() => openNewEvent(dateStr, h)}
                      style={{ gridColumn: colIdx + 2, gridRow: rowIdx + 1, height: HOUR_HEIGHT, minHeight: 60,
                        borderTop: "1px solid #111", borderLeft: "1px solid #1a1a2e",
                        background: dateStr === today ? "rgba(76,175,80,.03)" : "transparent",
                        cursor: "pointer", position: "relative", zIndex: 1 }} />
                  ))}
                </Fragment>
              ))}
            </div>
            {weekDates.map((dateStr, colIdx) => {
              const events = getEventsForDate(data.planning, dateStr);
              if (events.length === 0) return null;
              return (
                <div key={`evts-${dateStr}`} style={{ position: "absolute", top: 0, left: `calc(40px + ${colIdx} * (100% - 40px) / 7)`,
                  width: `calc((100% - 40px) / 7)`, height: PLANNING_HOURS.length * HOUR_HEIGHT, pointerEvents: "none" }}>
                  {events.map(evt => {
                    const { top, height } = getEventPosition(evt);
                    return (
                      <div key={`${evt.id}-${evt._occurrenceDate}`} onClick={(e) => handleEventClick(evt, e)}
                        style={{ position: "absolute", top, left: 2, right: 2, height,
                          background: `${evt.color}22`, borderLeft: `3px solid ${evt.color}`,
                          borderRadius: 6, padding: "2px 4px",
                          cursor: "pointer", overflow: "hidden", zIndex: 10, pointerEvents: "auto" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: evt.color, lineHeight: 1.2 }}>
                          {evt.title}
                        </div>
                        {height > 30 && (
                          <div style={{ fontSize: 8, color: "#888" }}>
                            {evt.startH}:{String(evt.startM).padStart(2,"0")} — {evt.endH}:{String(evt.endM).padStart(2,"0")}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
            {isCurrentWeek && (() => {
              const todayCol = weekDates.indexOf(today);
              if (todayCol === -1) return null;
              const now = new Date();
              const nowH = now.getHours(), nowM = now.getMinutes();
              if (nowH < 6 || nowH > 23) return null;
              const topPx = ((nowH - 6) * 60 + nowM) / 60 * HOUR_HEIGHT;
              return (
                <div style={{ position: "absolute", top: topPx, left: `calc(40px + ${todayCol} * (100% - 40px) / 7)`,
                  width: `calc((100% - 40px) / 7)`, height: 2, background: "#e94560", zIndex: 20, pointerEvents: "none" }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: "#e94560", position: "absolute", left: -4, top: -3 }} />
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* DAY GRID */}
      {effectiveView === "day" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #1e1e4a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button className="na" style={{ width: 32, height: 32 }} onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d.toISOString().split("T")[0]); }}>←</button>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                {dayNames[(new Date(selectedDate).getDay() + 6) % 7]} {new Date(selectedDate).getDate()} {["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"][new Date(selectedDate).getMonth()]}
              </div>
              {selectedDate === today && <div style={{ fontSize: 9, color: "#4caf50", fontWeight: 700 }}>AUJOURD'HUI</div>}
            </div>
            <button className="na" style={{ width: 32, height: 32 }} onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d.toISOString().split("T")[0]); }}>→</button>
          </div>
          <div style={{ position: "relative", overflowY: "auto", maxHeight: "65vh" }}>
            {PLANNING_HOURS.map(h => (
              <div key={h} className="plan-cell"
                onClick={() => openNewEvent(selectedDate, h)}
                style={{ display: "flex", height: HOUR_HEIGHT, minHeight: 60, borderTop: "1px solid #111",
                  cursor: "pointer", position: "relative", zIndex: 1 }}>
                <div style={{ width: 44, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 4,
                  fontSize: 10, color: "#444", fontFamily: "'Space Mono'", pointerEvents: "none" }}>{h}:00</div>
                <div style={{ flex: 1, pointerEvents: "none" }} />
              </div>
            ))}
            {getEventsForDate(data.planning, selectedDate).map(evt => renderEventBlock(evt, false))}
            {selectedDate === today && renderTimeLine(44)}
          </div>
        </div>
      )}

      {/* FAB (mobile day view) */}
      {effectiveView === "day" && (
        <div onClick={() => { const h = Math.max(6, Math.min(22, new Date().getHours())); openNewEvent(selectedDate, h); }}
          style={{ position: "fixed", bottom: 100, right: 20, width: 48, height: 48, borderRadius: 24,
            background: "linear-gradient(135deg,#e94560,#c23152)", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, color: "#fff", cursor: "pointer", zIndex: 90, boxShadow: "0 4px 20px rgba(233,69,96,.4)", fontWeight: 300 }}>+</div>
      )}

    </div>
  );
}
