from pydantic import BaseModel, Field
from datetime import date
from typing import List, Optional
from backend.models.trip_request import TripRequest

class Activity(BaseModel):
    time: str
    location: str
    description: str
    google_maps_link: Optional[str] = None
    cost: float = 0.0

class MealOption(BaseModel):
    restaurant_name: str
    cuisine: str
    rating: Optional[float] = None
    avg_cost_for_two: Optional[float] = None
    google_maps_link: Optional[str] = None
    deep_link: Optional[str] = None

class DayMealPlan(BaseModel):
    breakfast: MealOption
    lunch: MealOption
    dinner: MealOption

class DayPlan(BaseModel):
    day_number: int
    date: date
    activities: List[Activity] = Field(default_factory=list)
    meals: DayMealPlan

class TransportOption(BaseModel):
    id: str
    provider: str  # AbhiBus, RedBus, Amadeus
    mode: str  # Train, Bus, Flight, Cab
    class_type: str
    departure_time: str
    arrival_time: str
    duration: str
    price_inr: float
    booking_link: str
    details: str

class HotelOption(BaseModel):
    id: str
    name: str
    type: str
    rating: float
    price_per_night_inr: float
    total_price_inr: float
    amenities: List[str] = Field(default_factory=list)
    booking_link: str
    location: str

class BudgetBreakdown(BaseModel):
    transport_cost: float
    accommodation_cost: float
    food_cost: float
    activities_cost: float
    buffer_cost: float
    total_cost: float
    overspent: bool

class PersonShare(BaseModel):
    name: str
    amount_owed: float

class SettlementTransaction(BaseModel):
    debtor: str
    creditor: str
    amount: float

class GroupSplit(BaseModel):
    shares: List[PersonShare] = Field(default_factory=list)
    settlement_transactions: List[SettlementTransaction] = Field(default_factory=list)

class PackingItem(BaseModel):
    name: str
    is_checked: bool = False
    is_custom: bool = False

class PackingCategory(BaseModel):
    category: str
    items: List[PackingItem] = Field(default_factory=list)

class HeatmapDay(BaseModel):
    date: date
    crowd_level: str  # "green", "amber", "red"
    reason: str
    events: List[str] = Field(default_factory=list)

class RiskFactor(BaseModel):
    factor: str
    score: int  # 0 to 100
    description: str

class WeatherDay(BaseModel):
    date: date
    temp_min: float
    temp_max: float
    condition: str
    icon: str

class ItineraryOutput(BaseModel):
    plan_id: str
    trip_request: TripRequest
    days: List[DayPlan] = Field(default_factory=list)
    transport_options: List[TransportOption] = Field(default_factory=list)  # top 3
    accommodation_options: List[HotelOption] = Field(default_factory=list)  # top 3
    budget_breakdown: BudgetBreakdown
    group_split: Optional[GroupSplit] = None
    packing_list: List[PackingCategory] = Field(default_factory=list)
    crowd_heatmap: List[HeatmapDay] = Field(default_factory=list)
    risk_score: int
    risk_factors: List[RiskFactor] = Field(default_factory=list)
    weather_forecast: List[WeatherDay] = Field(default_factory=list)
