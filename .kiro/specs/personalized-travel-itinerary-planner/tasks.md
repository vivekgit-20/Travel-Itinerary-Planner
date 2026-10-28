# Implementation Plan: Personalized Travel Itinerary Planner

## Overview

Full-stack AI-powered travel itinerary planner built as a React + Vite frontend, Python FastAPI backend, and Supabase-hosted PostgreSQL database. Tasks are organized into 11 phases: project foundation → database → auth → UI → AI integration → business logic → activity management → PDF export → profile → testing → deployment. Each task is a discrete coding step that builds on the previous ones, ending with everything wired together.

---

## Tasks

### Phase 1: Project Foundation

- [x] 1. Initialize monorepo and tooling
  - [x] 1.1 Scaffold monorepo directory structure (`frontend/`, `backend/`, `supabase/`, `docs/`)
    - Create top-level `README.md`, `.gitignore`, and `package.json` (root workspace config)
    - _Requirements: 13.1–13.10_

  - [x] 1.2 Initialize React + Vite frontend project
    - Run `npm create vite@latest frontend -- --template react` inside the monorepo root
    - Install dependencies: `react-router-dom@^6`, `tailwindcss@^3`, `@tailwindcss/forms`, `lucide-react`, `@supabase/supabase-js@^2`, `axios@^1`
    - Configure `tailwind.config.js` with content paths for `src/**/*.{jsx,js}`
    - Add `postcss.config.js` for Tailwind + autoprefixer
    - Add `index.css` with Tailwind directives (`@tailwind base/components/utilities`)
    - Create `frontend/.env.example` with `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
    - _Requirements: 13.1, 16.1_

  - [x] 1.3 Initialize FastAPI backend project
    - Create `backend/` with `main.py`, `requirements.txt`, `app/__init__.py`
    - Install: `fastapi@^0.111`, `uvicorn[standard]@^0.29`, `pydantic@^2`, `sqlalchemy@^2`, `httpx@^0.27`, `python-jose[cryptography]@^3`, `reportlab@^4`, `hypothesis@^6`, `pytest@^8`, `pytest-asyncio@^0.23`, `python-dotenv@^1`, `slowapi@^0.1`, `aiosqlite@^0.20`
    - Create `backend/.env.example` with `SUPABASE_URL`, `SUPABASE_JWT_SECRET`, `SUPABASE_ANON_KEY`, `GEMINI_API_KEY`, `USE_MOCK_AI`, `DATABASE_URL`, `FRONTEND_ORIGIN`
    - _Requirements: 14.3, 14.4_

  - [x] 1.4 Configure FastAPI CORS and health endpoint
    - Add `CORSMiddleware` in `main.py`, reading allowed origin from `FRONTEND_ORIGIN` env var
    - Implement `GET /api/v1/health` router in `app/routers/health.py` returning `{"status": "ok", "version": "1.0.0"}`
    - Register all routers with `/api/v1` prefix in `main.py`
    - _Requirements: 14.7, 1.10_

  - [ ]* 1.5 Write smoke test for health endpoint
    - Use FastAPI `TestClient` to assert `GET /api/v1/health` returns 200 and correct JSON body
    - _Requirements: 14.7_

- [x] 2. Checkpoint — verify monorepo boots
  - Ensure `uvicorn app.main:app --reload` starts without errors and `/api/v1/health` returns 200
  - Ensure `npm run dev` in `frontend/` starts Vite dev server without errors
  - Ask the user if questions arise.

---

### Phase 2: Database Layer

- [x] 3. Define database schema and ORM models
  - [x] 3.1 Write Supabase PostgreSQL migration script
    - Create `supabase/migrations/001_initial.sql` with `profiles`, `trips`, `itinerary_days` tables exactly as specified in the design (including constraints, indexes, and `UNIQUE(trip_id, day_number)`)
    - Add RLS `ENABLE ROW LEVEL SECURITY` and three RLS policies: `Users access own profile`, `Users access own trips`, `Users access own itinerary days`
    - Create `supabase/schema.sql` as a consolidated snapshot copy
    - _Requirements: 9.6, 14.1, 14.5_

  - [x] 3.2 Implement SQLAlchemy ORM models (local dev / SQLite fallback)
    - Create `app/models.py` with `TripModel` and `ItineraryDayModel` mapped to the same column names as the PostgreSQL schema
    - Create `app/database.py` with engine + `AsyncSession` factory; read `DATABASE_URL` from env, defaulting to `sqlite+aiosqlite:///./dev.db`
    - _Requirements: 9.6_

  - [x] 3.3 Implement Pydantic schemas
    - Create `app/schemas.py` with `ActivitySchema`, `ItineraryDaySchema`, `TripCreate`, `TripResponse`, `ProfileUpdate`, `RecommendationRequest`, `RecommendationResponse`, `BudgetSummary` exactly as specified in the design
    - _Requirements: 2.8, 4.1_

  - [x] 3.4 Implement `Trip_Repository`
    - Create `app/repositories/trip_repository.py` with async methods: `create()`, `get()`, `list_by_user()`, `update()`, `update_status()`, `delete()`, `create_day()`, `get_day()`, `update_day()`
    - All queries must use SQLAlchemy parameterized expressions (no raw string interpolation)
    - _Requirements: 9.1–9.4, 14.5_

  - [x] 3.5 Implement `Profile_Repository`
    - Create `app/repositories/profile_repository.py` with `get_or_create()`, `update()` methods
    - _Requirements: 11.1, 11.2, 11.3_

  - [ ]* 3.6 Write unit tests for repositories
    - Use an in-memory SQLite database (`sqlite+aiosqlite:///:memory:`) to test `create`, `get`, `update`, `delete` for both repositories
    - Verify `trip.user_id == user_id` after `create()`; verify cascade delete removes `itinerary_days` rows
    - _Requirements: 9.4_

