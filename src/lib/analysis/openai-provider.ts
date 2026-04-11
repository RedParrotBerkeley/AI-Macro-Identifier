import type {
  AnalysisProvider,
  AnalyzeImageInput,
  AnalysisProviderResult,
} from "@/lib/analysis/provider";

export class OpenAIAnalysisProvider implements AnalysisProvider {
  name = "openai-analysis-provider";

  async analyze(_input: AnalyzeImageInput): Promise<AnalysisProviderResult> {
    void _input;
    throw new Error("OpenAIAnalysisProvider is not wired yet");
  }
}
