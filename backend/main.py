import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import routers
from backend.api.routes.plan import router as plan_router
from backend.api.routes.alerts import router as alerts_router
from backend.api.routes.export import router as export_router
from backend.api.routes.voice import router as voice_router
from backend.api.routes.heatmap import router as heatmap_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Triply AI API",
    description="Intelligent Multi-Agent Travel Planner Backend",
    version="2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router registrations
app.include_router(plan_router, prefix="/api")
app.include_router(alerts_router, prefix="/api/alerts")
app.include_router(export_router, prefix="/api/itinerary")
app.include_router(voice_router, prefix="/api")
app.include_router(heatmap_router, prefix="/api/heatmap")

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "triply-ai-backend"}
