import json
import os
import random
import urllib.request
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

app = FastAPI(title="ArogyaMitra AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.disease_intelligence.router import router as disease_intel_router
app.include_router(disease_intel_router, prefix="/api/disease-intelligence", tags=["Disease Intelligence"])

@app.on_event("startup")
def on_startup():
    from app.disease_intelligence.generator import seed_dataset
    import threading
    threading.Thread(target=seed_dataset, daemon=True).start()



def _load_gemini_settings() -> tuple[str, str]:
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"), override=True)
    return os.getenv("GEMINI_API_KEY", ""), os.getenv("GEMINI_MODEL", "gemini-3.5-flash")

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

def _build_gemini_prompt(message: str, language: str) -> str:
    return (
        "You are ArogyaMitra, a helpful hospital assistant. "
        f"Answer the user in {language} and keep the response short, helpful, and relevant.\n"
        f"User message: {message}"
    )


def _get_gemini_response(message: str, language: str) -> Optional[str]:
    api_key, model = _load_gemini_settings()
    if not api_key:
        return None

    payload = {
        "contents": [{
            "parts": [{"text": _build_gemini_prompt(message, language)}]
        }]
    }

    endpoint = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model}:generateContent?key={api_key}"
    )

    req = urllib.request.Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            body = response.read().decode("utf-8")
            data = json.loads(body)
            parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
            if parts:
                return parts[0].get("text", "").strip()
    except Exception:
        return None

    return None


@app.post("/chatbot")
def chatbot_response(request: ChatRequest):
    msg = request.message.lower()
    gemini_response = _get_gemini_response(request.message, request.language)
    if gemini_response:
        return {
            "response": gemini_response,
            "language": request.language,
            "source": "gemini",
        }

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
        "language": request.language,
        "source": "fallback",
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

class ConsultationAssistantRequest(BaseModel):
    patient_name: str
    age: int
    gender: str
    blood_group: str
    allergies: list[str]
    chronic_diseases: list[str]
    current_medications: list[str]
    symptoms: list[str]
    vitals: dict
    previous_visits: list[dict] = []
    current_prescriptions: list[dict] = []

def _get_consultation_ai_response(prompt: str) -> Optional[str]:
    api_key, model = _load_gemini_settings()
    # Explicitly use the key provided by the user if environment is empty
    if not api_key:
        api_key = API_KEY = os.getenv("GOOGLE_API_KEY")
    
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }]
    }

    endpoint = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model}:generateContent?key={api_key}"
    )

    req = urllib.request.Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            body = response.read().decode("utf-8")
            data = json.loads(body)
            parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
            if parts:
                return parts[0].get("text", "").strip()
    except Exception as e:
        print("Consultation AI assistant helper error:", e)
        return None
    return None

