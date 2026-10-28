# Requirements Document

## Introduction

The Personalized Travel Itinerary Planner is a full-stack, AI-powered web application that generates customized day-by-day travel itineraries based on user preferences including destination, budget, travel style, interests, and accessibility needs. Users register and sign in, build trips through a guided multi-step form, receive AI-generated itineraries with route optimization and budget breakdowns, edit activities inline, regenerate individual days, export professional PDF travel guides, and manage saved trips from a personal dashboard. The system is built as a React + Vite frontend, a Python FastAPI backend, and a Supabase-hosted PostgreSQL database with Row-Level Security enforced at the database level.

---

## Glossary

- **System**: The Personalized Travel Itinerary Planner application as a whole.
- **Frontend**: The React + Vite single-page application served to the browser.
- **Backend**: The Python FastAPI service that orchestrates AI, data persistence, PDF generation, and business logic.
- **Auth_Service**: The Supabase Auth component that issues and verifies JWT tokens.
- **AI_Service**: The backend component that calls the Gemini API (or mock provider) to generate itinerary content.
- **Itinerary_Service**: The backend service that coordinates AI generation, optimization, and budget allocation to produce a complete itinerary.
- **Optimization_Service**: The backend service that groups activities by neighborhood and reassigns non-overlapping time slots.
- **Budget_Service**: The backend service that allocates daily budgets and scales activity costs to fit the user's total budget.
- **PDF_Service**: The backend service that generates a downloadable PDF travel guide using ReportLab.
- **Trip_Repository**: The backend data-access layer for the `trips` and `itinerary_days` database tables.
- **Profile_Repository**: The backend data-access layer for the `profiles` database table.
- **JWT**: A JSON Web Token issued by Supabase Auth after successful sign-in.
- **RLS**: Row-Level Security policies on the Supabase PostgreSQL database that restrict each user to their own rows.
- **Trip**: A travel plan entity with preferences, status, and associated itinerary days.
- **ItineraryDay**: A single day in a trip containing a theme, a list of activities, and a daily budget.
- **Activity**: A single scheduled event within an ItineraryDay with name, location, time range, cost, and category.
- **SmartTripForm**: The multi-step form on the CreateTripPage used to collect all trip preferences.
- **Dashboard**: The authenticated landing page showing the user's recent trips and summary statistics.
- **BudgetWidget**: The UI component that renders per-day and total budget breakdowns.
- **DayPanel**: The UI accordion component that displays activities for a single itinerary day.

---

## Requirements

### Requirement 1: User Authentication

**User Story:** As a new visitor, I want to create an account and sign in, so that I can save and access my personal trips securely.

#### Acceptance Criteria

1. WHEN a user submits a valid email and password on the sign-up form, THE Auth_Service SHALL create a new account and issue a JWT access token and refresh token.
2. WHEN a user submits valid credentials on the login form, THE Auth_Service SHALL issue a JWT access token and refresh token.
3. IF a user submits an email that is already registered, THEN THE Frontend SHALL display an inline error message stating the email is already in use.
4. IF a user submits an empty email or password field, THEN THE Frontend SHALL display a field-level validation error before submitting the request.
5. WHEN a user successfully authenticates, THE Frontend SHALL store the JWT and redirect the user to the Dashboard.
6. WHEN a user's JWT expires during an active session, THE Frontend SHALL automatically use the refresh token to obtain a new JWT without requiring the user to re-enter credentials.
7. IF the refresh token is invalid or expired, THEN THE Frontend SHALL redirect the user to the login page.
8. WHEN a user clicks the sign-out control, THE Frontend SHALL clear all stored tokens and redirect the user to the landing page.
9. WHILE a user is unauthenticated, THE Frontend SHALL redirect any attempt to access protected routes (Dashboard, CreateTrip, ItineraryDetails, SavedTrips, Profile) to the login page.
10. WHEN any request is made to a non-health backend endpoint, THE Backend SHALL reject requests with a missing, malformed, or expired JWT with an HTTP 401 response.

