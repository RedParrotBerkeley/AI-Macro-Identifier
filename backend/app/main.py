import os
import uvicorn
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello World"}

if __name__ == "__main__":
    # Get PORT from environment variable (Cloud Run automatically sets this)
    port = int(os.getenv("PORT", 8080))
    print(f"Starting FastAPI on port {port}...")  # Debugging
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")


