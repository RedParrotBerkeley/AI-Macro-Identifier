export type MacroEstimate = {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
};

export type ConfidenceLevel = "low" | "medium" | "high";

export type GroundingStatus = {
  originalName: string;
  grounded: boolean;
  matchedDescription?: string;
  matchedDataType?: string;
  matchedFdcId?: number;
  reason?: string;
};

export type FoodCandidate = {
  name: string;
  confidence: number;
  confidenceLabel: ConfidenceLevel;
  portionDescription: string;
  estimatedWeightGrams: number;
  estimatedWeightRangeGrams?: {
    min: number;
    max: number;
  };
  portionConfidence: number;
  portionConfidenceLabel: ConfidenceLevel;
  ambiguityNotes: string[];
  followUpQuestions: string[];
  macros: MacroEstimate;
  dataSource: "estimated" | "usda";
};

export type AnalysisResult = {
  summary: string;
  confidence: ConfidenceLevel;
  notes: string[];
  followUpQuestions: string[];
  foods: FoodCandidate[];
};
