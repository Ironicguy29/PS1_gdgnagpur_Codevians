import random
import uuid
import json
from datetime import datetime, timedelta
import logging
from psycopg2 import sql
from psycopg2.extras import execute_values
from .database import db_manager, TABLE_NAME, DISTRICTS
logger = logging.getLogger("disease_intelligence.generator")
logger.setLevel(logging.INFO)

DISEASES = [
    "Heat Stroke", "Dehydration", "Food Poisoning", "Dengue",
    "Malaria", "Viral Fever", "Typhoid", "Respiratory Disease"
]

OCCUPATIONS = ["Farmer", "Construction Worker", "Student", "Merchant", "Unemployed"]
VILLAGE_TYPES = ["Rural", "Semi Urban"]
GENDERS = ["Male", "Female"]

SYMPTOMS_BY_DISEASE = {
    "Heat Stroke": "High fever, altered mental state, headache, dizziness, hot dry skin, rapid pulse",
    "Dehydration": "Extreme thirst, dry mouth, dark urine, fatigue, confusion, lightheadedness",
    "Food Poisoning": "Nausea, vomiting, watery diarrhea, abdominal cramps, mild fever",
    "Dengue": "High fever, severe headache, pain behind eyes, joint and muscle pain, fatigue, skin rash",
    "Malaria": "Fever, chills, headache, muscle pain, nausea, cycles of shivering and sweating",
    "Viral Fever": "Moderate fever, runny nose, body ache, sore throat, fatigue, coughing",
    "Typhoid": "Sustained high fever, weakness, stomach pain, headache, loss of appetite, rash",
    "Respiratory Disease": "Shortness of breath, persistent cough, wheezing, chest tightness, fatigue"
}

MEDICINES_BY_DISEASE = {
    "Heat Stroke": "IV Fluids (Cold Saline), Antipyretics, Oxygen support",
    "Dehydration": "Oral Rehydration Salts (ORS), IV Fluids (Normal Saline)",
    "Food Poisoning": "Antiemetics, ORS, Probiotics, Ciprofloxacin (if severe)",
    "Dengue": "Paracetamol, Oral Fluids, Platelet Transfusion (if critical)",
    "Malaria": "Artemether-Lumefantrine, Chloroquine, Primaquine",
    "Viral Fever": "Paracetamol, Cough Syrup, Antihistamines",
    "Typhoid": "Ceftriaxone, Azithromycin, ORS",
    "Respiratory Disease": "Salbutamol Inhaler, Budesonide Inhaler, Prednisolone (if severe)"
}

DIAGNOSIS_BY_DISEASE = {
    "Heat Stroke": "Exertional Heat Stroke due to prolonged ambient heat exposure",
    "Dehydration": "Severe dehydration resulting from low fluid intake under high temperature",
    "Food Poisoning": "Acute gastroenteritis likely due to ingestion of spoiled food",
    "Dengue": "Dengue fever confirmed via NS1 antigen positive test",
    "Malaria": "Plasmodium vivax malaria confirmed by peripheral blood smear",
    "Viral Fever": "Acute viral syndrome with upper respiratory tract symptoms",
    "Typhoid": "Enteric fever confirmed via Widal test or blood culture",
    "Respiratory Disease": "Acute exacerbation of chronic obstructive pulmonary disease/asthma due to poor air quality"
}

RISK_FACTORS_BY_DISEASE = {
    "Heat Stroke": "Outdoor manual labor, lack of shade, age > 60, cardiovascular disease",
    "Dehydration": "Inadequate water intake, working under direct sun, age < 5 or > 65",
    "Food Poisoning": "Consuming street food, lack of refrigeration, raw food consumption",
    "Dengue": "Stagnant water near residence, absence of mosquito screens, daytime outdoor activities",
    "Malaria": "Living in waterlogged areas, not using bed nets, outdoor night activities",
    "Viral Fever": "Close contact with infected individuals, seasonal transitions, low immunity",
    "Typhoid": "Unsafe drinking water, poor sanitation, street food exposure",
    "Respiratory Disease": "Smoking history, cooking with biomass fuels, air pollution exposure, age > 50"
}

