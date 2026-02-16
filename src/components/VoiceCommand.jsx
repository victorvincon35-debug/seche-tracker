import { useState, useRef, useEffect, useCallback } from "react";
import { HABITS, SOCIAL_HABITS, SOCIAL_WEEKLY } from "../constants/habits.js";
import { SUPPS_DETAILED } from "../constants/supplements.js";
import { FOOD_TRACKING } from "../constants/nutrition.js";
import { getWeekNumber } from "../utils/helpers.js";

// ===== SYSTEM PROMPT FOR VOICE INTERPRETATION =====

const VOICE_SYSTEM_PROMPT = `Tu es l'assistant vocal de l'app Sèche Tracker. L'utilisateur te parle en français et tu dois comprendre quelle action il veut faire. Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte autour.

HABITUDES — action "toggle_habit" :
{"action": "toggle_habit", "habit_id": "ID", "value": true}
IDs disponibles :
- "respiration" = Respiration / CO2
- "qi_gong" = Qi Gong
- "steps" = 12 000 pas / marche
- "sport" = Sport 1h
- "rigoler" = Rigoler / s'amuser
- "social" = Câlins / liens sociaux
- "noir_lire" = Noir + lire avant dodo / lecture
- "dodo" = Dodo 9h régulier / sommeil
- "psy" = Psy
- "appeler" = Appeler ami/famille
- "jeux" = Soirée jeux
- "sortie" = Sortie sociale
- "dimanche_libre" = Dimanche libre
Exemples : "j'ai fait mon qi gong" → {"action":"toggle_habit","habit_id":"qi_gong","value":true}
"j'ai pas marché" → {"action":"toggle_habit","habit_id":"steps","value":false}

NUTRITION — action "set_food" ou "add_food" :
{"action": "set_food", "food_id": "ID", "quantity": NOMBRE}
ou {"action": "add_food", "food_id": "ID", "quantity": NOMBRE}
Utilise "set_food" si l'utilisateur dit le total ("j'ai mangé 3 oeufs"), "add_food" si c'est un ajout ("j'ai mangé 2 oeufs de plus").
IDs et unités :
- "jo" = Jus d'orange, unité: ml, max: 700. Ex: "350ml de jus d'orange" → quantity: 350
- "miel" = Miel, unité: g, max: 48
- "banane" = Banane, unité: g, max: 435. 1 banane ≈ 130g
- "boeuf" = Bœuf haché, unité: g, max: 300
- "oeufs" = Œufs, unité: pièces, max: 6. Ex: "3 oeufs" → quantity: 3
- "whey" = Whey, unité: shakers, max: 2. Ex: "un shaker" → quantity: 1
- "collagene" = Collagène, unité: g, max: 50
- "beurre" = Beurre, unité: g, max: 28
- "carottes" = Carottes (checkbox). quantity: 1 pour cocher
- "champignons" = Champignons (checkbox). quantity: 1 pour cocher

SUPPLÉMENTS — action "toggle_supplement" :
{"action": "toggle_supplement", "supp_id": "ID", "value": true}
IDs :
- "s_collagene" ou "s_collagene_2" = Collagène
- "s_b" = Vitamine B / Thiavite
- "s_creatine" = Créatine
- "s_mag_1" ou "s_mag_2" ou "s_mag_3" = Magnésium
- "s_d3" = Vitamine D3
- "s_k2" = Vitamine K2
- "s_vite" = Vitamine E
- "s_calcium_1" ou "s_calcium_2" = Calcium
- "s_whey_1" ou "s_whey_2" = Whey (supplément)
- "s_zinc" = Zinc
- "s_taurine" = Taurine
Si l'utilisateur dit juste "créatine" sans préciser, utilise l'ID principal.

POIDS — action "log_weight" :
{"action": "log_weight", "weight": NOMBRE}
Ex: "je pèse 81.5 kilos" → {"action":"log_weight","weight":81.5}

ROUTINE DOS — action "log_routine_dos" :
{"action": "log_routine_dos", "routine": "A" ou "B" ou "C" ou "seance"}
Ex: "j'ai fait ma routine dos B" → routine: "B"
"j'ai fait ma séance dos" → routine: "seance"

ÉPARGNE — action "log_epargne" :
{"action": "log_epargne", "amount": NOMBRE, "category": "salaire|freelance|economies|ventes|autre", "note": "description optionnelle"}
Ex: "j'ai reçu 1500 euros de salaire" → {"action":"log_epargne","amount":1500,"category":"salaire"}

NAVIGATION — action "navigate" :
{"action": "navigate", "tab": "ID"}
Tabs : dashboard, habits, sport, dos, food, supps, health, stats, weight, epargne, prepa
Ex: "ouvre les stats" → {"action":"navigate","tab":"stats"}

MULTIPLE ACTIONS :
{"action": "multiple", "actions": [...]}
Si l'utilisateur dit plusieurs choses, retourne un tableau.
Ex: "j'ai mangé 3 oeufs et fait mon qi gong" → {"action":"multiple","actions":[{"action":"set_food","food_id":"oeufs","quantity":3},{"action":"toggle_habit","habit_id":"qi_gong","value":true}]}

Si tu ne comprends pas :
{"action": "unknown", "message": "Je n'ai pas compris, peux-tu répéter ?"}`;

