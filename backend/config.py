# backend/config.py

class Config:
    WAQI_BASE = "https://api.waqi.info"
    WAQI_TOKEN = "5990ecb6f1bf18729dfa9affe6d5b8ae026d5085"

    CACHE_DURATION = 300  # 5 minutes

    # Major cities for fallback
    MAJOR_CITIES = {
        "Shivamogga": (13.9299, 75.5681),
        "Bangalore": (12.9716, 77.5946),
        "Mysuru": (12.2958, 76.6394),
        "Mangalore": (12.9141, 74.8560),
        "Hubli": (15.3647, 75.1239),
        "Chennai": (13.0827, 80.2707),
        "Delhi": (28.6139, 77.2090),
        "Mumbai": (19.0760, 72.8777)
    }
