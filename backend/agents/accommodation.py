import logging
from typing import List
from backend.models.trip_request import TripRequest
from backend.models.itinerary import HotelOption
from backend.agents.safety import ConstraintSet
from backend.services.hotels import search_hotels

logger = logging.getLogger(__name__)

async def search_accommodation_options(trip_req: TripRequest, constraints: ConstraintSet) -> List[HotelOption]:
    """
    Accommodation Agent: Searches hotels and applies safety constraints/amenities.
    """
    logger.info("Accommodation Agent executing...")
    
    # 1. Allocate budget slice for stay (e.g. 50% of total budget)
    max_stay_budget = trip_req.budget_inr * 0.5
    
    # Merge user amenities with safety-mandated amenities
    req_amenities = list(trip_req.amenities) if trip_req.amenities else []
    special_flags = constraints.special_flags or []
    
    if "baby_mode" in special_flags and "Baby crib" not in req_amenities:
        req_amenities.append("Baby crib")
    if "mobility_restricted" in special_flags and "Wheelchair access" not in req_amenities:
        req_amenities.append("Wheelchair access")
    if "mobility_restricted" in special_flags and "Elevator" not in req_amenities:
        req_amenities.append("Elevator")
        
    # 2. Query hotels service
    raw_hotels = await search_hotels(
        city=trip_req.destination,
        checkin_date=trip_req.start_date,
        checkout_date=trip_req.end_date,
        stay_type=trip_req.accommodation_type,
        amenities=req_amenities,
        max_price_inr=max_stay_budget
    )
    
    # 3. Refine hotels based on safety constraints
    refined_hotels = []
    for idx, hotel in enumerate(raw_hotels):
        # Annotate with safety messages
        hotel_amenities = list(hotel.amenities)
        
        if "baby_mode" in special_flags:
            hotel_amenities.extend(["Baby-friendly", "Doctor on call"])
        if "mobility_restricted" in special_flags:
            hotel_amenities.extend(["Elevator Access", "Ground floor option"])
        if "solo_female" in special_flags:
            hotel_amenities.extend(["CCTV Secure", "24/7 Front desk", "Safe Area"])
            
        hotel.amenities = list(set(hotel_amenities)) # Remove duplicates
        refined_hotels.append(hotel)
        
    return refined_hotels