---

### Phase 3: Authentication

- [x] 4. Implement backend JWT verification
  - [x] 4.1 Implement `verify_jwt` FastAPI dependency
    - Create `app/dependencies.py` with `verify_jwt(token: str = Depends(oauth2_scheme)) -> str`
    - Decode using `python-jose` with `HS256`, `audience="authenticated"`, secret from `SUPABASE_JWT_SECRET` env var
    - Return `user_id` (sub claim) on success; raise `HTTPException(401)` for missing, expired, or tampered tokens
    - _Requirements: 1.10, 14.1, 14.3_

  - [ ]* 4.2 Write property test for JWT verification (Property 5)
    - **Property 5: Authentication Requirement**
    - **Validates: Requirements 1.10, 14.1**
    - Use `hypothesis` to generate strings, expired tokens, and tampered payloads; assert all return HTTP 401; assert a valid token returns the correct `user_id`

- [x] 5. Implement frontend Supabase Auth integration
  - [x] 5.1 Create Supabase client and auth service
    - Create `frontend/src/lib/supabaseClient.js` using `createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)`
    - Create `frontend/src/services/authService.js` with `signUp(email, password)`, `signIn(email, password)`, `signOut()`, `getSession()`, `refreshSession()`
    - _Requirements: 1.1, 1.2, 1.6, 1.7, 1.8_

  - [x] 5.2 Implement `useAuth` hook and auth context
    - Create `frontend/src/hooks/useAuth.js` exposing `user`, `session`, `loading`, `signIn`, `signUp`, `signOut`
    - Store JWT in memory (not localStorage) for security; use Supabase's built-in session management for refresh tokens
    - Wire `onAuthStateChange` listener to handle token refresh and expiry (redirect to `/login` on `SIGNED_OUT`)
    - _Requirements: 1.5, 1.6, 1.7, 1.8_

  - [x] 5.3 Implement protected route wrapper
    - Create `frontend/src/components/shared/ProtectedRoute.jsx` that reads `useAuth()` and redirects to `/login` when unauthenticated
    - _Requirements: 1.9, 13.11_

  - [ ]* 5.4 Write property test for unauthenticated route redirect (Property 12)
    - **Property 12: Unauthenticated Route Redirect**
    - **Validates: Requirements 1.9, 13.11**
    - Use `fast-check` with Vitest + React Testing Library to assert every protected route renders `<Navigate to="/login" />` when `useAuth()` returns no session

  - [x] 5.5 Build SignUpPage and LoginPage
    - Create `frontend/src/pages/SignUpPage.jsx` at route `/signup` with email/password fields, inline field-level validation (empty fields → error before submission), and call to `authService.signUp()`
    - Create `frontend/src/pages/LoginPage.jsx` at route `/login` with same validation and call to `authService.signIn()`
    - On success, redirect to `/dashboard`; on duplicate email, display inline error
    - _Requirements: 1.1–1.5, 13.2_

  - [ ]* 5.6 Write unit tests for auth form validation (Property 13 partial)
    - **Property 13: Form Validation Rejects Whitespace-Only Inputs**
    - **Validates: Requirements 1.4, 2.3**
    - Use `fast-check` to generate whitespace-only strings; assert form validation rejects them and no API call is made

- [x] 6. Checkpoint — auth flow works end-to-end
  - Ensure sign-up, login, logout, and protected route redirect all function correctly
  - Ask the user if questions arise.

---

### Phase 4: Frontend UI & Design System