@app.post("/consultation-assistant")
def get_consultation_assistant_suggestions(request: ConsultationAssistantRequest):
    prompt = (
        "You are an expert EMR Clinical AI Assistant. Analyze the patient profile and clinical session details:\n\n"
        f"Patient: {request.patient_name}, {request.age}yo {request.gender}, Blood: {request.blood_group}\n"
        f"Known Allergies: {', '.join(request.allergies) if request.allergies else 'None'}\n"
        f"Chronic Conditions: {', '.join(request.chronic_diseases) if request.chronic_diseases else 'None'}\n"
        f"Current Medications: {', '.join(request.current_medications) if request.current_medications else 'None'}\n"
        f"Presented Symptoms: {', '.join(request.symptoms) if request.symptoms else 'None'}\n"
        f"Vitals: {request.vitals}\n"
        f"Previous Visits History: {json.dumps(request.previous_visits)}\n"
        f"Prescribed during session: {json.dumps(request.current_prescriptions)}\n\n"
        "Generate a structured JSON response matching this EXACT format (no other text, no markdown codeblocks, just raw JSON):\n"
        "{\n"
        '  "summary": "Brief clinical history and session summary.",\n'
        '  "differential_diagnoses": ["Diag 1", "Diag 2"],\n'
        '  "warnings": ["Allergy/Drug Interaction warning or High-risk alerts"],\n'
        '  "suggested_investigations": ["Lab/Imaging test 1", "test 2"],\n'
        '  "suggested_follow_up": "Advised follow up timeframe and reasoning."\n'
        "}"
    )

    ai_res = _get_consultation_ai_response(prompt)
    if ai_res:
        try:
            # Clean possible markdown block formatting
            clean_res = ai_res.strip()
            if clean_res.startswith("```json"):
                clean_res = clean_res[7:]
            if clean_res.endswith("```"):
                clean_res = clean_res[:-3]
            clean_res = clean_res.strip()
            parsed = json.loads(clean_res)
            return parsed
        except Exception:
            pass

    # Fallback response
    return {
        "summary": f"Patient presents with {', '.join(request.symptoms) if request.symptoms else 'general symptoms'}. Review patient file.",
        "differential_diagnoses": ["Viral Fever", "Acute URI"],
        "warnings": ["Verify medication interactions and check allergies."],
        "suggested_investigations": ["Complete Blood Count (CBC)"],
        "suggested_follow_up": "Follow up in 3-5 days if symptoms persist."
    }

class ForecastRequest(BaseModel):
    history: list[dict]

@app.post("/forecast")
def forecast_trends(request: ForecastRequest):
    history = request.history
    import datetime
    
    if not history or len(history) < 2:
        # Return fallback mock predictions for next 7 days
        predictions = []
        start_date = datetime.date.today() + datetime.timedelta(days=1)
        base_patients = 25
        base_revenue = 45000.0
        for i in range(7):
            d = start_date + datetime.timedelta(days=i)
            # Weekend effect
            is_weekend = d.weekday() >= 5
            factor = 0.5 if is_weekend else 1.1
            patients = int(base_patients * factor + random.randint(-3, 3))
            revenue = float(int(base_revenue * factor + random.randint(-5000, 5000)))
            predictions.append({
                "date": d.isoformat(),
                "predicted_patients": max(5, patients),
                "predicted_revenue": max(10000.0, revenue)
            })
        return {"predictions": predictions}

    # We have historical data. Let's do a simple regression / projection
    n = len(history)
    patients = [float(h.get("patients", 0)) for h in history]
    revenues = [float(h.get("revenue", 0)) for h in history]
    
    # Calculate simple trends
    x = list(range(n))
    mean_x = sum(x) / n
    
    def get_trend(y):
        mean_y = sum(y) / n
        num = sum((x[i] - mean_x) * (y[i] - mean_y) for i in range(n))
        den = sum((x[i] - mean_x) ** 2 for i in range(n))
        if den == 0:
            return 0.0, mean_y
        slope = num / den
        intercept = mean_y - slope * mean_x
        return slope, intercept

    p_slope, p_intercept = get_trend(patients)
    r_slope, r_intercept = get_trend(revenues)

    # Compute day of week multipliers
    dow_multipliers_p = {0: 1.0, 1: 1.1, 2: 1.1, 3: 1.1, 4: 1.1, 5: 0.7, 6: 0.5}
    dow_multipliers_r = {0: 1.0, 1: 1.1, 2: 1.1, 3: 1.1, 4: 1.1, 5: 0.7, 6: 0.5}
    
    try:
        dow_counts = {i: 0 for i in range(7)}
        dow_sums_p = {i: 0.0 for i in range(7)}
        dow_sums_r = {i: 0.0 for i in range(7)}
        
        for h in history:
            # Parse YYYY-MM-DD
            date_str = h["date"][:10]
            dt = datetime.date.fromisoformat(date_str)
            weekday = dt.weekday()
            dow_counts[weekday] += 1
            dow_sums_p[weekday] += float(h.get("patients", 0))
            dow_sums_r[weekday] += float(h.get("revenue", 0))
            
        avg_p = sum(patients) / n
        avg_r = sum(revenues) / n
        
        if avg_p > 0 and avg_r > 0:
            for w in range(7):
                if dow_counts[w] > 0:
                    dow_multipliers_p[w] = (dow_sums_p[w] / dow_counts[w]) / avg_p
                    dow_multipliers_r[w] = (dow_sums_r[w] / dow_counts[w]) / avg_r
    except Exception as e:
        print("Dow multiplier math failed, using defaults:", str(e))

    predictions = []
    try:
        last_date_str = history[-1]["date"][:10]
        last_date = datetime.date.fromisoformat(last_date_str)
    except Exception:
        last_date = datetime.date.today()

    for i in range(1, 8):
        future_date = last_date + datetime.timedelta(days=i)
        w = future_date.weekday()
        
        # Project linear trend
        idx = n - 1 + i
        proj_p = p_intercept + p_slope * idx
        proj_r = r_intercept + r_slope * idx
        
        # Apply weekday/weekend seasonality
        p_val = max(3, int(proj_p * dow_multipliers_p.get(w, 1.0)))
        r_val = max(1000.0, float(proj_r * dow_multipliers_r.get(w, 1.0)))
        
    for i in range(1, 8):
        future_date = last_date + datetime.timedelta(days=i)
        w = future_date.weekday()
        
        # Project linear trend
        idx = n - 1 + i
        proj_p = p_intercept + p_slope * idx
        proj_r = r_intercept + r_slope * idx
        
        # Apply weekday/weekend seasonality
        p_val = max(3, int(proj_p * dow_multipliers_p.get(w, 1.0)))
        r_val = max(1000.0, float(proj_r * dow_multipliers_r.get(w, 1.0)))
        
        predictions.append({
            "date": future_date.isoformat(),
            "predicted_patients": p_val,
            "predicted_revenue": round(r_val, 2)
        })

    return {"predictions": predictions}

