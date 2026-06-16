import os
import logging
from typing import List
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from backend.models.trip_request import TripRequest
from backend.models.itinerary import PackingCategory, PackingItem, WeatherDay
from backend.agents.safety import ConstraintSet

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# Helper schema for structured output
class StructuredPackingList(BaseModel):
    categories: List[PackingCategory] = Field(default_factory=list)

def generate_static_packing_list(trip_req: TripRequest, weather: List[WeatherDay], constraints: ConstraintSet) -> List[PackingCategory]:
    """
    Generates a packing list statically based on trip request and safety constraints.
    """
    logger.info("Generating static packing list...")
    categories = []
    
    # 1. Documents
    docs = [
        PackingItem(name="Aadhar Card / Gov ID (Original + Copy)"),
        PackingItem(name="Hotel Booking Vouchers"),
        PackingItem(name="Bus/Train/Flight Tickets")
    ]
    if trip_req.trip_purpose.value == "Business":
        docs.append(PackingItem(name="Company ID / Event passes"))
    categories.append(PackingCategory(category="Documents & Tickets", items=docs))
    
    # 2. Clothing based on weather
    clothing_items = [
        PackingItem(name="Daily wear outfits"),
        PackingItem(name="Nightwear"),
        PackingItem(name="Undergarments & Socks"),
        PackingItem(name="Comfortable walking shoes")
    ]
    
    # Check weather
    is_rainy = any("rain" in w.condition.lower() or "wet" in w.condition.lower() for w in weather)
    is_cold = any("cool" in w.condition.lower() or w.temp_min < 18.0 for w in weather)
    is_hot = any("hot" in w.condition.lower() or w.temp_max > 32.0 for w in weather)
    
    if is_rainy:
        clothing_items.extend([PackingItem(name="Umbrella / Raincoat"), PackingItem(name="Waterproof footwear")])
    if is_cold:
        clothing_items.extend([PackingItem(name="Light jacket / Sweater"), PackingItem(name="Thermal wear (if high altitude)")])
    if is_hot:
        clothing_items.extend([PackingItem(name="Sunscreen lotion"), PackingItem(name="Sunglasses & Sun hat"), PackingItem(name="Lightweight cotton clothes")])
        
    categories.append(PackingCategory(category="Clothing", items=clothing_items))
    
    # 3. Toiletries
    toiletries = [
        PackingItem(name="Toothbrush & Toothpaste"),
        PackingItem(name="Soap & Shampoo"),
        PackingItem(name="Moisturizer & Sanitizer"),
        PackingItem(name="Comb / Hairbrush")
    ]
    categories.append(PackingCategory(category="Toiletries", items=toiletries))
    
    # 4. Electronics
    electronics = [
        PackingItem(name="Mobile charger"),
        PackingItem(name="Power bank (Crucial for travel)"),
        PackingItem(name="Earphones / Headphones")
    ]
    categories.append(PackingCategory(category="Electronics", items=electronics))
    
    # 5. Baby Items (Context specific)
    special_flags = constraints.special_flags or []
    if "baby_mode" in special_flags:
        baby = [
            PackingItem(name="Diapers & Baby wipes"),
            PackingItem(name="Baby food & Formula milk"),
            PackingItem(name="Feeding bottles & flask with warm water"),
            PackingItem(name="Baby stroller / carrier"),
            PackingItem(name="Extra change of clothes (x3)")
        ]
        categories.append(PackingCategory(category="Baby Supplies (Baby Mode Active)", items=baby))
        
    # 6. Medical & Health
    meds = [
        PackingItem(name="Basic first-aid kit (Paracetamol, Band-aids, ORS)"),
        PackingItem(name="Personal daily medications")
    ]
    if "diabetic_traveller" in special_flags:
        meds.extend([
            PackingItem(name="Insulin / Diabetes tablets"),
            PackingItem(name="Glucometer & test strips"),
            PackingItem(name="Sugar candies / Glucose tablets (for low blood sugar emergencies)")
        ])
    categories.append(PackingCategory(category="Medications & First Aid", items=meds))
    
    return categories

async def generate_packing_list(
    trip_req: TripRequest,
    weather: List[WeatherDay],
    constraints: ConstraintSet
) -> List[PackingCategory]:
    """
    Packing Agent: Generates categorised packing list.
    """
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        return generate_static_packing_list(trip_req, weather, constraints)
        
    try:
        logger.info("Calling Gemini to generate personalized packing list")
        from langchain_google_genai import ChatGoogleGenerativeAI
        
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=gemini_key,
            temperature=0.3
        )
        
        structured_llm = llm.with_structured_output(StructuredPackingList)
        
        weather_summary = ", ".join([f"{w.date}: {w.temp_min}-{w.temp_max}C ({w.condition})" for w in weather[:5]])
        flags_str = ", ".join(constraints.special_flags or [])
        
        prompt = f"""You are the Packing List Agent for Triply AI.
Generate a structured packing list for a trip with these specifications:
- Destination: {trip_req.destination}
- Duration: {(trip_req.end_date - trip_req.start_date).days + 1} days
- Purpose: {trip_req.trip_purpose.value}
- Weather: {weather_summary}
- Special Safety Constraints: {flags_str}

Format the response strictly as the requested categories and items list.
"""
        result = await structured_llm.ainvoke(prompt)
        return result.categories
    except Exception as e:
        logger.error(f"Packing agent LLM run failed: {e}. Falling back to static generator.")
        return generate_static_packing_list(trip_req, weather, constraints)
