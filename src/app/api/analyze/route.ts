import { getAnalysisProvider } from "@/lib/analysis/factory";
import { groundAnalysisWithUsda } from "@/lib/grounding";
import type { AnalysisResult, GroundingStatus } from "@/lib/types";

type AnalyzeSuccessResponse = AnalysisResult & {
  status: "ok";
  pipelineStage: string;
  imageProvided: boolean;
  provider: string;
  grounding: GroundingStatus[];
};

type AnalyzeErrorResponse = {
  status: "error";
  code: string;
  message: string;
  provider?: string;
  pipelineStage?: string;
};

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  let imageProvided = false;
  let input: { imageBase64?: string; imageUrl?: string } = {};

  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as { imageBase64?: string; imageUrl?: string };
      imageProvided = Boolean(body.imageBase64 || body.imageUrl);
      input = body;
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      imageProvided = formData.has("image");
    }

    if (!imageProvided) {
      return Response.json(
        {
          status: "error",
          code: "missing_image",
          message: "No image was provided for analysis.",
        } satisfies AnalyzeErrorResponse,
        { status: 400 }
      );
    }

    const provider = getAnalysisProvider();
    const result = await provider.analyze(input);

    let finalAnalysis = result.analysis;
    let grounding: GroundingStatus[] = [];

    try {
      const grounded = await groundAnalysisWithUsda(result.analysis);
      finalAnalysis = grounded.analysis;
      grounding = grounded.groundedFoods.map((item) => ({
        originalName: item.originalName,
        grounded: item.grounded,
        matchedDescription: item.matchedFood?.description,
        matchedDataType: item.matchedFood?.dataType,
        matchedFdcId: item.matchedFood?.fdcId,
      }));
    } catch {
      grounding = result.analysis.foods.map((food) => ({
        originalName: food.name,
        grounded: false,
      }));
    }

    const response: AnalyzeSuccessResponse = {
      ...finalAnalysis,
      status: "ok",
      pipelineStage: result.pipelineStage,
      imageProvided,
      provider: provider.name,
      grounding,
    };

    return Response.json(response);
  } catch (error) {
    const provider = getAnalysisProvider();

    return Response.json(
      {
        status: "error",
        code: "analysis_failed",
        message: error instanceof Error ? error.message : "Unknown analysis failure",
        provider: provider.name,
      } satisfies AnalyzeErrorResponse,
      { status: 500 }
    );
  }
}
