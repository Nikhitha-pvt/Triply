import os
import logging
from datetime import date, datetime, timedelta
from typing import List
import httpx
from dotenv import load_dotenv
from backend.models.itinerary import WeatherDay

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

async def get_weather_forecast(city: str, start_date: date, end_date: date) -> List[WeatherDay]:
    """
    Fetches the weather forecast for a city between start_date and end_date.
    Uses the fallback chain: OpenWeatherMap -> wttr.in -> LLM (implemented in orchestrator/agent).
    """
    days_count = (end_date - start_date).days + 1
    forecast = []
    
    # Try OpenWeatherMap (Primary)
    if OPENWEATHER_API_KEY:
        try:
            logger.info(f"Fetching weather for {city} via OpenWeatherMap")
            async with httpx.AsyncClient() as client:
                # 1. Geocode city to lat/lon
                geo_url = f"http://api.openweathermap.org/geo/1.0/direct?q={city}&limit=1&appid={OPENWEATHER_API_KEY}"
                geo_resp = await client.get(geo_url, timeout=5.0)
                if geo_resp.status_code == 200 and geo_resp.json():
                    geo_data = geo_resp.json()[0]
                    lat = geo_data['lat']
                    lon = geo_data['lon']
                    
                    # 2. Get 5-day / 3-hour forecast
                    forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&units=metric&appid={OPENWEATHER_API_KEY}"
                    resp = await client.get(forecast_url, timeout=5.0)
                    if resp.status_code == 200:
                        data = resp.json()
                        daily_data = {}
                        
                        # Process 3-hourly list to daily averages
                        for item in data.get('list', []):
                            dt_txt = item.get('dt_txt', '').split(' ')[0]
                            dt = datetime.strptime(dt_txt, "%Y-%m-%d").date()
                            if start_date <= dt <= end_date:
                                temp = item['main']['temp']
                                cond = item['weather'][0]['main']
                                icon = item['weather'][0]['icon']
                                
                                if dt not in daily_data:
                                    daily_data[dt] = {
                                        'temps': [],
                                        'condition': cond,
                                        'icon': icon
                                    }
                                daily_data[dt]['temps'].append(temp)
                        
                        for dt, info in daily_data.items():
                            forecast.append(WeatherDay(
                                date=dt,
                                temp_min=min(info['temps']),
                                temp_max=max(info['temps']),
                                condition=info['condition'],
                                icon=info['icon']
                            ))
                        
                        if forecast:
                            return sorted(forecast, key=lambda x: x.date)
        except Exception as e:
            logger.warning(f"OpenWeatherMap failed: {e}. Falling back to wttr.in")

    # Try wttr.in (Fallback 1)
    try:
        logger.info(f"Fetching weather for {city} via wttr.in")
        async with httpx.AsyncClient() as client:
            wttr_url = f"https://wttr.in/{city}?format=j1"
            resp = await client.get(wttr_url, timeout=5.0)
            if resp.status_code == 200:
                data = resp.json()
                weather_days = data.get('weather', [])
                
                for idx, w in enumerate(weather_days):
                    dt = datetime.strptime(w['date'], "%Y-%m-%d").date()
                    if start_date <= dt <= end_date:
                        temp_min = float(w['mintempC'])
                        temp_max = float(w['maxtempC'])
                        condition = w['hourly'][4]['weatherDesc'][0]['value'] if len(w['hourly']) > 4 else "Clear"
                        forecast.append(WeatherDay(
                            date=dt,
                            temp_min=temp_min,
                            temp_max=temp_max,
                            condition=condition,
                            icon="01d"  # Default sunny/clear icon
                        ))
                
                if forecast:
                    return sorted(forecast, key=lambda x: x.date)
    except Exception as e:
        logger.warning(f"wttr.in failed: {e}. Falling back to static seasonal estimate")
        
    # Static fallback (Fallback 2)
    logger.info("Using static seasonal weather generation")
    current_date = start_date
    while current_date <= end_date:
        # Generate basic seasonal temperatures depending on the month
        month = current_date.month
        if 3 <= month <= 6:  # Summer
            t_min, t_max = 25.0, 38.0
            cond, icon = "Hot/Sunny", "01d"
        elif 7 <= month <= 9:  # Monsoon
            t_min, t_max = 22.0, 30.0
            cond, icon = "Rainy/Humid", "10d"
        else:  # Winter
            t_min, t_max = 10.0, 22.0
            cond, icon = "Cool/Clear", "02d"
            
        forecast.append(WeatherDay(
            date=current_date,
            temp_min=t_min,
            temp_max=t_max,
            condition=cond,
            icon=icon
        ))
        current_date += timedelta(days=1)
        
    return forecast
