import "server-only";
import { validateGeneration } from "./quest-validation";
export async function generateQuest(system: string, prompt: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error("[Gemini] Missing GEMINI_API_KEY");
    throw new Error("Generation is temporarily unavailable.");
  }
  const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const timeoutMs = 90_000;
  const startedAt = performance.now();
  const context = { requestId: crypto.randomUUID(), model, timeoutMs };
  const elapsedMs = () => Math.round(performance.now() - startedAt);
  let stage = "waiting for response headers";
  let status: number | undefined;

  console.info("[Gemini] Request started", context);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      signal: AbortSignal.timeout(timeoutMs), cache: "no-store",
      body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", responseJsonSchema: { type: "object", properties: { title: {type:"string"}, caption: {type:"string"}, plan: {type:"string"} }, required: ["title","caption","plan"] }, maxOutputTokens: 8192, ...(model === "gemini-3.8-flash" ? { thinkingConfig: { thinkingLevel: "LOW" } } : {}) } }),
    });
    status = response.status;
    console.info("[Gemini] Response headers received", { ...context, status, elapsedMs: elapsedMs() });
    if (!response.ok) {
      stage = "provider returned an HTTP error";
      await response.body?.cancel().catch(() => undefined);
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
    stage = "reading response body";
    const data = await response.json();
    stage = "checking generation finish reason";
    const candidate = data.candidates?.[0];
    if (candidate?.finishReason !== "STOP") {
      console.warn("[Gemini] Generation stopped early", {
        ...context,
        finishReason: candidate?.finishReason,
        blockReason: data.promptFeedback?.blockReason,
      });
      throw new Error("AI couldn’t finish this idea. Try a different prompt.");
    }
    stage = "validating generated quest";
    const text = candidate.content?.parts?.filter((p: { text?: string; thought?: boolean }) => p.text && !p.thought).map((p: { text: string }) => p.text).join("");
    let quest;
    try { quest = validateGeneration(JSON.parse(text || "")); }
    catch { throw new Error("AI returned an incomplete idea. Try a different prompt."); }
    console.info("[Gemini] Quest generated", { ...context, elapsedMs: elapsedMs() });
    return { ...quest, model };
  } catch (error) {
    const cause = error instanceof Error ? error.cause : undefined;
    const causeCode = typeof cause === "object" && cause !== null && "code" in cause
      ? cause.code
      : undefined;
    console.error("[Gemini] Request failed", {
      ...context,
      stage,
      status,
      elapsedMs: elapsedMs(),
      errorName: error instanceof Error ? error.name : undefined,
      causeCode,
    });
    throw error;
  }
}