class SymptomAnalysisRequest(BaseModel):
    symptoms: list[str]
    age: int
    description: Optional[str] = ""
    language: str = "en"

class HealthRiskRequest(BaseModel):
    age: int
    gender: str
    existing_diseases: list[str]
    allergies: list[str]
    current_medications: list[str]
    lifestyle: dict
    vitals: list[dict]

@app.post("/symptom-analysis")
def analyze_symptom_profile(request: SymptomAnalysisRequest):
    prompt = (
        "You are an expert Clinical AI Symptom Checker. Analyze the following patient details:\n\n"
        f"Symptoms: {', '.join(request.symptoms)}\n"
        f"Age: {request.age}\n"
        f"Additional Description: {request.description or 'None'}\n"
        f"Language of response: {request.language}\n\n"
        "Assess if there is a critical emergency (e.g. stroke, heart attack, severe breathing difficulty, anaphylaxis). "
        "Recommend the most appropriate medical department for appointment booking (e.g., Cardiology, Neurology, Pulmonology, Orthopedics, General Medicine).\n\n"
        "Generate a structured JSON response matching this EXACT format (no other text, no markdown codeblocks, just raw JSON):\n"
        "{\n"
        '  "triage_level": "Critical" | "Urgent" | "Non-urgent" | "Routine",\n'
        '  "recommended_department": "Cardiology" | "Neurology" | "General Medicine" | etc.,\n'
        '  "potential_conditions": [\n'
        '    { "condition": "Condition Name", "probability": 0.85, "details": "Explanation details here" }\n'
        '  ],\n'
        '  "suggested_next_steps": ["Step 1", "Step 2"]\n'
        "}"
    )

    ai_res = _get_consultation_ai_response(prompt)
    if ai_res:
        try:
            clean_res = ai_res.strip()
            if clean_res.startswith("```json"):
                clean_res = clean_res[7:]
            if clean_res.endswith("```"):
                clean_res = clean_res[:-3]
            clean_res = clean_res.strip()
            parsed = json.loads(clean_res)
            return parsed
        except Exception:
            pass

    # Dynamic fallback based on common emergency terms
    triage = "Routine"
    dept = "General Medicine"
    conditions = [{"condition": "General malaise", "probability": 0.7, "details": "Symptoms are not specific enough. Schedule general examination."}]
    steps = ["Get adequate rest", "Monitor temperature & hydration", "Book doctor appointment"]

    symptom_str = " ".join(request.symptoms).lower() + " " + (request.description or "").lower()
    if any(term in symptom_str for term in ["chest pain", "heart", "cardiac", "stroke", "numbness", "paralysis", "breathing", "shortness of breath", "choking"]):
        triage = "Critical"
        dept = "Cardiology" if "chest" in symptom_str or "heart" in symptom_str else "Neurology"
        conditions = [{"condition": "Potential Acute Cardiovascular or Neurological Event", "probability": 0.9, "details": "Emergency symptoms detected. Seek emergency medical attention."}]
        steps = ["CALL EMERGENCY SERVICES IMMEDIATELY", "Do not drive yourself", "Rest in a sitting position"]
    elif any(term in symptom_str for term in ["fracture", "bone", "joint", "sprain", "fall"]):
        triage = "Urgent"
        dept = "Orthopedics"
        conditions = [{"condition": "Joint/Bone Injury", "probability": 0.8, "details": "Potential sprain or fracture needing assessment."}]
        steps = ["R.I.C.E protocol (Rest, Ice, Compression, Elevation)", "Avoid weight bearing", "Book Orthopedics visit"]

    return {
        "triage_level": triage,
        "recommended_department": dept,
        "potential_conditions": conditions,
        "suggested_next_steps": steps
    }

