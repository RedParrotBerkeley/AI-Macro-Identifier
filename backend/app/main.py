from fastapi import FastAPI
from app.routers import upload

app = FastAPI()

app.include_router(upload.router)

@app.get("/ping")
def health_check():
    return {"message": "API is running"}

