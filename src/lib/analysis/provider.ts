import type { AnalysisResult } from "@/lib/types";

export type AnalyzeImageInput = {
  imageBase64?: string;
  imageUrl?: string;
};

export type AnalysisPipelineStage = "mocked-analysis" | "provider-analysis";

export type AnalysisProviderResult = {
  analysis: AnalysisResult;
  pipelineStage: AnalysisPipelineStage;
};

export interface AnalysisProvider {
  name: string;
  analyze(input: AnalyzeImageInput): Promise<AnalysisProviderResult>;
}
