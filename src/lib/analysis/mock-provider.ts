import { normalizeAnalysisResult } from "@/lib/analysis/normalize";
import type {
  AnalysisProvider,
  AnalyzeImageInput,
  AnalysisProviderResult,
} from "@/lib/analysis/provider";
import { demoAnalysis } from "@/lib/demo-data";

export class MockAnalysisProvider implements AnalysisProvider {
  name = "mock-analysis-provider";

  async analyze(_input: AnalyzeImageInput): Promise<AnalysisProviderResult> {
    void _input;

    return {
      analysis: normalizeAnalysisResult(demoAnalysis),
      pipelineStage: "mocked-analysis",
    };
  }
}
