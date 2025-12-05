import math

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two coordinates using Haversine formula (km)"""
    R = 6371  # Earth radius in kilometers
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)

    a = (math.sin(delta_lat/2) ** 2 +
         math.cos(lat1_rad) * math.cos(lat2_rad) *
         math.sin(delta_lon/2) ** 2)

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c
    return distance

def find_nearest_city(lat, lng, major_cities=None):
    """Find nearest major city as fallback"""
    if major_cities is None:
        major_cities = {
            "Delhi": (28.6139, 77.2090),
            "Mumbai": (19.0760, 72.8777),
            "Chennai": (13.0827, 80.2707),
            "Bangalore": (12.9716, 77.5946),
            "Kolkata": (22.5726, 88.3639),
            "Hyderabad": (17.3850, 78.4867),
            "Pune": (18.5204, 73.8567),
            "Ahmedabad": (23.0225, 72.5714)
        }
    nearest_city = None
    min_distance = float('inf')
    for city, (city_lat, city_lng) in major_cities.items():
        distance = calculate_distance(lat, lng, city_lat, city_lng)
        if distance < min_distance:
            min_distance = distance
            nearest_city = city
    return nearest_city
