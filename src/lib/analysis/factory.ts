import type { AnalysisProvider } from "@/lib/analysis/provider";
import { MockAnalysisProvider } from "@/lib/analysis/mock-provider";

export function getAnalysisProvider(): AnalysisProvider {
  return new MockAnalysisProvider();
}
