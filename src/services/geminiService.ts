import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeRealityWithGemini(text: string): Promise<Partial<AnalysisResult>> {
  const model = "gemini-3-flash-preview";
    const prompt = `
    Analyze the following reality entry and provide a behavioral report in JSON format.
    Entry: "${text}"
    
    The JSON should include:
    - confidence: (number 0-100) representing the user's self-assurance in the text.
    - tone: (string: 'Assertive', 'Passive', 'Aggressive', or 'Neutral')
    - behavior: (string) a short description of the detected behavior pattern.
    - decisionQuality: (string: 'Correct', 'Incorrect', or 'Uncertain') based on the logic/consequences described.
    - decisionDetails: (string) specific details about why the decision was correct or incorrect (e.g., "solved 2 DSA problems", "went to gym", "watched 4 hr movie").
    - strengths: (array of strings) 2-3 strengths identified from this entry.
    - weaknesses: (array of strings) 2-3 weaknesses identified from this entry.
    - sentiment: (string: 'Positive', 'Neutral', or 'Negative')
    - thinkingPattern: (string) analysis of the user's thought process (e.g., analytical, impulsive, reflective).
    - improvementAreas: (string) specific areas where the user could improve their approach or mindset.
    - stepByStepGuide: (array of strings) a detailed, 3-5 step guide on how to improve in this specific context.
    - suggestions: (array of strings) 2-3 general actionable suggestions.
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
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["confidence", "tone", "behavior", "decisionQuality", "decisionDetails", "strengths", "weaknesses", "sentiment", "thinkingPattern", "improvementAreas", "stepByStepGuide", "suggestions"]
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
