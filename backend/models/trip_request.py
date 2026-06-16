from pydantic import BaseModel, Field
from datetime import date
from enum import Enum
from typing import List, Optional

class TripPurpose(str, Enum):
    LEISURE = "Leisure"
    BUSINESS = "Business"
    HONEYMOON = "Honeymoon"
    FAMILY = "Family"
    SOLO = "Solo"
    GROUP = "Group Outing"
    MEDICAL = "Medical"
    RELIGIOUS = "Religious"
    ADVENTURE = "Adventure"

class TransportMode(str, Enum):
    TRAIN = "Train"
    BUS = "Bus"
    FLIGHT = "Flight"
    CAB = "Cab"
    ANY = "Any"

class AccommodationType(str, Enum):
    PG = "PG"
    CO_LIVING = "Co-living"
    HOSTEL = "Hostel"
    LODGE = "Lodge"
    BUDGET_HOTEL = "Budget Hotel (1-2 star)"
    THREE_STAR = "3-star"
    FOUR_STAR = "4-star"
    FIVE_STAR = "5-star"
    HOMESTAY = "Homestay"

class DietType(str, Enum):
    VEGETARIAN = "Vegetarian"
    NON_VEGETARIAN = "Non-Vegetarian"
    VEGAN = "Vegan"
    JAIN = "Jain"
    NO_RESTRICTION = "No restriction"

class TripRequest(BaseModel):
    origin: str
    destination: str
    start_date: date
    end_date: date
    adults: int = 1
    children: int = 0
    infants: int = 0
    budget_inr: float
    trip_purpose: TripPurpose
    transport_modes: List[TransportMode]
    transport_class: Optional[str] = None
    accommodation_type: AccommodationType
    amenities: List[str] = Field(default_factory=list)
    diet_type: DietType
    cuisines: List[str] = Field(default_factory=list)
    meal_budget_per_day: float
    additional_context: Optional[str] = None
    target_price_alert: Optional[float] = None
    traveller_names: Optional[List[str]] = None
    split_type: Optional[str] = None  # "equal" or "custom"
    language: str = "en"