---

### Requirement 2: Smart Trip Builder Form

**User Story:** As an authenticated user, I want to fill out a guided multi-step form with my travel preferences, so that the system can generate an itinerary tailored to my needs.

#### Acceptance Criteria

1. THE SmartTripForm SHALL present preferences collection across multiple sequential steps with a visible step progress indicator.
2. THE SmartTripForm SHALL collect: destination (text, 2–200 characters), start date, end date, total budget (USD, greater than zero), number of travelers (1–50), travel type (solo / couple / family / friends), travel pace (relaxed / moderate / fast-paced), at least one interest, accommodation preference, dietary preferences (optional), and accessibility needs (optional).
3. WHEN a user attempts to advance to the next form step, THE SmartTripForm SHALL validate all fields in the current step and display inline errors for any that fail validation before allowing progression.
4. IF the user enters an end date that is earlier than the start date, THEN THE SmartTripForm SHALL display a validation error and prevent form submission.
5. IF the user enters a budget of zero or a negative value, THEN THE SmartTripForm SHALL display a validation error and prevent form submission.
6. WHEN the user submits the completed form, THE Frontend SHALL send a POST request to `POST /api/v1/trips` with the validated preferences and the user's JWT.
7. WHILE the itinerary is being generated, THE Frontend SHALL display a progress indicator and SHALL NOT clear the form data.
8. THE Backend SHALL validate all `TripCreate` fields via Pydantic schemas before passing them to any service; IF validation fails, THEN THE Backend SHALL return HTTP 422 with field-level error details.

---

### Requirement 3: AI-Powered Destination Recommendations

**User Story:** As a user who is undecided on a destination, I want to receive AI-suggested destinations based on my partial preferences, so that I can discover trips that match my interests and budget.

#### Acceptance Criteria

1. WHEN a user submits a `RecommendationRequest` (interests, travel type, budget range, trip duration), THE AI_Service SHALL return a list of destination suggestions each containing name, country, reasoning, and image URL.
2. THE Backend SHALL require a valid JWT on `POST /api/v1/recommendations`; IF the JWT is absent or invalid, THEN THE Backend SHALL return HTTP 401.
3. WHEN the Gemini API is unavailable during a recommendation request, THE AI_Service SHALL retry up to three times with exponential backoff (1 s, 2 s, 4 s) before returning an error.
4. IF all retry attempts fail, THEN THE Backend SHALL return HTTP 502 with a user-readable error message.
5. WHEN destination recommendations are returned, THE Frontend SHALL display them as a card grid with the destination name, country, and reasoning visible on each card.

---

### Requirement 4: AI Itinerary Generation

**User Story:** As an authenticated user, I want the system to generate a complete day-by-day itinerary from my trip preferences, so that I have a detailed travel plan without manual research.

#### Acceptance Criteria

1. WHEN a `TripCreate` request is received, THE Itinerary_Service SHALL create a `Trip` row with `status=draft`, call the AI_Service to generate the itinerary, persist `ItineraryDay` rows, and set `status=active` upon success.
2. WHEN the AI_Service generates an itinerary, THE AI_Service SHALL produce exactly one `ItineraryDay` record for each calendar day between `start_date` and `end_date` (inclusive).
3. WHEN generating an itinerary, THE AI_Service SHALL instruct the Gemini API to return a JSON response that conforms to `ITINERARY_JSON_SCHEMA`; IF the response fails schema validation, THEN THE AI_Service SHALL retry the prompt up to three times.
4. THE Itinerary_Service SHALL pass the complete set of user preferences (destination, pace, interests, dietary preferences, accessibility needs, accommodation preference, number of travelers) to the AI prompt builder.
5. WHEN itinerary generation fails after all retries, THE Backend SHALL delete the draft `Trip` row and return HTTP 502.
6. WHEN a trip is created successfully, THE Backend SHALL return a `TripResponse` containing the trip metadata and all `ItineraryDay` objects with HTTP 201.
7. WHEN displaying the generated itinerary, THE Frontend SHALL render a `DayPanel` for each `ItineraryDay` showing the day theme, all activities with times and costs, and the daily budget.

