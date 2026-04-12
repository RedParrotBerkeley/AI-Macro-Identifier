"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  deleteMeal,
  loadCorrections,
  loadSavedMeals,
  saveCorrection,
  saveMeal,
  type CorrectionEvent,
  type SavedMeal,
} from "@/lib/storage";
import type { AnalysisResult, FoodCandidate, GroundingStatus } from "@/lib/types";

type AnalyzeApiResponse = AnalysisResult & {
  status: "ok";
  pipelineStage: string;
  imageProvided: boolean;
  provider: string;
  grounding: GroundingStatus[];
};

type UiPipelineStage = string | "saved-analysis";

type AnalyzeErrorResponse = {
  status: "error";
  code: string;
  message: string;
  provider?: string;
  pipelineStage?: string;
};

const manualReplacementOptions = [
  "Chicken breast, roasted",
  "Rice, white, cooked",
  "Avocados, raw",
  "Vegetables, mixed, cooked",
  "Salad greens, mixed",
  "Salmon, cooked",
  "Eggs, whole, cooked",
];

const blankFood: FoodCandidate = {
  name: "Custom food",
  confidence: 0.5,
  confidenceLabel: "low",
  portionDescription: "manual entry",
  estimatedWeightGrams: 100,
  estimatedWeightRangeGrams: { min: 80, max: 120 },
  portionConfidence: 0.5,
  portionConfidenceLabel: "low",
  ambiguityNotes: ["Added manually by the user."],
  followUpQuestions: [],
  macros: {
    calories: 100,
    proteinGrams: 5,
    carbsGrams: 10,
    fatGrams: 3,
  },
  dataSource: "estimated",
};

