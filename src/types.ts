export interface AnalysisResult {
  id: string;
  uid: string;
  timestamp: string;
  input: string;
  
  // 1. CORE STATE ANALYSIS
  coreState?: {
    emotionalState: string;
    mentalEnergy: string;
    focusLevel: number;
    disciplineLevel: number;
    explanation: string;
  };

  // 2. REALITY SCORE BREAKDOWN
  realityScores?: {
    disciplineScore: number;
    focusScore: number;
    consistencyScore: number;
    mentalStabilityScore: number;
    explanation: string;
  };
  
  // Legacy calculated overall Reality Score mapped for grid
  realityScore?: number; 
  confidence?: number;
  tone?: string;
  behavior?: string;
  decisionQuality?: 'Correct' | 'Incorrect' | 'Uncertain';
  sentiment?: string;

  // 3. TRIGGER DETECTION
  triggerDetection?: {
    trigger: string;
    explanation: string;
  };

  // 4. BEHAVIOR TIMELINE ANALYSIS
  timelineAnalysis?: string;

  // 5. PERSONALITY PROFILE
  personalityProfile?: string[];

  // 6. BEHAVIOR PATTERN
  behaviorPattern?: string;

  // 7. PREDICTION ENGINE
  futurePrediction?: string;

  // 8. RECOVERY PROTOCOL
  recoveryProtocol?: string[];

  // 9. NEXT DAY ACTION PLAN
  actionPlan?: string[];

  // 10. GOAL ALIGNMENT CHECK
  goalAlignment?: string;

  // 11. AI COACH MESSAGE
  aiCoachMessage?: string;

  // 12. REALITY CHECK (BRUTAL MODE)
  brutalRealityCheck?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: string;
  longTermGoal?: string; // Newly added user goal
}

export interface DailyReport {
  date: string;
  averageConfidence: number;
  dominantTone: string;
  decisionScore: number; // Percentage of correct decisions
  summary: string;
}
