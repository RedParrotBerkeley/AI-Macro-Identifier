import type { AnalysisResult } from "@/lib/types";

export const demoAnalysis: AnalysisResult = {
  summary: "Estimated macros for a grilled chicken rice bowl with avocado and mixed vegetables.",
  confidence: "medium",
  notes: [
    "Single-photo estimates are directionally useful, not lab-grade.",
    "Portion size is the main error source, especially for rice, oils, and sauces.",
    "Best practice is to let the user quickly confirm or adjust the detected foods before logging.",
  ],
  followUpQuestions: [
    "Was the chicken grilled plainly, or was there extra oil or sauce?",
    "Was the rice portion closer to 1 cup or more like 1.5 to 2 cups?",
  ],
  foods: [
    {
      name: "Grilled chicken breast",
      confidence: 0.93,
      confidenceLabel: "high",
      portionDescription: "about 5 oz cooked",
      estimatedWeightGrams: 142,
      estimatedWeightRangeGrams: {
        min: 120,
        max: 165,
      },
      portionConfidence: 0.76,
      portionConfidenceLabel: "medium",
      ambiguityNotes: [
        "Oil used during cooking is not fully visible in a single image.",
      ],
      followUpQuestions: ["Was the chicken cooked with oil, butter, or sauce?"],
      dataSource: "estimated",
      macros: {
        calories: 234,
        proteinGrams: 44,
        carbsGrams: 0,
        fatGrams: 5,
      },
    },
    {
      name: "Cooked white rice",
      confidence: 0.89,
      confidenceLabel: "high",
      portionDescription: "about 1 cup",
      estimatedWeightGrams: 158,
      estimatedWeightRangeGrams: {
        min: 130,
        max: 220,
      },
      portionConfidence: 0.61,
      portionConfidenceLabel: "medium",
      ambiguityNotes: [
        "Rice volume is visually hard to estimate from a single angle.",
      ],
      followUpQuestions: ["Was the rice serving closer to 1 cup or 1.5 cups?"],
      dataSource: "estimated",
      macros: {
        calories: 205,
        proteinGrams: 4,
        carbsGrams: 45,
        fatGrams: 0,
      },
    },
    {
      name: "Avocado",
      confidence: 0.84,
      confidenceLabel: "medium",
      portionDescription: "about 1/3 medium avocado",
      estimatedWeightGrams: 50,
      estimatedWeightRangeGrams: {
        min: 35,
        max: 70,
      },
      portionConfidence: 0.64,
      portionConfidenceLabel: "medium",
      ambiguityNotes: [
        "Slices partially overlap, which makes exact count uncertain.",
      ],
      followUpQuestions: [],
      dataSource: "estimated",
      macros: {
        calories: 80,
        proteinGrams: 1,
        carbsGrams: 4,
        fatGrams: 7,
      },
    },
    {
      name: "Mixed vegetables",
      confidence: 0.8,
      confidenceLabel: "medium",
      portionDescription: "about 3/4 cup",
      estimatedWeightGrams: 90,
      estimatedWeightRangeGrams: {
        min: 70,
        max: 120,
      },
      portionConfidence: 0.58,
      portionConfidenceLabel: "low",
      ambiguityNotes: [
        "The mix may include vegetables with different calorie densities.",
        "Added butter or sauce is not clearly visible.",
      ],
      followUpQuestions: ["Were the vegetables plain steamed, or were they cooked with butter or oil?"],
      dataSource: "estimated",
      macros: {
        calories: 45,
        proteinGrams: 2,
        carbsGrams: 9,
        fatGrams: 0,
      },
    },
  ],
};

export function getTotals(result: AnalysisResult) {
  return result.foods.reduce(
    (totals, food) => ({
      calories: totals.calories + food.macros.calories,
      proteinGrams: totals.proteinGrams + food.macros.proteinGrams,
      carbsGrams: totals.carbsGrams + food.macros.carbsGrams,
      fatGrams: totals.fatGrams + food.macros.fatGrams,
    }),
    {
      calories: 0,
      proteinGrams: 0,
      carbsGrams: 0,
      fatGrams: 0,
    }
  );
}