---

### Requirement 5: Neighborhood and Route Optimization

**User Story:** As a user, I want my daily activities grouped by neighborhood, so that I minimize unnecessary travel and make the most of each day.

#### Acceptance Criteria

1. WHEN the Optimization_Service processes an itinerary day, THE Optimization_Service SHALL reorder activities within the day to cluster those in the same neighborhood together.
2. WHEN the Optimization_Service reorders activities, THE Optimization_Service SHALL preserve the total number of activities per day — no activities SHALL be added or removed.
3. WHEN the Optimization_Service reassigns time slots after reordering, THE Optimization_Service SHALL assign consecutive non-overlapping time windows preserving each activity's original duration.
4. WHEN the Optimization_Service switches between neighborhoods within a day, THE Optimization_Service SHALL insert a 15-minute travel buffer between the last activity of one neighborhood and the first activity of the next.
5. WHEN an activity's location does not contain a recognizable neighborhood, THE Optimization_Service SHALL assign it the label `"General"` and group it with other unrecognized locations.
6. THE Optimization_Service SHALL produce a deterministic result: given the same list of activities and the same `day_start` time, THE Optimization_Service SHALL always produce the same output.

---

### Requirement 6: Budget Calculation Service

**User Story:** As a user, I want the system to allocate my total budget across days and activities, so that I know how much to spend each day without exceeding my stated total.

#### Acceptance Criteria

1. WHEN the Budget_Service allocates a budget, THE Budget_Service SHALL assign a `daily_budget` value to every `ItineraryDay` such that the sum of all `daily_budget` values does not exceed the user's stated `total_budget`.
2. WHEN the Budget_Service scales activity costs, THE Budget_Service SHALL adjust each activity's `estimated_cost` proportionally so that the sum of costs within a day equals that day's `daily_budget`.
3. WHEN all AI-suggested costs sum to zero, THE Budget_Service SHALL distribute the total budget evenly across all days.
4. THE Budget_Service SHALL calculate a `BudgetSummary` containing: total allocated, per-day breakdown, and per-person cost (total allocated divided by number of travelers).
5. THE Budget_Service SHALL NOT mutate the input `ItineraryDay` list in place; THE Budget_Service SHALL return a new allocation result.
6. WHEN the BudgetWidget is rendered, THE Frontend SHALL display each day's `daily_budget`, the overall total allocated, and the per-person cost.

---

### Requirement 7: Itinerary Editing

**User Story:** As a user, I want to edit the generated itinerary inline, so that I can customize activities, timings, and order to match my actual preferences.

#### Acceptance Criteria

1. WHEN a user enables edit mode on the ItineraryDetailsPage, THE Frontend SHALL render each `ActivityCard` with controls to replace or remove the activity.
2. WHEN a user reorders activities via drag-and-drop, THE Frontend SHALL send a `PUT /api/v1/itinerary/{trip_id}/days/{day_number}/activities` request with the new ordered activity list.
3. WHEN the Backend receives a reorder request, THE Backend SHALL verify the requesting user owns the trip; IF ownership verification fails, THEN THE Backend SHALL return HTTP 404.
4. WHEN a user saves an edited day, THE Backend SHALL persist the updated `ItineraryDay` via `PUT /api/v1/itinerary/{trip_id}/days/{day_number}` and return the saved record.
5. WHEN an activity is updated, THE Optimization_Service SHALL NOT automatically re-run; the user-specified order SHALL be preserved.
6. IF a user removes the last activity from a day, THEN THE Frontend SHALL display a warning that the day will have no activities and require confirmation before saving.

---

### Requirement 8: Single-Day Regeneration

