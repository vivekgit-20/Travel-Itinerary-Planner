# Personalized Travel Itinerary Planner

An AI-powered travel planning app that generates complete day-by-day itineraries based on your destination, budget, travel style, and interests. Built as a React + Vite frontend, Python FastAPI backend, and Supabase-hosted PostgreSQL database.

---

## Features

- **Multi-step trip builder** — guided form collecting destination, dates, budget, pace, interests, dietary preferences, and accessibility needs
- **AI-generated itineraries** — day-by-day activity plans with times, costs, and locations powered by Google Gemini
- **Route optimization** — activities grouped by neighborhood to minimize travel within each day
- **Budget allocation** — total budget automatically distributed across days and scaled to activity costs
- **Inline editing** — drag-and-drop activity reordering, remove activities, and regenerate individual days with optional feedback
- **PDF export** — professional downloadable travel guide with cover page, daily schedules, and budget summary
- **Saved trips dashboard** — manage all your trips with status filters (draft / active / completed)
- **Profile & defaults** — save preferred travel style, dietary needs, and accessibility settings to pre-fill future trips
- **Destination recommendations** — AI-suggested destinations based on your interests and budget
- **Demo mode** — runs fully with a mock AI provider; no Gemini API key required

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, React Router 6, Tailwind CSS 3, Axios, Supabase JS SDK |
| Backend | Python 3.9+, FastAPI 0.111, SQLAlchemy 2 (async), Pydantic 2, Uvicorn |
| Database | Supabase (PostgreSQL) with Row-Level Security; SQLite for local dev |
| Auth | Supabase Auth (JWT / HS256) |
| AI | Google Gemini API (or built-in mock provider) |
| PDF | ReportLab 4 |
| Rate limiting | SlowAPI |
| Testing | Pytest + Hypothesis (backend), Vitest + fast-check (frontend) |
| Deployment | Vercel (frontend), Render (backend) |

---

## Project Structure

```
.
├── frontend/               # React + Vite SPA
│   ├── src/
│   │   ├── api/            # Axios client
│   │   ├── components/     # Shared UI components
│   │   ├── hooks/          # useAuth, useTrip, useItinerary, useProfile
│   │   ├── pages/          # Route-level page components
│   │   ├── services/       # authService, tripService, profileService
│   │   └── App.jsx         # Router and route wiring
│   ├── vercel.json         # Vercel deployment config
│   └── package.json
├── backend/                # FastAPI service
│   ├── app/
│   │   ├── api/routes/     # FastAPI routers (trips, itinerary, pdf, profile, …)
│   │   ├── core/           # Config, security, rate limiter
│   │   ├── database/       # SQLAlchemy engine, ORM models
│   │   ├── repositories/   # Trip and profile data-access layer
│   │   ├── schemas/        # Pydantic request/response schemas
│   │   ├── services/       # AI, itinerary, optimization, budget, PDF services
│   │   └── main.py         # FastAPI app factory, CORS, lifespan
│   ├── tests/              # Pytest test suite
│   ├── render.yaml         # Render deployment config
│   └── requirements.txt
├── supabase/
│   ├── migrations/
│   │   └── 001_initial.sql # Database schema + RLS policies
│   └── schema.sql          # Consolidated schema snapshot
├── docs/
│   ├── api.md              # API reference
│   └── deployment.md       # Deployment guide
└── README.md
```

---

## Prerequisites

- **Node.js 18+** and npm
- **Python 3.9+** and pip
- **Supabase account** (free tier works) — or use the local SQLite fallback for development without Supabase
- A **Google Gemini API key** — or set `USE_MOCK_AI=true` to skip this entirely

---

## Quick Start

```bash
git clone <repo-url>
cd "Iternary project"

# 1. Start the backend
cd backend
cp .env.example .env          # edit .env with your values (see below)
pip install -r requirements.txt
uvicorn app.main:app --reload  # http://localhost:8000

# 2. Start the frontend (new terminal)
cd frontend
cp .env.example .env          # edit .env with your values (see below)
npm install
npm run dev                    # http://localhost:5173
```

---

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env — see Environment Variables section
npm run dev
```

The dev server runs at `http://localhost:5173`.

### Frontend environment variables

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | Yes | Backend API base URL, e.g. `http://localhost:8000/api/v1` |
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Your Supabase anon (public) key |

---

## Backend Setup

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env — see Environment Variables section
uvicorn app.main:app --reload
```

The API runs at `http://localhost:8000`. Interactive docs available at `http://localhost:8000/api/docs`.

### Backend environment variables

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | Yes* | Your Supabase project URL |
| `SUPABASE_JWT_SECRET` | Yes* | JWT secret from Supabase project settings |
| `SUPABASE_ANON_KEY` | Yes* | Supabase anon key |
| `GEMINI_API_KEY` | No† | Google Gemini API key |
| `USE_MOCK_AI` | No | Set `true` to use mock AI provider (no Gemini key needed) |
| `DATABASE_URL` | No | SQLAlchemy DB URL; defaults to `sqlite+aiosqlite:///./dev.db` |
| `FRONTEND_ORIGIN` | Yes | Allowed CORS origin, e.g. `http://localhost:5173` |
| `DEMO_MODE` | No | Set `true` to enable demo features |

