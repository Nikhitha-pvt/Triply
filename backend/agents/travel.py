import logging
from typing import List
from backend.models.trip_request import TripRequest
from backend.models.itinerary import TransportOption
from backend.agents.safety import ConstraintSet
from backend.services.transport import search_transport

logger = logging.getLogger(__name__)

async def search_travel_options(trip_req: TripRequest, constraints: ConstraintSet) -> List[TransportOption]:
    """
    Travel Agent: Searches transport options and applies safety constraints.
    """
    logger.info("Travel Agent executing...")
    
    # 1. Fetch options from transport service
    raw_options = await search_transport(
        origin=trip_req.origin,
        destination=trip_req.destination,
        travel_date=trip_req.start_date,
        modes=trip_req.transport_modes,
        class_type=trip_req.transport_class,
        departure_pref=None # Or parse from request if added
    )
    
    # 2. Refine based on Safety ConstraintSet
    special_flags = constraints.special_flags or []
    refined_options = []
    
    for opt in raw_options:
        details_list = [opt.details]
        
        # Lower berth / comfortable seating prioritization
        if "baby_mode" in special_flags:
            if opt.mode == "Train":
                details_list.append("Baby Mode active: Lower berth priority requested for infant.")
            elif opt.mode == "Bus":
                details_list.append("Baby Mode active: Lower deck sleeper requested.")
                
        if "mobility_restricted" in special_flags:
            if opt.mode in ["Train", "Bus"]:
                details_list.append("Mobility Restricted: Lower berth/front seats requested for minimal stairs.")
            elif opt.mode == "Flight":
                details_list.append("Mobility Restricted: Wheelchair assistance requested at airport terminals.")
                
        if "solo_female" in special_flags:
            if opt.mode == "Cab":
                details_list.append("Solo Female Safety: Verified/Top-rated driver assigned; emergency tracking active.")
            elif opt.mode == "Bus":
                details_list.append("Solo Female Safety: Reserved lady-adjacent seat requested.")
                
        opt.details = " | ".join(details_list)
        refined_options.append(opt)
        
    return refined_options