**User Story:** As a user, I want to regenerate a single day's itinerary with optional feedback, so that I can improve that day without losing the rest of my trip plan.

#### Acceptance Criteria

1. WHEN a user triggers "Regenerate Day N", THE Frontend SHALL send a `POST /api/v1/itinerary/{trip_id}/regenerate-day` request with `day_number` and an optional `feedback` string.
2. WHEN the Backend processes a regeneration request, THE Backend SHALL verify the requesting user owns the trip; IF ownership fails, THEN THE Backend SHALL return HTTP 403.
3. WHEN regenerating day N, THE Itinerary_Service SHALL call the AI_Service with a prompt that includes the original trip context, the existing day N data, and any user-provided feedback.
4. WHEN the new day is generated, THE Itinerary_Service SHALL run the Optimization_Service and preserve the original `daily_budget` allocation for that day.
5. WHEN the regenerated day is persisted, THE Trip_Repository SHALL update only the `itinerary_days` row for `day_number = N`; all other days SHALL remain unchanged in the database.
6. WHEN regeneration succeeds, THE Backend SHALL return the updated `ItineraryDay` and THE Frontend SHALL replace only that day's `DayPanel` in the UI without reloading other days.

---

### Requirement 9: Trip Persistence (CRUD)

**User Story:** As a user, I want to save, view, update, and delete my trips, so that I can manage my travel plans over time.

#### Acceptance Criteria

1. THE Backend SHALL expose `GET /api/v1/trips` which returns all trips owned by the authenticated user, ordered by `created_at` descending.
2. THE Backend SHALL expose `GET /api/v1/trips/{trip_id}` which returns a `TripResponse` including all `ItineraryDay` records; IF the trip does not exist or belongs to another user, THE Backend SHALL return HTTP 404.
3. THE Backend SHALL expose `PUT /api/v1/trips/{trip_id}` to update trip metadata; THE Backend SHALL verify ownership before applying any update.
4. THE Backend SHALL expose `DELETE /api/v1/trips/{trip_id}` which deletes the trip and all associated `itinerary_days` rows via cascade; THE Backend SHALL verify ownership before deletion.
5. WHEN a trip is deleted, THE Frontend SHALL remove it from the SavedTripsPage list without a full page reload.
6. THE Backend SHALL enforce RLS policies on the `trips` and `itinerary_days` tables so that database-level queries are automatically scoped to `auth.uid()`.
7. WHEN the SavedTripsPage loads, THE Frontend SHALL display all trips with their title, destination, status badge, and travel dates.
8. WHEN the SavedTripsPage is rendered, THE Frontend SHALL provide filter controls for trip status (`draft`, `active`, `completed`).

---

### Requirement 10: PDF Export

**User Story:** As a user, I want to export my itinerary as a professional PDF, so that I can save an offline copy or share it with travel companions.

#### Acceptance Criteria

1. WHEN a user clicks "Export PDF" on the ItineraryDetailsPage, THE Frontend SHALL send a `GET /api/v1/pdf/{trip_id}` request with the user's JWT.
2. WHEN the Backend receives a PDF export request, THE Backend SHALL verify the requesting user owns the trip; IF ownership fails, THE Backend SHALL return HTTP 404.
3. WHEN the PDF_Service generates a document, THE PDF_Service SHALL include: a cover page with trip title and destination, a section for each `ItineraryDay` with the day theme and activity list (names, times, costs), and a budget summary page.
4. THE PDF_Service SHALL produce one section per `ItineraryDay`; the section count SHALL equal `len(trip.itinerary_days)`.
5. THE PDF_Service SHALL return valid PDF bytes with `Content-Type: application/pdf`; THE generated file size SHALL NOT exceed 10 MB for trips up to 30 days.
6. WHEN the Backend returns the PDF response, THE Frontend SHALL trigger a browser file download with a descriptive filename.
7. WHEN PDF generation fails, THE Backend SHALL return HTTP 500 and THE Frontend SHALL display an error banner without navigating away.

