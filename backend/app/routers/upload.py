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


@router.post("/upload-image/")
async def upload_file(file: UploadFile = File(...)):
    # Read the uploaded image
    image_data = await file.read()
    image = vision.Image(content=image_data)

    # Use OBJECT_LOCALIZATION instead of LABEL_DETECTION
    response = client.object_localization(image=image)

    if response.error.message:
        raise HTTPException(status_code=500, detail=response.error.message)

    detected_objects = []
    for obj in response.localized_object_annotations:
        detected_objects.append({
            "name": obj.name,  # More specific than labels
            "score": obj.score,  # Confidence level
            "bounding_box": [(v.x, v.y) for v in obj.bounding_poly.normalized_vertices]  # Bounding box coordinates
        })

    if not detected_objects:
        return {"detail": "No objects detected."}

    return {"detected_foods": detected_objects}