// ===== HELPERS =====

const ALL_HABITS = [...HABITS, ...SOCIAL_HABITS, ...SOCIAL_WEEKLY];

function getHabitXP(id) {
  const h = ALL_HABITS.find(h => h.id === id);
  return h ? h.xp : 10;
}

function getFoodConfig(id) {
  return FOOD_TRACKING[id] || null;
}

function getQty(value, config) {
  if (config.type === "checkbox") return value === true ? 1 : 0;
  if (value === true) return config.max;
  if (typeof value === "number") return Math.max(0, Math.min(value, config.max));
  return 0;
}

function isComplete(value, config) {
  if (config.type === "checkbox") return value === true;
  return getQty(value, config) >= config.max;
}

// ===== COMPONENT =====

export default function VoiceCommand({ data, save, toggleItem, setTab, selectedDate }) {
  const [status, setStatus] = useState("idle"); // idle | listening | processing | success | error
  const [transcript, setTranscript] = useState("");
  const [toast, setToast] = useState("");
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);
  const toastTimerRef = useRef(null);
  const transcriptTimerRef = useRef(null);
  const finalTranscriptRef = useRef("");

  const SpeechRecognition = typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;
  const supported = !!SpeechRecognition;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
      clearTimeout(toastTimerRef.current);
      clearTimeout(transcriptTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) { /* ignore */ }
      }
    };
  }, []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(""), 3000);
  }, []);

  const showTranscript = useCallback((text) => {
    setTranscript(text);
    clearTimeout(transcriptTimerRef.current);
    transcriptTimerRef.current = setTimeout(() => setTranscript(""), 3000);
  }, []);

  // ===== EXECUTE ACTIONS =====

  const executeAction = useCallback((action) => {
    if (!action || !action.action) {
      showToast("Action non reconnue");
      return;
    }

    switch (action.action) {
      case "toggle_habit": {
        const id = action.habit_id;
        const xp = getHabitXP(id);
        if (!ALL_HABITS.find(h => h.id === id)) {
          showToast("Habitude inconnue : " + id);
          return;
        }
        if (action.value === false) {
          // Uncheck: direct mutation since toggleItem only toggles
          const dk = selectedDate;
          const nd = JSON.parse(JSON.stringify(data));
          if (nd.days[dk]?.habits?.[id]) {
            nd.days[dk].habits[id] = false;
            nd.totalXP = Math.max(0, nd.totalXP - xp);
            save(nd);
          }
          const label = ALL_HABITS.find(h => h.id === id)?.label || id;
          showToast("❌ " + label + " décochée");
        } else {
          // Check: use toggleItem if not already checked
          const dk = selectedDate;
          const already = data.days?.[dk]?.habits?.[id];
          if (!already) {
            toggleItem("habits", id, xp);
          }
          const label = ALL_HABITS.find(h => h.id === id)?.label || id;
          showToast("✅ " + label + " cochée");
        }
        break;
      }

      case "set_food": {
        const id = action.food_id;
        const config = getFoodConfig(id);
        if (!config) {
          showToast("Aliment inconnu : " + id);
          return;
        }
        const dk = selectedDate;
        const nd = JSON.parse(JSON.stringify(data));
        if (!nd.days[dk]) nd.days[dk] = {};
        if (!nd.days[dk].meals) nd.days[dk].meals = {};

        const planItem = nd.foodPlan?.items?.[id];
        const xp = planItem?.xp || 5;

        const wasComplete = isComplete(nd.days[dk].meals[id], config);
        const newQty = config.type === "checkbox" ? true : Math.max(0, Math.min(action.quantity, config.max));
        nd.days[dk].meals[id] = newQty;
        const nowComplete = isComplete(newQty, config);

        if (nowComplete && !wasComplete) nd.totalXP = (nd.totalXP || 0) + xp;
        else if (!nowComplete && wasComplete) nd.totalXP = Math.max(0, (nd.totalXP || 0) - xp);

        save(nd);

        const label = planItem?.label || id;
        const unit = config.unit || "";
        if (config.type === "checkbox") {
          showToast("✅ " + label + " coché");
        } else {
          showToast("✅ " + newQty + " " + unit + " " + label + " ajouté");
        }
        break;
      }

      case "add_food": {
        const id = action.food_id;
        const config = getFoodConfig(id);
        if (!config) {
          showToast("Aliment inconnu : " + id);
          return;
        }
        const dk = selectedDate;
        const nd = JSON.parse(JSON.stringify(data));
        if (!nd.days[dk]) nd.days[dk] = {};
        if (!nd.days[dk].meals) nd.days[dk].meals = {};

        const planItem = nd.foodPlan?.items?.[id];
        const xp = planItem?.xp || 5;

        const wasComplete = isComplete(nd.days[dk].meals[id], config);
        const current = getQty(nd.days[dk].meals[id], config);
        const newQty = config.type === "checkbox" ? true : Math.max(0, Math.min(current + action.quantity, config.max));
        nd.days[dk].meals[id] = newQty;
        const nowComplete = isComplete(newQty, config);

        if (nowComplete && !wasComplete) nd.totalXP = (nd.totalXP || 0) + xp;
        else if (!nowComplete && wasComplete) nd.totalXP = Math.max(0, (nd.totalXP || 0) - xp);

        save(nd);

        const label = planItem?.label || id;
        const unit = config.unit || "";
        showToast("✅ +" + action.quantity + " " + unit + " " + label);
        break;
      }

      case "toggle_supplement": {
        const id = action.supp_id;
        const supp = SUPPS_DETAILED.find(s => s.id === id);
        if (!supp) {
          showToast("Supplément inconnu : " + id);
          return;
        }
        const dk = selectedDate;
        const already = data.days?.[dk]?.supps?.[id];
        if (!already) {
          toggleItem("supps", id, 5);
        }
        showToast("✅ " + supp.label.split("—")[0].trim() + " pris");
        break;
      }

      case "log_weight": {
        const w = action.weight;
        if (typeof w !== "number" || w <= 0) {
          showToast("Poids invalide");
          return;
        }
        const wk = "w" + getWeekNumber(selectedDate);
        const nd = JSON.parse(JSON.stringify(data));
        if (!nd.weight) nd.weight = {};
        if (!nd.weight[wk]) nd.weight[wk] = {};
        nd.weight[wk].poids = w;
        save(nd);
        showToast("✅ Poids enregistré : " + w + " kg");
        break;
      }

      case "log_routine_dos": {
        const routine = action.routine;
        const dk = selectedDate;
        const nd = JSON.parse(JSON.stringify(data));
        if (!nd.days[dk]) nd.days[dk] = {};

        if (routine === "seance") {
          if (!nd.days[dk].dos) nd.days[dk].dos = { seanceComplete: false, exercises: {} };
          nd.days[dk].dos.seanceComplete = true;
          save(nd);
          showToast("✅ Séance dos complétée");
        } else {
          if (!nd.days[dk].routineDos) nd.days[dk].routineDos = [];
          nd.days[dk].routineDos.push({
            routine: routine.toUpperCase(),
            time: new Date().toTimeString().slice(0, 5),
            completed: true,
          });
          save(nd);
          showToast("✅ Routine dos " + routine.toUpperCase() + " faite");
        }
        break;
      }

      case "log_epargne": {
        const amount = action.amount;
        if (typeof amount !== "number" || amount <= 0) {
          showToast("Montant invalide");
          return;
        }
        const nd = JSON.parse(JSON.stringify(data));
        if (!nd.epargne) nd.epargne = { target: 30000, transactions: [] };
        if (!nd.epargne.transactions) nd.epargne.transactions = [];
        nd.epargne.transactions.push({
          id: Date.now().toString(36),
          date: new Date().toISOString().split("T")[0],
          amount: amount,
          category: action.category || "autre",
          note: action.note || "",
        });
        save(nd);
        showToast("✅ " + amount + "€ ajouté en " + (action.category || "autre"));
        break;
      }

      case "navigate": {
        const validTabs = ["prepa", "dashboard", "habits", "sport", "dos", "food", "supps", "health", "stats", "weight", "epargne"];
        const tab = action.tab;
        if (!validTabs.includes(tab)) {
          showToast("Onglet inconnu : " + tab);
          return;
        }
        setTab(tab);
        showToast("📍 Navigation vers " + tab);
        break;
      }

      case "multiple": {
        if (Array.isArray(action.actions)) {
          action.actions.forEach(a => executeAction(a));
        }
        break;
      }

      case "unknown": {
        showToast(action.message || "Commande non comprise");
        break;
      }

      default:
        showToast("Action inconnue : " + action.action);
    }
  }, [data, save, toggleItem, setTab, selectedDate, showToast]);

  // ===== PROCESS VOICE COMMAND VIA CLAUDE API =====

  const processVoiceCommand = useCallback(async (text) => {
    setStatus("processing");

    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      showToast("Clé API manquante (VITE_ANTHROPIC_API_KEY)");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 1500);
      return;
    }

    try {
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
          max_tokens: 300,
          system: VOICE_SYSTEM_PROMPT,
          messages: [{ role: "user", content: text }],
        }),
      });

      const result = await response.json();
      let rawText = result.content?.[0]?.text || "";

      // Strip markdown code fences if present
      rawText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

      const action = JSON.parse(rawText);

      setStatus("success");
      setTimeout(() => setStatus("idle"), 600);

      executeAction(action);
    } catch (err) {
      console.error("Voice command error:", err);
      showToast("Erreur : " + err.message);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 1500);
    }
  }, [executeAction, showToast]);

  // ===== START LISTENING =====

  const startListening = useCallback(() => {
    if (!SpeechRecognition || status === "listening" || status === "processing") return;

    const recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = true;
    recognitionRef.current = recognition;
    finalTranscriptRef.current = "";

    // 5s silence timer — resets on every speech activity
    const resetSilenceTimer = () => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        try { recognition.stop(); } catch (e) { /* ignore */ }
      }, 5000);
    };

    recognition.onstart = () => {
      setStatus("listening");
      resetSilenceTimer();
    };

    recognition.onresult = (event) => {
      let final = "";
      let interim = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      finalTranscriptRef.current = final;
      // Show live feedback
      showTranscript(final || interim);
      // Reset silence timer on any speech
      resetSilenceTimer();
    };

    recognition.onerror = (event) => {
      clearTimeout(timeoutRef.current);
      if (event.error === "no-speech") {
        setStatus("idle");
        return;
      }
      console.error("Speech recognition error:", event.error);
      showToast("Erreur micro : " + event.error);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 1500);
    };

    recognition.onend = () => {
      clearTimeout(timeoutRef.current);
      const text = finalTranscriptRef.current.trim();
      if (text) {
        showTranscript(text);
        processVoiceCommand(text);
      } else {
        setStatus("idle");
      }
    };

    recognition.start();
  }, [SpeechRecognition, status, processVoiceCommand, showTranscript, showToast]);

  const handleClick = useCallback(() => {
    if (status === "listening") {
      try { recognitionRef.current?.stop(); } catch (e) { /* ignore */ }
      setStatus("idle");
      return;
    }
    if (status === "idle") {
      startListening();
    }
  }, [status, startListening]);

  if (!supported) return null;

  // ===== BUTTON STYLES =====

  const getBtnStyle = () => {
    const base = {
      position: "fixed", bottom: 90, right: 72, width: 48, height: 48,
      borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 20, cursor: "pointer", zIndex: 95, border: "none", outline: "none",
      transition: "all .2s ease",
    };

    switch (status) {
      case "listening":
        return { ...base, background: "linear-gradient(135deg, #e94560, #c23152)", color: "#fff",
          boxShadow: "0 4px 20px rgba(233,69,96,.5)", animation: "voicePulse 1.2s ease infinite" };
      case "processing":
        return { ...base, background: "linear-gradient(135deg, #1a1a2e, #2a2a4a)", color: "#888",
          boxShadow: "0 4px 12px rgba(0,0,0,.3)" };
      case "success":
        return { ...base, background: "linear-gradient(135deg, #4caf50, #388e3c)", color: "#fff",
          boxShadow: "0 4px 20px rgba(76,175,80,.5)" };
      case "error":
        return { ...base, background: "linear-gradient(135deg, #e94560, #c23152)", color: "#fff",
          boxShadow: "0 4px 12px rgba(233,69,96,.3)" };
      default:
        return { ...base, background: "linear-gradient(135deg, #1a1a2e, #2a2a4a)", color: "#aaa",
          boxShadow: "0 4px 12px rgba(0,0,0,.3)" };
    }
  };

  // ===== RENDER =====

  return (
    <>
      <style>{`
        @keyframes voicePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(233,69,96,.6); }
          50% { box-shadow: 0 0 0 14px rgba(233,69,96,0); }
        }
        @keyframes voiceSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Mic Button */}
      <div onClick={handleClick} style={getBtnStyle()}>
        {status === "processing" ? (
          <div style={{ width: 20, height: 20, border: "2px solid #555", borderTopColor: "#e94560",
            borderRadius: "50%", animation: "voiceSpin .8s linear infinite" }} />
        ) : status === "listening" ? (
          "🔴"
        ) : (
          "🎤"
        )}
      </div>

      {/* Transcript Bubble */}
      {transcript && (
        <div style={{
          position: "fixed", bottom: 150, left: "50%", transform: "translateX(-50%)",
          background: "rgba(26,26,46,.95)", border: "1px solid #2a2a4a", borderRadius: 12,
          padding: "8px 16px", maxWidth: "80%", fontSize: 12, color: "#aaa",
          fontFamily: "'Outfit'", zIndex: 96, textAlign: "center",
          animation: "toastIn .3s ease",
        }}>
          🎙️ "{transcript}"
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 200, left: "50%", transform: "translateX(-50%)",
          background: "rgba(26,26,46,.95)", border: "1px solid #4caf50", borderRadius: 12,
          padding: "10px 20px", maxWidth: "85%", fontSize: 13, color: "#fff",
          fontFamily: "'Outfit'", fontWeight: 500, zIndex: 97, textAlign: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,.5)",
          animation: "toastIn .3s ease",
        }}>
          {toast}
        </div>
      )}
    </>
  );
}
