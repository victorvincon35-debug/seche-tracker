export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured on server" });

  const { transcript, language = "fr" } = req.body;
  if (!transcript) return res.status(400).json({ error: "transcript is required" });

  const systemPrompt =
    language === "fr"
      ? `Tu es un assistant specialise dans le resume de videos YouTube. On te donne la transcription d'une video. Fais un resume clair, structure et concis en francais.

Format de ta reponse :
## En une phrase
[L'idee principale de la video en 1 phrase]

## Resume
[Resume structure en 3-5 points cles, avec des bullet points]

## Points importants
[Les informations les plus utiles / actionnables]

## Tags
[3-5 mots-cles pour categoriser la video, separes par des virgules]

Sois direct, pas de blabla. Garde uniquement l'essentiel.`
      : `You are an assistant specialized in summarizing YouTube videos. You are given a video transcript. Provide a clear, structured, and concise summary in English.

Format your response:
## In one sentence
[The main idea of the video in 1 sentence]

## Summary
[Structured summary in 3-5 key points, with bullet points]

## Key takeaways
[The most useful / actionable information]

## Tags
[3-5 keywords to categorize the video, separated by commas]

Be direct, no fluff. Keep only the essentials.`;

  // Truncate very long transcripts (keep ~80k chars ~ 20k tokens)
  const maxChars = 80000;
  let text = transcript;
  let isChunked = false;

  if (text.length > maxChars) {
    isChunked = true;
    // Take beginning and end for context
    text = text.slice(0, maxChars / 2) + "\n\n[...contenu tronque...]\n\n" + text.slice(-maxChars / 2);
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 1500,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: isChunked
              ? `Voici la transcription d'une video YouTube (tronquee car trop longue). Resume-la :\n\n${text}`
              : `Voici la transcription d'une video YouTube. Resume-la :\n\n${text}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error("Claude API error:", response.status, errData);
      return res.status(502).json({ error: "Erreur API Claude: " + (errData.error?.message || response.statusText) });
    }

    const result = await response.json();
    const summaryText = result.content?.[0]?.text || "";

    // Parse structured sections
    const oneLinerMatch = summaryText.match(/## (?:En une phrase|In one sentence)\n([\s\S]*?)(?=\n## )/);
    const tagsMatch = summaryText.match(/## Tags\n([\s\S]*?)$/);

    const oneLiner = oneLinerMatch ? oneLinerMatch[1].trim() : "";
    const tags = tagsMatch
      ? tagsMatch[1]
          .trim()
          .split(/[,\n]/)
          .map((t) => t.replace(/^[-*\s]+/, "").trim())
          .filter(Boolean)
      : [];

    return res.status(200).json({
      summary: summaryText,
      oneLiner,
      tags,
    });
  } catch (err) {
    console.error("Summarize error:", err);
    return res.status(500).json({ error: "Erreur serveur: " + err.message });
  }
}