- [x] 7. Design system and shared components
  - [x] 7.1 Define design tokens in Tailwind config
    - Extend `tailwind.config.js` with custom `colors` (brand palette), `fontFamily`, and `spacing` tokens consistent with the app visual identity
    - _Requirements: 16.1, 16.6_

  - [x] 7.2 Implement shared layout components
    - Create `frontend/src/components/shared/Navbar.jsx` with authenticated links (Dashboard, Trips, Profile, Sign Out) and unauthenticated links (Sign In, Sign Up)
    - Implement collapsible mobile menu (hamburger) at viewports < Tailwind `md` (768 px) breakpoint
    - Create `frontend/src/components/shared/LoadingSpinner.jsx` and `ErrorBanner.jsx`
    - _Requirements: 16.2, 11.6, 15.7_

  - [x] 7.3 Implement `TripCard` component
    - Props: `trip: TripSummary`, `onDelete`, `onOpen`
    - Display: trip title, destination, travel dates, number of travelers, status badge (`draft`/`active`/`completed`), link to ItineraryDetailsPage
    - _Requirements: 9.7, 12.3_

  - [x] 7.4 Implement `ActivityCard` component
    - Props: `activity: Activity`, `onReplace`, `editable: boolean`
    - Display: name, time range, estimated cost, category badge, location
    - When `editable`, show replace and remove controls
    - _Requirements: 7.1_

  - [x] 7.5 Implement `DayPanel` accordion component
    - Props: `day: ItineraryDay`, `dayNumber`, `onRegenerate`, `editable`
    - Render theme heading, list of `ActivityCard` components, daily budget footer
    - Accordion expand/collapse; on mobile, disable horizontal scrolling
    - _Requirements: 4.7, 16.5_

  - [x] 7.6 Implement `BudgetWidget` component
    - Props: `dailyBudgets: DailyBudget[]`, `totalBudget: number`, `currency: string`
    - Display per-day budget bars and total allocated / per-person cost
    - _Requirements: 6.6_

- [x] 8. Build application pages
  - [x] 8.1 Implement `LandingPage`
    - Route `/` — hero section with animated tagline, feature highlights, testimonials, Sign Up and Sign In CTAs
    - _Requirements: 13.1_

  - [x] 8.2 Implement `Dashboard`
    - Route `/dashboard` (protected) — `TripCard` grid for recent trips, empty-state CTA linking to `/trips/new`, budget summary widget (total across active trips), "Create New Trip" button
    - Use `useTrip` hook to fetch trips from `GET /api/v1/trips`
    - Collapse to single-column grid on mobile
    - _Requirements: 12.1–12.6, 16.3_

  - [x] 8.3 Implement `SmartTripForm` (multi-step form)
    - Create `frontend/src/components/SmartTripForm/` with `StepIndicator.jsx`, `StepDestination.jsx`, `StepDates.jsx`, `StepPreferences.jsx`, `StepReview.jsx`
    - Collect all fields per Requirement 2.2; validate current step before advancing; show inline errors for: end < start, budget ≤ 0, empty required fields, whitespace-only destination
    - Display full-width stacked fields on mobile
    - Disable submit button and show `LoadingSpinner` while generating; do NOT clear form data during generation
    - _Requirements: 2.1–2.8, 16.4_

  - [ ]* 8.4 Write unit tests for SmartTripForm validation (Property 13)
    - **Property 13: Form Validation Rejects Whitespace-Only Inputs**
    - **Validates: Requirements 1.4, 2.3**
    - Use `fast-check` to assert whitespace-only destination and empty budget reject without API call

  - [x] 8.5 Implement `CreateTripPage`
    - Route `/trips/new` (protected) — wraps `SmartTripForm`; on submit calls `tripService.createTrip()`; on success navigates to `/trips/:tripId`
    - _Requirements: 2.6, 2.7, 13.4_

  - [x] 8.6 Implement `ItineraryDetailsPage`
    - Route `/trips/:tripId` (protected) — load trip via `GET /api/v1/trips/:tripId`; render `DayPanel` per day, `BudgetWidget`, PDF export button, edit mode toggle
    - _Requirements: 4.7, 13.6_

  - [x] 8.7 Implement `EditItineraryInterface`
    - Route `/trips/:tripId/edit` (protected) — drag-and-drop activity reordering (use HTML5 drag events or a lightweight library), activity replacement modal, single-day regeneration trigger with optional feedback input
    - _Requirements: 7.1–7.6, 8.1, 13.7_

  - [x] 8.8 Implement `SavedTripsPage`
    - Route `/trips` (protected) — full list of trips from `GET /api/v1/trips`, filter controls for status (`draft`/`active`/`completed`), delete with confirmation modal, remove from list without full reload
    - _Requirements: 9.5, 9.7, 9.8, 13.8_

  - [x] 8.9 Implement `ProfilePage`
    - Route `/profile` (protected) — display name, dietary preferences multi-select, accessibility toggles, default travel type/pace; calls `GET /api/v1/profile` and `PUT /api/v1/profile`
    - _Requirements: 11.3, 11.4, 13.9_

  - [x] 8.10 Implement `DestinationRecommendationsPage`
    - Route `/recommendations` (protected) — interest quick-select, budget range, trip duration input; calls `POST /api/v1/recommendations`; renders `DestinationCard` grid
    - _Requirements: 3.5, 13.5_

  - [x] 8.11 Implement `NotFoundPage`
    - Route `*` — simple 404 page with link back to `/`
    - _Requirements: 13.10_

  - [x] 8.12 Wire React Router routes in `App.jsx`
    - Wrap all protected routes with `<ProtectedRoute>`; add all page components at their defined routes
    - _Requirements: 13.1–13.11_