---

### Requirement 11: Profile and Preferences Management

**User Story:** As a user, I want to manage my profile and save default travel preferences, so that future trips are pre-filled with my personal settings.

#### Acceptance Criteria

1. WHEN an authenticated user first signs in, THE Backend SHALL create a `profiles` row for that user if one does not already exist.
2. THE Backend SHALL expose `GET /api/v1/profile` which returns the authenticated user's profile including `display_name` and stored `preferences`.
3. WHEN a user submits the ProfilePage form, THE Backend SHALL accept a `PUT /api/v1/profile` request with `display_name` (max 100 characters), `dietary_preferences`, `accessibility_needs`, `default_travel_type`, and `default_travel_pace`.
4. WHEN the user's profile contains default preferences, THE SmartTripForm SHALL pre-populate the corresponding fields with those defaults on the CreateTripPage.
5. THE Backend SHALL enforce RLS on the `profiles` table so that users can only read or write their own profile row.
6. WHEN a user updates their display name, THE Frontend SHALL reflect the updated name in the navigation bar without requiring a page reload.

---

### Requirement 12: Dashboard

**User Story:** As an authenticated user, I want a personal dashboard that shows my recent trips and key statistics, so that I can quickly resume planning or review past trips.

#### Acceptance Criteria

1. WHEN an authenticated user navigates to the Dashboard, THE Frontend SHALL display a grid of `TripCard` components for the user's most recent trips.
2. WHEN the user has no trips, THE Frontend SHALL display an empty state with a call-to-action button linking to the CreateTripPage.
3. EACH `TripCard` SHALL display: trip title, destination, travel dates, number of travelers, trip status badge, and a link to the ItineraryDetailsPage.
4. THE Dashboard SHALL display a budget summary widget showing the total budget across all active trips.
5. WHEN a user clicks "Create New Trip" on the Dashboard, THE Frontend SHALL navigate to the CreateTripPage.
6. WHEN a user clicks a `TripCard`, THE Frontend SHALL navigate to the corresponding ItineraryDetailsPage.

---

### Requirement 13: Application Pages and Routing

**User Story:** As a user, I want all application pages to be accessible at their defined routes, so that I can navigate the application predictably.

#### Acceptance Criteria

1. THE Frontend SHALL serve a LandingPage at route `/` containing a hero section, feature highlights, and call-to-action buttons for Sign Up and Sign In.
2. THE Frontend SHALL serve a SignUpPage at route `/signup` and a LoginPage at route `/login`, each with email/password form fields and form validation.
3. THE Frontend SHALL serve a Dashboard at route `/dashboard` accessible only to authenticated users.
4. THE Frontend SHALL serve a CreateTripPage at route `/trips/new` accessible only to authenticated users.
5. THE Frontend SHALL serve a DestinationRecommendationsPage at route `/recommendations` accessible only to authenticated users.
6. THE Frontend SHALL serve an ItineraryDetailsPage at route `/trips/:tripId` accessible only to authenticated users; THE Frontend SHALL load the trip data for the given `tripId`.
7. THE Frontend SHALL serve an EditItineraryInterface accessible from route `/trips/:tripId/edit` with drag-and-drop activity reordering and a single-day regeneration trigger.
8. THE Frontend SHALL serve a SavedTripsPage at route `/trips` accessible only to authenticated users.
9. THE Frontend SHALL serve a ProfilePage at route `/profile` accessible only to authenticated users.
10. THE Frontend SHALL serve a NotFoundPage at the wildcard route `*` for any URL that does not match a defined route.
11. WHEN the Frontend is on a protected route and the user is unauthenticated, THE Frontend SHALL redirect to `/login`.

---

### Requirement 14: Security

**User Story:** As a system administrator, I want all data access and mutations to be restricted to the owning user, so that no user can view or modify another user's data.

