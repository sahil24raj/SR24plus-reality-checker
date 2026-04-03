import { AnalysisResult } from "../types";

// ─── Provider detection ──────────────────────────────────────────────────────
// Set GROK_API_KEY in Vercel env vars → uses Grok
// Set GEMINI_API_KEY in Vercel env vars → uses Gemini
// If both set → Grok takes priority
const GROK_KEY = process.env.GROK_API_KEY || "";
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const USE_GROK = !!GROK_KEY;

// ─── Prompt ──────────────────────────────────────────────────────────────────
function buildPrompt(currentLog: string, pastSummary: string, userGoal: string): string {
  return `You are a strict AI behavioral coach. Analyze the log below and return ONLY a JSON object (no markdown, no extra text).

LOG: "${currentLog.slice(0, 500)}"
PAST LOGS: ${pastSummary}
USER GOAL: ${userGoal}

Return this exact JSON structure (all strings max 100 chars, arrays max 3 items):
{
  "emotionalState": "string",
  "mentalEnergy": "string",
  "focusLevel": 0-100,
  "disciplineLevel": 0-100,
  "coreExplanation": "string",
  "disciplineScore": 0-100,
  "focusScore": 0-100,
  "consistencyScore": 0-100,
  "mentalStabilityScore": 0-100,
  "scoresExplanation": "string",
  "trigger": "string or empty",
  "triggerExplanation": "string",
  "timelineAnalysis": "string",
  "personalityProfile": ["trait1", "trait2", "trait3"],
  "behaviorPattern": "string",
  "futurePrediction": "string",
  "recoveryProtocol": ["step1", "step2", "step3"],
  "actionPlan": ["action1", "action2", "action3"],
  "goalAlignment": "string",
  "aiCoachMessage": "string",
  "brutalRealityCheck": "string",
  "decisionQuality": "Right|Wrong|Mixed",
  "sentiment": "Positive|Negative|Mixed",
  "tone": "string",
  "realityScore": 0-100,
  "behavior": "string",
  "confidence": 0-100
}`;
}

// ─── Grok API call (OpenAI-compatible) ───────────────────────────────────────
async function callGrok(prompt: string): Promise<string> {
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROK_KEY}`
    },
    body: JSON.stringify({
      model: "grok-3-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 1500
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// ─── Gemini API call (fallback) ───────────────────────────────────────────────
async function callGemini(prompt: string): Promise<string> {
  const MODELS = ["gemini-2.0-flash-001", "gemini-2.0-flash", "gemini-1.5-flash"];
  let lastErr: any = null;

  for (const model of MODELS) {
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const genAI = new GoogleGenAI({ apiKey: GEMINI_KEY });
      const response = await genAI.models.generateContent({
        model,
        contents: prompt,
        config: { maxOutputTokens: 2000, responseMimeType: "application/json" }
      });
      return response.text || "";
    } catch (err: any) {
      lastErr = err;
      const is503 = err?.message?.includes("503") || err?.message?.includes("UNAVAILABLE");
      if (is503) { console.warn(`${model} busy, trying next...`); continue; }
      throw err;
    }
  }
  throw lastErr;
}

// ─── Map flat JSON → AnalysisResult ──────────────────────────────────────────
function mapResponse(flat: any): Partial<AnalysisResult> {
  return {
    confidence: flat.confidence ?? 50,
    tone: flat.tone ?? "Neutral",
    behavior: flat.behavior ?? "Observational",
    decisionQuality: flat.decisionQuality ?? "Mixed",
    sentiment: flat.sentiment ?? "Neutral",
    realityScore: flat.realityScore ?? 50,
    coreState: {
      emotionalState: flat.emotionalState ?? "Unknown",
      mentalEnergy: flat.mentalEnergy ?? "Medium",
      focusLevel: flat.focusLevel ?? 50,
      disciplineLevel: flat.disciplineLevel ?? 50,
      explanation: flat.coreExplanation ?? "",
    },
    realityScores: {
      disciplineScore: flat.disciplineScore ?? 50,
      focusScore: flat.focusScore ?? 50,
      consistencyScore: flat.consistencyScore ?? 50,
      mentalStabilityScore: flat.mentalStabilityScore ?? 50,
      explanation: flat.scoresExplanation ?? "",
    },
    triggerDetection: flat.trigger ? {
      trigger: flat.trigger,
      explanation: flat.triggerExplanation ?? "",
    } : undefined,
    timelineAnalysis: flat.timelineAnalysis,
    personalityProfile: flat.personalityProfile ?? [],
    behaviorPattern: flat.behaviorPattern,
    futurePrediction: flat.futurePrediction,
    recoveryProtocol: flat.recoveryProtocol ?? [],
    actionPlan: flat.actionPlan ?? [],
    goalAlignment: flat.goalAlignment,
    aiCoachMessage: flat.aiCoachMessage,
    brutalRealityCheck: flat.brutalRealityCheck,
  };
}

// ─── Main export ─────────────────────────────────────────────────────────────
export async function analyzeRealityWithGemini(
  currentLog: string,
  pastLogs: string[] = [],
  userGoal?: string
): Promise<Partial<AnalysisResult>> {
  const pastSummary = pastLogs.length > 0
    ? pastLogs.slice(-5).map((l, i) => `[${i + 1}] ${l.slice(0, 60)}`).join("; ")
    : "none";

  const goal = userGoal ? userGoal.slice(0, 80) : "none";
  const prompt = buildPrompt(currentLog, pastSummary, goal);

  try {
    const rawText = USE_GROK ? await callGrok(prompt) : await callGemini(prompt);
    if (!rawText) throw new Error("Empty response from AI");

    const flat = JSON.parse(rawText);
    return mapResponse(flat);
  } catch (err: any) {
    console.error("AI Analysis Failed:", err);
    const msg = err?.message || "";

    if (msg.includes("401") || msg.includes("invalid_api_key") || msg.includes("Unauthorized")) {
      throw new Error("Invalid API key. Please check your GROK_API_KEY or GEMINI_API_KEY in Vercel environment variables.");
    }
    if (msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("high demand")) {
      throw new Error("AI model is currently overloaded. Please try again in a moment.");
    }
    throw new Error(msg || "AI analysis failed. Please try again.");
  }
}