- [x] 9. Checkpoint — all pages render correctly
  - Navigate through every route manually; verify protected routes redirect unauthenticated users
  - Ask the user if questions arise.

---

### Phase 5: AI Integration

- [x] 10. Build AI service module
  - [x] 10.1 Define `ITINERARY_JSON_SCHEMA` and `SINGLE_DAY_SCHEMA`
    - Create `app/services/ai_schemas.py` with the full JSON Schema objects that Gemini must conform to (aligned with `ItineraryDaySchema` and `ActivitySchema`)
    - _Requirements: 4.3_

  - [x] 10.2 Implement deterministic mock AI provider
    - Create `app/services/mock_ai_provider.py` with `generate(response_schema) -> dict` returning hard-coded valid itinerary JSON matching `ITINERARY_JSON_SCHEMA`
    - Used when `USE_MOCK_AI=true`; ensures deterministic dev/test behavior
    - _Requirements: 4.3_

  - [x] 10.3 Implement Gemini AI service with retry
    - Create `app/services/ai_service.py` implementing `ai_service_generate()` as specified in the design pseudocode
    - Use `httpx.AsyncClient` with 30-second timeout; implement 3-attempt retry loop with exponential backoff (1 s, 2 s, 4 s); switch to mock when `USE_MOCK_AI=true`
    - On `HTTP 429` or timeout: retry; on malformed JSON: append correction instruction and retry
    - Raise `AIServiceError` after all retries exhausted
    - _Requirements: 3.3, 3.4, 4.3, 15.1, 15.2_

  - [ ]* 10.4 Write unit tests for AI service retry logic
    - Mock `httpx.AsyncClient.post` to return errors on first N calls and success on the last; assert correct number of retries and correct backoff delays
    - Assert `AIServiceError` is raised when all retries fail
    - _Requirements: 3.3, 15.1_

  - [x] 10.5 Implement itinerary prompt builder
    - Create `app/services/prompt_builder.py` with `build_itinerary_prompt(trip: TripCreate, duration_days: int) -> str` exactly as specified in the design pseudocode
    - Include all preference fields: destination, travel type, pace, total budget, travelers, interests, accommodation, dietary preferences, accessibility needs
    - _Requirements: 4.4_

  - [ ]* 10.6 Write property test for prompt completeness (Property 14)
    - **Property 14: Prompt Completeness**
    - **Validates: Requirements 4.4**
    - Use `hypothesis` to generate valid `TripCreate` instances; assert that every preference field appears as a substring in the returned prompt string

  - [x] 10.7 Implement destination recommendations endpoint
    - Create `app/routers/recommendations.py` with `POST /api/v1/recommendations`
    - Require valid JWT; call `ai_service.generate()` with a recommendation prompt; return `RecommendationResponse`
    - Apply retry on AI failure; return HTTP 502 after all retries fail
    - _Requirements: 3.1–3.4_

- [x] 11. Checkpoint — AI mock generates valid itinerary
  - Call `POST /api/v1/trips` with `USE_MOCK_AI=true`; verify `TripResponse` structure and that all days are populated
  - Ask the user if questions arise.

---

### Phase 6: Core Business Logic

- [x] 12. Implement optimization service
  - [x] 12.1 Implement `extract_neighborhood()` and `group_by_neighborhood()`
    - Create `app/services/optimization_service.py` with `extract_neighborhood(location: str) -> str` (deterministic, falls back to `"General"`) and `group_by_neighborhood(itinerary_data: dict) -> dict` as specified in the design pseudocode
    - _Requirements: 5.1, 5.5, 5.6_

  - [x] 12.2 Implement `reassign_time_slots()`
    - Add `reassign_time_slots(activities: list, day_start: str) -> list` to `optimization_service.py`
    - Preserve activity durations; insert 15-minute travel buffer on neighborhood switch; assign consecutive non-overlapping windows
    - _Requirements: 5.3, 5.4_

  - [ ]* 12.3 Write property test for activity count preservation (Property 8)
    - **Property 8: Optimization Preserves Activity Count**
    - **Validates: Requirements 5.2**
    - Use `hypothesis` to generate lists of activities with random neighborhoods; assert `len(optimize(day).activities) == len(day.activities)`

  - [ ]* 12.4 Write property test for neighborhood contiguity (Property 9)
    - **Property 9: Neighborhood Contiguity**
    - **Validates: Requirements 5.1**
    - Use `hypothesis` to generate activity lists; assert that after optimization, all activities sharing a neighborhood form a contiguous block

  - [ ]* 12.5 Write property test for activity non-overlap (Property 3)
    - **Property 3: Activity Non-Overlap**
    - **Validates: Requirements 5.3**
    - Use `hypothesis` to generate activity lists with random durations; assert `activities[i].end_time <= activities[j].start_time` for all `i < j` after `reassign_time_slots()`

  - [ ]* 12.6 Write property test for optimization determinism (Property 10)
    - **Property 10: Optimization Determinism**
    - **Validates: Requirements 5.6**
    - Use `hypothesis` to generate activity lists; assert `optimize(activities, day_start) == optimize(activities, day_start)` (calling twice with same args)

