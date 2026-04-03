export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: string;
}

export interface AnalysisResult {
  id: string;
  uid: string;
  timestamp: string;
  input: string;
  confidence: number; // 0-100
  tone: 'Assertive' | 'Passive' | 'Aggressive' | 'Neutral';
  behavior: string;
  decisionQuality: 'Correct' | 'Incorrect' | 'Uncertain';
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  thinkingPattern?: string;
  improvementAreas?: string;
  strengths?: string[];
  weaknesses?: string[];
  decisionDetails?: string;
  stepByStepGuide?: string[];
  suggestions: string[];
}

export interface DailyReport {
  date: string;
  averageConfidence: number;
  dominantTone: string;
  decisionScore: number; // Percentage of correct decisions
  summary: string;
}
