import os
import json
import io
from fastapi import APIRouter, File, UploadFile
from google.cloud import vision
from google.oauth2 import service_account

# Load Google Vision API credentials
SERVICE_ACCOUNT_FILE = "service_account.json"
credentials = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE)

# Initialize Google Vision client
client = vision.ImageAnnotatorClient(credentials=credentials)

router = APIRouter()

@router.post("/analyze-food/")
async def analyze_food(file: UploadFile = File(...)):
    """Receives an image, sends it to Google Vision API, and returns detected food labels."""

    # Read the uploaded image
    image_data = await file.read()
    image = vision.Image(content=image_data)

    # Request label detection
    response = client.label_detection(image=image)
    labels = response.label_annotations

    # Extract relevant labels
    food_items = [label.description for label in labels]

    return {"recognized_food": food_items}
