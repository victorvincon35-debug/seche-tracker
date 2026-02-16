import { useState, useEffect, useCallback, useRef } from "react";
import { supabase, storage, syncOnLoad, debouncedPush } from "./supabase.js";

// Constants
import { CITIES, AVATAR_STAGES } from "./constants/cities.js";
import { HABITS } from "./constants/habits.js";
import { getMealsForStage } from "./constants/nutrition.js";
import { SUPPS_DETAILED, SUPP_TIMING_GROUPS, getSuppsForStage } from "./constants/supplements.js";
import { SPORT_DAYS } from "./constants/sport.js";

// Utils
import {
  STORAGE_KEY, START_DATE, TOTAL_DAYS,
  getToday, getDayNumber, getWeekNumber, getAvatarStage, getCurrentCity, getNextCity,
  getMonday, defaultData, migrateSuppsV2, migrateFoodPlan, isMonday,
} from "./utils/helpers.js";
import { ACHIEVEMENT_REWARDS } from "./utils/scoring.js";

// Components
import LoginScreen from "./components/LoginScreen.jsx";
import RestTimer from "./components/RestTimer.jsx";
import EventModal from "./components/EventModal.jsx";
import ChatWindow from "./components/ChatWindow.jsx";
import VoiceCommand from "./components/VoiceCommand.jsx";

// Tabs
import TabDashboard from "./tabs/TabDashboard.jsx";
import TabHabits from "./tabs/TabHabits.jsx";
import TabSport from "./tabs/TabSport.jsx";
import TabPlanning from "./tabs/TabPlanning.jsx";
import TabFood from "./tabs/TabFood.jsx";
import TabSupps from "./tabs/TabSupps.jsx";
import TabHealth from "./tabs/TabHealth.jsx";
import TabStats from "./tabs/TabStats.jsx";
import TabWeight from "./tabs/TabWeight.jsx";
import TabPrepa from "./tabs/TabPrepa.jsx";
import TabDos from "./tabs/TabDos.jsx";
import TabEpargne from "./tabs/TabEpargne.jsx";
import TabSport1 from "./tabs/TabSport1.jsx";

