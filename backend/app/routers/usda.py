import os
import requests
from fastapi import APIRouter, HTTPException

router = APIRouter()

# Get API Key from environment variable
USDA_API_KEY = os.getenv("USDA_API_KEY", "your-fallback-api-key")
BASE_URL = "https://api.nal.usda.gov/fdc/v1/foods/search"

@router.get("/usda")
def search_food(query: str):
    """
    Searches the USDA FoodData API for a food item.
    Example: /usda?query=chicken
    """
    if not USDA_API_KEY:
        raise HTTPException(status_code=500, detail="USDA API key is missing")

    params = {
        "api_key": USDA_API_KEY,
        "query": query,
        "pageSize": 5  # Limit to 5 results for now
    }

    response = requests.get(BASE_URL, params=params)

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail="Failed to fetch data from USDA API")

    return response.json()
