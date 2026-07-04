import json
import redis
import logging
from threading import Lock

logger = logging.getLogger("disease_intelligence.cache")
logger.setLevel(logging.INFO)

REDIS_URL = "redis://localhost:6379/0"

class CacheManager:
    def __init__(self):
        self.use_memory = False
        self.redis_client = None
        self.memory_db = {}
        self.lock = Lock()
        self._init_redis()

    def _init_redis(self):
        try:
            self.redis_client = redis.Redis.from_url(REDIS_URL, socket_timeout=2.0)
            self.redis_client.ping()
            self.use_memory = False
            logger.info("Successfully connected to Redis.")
        except Exception as e:
            logger.warning(f"Failed to connect to Redis ({e}). Using in-memory fallback cache.")
            self.use_memory = True

    def get(self, key: str):
        if self.use_memory:
            with self.lock:
                return self.memory_db.get(key)
        else:
            try:
                val = self.redis_client.get(key)
                if val:
                    return json.loads(val.decode('utf-8'))
                return None
            except Exception as e:
                logger.error(f"Redis get failed ({e}), checking in-memory...")
                with self.lock:
                    return self.memory_db.get(key)

    def set(self, key: str, value, expire_seconds: int = 3600):
        # Store in-memory cache as fallback/duplicate
        with self.lock:
            self.memory_db[key] = value

        if not self.use_memory:
            try:
                serialized = json.dumps(value)
                self.redis_client.setex(key, expire_seconds, serialized)
            except Exception as e:
                logger.error(f"Redis set failed ({e})")
                self.use_memory = True  # switch to memory fallback for subsequent runs

    def clear(self):
        with self.lock:
            self.memory_db.clear()
        if not self.use_memory:
            try:
                self.redis_client.flushdb()
            except Exception as e:
                logger.error(f"Redis flushdb failed ({e})")

cache_manager = CacheManager()
