import type { AnalysisResult } from "@/lib/types";

export type AnalyzeImageInput = {
  imageBase64?: string;
  imageUrl?: string;
};

export interface AnalysisProvider {
  name: string;
  analyze(input: AnalyzeImageInput): Promise<AnalysisResult>;
}
