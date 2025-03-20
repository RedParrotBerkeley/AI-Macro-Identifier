FROM python:3.11

# Set the working directory
WORKDIR /app

# Copy and install dependencies first (improves Docker caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the service account JSON file securely
COPY service_account.json /app/service_account.json

# Copy the rest of the app files
COPY . .

# Expose the FastAPI port (optional, but useful)
EXPOSE 8080

# Run the FastAPI app
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
