import os
import logging
import uuid
from datetime import timedelta, date
from typing import List, Optional
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from backend.models.trip_request import TripRequest
from backend.models.itinerary import (
    ItineraryOutput, DayPlan, DayMealPlan, Activity,
    TransportOption, HotelOption, BudgetBreakdown,
    GroupSplit, PackingCategory, HeatmapDay, RiskFactor, WeatherDay
)
from backend.agents.safety import ConstraintSet
from backend.agents.budget import calculate_budget, calculate_group_split
from backend.agents.packing import generate_packing_list
from backend.services.weather import get_weather_forecast
from backend.services.maps import get_directions

# Load env variables
load_dotenv()

logger = logging.getLogger(__name__)

# Structured model for LLM itinerary synthesis
class StructuredDayPlans(BaseModel):
    days: List[DayPlan] = Field(default_factory=list)

def generate_static_itinerary_days(
    trip_req: TripRequest,
    meal_plans: List[DayMealPlan],
    hotel_name: str
) -> List[DayPlan]:
    """
    Statically creates basic itinerary days based on the destination and meal plans.
    """
    logger.info("Generating static day plans...")
    days = []
    trip_days = (trip_req.end_date - trip_req.start_date).days + 1
    
    city_sights = {
        "delhi": [
            "Red Fort & Chandni Chowk", "Qutub Minar & Lotus Temple", 
            "India Gate & Rashtrapati Bhavan", "Humayun's Tomb", "National Gallery of Modern Art"
        ],
        "mumbai": [
            "Gateway of India & Marine Drive", "Elephanta Caves", 
            "Chhatrapati Shivaji Maharaj Terminus & Colaba Causeway", "Siddhivinayak Temple & Juhu Beach", "Haji Ali Dargah"
        ],
        "bengaluru": [
            "Lalbagh Botanical Garden", "Bangalore Palace & Cubbon Park", 
            "Visvesvaraya Museum & MG Road shopping", "Nandi Hills (early morning sunrise)", "Bannerghatta National Park"
        ],
        "hyderabad": [
            "Charminar & Laad Bazaar", "Golconda Fort & Qutub Shahi Tombs", 
            "Birla Mandir & Hussain Sagar Lake", "Ramoji Film City", "Salargunj Museum"
        ],
        "chennai": [
            "Marina Beach & Santhome Cathedral", "Kapaleeshwarar Temple", 
            "Government Museum & Fort St. George", "DakshinaChitra Heritage Museum", "Mahabalipuram shore temples excursion"
        ]
    }
    
    city_lower = trip_req.destination.lower()
    sights = []
    for c, items in city_sights.items():
        if c in city_lower:
            sights = items
            break
            
    if not sights:
        sights = [
            "City Center Sightseeing & Local Market", "Historical Monuments tour", 
            "Nature Park walk & sunset viewpoint", "Museum and local cultural show", "Shopping & leisure time"
        ]
        
    for d in range(trip_days):
        current_date = trip_req.start_date + timedelta(days=d)
        
        activities = []
        
        # Journey days customization
        if d == 0:
            # Day 1: Transit and Check-in
            activities.append(Activity(
                time="08:00 AM",
                location=f"Transit from {trip_req.origin}",
                description=f"Start your journey from {trip_req.origin} to {trip_req.destination}. Travel via your selected transport mode and enjoy the scenic transit.",
                google_maps_link=f"https://www.google.com/maps/search/?api=1&query=Transit+from+{trip_req.origin.replace(' ', '+')}+to+{trip_req.destination.replace(' ', '+')}",
                cost=0.0
            ))
            activities.append(Activity(
                time="01:00 PM",
                location=hotel_name,
                description=f"Arrive in {trip_req.destination}. Check-in at {hotel_name}, refresh and unpack your bags.",
                google_maps_link=f"https://www.google.com/maps/search/?api=1&query={hotel_name.replace(' ', '+')}",
                cost=0.0
            ))
            activities.append(Activity(
                time="04:30 PM",
                location="Local Promenade / Nearby Market",
                description=f"Take a relaxing stroll around the neighborhood or local market to get familiar with {trip_req.destination}.",
                google_maps_link=f"https://www.google.com/maps/search/?api=1&query=Market+near+{hotel_name.replace(' ', '+')}",
                cost=0.0
            ))
        elif d == trip_days - 1 and trip_days > 1:
            # Last Day: Checkout and return journey
            activities.append(Activity(
                time="09:00 AM",
                location="Local Souvenir Shops / Mall Road",
                description="Enjoy your final morning in the city. Grab some local souvenirs and return to the hotel to pack your luggage.",
                google_maps_link=f"https://www.google.com/maps/search/?api=1&query=Souvenir+shops+{trip_req.destination.replace(' ', '+')}",
                cost=0.0
            ))
            activities.append(Activity(
                time="11:30 AM",
                location=hotel_name,
                description=f"Check out from {hotel_name} and settle any remaining dues.",
                google_maps_link=f"https://www.google.com/maps/search/?api=1&query={hotel_name.replace(' ', '+')}",
                cost=0.0
            ))
            activities.append(Activity(
                time="01:30 PM",
                location=f"Transit to {trip_req.origin}",
                description=f"Board your return transit back to your hometown {trip_req.origin}. End of your Triply AI adventure!",
                google_maps_link=f"https://www.google.com/maps/search/?api=1&query=Transit+from+{trip_req.destination.replace(' ', '+')}+to+{trip_req.origin.replace(' ', '+')}",
                cost=0.0
            ))
        else:
            # Standard Mid-Trip Sightseeing Days
            sight_morning = sights[(d * 2) % len(sights)]
            sight_afternoon = sights[(d * 2 + 1) % len(sights)]
            
            activities.append(Activity(
                time="09:00 AM",
                location=sight_morning,
                description=f"Explore the historic {sight_morning}. Learn about local heritage, architecture, and capture photos.",
                google_maps_link=f"https://www.google.com/maps/search/?api=1&query={sight_morning.replace(' ', '+')}",
                cost=200.0 if "Museum" in sight_morning or "Fort" in sight_morning or "Palace" in sight_morning else 0.0
            ))
            activities.append(Activity(
                time="03:30 PM",
                location=sight_afternoon,
                description=f"Visit {sight_afternoon}. Enjoy the atmosphere, relax, and explore the surroundings.",
                google_maps_link=f"https://www.google.com/maps/search/?api=1&query={sight_afternoon.replace(' ', '+')}",
                cost=150.0 if "Excursion" in sight_afternoon or "Caves" in sight_afternoon else 0.0
            ))
        
        # Meal assignment
        meal_plan = meal_plans[d] if d < len(meal_plans) else DayMealPlan(
            breakfast=MealOption(restaurant_name="Hotel Breakfast", cuisine="South Indian", rating=4.0, avg_cost_for_two=300),
            lunch=MealOption(restaurant_name="Local Dining Hall", cuisine="Thali", rating=4.1, avg_cost_for_two=400),
            dinner=MealOption(restaurant_name="Fine Dine Restaurant", cuisine="North Indian", rating=4.3, avg_cost_for_two=800)
        )
        
        days.append(DayPlan(
            day_number=d + 1,
            date=current_date,
            activities=activities,
            meals=meal_plan
        ))
        
    return days

