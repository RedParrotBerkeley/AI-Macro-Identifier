import type { AnalysisResult } from "@/lib/types";

export type SavedMeal = {
  id: string;
  createdAt: string;
  imageName: string;
  analysis: AnalysisResult;
};

export type CorrectionEvent = {
  id: string;
  createdAt: string;
  originalFoodName: string;
  updatedFoodName: string;
  action: "replace" | "remove" | "add" | "portion_change";
  mealName?: string;
  summary?: string;
};

const SAVED_MEALS_KEY = "ai-macro-identifier.saved-meals";
const CORRECTIONS_KEY = "ai-macro-identifier.corrections";

export function loadSavedMeals(): SavedMeal[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(SAVED_MEALS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedMeal[];
  } catch {
    return [];
  }
}

export function saveMeal(entry: SavedMeal) {
  if (typeof window === "undefined") return;

  const current = loadSavedMeals();
  const next = [entry, ...current].slice(0, 50);
  window.localStorage.setItem(SAVED_MEALS_KEY, JSON.stringify(next));
}

export function deleteMeal(id: string) {
  if (typeof window === "undefined") return;
  const current = loadSavedMeals().filter((meal) => meal.id !== id);
  window.localStorage.setItem(SAVED_MEALS_KEY, JSON.stringify(current));
}

export function loadCorrections(): CorrectionEvent[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(CORRECTIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CorrectionEvent[];
  } catch {
    return [];
  }
}

export function saveCorrection(event: CorrectionEvent) {
  if (typeof window === "undefined") return;

  const current = loadCorrections();
  const next = [event, ...current].slice(0, 200);
  window.localStorage.setItem(CORRECTIONS_KEY, JSON.stringify(next));
}


export function clearCorrections() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CORRECTIONS_KEY);
}
