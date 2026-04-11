import type { AnalysisResult, FoodCandidate } from "@/lib/types";
import { extractMacrosFromUsdaNutrients } from "@/lib/usda-nutrients";
import { getUsdaFoodDetails, searchUsdaFoods, type UsdaSearchFood } from "@/lib/usda";

const DATA_TYPE_PRIORITY: Record<string, number> = {
  Foundation: 4,
  "Survey (FNDDS)": 3,
  Branded: 2,
};

export type GroundingResult = {
  analysis: AnalysisResult;
  groundedFoods: Array<{
    originalName: string;
    matchedFood?: UsdaSearchFood;
    grounded: boolean;
  }>;
};

export async function groundAnalysisWithUsda(analysis: AnalysisResult): Promise<GroundingResult> {
  const groundedFoods = await Promise.all(
    analysis.foods.map(async (food) => {
      try {
        const searchResults = await searchUsdaFoods(food.name);
        const matchedFood = rankUsdaCandidates(food, searchResults)[0];

        if (!matchedFood) {
          return {
            food,
            grounded: false,
            originalName: food.name,
          };
        }

        const details = await getUsdaFoodDetails(matchedFood.fdcId);
        const macrosPer100g = extractMacrosFromUsdaNutrients(details.foodNutrients || []);
        const scaledMacros = scaleMacrosByWeight(macrosPer100g, food.estimatedWeightGrams);

        return {
          food: {
            ...food,
            name: details.description || food.name,
            dataSource: "usda" as const,
            macros: scaledMacros,
            ambiguityNotes: dedupe([
              ...food.ambiguityNotes,
              `Grounded against USDA ${matchedFood.dataType || "food"} record ${matchedFood.fdcId}.`,
            ]),
          },
          matchedFood,
          grounded: true,
          originalName: food.name,
        };
      } catch {
        return {
          food,
          grounded: false,
          originalName: food.name,
        };
      }
    })
  );

  return {
    analysis: {
      ...analysis,
      foods: groundedFoods.map((entry) => entry.food),
      notes: dedupe([
        ...analysis.notes,
        "When USDA matches are available, macro estimates can be grounded to public nutrient records rather than model guesses.",
      ]),
    },
    groundedFoods: groundedFoods.map(({ originalName, matchedFood, grounded }) => ({
      originalName,
      matchedFood,
      grounded,
    })),
  };
}

export function rankUsdaCandidates(food: FoodCandidate, candidates: UsdaSearchFood[]) {
  return [...candidates].sort((left, right) => scoreCandidate(food, right) - scoreCandidate(food, left));
}

function scoreCandidate(food: FoodCandidate, candidate: UsdaSearchFood) {
  const foodName = food.name.toLowerCase();
  const description = candidate.description.toLowerCase();
  const exactNameBonus = description.includes(foodName) ? 30 : 0;
  const partialBonus = sharedWordCount(foodName, description) * 5;
  const scoreBonus = candidate.score ?? 0;
  const dataTypeBonus = DATA_TYPE_PRIORITY[candidate.dataType || ""] ?? 0;

  return exactNameBonus + partialBonus + scoreBonus + dataTypeBonus;
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

function dedupe(values: string[]) {
  return Array.from(new Set(values));
}
