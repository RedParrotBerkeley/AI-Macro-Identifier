import { z } from "zod";

export const macroEstimateSchema = z.object({
  calories: z.number().finite().nonnegative(),
  proteinGrams: z.number().finite().nonnegative(),
  carbsGrams: z.number().finite().nonnegative(),
  fatGrams: z.number().finite().nonnegative(),
});

export const confidenceLevelSchema = z.enum(["low", "medium", "high"]);

export const foodCandidateSchema = z.object({
  name: z.string().min(1),
  confidence: z.number().min(0).max(1),
  confidenceLabel: confidenceLevelSchema,
  portionDescription: z.string().min(1),
  estimatedWeightGrams: z.number().finite().nonnegative(),
  estimatedWeightRangeGrams: z
    .object({
      min: z.number().finite().nonnegative(),
      max: z.number().finite().nonnegative(),
    })
    .optional(),
  portionConfidence: z.number().min(0).max(1),
  portionConfidenceLabel: confidenceLevelSchema,
  ambiguityNotes: z.array(z.string()),
  followUpQuestions: z.array(z.string()),
  macros: macroEstimateSchema,
  dataSource: z.enum(["estimated", "usda"]),
});

export const analysisResultSchema = z.object({
  summary: z.string().min(1),
  confidence: confidenceLevelSchema,
  notes: z.array(z.string()),
  followUpQuestions: z.array(z.string()),
  foods: z.array(foodCandidateSchema).min(1),
});

export type AnalysisResultSchema = z.infer<typeof analysisResultSchema>;
