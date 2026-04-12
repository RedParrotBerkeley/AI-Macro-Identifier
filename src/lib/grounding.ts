import type { AnalysisResult, FoodCandidate } from "@/lib/types";
import { extractMacrosFromUsdaNutrients } from "@/lib/usda-nutrients";
import { getUsdaFoodDetails, searchUsdaFoods, type UsdaSearchFood } from "@/lib/usda";

const DATA_TYPE_PRIORITY: Record<string, number> = {
  Foundation: 4,
  "Survey (FNDDS)": 3,
  Branded: 1,
};

const FOOD_SYNONYMS: Array<[RegExp, string]> = [
  [/\bgrilled chicken breast\b/g, "chicken breast"],
  [/\bcooked white rice\b/g, "white rice"],
  [/\bmixed vegetables\b/g, "vegetables"],
  [/\bplain steamed vegetables\b/g, "vegetables"],
  [/\bcaesar salad\b/g, "salad"],
  [/\bburrito bowl\b/g, "rice bowl"],
  [/\bpasta with sauce\b/g, "pasta"],
];

const MIXED_DISH_HINTS = ["salad", "bowl", "sandwich", "burger", "pizza", "pasta", "stir fry", "taco"];

export type GroundingResult = {
  analysis: AnalysisResult;
  groundedFoods: Array<{
    originalName: string;
    matchedFood?: UsdaSearchFood;
    grounded: boolean;
    reason?: string;
  }>;
};

export async function groundAnalysisWithUsda(analysis: AnalysisResult): Promise<GroundingResult> {
  const groundedFoods = await Promise.all(
    analysis.foods.map(async (food) => {
      try {
        const normalizedFood = normalizeFoodName(food.name);
        const searchResults = await searchUsdaFoods(normalizedFood);
        const rankedCandidates = rankUsdaCandidates({ ...food, name: normalizedFood }, searchResults);
        const matchedFood = rankedCandidates[0];

        if (!matchedFood) {
          return {
            food: {
              ...food,
              ambiguityNotes: dedupe([
                ...food.ambiguityNotes,
                "USDA grounding did not find a confident database match.",
              ]),
            },
            grounded: false,
            originalName: food.name,
            reason: "No USDA candidate found",
          };
        }

        const details = await getUsdaFoodDetails(matchedFood.fdcId);
        const macrosPer100g = extractMacrosFromUsdaNutrients(details.foodNutrients || []);
        const scaledMacros = scaleMacrosByWeight(macrosPer100g, food.estimatedWeightGrams);
        const mixedDish = isMixedDish(food.name);

        return {
          food: {
            ...food,
            name: details.description || food.name,
            dataSource: "usda" as const,
            macros: scaledMacros,
            ambiguityNotes: dedupe([
              ...food.ambiguityNotes,
              `Grounded against USDA ${matchedFood.dataType || "food"} record ${matchedFood.fdcId}.`,
              mixedDish
                ? "This looks like a mixed dish, so the USDA match is helpful but still approximate."
                : "",
            ]),
            followUpQuestions: dedupe([
              ...food.followUpQuestions,
              mixedDish ? "Was this a custom mixed dish with added sauces or oils?" : "",
            ]),
          },
          matchedFood,
          grounded: true,
          originalName: food.name,
          reason: mixedDish ? "Mixed dish grounded with caution" : "Matched USDA candidate",
        };
      } catch {
        return {
          food: {
            ...food,
            ambiguityNotes: dedupe([
              ...food.ambiguityNotes,
              "USDA grounding failed during lookup, so this item remains estimated.",
            ]),
          },
          grounded: false,
          originalName: food.name,
          reason: "USDA lookup failed",
        };
      }
    })
  );

  const groundedCount = groundedFoods.filter((entry) => entry.grounded).length;

  return {
    analysis: {
      ...analysis,
      foods: groundedFoods.map((entry) => entry.food),
      notes: dedupe([
        ...analysis.notes,
        groundedCount
          ? "When USDA matches are available, macro estimates can be grounded to public nutrient records rather than model guesses."
          : "This result is still estimate-heavy because USDA grounding did not find strong matches.",
      ]),
    },
    groundedFoods: groundedFoods.map(({ originalName, matchedFood, grounded, reason }) => ({
      originalName,
      matchedFood,
      grounded,
      reason,
    })),
  };
}

export function rankUsdaCandidates(food: FoodCandidate, candidates: UsdaSearchFood[]) {
  return [...candidates].sort((left, right) => scoreCandidate(food, right) - scoreCandidate(food, left));
}

function scoreCandidate(food: FoodCandidate, candidate: UsdaSearchFood) {
  const foodName = normalizeFoodName(food.name);
  const description = candidate.description.toLowerCase();
  const exactNameBonus = description.includes(foodName) ? 30 : 0;
  const partialBonus = sharedWordCount(foodName, description) * 5;
  const scoreBonus = candidate.score ?? 0;
  const dataTypeBonus = DATA_TYPE_PRIORITY[candidate.dataType || ""] ?? 0;
  const brandedPenalty = candidate.dataType === "Branded" && isGenericFood(foodName) ? 8 : 0;
  const mixedDishPenalty = isMixedDish(foodName) && candidate.dataType === "Branded" ? 4 : 0;

  return exactNameBonus + partialBonus + scoreBonus + dataTypeBonus - brandedPenalty - mixedDishPenalty;
}

function sharedWordCount(left: string, right: string) {
  const leftWords = new Set(left.split(/\s+/).filter(Boolean));
  const rightWords = new Set(right.split(/\s+/).filter(Boolean));
  let count = 0;

  for (const word of leftWords) {
    if (rightWords.has(word)) count += 1;
  }

  return count;
}

function scaleMacrosByWeight(macrosPer100g: FoodCandidate["macros"], weightGrams: number) {
  const factor = weightGrams / 100;

  return {
    calories: Math.round(macrosPer100g.calories * factor),
    proteinGrams: Math.round(macrosPer100g.proteinGrams * factor * 10) / 10,
    carbsGrams: Math.round(macrosPer100g.carbsGrams * factor * 10) / 10,
    fatGrams: Math.round(macrosPer100g.fatGrams * factor * 10) / 10,
  };
}

function normalizeFoodName(name: string) {
  let normalized = name.trim().toLowerCase();

  for (const [pattern, replacement] of FOOD_SYNONYMS) {
    normalized = normalized.replace(pattern, replacement);
  }

  return normalized;
}

function isGenericFood(name: string) {
  return ["chicken", "chicken breast", "rice", "white rice", "vegetables", "avocado"].includes(name);
}

function isMixedDish(name: string) {
  return MIXED_DISH_HINTS.some((hint) => name.includes(hint));
}

function dedupe(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
