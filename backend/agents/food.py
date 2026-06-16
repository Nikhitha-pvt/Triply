import logging
from datetime import timedelta
from typing import List
from backend.models.trip_request import TripRequest
from backend.models.itinerary import DayMealPlan, MealOption
from backend.agents.safety import ConstraintSet
from backend.services.zomato import search_restaurants

logger = logging.getLogger(__name__)

async def plan_food_options(trip_req: TripRequest, constraints: ConstraintSet) -> List[DayMealPlan]:
    """
    Food Agent: Generates breakfast, lunch, and dinner plans for each day of the trip.
    """
    logger.info("Food Agent executing...")
    
    # 1. Calculate per-meal budget
    meal_budget = trip_req.meal_budget_per_day / 3.0
    
    # 2. Fetch restaurant options in destination city
    restaurants = await search_restaurants(
        city=trip_req.destination,
        diet_type=trip_req.diet_type,
        cuisines=trip_req.cuisines,
        max_meal_budget=meal_budget,
        min_rating=3.5
    )
    
    # 3. Create Daily Meal Plan
    trip_days = (trip_req.end_date - trip_req.start_date).days + 1
    meal_plans = []
    
    special_flags = constraints.special_flags or []
    
    for day in range(trip_days):
        # We need three restaurants for breakfast, lunch, dinner
        # Cycle through results or use fallbacks
        b_idx = (day * 3) % len(restaurants) if restaurants else 0
        l_idx = (day * 3 + 1) % len(restaurants) if restaurants else 0
        d_idx = (day * 3 + 2) % len(restaurants) if restaurants else 0
        
        # Helper to get restaurant or default mock
        def get_meal(idx: int, meal_name: str) -> MealOption:
            if restaurants and idx < len(restaurants):
                m = restaurants[idx]
            else:
                m = MealOption(
                    restaurant_name="Udupi Pure Veg Restaurant" if trip_req.diet_type == "Vegetarian" else "Hotel Central Diner",
                    cuisine="North & South Indian",
                    rating=4.0,
                    avg_cost_for_two=meal_budget * 2.0,
                    google_maps_link="https://www.google.com/maps",
                    deep_link=f"https://www.zomato.com/search?q=restaurants+in+{trip_req.destination.lower().replace(' ', '+')}"
                )
            
            # Apply safety warnings to cuisines
            cuisine_list = [m.cuisine]
            if "diabetic_traveller" in special_flags:
                cuisine_list.append("Low-GI options flagged; ask server for diabetic-friendly menu.")
            if "baby_mode" in special_flags:
                cuisine_list.append("Baby Mode: High-hygiene kitchen; milk and low-spice items available.")
                
            return MealOption(
                restaurant_name=f"{m.restaurant_name} ({meal_name})",
                cuisine=" | ".join(cuisine_list),
                rating=m.rating,
                avg_cost_for_two=m.avg_cost_for_two,
                google_maps_link=m.google_maps_link,
                deep_link=m.deep_link
            )
            
        meal_plans.append(DayMealPlan(
            breakfast=get_meal(b_idx, "Breakfast"),
            lunch=get_meal(l_idx, "Lunch"),
            dinner=get_meal(d_idx, "Dinner")
        ))
        
    return meal_plans
