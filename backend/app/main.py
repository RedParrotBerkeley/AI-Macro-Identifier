import os
import uvicorn
from fastapi import FastAPI
from app.routers import usda  
from fastapi.middleware.cors import CORSMiddleware
from app.routers import upload

app = FastAPI()

# Allow frontend to call the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict this later to just your frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include USDA and upload router
app.include_router(usda.router)
app.include_router(upload.router)

@app.get("/")
def read_root():
    return {"message": "Hello, AI Macro Tracker is running!"}

if __name__ == "__main__":
    # Get PORT from environment variable (Cloud Run automatically sets this)
    port = int(os.getenv("PORT", 8080))
    print(f"Starting FastAPI on port {port}...")  # Debugging
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")