- [x] 13. Implement budget service
  - [x] 13.1 Implement `allocate_budget()`
    - Create `app/services/budget_service.py` with `allocate_budget(itinerary_data: dict, total_budget: float, travelers: int) -> dict` as specified in the design pseudocode
    - Must NOT mutate input; must return a new allocation result
    - Handle zero-cost edge case: distribute evenly across all days
    - _Requirements: 6.1–6.5_

  - [x] 13.2 Implement `calculate_summary()`
    - Add `calculate_summary(itinerary_days, total_budget, travelers) -> BudgetSummary` to `budget_service.py`
    - Returns `BudgetSummary` with `total_spent`, `per_day` breakdown, `per_person`
    - _Requirements: 6.4_

  - [ ]* 13.3 Write property test for budget safety (Property 1)
    - **Property 1: Budget Safety**
    - **Validates: Requirements 6.1**
    - Use `hypothesis` to generate `total_budget`, `num_days`, `num_travelers`; assert `sum(day.daily_budget) <= total_budget + 0.01`

  - [ ]* 13.4 Write property test for budget-activity cost consistency (Property 11)
    - **Property 11: Budget Allocation Activity-Cost Consistency**
    - **Validates: Requirements 6.2**
    - Use `hypothesis` to generate itinerary days with random activity costs; assert `|sum(a.estimated_cost) - day.daily_budget| <= 0.01` for each allocated day

- [x] 14. Implement itinerary service and trip endpoints
  - [x] 14.1 Implement `itinerary_service.generate_itinerary()`
    - Create `app/services/itinerary_service.py` implementing `generate_itinerary()` as specified in the design pseudocode:
      1. Create draft trip row
      2. Build prompt
      3. Call AI service
      4. Validate response
      5. Run optimization service
      6. Run budget service
      7. Persist `itinerary_days` rows
      8. Set trip status to `active`
    - On AI failure: delete draft trip row and raise `AIServiceError`
    - _Requirements: 4.1–4.6_

  - [ ]* 14.2 Write property test for day completeness (Property 2)
    - **Property 2: Day Completeness**
    - **Validates: Requirements 4.2**
    - Use `hypothesis` to generate `start_date` and `end_date` pairs; after mock generation, assert `len(itinerary_days) == (end_date - start_date).days + 1`

  - [ ]* 14.3 Write property test for orphan cleanup on failed generation (Property 18)
    - **Property 18: Orphan Cleanup on Failed Generation**
    - **Validates: Requirements 15.4, 4.5**
    - Mock AI service to always fail; assert that no `trips` row with `status=draft` exists in the database after the call returns HTTP 502

  - [x] 14.4 Implement trip CRUD endpoints
    - Create `app/routers/trips.py` with all five trip routes exactly as specified in the design:
      - `POST /api/v1/trips` (201) — calls `generate_itinerary()`; returns `TripResponse`
      - `GET /api/v1/trips` — list by authenticated user, ordered by `created_at` desc
      - `GET /api/v1/trips/{trip_id}` — ownership check → 404 if not owner
      - `PUT /api/v1/trips/{trip_id}` — ownership check before update
      - `DELETE /api/v1/trips/{trip_id}` — ownership check; cascade deletes `itinerary_days`
    - _Requirements: 9.1–9.4_

  - [ ]* 14.5 Write property test for ownership isolation (Property 4)
    - **Property 4: Ownership Isolation**
    - **Validates: Requirements 14.2, 8.2, 9.2, 9.3, 10.2**
    - Use `hypothesis` to generate two distinct user UUIDs; assert that trip owned by user A returns HTTP 404 when requested by user B for all write operations

  - [x] 14.6 Implement single-day regeneration endpoint
    - Create `app/routers/itinerary.py` with:
      - `POST /api/v1/itinerary/{trip_id}/regenerate-day` — ownership check (HTTP 403 on failure), call `regenerate_day()` service, return updated `ItineraryDay`
      - `PUT /api/v1/itinerary/{trip_id}/days/{day_number}` — persist updated day; return saved record
      - `PUT /api/v1/itinerary/{trip_id}/days/{day_number}/activities` — persist reordered activity list; verify ownership (HTTP 404 on failure)
    - _Requirements: 7.2–7.5, 8.1–8.6_

  - [ ]* 14.7 Write property test for regeneration isolation (Property 6)
    - **Property 6: Regeneration Isolation**
    - **Validates: Requirements 8.5**
    - Use `hypothesis` to generate a trip with N days and a random `day_number`; regenerate that day; assert all other day records are bit-identical in the database

  - [ ]* 14.8 Write property test for regeneration budget preservation (Property 15)
    - **Property 15: Regeneration Preserves Budget Allocation**
    - **Validates: Requirements 8.4**
    - Assert `result.daily_budget == original_day.daily_budget` for any regenerated day

