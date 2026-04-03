import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeRealityWithGemini(
  currentLog: string,
  pastLogs: string[] = [],
  userGoal?: string
): Promise<Partial<AnalysisResult>> {
  const model = "gemini-3-flash-preview";

  const pastSummary = pastLogs.length > 0
    ? pastLogs.slice(-5).map((l, i) => `[${i + 1}] ${l.slice(0, 60)}`).join('; ')
    : 'none';

  const prompt = `Strict AI life coach. Analyze this log and return JSON.

LOG: "${currentLog.slice(0, 500)}"
PAST: ${pastSummary.slice(0, 200)}
GOAL: ${userGoal ? userGoal.slice(0, 80) : 'none'}

Rules: All strings under 100 chars. Arrays max 3 items. Be sharp and specific.`;

  try {
    const response = await genAI.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        maxOutputTokens: 2000,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            emotionalState: { type: Type.STRING },
            mentalEnergy: { type: Type.STRING },
            focusLevel: { type: Type.NUMBER },
            disciplineLevel: { type: Type.NUMBER },
            coreExplanation: { type: Type.STRING },
            disciplineScore: { type: Type.NUMBER },
            focusScore: { type: Type.NUMBER },
            consistencyScore: { type: Type.NUMBER },
            mentalStabilityScore: { type: Type.NUMBER },
            scoresExplanation: { type: Type.STRING },
            trigger: { type: Type.STRING },
            triggerExplanation: { type: Type.STRING },
            timelineAnalysis: { type: Type.STRING },
            personalityProfile: { type: Type.ARRAY, items: { type: Type.STRING } },
            behaviorPattern: { type: Type.STRING },
            futurePrediction: { type: Type.STRING },
            recoveryProtocol: { type: Type.ARRAY, items: { type: Type.STRING } },
            actionPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
            goalAlignment: { type: Type.STRING },
            aiCoachMessage: { type: Type.STRING },
            brutalRealityCheck: { type: Type.STRING },
            decisionQuality: { type: Type.STRING },
            sentiment: { type: Type.STRING },
            tone: { type: Type.STRING },
            realityScore: { type: Type.NUMBER },
            behavior: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          }
          // No 'required' — lets Gemini respond without failing when token-constrained
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from Gemini");

    const flat = JSON.parse(resultText);

    const mapped: Partial<AnalysisResult> = {
      confidence: flat.confidence ?? 50,
      tone: flat.tone ?? 'Neutral',
      behavior: flat.behavior ?? 'Observational',
      decisionQuality: flat.decisionQuality ?? 'Uncertain',
      sentiment: flat.sentiment ?? 'Neutral',
      realityScore: flat.realityScore ?? 50,
      coreState: {
        emotionalState: flat.emotionalState ?? 'Unknown',
        mentalEnergy: flat.mentalEnergy ?? 'Medium',
        focusLevel: flat.focusLevel ?? 50,
        disciplineLevel: flat.disciplineLevel ?? 50,
        explanation: flat.coreExplanation ?? '',
      },
      realityScores: {
        disciplineScore: flat.disciplineScore ?? 50,
        focusScore: flat.focusScore ?? 50,
        consistencyScore: flat.consistencyScore ?? 50,
        mentalStabilityScore: flat.mentalStabilityScore ?? 50,
        explanation: flat.scoresExplanation ?? '',
      },
      triggerDetection: flat.trigger ? {
        trigger: flat.trigger,
        explanation: flat.triggerExplanation ?? '',
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

    return mapped;
  } catch (error: any) {
    console.error("Gemini Analysis Failed:", error);
    // Provide a descriptive error message to the user
    if (error?.message?.includes('token')) {
      throw new Error("AI response was too long. Please write a shorter log entry and try again.");
    }
    throw new Error(error?.message || "AI analysis failed. Check your API key or try again.");
  }
}
