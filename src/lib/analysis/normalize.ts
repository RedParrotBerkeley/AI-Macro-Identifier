import type { AnalysisResult } from "@/lib/types";

import { analysisResultSchema } from "@/lib/analysis/schema";

export function normalizeAnalysisResult(input: unknown): AnalysisResult {
  const parsed = analysisResultSchema.parse(input);

  return {
    ...parsed,
    foods: parsed.foods.map((food) => ({
      ...food,
      ambiguityNotes: dedupeStrings(food.ambiguityNotes),
      followUpQuestions: dedupeStrings(food.followUpQuestions),
    })),
    notes: dedupeStrings(parsed.notes),
    followUpQuestions: dedupeStrings(parsed.followUpQuestions),
  };
}

function dedupeStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}