- [x] 15. Implement rate limiting on AI-heavy endpoints
  - Add `slowapi` `Limiter` to `main.py`; apply limits to `POST /api/v1/trips`, `POST /api/v1/recommendations`, `POST /api/v1/itinerary/*/regenerate-day`
  - _Requirements: 14.8_

- [x] 16. Checkpoint — full trip creation flow works
  - Create a trip end-to-end (form → API → AI mock → optimization → budget → DB → response); verify `TripResponse` has correct day count and budget totals
  - Ask the user if questions arise.

---

### Phase 7: Activity Management

- [x] 17. Wire activity editing in the frontend
  - [x] 17.1 Implement `useTrip` and `useItinerary` hooks
    - Create `frontend/src/hooks/useTrip.js` with `createTrip`, `getTrip`, `listTrips`, `updateTrip`, `deleteTrip`
    - Create `frontend/src/hooks/useItinerary.js` with `regenerateDay`, `updateDay`, `reorderActivities`
    - All hooks attach JWT from `useAuth()` to every request via `Authorization: Bearer` header
    - _Requirements: 2.6, 7.2, 7.4, 8.1, 8.6_

  - [x] 17.2 Implement drag-and-drop activity reordering
    - In `EditItineraryInterface`, implement HTML5 drag-and-drop on `ActivityCard` items within each `DayPanel`
    - On drop, call `itineraryService.reorderActivities(tripId, dayNumber, newOrderedList, accessToken)`
    - _Requirements: 7.2_

  - [x] 17.3 Implement activity remove with empty-day guard
    - In `ActivityCard` remove handler, check if it would be the last activity in the day; if so, display a confirmation modal warning
    - Only send `PUT /api/v1/itinerary/{trip_id}/days/{day_number}` after confirmation
    - _Requirements: 7.6_

  - [x] 17.4 Implement single-day regeneration UI
    - In `DayPanel`, add "Regenerate Day N" button opening a modal with an optional feedback textarea
    - On confirm, call `itineraryService.regenerateDay()`; replace only that `DayPanel` in the UI without reloading other days
    - Show `LoadingSpinner` and disable the button during regeneration
    - _Requirements: 8.1, 8.6, 15.7_

- [x] 18. Checkpoint — activity editing and single-day regeneration work
  - Reorder activities, remove one, and regenerate a single day; verify other days are unchanged in UI and DB
  - Ask the user if questions arise.

---

### Phase 8: PDF Export

- [x] 19. Implement PDF service and endpoint
  - [x] 19.1 Implement `pdf_service.generate_pdf()`
    - Create `app/services/pdf_service.py` implementing `generate_pdf(trip: TripResponse) -> bytes` using ReportLab as specified in the design
    - Cover page with trip title and destination; one section per `ItineraryDay` (day theme + activity list with times and costs); budget summary page
    - Run in `asyncio.run_in_executor` to avoid blocking the FastAPI event loop
    - _Requirements: 10.3, 10.4, 10.5_

  - [ ]* 19.2 Write property test for PDF completeness (Property 7)
    - **Property 7: PDF Completeness**
    - **Validates: Requirements 10.4, 10.5**
    - Use `hypothesis` to generate trips with 1–30 days; assert `pdf_section_count == len(trip.itinerary_days)` and `len(pdf_bytes) < 10 * 1024 * 1024`

  - [x] 19.3 Implement `GET /api/v1/pdf/{trip_id}` endpoint
    - Create `app/routers/pdf.py`; verify JWT and ownership (HTTP 404 on failure); call `pdf_service.generate_pdf()`; return `StreamingResponse` with `Content-Type: application/pdf`
    - On PDF generation failure, return HTTP 500
    - _Requirements: 10.1, 10.2, 10.5, 10.7_

  - [x] 19.4 Implement frontend PDF download trigger
    - In `ItineraryDetailsPage`, "Export PDF" button calls `GET /api/v1/pdf/{trip_id}` with JWT; on 200 response, create a `Blob` URL and trigger `<a download>` browser download with descriptive filename
    - On error, display `ErrorBanner` without navigating away
    - _Requirements: 10.1, 10.6, 10.7_

- [x] 20. Checkpoint — PDF export downloads correctly
  - Export a trip PDF; verify all day sections are present, file downloads, and file size is reasonable
  - Ask the user if questions arise.

---

