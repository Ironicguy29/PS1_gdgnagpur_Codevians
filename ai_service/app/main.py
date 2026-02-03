from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import random
import time

app = FastAPI(title="ArogyaMitra AI Service", version="1.0.0")

class WaitTimeRequest(BaseModel):
    queue_length: int
    avg_consultation_time: int
    doctor_id: str

class ChatRequest(BaseModel):
    message: str
    language: str = "en"

class TriageRequest(BaseModel):
    symptoms: list[str]
    age: int
    vitals: dict

class CrowdRequest(BaseModel):
    camera_feed_id: str

@app.get("/")
def read_root():
    return {"message": "ArogyaMitra AI Service is running"}

@app.post("/predict-wait")
def predict_wait_time(request: WaitTimeRequest):
    # Mock ML Model Logic
    base_time = request.queue_length * request.avg_consultation_time
    variance = random.uniform(0.8, 1.2)
    predicted_time = int(base_time * variance)
    return {
        "predicted_wait_minutes": predicted_time,
        "confidence_score": 0.89
    }

@app.post("/chatbot")
def chatbot_response(request: ChatRequest):
    msg = request.message.lower()
    responses = {
        "en": "I am ArogyaMitra Assistant. How can I help you?",
        "hi": "मैं आरोग्यमित्र सहायक हूँ। मैं आपकी कैसे मदद कर सकता हूँ?"
    }
    response_text = responses.get(request.language, responses["en"])
    if "symptom" in msg:
        response_text = "Please describe your symptoms. For emergencies, visit the Emergency Ward immediately."
    elif "appointment" in msg:
        response_text = "You can book an appointment from the 'Book Appointment' card on your dashboard."
    return {
        "response": response_text,
        "language": request.language
    }

@app.post("/triage-score")
def calculate_triage_score(request: TriageRequest):
    # Mock Triage Logic (0-100, higher is more critical)
    score = 0
    critical_symptoms = ["chest pain", "shortness of breath", "severe bleeding", "unconscious"]
    
    for symptom in request.symptoms:
        if symptom.lower() in critical_symptoms:
            score += 40
        else:
            score += 10
            
    if request.age > 65 or request.age < 5:
        score += 15
        
    return {
        "triage_score": min(score, 100),
        "category": "Critical" if score > 50 else "Normal"
    }

@app.post("/crowd-density")
def analyze_crowd_density(request: CrowdRequest):
    # Mock Visual Analysis
    return {
        "camera_feed_id": request.camera_feed_id,
        "person_count": random.randint(5, 50),
        "status": "Moderate Congestion"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
