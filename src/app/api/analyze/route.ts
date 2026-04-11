import { MockAnalysisProvider } from "@/lib/analysis/mock-provider";
import type { AnalysisResult } from "@/lib/types";

const provider = new MockAnalysisProvider();

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  let imageProvided = false;
  let input: { imageBase64?: string; imageUrl?: string } = {};

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as { imageBase64?: string; imageUrl?: string };
    imageProvided = Boolean(body.imageBase64 || body.imageUrl);
    input = body;
  } else if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    imageProvided = formData.has("image");
  }

  const analysis = await provider.analyze(input);

  const response: AnalysisResult & {
    status: "ok";
    pipelineStage: "mocked-analysis";
    imageProvided: boolean;
    provider: string;
  } = {
    ...analysis,
    status: "ok",
    pipelineStage: "mocked-analysis",
    imageProvided,
    provider: provider.name,
  };

  return Response.json(response);
}
