import logging
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime

from backend.db.supabase_client import supabase
from backend.models.alert import PriceAlertCreate, PriceAlertResponse

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("", response_model=PriceAlertResponse)
async def create_price_alert(alert_in: PriceAlertCreate):
    """
    Creates a new price alert for a travel segment (transport or stay) in the database.
    """
    if not supabase:
        raise HTTPException(status_code=503, detail="Database connection is inactive.")
        
    try:
        # Resolve current price from segment_data
        current_price = float(alert_in.segment_data.get("price_inr", alert_in.segment_data.get("price_per_night_inr", 0.0)))
        
        alert_entry = {
            "trip_id": alert_in.trip_id,
            "segment_type": alert_in.segment_type,
            "segment_data": alert_in.segment_data,
            "target_price_inr": alert_in.target_price_inr,
            "current_price_inr": current_price,
            "is_active": True,
            "last_checked_at": datetime.utcnow().isoformat(),
            "created_at": datetime.utcnow().isoformat()
        }
        
        resp = supabase.table("price_alerts").insert(alert_entry).execute()
        if resp.data:
            return PriceAlertResponse(**resp.data[0])
        else:
            raise HTTPException(status_code=500, detail="Failed to write alert configuration to DB.")
    except Exception as e:
        logger.error(f"Error creating price alert: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("", response_model=List[PriceAlertResponse])
async def get_active_alerts():
    """
    Returns a list of all active price alerts.
    """
    if not supabase:
        return []
        
    try:
        resp = supabase.table("price_alerts").select("*").eq("is_active", True).execute()
        return [PriceAlertResponse(**item) for item in resp.data]
    except Exception as e:
        logger.error(f"Error fetching active alerts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{alert_id}")
async def dismiss_price_alert(alert_id: str):
    """
    Deactivates a price alert.
    """
    if not supabase:
        raise HTTPException(status_code=503, detail="Database connection is inactive.")
        
    try:
        resp = supabase.table("price_alerts").update({"is_active": False}).eq("id", alert_id).execute()
        if resp.data:
            return {"status": "success", "message": f"Alert {alert_id} deactivated."}
        else:
            raise HTTPException(status_code=404, detail="Alert not found.")
    except Exception as e:
        logger.error(f"Error deactivating alert: {e}")
        raise HTTPException(status_code=500, detail=str(e))
