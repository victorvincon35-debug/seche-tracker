import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `Tu es un coach personnel expert en nutrition, musculation, bien-être et développement personnel. Tu parles en français, de manière bienveillante mais directe. Tu as accès aux données complètes de l'utilisateur (poids, habitudes, suppléments, épargne, entraînements).

Tes compétences :
- Nutrition et diététique (sèche, macros)
- Musculation et programmation sportive
- Santé posturale et routine de correction
- Motivation et psychologie du changement
- Gestion financière et épargne

Règles :
- Réponses concises (2-4 phrases max sauf si on te demande plus)
- Utilise les données fournies pour personnaliser tes conseils
- Si tu ne sais pas, dis-le honnêtement
- Encourage toujours, même quand les résultats sont moyens
- Donne des conseils actionnables et concrets`;

export default function ChatWindow({ data, save }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const chatHistory = data.chatHistory || [];

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory.length, isOpen]);

  const getContextSummary = () => {
    const weight = Object.entries(data.weight || {}).sort().slice(-3).map(([k, v]) => `${k}: ${v.poids}kg`).join(", ");
    const today = new Date().toISOString().split("T")[0];
    const todayData = data.days?.[today] || {};
    const habitsCount = todayData.habits ? Object.values(todayData.habits).filter(Boolean).length : 0;
    const suppsCount = todayData.supps ? Object.values(todayData.supps).filter(Boolean).length : 0;
    const epargne = (data.epargne?.transactions || []).reduce((s, t) => s + t.amount, 0);
    const routineDos = (todayData.routineDos || []).filter(r => r.completed).length;

    return `[Données utilisateur — ${today}]
Poids récent : ${weight || "pas encore de données"}
Habitudes aujourd'hui : ${habitsCount} cochées
Suppléments aujourd'hui : ${suppsCount} pris
Routine dos aujourd'hui : ${routineDos} micro-routines
Épargne totale : ${epargne}€ / 30 000€
Étape nutrition : ${data.nutrition?.currentStage || 1}
XP total : ${data.totalXP}
Best streak : ${data.bestStreak} jours`;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setLoading(true);

    const newHistory = [...chatHistory, { role: "user", content: userMsg, timestamp: Date.now() }];

    // Save user message immediately
    const nd = JSON.parse(JSON.stringify(data));
    nd.chatHistory = newHistory.slice(-50);
    save(nd);

    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      if (!apiKey) {
        const errHistory = [...newHistory, { role: "assistant", content: "Clé API manquante. Ajoute VITE_ANTHROPIC_API_KEY dans ton .env", timestamp: Date.now() }];
        const nd2 = JSON.parse(JSON.stringify(data));
        nd2.chatHistory = errHistory.slice(-50);
        save(nd2);
        setLoading(false);
        return;
      }

      const messages = newHistory.slice(-10).map(m => ({ role: m.role, content: m.content }));

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 500,
          system: SYSTEM_PROMPT + "\n\n" + getContextSummary(),
          messages,
        }),
      });

      const result = await response.json();
      const assistantMsg = result.content?.[0]?.text || "Erreur de réponse";

      const finalHistory = [...newHistory, { role: "assistant", content: assistantMsg, timestamp: Date.now() }];
      const nd3 = JSON.parse(JSON.stringify(data));
      nd3.chatHistory = finalHistory.slice(-50);
      save(nd3);
    } catch (err) {
      const errHistory = [...newHistory, { role: "assistant", content: `Erreur : ${err.message}`, timestamp: Date.now() }];
      const nd4 = JSON.parse(JSON.stringify(data));
      nd4.chatHistory = errHistory.slice(-50);
      save(nd4);
    }

    setLoading(false);
  };

  return (
    <>
      {/* FAB Button */}
      {!isOpen && (
        <div onClick={() => setIsOpen(true)}
          style={{ position: "fixed", bottom: 90, right: 16, width: 48, height: 48, borderRadius: 24,
            background: "linear-gradient(135deg, #9c27b0, #7b1fa2)", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, cursor: "pointer", zIndex: 95, boxShadow: "0 4px 20px rgba(156,39,176,.4)", animation: "breathe 3s ease infinite" }}>
          🤖
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={{ position: "fixed", bottom: 0, right: 0, left: 0, top: 0, background: "rgba(0,0,0,.85)", zIndex: 999, display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <div style={{ padding: "max(env(safe-area-inset-top), 12px) 16px 12px", background: "linear-gradient(135deg, #9c27b0, #7b1fa2)", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🤖</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Coach IA</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.6)" }}>Claude · ton assistant personnel</div>
            </div>
            <div onClick={() => setIsOpen(false)} style={{ fontSize: 18, color: "rgba(255,255,255,.6)", cursor: "pointer", padding: 4 }}>✕</div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            {chatHistory.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#555" }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🤖</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Salut ! Je suis ton coach IA</div>
                <div style={{ fontSize: 11 }}>Pose-moi une question sur ta nutrition, ton entraînement, ou ton programme.</div>
              </div>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "80%", padding: "10px 14px", borderRadius: 16,
                  background: msg.role === "user" ? "linear-gradient(135deg, #e94560, #c23152)" : "#1a1a2e",
                  border: msg.role === "user" ? "none" : "1px solid #2a2a4a",
                  fontSize: 13, lineHeight: 1.5, color: "#fff", whiteSpace: "pre-wrap",
                  borderBottomRightRadius: msg.role === "user" ? 4 : 16,
                  borderBottomLeftRadius: msg.role === "user" ? 16 : 4,
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ padding: "10px 14px", borderRadius: 16, background: "#1a1a2e", border: "1px solid #2a2a4a", borderBottomLeftRadius: 4 }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: 8, height: 8, borderRadius: 4, background: "#9c27b0", animation: `pulse 1s ease ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "12px 16px max(env(safe-area-inset-bottom, 12px), 12px)", borderTop: "1px solid #1a1a2e", display: "flex", gap: 8, background: "#0a0a1a" }}>
            <input type="text" value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") sendMessage(); }}
              placeholder="Pose ta question..."
              style={{ flex: 1, padding: "12px 16px", borderRadius: 12, background: "#1a1a2e", border: "1px solid #2a2a4a", color: "#fff", fontSize: 14, fontFamily: "'Outfit'", outline: "none", boxSizing: "border-box" }} />
            <div onClick={sendMessage}
              style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", cursor: loading ? "default" : "pointer",
                background: input.trim() && !loading ? "linear-gradient(135deg, #9c27b0, #7b1fa2)" : "#1a1a2e",
                color: input.trim() && !loading ? "#fff" : "#555", fontSize: 18, flexShrink: 0 }}>
              ➤
            </div>
          </div>
        </div>
      )}
    </>
  );
}
