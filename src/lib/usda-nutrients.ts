import type { MacroEstimate } from "@/lib/types";

type RawNutrient = {
  nutrientNumber?: string;
  nutrient?: {
    number?: string;
    name?: string;
    unitName?: string;
  };
  nutrientName?: string;
  unitName?: string;
  value?: number;
  amount?: number;
};

function readNutrientValue(nutrient: RawNutrient) {
  return nutrient.value ?? nutrient.amount ?? 0;
}

function readNutrientNumber(nutrient: RawNutrient) {
  return nutrient.nutrientNumber ?? nutrient.nutrient?.number ?? "";
}

function findNutrient(nutrients: RawNutrient[], nutrientNumbers: string[]) {
  return nutrients.find((nutrient) => nutrientNumbers.includes(readNutrientNumber(nutrient)));
}

export function extractMacrosFromUsdaNutrients(nutrients: RawNutrient[]): MacroEstimate {
  const calories = readNutrientValue(findNutrient(nutrients, ["1008", "208"]) || {});
  const proteinGrams = readNutrientValue(findNutrient(nutrients, ["1003", "203"]) || {});
  const fatGrams = readNutrientValue(findNutrient(nutrients, ["1004", "204"]) || {});
  const carbsGrams = readNutrientValue(findNutrient(nutrients, ["1005", "205"]) || {});

  return {
    calories: Math.round(calories),
    proteinGrams: Math.round(proteinGrams * 10) / 10,
    carbsGrams: Math.round(carbsGrams * 10) / 10,
    fatGrams: Math.round(fatGrams * 10) / 10,
  };
}
