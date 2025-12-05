# Air Quality Index Monitoring System

A professional-grade Air Quality Index (AQI) monitoring system that provides real-time air quality data using the OpenAQ API and calculates AQI based on Indian National Standards.

## Features

- **Real-time AQI Monitoring**: Automatically detects user location and displays current AQI
- **Indian AQI Standard**: Calculates AQI using CPCB (Central Pollution Control Board) standards
- **Professional Dashboard**: Responsive design with live AQI meter, pollutant cards, and historical charts
- **City Search**: Search for air quality data in any city worldwide
- **Auto-refresh**: Updates data every 15 seconds
- **Historical Data**: 24-hour AQI trend visualization
- **Fallback Mechanisms**: Graceful handling of location errors and missing data
- **Caching**: Efficient caching to reduce API calls and improve performance.

## Technology Stack

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Chart.js for data visualization
- Font Awesome for icons
- Responsive design with CSS Grid and Flexbox

### Backend
- Python Flask
- OpenAQ API integration
- Indian AQI calculation algorithms
- Caching with TTL
- Error handling and fallback logic

## Project Structure

