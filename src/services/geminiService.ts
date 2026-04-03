import { AnalysisResult } from "../types";

// ─── API Provider Detection ───────────────────────────────────────────────────
// Priority: GROQ_API_KEY > GROK_API_KEY > GEMINI_API_KEY
// Just set the right env var in Vercel → it auto-switches provider
const GROQ_KEY  = process.env.GROQ_API_KEY  || "";   // groq.com (FREE - 14,400/day, Llama 3.3 70B)
const GROK_KEY  = process.env.GROK_API_KEY  || "";   // x.ai/grok ($25 credits)
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";  // Google Gemini (1500/day)

const PROVIDER = GROQ_KEY ? "groq" : GROK_KEY ? "grok" : GEMINI_KEY ? "gemini" : "none";

// ─── Prompt ──────────────────────────────────────────────────────────────────
function buildPrompt(log: string, past: string, goal: string): string {
  return `You are a strict AI behavioral life coach. Analyze the log and return ONLY valid JSON (no markdown, no explanation outside JSON).

LOG: "${log.slice(0, 500)}"
PAST LOGS: ${past}
GOAL: ${goal}

Return exactly this JSON (strings max 100 chars, arrays max 3 items):
{
  "emotionalState": "string",
  "mentalEnergy": "Low|Medium|High",
  "focusLevel": 0-100,
  "disciplineLevel": 0-100,
  "coreExplanation": "2-3 lines about internal state",
  "disciplineScore": 0-100,
  "focusScore": 0-100,
  "consistencyScore": 0-100,
  "mentalStabilityScore": 0-100,
  "scoresExplanation": "brief explanation",
  "trigger": "detected trigger or empty string",
  "triggerExplanation": "explanation",
  "timelineAnalysis": "pattern over time",
  "personalityProfile": ["trait1", "trait2", "trait3"],
  "behaviorPattern": "detected pattern",
  "futurePrediction": "what will happen if this continues",
  "recoveryProtocol": ["step1", "step2", "step3"],
  "actionPlan": ["action1", "action2", "action3"],
  "goalAlignment": "how aligned with goal",
  "aiCoachMessage": "direct coach message",
  "brutalRealityCheck": "harsh honest truth",
  "decisionQuality": "Right|Wrong|Mixed",
  "sentiment": "Positive|Negative|Mixed",
  "tone": "Disciplined|Distracted|Motivated|Burned Out|Anxious|Focused|Regretful",
  "realityScore": 0-100,
  "behavior": "summary of behavior",
  "confidence": 0-100
}`;
}

// ─── OpenAI-compatible call (used for both Groq and xAI Grok) ────────────────
async function callOpenAICompat(
  baseUrl: string,
  apiKey: string,
  model: string,
  prompt: string
): Promise<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 1500
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HTTP ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// ─── Gemini call (fallback) ───────────────────────────────────────────────────
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
      const busy = err?.message?.includes("503") || err?.message?.includes("UNAVAILABLE");
      if (busy) { console.warn(`${model} busy, trying next...`); continue; }
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

  const prompt = buildPrompt(currentLog, pastSummary, userGoal?.slice(0, 80) || "none");

  try {
    let rawText = "";

    if (PROVIDER === "groq") {
      // groq.com — FREE, Ultra fast, Llama 3.3 70B
      rawText = await callOpenAICompat("https://api.groq.com/openai/v1", GROQ_KEY, "llama-3.3-70b-versatile", prompt);
    } else if (PROVIDER === "grok") {
      // x.ai Grok
      rawText = await callOpenAICompat("https://api.x.ai/v1", GROK_KEY, "grok-3-mini", prompt);
    } else if (PROVIDER === "gemini") {
      rawText = await callGemini(prompt);
    } else {
      throw new Error("No AI API key configured. Set GROQ_API_KEY, GROK_API_KEY, or GEMINI_API_KEY in Vercel environment variables.");
    }

    if (!rawText) throw new Error("Empty response from AI");

    // Strip markdown code blocks if present (some models add them)
    const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const flat = JSON.parse(cleaned);
    return mapResponse(flat);

  } catch (err: any) {
    console.error(`AI Analysis Failed [${PROVIDER}]:`, err);
    const msg = err?.message || "";

    if (msg.includes("401") || msg.includes("invalid_api_key") || msg.includes("Unauthorized")) {
      throw new Error(`Invalid API key for ${PROVIDER.toUpperCase()}. Check your env variable in Vercel.`);
    }
    if (msg.includes("429") || msg.includes("rate_limit")) {
      throw new Error("Rate limit hit. Wait a moment and try again.");
    }
    if (msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("high demand")) {
      throw new Error("AI model overloaded. Please try again in a moment.");
    }
    throw new Error(msg || "AI analysis failed. Please try again.");
  }
}
