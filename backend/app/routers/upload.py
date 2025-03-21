import os
import io
import requests
from fastapi import APIRouter, UploadFile, File, HTTPException
from google.cloud import vision
from google.oauth2 import service_account
from PIL import Image
from google.cloud.vision_v1.types.image_annotator import AnnotateImageResponse

router = APIRouter()

# Load Google Cloud Vision API credentials
credentials_path = "service_account.json"  # Make sure this file is correctly set up
if not os.path.exists(credentials_path):
    raise FileNotFoundError("Google service account credentials not found.")

credentials = service_account.Credentials.from_service_account_file(credentials_path)

client = vision.ImageAnnotatorClient(credentials=credentials)

# Define a set of generic and non-food labels to filter out
NON_FOOD_LABELS = {
    "Bowl", "Plate", "Dish", "Tableware", "Cup", "Table", "Utensil", "Furniture",
    "Food", "Produce", "Ingredient", "Natural foods", "Superfood", "Food group",
    "Recipe", "Eating", "Evening snacks", "Nutrient", "Weight loss"
}

@router.post("/upload-image/")
async def upload_file(file: UploadFile = File(...)):
    image_data = await file.read()
    image = vision.Image(content=image_data)

    # Request multiple detection methods
    response = client.annotate_image({
        'image': image,
        'features': [
            {'type_': vision.Feature.Type.LABEL_DETECTION},
            {'type_': vision.Feature.Type.WEB_DETECTION},
            {'type_': vision.Feature.Type.OBJECT_LOCALIZATION}
        ]
    })

    if response.error.message:
        raise HTTPException(status_code=500, detail=response.error.message)

    detected_foods = set()  # Use a set to avoid duplicates

    # Extract Labels (only food-related and above 0.8 confidence)
    if response.label_annotations:
        for label in response.label_annotations:
            if label.score > 0.8 and label.description not in NON_FOOD_LABELS:
                detected_foods.add(label.description)

    # Extract Web Detection (this usually gives **real food names**)
    if response.web_detection.web_entities:
        for web_entity in response.web_detection.web_entities:
            if web_entity.score > 0.8 and web_entity.description not in NON_FOOD_LABELS:
                detected_foods.add(web_entity.description)

    # Extract Object Localization (this is good for multiple food items)
    if response.localized_object_annotations:
        for obj in response.localized_object_annotations:
            if obj.name not in NON_FOOD_LABELS:
                detected_foods.add(obj.name)

    # Convert set to list and format results
    detected_foods = [{"name": food, "score": 1.0} for food in detected_foods]

    return {"detected_foods": detected_foods or "No food items detected."}
