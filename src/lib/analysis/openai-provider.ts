import OpenAI from "openai";

import { normalizeAnalysisResult } from "@/lib/analysis/normalize";
import type {
  AnalysisProvider,
  AnalyzeImageInput,
  AnalysisProviderResult,
} from "@/lib/analysis/provider";

const SYSTEM_PROMPT = `You analyze a food image and return a structured nutrition-estimation object.
Be conservative. If uncertain, express that uncertainty in confidence fields, ambiguity notes, and follow-up questions.
Do not claim USDA grounding. Set dataSource to estimated.`;

export class OpenAIAnalysisProvider implements AnalysisProvider {
  name = "openai-analysis-provider";

  async analyze(input: AnalyzeImageInput): Promise<AnalysisProviderResult> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    if (!input.imageUrl && !input.imageBase64) {
      throw new Error("OpenAI provider requires imageUrl or imageBase64 input");
    }

    const client = new OpenAI({ apiKey });

    const imageInput = input.imageUrl
      ? { type: "input_image" as const, image_url: input.imageUrl, detail: "auto" as const }
      : {
          type: "input_image" as const,
          image_url: `data:image/jpeg;base64,${input.imageBase64}`,
          detail: "auto" as const,
        };

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: SYSTEM_PROMPT }],
        },
        {
          role: "user",
          content: [
            imageInput,
            {
              type: "input_text",
              text: `Return JSON with: summary, confidence, notes, followUpQuestions, foods[].
Each food must include name, confidence, confidenceLabel, portionDescription, estimatedWeightGrams, estimatedWeightRangeGrams, portionConfidence, portionConfidenceLabel, ambiguityNotes, followUpQuestions, macros, dataSource.
Use confidence labels from: low, medium, high.
Use dataSource value: estimated.`,
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "food_analysis",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              summary: { type: "string" },
              confidence: { type: "string", enum: ["low", "medium", "high"] },
              notes: { type: "array", items: { type: "string" } },
              followUpQuestions: { type: "array", items: { type: "string" } },
              foods: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    name: { type: "string" },
                    confidence: { type: "number" },
                    confidenceLabel: { type: "string", enum: ["low", "medium", "high"] },
                    portionDescription: { type: "string" },
                    estimatedWeightGrams: { type: "number" },
                    estimatedWeightRangeGrams: {
                      type: ["object", "null"],
                      additionalProperties: false,
                      properties: {
                        min: { type: "number" },
                        max: { type: "number" },
                      },
                      required: ["min", "max"],
                    },
                    portionConfidence: { type: "number" },
                    portionConfidenceLabel: { type: "string", enum: ["low", "medium", "high"] },
                    ambiguityNotes: { type: "array", items: { type: "string" } },
                    followUpQuestions: { type: "array", items: { type: "string" } },
                    macros: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        calories: { type: "number" },
                        proteinGrams: { type: "number" },
                        carbsGrams: { type: "number" },
                        fatGrams: { type: "number" },
                      },
                      required: ["calories", "proteinGrams", "carbsGrams", "fatGrams"],
                    },
                    dataSource: { type: "string", enum: ["estimated"] },
                  },
                  required: [
                    "name",
                    "confidence",
                    "confidenceLabel",
                    "portionDescription",
                    "estimatedWeightGrams",
                    "estimatedWeightRangeGrams",
                    "portionConfidence",
                    "portionConfidenceLabel",
                    "ambiguityNotes",
                    "followUpQuestions",
                    "macros",
                    "dataSource",
                  ],
                },
              },
            },
            required: ["summary", "confidence", "notes", "followUpQuestions", "foods"],
          },
        },
      },
    });

    const rawOutput = response.output_text;

    if (!rawOutput) {
      throw new Error("OpenAI provider returned no structured output");
    }

    const parsed = JSON.parse(rawOutput) as unknown;
    const normalized = normalizeAnalysisResult(parsed);

    return {
      analysis: normalized,
      pipelineStage: "provider-analysis",
    };
  }
}
