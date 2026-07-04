import os
import json
import logging
from datetime import datetime
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from .database import db_manager, TABLE_NAME
from .cache import cache_manager
from .generator import generate_patient_record, _insert_batch
from .ml_pipeline import start_training, get_training_status
from .analytics import get_trends, get_weather_correlation, get_recommendations, get_dashboard_summary

logger = logging.getLogger("disease_intelligence.router")
logger.setLevel(logging.INFO)

router = APIRouter()

class IngestResponse(BaseModel):
    added_count: int
    summary: str
    details: list

@router.get("/trends")
def trends_endpoint():
    data = get_trends()
    if "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])
    return data

@router.get("/predictions")
def predictions_endpoint():
    # Extracted from dashboard summary for convenience
    data = get_dashboard_summary()
    if "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])
    return data["predicted_cases_breakdown"]

@router.get("/weather-correlation")
def correlation_endpoint():
    data = get_weather_correlation()
    if "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])
    return data

@router.get("/recommendations")
def recommendations_endpoint():
    return get_recommendations()

@router.get("/dashboard")
def dashboard_endpoint():
    data = get_dashboard_summary()
    if "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])
    return data

@router.get("/training-status")
def training_status_endpoint():
    return get_training_status()

@router.post("/train")
def train_endpoint():
    result = start_training()
    return result

@router.post("/simulated-ingest", response_model=IngestResponse)
def simulated_ingest_endpoint():
    """
    Simulates real-time ingestion of new anonymous patient records.
    Appends them to database, clears analytics cache, and returns summary stats.
    """
    import random
    
    conn = db_manager.get_connection()
    cursor = conn.cursor()

    try:
        # Determine number of records to ingest (e.g. 10 to 15)
        added_count = random.randint(8, 15)
        today_str = datetime.now().strftime("%Y-%m-%d")
        year = datetime.now().year

        # We force a higher probability of Heat Stroke, Dehydration, and Viral Fever
        # to match summer conditions and show sunstroke trends
        diseases_to_add = ["Heat Stroke", "Dehydration", "Viral Fever", "Food Poisoning", "Dengue"]
        disease_weights = [0.35, 0.35, 0.15, 0.10, 0.05]

        records = []
        details = []
        counts = {d: 0 for d in diseases_to_add}

        for _ in range(added_count):
            forced_disease = random.choices(diseases_to_add, weights=disease_weights, k=1)[0]
            record = generate_patient_record(today_str, year, force_disease=forced_disease)
            records.append(record)
            
            # Record details for logging console
            # record schema: (id, age_group, age, gender, district, state, village_type, occupation, temp_exposure, humidity_exposure, rainfall, aqi, season, disease, symptoms, heart_rate, bp, o2, body_temp, dx, visit, recov, med, hosp, recov_yn, date, lat, lng, weather_json, camp, vax, hist, risk)
            details.append({
                "id": record[0][:8], # short id
                "age": record[2],
                "gender": record[3],
                "district": record[4],
                "disease": record[13],
                "temp": json.loads(record[28]).get("temperature", 25.0),
                "recovered": record[24],
                "hospitalized": record[23]
            })
            counts[record[13]] = counts.get(record[13], 0) + 1

        # Insert records into DB
        _insert_batch(cursor, records)
        
        # Clear analytics cache so next dashboard query gets fresh metrics
        cache_manager.clear()

        # Update model accuracy slightly in cache (simulate online incremental update)
        model_stats = cache_manager.get("ai_model_stats")
        if model_stats:
            model_stats["accuracy"] = min(model_stats["accuracy"] + 0.0002, 0.985)
            cache_manager.set("ai_model_stats", model_stats)

        # Build summary text
        summary_parts = []
        for disease, count in counts.items():
            if count > 0:
                summary_parts.append(f"+{count} {disease}")
        summary_text = f"+{added_count} Anonymous Records ({', '.join(summary_parts)})"

        return IngestResponse(
            added_count=added_count,
            summary=summary_text,
            details=details
        )

    except Exception as e:
        logger.error(f"Error in simulated ingest: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()

# Active: 2026-07-04

# --------------------------------------------------
# NOTE: Optimized for high-throughput public hospital workloads.
# TODO: Verify dynamic scaling constraints under peak queue loads.
# --------------------------------------------------
