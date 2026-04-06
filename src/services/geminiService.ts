import { AnalysisResult } from "../types";

// ─── Provider Detection ───────────────────────────────────────────────────────
const GROQ_KEY   = process.env.GROQ_API_KEY  || "";
const GROK_KEY   = process.env.GROK_API_KEY  || "";
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const PROVIDER   = GROQ_KEY ? "groq" : GROK_KEY ? "grok" : GEMINI_KEY ? "gemini" : "none";

// ─── Master Prompt (v3.3 Deep Scan Analysis) ─────────────────────────────
function buildPrompt(log: string, past: string, goal: string): string {
  return `You are an advanced AI Life Intelligence System. Analyze the behavioral log below and return ONLY a valid JSON object.

CURRENT LOG: "${log.slice(0, 800)}"
PAST LOGS (context): ${past}
USER GOAL: ${goal}

--------------------------------------
CORE MISSION:
You are an advanced Reality Mirror Engine. Your job is NOT to motivate or comfort. Your job is to expose the gap between potential and reality, and force clarity and action. Analyze behavior, productivity, emotions, and decisions at a deep level. Detect patterns, calculate scores, identify triggers, analyze decisions, detect lies/excuses, calculate time waste, and generate predictions.

TONE:
Direct, honest, slightly harsh, and data-driven. Call out excuses, patterns, and laziness if visible. No motivational fluff. No sugarcoating. Use "you".

--------------------------------------
OUTPUT FORMAT (STRICT JSON):
{
  "bestVersionToday": "Specific description of what the ideal version of the user would have done (hours, tasks, outputs)",
  "realityGapScore": 0-100,
  "brutalTruth": "Direct, honest, harsh reality check calling out excuses/patterns",
  "futureIfContinued": "Lost skills, missed opportunities, and realistic negative outcomes over 30 days",
  "tomorrowFixPlan": ["Step 1", "Step 2", "Step 3"],

  "emotionalState": "string",
  "mentalEnergy": "Low|Medium|High",
  "focusLevel": 0-100,
  "disciplineLevel": 0-100,
  "coreExplanation": "string (brief)",

  "lifeControlScore": 0-100,
  "disciplineScore": 0-100,
  "focusScore": 0-100,
  "consistencyScore": 0-100,
  "mentalStabilityScore": 0-100,
  "scoresExplanation": "string (brief)",

  "executionGap": {
    "plannedEffort": "string",
    "actualExecution": "string",
    "gapPercent": 0-100,
    "mainIssue": "string"
  },

  "trigger": "string",
  "triggerExplanation": "string (Your main trigger is ____, causing ____)",

  "timelineAnalysis": "string",
  "personalityProfile": ["string"],
  "behaviorPattern": "string",
  "futurePrediction": "string (realistic 3-7 day prediction)",
  
  "deepScan": {
    "lieDetection": {
       "claimed": "string",
       "actual": "string",
       "excuse": "string",
       "truth": "string"
    },
    "timeWaste": {
       "productiveTime": "e.g. 4h",
       "wastedTime": "e.g. 6h",
       "dailyLoss": "string",
       "monthlyLoss": "string",
       "yearlyLoss": "string"
    },
    "decisionTree": {
       "decisions": [{"activity": "string", "quality": "Good|Bad"}],
       "rootCause": "string"
    },
    "relapseDetection": {
       "daysImproved": number,
       "relapseDescription": "string (focused on pattern from past logs)"
    },
    "focusDecay": {
       "start": 0-100, "middle": 0-100, "end": 0-100,
       "insight": "string"
    },
    "selfControl": {
       "score": 0-100,
       "explanation": "string (You lost control when ____)"
    },
    "procrastinationCost": {
       "daily": "string", "weekly": "string", "monthly": "string", "yearly": "string",
       "finalLine": "You are losing ____ hours of your life."
    },
    "failureLoop": {
       "behavior": "string",
       "frequencyDays": number
    },
    "alterEgo": {
       "currentSelf": "string", "idealSelf": "string", "gap": "string",
       "finalStatement": "You are acting like ____, not like your ideal self."
    },
    "microTask": "string (Just do this: ____)"
  },

  "burnoutRisk": "Low|Medium|High",
  "burnoutExplanation": "string",
  "dopamineLoop": boolean,
  "dopamineLoopExplanation": "string",
  "recoveryProtocol": ["string"],
  "actionPlan": ["string"],
  "goalAlignment": "string",
  "microWins": ["string"],
  "aiCoachMessage": "string (Strict + Motivating)",
  "brutalRealityCheck": "string (If needed)",

  "decisionQuality": "Good|Bad|Mixed",
  "sentiment": "Positive|Negative|Neutral",
  "tone": "string",
  "realityScore": 0-100,
  "behavior": "string",
  "confidence": 0-100
}`;
}

