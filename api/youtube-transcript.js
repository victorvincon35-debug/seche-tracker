const INNERTUBE_API_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
const ANDROID_UA = "com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip";

function decodeHtmlEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/\n/g, " ");
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, "");
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { videoId } = req.body;
  if (!videoId) return res.status(400).json({ error: "videoId is required" });

  try {
    // Use YouTube InnerTube API with ANDROID client to get caption tracks
    const playerRes = await fetch(
      `https://www.youtube.com/youtubei/v1/player?key=${INNERTUBE_API_KEY}&prettyPrint=false`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": ANDROID_UA,
        },
        body: JSON.stringify({
          videoId,
          context: {
            client: {
              clientName: "ANDROID",
              clientVersion: "19.09.37",
              androidSdkVersion: 30,
              hl: "fr",
              gl: "FR",
            },
          },
        }),
      }
    );

    if (!playerRes.ok) throw new Error("YouTube player API error");
    const playerData = await playerRes.json();

    // Extract video metadata
    const title = playerData?.videoDetails?.title || "";
    const channel = playerData?.videoDetails?.author || "";
    const durationSec = parseInt(playerData?.videoDetails?.lengthSeconds || "0", 10);
    const duration = formatDuration(durationSec);

    // Get caption tracks
    const tracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!tracks || tracks.length === 0) {
      return res.status(404).json({ error: "Aucun sous-titre disponible pour cette video" });
    }

    // Pick best track: prefer fr manual, then en manual, then fr asr, then en asr, then first
    const track =
      tracks.find((t) => t.languageCode === "fr" && t.kind !== "asr") ||
      tracks.find((t) => t.languageCode === "en" && t.kind !== "asr") ||
      tracks.find((t) => t.languageCode === "fr") ||
      tracks.find((t) => t.languageCode === "en") ||
      tracks.find((t) => t.languageCode.startsWith("en")) ||
      tracks[0];

    // Fetch the caption XML
    const captionRes = await fetch(track.baseUrl, {
      headers: { "User-Agent": ANDROID_UA },
    });
    if (!captionRes.ok) throw new Error("Failed to fetch captions");
    const xml = await captionRes.text();

    // Parse <p> elements (ANDROID format) or <text> elements (WEB format)
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/g;
    const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/g;
    const segments = [];
    let match;

    while ((match = pRegex.exec(xml)) !== null) {
      const text = decodeHtmlEntities(stripTags(match[1])).trim();
      if (text) segments.push(text);
    }

    // Fallback to <text> format
    if (segments.length === 0) {
      while ((match = textRegex.exec(xml)) !== null) {
        const text = decodeHtmlEntities(stripTags(match[1])).trim();
        if (text) segments.push(text);
      }
    }

    if (segments.length === 0) {
      return res.status(404).json({ error: "Transcription vide pour cette video" });
    }

    const transcript = segments.join(" ");

    return res.status(200).json({
      transcript,
      title,
      channel,
      duration,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    });
  } catch (err) {
    console.error("Transcript error:", err);
    return res.status(500).json({
      error: "Impossible de recuperer la transcription: " + err.message,
    });
  }
}
