import asyncio
import logging
from typing import Callable, Optional, Dict, Any
from backend.models.trip_request import TripRequest
from backend.models.itinerary import ItineraryOutput

from backend.agents.safety import analyze_safety_context
from backend.agents.travel import search_travel_options
from backend.agents.accommodation import search_accommodation_options
from backend.agents.food import plan_food_options
from backend.agents.itinerary import synthesize_itinerary

logger = logging.getLogger(__name__)

async def generate_full_itinerary(
    trip_req: TripRequest,
    on_progress: Optional[Callable[[str, str, Optional[str], Optional[Any]], None]] = None
) -> ItineraryOutput:
    """
    Orchestrator Agent: Controls the parallel multi-agent pipeline.
    
    on_progress callback signature: (agent_name, status, message, partial_result)
    Status values: 'waiting', 'running', 'done', 'error'
    """
    logger.info("Starting multi-agent orchestration...")
    
    # 0. Initial progress setup for all agents
    agents_list = [
        "Safety & Context Agent", 
        "Travel Agent", 
        "Accommodation Agent", 
        "Food Agent", 
        "Itinerary Agent"
    ]
    if on_progress:
        for name in agents_list:
            on_progress(name, "waiting", "Initialized", None)
            
    # 1. Run Safety Context Agent FIRST
    if on_progress:
        on_progress("Safety & Context Agent", "running", "Analyzing travel requirements and medical/special needs...", None)
        
    try:
        constraints = await analyze_safety_context(trip_req.additional_context)
        logger.info(f"Safety agent completed with flags: {constraints.special_flags}")
        if on_progress:
            on_progress(
                "Safety & Context Agent", 
                "done", 
                f"Extracted constraints. Flags active: {', '.join(constraints.special_flags)}", 
                constraints.model_dump(mode='json')
            )
    except Exception as e:
        logger.error(f"Safety Agent failed: {e}")
        from backend.agents.safety import ConstraintSet
        constraints = ConstraintSet(special_flags=["standard_mode"])
        if on_progress:
            on_progress("Safety & Context Agent", "error", f"Failed: {str(e)}. Using default safety profile.", None)

    # 2. Run Travel, Accommodation, and Food agents in PARALLEL
    if on_progress:
        on_progress("Travel Agent", "running", "Searching flights, buses, and trains matching budget...", None)
        on_progress("Accommodation Agent", "running", f"Searching hotels & stays matching '{trip_req.accommodation_type.value}'...", None)
        on_progress("Food Agent", "running", f"Searching {trip_req.diet_type.value} restaurants & cuisines...", None)

    async def run_travel():
        try:
            res = await search_travel_options(trip_req, constraints)
            msg = f"Found {len(res)} options. Best: {res[0].provider} (Rs.{res[0].price_inr})" if res else "No options found."
            if on_progress:
                on_progress("Travel Agent", "done", msg, [opt.model_dump(mode='json') for opt in res])
            return res
        except Exception as e:
            logger.error(f"Travel Agent failed: {e}")
            if on_progress:
                on_progress("Travel Agent", "error", f"Failed to search travel options: {str(e)}", None)
            return []

    async def run_accommodation():
        try:
            res = await search_accommodation_options(trip_req, constraints)
            msg = f"Found {len(res)} hotels. Best: {res[0].name} (Rs.{res[0].price_per_night_inr}/night)" if res else "No hotels found."
            if on_progress:
                on_progress("Accommodation Agent", "done", msg, [h.model_dump(mode='json') for h in res])
            return res
        except Exception as e:
            logger.error(f"Accommodation Agent failed: {e}")
            if on_progress:
                on_progress("Accommodation Agent", "error", f"Failed to search stays: {str(e)}", None)
            return []

    async def run_food():
        try:
            res = await plan_food_options(trip_req, constraints)
            msg = f"Generated food & meal plans for {len(res)} days." if res else "No meal plans generated."
            if on_progress:
                on_progress("Food Agent", "done", msg, [day.model_dump(mode='json') for day in res])
            return res
        except Exception as e:
            logger.error(f"Food Agent failed: {e}")
            if on_progress:
                on_progress("Food Agent", "error", f"Failed to generate meal plan: {str(e)}", None)
            return []

    # Gather parallel agent results
    travel_res, accommodation_res, food_res = await asyncio.gather(
        run_travel(),
        run_accommodation(),
        run_food()
    )

    # 3. Run Itinerary Synthesis Agent LAST
    if on_progress:
        on_progress("Itinerary Agent", "running", "Merging all agent options, fetching weather, and synthesizing daily schedules...", None)
        
    try:
        final_itinerary = await synthesize_itinerary(
            trip_req=trip_req,
            travel_options=travel_res,
            hotel_options=accommodation_res,
            meal_plans=food_res,
            constraints=constraints
        )
        logger.info("Itinerary synthesis complete.")
        if on_progress:
            on_progress("Itinerary Agent", "done", f"Itinerary generated! Risk Score: {final_itinerary.risk_score}/100.", final_itinerary.model_dump(mode='json'))
        return final_itinerary
    except Exception as e:
        logger.error(f"Itinerary synthesis failed: {e}")
        if on_progress:
            on_progress("Itinerary Agent", "error", f"Critical failure: {str(e)}", None)
        raise e
