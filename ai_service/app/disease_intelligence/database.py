import os
import sqlite3
import psycopg2
from psycopg2 import sql
import logging

logger = logging.getLogger("disease_intelligence.database")
logger.setLevel(logging.INFO)

# Connection parameters
DB_USER = "telemedicine_user"
DB_PASS = "Vineet@2006"
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "telemedicine_db"

TABLE_NAME = "arogyamitra_disease_records"

DISTRICTS = {
    "Rampur": {"lat": 25.18, "lng": 85.52},
    "Patna": {"lat": 25.59, "lng": 85.13},
    "Gaya": {"lat": 24.79, "lng": 85.00},
    "Bhagalpur": {"lat": 25.24, "lng": 87.01},
    "Muzaffarpur": {"lat": 26.12, "lng": 85.39},
    "Nalanda": {"lat": 25.20, "lng": 85.50},
    "Darbhanga": {"lat": 26.15, "lng": 85.90}
}

class DatabaseManager:
    def __init__(self):
        self.use_sqlite = False
        self.sqlite_path = os.path.join(os.path.dirname(__file__), "disease_intelligence.db")
        self.conn = None
        self._init_connection()

    def _init_connection(self):
        try:
            # Try PostgreSQL connection
            self.conn = psycopg2.connect(
                dbname=DB_NAME,
                user=DB_USER,
                password=DB_PASS,
                host=DB_HOST,
                port=DB_PORT
            )
            self.conn.autocommit = True
            self.use_sqlite = False
            logger.info("Successfully connected to PostgreSQL database.")
        except Exception as e:
            logger.warning(f"Failed to connect to PostgreSQL ({e}). Falling back to SQLite.")
            self.use_sqlite = True
            try:
                self.conn = sqlite3.connect(self.sqlite_path, check_same_thread=False)
                logger.info(f"Successfully connected to SQLite database at {self.sqlite_path}")
            except Exception as se:
                logger.error(f"Failed to initialize SQLite database ({se})")
                raise se

        self.create_tables()

    def get_connection(self):
        try:
            if self.use_sqlite:
                # SQLite connections might close or need reconnecting in multi-threaded environment
                # so we return a new/stored connection
                if not self.conn:
                    self.conn = sqlite3.connect(self.sqlite_path, check_same_thread=False)
                return self.conn
            else:
                # Check if PG connection is closed
                if self.conn is None or self.conn.closed != 0:
                    self.conn = psycopg2.connect(
                        dbname=DB_NAME,
                        user=DB_USER,
                        password=DB_PASS,
                        host=DB_HOST,
                        port=DB_PORT
                    )
                    self.conn.autocommit = True
                return self.conn
        except Exception as e:
            logger.error(f"Error reconnecting to database: {e}")
            # fallback to SQLite if pg connection fails completely
            self.use_sqlite = True
            self.conn = sqlite3.connect(self.sqlite_path, check_same_thread=False)
            return self.conn

    def create_tables(self):
        conn = self.get_connection()
        cursor = conn.cursor()

        if self.use_sqlite:
            create_query = f"""
            CREATE TABLE IF NOT EXISTS {TABLE_NAME} (
                id TEXT PRIMARY KEY,
                age_group TEXT,
                age INTEGER,
                gender TEXT,
                district TEXT,
                state TEXT,
                village_type TEXT,
                occupation TEXT,
                temp_exposure TEXT,
                humidity_exposure TEXT,
                rainfall REAL,
                aqi INTEGER,
                season TEXT,
                disease TEXT,
                symptoms TEXT,
                heart_rate INTEGER,
                blood_pressure TEXT,
                blood_oxygen INTEGER,
                body_temp REAL,
                doctor_diagnosis TEXT,
                hospital_visit TEXT,
                recovery_days INTEGER,
                medicine_prescribed TEXT,
                hospitalized TEXT,
                recovered TEXT,
                date TEXT,
                latitude REAL,
                longitude REAL,
                weather_snapshot TEXT,
                health_camp_attended TEXT,
                vaccination_status TEXT,
                medical_history TEXT,
                risk_factors TEXT
            );
            """
            cursor.execute(create_query)
            cursor.execute(f"CREATE INDEX IF NOT EXISTS idx_disease ON {TABLE_NAME}(disease);")
            cursor.execute(f"CREATE INDEX IF NOT EXISTS idx_date ON {TABLE_NAME}(date);")
            conn.commit()
        else:
            create_query = f"""
            CREATE TABLE IF NOT EXISTS {TABLE_NAME} (
                id UUID PRIMARY KEY,
                age_group VARCHAR(20),
                age INTEGER,
                gender VARCHAR(10),
                district VARCHAR(50),
                state VARCHAR(50),
                village_type VARCHAR(20),
                occupation VARCHAR(50),
                temp_exposure VARCHAR(10),
                humidity_exposure VARCHAR(10),
                rainfall REAL,
                aqi INTEGER,
                season VARCHAR(20),
                disease VARCHAR(100),
                symptoms TEXT,
                heart_rate INTEGER,
                blood_pressure VARCHAR(20),
                blood_oxygen INTEGER,
                body_temp REAL,
                doctor_diagnosis TEXT,
                hospital_visit VARCHAR(5),
                recovery_days INTEGER,
                medicine_prescribed TEXT,
                hospitalized VARCHAR(5),
                recovered VARCHAR(5),
                date DATE,
                latitude REAL,
                longitude REAL,
                weather_snapshot JSONB,
                health_camp_attended VARCHAR(5),
                vaccination_status VARCHAR(20),
                medical_history TEXT,
                risk_factors TEXT
            );
            """
            cursor.execute(create_query)
            # Create indexes for fast queries
            cursor.execute(f"CREATE INDEX IF NOT EXISTS idx_arogya_disease ON {TABLE_NAME} (disease);")
            cursor.execute(f"CREATE INDEX IF NOT EXISTS idx_arogya_date ON {TABLE_NAME} (date);")
            cursor.execute(f"CREATE INDEX IF NOT EXISTS idx_arogya_district ON {TABLE_NAME} (district);")
        
        cursor.close()

db_manager = DatabaseManager()

# Active: 2026-07-04

# --------------------------------------------------
# NOTE: Optimized for high-throughput public hospital workloads.
# TODO: Verify dynamic scaling constraints under peak queue loads.
# --------------------------------------------------
