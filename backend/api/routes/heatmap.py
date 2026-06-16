import logging
from fastapi import APIRouter, HTTPException, Query
from datetime import date, timedelta, datetime
from typing import List

from backend.models.itinerary import HeatmapDay

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/{city}", response_model=List[HeatmapDay])
async def get_crowd_heatmap(
    city: str,
    start: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end: str = Query(..., description="End date (YYYY-MM-DD)")
):
    """
    Returns the crowd and seasonal holiday heatmap for a city and date range.
    """
    try:
        start_date = datetime.strptime(start, "%Y-%m-%d").date()
        end_date = datetime.strptime(end, "%Y-%m-%d").date()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
        
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="Start date must be before or equal to end date.")
        
    days_count = (end_date - start_date).days + 1
    if days_count > 60:
        raise HTTPException(status_code=400, detail="Date range cannot exceed 60 days.")
        
    city_lower = city.lower().strip()
    heatmap = []
    
    current_date = start_date
    while current_date <= end_date:
        month = current_date.month
        day = current_date.day
        
        # Calculate crowd levels based on Indian climate & holiday seasons
        crowd_level = "amber" # Default moderate
        reason = "Standard tourist traffic"
        events = []
        
        # Peak Winter Season (Nov - Feb)
        if month in [11, 12, 1, 2]:
            crowd_level = "red"
            reason = "Peak winter season: High domestic tourist flows"
            if month == 12 and day >= 20:
                events.append("Christmas / New Year holidays")
            if month == 1 and day == 26:
                events.append("Republic Day long weekend")
        # Monsoon Off-Season (Jul - Sep)
        elif month in [7, 8, 9]:
            crowd_level = "green"
            reason = "Lush green monsoon season: Low crowd, off-season rates"
            if month == 8 and day == 15:
                events.append("Independence Day long weekend")
        # Summer (Apr - Jun)
        elif month in [4, 5, 6]:
            # Hill stations will be peak red, but plains will be green
            is_hill_station = any(hill in city_lower for hill in ["manali", "shimla", "srinagar", "ooty", "kodaikanal", "darjeeling", "mcleodganj"])
            if is_hill_station:
                crowd_level = "red"
                reason = "Peak summer escape: High crowd at hill station"
            else:
                crowd_level = "green"
                reason = "Extreme summer heat: Low tourist activity in plains"
                
        # Public holidays
        if month == 10 and day in [2, 24, 25]:
            crowd_level = "red"
            events.append("Gandhi Jayanti / Festive long weekend")
        elif month == 11 and day in [10, 11, 12, 13, 14]:
            crowd_level = "red"
            events.append("Diwali Holidays")
            
        heatmap.append(HeatmapDay(
            date=current_date,
            crowd_level=crowd_level,
            reason=reason,
            events=events if events else ["Local sightseeing operational"]
        ))
        
        current_date += timedelta(days=1)
        
    return heatmap
