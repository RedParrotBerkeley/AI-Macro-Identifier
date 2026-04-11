import { getAnalysisProvider } from "@/lib/analysis/factory";
import type { AnalysisResult } from "@/lib/types";

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

  const provider = getAnalysisProvider();
  const result = await provider.analyze(input);

  const response: AnalysisResult & {
    status: "ok";
    pipelineStage: string;
    imageProvided: boolean;
    provider: string;
  } = {
    ...result.analysis,
    status: "ok",
    pipelineStage: result.pipelineStage,
    imageProvided,
    provider: provider.name,
  };

  return Response.json(response);
}
