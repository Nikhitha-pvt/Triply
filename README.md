# Triply AI 🚀

Triply AI is an intelligent, multi-agent travel planning platform that lets users build complete, bookable itineraries in seconds using natural language or voice. It features parallel AI agents, real-time WebSocket progress streaming, live dynamic routing, budget breakdown with group splitting, interactive packing lists, and PDF generation.

## Features ✨
- **Multi-Agent Architecture**: 5 specialized agents (Travel, Accommodation, Food, Safety, Itinerary) working in parallel via LangChain & Gemini 1.5 Flash.
- **Voice & Form Intake**: Speak your trip requirements directly into the browser, parsed by NLP.
- **Real-Time Streaming**: Watch agents work live via FastAPI WebSockets.
- **Group Cost Splitter**: Integrated split calculation and WhatsApp sharing link.
- **Price Alerts & What-If**: Background Celery workers monitor prices and notify you. "What-If" planning lets you swap out failed segments.
- **Crowd Heatmap**: Visual destination crowd indicators.
- **PDF Export**: Generate fully formatted travel documents.

## Tech Stack 🛠️
- **Frontend**: Next.js 14, React, Tailwind CSS, TypeScript
- **Backend**: FastAPI (Python 3.11+), Pydantic, WebSockets
- **AI/Orchestration**: LangChain, Google Gemini 1.5 Flash
- **Database/Auth**: Supabase (PostgreSQL)
- **Background Jobs**: Celery, Redis
- **APIs**: RapidAPI (Hotels), Zomato, OpenWeatherMap, Twilio, SendGrid

## Local Setup & Development 💻

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Python 3.10+

### Step 1: Environment Variables
1. Copy `.env.example` to `.env` in the root folder.
2. Fill in the keys (Gemini, Supabase, etc.).

### Step 2: Start Backend Infrastructure (Docker)
This spins up Redis and the Celery worker required for background tasks:
```bash
docker-compose up -d --build
```
*(If you do not have Docker, you can run the FastAPI server directly after installing `backend/requirements.txt` via `python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload` and disabling Celery tasks.)*

### Step 3: Start Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` to start planning your trip!

## Deployment 🌐
The project is configured for cloud deployment:
- **Backend**: Deploy the `backend/Dockerfile` to Railway or Render.
- **Frontend**: Deploy the `frontend` folder directly to Vercel.
- **Database**: Use a production Supabase project.

---
*Developed based on the Triply AI SRS v2.0*