// ─── OpenAI-compatible call (Groq + xAI Grok) ────────────────────────────────
async function callOpenAICompat(baseUrl: string, key: string, model: string, prompt: string): Promise<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.35,
      max_tokens: 3000
    })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
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
      if (err?.message?.includes("503") || err?.message?.includes("UNAVAILABLE")) continue;
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
      lifeControlScore: flat.lifeControlScore ?? 50,
      disciplineScore: flat.disciplineScore ?? 50,
      focusScore: flat.focusScore ?? 50,
      consistencyScore: flat.consistencyScore ?? 50,
      mentalStabilityScore: flat.mentalStabilityScore ?? 50,
      explanation: flat.scoresExplanation ?? "",
    },

    executionGap: {
      plannedEffort: flat.executionGap?.plannedEffort ?? flat.plannedEffort ?? "Unknown",
      actualExecution: flat.executionGap?.actualExecution ?? flat.actualExecution ?? "Unknown",
      gapPercent: flat.executionGap?.gapPercent ?? flat.executionGapPercent ?? 0,
      mainIssue: flat.executionGap?.mainIssue ?? flat.mainIssue ?? "",
    },

    triggerDetection: flat.trigger ? {
      trigger: flat.trigger,
      explanation: flat.triggerExplanation ?? "",
    } : undefined,

    timelineAnalysis: flat.timelineAnalysis,
    personalityProfile: flat.personalityProfile ?? [],
    behaviorPattern: flat.behaviorPattern,
    futurePrediction: flat.futurePrediction,

    deepScan: flat.deepScan,

    burnoutRisk: flat.burnoutRisk as 'Low' | 'Medium' | 'High' ?? 'Low',
    burnoutExplanation: flat.burnoutExplanation,

    dopamineLoop: flat.dopamineLoop ?? false,
    dopamineLoopExplanation: flat.dopamineLoopExplanation,

    recoveryProtocol: flat.recoveryProtocol ?? [],
    actionPlan: flat.nextDayActionPlan ?? flat.actionPlan ?? [],
    goalAlignment: flat.goalAlignment,
    microWins: flat.microWins ?? [],
    aiCoachMessage: flat.aiCoachMessage,
    brutalRealityCheck: flat.brutalRealityCheck,

    // Reality Mirror Engine
    bestVersionToday: flat.bestVersionToday,
    realityGapScore: flat.realityGapScore,
    brutalTruth: flat.brutalTruth,
    futureIfContinued: flat.futureIfContinued,
    tomorrowFixPlan: flat.tomorrowFixPlan ?? [],
  };
}

// ─── Main export ─────────────────────────────────────────────────────────────
export async function analyzeRealityWithGemini(
  currentLog: string,
  pastLogs: string[] = [],
  userGoal?: string
): Promise<Partial<AnalysisResult>> {
  const pastSummary = pastLogs.length > 0
    ? pastLogs.slice(-5).map((l, i) => `[${i + 1}] ${l.slice(0, 80)}`).join("; ")
    : "none";

  const prompt = buildPrompt(currentLog, pastSummary, userGoal?.slice(0, 100) || "none");

  try {
    let rawText = "";

    if (PROVIDER === "groq") {
      rawText = await callOpenAICompat("https://api.groq.com/openai/v1", GROQ_KEY, "llama-3.3-70b-versatile", prompt);
    } else if (PROVIDER === "grok") {
      rawText = await callOpenAICompat("https://api.x.ai/v1", GROK_KEY, "grok-3-mini", prompt);
    } else if (PROVIDER === "gemini") {
      rawText = await callGemini(prompt);
    } else {
      throw new Error("No AI API key found. Set GROQ_API_KEY, GROK_API_KEY, or GEMINI_API_KEY in Vercel environment variables.");
    }

    if (!rawText) throw new Error("Empty response from AI");

    const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const flat = JSON.parse(cleaned);
    return mapResponse(flat);

  } catch (err: any) {
    console.error(`AI Analysis Failed [${PROVIDER}]:`, err);
    const msg = err?.message || "";
    if (msg.includes("401") || msg.includes("invalid_api_key") || msg.includes("Unauthorized")) {
      throw new Error(`Invalid API key. Check your ${PROVIDER.toUpperCase()}_API_KEY in Vercel.`);
    }
    if (msg.includes("429") || msg.includes("rate_limit")) {
      throw new Error("Rate limit hit. Wait a moment and try again.");
    }
    if (msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("high demand")) {
      throw new Error("AI model is overloaded. Please try again in a moment.");
    }
    throw new Error(msg || "AI analysis failed. Please try again.");
  }
}
