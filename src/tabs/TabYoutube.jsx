import { useState, useEffect, useRef } from "react";

const YT_STORAGE_KEY = "youtube_summaries";

// Extract YouTube video ID from various URL formats
function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.trim().match(p);
    if (m) return m[1];
  }
  return null;
}

// Extract playlist ID
function extractPlaylistId(url) {
  const m = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

// Parse multiple URLs from textarea
function parseUrls(text) {
  return text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function formatDate(isoStr) {
  const d = new Date(isoStr);
  return `${d.getDate()} ${["Jan", "Fev", "Mar", "Avr", "Mai", "Jun", "Jul", "Aou", "Sep", "Oct", "Nov", "Dec"][d.getMonth()]} ${d.getFullYear()}`;
}

export default function TabYoutube() {
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("fr");
  const [summaries, setSummaries] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(YT_STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [batchProgress, setBatchProgress] = useState(null); // { current, total }
  const [expandedId, setExpandedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const resultsRef = useRef(null);

  // Persist summaries
  useEffect(() => {
    localStorage.setItem(YT_STORAGE_KEY, JSON.stringify(summaries));
  }, [summaries]);

  // Determine API base URL
  const apiBase = window.location.hostname === "localhost" ? "" : "";

  async function fetchTranscript(videoId) {
    const res = await fetch(`${apiBase}/api/youtube-transcript`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Erreur lors de la recuperation de la transcription");
    }
    return res.json();
  }

  async function fetchSummary(transcript, lang) {
    const res = await fetch(`${apiBase}/api/summarize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, language: lang }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Erreur lors du resume");
    }
    return res.json();
  }

  async function summarizeVideo(url) {
    const videoId = extractVideoId(url);
    if (!videoId) throw new Error(`URL invalide: ${url}`);

    // Check if already summarized
    if (summaries.find((s) => s.id === videoId)) {
      return { skipped: true, id: videoId };
    }

    setLoadingStatus("Recuperation des sous-titres...");
    const transcriptData = await fetchTranscript(videoId);

    setLoadingStatus("Resume en cours...");
    const summaryData = await fetchSummary(transcriptData.transcript, language);

    const newSummary = {
      id: videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      title: transcriptData.title || `Video ${videoId}`,
      thumbnail: transcriptData.thumbnail,
      channel: transcriptData.channel || "",
      summary: summaryData.summary,
      oneLiner: summaryData.oneLiner,
      tags: summaryData.tags,
      date_summarized: new Date().toISOString(),
    };

    setSummaries((prev) => [newSummary, ...prev]);
    return newSummary;
  }

  async function handleSubmit() {
    if (!input.trim() || loading) return;
    setError("");
    setLoading(true);
    setBatchProgress(null);

    const urls = parseUrls(input);

    if (urls.length === 0) {
      setError("Colle au moins un lien YouTube valide");
      setLoading(false);
      return;
    }

    // Single video
    if (urls.length === 1 && !extractPlaylistId(urls[0])) {
      try {
        const result = await summarizeVideo(urls[0]);
        if (result.skipped) {
          setExpandedId(result.id);
        } else {
          setExpandedId(result.id);
        }
        setInput("");
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
      setLoadingStatus("");
      setBatchProgress(null);
      return;
    }

    // Batch mode
    const total = urls.length;
    let errors = [];
    for (let i = 0; i < total; i++) {
      setBatchProgress({ current: i + 1, total });
      try {
        await summarizeVideo(urls[i]);
      } catch (err) {
        errors.push(`${urls[i]}: ${err.message}`);
      }
    }

    if (errors.length > 0) {
      setError(`${errors.length} erreur(s):\n${errors.join("\n")}`);
    }

    setInput("");
    setLoading(false);
    setLoadingStatus("");
    setBatchProgress(null);
  }

  function deleteSummary(id) {
    setSummaries((prev) => prev.filter((s) => s.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  function copySummary(summary) {
    navigator.clipboard.writeText(summary.summary).then(() => {
      setCopiedId(summary.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  // Filter summaries
  const filtered = summaries.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.channel.toLowerCase().includes(q) ||
      (s.tags || []).some((t) => t.toLowerCase().includes(q)) ||
      s.summary.toLowerCase().includes(q) ||
      s.oneLiner.toLowerCase().includes(q)
    );
  });

  // Render markdown-ish summary
  function renderSummary(text) {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("## ")) {
        return (
          <div key={i} style={{ fontSize: 14, fontWeight: 800, color: "#e94560", marginTop: i > 0 ? 16 : 0, marginBottom: 6 }}>
            {line.replace("## ", "")}
          </div>
        );
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <div key={i} style={{ fontSize: 12, color: "#ccc", lineHeight: 1.6, paddingLeft: 12, position: "relative" }}>
            <span style={{ position: "absolute", left: 0, color: "#e94560" }}>-</span>
            {line.replace(/^[-*]\s/, "")}
          </div>
        );
      }
      if (line.trim() === "") return <div key={i} style={{ height: 8 }} />;
      return (
        <div key={i} style={{ fontSize: 12, color: "#ccc", lineHeight: 1.6 }}>
          {line}
        </div>
      );
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* HEADER */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #ff0000, #cc0000)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
              <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#0a0a1a" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>YouTube Resume</div>
            <div style={{ fontSize: 11, color: "#888" }}>Colle un lien, obtiens un resume</div>
          </div>
        </div>

        {/* INPUT */}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
          placeholder="Colle un ou plusieurs liens YouTube... (un par ligne)"
          rows={3}
          style={{
            width: "100%", padding: "12px 14px", borderRadius: 12,
            background: "#0a0a1a", border: "1px solid #2a2a4a", color: "#fff",
            fontSize: 13, fontFamily: "'Outfit'", outline: "none", resize: "vertical",
            lineHeight: 1.5, boxSizing: "border-box",
          }}
        />

        {/* CONTROLS */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
          {/* Language toggle */}
          <div style={{ display: "flex", background: "#0a0a1a", borderRadius: 10, border: "1px solid #2a2a4a", overflow: "hidden" }}>
            {["fr", "en"].map((lang) => (
              <div
                key={lang}
                onClick={() => setLanguage(lang)}
                style={{
                  padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer",
                  background: language === lang ? "rgba(233,69,96,.15)" : "transparent",
                  color: language === lang ? "#e94560" : "#555",
                }}
              >
                {lang.toUpperCase()}
              </div>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={loading || !input.trim()}
            style={{
              padding: "10px 20px", borderRadius: 12, border: "none",
              background: loading || !input.trim() ? "#1a1a2e" : "linear-gradient(135deg, #e94560, #c23152)",
              color: loading || !input.trim() ? "#555" : "#fff",
              fontSize: 13, fontWeight: 700, cursor: loading ? "default" : "pointer",
              fontFamily: "'Outfit'", display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {loading ? (
              <>
                <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                {batchProgress ? `${batchProgress.current}/${batchProgress.total}` : "..."}
              </>
            ) : (
              <>Resume</>
            )}
          </button>
        </div>

        {/* Batch progress bar */}
        {batchProgress && (
          <div style={{ marginTop: 10, background: "#0a0a1a", borderRadius: 8, overflow: "hidden", height: 4 }}>
            <div
              style={{
                height: "100%", borderRadius: 8,
                background: "linear-gradient(90deg, #e94560, #ff6b6b)",
                width: `${(batchProgress.current / batchProgress.total) * 100}%`,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        )}

        {/* Loading status */}
        {loading && loadingStatus && (
          <div style={{ marginTop: 8, fontSize: 11, color: "#888", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: 3, background: "#e94560", animation: "pulse 1s ease infinite" }} />
            {loadingStatus}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: "rgba(233,69,96,.1)", border: "1px solid rgba(233,69,96,.3)", fontSize: 12, color: "#e94560", whiteSpace: "pre-wrap" }}>
            {error}
            <div
              onClick={() => { setError(""); handleSubmit(); }}
              style={{ marginTop: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", color: "#fff", background: "rgba(233,69,96,.2)", padding: "6px 12px", borderRadius: 8, display: "inline-block" }}
            >
              Reessayer
            </div>
          </div>
        )}
      </div>

      {/* SEARCH */}
      {summaries.length > 0 && (
        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher dans les resumes..."
            style={{
              width: "100%", padding: "10px 14px 10px 36px", borderRadius: 12,
              background: "#0d0d24", border: "1px solid #1e1e4a", color: "#fff",
              fontSize: 12, fontFamily: "'Outfit'", outline: "none", boxSizing: "border-box",
            }}
          />
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#555" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </span>
        </div>
      )}

      {/* SUMMARIES LIST */}
      <div ref={resultsRef} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((s, idx) => {
          const isExpanded = expandedId === s.id;
          return (
            <div
              key={s.id}
              className="card"
              style={{
                padding: 0, overflow: "hidden", cursor: "pointer",
                animation: `slideUp 0.3s ease ${idx * 0.05}s both`,
              }}
            >
              {/* Card header - always visible */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : s.id)}
                style={{ display: "flex", gap: 12, padding: 14 }}
              >
                {/* Thumbnail */}
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ flexShrink: 0 }}
                >
                  <div style={{
                    width: 100, height: 56, borderRadius: 8, overflow: "hidden",
                    background: "#1a1a2e", position: "relative",
                  }}>
                    <img
                      src={s.thumbnail}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                    <div style={{
                      position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                      background: "rgba(0,0,0,.3)", opacity: 0, transition: "opacity .2s",
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = 0; }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  </div>
                </a>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
                    {s.channel && <span>{s.channel} - </span>}
                    {formatDate(s.date_summarized)}
                  </div>
                  <div style={{ fontSize: 11, color: "#aaa", marginTop: 4, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {s.oneLiner}
                  </div>
                </div>

                {/* Expand arrow */}
                <div style={{ flexShrink: 0, display: "flex", alignItems: "center", color: "#555", fontSize: 14, transition: "transform .2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
                </div>
              </div>

              {/* Expanded content */}
              <div style={{
                maxHeight: isExpanded ? 2000 : 0,
                overflow: "hidden",
                transition: "max-height 0.4s ease",
              }}>
                <div style={{ padding: "0 14px 14px", borderTop: "1px solid #1e1e4a" }}>
                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6, padding: "10px 0", marginBottom: 6 }}>
                    <div
                      onClick={(e) => { e.stopPropagation(); copySummary(s); }}
                      style={{
                        padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                        background: copiedId === s.id ? "rgba(76,175,80,.15)" : "rgba(255,255,255,.06)",
                        color: copiedId === s.id ? "#4caf50" : "#888",
                        cursor: "pointer", border: "1px solid " + (copiedId === s.id ? "rgba(76,175,80,.3)" : "#2a2a4a"),
                        display: "flex", alignItems: "center", gap: 4,
                      }}
                    >
                      {copiedId === s.id ? "Copie !" : "Copier"}
                    </div>
                    <div
                      onClick={(e) => { e.stopPropagation(); deleteSummary(s.id); }}
                      style={{
                        padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                        background: "rgba(233,69,96,.08)", color: "#e94560",
                        cursor: "pointer", border: "1px solid rgba(233,69,96,.2)",
                        display: "flex", alignItems: "center", gap: 4,
                      }}
                    >
                      Supprimer
                    </div>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                        background: "rgba(255,255,255,.06)", color: "#888",
                        cursor: "pointer", border: "1px solid #2a2a4a",
                        textDecoration: "none", display: "flex", alignItems: "center", gap: 4,
                      }}
                    >
                      Voir la video
                    </a>
                  </div>

                  {/* Summary content */}
                  <div style={{ fontSize: 12, color: "#ccc", lineHeight: 1.6 }}>
                    {renderSummary(s.summary)}
                  </div>

                  {/* Tags */}
                  {s.tags && s.tags.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                      {s.tags.map((tag, i) => (
                        <span
                          key={i}
                          onClick={(e) => { e.stopPropagation(); setSearchQuery(tag); }}
                          style={{
                            padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600,
                            background: "rgba(233,69,96,.1)", color: "#e94560",
                            border: "1px solid rgba(233,69,96,.2)", cursor: "pointer",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {summaries.length === 0 && !loading && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#333" }}>
          <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" style={{ color: "#333" }}>
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
              <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#0a0a1a" />
            </svg>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: "#555" }}>Aucun resume</div>
          <div style={{ fontSize: 12, color: "#444" }}>Colle un lien YouTube ci-dessus pour commencer</div>
        </div>
      )}

      {/* No search results */}
      {searchQuery && filtered.length === 0 && summaries.length > 0 && (
        <div style={{ textAlign: "center", padding: "20px", color: "#555", fontSize: 12 }}>
          Aucun resultat pour "{searchQuery}"
        </div>
      )}

      {/* Spin animation for loader */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
