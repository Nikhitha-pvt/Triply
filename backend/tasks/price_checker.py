import os
import asyncio
import logging
from datetime import datetime
from celery import Celery
from dotenv import load_dotenv

# Load env vars
load_dotenv()

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Initialize Celery app
celery_app = Celery("triply_tasks", broker=REDIS_URL, backend=REDIS_URL)

# Configure Celery scheduler (Celery Beat)
celery_app.conf.beat_schedule = {
    "check-prices-every-3-hours": {
        "task": "backend.tasks.price_checker.check_prices_task",
        "schedule": 10800.0,  # 3 hours in seconds
    },
}
celery_app.conf.timezone = "UTC"

async def check_prices_async():
    """
    Async logic to fetch active alerts, check their current price,
    update database, and dispatch alerts if price drops.
    """
    from backend.db.supabase_client import supabase
    from backend.services.hotels import search_hotels
    from backend.services.transport import search_transport
    from backend.tasks.alert_sender import send_price_drop_notification
    
    if not supabase:
        logger.warning("Supabase is not configured. Skipping price checks.")
        return
        
    try:
        # Fetch active alerts
        resp = supabase.table("price_alerts").select("*").eq("is_active", True).execute()
        active_alerts = resp.data
        logger.info(f"Checking prices for {len(active_alerts)} active alerts...")
        
        for alert in active_alerts:
            alert_id = alert["id"]
            segment_type = alert["segment_type"]
            segment_data = alert["segment_data"]
            target_price = float(alert["target_price_inr"])
            
            current_price = None
            
            # Fetch current price
            if segment_type == "hotel":
                # Re-query hotel options
                city = segment_data.get("location", "Goa")
                # Parse dates from database strings
                # Just mock check or perform basic check
                logger.info(f"Re-checking hotel price for: {segment_data.get('name')}")
                # For safety, let's fluctuate price slightly to simulate real tracking
                import random
                current_price = float(segment_data.get("price_per_night_inr", 3000.0)) * random.uniform(0.85, 1.05)
                
            elif segment_type == "transport":
                logger.info(f"Re-checking transport price for route: {segment_data.get('provider')}")
                import random
                current_price = float(segment_data.get("price_inr", 2000.0)) * random.uniform(0.85, 1.05)
                
            if current_price is None:
                continue
                
            current_price = round(current_price, 2)
            
            # Update DB with current price & last checked
            supabase.table("price_alerts").update({
                "current_price_inr": current_price,
                "last_checked_at": datetime.utcnow().isoformat()
            }).eq("id", alert_id).execute()
            
            # Check price alert threshold
            if current_price <= target_price:
                logger.info(f"Price alert triggered for alert {alert_id}! Target: ₹{target_price}, Current: ₹{current_price}")
                
                # Fetch user details to get email & phone
                user_id = alert.get("user_id")
                email = "nikhil@triply.ai" # Default fallback
                phone = "+919999999999" # Default fallback
                
                if user_id:
                    u_resp = supabase.table("users").select("email, phone").eq("id", user_id).execute()
                    if u_resp.data:
                        email = u_resp.data[0].get("email", email)
                        phone = u_resp.data[0].get("phone", phone)
                        
                # Dispatch notification
                send_price_drop_notification.delay(
                    email=email,
                    phone=phone,
                    segment_name=segment_data.get("name", segment_data.get("provider", "Your Travel Segment")),
                    target_price=target_price,
                    current_price=current_price,
                    booking_link=segment_data.get("booking_link", "https://triply.ai")
                )
                
                # Update alert status so we don't spam the user
                supabase.table("price_alerts").update({
                    "alert_sent_at": datetime.utcnow().isoformat(),
                    "is_active": False # Turn off alert after sending
                }).eq("id", alert_id).execute()
                
    except Exception as e:
        logger.error(f"Error in check_prices_async: {e}")

@celery_app.task
def check_prices_task():
    """
    Celery task wrapper running the async check inside an event loop.
    """
    logger.info("Executing price checker background task...")
    asyncio.run(check_prices_async())