\* Required when using Supabase auth. Can be omitted for local SQLite-only development with a dummy JWT secret.
† Required when `USE_MOCK_AI=false`.

---

## Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration:
   ```sql
   -- paste the contents of supabase/migrations/001_initial.sql
   ```
3. Verify RLS is enabled on `profiles`, `trips`, and `itinerary_days` tables (it is set by the migration, but confirm in **Authentication → Policies**)
4. Copy your credentials from **Project Settings → API**:
   - `Project URL` → `SUPABASE_URL` and `VITE_SUPABASE_URL`
   - `anon public` key → `SUPABASE_ANON_KEY` and `VITE_SUPABASE_ANON_KEY`
   - `JWT Secret` (under **Project Settings → JWT Settings**) → `SUPABASE_JWT_SECRET`

---

## AI API Setup

1. Go to [Google AI Studio](https://aistudio.google.com/) and create an API key
2. Set `GEMINI_API_KEY=<your-key>` in `backend/.env`
3. Set `USE_MOCK_AI=false`

The backend implements exponential-backoff retry (1 s → 2 s → 4 s, up to 3 attempts) on rate limits and timeouts from the Gemini API.

---

## Demo Mode

Run the entire app without a Gemini API key:

```bash
# backend/.env
USE_MOCK_AI=true
```

The mock AI provider returns a hard-coded but structurally valid itinerary. All other features (auth, CRUD, PDF export, optimization, budget) work exactly as in production.

---

## Running Tests

### Backend

```bash
cd backend
pytest                          # all tests
pytest tests/ -v                # verbose
pytest tests/test_health.py     # single file
```

### Frontend

```bash
cd frontend
npm run test                    # Vitest watch mode
npm run test -- --run           # single pass (CI)
```

---

## Production Build

### Frontend

```bash
cd frontend
npm run build       # outputs to frontend/dist/
npm run preview     # preview the production build locally
```

### Backend

```bash
# Production server with multiple workers
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## Deployment

### Frontend → Vercel

1. Push the repo to GitHub
2. Import the project in [Vercel](https://vercel.com) and set the **Root Directory** to `frontend`
3. Vercel picks up `vercel.json` automatically (build command, output dir, SPA rewrites, asset cache headers)
4. Add environment variables in the Vercel project settings:
   - `VITE_API_BASE_URL` → your Render backend URL + `/api/v1`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Backend → Render

1. Import the repo in [Render](https://render.com)
2. Set **Root Directory** to `backend`; Render reads `render.yaml` automatically
3. Add environment variables in the Render dashboard (all `sync: false` vars from `render.yaml`)
4. The health check at `/api/v1/health` is used by Render to confirm the service is up

See [docs/deployment.md](docs/deployment.md) for a step-by-step guide.

---

## Known Limitations

- **Single Gemini model** — the backend uses the `gemini-1.5-flash` model. Swap the model name in `ai_service.py` if you need a different one.
- **SQLite for local dev** — the local SQLite fallback does not enforce RLS. Use Supabase for any multi-user or production scenario.
- **PDF size** — PDF export is validated to stay under 10 MB for trips up to 30 days, but very long trips with many activities may approach this limit.
- **Rate limits** — AI-heavy endpoints are limited to 10 requests/minute per IP. Adjust the limit in `app/core/limiter.py` if needed.
- **No email confirmation** — Supabase email confirmation is not enforced by default in the free tier. Enable it in Supabase Auth settings for production.

---

## Troubleshooting

**`uvicorn` fails to start with `ModuleNotFoundError`**
Run `pip install -r requirements.txt` from inside the `backend/` directory, not the repo root.

**Frontend shows "Network Error" on every API call**
Check that `VITE_API_BASE_URL` points to the running backend and that `FRONTEND_ORIGIN` in the backend `.env` matches the frontend origin (including port).

**JWT 401 errors after logging in**
Ensure `SUPABASE_JWT_SECRET` matches the secret in **Supabase → Project Settings → JWT Settings**. A common mistake is copying the anon key here instead of the JWT secret.

**`USE_MOCK_AI=true` but generation still fails**
Make sure you restarted the backend after changing `.env`. The `USE_MOCK_AI` value is read at startup.

**Supabase RLS blocks all queries**
Confirm the `001_initial.sql` migration ran successfully. Check **Supabase → Table Editor → RLS** for each table — policies should list `Users access own *` rules.

**Render deploy fails at `pip install`**
Render uses Python 3.11 by default. If you need to pin the version, add a `.python-version` file to the `backend/` directory containing `3.11`.
