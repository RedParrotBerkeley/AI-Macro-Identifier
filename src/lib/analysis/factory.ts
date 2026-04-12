import type { AnalysisProvider } from "@/lib/analysis/provider";
import { MockAnalysisProvider } from "@/lib/analysis/mock-provider";
import { OpenAIAnalysisProvider } from "@/lib/analysis/openai-provider";

export function getAnalysisProvider(): AnalysisProvider {
  const configuredProvider = process.env.ANALYSIS_PROVIDER?.toLowerCase();

  if (configuredProvider === "openai") {
    return new OpenAIAnalysisProvider();
  }

  return new MockAnalysisProvider();
}
