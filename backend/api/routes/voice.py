import os
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import date, timedelta
from typing import Optional

from backend.models.trip_request import TripRequest, TripPurpose, TransportMode, AccommodationType, DietType

logger = logging.getLogger(__name__)
router = APIRouter()

class VoiceExtractRequest(BaseModel):
    transcript: str

def parse_transcript_statically(text: str) -> dict:
    """
    Parses a spoken transcript statically matching keywords for origin, destination,
    budgets, travelers, dietary choices, and travel mode.
    """
    logger.info("Parsing transcript via regex and keywords fallback")
    text_lower = text.lower()
    
    # Default outputs
    parsed = {
        "origin": "Delhi",
        "destination": "Goa",
        "start_date": str(date.today() + timedelta(days=7)),
        "end_date": str(date.today() + timedelta(days=12)),
        "adults": 1,
        "children": 0,
        "infants": 0,
        "budget_inr": 20000.0,
        "trip_purpose": "Leisure",
        "transport_modes": ["Any"],
        "accommodation_type": "3-star",
        "amenities": ["WiFi", "AC"],
        "diet_type": "No restriction",
        "cuisines": ["Local Cuisine"],
        "meal_budget_per_day": 800.0,
        "additional_context": text
    }
    
    # City matching
    indian_cities = ["delhi", "mumbai", "bengaluru", "bangalore", "chennai", "hyderabad", "kolkata", "goa", "jaipur", "agra", "kochi", "pune", "srinagar", "manali", "shimla"]
    found_cities = []
    for city in indian_cities:
        if city in text_lower:
            found_cities.append(city.capitalize())
            
    # Resolve origin vs destination
    if len(found_cities) >= 2:
        parsed["origin"] = found_cities[0]
        parsed["destination"] = found_cities[1]
    elif len(found_cities) == 1:
        parsed["destination"] = found_cities[0]
        
    # Budget matching
    import re
    budget_match = re.search(r'(?:budget|within|under|around|₹|rs)\s*(?:of)?\s*(\d+)\s*(?:thousand|k|lakh)?', text_lower)
    if budget_match:
        val = float(budget_match.group(1))
        # Handle word qualifiers
        if "thousand" in text_lower or "k" in text_lower:
            val *= 1000
        elif "lakh" in text_lower:
            val *= 100000
        if val > 100:
            parsed["budget_inr"] = val
            
    # Traveler count
    adult_match = re.search(r'(\d+)\s*(?:adult|people|person|member|us)', text_lower)
    if adult_match:
        parsed["adults"] = int(adult_match.group(1))
        
    child_match = re.search(r'(\d+)\s*(?:child|kid)', text_lower)
    if child_match:
        parsed["children"] = int(child_match.group(1))
        
    infant_match = re.search(r'(\d+)\s*(?:infant|baby|toddler)', text_lower)
    if infant_match:
        parsed["infants"] = int(infant_match.group(1))
        
    # Dietary type
    if "vegetarian" in text_lower or "pure veg" in text_lower or "veg food" in text_lower:
        parsed["diet_type"] = "Vegetarian"
    elif "vegan" in text_lower:
        parsed["diet_type"] = "Vegan"
    elif "jain" in text_lower:
        parsed["diet_type"] = "Jain"
        
    # Transport mode
    modes = []
    if "flight" in text_lower or "plane" in text_lower:
        modes.append("Flight")
    if "train" in text_lower or "railway" in text_lower:
        modes.append("Train")
    if "bus" in text_lower:
        modes.append("Bus")
    if "cab" in text_lower or "taxi" in text_lower or "car" in text_lower:
        modes.append("Cab")
    if modes:
        parsed["transport_modes"] = modes
        
    # Accommodation
    if "5 star" in text_lower or "luxury" in text_lower:
        parsed["accommodation_type"] = "5-star"
    elif "4 star" in text_lower:
        parsed["accommodation_type"] = "4-star"
    elif "hostel" in text_lower or "backpack" in text_lower:
        parsed["accommodation_type"] = "Hostel"
    elif "homestay" in text_lower or "villa" in text_lower:
        parsed["accommodation_type"] = "Homestay"
        
    # Purpose
    if "business" in text_lower or "meeting" in text_lower or "work" in text_lower:
        parsed["trip_purpose"] = "Business"
    elif "honeymoon" in text_lower or "romantic" in text_lower:
        parsed["trip_purpose"] = "Honeymoon"
    elif "trek" in text_lower or "adventure" in text_lower or "hike" in text_lower:
        parsed["trip_purpose"] = "Adventure"
        
    return parsed

@router.post("/voice-extract")
async def extract_voice_intent(request: VoiceExtractRequest):
    """
    Takes transcription text and extracts a structured TripRequest using Gemini AI.
    """
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        return parse_transcript_statically(request.transcript)
        
    try:
        logger.info("Calling Gemini for Voice Entity Extraction")
        from langchain_google_genai import ChatGoogleGenerativeAI
        
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=gemini_key,
            temperature=0.0
        )
        
        # We wrap in structured output to get a strict TripRequest dictionary back
        structured_llm = llm.with_structured_output(TripRequest)
        
        prompt = f"""You are an expert travel assistant extracting entities from a user's spoken travel request.
Given the spoken transcript below, map all entities into the requested TripRequest JSON schema.
If a field is not mentioned, make a reasonable guess based on context (e.g. standard dates: one week from today, standard budget: ₹15,000, standard accommodation: 3-star).
Maintain any special details (e.g. traveling with infants, health issues, knee surgery) inside the additional_context field.

Spoken Transcript:
"{request.transcript}"
"""
        result = await structured_llm.ainvoke(prompt)
        # Convert result model to dict and format date fields back as strings for the frontend
        res_dict = result.model_dump()
        res_dict['start_date'] = str(res_dict['start_date'])
        res_dict['end_date'] = str(res_dict['end_date'])
        return res_dict
        
    except Exception as e:
        logger.error(f"Gemini Voice Extraction failed: {e}")
        return parse_transcript_statically(request.transcript)
