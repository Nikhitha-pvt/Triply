import json
import logging
import asyncio
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from datetime import datetime

from backend.db.supabase_client import supabase
from backend.models.trip_request import TripRequest
from backend.agents.orchestrator import generate_full_itinerary
from backend.agents.safety import analyze_safety_context
from backend.agents.travel import search_travel_options
from backend.agents.accommodation import search_accommodation_options

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/plan")
async def create_trip_plan(request: TripRequest):
    """
    Creates a new trip planning request and saves it to the database as pending.
    Returns the plan_id (trip_id) to the client.
    """
    if not supabase:
        # Fallback for local development without Supabase credentials
        logger.warning("Supabase client inactive. Returning a mock plan_id.")
        import uuid
        return {"plan_id": str(uuid.uuid4()), "status": "pending"}
        
    try:
        # Convert Pydantic model to dict for Supabase JSONB
        request_data = request.model_dump()
        # Convert date objects to string for JSON serialization
        request_data['start_date'] = str(request_data['start_date'])
        request_data['end_date'] = str(request_data['end_date'])
        
        trip_entry = {
            "trip_request": request_data,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat()
        }
        
        resp = supabase.table("trips").insert(trip_entry).execute()
        if resp.data:
            new_trip = resp.data[0]
            return {"plan_id": new_trip["id"], "status": "pending"}
        else:
            raise HTTPException(status_code=500, detail="Failed to save trip to database.")
    except Exception as e:
        logger.error(f"Error creating trip plan: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.websocket("/ws/plan/{plan_id}")
async def stream_plan_progress(websocket: WebSocket, plan_id: str):
    """
    WebSocket endpoint that executes the agent pipeline and streams real-time progress.
    """
    await websocket.accept()
    logger.info(f"WebSocket connected for plan: {plan_id}")
    
    trip_req_dict = None
    
    # 1. Fetch trip request from Supabase
    if supabase:
        try:
            resp = supabase.table("trips").select("trip_request").eq("id", plan_id).execute()
            if resp.data:
                trip_req_dict = resp.data[0]["trip_request"]
            else:
                await websocket.send_json({"error": "Plan not found in database"})
                await websocket.close()
                return
        except Exception as e:
            logger.error(f"Failed to fetch trip request from Supabase: {e}")
            await websocket.send_json({"error": f"Database error: {str(e)}"})
            await websocket.close()
            return
    else:
        # Development fallback trip request
        logger.info("Using mock TripRequest for local WebSocket demo.")
        trip_req_dict = {
            "origin": "Delhi",
            "destination": "Goa",
            "start_date": "2026-11-10",
            "end_date": "2026-11-15",
            "adults": 2,
            "children": 0,
            "infants": 0,
            "budget_inr": 35000.0,
            "trip_purpose": "Leisure",
            "transport_modes": ["Flight", "Cab"],
            "accommodation_type": "3-star",
            "amenities": ["WiFi", "AC"],
            "diet_type": "Vegetarian",
            "cuisines": ["North Indian", "South Indian"],
            "meal_budget_per_day": 1200.0,
            "additional_context": "Traveling with senior citizen, recent knee surgery."
        }
        
    try:
        # Parse into TripRequest Pydantic model
        trip_req = TripRequest(**trip_req_dict)
        
        # Define progress callback
        async def send_progress_update(agent_name: str, status: str, message: str, partial_result: any):
            event = {
                "agent": agent_name,
                "status": status,
                "message": message,
                "partial_result": partial_result
            }
            try:
                await websocket.send_json(event)
            except Exception as e:
                # Client might have disconnected
                logger.warning(f"Failed to stream update: {e}")
                
        # Wrapping sync/async callback conversion
        def progress_callback(agent_name: str, status: str, message: str, partial_result: any):
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.ensure_future(send_progress_update(agent_name, status, message, partial_result))
                
        # 2. Run multi-agent orchestrator
        itinerary_output = await generate_full_itinerary(trip_req, progress_callback)
        
        # 3. Save finalized itinerary to Supabase
        if supabase:
            try:
                # Save itinerary record
                itinerary_data = itinerary_output.model_dump(mode='json')
                
                # Format dates to string
                itinerary_data['trip_request']['start_date'] = str(itinerary_data['trip_request']['start_date'])
                itinerary_data['trip_request']['end_date'] = str(itinerary_data['trip_request']['end_date'])
                for d in itinerary_data.get('days', []):
                    d['date'] = str(d['date'])
                for w in itinerary_data.get('weather_forecast', []):
                    w['date'] = str(w['date'])
                for h in itinerary_data.get('crowd_heatmap', []):
                    h['date'] = str(h['date'])
                    
                itinerary_entry = {
                    "trip_id": plan_id,
                    "itinerary_json": itinerary_data,
                    "risk_score": itinerary_output.risk_score,
                    "total_cost_inr": itinerary_output.budget_breakdown.total_cost,
                    "created_at": datetime.utcnow().isoformat()
                }
                
                # Insert Itinerary
                supabase.table("itineraries").insert(itinerary_entry).execute()
                
                # Update Trip status to complete
                supabase.table("trips").update({
                    "status": "complete",
                    "completed_at": datetime.utcnow().isoformat()
                }).eq("id", plan_id).execute()
                
            except Exception as db_err:
                logger.error(f"Failed to save final itinerary to DB: {db_err}")
                await websocket.send_json({"warning": "Itinerary generated but failed to save to cloud database."})
                
        # 4. Stream completion event
        await websocket.send_json({
            "status": "complete",
            "message": "Itinerary generation complete!",
            "itinerary": itinerary_output.model_dump(mode='json')
        })
        
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected by client for plan: {plan_id}")
    except Exception as e:
        logger.error(f"Error in WebSocket pipeline: {e}")
        try:
            await websocket.send_json({"status": "error", "message": f"Pipeline failure: {str(e)}"})
        except:
            pass
        if supabase:
            try:
                supabase.table("trips").update({"status": "failed"}).eq("id", plan_id).execute()
            except:
                pass
    finally:
        try:
            await websocket.close()
        except:
            pass

@router.get("/itinerary/{plan_id}")
async def get_itinerary(plan_id: str):
    """
    Fetches the finalized itinerary for a given plan_id (trip_id).
    """
    if not supabase:
        raise HTTPException(status_code=503, detail="Database connection is inactive.")
    try:
        resp = supabase.table("itineraries").select("*").eq("trip_id", plan_id).execute()
        if resp.data:
            return resp.data[0]["itinerary_json"]
        else:
            raise HTTPException(status_code=404, detail="Itinerary not found.")
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error retrieving itinerary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/itinerary/{plan_id}")
async def update_itinerary(plan_id: str, payload: dict):
    """
    Updates the saved itinerary JSON and associated metrics (risk score, total cost)
    in the database.
    """
    if not supabase:
        logger.warning("Supabase client inactive. Simulating successful update.")
        return {"status": "success", "message": "Itinerary updated locally (no DB)."}
        
    try:
        itinerary_data = payload.get("itinerary_json")
        risk_score = payload.get("risk_score")
        total_cost_inr = payload.get("total_cost_inr")
        
        if not itinerary_data:
            raise HTTPException(status_code=400, detail="Missing itinerary_json in payload.")
            
        # Format dates to string
        itinerary_data['trip_request']['start_date'] = str(itinerary_data['trip_request']['start_date'])
        itinerary_data['trip_request']['end_date'] = str(itinerary_data['trip_request']['end_date'])
        for d in itinerary_data.get('days', []):
            d['date'] = str(d['date'])
        for w in itinerary_data.get('weather_forecast', []):
            w['date'] = str(w['date'])
        for h in itinerary_data.get('crowd_heatmap', []):
            h['date'] = str(h['date'])
            
        update_data = {
            "itinerary_json": itinerary_data
        }
        if risk_score is not None:
            update_data["risk_score"] = float(risk_score)
        if total_cost_inr is not None:
            update_data["total_cost_inr"] = float(total_cost_inr)
            
        resp = supabase.table("itineraries").update(update_data).eq("trip_id", plan_id).execute()
        if resp.data:
            return {"status": "success", "message": "Itinerary updated successfully.", "itinerary": resp.data[0]["itinerary_json"]}
        else:
            raise HTTPException(status_code=404, detail="Itinerary not found to update.")
    except Exception as e:
        logger.error(f"Error updating itinerary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/replan")
async def replan_segment(payload: dict):
    """
    Re-runs a specific agent (travel or accommodation) with exclusion constraints
    to support the What-If replanning flow.
    Payload: { "plan_id": str, "segment_type": str, "exclude_ids": list }
    """
    plan_id = payload.get("plan_id")
    segment_type = payload.get("segment_type")
    exclude_ids = payload.get("exclude_ids", [])
    
    if not plan_id or not segment_type:
        raise HTTPException(status_code=400, detail="Missing plan_id or segment_type.")
        
    if not supabase:
        raise HTTPException(status_code=503, detail="Database connection is inactive.")
        
    try:
        # 1. Fetch original trip request
        trip_resp = supabase.table("trips").select("trip_request").eq("id", plan_id).execute()
        if not trip_resp.data:
            raise HTTPException(status_code=404, detail="Trip plan request not found.")
            
        trip_req_dict = trip_resp.data[0]["trip_request"]
        trip_req = TripRequest(**trip_req_dict)
        
        # 2. Recompute safety constraints
        constraints = await analyze_safety_context(trip_req.additional_context)
        
        # 3. Call agent based on segment type
        if segment_type == "transport":
            options = await search_travel_options(trip_req, constraints)
            # Filter out excluded options
            filtered = [opt for opt in options if opt.id not in exclude_ids]
            # Fallback if everything is excluded
            result = filtered if filtered else options
            return [opt.model_dump() for opt in result]
            
        elif segment_type == "hotel":
            options = await search_accommodation_options(trip_req, constraints)
            # Filter out excluded options
            filtered = [opt for opt in options if opt.id not in exclude_ids]
            # Fallback if everything is excluded
            result = filtered if filtered else options
            return [h.model_dump() for h in result]
            
        else:
            raise HTTPException(status_code=400, detail=f"Invalid segment_type: {segment_type}")
            
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error during replan: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/trips")
async def get_all_trips():
    """
    Fetches all completed trips (itineraries) for the dashboard.
    """
    if not supabase:
        # Fallback for local development
        import uuid
        from datetime import datetime
        mock_trip = {
            "id": str(uuid.uuid4()),
            "status": "pending",
            "created_at": datetime.utcnow().isoformat(),
            "trip_request": {
                "origin": "Delhi",
                "destination": "Goa",
                "start_date": "2026-11-10",
                "end_date": "2026-11-15",
                "adults": 2,
                "budget_inr": 35000.0,
                "trip_purpose": "Leisure"
            }
        }
        return [mock_trip]
    try:
        # Fetching basic info from trips table or itineraries table
        resp = supabase.table("trips").select("*").order("created_at", desc=True).execute()
        return resp.data
    except Exception as e:
        logger.error(f"Error retrieving trips: {e}")
        raise HTTPException(status_code=500, detail=str(e))
