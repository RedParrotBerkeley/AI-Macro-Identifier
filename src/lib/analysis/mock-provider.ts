import { demoAnalysis } from "@/lib/demo-data";

import type { AnalysisProvider, AnalyzeImageInput } from "@/lib/analysis/provider";

export class MockAnalysisProvider implements AnalysisProvider {
  name = "mock-analysis-provider";

  async analyze(_input: AnalyzeImageInput) {
    void _input;
    return demoAnalysis;
  }
}