#### Acceptance Criteria

1. THE Backend SHALL verify the JWT on every request to `/api/v1` endpoints except `GET /api/v1/health`; IF the JWT is absent, expired, or tampered, THE Backend SHALL return HTTP 401.
2. THE Backend SHALL perform an explicit `trip.user_id == user_id` ownership check before any write operation (update, delete, PDF export, regenerate); IF the check fails, THE Backend SHALL return HTTP 404 to avoid leaking trip existence.
3. THE Backend SHALL load the `SUPABASE_JWT_SECRET` exclusively from an environment variable; the secret SHALL NOT be hard-coded in source code.
4. THE Frontend SHALL expose only `SUPABASE_ANON_KEY` to the browser via `VITE_`-prefixed environment variables; the service role key SHALL NOT be included in the frontend bundle.
5. THE Backend SHALL use SQLAlchemy parameterized queries for all database operations to prevent SQL injection.
6. THE Backend SHALL validate all user-supplied inputs through Pydantic schemas before passing them to any service or repository.
7. THE Backend SHALL configure FastAPI `CORSMiddleware` to allow only the known frontend origin in production.
8. THE Backend SHALL apply rate limiting to AI-heavy endpoints (`/api/v1/trips`, `/api/v1/recommendations`, `/api/v1/itinerary/*/regenerate-day`) to prevent abuse.

---

### Requirement 15: Error Handling and User Feedback

**User Story:** As a user, I want the application to communicate errors clearly and recover gracefully, so that I am never left with a broken or silent failure state.

#### Acceptance Criteria

1. WHEN the AI_Service encounters an HTTP 429 (rate limit) or a 30-second timeout from the Gemini API, THE AI_Service SHALL retry up to three times with exponential backoff (1 s, 2 s, 4 s) before propagating the error.
2. WHEN the AI_Service receives a response that is not valid JSON or fails schema validation, THE AI_Service SHALL retry the prompt with an explicit correction instruction appended.
3. IF all AI retries are exhausted, THEN THE Backend SHALL return HTTP 502 with the message `"AI service temporarily unavailable. Please try again."` and THE Frontend SHALL display a retry banner.
4. WHEN a trip creation fails after all retries, THE Backend SHALL delete the draft `Trip` row to prevent orphaned records.
5. WHEN the database is unreachable, THE Backend SHALL return HTTP 503 and THE Frontend SHALL display a maintenance banner.
6. WHEN any API call fails on the Frontend, THE Frontend SHALL display an `ErrorBanner` component with a human-readable message and SHALL NOT expose raw error stack traces to the user.
7. WHEN long-running operations (trip generation, day regeneration) are in progress, THE Frontend SHALL display a `LoadingSpinner` and SHALL disable the triggering control to prevent duplicate submissions.
8. WHEN a user attempts to delete a trip, THE Frontend SHALL display a confirmation modal before sending the DELETE request.

---

### Requirement 16: Responsive Design

**User Story:** As a user on any device, I want the application to be usable and visually coherent on mobile, tablet, and desktop screen sizes, so that I can plan trips from any device.

#### Acceptance Criteria

1. THE Frontend SHALL use Tailwind CSS responsive utility classes so that all pages render without horizontal overflow on viewports from 375 px (mobile) to 1440 px (desktop).
2. THE Frontend SHALL render the navigation bar as a collapsible menu on viewports narrower than the Tailwind `md` breakpoint (768 px).
3. THE Dashboard TripCard grid SHALL collapse from a multi-column layout on desktop to a single-column layout on mobile viewports.
4. THE SmartTripForm steps SHALL display as full-width stacked fields on mobile viewports.
5. WHEN the ItineraryDetailsPage is viewed on a mobile viewport, THE DayPanel accordion SHALL be the primary navigation mechanism, with horizontal scrolling disabled.
6. THE Frontend SHALL meet WCAG 2.1 Level AA color contrast requirements for all text and interactive elements.