async def synthesize_itinerary(
    trip_req: TripRequest,
    travel_options: List[TransportOption],
    hotel_options: List[HotelOption],
    meal_plans: List[DayMealPlan],
    constraints: ConstraintSet
) -> ItineraryOutput:
    """
    Itinerary Agent: Combines all option lists into a final ItineraryOutput.
    """
    logger.info("Itinerary synthesis starting...")
    plan_id = str(uuid.uuid4())
    
    # 1. Fetch weather forecast
    weather = await get_weather_forecast(trip_req.destination, trip_req.start_date, trip_req.end_date)
    
    # 2. Generate packing list
    packing = await generate_packing_list(trip_req, weather, constraints)
    
    # 3. Calculate budgets & Scaling factor
    best_transport = travel_options[0] if travel_options else None
    best_hotel = hotel_options[0] if hotel_options else None
    
    transport_total_cost = best_transport.price_inr * (trip_req.adults + trip_req.children + trip_req.infants) if best_transport else 0.0
    stay_days = max((trip_req.end_date - trip_req.start_date).days, 1)
    accommodation_total_cost = best_hotel.price_per_night_inr * stay_days if best_hotel else 0.0
    
    trip_days = (trip_req.end_date - trip_req.start_date).days + 1
    food_total_cost = trip_req.meal_budget_per_day * trip_days * trip_req.adults
    
    # Calculate mock activities base costs
    activities_cost = 500.0 * trip_days * trip_req.adults
    
    # Cost scaling calculation
    current_subtotal = transport_total_cost + accommodation_total_cost + food_total_cost + activities_cost
    
    # Target cost: budget - 10,000 (if budget >= 30,000) or budget * 0.75 (if budget < 30,000)
    target_total = max(trip_req.budget_inr - 10000, trip_req.budget_inr * 0.75)
    target_total = max(target_total, 1000.0) # Ensure it is valid
    target_subtotal = target_total / 1.1 # Remove the 10% buffer
    
    scale_factor = 1.0
    if current_subtotal > 0:
        scale_factor = target_subtotal / current_subtotal
        # Capping the scale factor to keep things realistic
        scale_factor = max(min(scale_factor, 2.5), 0.25)
        
        # Apply scaling to transport
        if best_transport:
            best_transport.price_inr = float(round(best_transport.price_inr * scale_factor))
            for opt in travel_options:
                opt.price_inr = float(round(opt.price_inr * scale_factor))
        # Update scaled transport subtotal
        transport_total_cost = best_transport.price_inr * (trip_req.adults + trip_req.children + trip_req.infants) if best_transport else 0.0
        
        # Apply scaling to stays
        if best_hotel:
            best_hotel.price_per_night_inr = float(round(best_hotel.price_per_night_inr * scale_factor))
            best_hotel.total_price_inr = best_hotel.price_per_night_inr * stay_days
            for hotel in hotel_options:
                hotel.price_per_night_inr = float(round(hotel.price_per_night_inr * scale_factor))
                hotel.total_price_inr = hotel.price_per_night_inr * stay_days
        # Update scaled stays subtotal
        accommodation_total_cost = best_hotel.price_per_night_inr * stay_days if best_hotel else 0.0
        
        # Apply scaling to food
        trip_req.meal_budget_per_day = float(round(trip_req.meal_budget_per_day * scale_factor))
        for mp in meal_plans:
            if mp.breakfast:
                mp.breakfast.avg_cost_for_two = float(round(mp.breakfast.avg_cost_for_two * scale_factor))
            if mp.lunch:
                mp.lunch.avg_cost_for_two = float(round(mp.lunch.avg_cost_for_two * scale_factor))
            if mp.dinner:
                mp.dinner.avg_cost_for_two = float(round(mp.dinner.avg_cost_for_two * scale_factor))
        food_total_cost = trip_req.meal_budget_per_day * trip_days * trip_req.adults
        
        # Apply scaling to activities
        activities_cost = round(activities_cost * scale_factor, 2)
        
    budget_breakdown = calculate_budget(
        trip_req=trip_req,
        transport_cost=transport_total_cost,
        accommodation_cost=accommodation_total_cost,
        food_cost=food_total_cost,
        activities_cost=activities_cost
    )
    
    group_split = calculate_group_split(trip_req, budget_breakdown)
    
    # 4. Generate Crowd/Season Heatmap (top cities seasonal profiles)
    crowd_heatmap = []
    city_lower = trip_req.destination.lower()
    
    city_events = {
        "goa": [
            "Shigmotsav Carnival", "Baga Beach Sunset Drum Circle", "Anjuna Flea Market", 
            "Saturday Night Bazaar at Arpora", "Goa Heritage Walk", "Mandovi River Cruise Gala"
        ],
        "delhi": [
            "Heritage Walk at Red Fort", "Sunday Book Market at Daryaganj", "Qutub Festival", 
            "Connaught Place Cultural Expo", "Dilli Haat Craft Mela", "Lodhi Gardens Yoga Meet"
        ],
        "mumbai": [
            "Gateway of India Light Show", "Colaba Causeway Street Fest", "Marine Drive Sunday Carnival", 
            "Elephanta Caves Tour Meet", "Chhatrapati Shivaji Terminal Heritage Walk", "Juhu Beach Food Fair"
        ],
        "jaipur": [
            "Lit Fest Jaipur", "Teej Festival Folk Dance", "Gangaur Fair Parade", 
            "Johari Bazaar Heritage Jewelry Show", "Chokhi Dhani Rajasthani Mela", "Amber Fort Sound & Light Show"
        ],
        "chennai": [
            "Margazhi Music Carnival", "Madras Day Celebrations", "Covelong Surf Festival", 
            "Besant Nagar Beach Carnival", "Kapaleeshwarar Temple Float Festival", "DakshinaChitra Craft Fair"
        ],
        "bengaluru": [
            "Lalbagh Flower Show", "Cubbon Park Sunday Concert", "Visvesvaraya Science Fair", 
            "Koramangala Food Expo", "Bangalore Palace Royal Heritage Walk", "Nandi Hills Sunrise Meet"
        ]
    }
    
    selected_events = []
    for c, evs in city_events.items():
        if c in city_lower:
            selected_events = evs
            break
    if not selected_events:
        selected_events = [
            "Local Handloom & Craft Expo", "Weekend Organic Farmers Market", 
            "Heritage Street Food Walk", "City Art & Culture Fair", "Local Scenic Viewpoint Walk"
        ]
        
    curr_h_date = trip_req.start_date - timedelta(days=3)
    for idx in range(trip_days + 6):
        m = curr_h_date.month
        d = curr_h_date.day
        weekday = curr_h_date.weekday() # 5 = Saturday, 6 = Sunday
        
        c_level = "amber"
        reason = "Standard tourist traffic"
        
        if "goa" in city_lower:
            if m in [11, 12, 1, 2]:
                c_level = "red"
                reason = "Peak beach holiday & winter festival season in Goa"
            elif m in [7, 8, 9]:
                c_level = "green"
                reason = "Monsoon off-season in Goa: quiet beaches, scenic monsoons"
            else:
                c_level = "amber"
                reason = "Pleasant beach shoulder season in Goa"
        elif any(hill in city_lower for hill in ["manali", "shimla", "srinagar", "ooty", "kodaikanal", "darjeeling", "mcleodganj", "ladakh"]):
            if m in [5, 6]:
                c_level = "red"
                reason = "Peak summer break holiday crowd at hill station"
            elif m in [12, 1, 2]:
                c_level = "red"
                reason = "Peak snow & winter adventure season in the mountains"
            elif m in [7, 8, 9]:
                c_level = "green"
                reason = "Monsoon off-season: quiet hill landscapes, landslide advisory active"
            else:
                c_level = "amber"
                reason = "Pleasant spring/autumn season"
        elif any(c in city_lower for c in ["delhi", "jaipur", "agra", "mumbai", "chennai", "hyderabad", "kolkata"]):
            if m in [11, 12, 1, 2]:
                c_level = "red"
                reason = "Peak winter sightseeing season: pleasant sightseeing weather"
            elif m in [4, 5, 6]:
                c_level = "green"
                reason = "Scorching summer heat off-season: low tourist crowd"
            else:
                c_level = "amber"
                reason = "Standard tourist traffic: moderate sightseeing weather"
        else:
            if m in [11, 12, 1]:
                c_level = "red"
                reason = "Peak winter vacation tourist flow"
            elif m in [7, 8]:
                c_level = "green"
                reason = "Monsoon off-season travel"
                
        if m == 12 and d >= 24:
            c_level = "red"
            reason = "Christmas & Year-End holiday peak rush"
            
        evt_idx = idx % len(selected_events)
        evs_list = [selected_events[evt_idx]]
        if weekday in [5, 6]:
            evs_list.append("Weekend Sightseeing Rush")
        if m == 12 and d == 31:
            evs_list.append("New Year Eve Celebration Gala")
            
        crowd_heatmap.append(HeatmapDay(
            date=curr_h_date,
            crowd_level=c_level,
            reason=reason,
            events=evs_list
        ))
        curr_h_date += timedelta(days=1)
        
    # 5. Compute Risk Score & Factors
    risk_factors = [
        RiskFactor(factor="Budget Buffer", score=10 if budget_breakdown.overspent else 0, description="Plan exceeds target budget" if budget_breakdown.overspent else "Good budget headroom"),
        RiskFactor(factor="Weather Risks", score=15 if any("rain" in w.condition.lower() for w in weather) else 5, description="Possibility of monsoon showers" if any("rain" in w.condition.lower() for w in weather) else "Clear skies forecast"),
    ]
    if "baby_mode" in (constraints.special_flags or []):
        risk_factors.append(RiskFactor(factor="Infant Travel Comfort", score=20, description="Baby traveling: requires frequent feed stops and low-spice food hygiene focus."))
    if "mobility_restricted" in (constraints.special_flags or []):
        risk_factors.append(RiskFactor(factor="Mobility Obstruction", score=25, description="Recent surgery/mobility constraints require elevators and flat surfaces."))
        
    total_risk_penalty = sum(rf.score for rf in risk_factors)
    risk_score = max(100 - total_risk_penalty, 10)
    
    # 6. Generate Day-by-Day Activities
    gemini_key = os.getenv("GEMINI_API_KEY")
    hotel_name = best_hotel.name if best_hotel else "Comfort Stay Hotel"
    
    days_data = []
    if gemini_key:
        try:
            logger.info("Calling Gemini to synthesize daily activities")
            from langchain_google_genai import ChatGoogleGenerativeAI
            
            llm = ChatGoogleGenerativeAI(
                model="gemini-1.5-flash",
                google_api_key=gemini_key,
                temperature=0.4
            )
            structured_llm = llm.with_structured_output(StructuredDayPlans)
            
            meals_desc = ""
            for idx, mp in enumerate(meal_plans):
                meals_desc += f"Day {idx+1}: B={mp.breakfast.restaurant_name}, L={mp.lunch.restaurant_name}, D={mp.dinner.restaurant_name}. "
                
            prompt = f"""You are the Itinerary synthesis agent for Triply AI.
Create a detailed day-by-day travel itinerary for {trip_req.destination} starting on {trip_req.start_date} and ending on {trip_req.end_date}.
The group starts their journey from {trip_req.origin} and stays at: "{hotel_name}".
Assigned Meals: {meals_desc}
Special safety restrictions: {', '.join(constraints.special_flags or [])}

CRITICAL INSTRUCTIONS FOR TRIP STRUCTURE:
- Day 1 (the start day of the journey) MUST focus on the outward travel/journey from the origin ({trip_req.origin}) to the destination ({trip_req.destination}), including departure, transit, check-in, and settling down at the hotel.
- The final day ({trip_days}) MUST focus on the return journey back to the hometown/origin ({trip_req.origin}), including hotel checkout, departure, and return transit.

For each day, provide a timeline-based schedule of 2 to 3 activities with realistic times (e.g. "09:30 AM", "04:00 PM"), locations, descriptions, Google Maps links, and estimate ticket costs in INR.
Return the result strictly formatted to matches the days list.
"""
            result = await structured_llm.ainvoke(prompt)
            # Sync dates and day numbers
            for idx, d in enumerate(result.days):
                d.day_number = idx + 1
                d.date = trip_req.start_date + timedelta(days=idx)
                # Map structured meals
                if idx < len(meal_plans):
                    d.meals = meal_plans[idx]
                days_data = result.days
        except Exception as e:
            logger.error(f"Itinerary synthesis LLM failed: {e}. Falling back to static day generator.")
            days_data = generate_static_itinerary_days(trip_req, meal_plans, hotel_name)
    else:
        days_data = generate_static_itinerary_days(trip_req, meal_plans, hotel_name)
        
    # Scale activity ticket costs in days_data
    for day in days_data:
        for act in day.activities:
            act.cost = float(round(act.cost * scale_factor))

    return ItineraryOutput(
        plan_id=plan_id,
        trip_request=trip_req,
        days=days_data,
        transport_options=travel_options,
        accommodation_options=hotel_options,
        budget_breakdown=budget_breakdown,
        group_split=group_split,
        packing_list=packing,
        crowd_heatmap=crowd_heatmap,
        risk_score=risk_score,
        risk_factors=risk_factors,
        weather_forecast=weather
    )

