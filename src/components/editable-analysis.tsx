"use client";

import { useMemo, useState } from "react";

import { demoAnalysis } from "@/lib/demo-data";
import type { FoodCandidate } from "@/lib/types";

type FoodState = FoodCandidate & {
  portionMultiplier: number;
};

const initialFoods: FoodState[] = demoAnalysis.foods.map((food) => ({
  ...food,
  portionMultiplier: 1,
}));

function percent(confidence: number) {
  return `${Math.round(confidence * 100)}%`;
}

export function EditableAnalysis() {
  const [foods, setFoods] = useState<FoodState[]>(initialFoods);

  const totals = useMemo(
    () =>
      foods.reduce(
        (acc, food) => ({
          calories: acc.calories + Math.round(food.macros.calories * food.portionMultiplier),
          proteinGrams:
            acc.proteinGrams + Math.round(food.macros.proteinGrams * food.portionMultiplier),
          carbsGrams: acc.carbsGrams + Math.round(food.macros.carbsGrams * food.portionMultiplier),
          fatGrams: acc.fatGrams + Math.round(food.macros.fatGrams * food.portionMultiplier),
        }),
        {
          calories: 0,
          proteinGrams: 0,
          carbsGrams: 0,
          fatGrams: 0,
        }
      ),
    [foods]
  );

  function updateMultiplier(name: string, nextValue: number) {
    setFoods((current) =>
      current.map((food) =>
        food.name === name
          ? {
              ...food,
              portionMultiplier: nextValue,
            }
          : food
      )
    );
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
              Detected foods
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Editable food breakdown</h2>
          </div>
          <p className="text-sm text-slate-500">Adjust portions and watch totals update</p>
        </div>

        <div className="space-y-4">
          {foods.map((food) => (
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
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                  {percent(food.confidence)} match
                </span>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <MacroChip
                    label="Calories"
                    value={`${Math.round(food.macros.calories * food.portionMultiplier)} kcal`}
                  />
                  <MacroChip
                    label="Protein"
                    value={`${Math.round(food.macros.proteinGrams * food.portionMultiplier)} g`}
                  />
                  <MacroChip
                    label="Carbs"
                    value={`${Math.round(food.macros.carbsGrams * food.portionMultiplier)} g`}
                  />
                  <MacroChip
                    label="Fat"
                    value={`${Math.round(food.macros.fatGrams * food.portionMultiplier)} g`}
                  />
                </div>

                <label className="block min-w-40">
                  <span className="text-xs uppercase tracking-wide text-slate-500">Portion</span>
                  <select
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500"
                    value={food.portionMultiplier}
                    onChange={(event) => updateMultiplier(food.name, Number(event.target.value))}
                  >
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
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
            Updated totals
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Calories" value={`${totals.calories}`} unit="kcal" />
            <Stat label="Protein" value={`${totals.proteinGrams}`} unit="g" />
            <Stat label="Carbs" value={`${totals.carbsGrams}`} unit="g" />
            <Stat label="Fat" value={`${totals.fatGrams}`} unit="g" />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
            Research-backed product rules
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
            {demoAnalysis.notes.map((note) => (
              <li key={note} className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
            Practical architecture
          </p>
          <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
            <li>1. Capture photo and normalize image size client-side.</li>
            <li>2. Ask a multimodal model for visible foods and portion guesses.</li>
            <li>3. Resolve foods against USDA FoodData Central for nutrient truth.</li>
            <li>4. Return totals plus confidence and uncertainty notes.</li>
            <li>5. Let the user edit portions before saving to history.</li>
          </ol>
        </div>
      </div>
    </section>
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
