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

# Define non-food objects to ignore
NON_FOOD_LABELS = {"Table", "Bowl", "Plate", "Dish", "Utensil", "Furniture"}

@router.post("/upload-image/")
async def upload_file(file: UploadFile = File(...)):
    image_data = await file.read()
    image = vision.Image(content=image_data)

    # Request both LABEL_DETECTION and WEB_DETECTION
    response = client.annotate_image({
        'image': image,
        'features': [
            {'type_': vision.Feature.Type.LABEL_DETECTION},
            {'type_': vision.Feature.Type.WEB_DETECTION}
        ]
    })

    if response.error.message:
        raise HTTPException(status_code=500, detail=response.error.message)

    detected_foods = []

    # Extract Labels and filter out non-food items
    if response.label_annotations:
        for label in response.label_annotations:
            if label.score > 0.6 and label.description not in NON_FOOD_LABELS:
                detected_foods.append({
                    "name": label.description,
                    "score": round(label.score, 2)  # Round confidence score for better readability
                })

    # Extract Web Results for additional food recognition
    if response.web_detection.web_entities:
        for web_entity in response.web_detection.web_entities:
            if web_entity.score > 0.6 and web_entity.description not in NON_FOOD_LABELS:
                detected_foods.append({
                    "name": web_entity.description,
                    "score": round(web_entity.score, 2)
                })

    return {"detected_foods": detected_foods or "No food items detected."}
