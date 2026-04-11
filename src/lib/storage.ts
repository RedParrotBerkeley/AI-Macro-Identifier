import type { AnalysisResult } from "@/lib/types";

export type SavedMeal = {
  id: string;
  createdAt: string;
  imageName: string;
  analysis: AnalysisResult;
};

const STORAGE_KEY = "ai-macro-identifier.saved-meals";

export function loadSavedMeals(): SavedMeal[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedMeal[];
  } catch {
    return [];
  }
}

export function saveMeal(entry: SavedMeal) {
  if (typeof window === "undefined") return;

  const current = loadSavedMeals();
  const next = [entry, ...current].slice(0, 20);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
