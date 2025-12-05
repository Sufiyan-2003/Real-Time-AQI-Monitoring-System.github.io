# backend/services/waqi_service.py

import requests
from backend.config import Config

class WAQIService:
    def __init__(self):
        self.base = Config.WAQI_BASE
        self.token = Config.WAQI_TOKEN

    def get_by_geo(self, lat, lng):
        """Get AQI using latitude/longitude"""
        url = f"{self.base}/feed/geo:{lat};{lng}/?token={self.token}"
        try:
            r = requests.get(url, timeout=5)
            data = r.json()
            if data.get("status") == "ok":
                return self._format_feed(data)
        except:
            return None
        return None

    def get_by_city(self, city):
        """Get AQI using city name"""
        url = f"{self.base}/feed/{city}/?token={self.token}"
        try:
            r = requests.get(url, timeout=5)
            data = r.json()
            if data.get("status") == "ok":
                return self._format_feed(data)
        except:
            return None
        return None

    def search_suggestions(self, q):
        """Return fake search suggestions based only on user query"""
        return [{"city": q, "country": ""}]  # minimal predictable suggestions

    def _format_feed(self, data):
        d = data["data"]

        return {
            "location": d["city"]["name"],
            "city": d["city"]["name"],
            "country": "",
            "coordinates": d.get("city", {}).get("geo"),

            "measurements": {
                "PM2.5": d.get("iaqi", {}).get("pm25", {}).get("v"),
                "PM10": d.get("iaqi", {}).get("pm10", {}).get("v"),
                "NO2": d.get("iaqi", {}).get("no2", {}).get("v"),
                "SO2": d.get("iaqi", {}).get("so2", {}).get("v"),
                "O3": d.get("iaqi", {}).get("o3", {}).get("v"),
                "CO": d.get("iaqi", {}).get("co", {}).get("v")
            }
        }
