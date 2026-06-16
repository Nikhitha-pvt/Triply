import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from backend.db.supabase_client import supabase
from backend.utils.pdf_generator import generate_itinerary_pdf

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/{itinerary_id}/export-pdf")
async def export_itinerary_to_pdf(itinerary_id: str):
    """
    Retrieves the itinerary from the database, generates a PDF binary, and streams it for download.
    """
    try:
        itinerary_json = None
        if not supabase:
            # Fallback mock for local development
            itinerary_json = {
                "trip_request": {
                    "origin": "Delhi",
                    "destination": "Goa",
                    "start_date": "2026-11-10",
                    "end_date": "2026-11-15",
                    "adults": 2,
                    "budget_inr": 35000.0,
                    "trip_purpose": "Leisure"
                },
                "days": [
                    {
                        "day_number": 1,
                        "date": "2026-11-10",
                        "activities": [
                            {"time": "10:00", "location": "Airport", "description": "Arrival", "cost": 0}
                        ],
                        "meals": {
                            "breakfast": {"restaurant_name": "Cafe", "cuisine": "Local"},
                            "lunch": {"restaurant_name": "Beach Shack", "cuisine": "Seafood"},
                            "dinner": {"restaurant_name": "Fine Dining", "cuisine": "Goan"}
                        }
                    }
                ],
                "budget_breakdown": {
                    "total_cost": 34000.0,
                    "transport_cost": 10000.0,
                    "accommodation_cost": 15000.0,
                    "food_cost": 5000.0,
                    "activities_cost": 4000.0,
                    "buffer_cost": 0,
                    "overspent": False
                }
            }
        else:
            # Fetch itinerary from database
            resp = supabase.table("itineraries").select("itinerary_json").eq("trip_id", itinerary_id).execute()
            if not resp.data:
                raise HTTPException(status_code=404, detail="Itinerary not found.")

            itinerary_json = resp.data[0]["itinerary_json"]

        # Generate PDF using utility
        pdf_buffer = generate_itinerary_pdf(itinerary_json)

        filename = f"Triply_AI_Itinerary_{itinerary_id[:8]}.pdf"

        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error exporting PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))