export function AnalysisWorkbench({ initialAnalysis }: { initialAnalysis: AnalysisResult }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [analysis, setAnalysis] = useState<AnalysisResult>(initialAnalysis);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);
  const [portionMultipliers, setPortionMultipliers] = useState<Record<string, number>>({});
  const [providerName, setProviderName] = useState<string>("mock-analysis-provider");
  const [pipelineStage, setPipelineStage] = useState<UiPipelineStage>("mocked-analysis");
  const [grounding, setGrounding] = useState<GroundingStatus[]>([]);
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>([]);
  const [corrections, setCorrections] = useState<CorrectionEvent[]>([]);
  const [saveMessage, setSaveMessage] = useState<string>("");

  useEffect(() => {
    setSavedMeals(loadSavedMeals());
    setCorrections(loadCorrections());
  }, []);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const totals = useMemo(() => {
    return analysis.foods.reduce(
      (acc, food) => {
        const multiplier = portionMultipliers[food.name] ?? 1;
        return {
          calories: acc.calories + Math.round(food.macros.calories * multiplier),
          proteinGrams: acc.proteinGrams + Math.round(food.macros.proteinGrams * multiplier),
          carbsGrams: acc.carbsGrams + Math.round(food.macros.carbsGrams * multiplier),
          fatGrams: acc.fatGrams + Math.round(food.macros.fatGrams * multiplier),
        };
      },
      { calories: 0, proteinGrams: 0, carbsGrams: 0, fatGrams: 0 }
    );
  }, [analysis, portionMultipliers]);

  function recordCorrection(event: Omit<CorrectionEvent, "id" | "createdAt">) {
    const fullEvent: CorrectionEvent = {
      ...event,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };

    saveCorrection(fullEvent);
    setCorrections(loadCorrections());
  }

  function applyFile(file: File | null) {
    if (!file || !file.type.startsWith("image/")) return;
    const nextUrl = URL.createObjectURL(file);

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    objectUrlRef.current = nextUrl;
    setPreviewUrl(nextUrl);
    setFileName(file.name);
    setError("");
  }

  async function analyzeCurrentImage() {
    if (!previewUrl) {
      setError("Upload a food photo before running analysis.");
      return;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: previewUrl,
        }),
      });

      const data = (await response.json()) as AnalyzeApiResponse | AnalyzeErrorResponse;

      if (!response.ok || data.status === "error") {
        const message =
          data.status === "error" ? data.message : `Analysis failed with status ${response.status}`;
        throw new Error(message);
      }

      setAnalysis(data);
      setProviderName(data.provider);
      setPipelineStage(data.pipelineStage);
      setGrounding(data.grounding);
      setPortionMultipliers({});
      setSaveMessage("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unknown analysis error");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function updateMultiplier(name: string, nextValue: number) {
    setSaveMessage("");
    setPortionMultipliers((current) => ({
      ...current,
      [name]: nextValue,
    }));
    recordCorrection({
      originalFoodName: name,
      updatedFoodName: name,
      action: "portion_change",
    });
  }

  function rerunAnalysis() {
    void analyzeCurrentImage();
  }

  function saveCurrentResult() {
    if (!analysis.foods.length) {
      setSaveMessage("Run an analysis before saving a result.");
      return;
    }

    const entry: SavedMeal = {
      id: `${Date.now()}`,
      createdAt: new Date().toISOString(),
      imageName: fileName || "Untitled meal",
      analysis,
    };

    saveMeal(entry);
    setSavedMeals(loadSavedMeals());
    setSaveMessage("Saved to local meal history.");
  }

  function deleteSavedMeal(id: string) {
    deleteMeal(id);
    setSavedMeals(loadSavedMeals());
    setSaveMessage("Saved meal deleted.");
  }

  function loadSavedMeal(meal: SavedMeal) {
    setAnalysis(meal.analysis);
    setFileName(meal.imageName);
    setPreviewUrl(null);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setGrounding(
      meal.analysis.foods.map((food) => ({
        originalName: food.name,
        grounded: food.dataSource === "usda",
        matchedDescription: food.dataSource === "usda" ? food.name : undefined,
      }))
    );
    setProviderName("saved-meal-history");
    setPipelineStage("saved-analysis");
    setPortionMultipliers({});
    setError("");
    setSaveMessage(`Loaded saved meal: ${meal.imageName}`);
  }

  async function copySummary() {
    const text = [
      `Meal: ${fileName || "Untitled meal"}`,
      `Calories: ${totals.calories} kcal`,
      `Protein: ${totals.proteinGrams} g`,
      `Carbs: ${totals.carbsGrams} g`,
      `Fat: ${totals.fatGrams} g`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setSaveMessage("Summary copied to clipboard.");
    } catch {
      setSaveMessage("Could not copy summary.");
    }
  }

  function replaceFoodName(originalName: string, nextName: string) {
    setAnalysis((current) => ({
      ...current,
      foods: current.foods.map((food) =>
        food.name === originalName
          ? {
              ...food,
              name: nextName,
              dataSource: "estimated",
              ambiguityNotes: Array.from(
                new Set([...food.ambiguityNotes, `Manually replaced with ${nextName}.`])
              ),
            }
          : food
      ),
    }));
    recordCorrection({
      originalFoodName: originalName,
      updatedFoodName: nextName,
      action: "replace",
    });
    setSaveMessage("Food replacement updated locally. Re-run analysis to re-ground it.");
  }

  function removeFood(name: string) {
    setAnalysis((current) => ({
      ...current,
      foods: current.foods.filter((food) => food.name !== name),
    }));
    recordCorrection({
      originalFoodName: name,
      updatedFoodName: "",
      action: "remove",
    });
    setSaveMessage(`${name} removed from this meal.`);
  }

  function addFood() {
    setAnalysis((current) => ({
      ...current,
      foods: [...current.foods, { ...blankFood, name: `Custom food ${current.foods.length + 1}` }],
    }));
    recordCorrection({
      originalFoodName: "",
      updatedFoodName: `Custom food ${analysis.foods.length + 1}`,
      action: "add",
    });
    setSaveMessage("Added a manual food item.");
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-8 text-white shadow-2xl backdrop-blur">
          <div className="mb-8 inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-200">
            AI Macro Identifier, research-driven prototype
          </div>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Turn a food photo into a macro estimate you can actually use.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            The correct product loop is photo, structured food detection, nutrient lookup,
            confidence, then a fast correction pass.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <InfoCard label="Current product stance" value="Fast estimate, then confirm" />
            <InfoCard label="Primary failure mode" value="Portion size, not food naming" />
            <InfoCard label="Best early data source" value="USDA FoodData Central" />
          </div>

          <div className="mt-8 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5 text-amber-50">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200">
              Current build logic
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-50/90">
              <li>1. Preview the image immediately after upload.</li>
              <li>2. Call a stable analysis route with structured JSON output.</li>
              <li>3. Let the user correct portions before any final logging.</li>
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
            <label
              className={`block rounded-2xl border-2 border-dashed p-4 transition ${
                dragActive
                  ? "border-emerald-400 bg-emerald-50"
                  : "border-slate-300 bg-slate-50 hover:border-slate-400"
              }`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragActive(false);
                applyFile(event.dataTransfer.files?.[0] ?? null);
              }}
            >
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => applyFile(event.target.files?.[0] ?? null)}
              />

              <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#dbeafe,#dcfce7)] text-center">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="Food preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="px-6">
                    <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
                      Upload or camera capture
                    </p>
                    <p className="mt-3 text-2xl font-semibold text-slate-900">Drop a meal photo here</p>
                    <p className="mt-2 text-sm text-slate-600">
                      The analysis route is wired. The model behind it is still mocked on purpose.
                    </p>
                  </div>
                )}
              </div>
            </label>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm leading-6 text-slate-600">
                  {fileName ? `Ready to analyze: ${fileName}` : "Choose a meal photo to test the pipeline."}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {isAnalyzing
                    ? "Running provider analysis, then attempting USDA grounding."
                    : "Current flow: provider analysis → schema validation → USDA grounding."}
                </p>
                {error ? <p className="mt-1 text-sm text-rose-600">{error}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={analyzeCurrentImage}
                  disabled={isAnalyzing}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAnalyzing ? "Analyzing..." : "Analyze photo"}
                </button>
                <button
                  type="button"
                  onClick={rerunAnalysis}
                  disabled={isAnalyzing || !previewUrl}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Re-run
                </button>
                <button
                  type="button"
                  onClick={addFood}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Add food
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Calories" value={`${totals.calories}`} unit="kcal" />
              <Stat label="Protein" value={`${totals.proteinGrams}`} unit="g" />
              <Stat label="Carbs" value={`${totals.carbsGrams}`} unit="g" />
              <Stat label="Fat" value={`${totals.fatGrams}`} unit="g" />
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">Estimate confidence</p>
                  <p className="font-medium capitalize text-slate-900">{analysis.confidence}</p>
                </div>
                <div className="rounded-full bg-slate-900 px-3 py-1 text-sm text-white">
                  {analysis.foods.length} foods detected
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{analysis.summary}</p>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-medium text-slate-900">Debug details</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Provider</p>
                  <p>{providerName}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Pipeline</p>
                  <p>{pipelineStage}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Grounded foods</p>
                  <p>
                    {grounding.filter((item) => item.grounded).length} / {analysis.foods.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={saveCurrentResult}
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
              >
                Save result
              </button>
              <button
                type="button"
                onClick={() => void copySummary()}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Copy summary
              </button>
              {saveMessage ? <p className="self-center text-sm text-slate-600">{saveMessage}</p> : null}
            </div>

            {analysis.followUpQuestions.length ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-medium text-amber-900">High-value follow-up questions</p>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-amber-900/85">
                  {analysis.followUpQuestions.map((question) => (
                    <li key={question}>• {question}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
                Detected foods
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Editable food breakdown</h2>
            </div>
            <p className="text-sm text-slate-500">API-driven result state</p>
          </div>

          <div className="space-y-4">
            {analysis.foods.map((food) => {
              const multiplier = portionMultipliers[food.name] ?? 1;
              return (
                <div
                  key={food.name}
                  className="rounded-2xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{food.name}</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {food.portionDescription}, about {food.estimatedWeightGrams} g
                      </p>
                      {food.estimatedWeightRangeGrams ? (
                        <p className="mt-1 text-xs text-slate-500">
                          Estimated range: {food.estimatedWeightRangeGrams.min} to {food.estimatedWeightRangeGrams.max} g
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                        {Math.round(food.confidence * 100)}% match
                      </span>
                      <span className="rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-700">
                        Portion {food.portionConfidenceLabel}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-medium ${
                          food.dataSource === "usda"
                            ? "bg-violet-50 text-violet-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {food.dataSource === "usda" ? "USDA grounded" : "Estimate only"}
                      </span>
                    </div>
                  </div>

                  {(food.ambiguityNotes.length || food.followUpQuestions.length) ? (
                    <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-950">
                      {food.ambiguityNotes.length ? (
                        <div>
                          <p className="font-medium">Ambiguity notes</p>
                          <ul className="mt-1 space-y-1 leading-6 text-amber-950/85">
                            {food.ambiguityNotes.map((note) => (
                              <li key={note}>• {note}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {food.followUpQuestions.length ? (
                        <div className={food.ambiguityNotes.length ? "mt-3" : ""}>
                          <p className="font-medium">Suggested clarification</p>
                          <ul className="mt-1 space-y-1 leading-6 text-amber-950/85">
                            {food.followUpQuestions.map((question) => (
                              <li key={question}>• {question}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label className="block flex-1 min-w-56">
                        <span className="text-xs uppercase tracking-wide text-slate-500">
                          Manual replacement
                        </span>
                        <select
                          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
                          defaultValue=""
                          onChange={(event) => {
                            if (event.target.value) {
                              replaceFoodName(food.name, event.target.value);
                              event.target.value = "";
                            }
                          }}
                        >
                          <option value="">Choose a better match</option>
                          {manualReplacementOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>

                      <button
                        type="button"
                        onClick={() => removeFood(food.name)}
                        className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                      >
                        Remove food
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                    <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                      <MacroChip label="Calories" value={`${Math.round(food.macros.calories * multiplier)} kcal`} />
                      <MacroChip label="Protein" value={`${Math.round(food.macros.proteinGrams * multiplier)} g`} />
                      <MacroChip label="Carbs" value={`${Math.round(food.macros.carbsGrams * multiplier)} g`} />
                      <MacroChip label="Fat" value={`${Math.round(food.macros.fatGrams * multiplier)} g`} />
                    </div>

                    <label className="block min-w-40">
                      <span className="text-xs uppercase tracking-wide text-slate-500">Portion</span>
                      <select
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
                        value={multiplier}
                        onChange={(event) => updateMultiplier(food.name, Number(event.target.value))}
                      >
                        <option value={0.25}>Quarter</option>
                        <option value={0.5}>Half</option>
                        <option value={0.75}>Three quarters</option>
                        <option value={1}>As detected</option>
                        <option value={1.25}>A bit more</option>
                        <option value={1.5}>One and a half</option>
                        <option value={2}>Double</option>
                      </select>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
              Research-backed product rules
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
              {analysis.notes.map((note) => (
                <li key={note} className="flex gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
              Saved meal history
            </p>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              {savedMeals.length ? (
                savedMeals.map((meal) => (
                  <div key={meal.id} className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{meal.imageName}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(meal.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => loadSavedMeal(meal)}
                          className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 transition hover:bg-sky-100"
                        >
                          Load
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSavedMeal(meal.id)}
                          className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{meal.analysis.summary}</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-500">No saved meals yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
              Recent correction events
            </p>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              {corrections.length ? (
                corrections.slice(0, 8).map((event) => (
                  <div key={event.id} className="rounded-2xl bg-slate-50 p-4">
                    <p className="font-medium text-slate-900">{event.action}</p>
                    <p className="mt-1 text-slate-600">
                      {event.originalFoodName || "manual"} → {event.updatedFoodName || "removed"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(event.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-slate-500">No correction data yet.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 font-medium">{value}</p>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-2xl bg-slate-100 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="text-sm text-slate-500">{unit}</p>
    </div>
  );
}

function MacroChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-100 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-slate-900">{value}</p>
    </div>
  );
}
