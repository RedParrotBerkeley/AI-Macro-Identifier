import os
import io
import requests
from fastapi import APIRouter, UploadFile, File, HTTPException
from google.cloud import vision
from google.oauth2 import service_account
from PIL import Image

router = APIRouter()

# Load Google Cloud Vision API credentials
credentials_path = "service_account.json"  # Make sure this file is correctly set up
if not os.path.exists(credentials_path):
    raise FileNotFoundError("Google service account credentials not found.")

credentials = service_account.Credentials.from_service_account_file(credentials_path)
client = vision.ImageAnnotatorClient(credentials=credentials)

@router.post("/upload-image/")
async def upload_image(file: UploadFile = File(...)):
    try:
        # Read image bytes
        image_bytes = await file.read()
        image = vision.Image(content=image_bytes)

        # Send to Google Vision API
        response = client.label_detection(image=image)
        labels = response.label_annotations

        # Extract food-related labels
        detected_foods = [label.description for label in labels if "food" in label.description.lower()]

        if not detected_foods:
            return {"message": "No food detected in image."}

        return {"detected_foods": detected_foods}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
