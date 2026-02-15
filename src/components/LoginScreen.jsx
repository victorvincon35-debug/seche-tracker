import { useState } from "react";
import { supabase } from "../supabase.js";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error: err } = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    if (err) setError(err.message);
    setBusy(false);
  };

  return (
    <div style={{ fontFamily: "'Outfit',sans-serif", background: "#0a0a1a", minHeight: "100vh", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}body{background:#0a0a1a}`}</style>
      <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 360, padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>✈️🇮🇹</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Sèche Tracker</div>
          <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>{mode === "login" ? "Connexion" : "Créer un compte"}</div>
        </div>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required style={{ width: "100%", padding: "14px 16px", marginBottom: 10, borderRadius: 12, border: "1px solid #2a2a4a", background: "#0d0d24", color: "white", fontSize: 14, fontFamily: "'Outfit'", outline: "none" }} />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mot de passe" required minLength={6} style={{ width: "100%", padding: "14px 16px", marginBottom: 16, borderRadius: 12, border: "1px solid #2a2a4a", background: "#0d0d24", color: "white", fontSize: 14, fontFamily: "'Outfit'", outline: "none" }} />
        {error && <div style={{ color: "#e94560", fontSize: 12, marginBottom: 12, textAlign: "center" }}>{error}</div>}
        <button type="submit" disabled={busy} style={{ width: "100%", padding: "14px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#e94560,#c23152)", color: "white", fontSize: 15, fontWeight: 700, fontFamily: "'Outfit'", cursor: busy ? "wait" : "pointer", opacity: busy ? 0.6 : 1 }}>
          {busy ? "..." : mode === "login" ? "Se connecter" : "Créer le compte"}
        </button>
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <span onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }} style={{ color: "#e94560", fontSize: 12, cursor: "pointer" }}>
            {mode === "login" ? "Créer un compte" : "J'ai déjà un compte"}
          </span>
        </div>
      </form>
    </div>
  );
}