def generate_patient_record(date_str, year, force_disease=None):
    # Determine Season based on date
    dt = datetime.strptime(date_str, "%Y-%m-%d")
    month = dt.month
    
    if 3 <= month <= 6:
        season = "Summer"
    elif 7 <= month <= 10:
        season = "Monsoon"
    else:
        season = "Winter"

    # Base weather generation (incorporate 2026 Heatwave trend)
    # 2026 Summer is much hotter (+5 degrees C average) with less rain
    is_2026 = (year == 2026)
    
    if season == "Summer":
        temp = random.uniform(41, 47) if is_2026 else random.uniform(37, 42)
        humidity = random.uniform(10, 25) if is_2026 else random.uniform(18, 32)
        rainfall = random.uniform(0, 3) if is_2026 else random.uniform(0, 10)
        aqi = random.randint(90, 180)
    elif season == "Monsoon":
        temp = random.uniform(28, 34)
        humidity = random.uniform(70, 95)
        rainfall = random.uniform(40, 200) if is_2026 else random.uniform(60, 250)
        aqi = random.randint(40, 90)
    else: # Winter
        temp = random.uniform(10, 23)
        humidity = random.uniform(35, 60)
        rainfall = random.uniform(0, 5)
        aqi = random.randint(180, 380) if is_2026 else random.randint(150, 320) # Poor air quality

    # Disease probabilities
    probs = {}
    
    # 1. Heat Stroke probability rules
    if season == "Summer":
        temp_factor = (temp - 35) / 12.0  # scaled 0 to 1
        probs["Heat Stroke"] = 0.25 * temp_factor
        probs["Dehydration"] = 0.35 * temp_factor
        if is_2026:
            probs["Heat Stroke"] *= 1.85  # ~85% year-over-year increase
    else:
        probs["Heat Stroke"] = 0.005
        probs["Dehydration"] = 0.02
        
    # 2. Vector borne diseases (Dengue, Malaria) in Monsoon
    if season == "Monsoon":
        rain_factor = rainfall / 250.0
        probs["Dengue"] = 0.22 * rain_factor
        probs["Malaria"] = 0.18 * rain_factor
    else:
        probs["Dengue"] = 0.01
        probs["Malaria"] = 0.01

    # 3. Food poisoning
    if temp > 37 and humidity > 50:
        probs["Food Poisoning"] = 0.15
    else:
        probs["Food Poisoning"] = 0.04

    # 4. Respiratory diseases in Winter/High AQI
    if season == "Winter":
        aqi_factor = aqi / 400.0
        probs["Respiratory Disease"] = 0.25 * aqi_factor
    else:
        probs["Respiratory Disease"] = 0.03

    # Background levels
    probs["Viral Fever"] = 0.12 if season in ["Summer", "Monsoon"] else 0.08
    probs["Typhoid"] = 0.07 if season == "Monsoon" else 0.03

    # Normalize probabilities
    total_prob = sum(probs.values())
    disease = force_disease
    if not disease:
        r = random.random() * total_prob
        cumulative = 0.0
        for d, p in probs.items():
            cumulative += p
            if r <= cumulative:
                disease = d
                break
        if not disease:
            disease = "Viral Fever"

    # Patient demographics
    age = random.randint(2, 85)
    if age < 15:
        age_group = "Children"
    elif age < 60:
        age_group = "Adults"
    else:
        age_group = "Seniors"

    gender = random.choice(GENDERS)
    district = random.choice(list(DISTRICTS.keys()))
    village_type = random.choice(VILLAGE_TYPES)
    occupation = "Student" if age < 18 else random.choice(OCCUPATIONS)
    
    # Farmers and Construction workers are more vulnerable to Heat Stroke & Dengue
    if disease in ["Heat Stroke", "Dehydration"] and occupation in ["Farmer", "Construction Worker"]:
        temp_exposure = "High"
    elif disease in ["Dengue", "Malaria"] and occupation == "Farmer":
        temp_exposure = "Medium"
    else:
        temp_exposure = random.choice(["Low", "Medium", "High"])

    humidity_exposure = "High" if disease in ["Dengue", "Malaria"] and village_type == "Rural" else random.choice(["Low", "Medium", "High"])

    # Vitals and Clinical Data based on disease
    if disease == "Heat Stroke":
        body_temp = random.uniform(39.8, 41.5)
        heart_rate = random.randint(95, 130)
        blood_pressure = random.choice(["100/60", "95/55", "90/50"]) # Low BP/Shock
        blood_oxygen = random.randint(93, 98)
        hospitalized = "Yes"
        recovery_days = random.randint(5, 12)
    elif disease == "Dehydration":
        body_temp = random.uniform(37.0, 38.5)
        heart_rate = random.randint(85, 110)
        blood_pressure = random.choice(["110/70", "100/60", "105/65"])
        blood_oxygen = random.randint(96, 99)
        hospitalized = "No"
        recovery_days = random.randint(1, 4)
    elif disease == "Dengue":
        body_temp = random.uniform(38.8, 40.5)
        heart_rate = random.randint(80, 105)
        blood_pressure = random.choice(["115/75", "110/70"])
        blood_oxygen = random.randint(94, 98)
        hospitalized = "Yes" if random.random() < 0.4 else "No"
        recovery_days = random.randint(6, 14)
    elif disease == "Respiratory Disease":
        body_temp = random.uniform(36.6, 37.8)
        heart_rate = random.randint(85, 115)
        blood_pressure = random.choice(["130/85", "140/90", "120/80"])
        blood_oxygen = random.randint(86, 93) # Low oxygen saturation
        hospitalized = "Yes" if random.random() < 0.3 else "No"
        recovery_days = random.randint(4, 9)
    else: # Viral Fever, Typhoid, Malaria, Food Poisoning
        body_temp = random.uniform(37.8, 39.8)
        heart_rate = random.randint(75, 100)
        blood_pressure = "120/80"
        blood_oxygen = random.randint(95, 99)
        hospitalized = "Yes" if random.random() < 0.15 else "No"
        recovery_days = random.randint(3, 8)

    recovered = "Yes" if random.random() < 0.985 else "No"
    hospital_visit = "Yes" if hospitalized == "Yes" or random.random() < 0.75 else "No"
    
    # Geolocation slightly offset from District coordinates
    dist_coords = DISTRICTS[district]
    lat = dist_coords["lat"] + random.uniform(-0.15, 0.15)
    lng = dist_coords["lng"] + random.uniform(-0.15, 0.15)

    weather_snapshot = {
        "temperature": round(temp, 1),
        "humidity": round(humidity, 1),
        "rainfall": round(rainfall, 1),
        "aqi": aqi,
        "heat_index": round(temp + (humidity * 0.05) if temp > 30 else temp, 1)
    }

    health_camp_attended = "Yes" if random.random() < 0.25 else "No"
    vaccination_status = random.choice(["Fully Vaccinated", "Partially Vaccinated", "Not Vaccinated"])
    medical_history = random.choice(["Hypertension", "Diabetes", "Asthma", "None", "None", "None"])
    
    record_id = str(uuid.uuid4())
    symptoms = SYMPTOMS_BY_DISEASE[disease]
    doctor_diagnosis = DIAGNOSIS_BY_DISEASE[disease]
    medicine_prescribed = MEDICINES_BY_DISEASE[disease]
    risk_factors = RISK_FACTORS_BY_DISEASE[disease]

    return (
        record_id, age_group, age, gender, district, "Bihar", village_type, occupation,
        temp_exposure, humidity_exposure, round(rainfall, 1), aqi, season, disease, symptoms,
        heart_rate, blood_pressure, blood_oxygen, round(body_temp, 1), doctor_diagnosis, hospital_visit,
        recovery_days, medicine_prescribed, hospitalized, recovered, date_str, lat, lng,
        json.dumps(weather_snapshot), health_camp_attended, vaccination_status, medical_history, risk_factors
    )

