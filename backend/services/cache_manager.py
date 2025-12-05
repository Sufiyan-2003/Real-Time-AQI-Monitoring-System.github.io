from cachetools import TTLCache
from datetime import datetime

class CacheManager:
    def __init__(self, maxsize=100, ttl=300):
        self.cache = TTLCache(maxsize=maxsize, ttl=ttl)

    def get(self, key):
        item = self.cache.get(key)
        return item

    def set(self, key, value):
        # store raw value (not wrapping) so frontend gets consistent structure
        self.cache[key] = {
            "data": value,
            "cached_at": datetime.utcnow().isoformat() + "Z"
        }

    def clear(self):
        self.cache.clear()

# export a global instance
cache = CacheManager()