### Phase 9: Profile & Preferences

- [x] 21. Implement profile backend endpoints
  - [x] 21.1 Implement `GET /api/v1/profile` and `PUT /api/v1/profile`
    - Create `app/routers/profile.py`; `GET` calls `profile_repository.get_or_create(user_id)`; `PUT` validates `ProfileUpdate` schema and calls `profile_repository.update()`
    - _Requirements: 11.1, 11.2, 11.3, 11.5_

  - [ ]* 21.2 Write property test for profile update round-trip (Property 17)
    - **Property 17: Profile Update Round-Trip**
    - **Validates: Requirements 11.3**
    - Use `hypothesis` to generate valid `ProfileUpdate` payloads; `PUT` then `GET`; assert response is equivalent to submitted update

- [x] 22. Implement `useProfile` hook and profile integration
  - [x] 22.1 Create `useProfile` hook
    - Create `frontend/src/hooks/useProfile.js` with `getProfile()` and `updateProfile()` wrapping `profileService.js`
    - _Requirements: 11.2, 11.3_

  - [x] 22.2 Wire profile defaults into `SmartTripForm`
    - In `CreateTripPage`, call `useProfile()` on mount; pre-populate `dietary_preferences`, `accessibility_needs`, `default_travel_type`, `default_travel_pace` fields if the profile has them
    - _Requirements: 11.4_

  - [x] 22.3 Reflect updated display name in Navbar
    - Subscribe to profile updates in `Navbar.jsx`; update displayed name without page reload after `PUT /api/v1/profile` succeeds
    - _Requirements: 11.6_

- [x] 23. Checkpoint — profile saves and pre-populates form defaults
  - Update display name and preferences on ProfilePage; navigate to CreateTripPage; verify fields are pre-filled
  - Ask the user if questions arise.

---

### Phase 10: Testing

- [x] 24. Backend unit and integration tests
  - [x] 24.1 Write unit tests for `budget_service`
    - Test `allocate_budget()`: zero-cost edge case distributes evenly; costs scaled to fit `daily_budget`; no input mutation
    - Test `calculate_summary()`: correct per-person cost, per-day breakdown, total ≤ budget
    - _Requirements: 6.1–6.5_

  - [x] 24.2 Write unit tests for `optimization_service`
    - Test `extract_neighborhood()`: deterministic output, returns `"General"` for unrecognized locations
    - Test `reassign_time_slots()`: no overlapping slots, 15-minute buffer inserted on neighborhood switch, durations preserved
    - _Requirements: 5.1–5.6_

  - [x] 24.3 Write unit tests for `prompt_builder`
    - Assert all preference fields (destination, travel type, pace, budget, travelers, interests, accommodation, dietary, accessibility) appear in prompt output
    - _Requirements: 4.4_

  - [x] 24.4 Write integration tests for trip CRUD flow
    - Use FastAPI `TestClient` with SQLite and mock JWT; test create → get → update → delete lifecycle
    - Assert cascade delete removes all `itinerary_days` rows
    - _Requirements: 9.1–9.4_

  - [ ]* 24.5 Write property test for trip deletion cascade (Property 16)
    - **Property 16: Trip Deletion Cascade**
    - **Validates: Requirements 9.4**
    - Use `hypothesis` to generate trips with 1–10 days; delete trip; assert zero `itinerary_days` rows remain for that `trip_id`

  - [x] 24.6 Write integration tests for auth middleware
    - Assert `GET /api/v1/trips` returns 401 with missing token, expired token, and tampered token
    - Assert `GET /api/v1/health` returns 200 with no token
    - _Requirements: 1.10, 14.1_

- [x] 25. Frontend component tests
  - [x] 25.1 Write Vitest + React Testing Library tests for `SmartTripForm`
    - Assert step validation prevents advancing with missing fields
    - Assert end-date < start-date shows error and blocks submission
    - Assert budget ≤ 0 shows error and blocks submission
    - _Requirements: 2.3, 2.4, 2.5_

  - [x] 25.2 Write tests for `BudgetWidget`
    - Assert correct totals rendered for known input values
    - _Requirements: 6.6_

  - [x] 25.3 Write tests for `DayPanel`
    - Assert `onRegenerate` is called with correct `dayNumber` and `feedback` when form is submitted
    - _Requirements: 8.1_

  - [ ]* 25.4 Write property test for form validation (Property 13)
    - **Property 13: Form Validation Rejects Whitespace-Only Inputs**
    - **Validates: Requirements 1.4, 2.3**
    - Already covered in task 8.4 — ensure tests are passing and CI-integrated here

- [x] 26. Checkpoint — all tests pass
  - Run `pytest` in `backend/` and `vitest --run` in `frontend/`; fix any failures before proceeding
  - Ask the user if questions arise.

---

### Phase 11: Deployment Preparation

