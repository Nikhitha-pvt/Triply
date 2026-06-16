# Triply AI 🚀 — Intelligent Multi-Agent Travel Planner

Triply AI is an enterprise-grade, intelligent travel planning platform that crafts personalized, ready-to-book travel itineraries in seconds. Combining **parallel AI agent swarms**, real-time **WebSocket progress streaming**, client-side voice input processing, and interactive group budgeting, Triply AI represents a modern approach to digital travel orchestration.

Designed, developed, and deployed by **Nikhitha Uppalapati** 👩‍💻.

---

## 🌐 Live URLs
- **Live Frontend (Vercel):** [https://triply-frontend.vercel.app/](https://triply-frontend.vercel.app/)
- **Live Backend API (Render):** [https://triply-backend-1pyu.onrender.com](https://triply-backend-1pyu.onrender.com)
- **Database & Auth Engine:** Powered by Supabase Cloud

---

## 📖 The Problem & The Solution

### ⚠️ The Problem
Planning a group trip today is fractured and stressful. Travelers must switch between dozens of tabs: comparing transit options, sourcing accommodations, finding local cuisines matching dietary limits, assessing safety concerns (especially when traveling with infants or senior citizens), and manually splitting expenses. Traditional planning tools are static, slow, and fail to provide cohesive, real-time feedback.

###  The Solution
**Triply AI** solves this by introducing a multi-agent AI system that plans your entire trip in parallel.
1. **Natural Language & Voice Intake:** Speak or type your trip details in English, Hindi, Telugu, Tamil, or Kannada.
2. **Parallel Agent Execution:** Multiple specialized AI agents coordinate to query weather, transit, stays, and safety alerts simultaneously.
3. **Interactive Group Utilities:** A dynamic budget planner with customizable expense sharing and automated WhatsApp notification sharing.
4. **Resiliency:** "What-If" planning options to instantly swap out specific hotels or transports if a booking path is full.

---

## 🧩 System Architecture & Workflow

Triply AI employs a **Coordinator-Agent design pattern**. When a user requests a plan, the Orchestrator initiates 5 parallel worker agents, gathers their independent structured JSON models, and aggregates them into a master itinerary.

```mermaid
graph TD
    User([User Intake]) -->|Voice / Form Input| Intake[Intake Parser & NLP]
    Intake -->|Structured JSON Request| Orch[Orchestrator Coordinator]
    
    Orch -->|Start WS Logs| WS[WebSocket Live Logger]
    WS -->|Real-Time Status Stream| ClientUI[Client Progress UI]
    
    subgraph Agent Swarm (Parallel Execution)
        Orch --> TA[Travel Agent]
        Orch --> AA[Accommodation Agent]
        Orch --> FA[Food Agent]
        Orch --> SA[Safety Agent]
    end
    
    TA -->|Flight/Train/Cab Options| Collector[Itinerary Aggregator]
    AA -->|Stays & Amenities| Collector
    FA -->|Cuisine & Restaurant Recommendations| Collector
    SA -->|Weather Forecasts & Risk Score Analysis| Collector
    
    Collector -->|Final Consolidated Itinerary| BudgetAgent[Budget & Group Split Agent]
    BudgetAgent --> DB[(Supabase DB)]
    BudgetAgent --> FinalItin([Interactive Client Web App])
```

---

## 🧠 Detailed AI Pipeline & Data Flow

Below is the structured data processing workflow mapped directly to Triply AI's parallel orchestration architecture, following the multi-layered coloring system of the system design diagram.

### 1. User Layer 📱
*   **Next.js Frontend Client:** Collects user parameters (Origin, Destination, Dates, Budget Slider, Voice Intake, Traveler Count). Sends input to backend via `POST /api/plan` (`~500ms`).
*   **FastAPI Backend Server:** Validates session, handles CORS policies, handles auth routing, and boots the WebSocket live progress logger.

### 2. AI Pipeline Swarm (LangChain Swarm DAG) 🤖
*   **Stage 1: Intent & NLP Parser [🟠 AI/LLM Component]**
    *   *Inputs:* Voice transcripts or Form JSON.
    *   *Process:* Extracts structured intent variables (origin, destination, budget, dates, purpose) using Gemini 1.5 Flash JSON Mode.
    *   *Latency:* `~200ms`
*   **Stage 2: Route & Transit Matcher [🔵 Data Store / API]**
    *   *Inputs:* Source, Destination, Travel Class.
    *   *Process:* Queries transit options (flights, trains, buses) matching travel class and pricing.
    *   *Latency:* `~250ms`
*   **Stage 3: Accommodation Sourcing [🟢 APIs / Services]**
    *   *Inputs:* Destination, Star rating, WiFi/AC/Breakfast amenities list.
    *   *Process:* Fetches hotels from lodging indexes matching criteria and filters out over-budget stays.
    *   *Latency:* `~200ms`
*   **Stage 4: Meal & Food Matcher [🟣 Algorithms / ML]**
    *   *Inputs:* Diet Type (Veg/Vegan/Jain), Cuisine lists, Meal budget per day.
    *   *Process:* Maps local restaurants, filters by daily budget limits, and ensures pure veg/Jain constraint checks.
    *   *Latency:* `~150ms`
*   **Stage 5: Safety & Weather Scorer [🔴 Optimization / Scoring]**
    *   *Inputs:* Dates, Location, Infant/Senior traveler context.
    *   *Process:* Fetches OpenWeather forecasts, runs safety risk scores, and generates customized safety recommendations (e.g. "needs baby crib", "avoid night travel").
    *   *Latency:* `~200ms`
*   **Stage 6: Group Split & Consolidation [🟠 AI/LLM Component]**
    *   *Inputs:* All agent outputs, split type, group member names.
    *   *Process:* Formulates day-by-day itineraries, triggers the greedy debt settlement solver, and outputs a single aggregated JSON payload.
    *   *Latency:* `~300ms`
*   **Offline Tasks (Celery Workers):** Background jobs running in the background periodically querying price tables and delivering WhatsApp/Email updates.

### 3. Data & Infrastructure Layer 💾
*   **Supabase Database:** High-speed PostgreSQL server storing user profile logs, generated trip schemas, active alerts, and routing logs.
*   **Gemini 1.5 Flash Engine:** Cloud LLM API powering intent parsing and structured itinerary descriptions.
*   **External Service Integrations:** OpenWeatherMap API, Twilio SMS/WhatsApp Gateway, SendGrid Email Dispatcher.

### 📊 Scaling Notes
- **Horizontal Scaling:** Stateless FastAPI backend architecture can be horizontally scaled under high request loads.
- **Caching:** Weather forecasts and stay listings are cached to reduce latency.
- **Swarm Parallelism:** LangChain agents execute concurrently in separate threads to achieve low end-to-end latency.

---

## 📁 Repository Directory Structure

```text
Triply-lets-go/
├── backend/                             # Python FastAPI Backend
│   ├── api/
│   │   └── routes/                      # API Endpoints
│   │       ├── alerts.py                # Price alert trigger routes
│   │       ├── export.py                # PDF exporter route
│   │       ├── heatmap.py               # Crowd density indicators
│   │       ├── plan.py                  # Orchestrator & trip generation
│   │       └── voice.py                 # NLP voice transcript extraction
│   ├── agents/                          # LLM Swarm Core Logic
│   │   ├── orchestrator.py              # Swarm manager & aggregator
│   │   ├── travel.py                    # Transit option finder
│   │   ├── accommodation.py             # Stay recommendations
│   │   ├── food.py                      # Restaurant & diet compliance
│   │   ├── safety.py                    # Risk scorer & weather retriever
│   │   └── budget.py                    # Group split & debt optimizer
│   ├── services/                        # Live API Connections
│   │   ├── search_engine.py             # Booking link search via DuckDuckGo
│   │   ├── hotels.py                    # Stay directory services
│   │   ├── transport.py                 # Transit schedules
│   │   ├── weather.py                   # OpenWeather API integration
│   │   └── alerts.py                    # Alert handlers
│   ├── models/                          # Pydantic Schemas & Types
│   ├── tasks/                           # Celery background workers
│   ├── db/                              # Supabase initialization
│   ├── main.py                          # Application entrypoint
│   └── requirements.txt                 # Backend dependencies
│
├── frontend/                            # Next.js 14 App Router (TypeScript)
│   ├── app/                             # Pages
│   │   ├── plan/                        # Trip Intake Form wizard
│   │   ├── itinerary/[id]/              # Fully rendered dynamic itinerary
│   │   ├── dashboard/                   # Past saved trips
│   │   ├── alerts/                      # Active price alerts
│   │   └── page.tsx                     # Premium landing page
│   ├── components/                      # High-Fidelity UI Components
│   │   ├── Intake/                      # Step-by-Step form & Voice handler
│   │   ├── Budget/                      # Expense splitter & Settlement
│   │   ├── Itinerary/                   # Day-by-day scheduler
│   │   ├── Packing/                     # Smart checklist
│   │   ├── AgentProgress/               # Live WebSocket progress grids
│   │   └── shared/                      # Navbar, Footer & Auth Modals
│   ├── lib/                             # Supabase & API helper instances
│   ├── hooks/                           # Custom audio voice listeners
│   ├── package.json                     # Frontend dependencies
│   └── next.config.js                   # Environment config loader
│
├── .env                                 # Environment configurations (Git ignored)
├── .gitignore                           # Git build-exclusion configurations
├── test_cases.txt                       # 10 Detailed manual testing cases
└── README.md                            # High-level developer documentation
```

---

## 🛠️ Tech Stack

### 💻 Frontend
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS & Vanilla CSS
- **Icons & Visuals:** Lucide React, Recharts (Expense Doughnut charts)
- **State Management:** React hooks & Custom custom localStorage events
- **Language Support:** i18next (English, Hindi, Telugu, Tamil, Kannada)

### ⚙️ Backend
- **Core Server:** FastAPI (Python 3.10+)
- **Asynchronous Execution:** Asyncio & Multi-threading executors
- **AI Orchestration:** LangChain (Structured output parser chains)
- **Model:** Google Gemini 1.5 Flash
- **Task Broker:** Celery & Redis
- **Database / Auth:** Supabase Cloud (Postgres)

---

## 💻 Local Setup & Development

### 1. Root `.env` Configurations
Create a `.env` file in the root folder and add the following keys:
```env
GEMINI_API_KEY=your_gemini_api_key
OPENWEATHER_API_KEY=your_openweather_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Local service urls
REDIS_URL=redis://localhost:6379/0
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### 2. Start Backend
Activate your Python environment and start the FastAPI reload server:
```bash
venv\Scripts\activate
pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Start Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` to run the application locally.

---

## 🔬 System Design Architecture Diagram
<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/4d76738f-a632-4d81-8d45-a5863cb49c18" />