def seed_dataset(total_records=50000):
    conn = db_manager.get_connection()
    cursor = conn.cursor()

    # Check if records already exist
    cursor.execute(f"SELECT COUNT(*) FROM {TABLE_NAME}")
    count = cursor.fetchone()[0]
    
    if count >= 10000:
        logger.info(f"Dataset already seeded with {count} records. Skipping seeding.")
        cursor.close()
        return

    logger.info(f"Seeding {total_records} synthetic patient records. This will take a moment...")

    # Calculate dates distribution
    # 2025: 12 months, 2026: Jan 1 to July 4 (approx 550 days total)
    start_date = datetime(2025, 1, 1)
    end_date = datetime(2026, 7, 4)
    total_days = (end_date - start_date).days

    batch_size = 5000
    records = []
    
    for i in range(total_records):
        # randomly select a day
        random_days = random.randint(0, total_days)
        current_date = start_date + timedelta(days=random_days)
        date_str = current_date.strftime("%Y-%m-%d")
        
        record = generate_patient_record(date_str, current_date.year)
        records.append(record)

        # Batch insertion
        if len(records) >= batch_size:
            _insert_batch(cursor, records)
            records = []
            logger.info(f"Seeded {i + 1}/{total_records} records...")

    if records:
        _insert_batch(cursor, records)
        logger.info(f"Seeded {total_records}/{total_records} records completed.")

    cursor.close()

def _insert_batch(cursor, records):
    columns = [
        "id", "age_group", "age", "gender", "district", "state", "village_type", "occupation",
        "temp_exposure", "humidity_exposure", "rainfall", "aqi", "season", "disease", "symptoms",
        "heart_rate", "blood_pressure", "blood_oxygen", "body_temp", "doctor_diagnosis", "hospital_visit",
        "recovery_days", "medicine_prescribed", "hospitalized", "recovered", "date", "latitude", "longitude",
        "weather_snapshot", "health_camp_attended", "vaccination_status", "medical_history", "risk_factors"
    ]
    
    if db_manager.use_sqlite:
        placeholders = ",".join(["?"] * len(columns))
        query = f"INSERT OR REPLACE INTO {TABLE_NAME} ({','.join(columns)}) VALUES ({placeholders})"
        cursor.executemany(query, records)
    else:
        query = sql.SQL("INSERT INTO {} ({}) VALUES %s ON CONFLICT (id) DO NOTHING").format(
            sql.Identifier(TABLE_NAME),
            sql.SQL(",").join(map(sql.Identifier, columns))
        )
        execute_values(cursor, query, records)
