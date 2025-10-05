export type JudgePersonality = 'VC Chad' | 'Philosopher AI' | 'TrollBot69' | 'Modern Dadu' | 'Outdated GenZ' | 'Cosmic Coder' | 'Hype Beast';
export type GlitchedJudgePersonality = 'Broken Judge';

export type JudgeIcon = 'VcChadIcon' | 'PhilosopherAiIcon' | 'TrollBot69Icon' | 'ModernDaduIcon' | 'OutdatedGenzIcon' | 'BrokenJudgeIcon' | 'CosmicCoderIcon' | 'HypeBeastIcon';

export type JudgeVoice = {
    name: string;
}

export type Judge = {
  id: string;
  name: string;
  personality: JudgePersonality | GlitchedJudgePersonality;
  avatar: JudgeIcon;
  modelPath: string;
  modelVariation?: {
    scale?: number;
    rotation?: [number, number, number];
    color?: string;
    position?: [number, number, number];
  };
  rarity: 'common' | 'rare' | 'glitch';
  description: string;
  voice: JudgeVoice;
};

export type Sentiment = 'positive' | 'negative' | 'neutral' | 'very positive' | 'slightly positive' | 'very negative' | 'slightly negative' | string;

export type JudgeFeedbackResponse = {
  judge: Judge;
  response: string;
  sentiment: Sentiment;
  isGlitched: boolean;
  reversedSpeech: boolean;
  audioDataUri: string | null;
};

export type ScoreCategory = 'Originality' | 'Viability' | 'Clarity';

export type Grade = 'A' | 'B' | 'C' | 'J';

export type Score = {
    category: ScoreCategory;
    score: number;
    grade: Grade;
    reasoning: string;
};

export type ReportCardData = {
  pitchId: string;
  overallRoastLevel: number;
  feedbackSummary: string;
  scores: Score[];
  leaderboardName?: string;
};


export type AppState = 'idle' | 'judge-selected' | 'recording' | 'processing' | 'feedback' | 'report-card' | 'error';