- [x] 27. Configure frontend deployment (Vercel)
  - [x] 27.1 Add `vercel.json` to `frontend/`
    - Configure `rewrites` so all routes return `index.html` (SPA fallback)
    - Document required environment variables (`VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in `docs/deployment.md`
    - _Requirements: 14.4_

- [x] 28. Configure backend deployment (Render)
  - [ ] 28.1 Add `render.yaml` to `backend/`
    - Define web service with `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
    - Document required environment variables in `docs/deployment.md`
    - _Requirements: 14.3_

- [x] 29. Finalize Supabase migration scripts
  - [x] 29.1 Verify and finalize migration files
    - Ensure `supabase/migrations/001_initial.sql` is idempotent (use `CREATE TABLE IF NOT EXISTS`, `CREATE POLICY IF NOT EXISTS`)
    - Add `supabase/migrations/002_indexes.sql` for `idx_trips_user_id` and `idx_itinerary_days_trip_id`
    - _Requirements: 9.6_

- [ ] 30. Write project documentation
  - [-] 30.1 Write `README.md` with local dev setup instructions
    - Include steps to set up `.env` files, run Supabase migration, start backend, start frontend, run tests
    - _Requirements: all_

  - [x] 30.2 Write `docs/api.md`
    - Document all API endpoints with request/response schemas and auth requirements
    - _Requirements: all_

  - [x] 30.3 Write `docs/deployment.md`
    - Vercel + Render + Supabase deployment steps, required env vars, and gotchas
    - _Requirements: all_

- [x] 31. Final checkpoint — full production-ready build
  - Run `npm run build` in `frontend/`; run `pytest` in `backend/`; ensure zero errors before tagging for deployment
  - Ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP build
- Each task references specific requirements for traceability
- Property tests (marked `*`) validate the 18 correctness properties defined in `design.md`
- Checkpoints (`Checkpoint` tasks) have no sub-tasks and are not included in the dependency graph
- Implementation language: **Python (FastAPI)** for backend, **JavaScript/JSX (React + Vite)** for frontend
- The mock AI provider (`USE_MOCK_AI=true`) must be used for all automated tests that touch itinerary generation
- Never hard-code `SUPABASE_JWT_SECRET` or `GEMINI_API_KEY` — always read from environment variables
- SQLite fallback (`aiosqlite`) is for local dev only; Supabase PostgreSQL is used in production

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["1.4"] },
    { "id": 3, "tasks": ["1.5", "3.1", "3.3"] },
    { "id": 4, "tasks": ["3.2"] },
    { "id": 5, "tasks": ["3.4", "3.5"] },
    { "id": 6, "tasks": ["3.6", "4.1"] },
    { "id": 7, "tasks": ["4.2", "5.1"] },
    { "id": 8, "tasks": ["5.2"] },
    { "id": 9, "tasks": ["5.3"] },
    { "id": 10, "tasks": ["5.4", "5.5", "7.1"] },
    { "id": 11, "tasks": ["5.6", "7.2", "7.3", "7.4", "7.5", "7.6"] },
    { "id": 12, "tasks": ["8.1", "8.2", "8.3", "8.5", "8.10", "8.11"] },
    { "id": 13, "tasks": ["8.4", "8.6", "8.7", "8.8", "8.9"] },
    { "id": 14, "tasks": ["8.12", "10.1"] },
    { "id": 15, "tasks": ["10.2"] },
    { "id": 16, "tasks": ["10.3"] },
    { "id": 17, "tasks": ["10.4", "10.5"] },
    { "id": 18, "tasks": ["10.6", "10.7", "12.1"] },
    { "id": 19, "tasks": ["12.2"] },
    { "id": 20, "tasks": ["12.3", "12.4", "12.5", "12.6", "13.1"] },
    { "id": 21, "tasks": ["13.2"] },
    { "id": 22, "tasks": ["13.3", "13.4", "14.1"] },
    { "id": 23, "tasks": ["14.2", "14.3", "14.4"] },
    { "id": 24, "tasks": ["14.5", "14.6"] },
    { "id": 25, "tasks": ["14.7", "14.8", "15"] },
    { "id": 26, "tasks": ["17.1"] },
    { "id": 27, "tasks": ["17.2", "17.3", "17.4"] },
    { "id": 28, "tasks": ["19.1"] },
    { "id": 29, "tasks": ["19.2", "19.3"] },
    { "id": 30, "tasks": ["19.4", "21.1"] },
    { "id": 31, "tasks": ["21.2", "22.1"] },
    { "id": 32, "tasks": ["22.2", "22.3"] },
    { "id": 33, "tasks": ["24.1", "24.2", "24.3", "25.1", "25.2", "25.3"] },
    { "id": 34, "tasks": ["24.4", "24.5", "24.6", "25.4"] },
    { "id": 35, "tasks": ["27.1", "28.1", "29.1"] },
    { "id": 36, "tasks": ["30.1", "30.2", "30.3"] }
  ]
}
```