// ===== MAIN APP =====
export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [showUnlock, setShowUnlock] = useState(null);
  const [showRewardPopup, setShowRewardPopup] = useState(null);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerPreset, setTimerPreset] = useState(90);
  const timerRef = useRef(null);
  const [planWeekStart, setPlanWeekStart] = useState(() => getMonday(getToday()));
  const [planViewMode, setPlanViewMode] = useState("day");
  const [editingEvent, setEditingEvent] = useState(null);
  const [recurActionPrompt, setRecurActionPrompt] = useState(null);
  const [showSuppInfo, setShowSuppInfo] = useState(null);
  const [reapproEdit, setReapproEdit] = useState(null);
  const [sportMode, setSportMode] = useState("naturo"); // "naturo" or "sport1"
  // photoInputRefs removed — WeightForm manages its own refs now

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => setSession(s)
    );
    return () => subscription.unsubscribe();
  }, []);

  // Load local data immediately
  useEffect(() => {
    const saved = storage.get(STORAGE_KEY);
    let d = saved || defaultData();
    if (!d.nutrition) {
      d.nutrition = { currentStage: 1, stageStartDate: "2026-02-23", cycleComplete: false };
    }
    d = migrateSuppsV2(d);
    d = migrateFoodPlan(d);
    storage.set(STORAGE_KEY, d);
    setData(d);
    setLoading(false);
  }, []);

  // Sync with Supabase when session becomes available
  useEffect(() => {
    if (!session || !data) return;
    syncOnLoad(data, session.user.id).then(synced => {
      if (synced && JSON.stringify(synced) !== JSON.stringify(data)) {
        if (!synced.planning && data.planning && Object.keys(data.planning).length > 0) {
          synced.planning = data.planning;
        }
        const migrated = migrateFoodPlan(migrateSuppsV2(synced));
        storage.set(STORAGE_KEY, migrated);
        setData(migrated);
      }
    });
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-sync when coming back online
  useEffect(() => {
    const handleOnline = () => {
      if (session && data) {
        debouncedPush(data, session.user.id, 100);
      }
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [session, data]);

  // Rest timer
  useEffect(() => {
    if (timerRunning && timerSeconds > 0) {
      timerRef.current = setTimeout(() => setTimerSeconds(s => s - 1), 1000);
    } else if (timerRunning && timerSeconds <= 0) {
      setTimerRunning(false);
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 880; gain.gain.value = 0.3;
        osc.start();
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0, ctx.currentTime + 0.45);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0, ctx.currentTime + 0.75);
        osc.stop(ctx.currentTime + 0.8);
      } catch (e) { /* audio not available */ }
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
    return () => clearTimeout(timerRef.current);
  }, [timerRunning, timerSeconds]);

  const save = useCallback((nd) => {
    setData(nd);
    storage.set(STORAGE_KEY, nd);
    if (session?.user?.id) {
      debouncedPush(nd, session.user.id);
    }
  }, [session]);

  const saveReappro = useCallback((suppId, purchaseDate, quantityDays) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.reappro) nd.reappro = {};
    nd.reappro[suppId] = { purchaseDate, quantityDays: parseInt(quantityDays) };
    save(nd);
    setReapproEdit(null);
  }, [data, save]);

  const toggleItem = useCallback((cat, id, xpVal = 5) => {
    const dk = selectedDate;
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.days[dk]) nd.days[dk] = {};
    if (!nd.days[dk][cat]) nd.days[dk][cat] = {};
    const was = nd.days[dk][cat][id];
    nd.days[dk][cat][id] = !was;
    nd.totalXP = Math.max(0, nd.totalXP + (was ? -xpVal : xpVal));

    const oldCity = getCurrentCity(data.totalXP);
    const newCity = getCurrentCity(nd.totalXP);
    if (newCity.min > oldCity.min && !was) { setShowUnlock(newCity); setTimeout(() => setShowUnlock(null), 3500); }

    const streak = calcStreak(nd);
    if (streak > nd.bestStreak) nd.bestStreak = streak;
    if (!nd.seenRewards) nd.seenRewards = [];

    ACHIEVEMENT_REWARDS.forEach(r => {
      if (r.check(nd) && !nd.seenRewards.includes(r.id)) {
        setTimeout(() => { setShowRewardPopup(r); setTimeout(() => setShowRewardPopup(null), 4000); }, showUnlock ? 3600 : 300);
      }
    });
    save(nd);
  }, [data, selectedDate, save, showUnlock]);

  const markRewardSeen = useCallback((id) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.seenRewards) nd.seenRewards = [];
    if (!nd.seenRewards.includes(id)) { nd.seenRewards.push(id); save(nd); }
  }, [data, save]);

  const setSymptom = useCallback((s, v) => { const wk = `w${getWeekNumber(selectedDate)}`; const nd = JSON.parse(JSON.stringify(data)); if (!nd.weeks[wk]) nd.weeks[wk] = {}; if (!nd.weeks[wk].symptoms) nd.weeks[wk].symptoms = {}; nd.weeks[wk].symptoms[s] = v; save(nd); }, [data, selectedDate, save]);
  const setNaturo = useCallback((id, v) => { const wk = `w${getWeekNumber(selectedDate)}`; const nd = JSON.parse(JSON.stringify(data)); if (!nd.weeks[wk]) nd.weeks[wk] = {}; if (!nd.weeks[wk].naturo) nd.weeks[wk].naturo = {}; nd.weeks[wk].naturo[id] = v; save(nd); }, [data, selectedDate, save]);
  const setTemp = useCallback((slot, v) => { const nd = JSON.parse(JSON.stringify(data)); if (!nd.days[selectedDate]) nd.days[selectedDate] = {}; if (!nd.days[selectedDate].temp) nd.days[selectedDate].temp = {}; nd.days[selectedDate].temp[slot] = v; save(nd); }, [data, selectedDate, save]);

  const toggleSportSeries = useCallback((exerciseId, seriesIndex) => {
    const dk = selectedDate;
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.days[dk]) nd.days[dk] = {};
    if (!nd.days[dk].sport) nd.days[dk].sport = { exercises: {}, blocks: {} };
    if (!nd.days[dk].sport.exercises[exerciseId]) nd.days[dk].sport.exercises[exerciseId] = { series: [], reps: [] };
    const ex = nd.days[dk].sport.exercises[exerciseId];
    const was = ex.series[seriesIndex] || false;
    ex.series[seriesIndex] = !was;
    if (!was) { setTimerSeconds(timerPreset); setTimerRunning(true); }
    save(nd);
  }, [data, selectedDate, save, timerPreset]);

  const setSportReps = useCallback((exerciseId, seriesIndex, reps) => {
    const dk = selectedDate;
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.days[dk]) nd.days[dk] = {};
    if (!nd.days[dk].sport) nd.days[dk].sport = { exercises: {}, blocks: {} };
    if (!nd.days[dk].sport.exercises[exerciseId]) nd.days[dk].sport.exercises[exerciseId] = { series: [], reps: [] };
    nd.days[dk].sport.exercises[exerciseId].reps[seriesIndex] = reps;
    save(nd);
  }, [data, selectedDate, save]);

  const toggleSportBlock = useCallback((blockId) => {
    const dk = selectedDate;
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.days[dk]) nd.days[dk] = {};
    if (!nd.days[dk].sport) nd.days[dk].sport = { exercises: {}, blocks: {} };
    const was = nd.days[dk].sport.blocks[blockId] || false;
    nd.days[dk].sport.blocks[blockId] = !was;
    save(nd);
  }, [data, selectedDate, save]);

  const setSportNotes = useCallback((notes) => {
    const dk = selectedDate;
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.days[dk]) nd.days[dk] = {};
    if (!nd.days[dk].sport) nd.days[dk].sport = { exercises: {}, blocks: {} };
    nd.days[dk].sport.notes = notes;
    save(nd);
  }, [data, selectedDate, save]);

  const saveEvent = useCallback((event) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.planning) nd.planning = {};
    const id = event.id || Date.now().toString(36);
    if (event._editMode === "single" && event._occurrenceDate) {
      const template = nd.planning[id];
      if (template) {
        if (!template.exceptions) template.exceptions = {};
        const { id: _id, isNew: _isNew, _editMode: _em, _occurrenceDate: _od, _isRecurring: _ir, recurrence: _rec, exceptions: _ex, date: _date, ...overrides } = event;
        template.exceptions[event._occurrenceDate] = overrides;
      }
    } else {
      const existingExceptions = nd.planning[id]?.exceptions;
      const { id: _id, isNew: _isNew, _editMode: _em, _occurrenceDate: _od, _isRecurring: _ir, ...eventData } = event;
      nd.planning[id] = eventData;
      if (existingExceptions) nd.planning[id].exceptions = existingExceptions;
    }
    save(nd);
    setEditingEvent(null);
  }, [data, save]);

  const deleteEvent = useCallback((event) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.planning) { setEditingEvent(null); return; }
    if (event._isRecurring) {
      setEditingEvent(null);
      setRecurActionPrompt({ event, action: "delete" });
      return;
    }
    delete nd.planning[event.id];
    save(nd);
    setEditingEvent(null);
  }, [data, save]);

  const deleteEventConfirmed = useCallback((event, mode) => {
    const nd = JSON.parse(JSON.stringify(data));
    if (!nd.planning) return;
    if (mode === "single" && event._occurrenceDate) {
      const template = nd.planning[event.id];
      if (template) {
        if (!template.exceptions) template.exceptions = {};
        template.exceptions[event._occurrenceDate] = "deleted";
      }
    } else {
      delete nd.planning[event.id];
    }
    save(nd);
    setRecurActionPrompt(null);
  }, [data, save]);

  const navigatePlanWeek = useCallback((dir) => {
    const d = new Date(planWeekStart);
    d.setDate(d.getDate() + dir * 7);
    setPlanWeekStart(d.toISOString().split("T")[0]);
  }, [planWeekStart]);

  function calcStreak(d) {
    let streak = 0; const today = new Date(getToday());
    for (let i = 0; i < 60; i++) { const dt = new Date(today); dt.setDate(dt.getDate() - i); const k = dt.toISOString().split("T")[0]; const dd = d.days[k]; if (!dd) break; const h = dd.habits ? Object.values(dd.habits).filter(Boolean).length : 0; const m = dd.meals ? Object.values(dd.meals).filter(Boolean).length : 0; if (h + m >= 8) streak++; else break; }
    return streak;
  }

  function getDayScore(dk) {
    const day = data?.days?.[dk]; if (!day) return 0; let total = 0, done = 0;
    HABITS.filter(h => !h.weekly).forEach(() => total++); getMealsForStage(data?.nutrition?.currentStage || 1).forEach(() => total++); getSuppsForStage(data?.nutrition?.currentStage || 1).forEach(() => total++);
    if (day.habits) Object.values(day.habits).forEach(v => { if (v) done++; }); if (day.meals) Object.values(day.meals).forEach(v => { if (v) done++; }); if (day.supps) Object.values(day.supps).forEach(v => { if (v) done++; });
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }


  if (authLoading || loading || !data) return (<div style={{ background: "#0a0a1a", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Outfit'" }}><div style={{ color: "#e94560", fontSize: 24 }}>✈️</div></div>);

  if (!session) return <LoginScreen />;

  const programNotStarted = false;
  const daysUntilProgram = programNotStarted ? Math.ceil((new Date(START_DATE) - new Date(getToday())) / 86400000) : 0;
  const avatarStage = getAvatarStage(data.totalXP);
  const currentCity = getCurrentCity(data.totalXP);
  const nextCity = getNextCity(data.totalXP);
  const streak = programNotStarted ? 0 : calcStreak(data);
  const dayNum = Math.max(1, Math.min(getDayNumber(getToday()), TOTAL_DAYS));
  const dayScore = programNotStarted ? 0 : getDayScore(selectedDate);
  const dayData = data.days[selectedDate] || {};
  const weekKey = `w${getWeekNumber(selectedDate)}`;
  const weekData = data.weeks[weekKey] || {};

  const navigateDay = (dir) => { const d = new Date(selectedDate); d.setDate(d.getDate() + dir); setSelectedDate(d.toISOString().split("T")[0]); };
  const dateLabel = (() => { const d = new Date(selectedDate); return `${["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"][d.getDay()]} ${d.getDate()} ${["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"][d.getMonth()]}`; })();

  const tabs = [
    { id: "prepa", label: "📋", name: "Prépa" },
    { id: "dashboard", label: "🏠", name: "Home" },
    { id: "habits", label: "✅", name: "Habitudes" },
    { id: "sport", label: "💪", name: "Sport" },
    { id: "dos", label: "🔙", name: "Dos" },
    { id: "planning", label: "📅", name: "Plan" },
    { id: "food", label: "🍽️", name: "Repas" },
    { id: "supps", label: "💊", name: "Suppl." },
    { id: "health", label: "🩺", name: "Santé" },
    { id: "stats", label: "📊", name: "Stats" },
    { id: "weight", label: "⚖️", name: "Poids" },
    { id: "epargne", label: "💰", name: "Épargne" },
  ];

  return (
    <div className="app-root" style={{ fontFamily: "'Outfit',sans-serif", background: "#0a0a1a", minHeight: "100vh", color: "white", maxWidth: 480, margin: "0 auto", paddingBottom: 80, position: "relative", WebkitOverflowScrolling: "touch" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}body{background:#0a0a1a}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#e94560;border-radius:2px}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes unlockPop{0%{transform:scale(0) rotate(-10deg);opacity:0}60%{transform:scale(1.15) rotate(3deg)}100%{transform:scale(1) rotate(0);opacity:1}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}
        @keyframes confettiDrop{0%{opacity:1;transform:translateY(0) rotate(0)}100%{opacity:0;transform:translateY(80px) rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes rewardSlide{0%{transform:translateY(100%) scale(.8);opacity:0}50%{transform:translateY(-10%) scale(1.05)}100%{transform:translateY(0) scale(1);opacity:1}}
        @keyframes sparkle{0%,100%{opacity:0;transform:scale(0) rotate(0)}50%{opacity:1;transform:scale(1) rotate(180deg)}}
        .card{background:linear-gradient(145deg,#0d0d24,#151535);border:1px solid #1e1e4a;border-radius:20px;padding:20px;animation:slideUp .4s ease}
        .ci{display:flex;align-items:center;gap:12px;padding:14px;border-radius:14px;cursor:pointer;transition:all .15s;border:1px solid transparent;user-select:none;-webkit-tap-highlight-color:transparent}
        .ci:active{transform:scale(.98)}.ci.done{background:rgba(76,175,80,.08);border-color:rgba(76,175,80,.25)}
        .cb{width:28px;height:28px;border-radius:8px;border:2px solid #3a3a5a;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s;font-size:14px;font-weight:700;color:white}
        .ci.done .cb{background:linear-gradient(135deg,#4caf50,#2e7d32);border-color:#4caf50}
        .xp{background:linear-gradient(135deg,#e94560,#c23152);padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;color:white;font-family:'Space Mono',monospace}
        .tb{flex:1;min-width:52px;flex-shrink:0;padding:8px 2px;border:none;background:transparent;color:#555;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:8px;font-family:'Outfit';transition:all .2s;border-radius:12px;position:relative;-webkit-tap-highlight-color:transparent}
        .tb.active{color:#e94560;background:rgba(233,69,96,.12)}
        .na{width:40px;height:40px;border-radius:12px;border:1px solid #2a2a4a;background:#0d0d24;color:white;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;transition:all .15s;-webkit-tap-highlight-color:transparent}
        .na:active{transform:scale(.95);border-color:#e94560}
        .plan-cell{cursor:pointer;transition:background .12s;-webkit-tap-highlight-color:transparent}.plan-cell:hover{background:rgba(233,69,96,.1)!important}.plan-cell:active{background:rgba(233,69,96,.18)!important}
        input[type=number],input[type=text]{background:#0d0d24;border:1px solid #2a2a4a;border-radius:10px;color:white;padding:10px 12px;font-family:'Space Mono';font-size:14px;width:80px;text-align:center;outline:none;-webkit-appearance:none}
        input:focus,textarea:focus{border-color:#e94560!important}
        textarea{-webkit-appearance:none;font-family:'Outfit',sans-serif}
        select{-webkit-appearance:none;appearance:none;color-scheme:dark}
        input[type=date]{color-scheme:dark}
        .recharts-text{fill:#888!important;font-size:10px!important}
        @media(min-width:769px){
          .app-root{max-width:1200px!important;padding-bottom:0!important;display:flex!important;flex-direction:row!important}
          .main-col{flex:1!important;min-width:0!important;display:flex!important;flex-direction:column!important;overflow-y:auto!important;height:100vh!important}
          .app-header{padding:16px 32px 20px!important}
          .nav-outer{position:sticky!important;top:0!important;bottom:auto!important;left:auto!important;right:auto!important;width:220px!important;min-width:220px!important;height:100vh!important;background:#0a0a1a!important;padding:24px 12px!important;border-right:1px solid #1e1e4a!important;overflow-y:auto!important;order:-1!important;z-index:50!important}
          .nav-inner{flex-direction:column!important;gap:4px!important;max-width:none!important;background:transparent!important;border:none!important;border-radius:0!important;padding:0!important}
          .nav-inner .tb{flex-direction:row!important;justify-content:flex-start!important;padding:12px 14px!important;font-size:13px!important;gap:10px!important;border-radius:12px!important}
          .nav-inner .tb span:first-child{font-size:18px!important}
          .nav-inner .tb.active{background:rgba(233,69,96,.15)!important}
          .nav-inner .tb:hover:not(.active){background:rgba(255,255,255,.04)!important;color:#999!important}
          .content-area{flex:1!important;padding:0 32px 32px!important;min-width:0!important}
          .tab-grid{display:grid!important;grid-template-columns:repeat(2,1fr)!important;gap:16px!important}
          .tab-grid>.card:first-child{grid-column:1/-1}
          .card{padding:24px!important;border-radius:22px!important}
          .card:hover{border-color:#2a2a5a!important;box-shadow:0 4px 24px rgba(233,69,96,.06)!important}
          .ci{padding:16px!important}
          .ci:hover{background:rgba(255,255,255,.03)!important;border-color:rgba(255,255,255,.06)!important}
          .ci:active{transform:scale(.995)!important}
          .na:hover{border-color:#e94560!important;background:rgba(233,69,96,.08)!important}
          .xp{font-size:11px!important;padding:3px 10px!important}
        }
        @media(min-width:1100px){
          .tab-grid{grid-template-columns:repeat(3,1fr)!important}
          .tab-grid>.card:first-child{grid-column:1/-1}
        }
      `}</style>

      {/* CITY UNLOCK */}
      {showUnlock && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.92)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", animation: "unlockPop .5s ease" }}>
          {[...Array(12)].map((_, i) => (<div key={i} style={{ position: "absolute", left: `${10 + Math.random() * 80}%`, top: `${20 + Math.random() * 40}%`, fontSize: 20, animation: `confettiDrop ${1 + Math.random()}s ease ${Math.random() * .5}s infinite` }}>{"🎉⭐🔥✨💪🇮🇹"[i % 6] || "🎉"}</div>))}
          <div style={{ fontSize: 60, marginBottom: 8 }}>{showUnlock.emoji}</div>
          <div style={{ fontSize: 28, fontWeight: 900, background: "linear-gradient(135deg,#e94560,#ffeb3b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>VILLE DÉBLOQUÉE!</div>
          <div style={{ fontSize: 20, color: "#ccc", marginTop: 4 }}>{showUnlock.name}</div>
        </div>
      )}

      {/* REWARD POPUP */}
      {showRewardPopup && !showUnlock && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.92)", zIndex: 998, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", animation: "rewardSlide .6s ease" }}>
          {[...Array(8)].map((_, i) => (<div key={i} style={{ position: "absolute", left: `${15 + Math.random() * 70}%`, top: `${25 + Math.random() * 50}%`, fontSize: 16, animation: `sparkle ${1.5 + Math.random()}s ease ${Math.random() * .8}s infinite` }}>✨</div>))}
          <div style={{ fontSize: 14, color: "#ffeb3b", fontWeight: 700, letterSpacing: 3, marginBottom: 12, fontFamily: "'Space Mono'" }}>🎁 CADEAU DÉBLOQUÉ 🎁</div>
          <div style={{ width: 80, height: 80, borderRadius: 20, background: "linear-gradient(135deg,#e94560,#c23152)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, boxShadow: "0 8px 40px rgba(233,69,96,.4)", marginBottom: 16 }}>{showRewardPopup.emoji}</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{showRewardPopup.title}</div>
          <div style={{ fontSize: 13, color: "#999", maxWidth: 280, textAlign: "center" }}>{showRewardPopup.desc}</div>
        </div>
      )}

      {/* SUPPLEMENT INFO MODAL */}
      {showSuppInfo && (
        <div onClick={() => setShowSuppInfo(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 999, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 0 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "linear-gradient(145deg,#0d0d24,#151535)", border: "1px solid #1e1e4a", borderRadius: "20px 20px 0 0", padding: 24, width: "100%", maxWidth: 480, animation: "slideUp .3s ease", maxHeight: "70vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: `${(SUPP_TIMING_GROUPS.find(g => g.id === showSuppInfo.timing) || {}).color || "#e94560"}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{showSuppInfo.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{showSuppInfo.label}</div>
                <div style={{ fontSize: 11, color: "#888" }}>{showSuppInfo.brand}</div>
              </div>
              <div onClick={() => setShowSuppInfo(null)} style={{ fontSize: 18, color: "#555", cursor: "pointer", padding: 4 }}>✕</div>
            </div>
            {[
              { label: "Dosage", value: showSuppInfo.dosage },
              { label: "Timing", value: (SUPP_TIMING_GROUPS.find(g => g.id === showSuppInfo.timing) || {}).label || "" },
              { label: "Prix/mois", value: showSuppInfo.price > 0 ? `${showSuppInfo.price.toFixed(2)}€` : "Inclus" },
              showSuppInfo.secheOnly ? { label: "Phase", value: "Sèche uniquement" } : null,
            ].filter(Boolean).map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1a1a2e", fontSize: 12 }}>
                <span style={{ color: "#888" }}>{item.label}</span>
                <span style={{ fontWeight: 600 }}>{item.value}</span>
              </div>
            ))}
            <div style={{ marginTop: 12, padding: 12, background: "rgba(255,235,59,.05)", borderRadius: 12, fontSize: 12, color: "#ccc", lineHeight: 1.5 }}>
              💡 {showSuppInfo.info}
            </div>
            <div onClick={() => { setReapproEdit({ suppId: showSuppInfo.id, purchaseDate: getToday(), quantityDays: 30 }); setShowSuppInfo(null); }}
              style={{ marginTop: 16, textAlign: "center", padding: "12px 0", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", background: "rgba(255,255,255,.06)", border: "1px solid #2a2a4a", color: "#888" }}>
              📦 Enregistrer un achat
            </div>
          </div>
        </div>
      )}

      {/* REAPPRO EDIT MODAL */}
      {reapproEdit && (
        <div onClick={() => setReapproEdit(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "linear-gradient(145deg,#0d0d24,#151535)", border: "1px solid #1e1e4a", borderRadius: 20, padding: 20, width: "100%", maxWidth: 340, animation: "slideUp .3s ease" }}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 16 }}>📦 Enregistrer un achat</div>
            {!reapproEdit.suppId ? (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>Supplément</div>
                {SUPPS_DETAILED.map(s => (
                  <div key={s.id} onClick={() => setReapproEdit({ ...reapproEdit, suppId: s.id })}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10, cursor: "pointer", fontSize: 12, marginBottom: 2, background: "rgba(255,255,255,.03)", border: "1px solid #1a1a2e" }}>
                    <span>{s.emoji}</span> <span>{s.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  {(SUPPS_DETAILED.find(s => s.id === reapproEdit.suppId) || {}).emoji} {(SUPPS_DETAILED.find(s => s.id === reapproEdit.suppId) || {}).label}
                </div>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Date d'achat</div>
                <input type="date" value={reapproEdit.purchaseDate} onChange={e => setReapproEdit({ ...reapproEdit, purchaseDate: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #2a2a4a", background: "#0a0a1a", color: "#fff", fontSize: 13, fontFamily: "'Space Mono'", marginBottom: 12, boxSizing: "border-box" }} />
                <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Durée du stock (jours)</div>
                <input type="number" value={reapproEdit.quantityDays} onChange={e => setReapproEdit({ ...reapproEdit, quantityDays: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #2a2a4a", background: "#0a0a1a", color: "#fff", fontSize: 13, fontFamily: "'Space Mono'", boxSizing: "border-box" }} />
                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  <div onClick={() => { if (reapproEdit.suppId) saveReappro(reapproEdit.suppId, reapproEdit.purchaseDate, reapproEdit.quantityDays); }}
                    style={{ flex: 1, padding: "12px 0", borderRadius: 12, textAlign: "center", fontSize: 14, fontWeight: 700, cursor: "pointer", background: "linear-gradient(135deg,#e94560,#c23152)", color: "#fff" }}>
                    Sauvegarder
                  </div>
                  <div onClick={() => setReapproEdit(null)}
                    style={{ padding: "12px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer", background: "rgba(255,255,255,.06)", color: "#888" }}>
                    Annuler
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* REST TIMER FLOATING */}
      <RestTimer seconds={timerSeconds} running={timerRunning} preset={timerPreset}
        onStop={() => setTimerRunning(false)} onDismiss={() => { setTimerSeconds(0); setTimerRunning(false); }} />

      {/* EVENT MODAL */}
      {editingEvent && <EventModal event={editingEvent} onSave={saveEvent} onDelete={deleteEvent} onClose={() => setEditingEvent(null)} />}

      {/* RECURRENCE ACTION DIALOG */}
      {recurActionPrompt && (
        <div onClick={() => setRecurActionPrompt(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 998, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "linear-gradient(145deg,#0d0d24,#151535)", border: "1px solid #1e1e4a", borderRadius: 20, padding: 24, width: "100%", maxWidth: 320, animation: "slideUp .3s ease" }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>
              {recurActionPrompt.action === "delete" ? "Supprimer l'événement" : "Modifier l'événement"}
            </div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 20 }}>
              Cet événement est récurrent.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={() => {
                const evt = recurActionPrompt.event;
                if (recurActionPrompt.action === "delete") {
                  deleteEventConfirmed(evt, "single");
                } else {
                  setRecurActionPrompt(null);
                  setEditingEvent({ ...evt, isNew: false, _editMode: "single" });
                }
              }} style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #2a2a4a", background: "rgba(74,144,217,.1)", color: "#4a90d9", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit'", textAlign: "left" }}>
                Cet événement uniquement
              </button>
              <button onClick={() => {
                const evt = recurActionPrompt.event;
                if (recurActionPrompt.action === "delete") {
                  deleteEventConfirmed(evt, "all");
                } else {
                  setRecurActionPrompt(null);
                  setEditingEvent({ ...evt, isNew: false });
                }
              }} style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #2a2a4a", background: "rgba(233,69,96,.1)", color: "#e94560", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit'", textAlign: "left" }}>
                Tous les événements
              </button>
              <button onClick={() => setRecurActionPrompt(null)}
                style={{ padding: "10px 16px", borderRadius: 12, border: "none", background: "transparent", color: "#555", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit'" }}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT COLUMN */}
      <div className="main-col">

      {/* HEADER */}
      <div className="app-header" style={{ background: "linear-gradient(180deg,#e94560 0%,#0a0a1a 100%)", padding: "max(env(safe-area-inset-top), 16px) 16px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.5)", fontFamily: "'Space Mono'", letterSpacing: 3, textTransform: "uppercase" }}>Destination</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>🇮🇹 Rome avec ma copine</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "'Space Mono'", color: "#ffeb3b" }}>{dayNum}<span style={{ fontSize: 13, color: "rgba(255,255,255,.3)" }}>/{TOTAL_DAYS}</span></div>
            <div onClick={() => supabase.auth.signOut()} style={{ fontSize: 9, color: "rgba(255,255,255,.3)", cursor: "pointer", marginTop: 2 }}>Déconnexion</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,.3)", borderRadius: 12, padding: "8px 12px" }}>
          <div style={{ fontSize: 22 }}>{currentCity.emoji}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 12, fontWeight: 700 }}>{currentCity.name}</span>
              <span style={{ fontSize: 11, fontFamily: "'Space Mono'", color: "#e94560" }}>{data.totalXP} XP</span>
            </div>
            <div style={{ height: 5, background: "rgba(255,255,255,.08)", borderRadius: 3 }}>
              <div style={{ width: `${nextCity ? ((data.totalXP - currentCity.min) / (nextCity.min - currentCity.min)) * 100 : 100}%`, height: "100%", background: "linear-gradient(90deg,#e94560,#ff6b81)", borderRadius: 3, transition: "width .5s" }} />
            </div>
            {nextCity && <div style={{ fontSize: 9, color: "rgba(255,255,255,.35)", marginTop: 2 }}>{nextCity.min - data.totalXP} XP → {nextCity.name} {nextCity.emoji}</div>}
          </div>
        </div>
      </div>

      {/* MONDAY WEIGH-IN REMINDER */}
      {isMonday(getToday()) && !data.weight[`w${getWeekNumber(getToday())}`]?.poids && (
        <div onClick={() => setTab("weight")} style={{ margin: "0 16px", padding: "10px 16px", borderRadius: 12, background: "linear-gradient(135deg, rgba(233,69,96,.15), rgba(255,235,59,.1))", border: "1px solid rgba(233,69,96,.3)", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", animation: "slideUp .4s ease" }}>
          <span style={{ fontSize: 22 }}>📸</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#e94560" }}>C'est le jour de la pesée !</div>
            <div style={{ fontSize: 10, color: "#888" }}>Enregistre ton poids et tes photos</div>
          </div>
          <span style={{ marginLeft: "auto", fontSize: 16, color: "#e94560" }}>→</span>
        </div>
      )}

      {/* DATE NAV */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, padding: "10px 16px" }}>
        <button className="na" onClick={() => navigateDay(-1)}>←</button>
        <div style={{ textAlign: "center", minWidth: 120 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{dateLabel}</div>
          {selectedDate === getToday() && <div style={{ fontSize: 9, color: "#4caf50", fontWeight: 700, letterSpacing: 1 }}>AUJOURD'HUI</div>}
        </div>
        <button className="na" onClick={() => navigateDay(1)}>→</button>
      </div>

      {/* STATS BAR */}
      <div style={{ display: "flex", gap: 6, padding: "0 16px 12px" }}>
        {[{ label: "Score", value: `${dayScore}%`, color: dayScore >= 80 ? "#4caf50" : dayScore >= 50 ? "#ff9800" : "#e94560" }, { label: "Streak", value: `${streak}🔥`, color: "#ff9800" }, { label: "Sèche", value: `J${dayNum}`, color: "#ffeb3b" }].map((s, i) => (
          <div key={i} style={{ flex: 1, background: "#0d0d24", border: "1px solid #1e1e4a", borderRadius: 14, padding: "8px 6px", textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "#555" }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Space Mono'", color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="content-area" style={{ padding: "0 16px" }}>
        {tab === "prepa" && <TabPrepa data={data} save={save} />}
        {tab === "dashboard" && <TabDashboard data={data} setTab={setTab} avatarStage={avatarStage} currentCity={currentCity} nextCity={nextCity} />}
        {tab === "habits" && <TabHabits data={data} dayData={dayData} toggleItem={toggleItem} selectedDate={selectedDate} programNotStarted={programNotStarted} daysUntilProgram={daysUntilProgram} />}
        {tab === "sport" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 4, background: "#0d0d24", borderRadius: 12, padding: 3, border: "1px solid #1e1e4a" }}>
              <div onClick={() => setSportMode("naturo")} style={{ flex: 1, padding: "8px 0", borderRadius: 10, textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700, background: sportMode === "naturo" ? "rgba(233,69,96,.15)" : "transparent", color: sportMode === "naturo" ? "#e94560" : "#555" }}>🏊 Sport Naturo</div>
              <div onClick={() => setSportMode("sport1")} style={{ flex: 1, padding: "8px 0", borderRadius: 10, textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700, background: sportMode === "sport1" ? "rgba(74,144,217,.15)" : "transparent", color: sportMode === "sport1" ? "#4a90d9" : "#555" }}>💪 Sport 1</div>
            </div>
            {sportMode === "naturo" ? (
              <TabSport dayData={dayData} selectedDate={selectedDate} toggleSportSeries={toggleSportSeries} setSportReps={setSportReps} toggleSportBlock={toggleSportBlock} setSportNotes={setSportNotes} timerPreset={timerPreset} setTimerPreset={setTimerPreset} setTimerSeconds={setTimerSeconds} setTimerRunning={setTimerRunning} />
            ) : (
              <TabSport1 data={data} save={save} selectedDate={selectedDate} timerPreset={timerPreset} setTimerPreset={setTimerPreset} setTimerSeconds={setTimerSeconds} setTimerRunning={setTimerRunning} />
            )}
          </div>
        )}
        {tab === "dos" && <TabDos data={data} save={save} selectedDate={selectedDate} />}
        {tab === "planning" && <TabPlanning data={data} selectedDate={selectedDate} setSelectedDate={setSelectedDate} planWeekStart={planWeekStart} setPlanWeekStart={setPlanWeekStart} planViewMode={planViewMode} setPlanViewMode={setPlanViewMode} setEditingEvent={setEditingEvent} setRecurActionPrompt={setRecurActionPrompt} navigatePlanWeek={navigatePlanWeek} />}
        {tab === "food" && <TabFood data={data} save={save} dayData={dayData} selectedDate={selectedDate} toggleItem={toggleItem} />}
        {tab === "supps" && <TabSupps data={data} dayData={dayData} toggleItem={toggleItem} setShowSuppInfo={setShowSuppInfo} setReapproEdit={setReapproEdit} />}
        {tab === "health" && <TabHealth dayData={dayData} weekData={weekData} selectedDate={selectedDate} setSymptom={setSymptom} setNaturo={setNaturo} setTemp={setTemp} programNotStarted={programNotStarted} daysUntilProgram={daysUntilProgram} />}
        {tab === "stats" && <TabStats data={data} selectedDate={selectedDate} programNotStarted={programNotStarted} daysUntilProgram={daysUntilProgram} />}
        {tab === "weight" && <TabWeight data={data} save={save} programNotStarted={programNotStarted} />}
        {tab === "epargne" && <TabEpargne data={data} save={save} />}
      </div>

      </div>{/* END MAIN CONTENT COLUMN */}

      {/* CHAT AI */}
      <ChatWindow data={data} save={save} />
      <VoiceCommand data={data} save={save} toggleItem={toggleItem} setTab={setTab} selectedDate={selectedDate} />

      {/* BOTTOM NAV */}
      <div className="nav-outer" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "linear-gradient(0deg,#0a0a1a 60%,transparent)", padding: "20px 4px max(env(safe-area-inset-bottom, 6px), 6px)", zIndex: 100 }}>
        <div className="nav-inner" style={{ maxWidth: 480, margin: "0 auto", display: "flex", gap: 1, background: "#0a0a18", borderRadius: 14, padding: 3, border: "1px solid #1a1a3a", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          {tabs.map(t => (
            <button key={t.id} className={`tb ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
              <span style={{ fontSize: 15 }}>{t.label}</span>
              <span>{t.name}</span>
              {t.badge > 0 && <div style={{ position: "absolute", top: 2, right: 4, width: 14, height: 14, borderRadius: 7, background: "#e94560", fontSize: 8, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", animation: "pulse 1.5s infinite" }}>{t.badge}</div>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
