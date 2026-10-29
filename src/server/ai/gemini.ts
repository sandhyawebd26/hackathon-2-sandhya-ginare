const MODELS = ["gemini-3-flash-preview", "gemini-3.8-flash", "gemini-2.0-flash-lite"];
const recent: number[] = [];

function withinLimit() {
  const now = Date.now();
  while (recent.length && now - recent[0] > 60_000) recent.shift();
  if (recent.length >= 20) return false;
  recent.push(now);
  return true;
}

export async function geminiText(prompt: string, json = false): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key || !withinLimit()) return null;
  for (const model of MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(8000),
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: json ? 0 : 0.3,
              maxOutputTokens: 320,
              ...(json ? { responseMimeType: "application/json" } : {}),
            },
          }),
        },
      );
      if (!response.ok) continue;
      const body = (await response.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
      if (text) return text;
    } catch {
      continue;
    }
  }
  return null;
}
