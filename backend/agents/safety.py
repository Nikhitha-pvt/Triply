import os
import logging
from typing import List, Optional
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# Constraint Set Schema
class ConstraintSet(BaseModel):
    accommodation_constraints: List[str] = Field(default_factory=list)
    food_constraints: List[str] = Field(default_factory=list)
    transport_constraints: List[str] = Field(default_factory=list)
    activity_constraints: List[str] = Field(default_factory=list)
    risk_notes: List[str] = Field(default_factory=list)
    special_flags: List[str] = Field(default_factory=list) # e.g. "baby_mode", "mobility_restricted", "solo_female"

# Static / Regex Parser Fallback for safety/context
def parse_context_statically(text: str) -> ConstraintSet:
    text_lower = text.lower()
    acc_const = []
    food_const = []
    trans_const = []
    act_const = []
    risk = []
    flags = []
    
    if "baby" in text_lower or "infant" in text_lower or "child" in text_lower:
        flags.append("baby_mode")
        acc_const.append("Elevator or ground floor preferred; baby crib availability checked.")
        food_const.append("Hygienic, low-spice options; baby-friendly restaurants.")
        trans_const.append("Lower berth priority in train; avoid late-night road transits.")
        act_const.append("No high-intensity physical treks; kid-friendly parks/play areas.")
        risk.append("Infant health safety: locate pediatric clinics near destination.")
        
    if "knee" in text_lower or "surgery" in text_lower or "wheelchair" in text_lower or "elderly" in text_lower or "senior" in text_lower:
        flags.append("mobility_restricted")
        acc_const.append("Elevator mandatory, ground floor rooms preferred; wheelchair accessible entrance.")
        food_const.append("Comfortable sit-down restaurants with no stairs.")
        trans_const.append("No long platform changes; cab service prioritized over buses.")
        act_const.append("No walking tours, no steep stairs, wheelchair-friendly sights.")
        risk.append("Physical mobility limit: map elevator status and nearby clinics.")
        
    if "female" in text_lower or "solo female" in text_lower:
        flags.append("solo_female")
        acc_const.append("Hotel safety rating 4+ star; secure double-lock rooms; located in busy well-lit areas.")
        food_const.append("Well-reviewed, busy dining establishments; avoid isolated cafes.")
        trans_const.append("Avoid night transit arrivals after 8 PM; pre-booked official cabs only.")
        act_const.append("Avoid low-population walking zones after sunset.")
        risk.append("Solo female safety: pre-program local emergency contacts and verified transit.")
        
    if "diabetic" in text_lower or "diabetes" in text_lower or "sugar" in text_lower:
        flags.append("diabetic_traveller")
        food_const.append("Low-glycemic-index options flagged; sugar-free alternatives; low-carb options.")
        act_const.append("Maintain meal timings; carry light snacks.")
        risk.append("Diabetic care: locate 24/7 pharmacies and emergency medical stores.")
        
    if not flags:
        flags.append("standard_mode")
        
    return ConstraintSet(
        accommodation_constraints=acc_const,
        food_constraints=food_const,
        transport_constraints=trans_const,
        activity_constraints=act_const,
        risk_notes=risk,
        special_flags=flags
    )

async def analyze_safety_context(additional_context: Optional[str]) -> ConstraintSet:
    """
    safety.py: safety agent analyzing free-text travel requirements.
    Runs first to produce a ConstraintSet.
    """
    if not additional_context or not additional_context.strip():
        return ConstraintSet(special_flags=["standard_mode"])
        
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        logger.info("GEMINI_API_KEY missing, using static regex context parser.")
        return parse_context_statically(additional_context)
        
    try:
        logger.info("Calling Gemini to analyze safety context constraints")
        from langchain_google_genai import ChatGoogleGenerativeAI
        
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=gemini_key,
            temperature=0.0
        )
        
        structured_llm = llm.with_structured_output(ConstraintSet)
        
        prompt = f"""You are the Safety & Context Agent for Triply AI.
Given the following user context notes, identify all constraints that must apply to accommodation, food, transport, activities, and outline risk factors.
Format the output strictly as the requested JSON object.

User Context:
"{additional_context}"
"""
        result = await structured_llm.ainvoke(prompt)
        return result
    except Exception as e:
        logger.error(f"Safety context agent LLM run failed: {e}. Falling back to static parser.")
        return parse_context_statically(additional_context)