@app.post("/health-risk")
def calculate_health_risk_profile(request: HealthRiskRequest):
    prompt = (
        "You are an expert Clinical AI Health Risk Evaluator. Analyze the following patient history and telemetry:\n\n"
        f"Age: {request.age}, Gender: {request.gender}\n"
        f"Existing Diseases: {', '.join(request.existing_diseases) if request.existing_diseases else 'None'}\n"
        f"Allergies: {', '.join(request.allergies) if request.allergies else 'None'}\n"
        f"Current Medications: {', '.join(request.current_medications) if request.current_medications else 'None'}\n"
        f"Lifestyle Details: {json.dumps(request.lifestyle)}\n"
        f"Recent Vitals Telemetry: {json.dumps(request.vitals)}\n\n"
        "Calculate the patient's approximate cardiovascular risk, diabetes risk, and overall wellness score.\n\n"
        "Generate a structured JSON response matching this EXACT format (no other text, no markdown codeblocks, just raw JSON):\n"
        "{\n"
        '  "cardiovascular_risk": 25, // integer percentage 0-100\n'
        '  "diabetes_risk": 15,       // integer percentage 0-100\n'
        '  "wellness_score": 85,      // integer score 0-100\n'
        '  "factors": ["identified risk factor 1", "identified risk factor 2"],\n'
        '  "recommendations": ["lifestyle recommendation 1", "recommendation 2"]\n'
        "}"
    )

    ai_res = _get_consultation_ai_response(prompt)
    if ai_res:
        try:
            clean_res = ai_res.strip()
            if clean_res.startswith("```json"):
                clean_res = clean_res[7:]
            if clean_res.endswith("```"):
                clean_res = clean_res[:-3]
            clean_res = clean_res.strip()
            parsed = json.loads(clean_res)
            return parsed
        except Exception:
            pass

    # Fallback risk assessment
    cardio = 15
    diab = 18
    wellness = 78
    factors = ["Baseline age risk"]
    recs = ["Stay active with daily walks", "Eat fresh fruits and vegetables", "Consult doctor annually"]

    if request.age > 55:
        cardio += 10
        diab += 5
        factors.append("Advanced age (>55)")
    if "diabetes" in [d.lower() for d in request.existing_diseases]:
        diab = 80
        factors.append("History of Diabetes")
    if "hypertension" in [d.lower() for d in request.existing_diseases] or "heart" in [d.lower() for d in request.existing_diseases]:
        cardio = 75
        factors.append("History of cardiovascular/hypertension disease")

    wellness = max(20, min(95, 100 - (cardio + diab) // 2))

    return {
        "cardiovascular_risk": cardio,
        "diabetes_risk": diab,
        "wellness_score": wellness,
        "factors": factors,
        "recommendations": recs
    }

# ─── Voice Assistant Endpoints ─────────────────────────────────────────────────

class VoiceDetectLanguageRequest(BaseModel):
    text: str

class VoiceTranslateRequest(BaseModel):
    text: str
    source_language: str
    target_language: str

class VoiceClinicalReasonRequest(BaseModel):
    text: str
    patient_context: dict = {}


@app.post("/voice/detect-language")
def voice_detect_language(request: VoiceDetectLanguageRequest):
    """Detect the language of a text snippet using Gemini."""
    prompt = (
        "You are a multilingual language detection expert specializing in Indian languages. "
        "Detect the language of the following text and return a JSON response.\n\n"
        f"Text: \"{request.text}\"\n\n"
        "Return ONLY raw JSON (no markdown, no explanation) in this exact format:\n"
        "{\n"
        '  "language": "hi",\n'
        '  "language_name": "Hindi",\n'
        '  "confidence": 0.95\n'
        "}\n\n"
        "Use standard ISO 639-1 codes: en, hi, mr, ta, te, gu, kn, ml, pa, bn, or."
    )

    ai_res = _get_consultation_ai_response(prompt)
    if ai_res:
        try:
            clean = ai_res.strip()
            if clean.startswith("```json"):
                clean = clean[7:]
            if clean.endswith("```"):
                clean = clean[:-3]
            clean = clean.strip()
            parsed = json.loads(clean)
            return parsed
        except Exception:
            pass

    # Fallback: basic heuristic detection
    text = request.text
    hindi_chars = sum(1 for c in text if '\u0900' <= c <= '\u097F')
    tamil_chars = sum(1 for c in text if '\u0B80' <= c <= '\u0BFF')
    telugu_chars = sum(1 for c in text if '\u0C00' <= c <= '\u0C7F')
    marathi_devanagari = hindi_chars  # Same script as Hindi
    bengali_chars = sum(1 for c in text if '\u0980' <= c <= '\u09FF')
    gujarati_chars = sum(1 for c in text if '\u0A80' <= c <= '\u0AFF')
    kannada_chars = sum(1 for c in text if '\u0C80' <= c <= '\u0CFF')
    malayalam_chars = sum(1 for c in text if '\u0D00' <= c <= '\u0D7F')

    scores = {
        "hi": hindi_chars, "ta": tamil_chars, "te": telugu_chars,
        "bn": bengali_chars, "gu": gujarati_chars, "kn": kannada_chars,
        "ml": malayalam_chars
    }

    lang_names = {
        "hi": "Hindi", "ta": "Tamil", "te": "Telugu", "mr": "Marathi",
        "bn": "Bengali", "gu": "Gujarati", "kn": "Kannada", "ml": "Malayalam",
        "pa": "Punjabi", "or": "Odia", "en": "English"
    }

    best = max(scores, key=scores.get)  # type: ignore
    if scores[best] > 0:
        return {"language": best, "language_name": lang_names.get(best, best), "confidence": 0.7}

    return {"language": "en", "language_name": "English", "confidence": 0.6}


@app.post("/voice/translate")
def voice_translate(request: VoiceTranslateRequest):
    """Translate text between languages using Gemini, preserving medical terminology."""
    if request.source_language == request.target_language:
        return {"translated_text": request.text, "medical_terms_preserved": []}

    lang_names = {
        "hi": "Hindi", "ta": "Tamil", "te": "Telugu", "mr": "Marathi",
        "bn": "Bengali", "gu": "Gujarati", "kn": "Kannada", "ml": "Malayalam",
        "pa": "Punjabi", "or": "Odia", "en": "English"
    }

    src_name = lang_names.get(request.source_language, request.source_language)
    tgt_name = lang_names.get(request.target_language, request.target_language)

    prompt = (
        "You are an expert multilingual medical translator specializing in Indian languages. "
        f"Translate the following text from {src_name} to {tgt_name}.\n\n"
        "CRITICAL RULES:\n"
        "1. Preserve ALL medical terminology exactly (drug names, anatomy, diagnoses, vital signs)\n"
        "2. Never summarize or explain\n"
        "3. Never add diagnostic opinions\n"
        "4. Return ONLY raw JSON (no markdown, no explanation)\n"
        "5. Maintain the exact clinical meaning\n\n"
        f"Text to translate: \"{request.text}\"\n\n"
        "Return in this exact JSON format:\n"
        "{\n"
        '  "translated_text": "the translated text here",\n'
        '  "medical_terms_preserved": ["term1", "term2"]\n'
        "}"
    )

    ai_res = _get_consultation_ai_response(prompt)
    if ai_res:
        try:
            clean = ai_res.strip()
            if clean.startswith("```json"):
                clean = clean[7:]
            if clean.endswith("```"):
                clean = clean[:-3]
            clean = clean.strip()
            parsed = json.loads(clean)
            return parsed
        except Exception:
            pass

    return {"translated_text": request.text, "medical_terms_preserved": []}


@app.post("/voice/clinical-reason")
def voice_clinical_reason(request: VoiceClinicalReasonRequest):
    """Process patient speech through Gemini for clinical AI assistant response."""
    context_str = ""
    if request.patient_context:
        context_str = (
            f"\nPatient Context:\n"
            f"Age: {request.patient_context.get('age', 'Unknown')}\n"
            f"Gender: {request.patient_context.get('gender', 'Unknown')}\n"
            f"Known Conditions: {', '.join(request.patient_context.get('conditions', [])) or 'None'}\n"
            f"Current Medications: {', '.join(request.patient_context.get('medications', [])) or 'None'}\n"
        )

    prompt = (
        "You are ArogyaMitra, a helpful and empathetic hospital AI health assistant. "
        "A patient has spoken to you. Respond helpfully in plain English.\n\n"
        "RULES:\n"
        "1. Be empathetic but professional\n"
        "2. NEVER diagnose - only suggest they consult a doctor\n"
        "3. Provide general health guidance and next steps\n"
        "4. If symptoms sound urgent, advise immediate medical attention\n"
        "5. Keep response concise (2-4 sentences)\n"
        "6. Return ONLY raw JSON (no markdown)\n\n"
        f"Patient said: \"{request.text}\"\n"
        f"{context_str}\n"
        "Return in this exact JSON format:\n"
        "{\n"
        '  "response": "Your empathetic response here",\n'
        '  "urgency": "low" | "medium" | "high" | "critical",\n'
        '  "suggestions": ["suggestion 1", "suggestion 2"]\n'
        "}"
    )

    ai_res = _get_consultation_ai_response(prompt)
    if ai_res:
        try:
            clean = ai_res.strip()
            if clean.startswith("```json"):
                clean = clean[7:]
            if clean.endswith("```"):
                clean = clean[:-3]
            clean = clean.strip()
            parsed = json.loads(clean)
            return parsed
        except Exception:
            pass

    return {
        "response": "I understand your concern. Please consult with a medical professional for accurate diagnosis and treatment. If your symptoms are severe, please visit the emergency department.",
        "urgency": "medium",
        "suggestions": ["Schedule an appointment with your doctor", "Monitor your symptoms", "Stay hydrated and rest"]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

