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
const searchCache = new Map<string, UsdaSearchFood[]>();
const detailsCache = new Map<number, UsdaFoodDetails>();

function getUsdaApiKey() {
  const apiKey = process.env.USDA_API_KEY;

  if (!apiKey) {
    throw new Error("USDA_API_KEY is not set");
  }

  return apiKey;
}

function normalizeQuery(query: string) {
  return query.trim().toLowerCase();
}

export async function searchUsdaFoods(query: string): Promise<UsdaSearchFood[]> {
  const normalizedQuery = normalizeQuery(query);
  const cached = searchCache.get(normalizedQuery);

  if (cached) {
    return cached;
  }

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

  const foods = (data.foods || []).map((food) => ({
    fdcId: food.fdcId,
    description: food.description,
    dataType: food.dataType,
    brandName: food.brandOwner,
    score: food.score,
  }));

  searchCache.set(normalizedQuery, foods);
  return foods;
}

export async function getUsdaFoodDetails(fdcId: number): Promise<UsdaFoodDetails> {
  const cached = detailsCache.get(fdcId);

  if (cached) {
    return cached;
  }

  const apiKey = getUsdaApiKey();

  const response = await fetch(`${USDA_API_BASE}/food/${fdcId}?api_key=${apiKey}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`USDA food details failed with status ${response.status}`);
  }

  const details = (await response.json()) as UsdaFoodDetails;
  detailsCache.set(fdcId, details);
  return details;
}
