export interface AnalysisResult {
  id: string;
  uid: string;
  timestamp: string;
  input: string;

  // Standard fields
  realityScore?: number;
  confidence?: number;
  tone?: string;
  behavior?: string;
  decisionQuality?: string;
  sentiment?: string;

  // 1. CORE STATE ANALYSIS
  coreState?: {
    emotionalState: string;
    mentalEnergy: string;       // Low | Medium | High
    focusLevel: number;         // 0-100
    disciplineLevel: number;    // 0-100
    explanation: string;
  };

  // 2. LIFE SCORE SYSTEM
  realityScores?: {
    lifeControlScore: number;
    disciplineScore: number;
    focusScore: number;
    consistencyScore: number;
    mentalStabilityScore: number;
    explanation: string;
  };

  // 3. EXECUTION GAP ANALYSIS
  executionGap?: {
    plannedEffort: string;
    actualExecution: string;
    gapPercent: number;       // 0-100 (0 = perfect, 100 = nothing done)
    mainIssue: string;
  };

  // 4. TRIGGER DETECTION ENGINE
  triggerDetection?: {
    trigger: string;
    explanation: string;
  };

  // 5. BEHAVIOR TIMELINE ANALYSIS
  timelineAnalysis?: string;

  // 6. PERSONALITY PROFILE
  personalityProfile?: string[];

  // 7. BEHAVIOR PATTERN (DEEP)
  behaviorPattern?: string;

  // 8. FUTURE PREDICTION ENGINE
  futurePrediction?: string;

  // 9. BURNOUT DETECTOR
  burnoutRisk?: 'Low' | 'Medium' | 'High';
  burnoutExplanation?: string;

  // 10. DOPAMINE LOOP DETECTION
  dopamineLoop?: boolean;
  dopamineLoopExplanation?: string;

  // 11. RECOVERY PROTOCOL
  recoveryProtocol?: string[];

  // 12. NEXT DAY ACTION PLAN
  actionPlan?: string[];

  // 13. GOAL ALIGNMENT CHECK
  goalAlignment?: string;

  // 14. MICRO-WIN DETECTION
  microWins?: string[];

  // 15. AI COACH MESSAGE
  aiCoachMessage?: string;

  // 16. REALITY CHECK (BRUTAL MODE)
  brutalRealityCheck?: string;

  // 17. DEEP SCAN ANALYSIS (ADVANCED)
  deepScan?: {
    lieDetection?: {
      claimed: string;
      actual: string;
      excuse: string;
      truth: string;
    };
    timeWaste?: {
      productiveTime: string;
      wastedTime: string;
      dailyLoss: string;
      monthlyLoss: string;
      yearlyLoss: string;
    };
    decisionTree?: {
      decisions: { activity: string; quality: 'Good' | 'Bad' }[];
      rootCause: string;
    };
    relapseDetection?: {
      daysImproved: number;
      relapseDescription: string;
    };
    focusDecay?: {
      start: number;
      middle: number;
      end: number;
      insight: string;
    };
    selfControl?: {
      score: number;
      explanation: string;
    };
    procrastinationCost?: {
      daily: string;
      weekly: string;
      monthly: string;
      yearly: string;
      finalLine: string;
    };
    failureLoop?: {
      behavior: string;
      frequencyDays: number;
    };
    alterEgo?: {
      currentSelf: string;
      idealSelf: string;
      gap: string;
      finalStatement: string;
    };
    microTask?: string;
  };

  // 18. REALITY MIRROR ENGINE (NEW)
  bestVersionToday?: string;
  realityGapScore?: number;
  brutalTruth?: string;
  futureIfContinued?: string;
  tomorrowFixPlan?: string[];
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: string;
  longTermGoal?: string;
}

export interface DailyReport {
  date: string;
  averageConfidence: number;
  dominantTone: string;
  decisionScore: number;
  summary: string;
}
