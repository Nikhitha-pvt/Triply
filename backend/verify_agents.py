import asyncio
import os
import sys

# Ensure backend module is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.models.trip_request import TripRequest
from backend.agents.orchestrator import generate_full_itinerary
from backend.utils.pdf_generator import generate_itinerary_pdf

async def main():
    print("Starting End-to-End Verification...")
    
    trip_req = TripRequest(
        origin="Delhi",
        destination="Goa",
        start_date="2026-11-10",
        end_date="2026-11-15",
        adults=2,
        budget_inr=35000.0,
        trip_purpose="Leisure",
        transport_modes=["Flight", "Cab"],
        accommodation_type="3-star",
        amenities=["WiFi", "AC"],
        diet_type="Vegetarian",
        cuisines=["North Indian"],
        meal_budget_per_day=1200.0,
        additional_context="Test context."
    )

    def on_progress(agent: str, status: str, message: str, partial_result: any):
        print(f"[{agent}] [{status.upper()}]: {message}")

    try:
        print("\n--- Running Multi-Agent Orchestrator ---")
        itinerary = await generate_full_itinerary(trip_req, on_progress)
        print("\n--- Orchestrator Completed successfully ---")
        print(f"Risk Score: {itinerary.risk_score}")
        print(f"Total Cost: {itinerary.budget_breakdown.total_cost}")
        
        print("\n--- Testing PDF Generation ---")
        pdf_buffer = generate_itinerary_pdf(itinerary.model_dump())
        print(f"PDF Generated successfully. Buffer size: {len(pdf_buffer.getvalue())} bytes")
        
    except Exception as e:
        print(f"Verification Failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())
