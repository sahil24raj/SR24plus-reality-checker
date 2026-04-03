import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeRealityWithGemini(text: string): Promise<Partial<AnalysisResult>> {
  const model = "gemini-3-flash-preview";
    const prompt = `
    Analyze the following reality entry and provide a highly personalized, emotionally intelligent behavioral report in JSON format.
    Entry: "${text}"
    
    The JSON should include:
    - confidence: (number 0-100) representing the user's self-assurance.
    - tone: (string: 'Assertive', 'Passive', 'Aggressive', or 'Neutral')
    - behavior: (string) a short description of the detected behavior pattern.
    - decisionQuality: (string: 'Correct', 'Incorrect', or 'Uncertain') based on the logic/consequences described.
    - decisionDetails: (string) specific details about why the decision was correct or incorrect.
    - strengths: (array of exactly 2 strings) EXACTLY 2 strengths identified from this entry. You MUST provide 2.
    - weaknesses: (array of exactly 2 strings) EXACTLY 2 weaknesses or areas of vulnerability. You MUST provide 2.
    - sentiment: (string: 'Positive', 'Neutral', or 'Negative')
    - thinkingPattern: (string) deep analysis of the user's thought process.
    - improvementAreas: (string) specific areas for mindset improvement.
    - stepByStepGuide: (array of strings) a detailed, 3-5 step guide on how to improve.
    - suggestions: (array of strings) 2-3 actionable suggestions.
    
    New Advanced Features:
    - aiCoachMessage: (string) A direct, highly personalized coaching message addressing the user directly (e.g. "You showed strong focus early but lost momentum. Let's fix consistency.").
    - emotionalFeedback: (string) An empathetic observation of their emotional state (e.g. "Looks like today was mentally exhausting. You handled it well despite frustration.").
    - disciplineScore: (number 0-100) Measure of task discipline.
    - focusScore: (number 0-100) Measure of focus and concentration.
    - mentalClarityScore: (number 0-100) Measure of mental state clarity.
    - realityScore: (number 0-100) The overall weighted average of discipline, focus, and clarity.
    - patternDetected: (string) A sharply observed behavioral pattern (e.g. "You tend to procrastinate mostly after 2 PM daily.").
    - futurePrediction: (string) A realistic prediction based on this pattern (e.g. "If you continue this pattern, your productivity will drop by evening.").
    - aiCoachPlan: (array of strings) 2-3 specific, strict tasks for tomorrow to break bad patterns.
  `;

  try {
    const response = await genAI.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            confidence: { type: Type.NUMBER },
            tone: { type: Type.STRING },
            behavior: { type: Type.STRING },
            decisionQuality: { type: Type.STRING },
            decisionDetails: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            sentiment: { type: Type.STRING },
            thinkingPattern: { type: Type.STRING },
            improvementAreas: { type: Type.STRING },
            stepByStepGuide: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            aiCoachMessage: { type: Type.STRING },
            emotionalFeedback: { type: Type.STRING },
            disciplineScore: { type: Type.NUMBER },
            focusScore: { type: Type.NUMBER },
            mentalClarityScore: { type: Type.NUMBER },
            realityScore: { type: Type.NUMBER },
            patternDetected: { type: Type.STRING },
            futurePrediction: { type: Type.STRING },
            aiCoachPlan: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: [
            "confidence", "tone", "behavior", "decisionQuality", "decisionDetails", 
            "strengths", "weaknesses", "sentiment", "thinkingPattern", "improvementAreas", 
            "stepByStepGuide", "suggestions", "aiCoachMessage", "emotionalFeedback",
            "disciplineScore", "focusScore", "mentalClarityScore", "realityScore",
            "patternDetected", "futurePrediction", "aiCoachPlan"
          ]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from Gemini");
    
    const parsed = JSON.parse(resultText);
    return parsed;
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
}
