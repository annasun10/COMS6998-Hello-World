import "server-only";
import { validateGeneration } from "./quest-validation";
export async function generateQuest(system: string, prompt: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Generation is temporarily unavailable.");
  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    signal: AbortSignal.timeout(45000), cache: "no-store",
    body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", responseJsonSchema: { type: "object", properties: { title: {type:"string"}, caption: {type:"string"}, plan: {type:"string"} }, required: ["title","caption","plan"] }, maxOutputTokens: 8192, ...(model === "gemini-3.8-flash" ? { thinkingConfig: { thinkingLevel: "LOW" } } : {}) } }),
  });
  if (!response.ok) {
    const failure = await response.json().catch(() => null);
    const message = typeof failure?.error?.message === "string"
      ? failure.error.message.replaceAll(key, "[REDACTED]") : "No provider details";
    console.error("Gemini generation failed:", { model, status: response.status, code: failure?.error?.status, message });
    const messages: Record<number, string> = {
      400: "Gemini rejected the request (400). Check the server log for configuration details.",
      401: "Gemini authentication failed (401). Check the configured API key.",
      403: "Gemini denied access (403). Check API key permissions and Google project settings.",
      404: "The configured Gemini model is unavailable (404). Check GEMINI_MODEL.",
      503: "Gemini is overloaded right now. Please wait a minute before trying again.",
      429: "Gemini’s quota is currently exceeded (429). Please try again later.",
    };
    throw new Error(messages[response.status] || `AI is temporarily unavailable (${response.status}). Please try again later.`);
  }
  const data = await response.json();
  const candidate = data.candidates?.[0];
  if (candidate?.finishReason !== "STOP") throw new Error("AI couldn’t finish this idea. Try a different prompt.");
  const text = candidate.content?.parts?.filter((p: { text?: string; thought?: boolean }) => p.text && !p.thought).map((p: { text: string }) => p.text).join("");
  try { return { ...validateGeneration(JSON.parse(text || "")), model }; }
  catch { throw new Error("AI returned an incomplete idea. Try a different prompt."); }
}
