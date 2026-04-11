export type UsdaSearchFood = {
  fdcId: number;
  description: string;
  dataType?: string;
  brandName?: string;
};

const USDA_API_BASE = "https://api.nal.usda.gov/fdc/v1";

export async function searchUsdaFoods(query: string): Promise<UsdaSearchFood[]> {
  const apiKey = process.env.USDA_API_KEY;

  if (!apiKey) {
    throw new Error("USDA_API_KEY is not set");
  }

  const response = await fetch(`${USDA_API_BASE}/foods/search?api_key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      pageSize: 5,
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
    }>;
  };

  return (data.foods || []).map((food) => ({
    fdcId: food.fdcId,
    description: food.description,
    dataType: food.dataType,
    brandName: food.brandOwner,
  }));
}
