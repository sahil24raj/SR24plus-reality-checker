import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const genAI = new GoogleGenAI({ apiKey: (import.meta as any).env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '') || "" });

export async function analyzeRealityWithGemini(
  currentLog: string,
  pastLogs: string[] = [],
  userGoal?: string
): Promise<Partial<AnalysisResult>> {
  const model = "gemini-3-flash-preview";

  const pastSummary = pastLogs.length > 0
    ? pastLogs.slice(-5).map((l, i) => `[${i + 1}] ${l.slice(0, 60)}`).join('; ')
    : 'none';

  const prompt = `You are a strict AI life coach. Analyze this behavioral log. Be concise.

LOG: "${currentLog.slice(0, 400)}"
PAST: ${pastSummary.slice(0, 200)}
GOAL: ${userGoal ? userGoal.slice(0, 80) : 'none'}

Return compact JSON. All strings max 100 chars. All arrays max 3 items.`;

  try {
    const response = await genAI.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        maxOutputTokens: 1500,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            // Core state (flattened for token efficiency)
            emotionalState: { type: Type.STRING },
            mentalEnergy: { type: Type.STRING },
            focusLevel: { type: Type.NUMBER },
            disciplineLevel: { type: Type.NUMBER },
            coreExplanation: { type: Type.STRING },
            // Reality scores
            disciplineScore: { type: Type.NUMBER },
            focusScore: { type: Type.NUMBER },
            consistencyScore: { type: Type.NUMBER },
            mentalStabilityScore: { type: Type.NUMBER },
            scoresExplanation: { type: Type.STRING },
            // Trigger
            trigger: { type: Type.STRING },
            triggerExplanation: { type: Type.STRING },
            // Analysis
            timelineAnalysis: { type: Type.STRING },
            personalityProfile: { type: Type.ARRAY, items: { type: Type.STRING } },
            behaviorPattern: { type: Type.STRING },
            futurePrediction: { type: Type.STRING },
            recoveryProtocol: { type: Type.ARRAY, items: { type: Type.STRING } },
            actionPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
            goalAlignment: { type: Type.STRING },
            aiCoachMessage: { type: Type.STRING },
            brutalRealityCheck: { type: Type.STRING },
            // Standard fields
            decisionQuality: { type: Type.STRING },
            sentiment: { type: Type.STRING },
            tone: { type: Type.STRING },
            realityScore: { type: Type.NUMBER },
            behavior: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          },
          required: [
            "emotionalState", "mentalEnergy", "focusLevel", "disciplineLevel", "coreExplanation",
            "disciplineScore", "focusScore", "consistencyScore", "mentalStabilityScore", "scoresExplanation",
            "trigger", "triggerExplanation", "timelineAnalysis", "personalityProfile", "behaviorPattern",
            "futurePrediction", "recoveryProtocol", "actionPlan", "goalAlignment",
            "aiCoachMessage", "brutalRealityCheck",
            "decisionQuality", "sentiment", "tone", "realityScore", "behavior", "confidence"
          ]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from Gemini");

    const flat = JSON.parse(resultText);

    // Re-map flat fields back into the nested AnalysisResult structure
    const mapped: Partial<AnalysisResult> = {
      confidence: flat.confidence,
      tone: flat.tone,
      behavior: flat.behavior,
      decisionQuality: flat.decisionQuality,
      sentiment: flat.sentiment,
      realityScore: flat.realityScore,
      coreState: {
        emotionalState: flat.emotionalState,
        mentalEnergy: flat.mentalEnergy,
        focusLevel: flat.focusLevel,
        disciplineLevel: flat.disciplineLevel,
        explanation: flat.coreExplanation,
      },
      realityScores: {
        disciplineScore: flat.disciplineScore,
        focusScore: flat.focusScore,
        consistencyScore: flat.consistencyScore,
        mentalStabilityScore: flat.mentalStabilityScore,
        explanation: flat.scoresExplanation,
      },
      triggerDetection: {
        trigger: flat.trigger,
        explanation: flat.triggerExplanation,
      },
      timelineAnalysis: flat.timelineAnalysis,
      personalityProfile: flat.personalityProfile,
      behaviorPattern: flat.behaviorPattern,
      futurePrediction: flat.futurePrediction,
      recoveryProtocol: flat.recoveryProtocol,
      actionPlan: flat.actionPlan,
      goalAlignment: flat.goalAlignment,
      aiCoachMessage: flat.aiCoachMessage,
      brutalRealityCheck: flat.brutalRealityCheck,
    };

    return mapped;
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
}
