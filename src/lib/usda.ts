export type UsdaSearchFood = {
  fdcId: number;
  description: string;
  dataType?: string;
  brandName?: string;
  score?: number;
};

export type UsdaFoodDetails = {
  fdcId: number;
  description: string;
  dataType?: string;
  brandName?: string;
  foodNutrients?: Array<{
    nutrientNumber?: string;
    nutrientName?: string;
    unitName?: string;
    value?: number;
    amount?: number;
    nutrient?: {
      number?: string;
      name?: string;
      unitName?: string;
    };
  }>;
};

const USDA_API_BASE = "https://api.nal.usda.gov/fdc/v1";

function getUsdaApiKey() {
  const apiKey = process.env.USDA_API_KEY;

  if (!apiKey) {
    throw new Error("USDA_API_KEY is not set");
  }

  return apiKey;
}

export async function searchUsdaFoods(query: string): Promise<UsdaSearchFood[]> {
  const apiKey = getUsdaApiKey();

  const response = await fetch(`${USDA_API_BASE}/foods/search?api_key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      pageSize: 8,
      dataType: ["Foundation", "Survey (FNDDS)", "Branded"],
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`USDA search failed with status ${response.status}`);
  }

  const data = (await response.json()) as {
    foods?: Array<{
      fdcId: number;
      description: string;
      dataType?: string;
      brandOwner?: string;
      score?: number;
    }>;
  };

  return (data.foods || []).map((food) => ({
    fdcId: food.fdcId,
    description: food.description,
    dataType: food.dataType,
    brandName: food.brandOwner,
    score: food.score,
  }));
}

export async function getUsdaFoodDetails(fdcId: number): Promise<UsdaFoodDetails> {
  const apiKey = getUsdaApiKey();

  const response = await fetch(`${USDA_API_BASE}/food/${fdcId}?api_key=${apiKey}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`USDA food details failed with status ${response.status}`);
  }

  return (await response.json()) as UsdaFoodDetails;
}
