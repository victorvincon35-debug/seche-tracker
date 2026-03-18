import { useState } from "react";
import { BUSINESS_PROJECTS } from "../constants/sixweeks.js";

export default function Tab6wBusiness({ data, save }) {
  const [expandedProject, setExpandedProject] = useState(null);

  const sw = data.sixWeeks || {};
  const businessData = sw.business || {};
  const countersData = sw.businessCounters || {};

  const toggleTask = (taskId) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.sixWeeks) nd.sixWeeks = {};
    if (!nd.sixWeeks.business) nd.sixWeeks.business = {};
    nd.sixWeeks.business[taskId] = !nd.sixWeeks.business[taskId];
    save(nd);
  };

  const updateCounter = (counterId, delta) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.sixWeeks) nd.sixWeeks = {};
    if (!nd.sixWeeks.businessCounters) nd.sixWeeks.businessCounters = {};
    const current = nd.sixWeeks.businessCounters[counterId] || 0;
    nd.sixWeeks.businessCounters[counterId] = Math.max(0, current + delta);
    save(nd);
  };

  // Global progress
  const allTasks = BUSINESS_PROJECTS.flatMap(p => p.tasks);
  const totalTasks = allTasks.length;
  const doneTasks = allTasks.filter(t => businessData[t.id]).length;
  const globalProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Main objective */}
      <div className="card" style={{ textAlign: "center", padding: 24, position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: "linear-gradient(135deg, rgba(233,69,96,.06), transparent 60%)",
          pointerEvents: "none",
        }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>💰</div>
          <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>
            100K <span style={{ fontSize: 16, color: "#e94560" }}>euros/mois</span>
          </div>
          <div style={{ fontSize: 12, color: "#888", fontStyle: "italic" }}>
            Pas de dispersion. Focus total.
          </div>

          {/* Global progress */}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: "#888" }}>Progression globale</span>
              <span style={{ fontSize: 12, fontWeight: 800, fontFamily: "'Space Mono'", color: "#e94560" }}>{globalProgress}%</span>
            </div>
            <div style={{ height: 8, background: "rgba(255,255,255,.06)", borderRadius: 4 }}>
              <div style={{
                width: `${globalProgress}%`,
                height: "100%",
                background: "linear-gradient(90deg,#e94560,#ff6b81)",
                borderRadius: 4,
                transition: "width .4s",
              }} />
            </div>
            <div style={{ fontSize: 10, color: "#555", marginTop: 4 }}>
              {doneTasks}/{totalTasks} taches completees
            </div>
          </div>
        </div>
      </div>

      {/* Projects */}
      {BUSINESS_PROJECTS.map(project => {
        const isExpanded = expandedProject === project.id;
        const projectDone = project.tasks.filter(t => businessData[t.id]).length;
        const projectTotal = project.tasks.length;
        const projectProgress = projectTotal > 0 ? Math.round((projectDone / projectTotal) * 100) : 0;

        return (
          <div key={project.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
            {/* Project header */}
            <div
              onClick={() => setExpandedProject(isExpanded ? null : project.id)}
              style={{
                padding: "16px 16px",
                cursor: "pointer",
                borderLeft: `4px solid ${project.color}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: `${project.color}20`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20,
                }}>
                  {project.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800 }}>{project.label}</div>
                  <div style={{ fontSize: 10, color: "#888" }}>{projectDone}/{projectTotal} taches</div>
                </div>
                <div style={{
                  padding: "4px 10px", borderRadius: 20,
                  background: projectProgress === 100 ? "rgba(76,175,80,.15)" : `${project.color}15`,
                  fontSize: 12, fontWeight: 800, fontFamily: "'Space Mono'",
                  color: projectProgress === 100 ? "#4caf50" : project.color,
                }}>
                  {projectProgress}%
                </div>
                <span style={{ fontSize: 12, color: "#555", transform: isExpanded ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }}>▼</span>
              </div>

              {/* Mini progress bar */}
              <div style={{ height: 4, background: "rgba(255,255,255,.06)", borderRadius: 2, marginTop: 10 }}>
                <div style={{
                  width: `${projectProgress}%`,
                  height: "100%",
                  background: projectProgress === 100 ? "#4caf50" : project.color,
                  borderRadius: 2,
                  transition: "width .4s",
                }} />
              </div>
            </div>

            {/* Tasks */}
            {isExpanded && (
              <div style={{ padding: "0 12px 12px", borderTop: "1px solid rgba(255,255,255,.04)" }}>
                {project.tasks.map(task => {
                  const done = businessData[task.id];
                  return (
                    <div
                      key={task.id}
                      className={`ci ${done ? "done" : ""}`}
                      onClick={() => toggleTask(task.id)}
                      style={{ padding: "10px 8px", marginBottom: 2 }}
                    >
                      <div className="cb" style={{ width: 24, height: 24, borderRadius: 7, fontSize: 12 }}>
                        {done ? "✓" : ""}
                      </div>
                      <div style={{
                        flex: 1, fontSize: 12, fontWeight: 600,
                        color: done ? "#4caf50" : "#ccc",
                        textDecoration: done ? "line-through" : "none",
                        opacity: done ? 0.6 : 1,
                      }}>
                        {task.label}
                      </div>
                    </div>
                  );
                })}

                {/* Counters (only for projects that have them) */}
                {project.counters && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,.06)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#888", marginBottom: 10 }}>Compteurs</div>
                    {project.counters.map(counter => {
                      const value = countersData[counter.id] || 0;
                      return (
                        <div key={counter.id} style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "10px 8px", marginBottom: 6,
                          background: "rgba(255,255,255,.03)", borderRadius: 12,
                        }}>
                          <span style={{ fontSize: 20, flexShrink: 0 }}>{counter.emoji}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#ccc" }}>{counter.label}</div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div
                              onClick={(e) => { e.stopPropagation(); updateCounter(counter.id, -1); }}
                              style={{
                                width: 32, height: 32, borderRadius: 10,
                                background: "rgba(233,69,96,.12)", border: "1px solid rgba(233,69,96,.3)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", fontSize: 18, fontWeight: 800, color: "#e94560",
                                userSelect: "none", WebkitTapHighlightColor: "transparent",
                              }}
                            >
                              -
                            </div>
                            <div style={{
                              minWidth: 40, textAlign: "center",
                              fontSize: 22, fontWeight: 900, fontFamily: "'Space Mono'",
                              color: value > 0 ? project.color : "#555",
                            }}>
                              {value}
                            </div>
                            <div
                              onClick={(e) => { e.stopPropagation(); updateCounter(counter.id, 1); }}
                              style={{
                                width: 32, height: 32, borderRadius: 10,
                                background: "rgba(76,175,80,.12)", border: "1px solid rgba(76,175,80,.3)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", fontSize: 18, fontWeight: 800, color: "#4caf50",
                                userSelect: "none", WebkitTapHighlightColor: "transparent",
                              }}
                            >
                              +
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
