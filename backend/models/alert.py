from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

class PriceAlertCreate(BaseModel):
    trip_id: str
    segment_type: str  # "transport" or "hotel"
    segment_data: Any  # Details of hotel or transport route
    target_price_inr: float

class PriceAlertResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    trip_id: str
    segment_type: str
    segment_data: Any
    target_price_inr: float
    current_price_inr: float
    last_checked_at: Optional[datetime] = None
    alert_sent_at: Optional[datetime] = None
    is_active: bool
    created_at: datetime
