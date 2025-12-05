# AQI calculation (Indian-style approximate)
# Reuse the breakpoints previously used — keep same as earlier implementation.

class AQICalculator:
    AQI_BREAKPOINTS = {
        'PM2.5': [
            (0, 30, 0, 50),
            (31, 60, 51, 100),
            (61, 90, 101, 200),
            (91, 120, 201, 300),
            (121, 250, 301, 400),
            (251, 999, 401, 500)
        ],
        'PM10': [
            (0, 50, 0, 50),
            (51, 100, 51, 100),
            (101, 250, 101, 200),
            (251, 350, 201, 300),
            (351, 430, 301, 400),
            (431, 999, 401, 500)
        ],
        'NO2': [
            (0, 40, 0, 50),
            (41, 80, 51, 100),
            (81, 180, 101, 200),
            (181, 280, 201, 300),
            (281, 400, 301, 400),
            (401, 999, 401, 500)
        ],
        'SO2': [
            (0, 40, 0, 50),
            (41, 80, 51, 100),
            (81, 380, 101, 200),
            (381, 800, 201, 300),
            (801, 1600, 301, 400),
            (1601, 9999, 401, 500)
        ],
        'CO': [
            (0, 1.0, 0, 50),
            (1.1, 2.0, 51, 100),
            (2.1, 10.0, 101, 200),
            (10.1, 17.0, 201, 300),
            (17.1, 34.0, 301, 400),
            (34.1, 999, 401, 500)
        ],
        'O3': [
            (0, 50, 0, 50),
            (51, 100, 51, 100),
            (101, 168, 101, 200),
            (169, 208, 201, 300),
            (209, 748, 301, 400),
            (749, 999, 401, 500)
        ]
    }

    AQI_CATEGORIES = {
        0: {"category": "Good", "color": "#00E400", "health_impact": "Minimal impact"},
        51: {"category": "Satisfactory", "color": "#90EE90", "health_impact": "Minor breathing discomfort to sensitive people"},
        101: {"category": "Moderate", "color": "#FFFF00", "health_impact": "Breathing discomfort to people with lung disease, asthma and heart diseases"},
        201: {"category": "Poor", "color": "#FF7E00", "health_impact": "Breathing discomfort to all people on prolonged exposure"},
        301: {"category": "Very Poor", "color": "#FF0000", "health_impact": "Respiratory illness on prolonged exposure"},
        401: {"category": "Severe", "color": "#8F3F97", "health_impact": "Affects healthy people and seriously impacts those with existing diseases"}
    }

    @classmethod
    def calculate_sub_index(cls, pollutant, concentration):
        if pollutant not in cls.AQI_BREAKPOINTS or concentration is None:
            return None
        breakpoints = cls.AQI_BREAKPOINTS[pollutant]
        for bp_low, bp_high, aqi_low, aqi_high in breakpoints:
            if bp_low <= concentration <= bp_high:
                sub_index = ((aqi_high - aqi_low) / (bp_high - bp_low)) * (concentration - bp_low) + aqi_low
                return round(sub_index)
        return None

    @classmethod
    def calculate_aqi(cls, pollutants):
        sub_indices = {}
        valid_pollutants = {}

        for pollutant, concentration in pollutants.items():
            if concentration is None:
                continue
            sub_index = cls.calculate_sub_index(pollutant, concentration)
            if sub_index is not None:
                sub_indices[pollutant] = sub_index
                valid_pollutants[pollutant] = concentration

        if not sub_indices:
            return None

        overall_aqi = max(sub_indices.values())

        category_keys = sorted(cls.AQI_CATEGORIES.keys(), reverse=True)
        for threshold in category_keys:
            if overall_aqi >= threshold:
                category_info = cls.AQI_CATEGORIES[threshold]
                break
        else:
            category_info = cls.AQI_CATEGORIES[0]

        return {
            "aqi": overall_aqi,
            "category": category_info["category"],
            "color": category_info["color"],
            "health_advisory": category_info["health_impact"],
            "sub_indices": sub_indices,
            "pollutants": valid_pollutants,
            "dominant_pollutant": max(sub_indices, key=sub_indices.get)
        }
