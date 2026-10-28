# API Reference

Base URL: `http://localhost:8000/api/v1` (development) / `https://<your-render-service>.onrender.com/api/v1` (production)

Interactive docs (Swagger UI): `GET /api/docs`
ReDoc: `GET /api/redoc`

## Authentication

All endpoints except `GET /api/v1/health` require a valid Supabase JWT passed as a Bearer token:

```
Authorization: Bearer <access_token>
```

Requests with a missing, malformed, or expired token return `HTTP 401`.

---

## Health

### GET /api/v1/health

Check that the API is running.

**Auth required:** No

**Response 200**
```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

---

## Recommendations

### POST /api/v1/recommendations

Get AI-generated destination suggestions based on partial preferences.

**Auth required:** Yes

**Request body**
```json
{
  "interests": ["hiking", "food"],
  "travel_type": "couple",
  "budget_range": "1000-3000",
  "trip_duration": 7
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `interests` | `string[]` | Yes | At least one interest |
| `travel_type` | `string` | Yes | `solo`, `couple`, `family`, `friends` |
| `budget_range` | `string` | No | Free-text range, e.g. `"1000-3000"` |
| `trip_duration` | `integer` | No | Number of days |

**Response 200**
```json
{
  "destinations": [
    {
      "name": "Kyoto",
      "country": "Japan",
      "reasoning": "Rich cultural history and excellent food scene ideal for couples.",
      "image_url": "https://..."
    }
  ]
}
```

**Response 502** — AI service unavailable after retries.

---

## Trips

### POST /api/v1/trips

Create a new trip and generate a full AI itinerary. Rate limited: 10 requests/minute.

**Auth required:** Yes

**Request body**
```json
{
  "destination": "Tokyo, Japan",
  "start_date": "2025-03-10",
  "end_date": "2025-03-17",
  "total_budget": 2500.00,
  "travelers": 2,
  "travel_type": "couple",
  "travel_pace": "moderate",
  "interests": ["food", "culture", "art"],
  "accommodation_preference": "hotel",
  "dietary_preferences": ["vegetarian"],
  "accessibility_needs": []
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `destination` | `string` | Yes | 2–200 characters |
| `start_date` | `date` | Yes | ISO 8601 |
| `end_date` | `date` | Yes | Must be ≥ `start_date` |
| `total_budget` | `float` | Yes | > 0 |
| `travelers` | `integer` | Yes | 1–50 |
| `travel_type` | `string` | Yes | `solo`, `couple`, `family`, `friends` |
| `travel_pace` | `string` | Yes | `relaxed`, `moderate`, `fast-paced` |
| `interests` | `string[]` | Yes | At least one |
| `accommodation_preference` | `string` | Yes | Free text |
| `dietary_preferences` | `string[]` | No | |
| `accessibility_needs` | `string[]` | No | |

**Response 201** — `TripResponse` with all itinerary days populated.

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "Tokyo Adventure",
  "destination": "Tokyo, Japan",
  "start_date": "2025-03-10",
  "end_date": "2025-03-17",
  "total_budget": 2500.00,
  "travelers": 2,
  "travel_type": "couple",
  "travel_pace": "moderate",
  "interests": ["food", "culture", "art"],
  "accommodation_preference": "hotel",
  "dietary_preferences": ["vegetarian"],
  "accessibility_needs": [],
  "status": "active",
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-15T10:01:00Z",
  "itinerary_days": [
    {
      "id": "uuid",
      "trip_id": "uuid",
      "day_number": 1,
      "date": "2025-03-10",
      "theme": "Arrival & Shinjuku Exploration",
      "daily_budget": 312.50,
      "activities": [
        {
          "name": "Shinjuku Gyoen National Garden",
          "location": "Shinjuku, Tokyo",
          "start_time": "09:00",
          "end_time": "11:00",
          "estimated_cost": 5.00,
          "category": "sightseeing",
          "description": "Scenic traditional Japanese garden."
        }
      ]
    }
  ]
}
```

**Response 422** — Pydantic validation failure with field-level errors.
**Response 502** — AI service unavailable after retries.

---

### GET /api/v1/trips

List all trips owned by the authenticated user, ordered by `created_at` descending.

**Auth required:** Yes

**Response 200**
```json
[
  {
    "id": "uuid",
    "title": "Tokyo Adventure",
    "destination": "Tokyo, Japan",
    "start_date": "2025-03-10",
    "end_date": "2025-03-17",
    "total_budget": 2500.00,
    "travelers": 2,
    "status": "active",
    "created_at": "2025-01-15T10:00:00Z"
  }
]
```

---

### GET /api/v1/trips/{trip_id}

Get a single trip with all itinerary days.

**Auth required:** Yes

**Path parameters**

| Parameter | Type | Description |
|---|---|---|
| `trip_id` | `uuid` | Trip identifier |

**Response 200** — Full `TripResponse` (same shape as POST /trips response above).

**Response 404** — Trip not found or belongs to another user.

---

### PUT /api/v1/trips/{trip_id}

Update trip metadata. Verifies ownership before applying changes.

**Auth required:** Yes

**Path parameters**

| Parameter | Type | Description |
|---|---|---|
| `trip_id` | `uuid` | Trip identifier |

**Request body** — Any subset of trip fields to update:
```json
{
  "title": "Updated Trip Name",
  "status": "completed"
}
```

**Response 200** — Updated `TripResponse`.

**Response 404** — Trip not found or belongs to another user.

---

### DELETE /api/v1/trips/{trip_id}

Delete a trip and all associated itinerary days (cascade). Verifies ownership.

**Auth required:** Yes

**Path parameters**

| Parameter | Type | Description |
|---|---|---|
| `trip_id` | `uuid` | Trip identifier |

**Response 204** — No content.

**Response 404** — Trip not found or belongs to another user.

---

## PDF Export

### GET /api/v1/pdf/{trip_id}

Generate and download a PDF travel guide for a trip.

**Auth required:** Yes

**Path parameters**

| Parameter | Type | Description |
|---|---|---|
| `trip_id` | `uuid` | Trip identifier |

**Response 200** — PDF binary stream.

| Header | Value |
|---|---|
| `Content-Type` | `application/pdf` |
| `Content-Disposition` | `attachment; filename="<destination>-itinerary.pdf"` |

**Response 404** — Trip not found or belongs to another user.
**Response 500** — PDF generation failed.

---

## Itinerary

### PUT /api/v1/itinerary/{trip_id}/days/{day_number}

Update a single itinerary day (theme, activities, daily budget). Verifies ownership.

**Auth required:** Yes

**Path parameters**

| Parameter | Type | Description |
|---|---|---|
| `trip_id` | `uuid` | Trip identifier |
| `day_number` | `integer` | 1-based day number |

**Request body**
```json
{
  "theme": "Updated Day Theme",
  "daily_budget": 350.00,
  "activities": [
    {
      "name": "Senso-ji Temple",
      "location": "Asakusa, Tokyo",
      "start_time": "09:00",
      "end_time": "11:00",
      "estimated_cost": 0.00,
      "category": "sightseeing",
      "description": "Historic Buddhist temple."
    }
  ]
}
```

**Response 200** — Updated `ItineraryDaySchema`.

**Response 404** — Trip or day not found, or ownership check failed.

---

### PUT /api/v1/itinerary/{trip_id}/days/{day_number}/activities

Replace the activity list for a day (used for drag-and-drop reordering). Verifies ownership.

**Auth required:** Yes

**Path parameters**

| Parameter | Type | Description |
|---|---|---|
| `trip_id` | `uuid` | Trip identifier |
| `day_number` | `integer` | 1-based day number |

**Request body** — Array of activity objects in the new order:
```json
[
  {
    "name": "Senso-ji Temple",
    "location": "Asakusa, Tokyo",
    "start_time": "09:00",
    "end_time": "11:00",
    "estimated_cost": 0.00,
    "category": "sightseeing",
    "description": "Historic Buddhist temple."
  },
  {
    "name": "Nakamise Shopping Street",
    "location": "Asakusa, Tokyo",
    "start_time": "11:15",
    "end_time": "12:30",
    "estimated_cost": 50.00,
    "category": "shopping",
    "description": "Traditional souvenir street leading to Senso-ji."
  }
]
```

**Response 200** — Updated `ItineraryDaySchema` with the new activity order.

**Response 404** — Trip or day not found, or ownership check failed.

---

### POST /api/v1/itinerary/{trip_id}/regenerate-day

Regenerate a single day's itinerary with optional feedback. Rate limited: 10 requests/minute.

**Auth required:** Yes

**Path parameters**

| Parameter | Type | Description |
|---|---|---|
| `trip_id` | `uuid` | Trip identifier |

**Request body**
```json
{
  "day_number": 3,
  "feedback": "More outdoor activities, less shopping"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `day_number` | `integer` | Yes | 1-based day number |
| `feedback` | `string` | No | Optional guidance for the AI |

**Response 200** — Regenerated `ItineraryDaySchema`. The original `daily_budget` is preserved.

**Response 403** — Ownership check failed.
**Response 502** — AI service unavailable after retries.

---

## Profile

### GET /api/v1/profile

Get the authenticated user's profile. Creates a default profile row on first access.

**Auth required:** Yes

**Response 200**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "display_name": "Alex",
  "dietary_preferences": ["vegetarian"],
  "accessibility_needs": [],
  "default_travel_type": "couple",
  "default_travel_pace": "moderate",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-15T10:00:00Z"
}
```

---

### PUT /api/v1/profile

Update the authenticated user's profile.

**Auth required:** Yes

**Request body**
```json
{
  "display_name": "Alex",
  "dietary_preferences": ["vegetarian", "gluten-free"],
  "accessibility_needs": ["wheelchair"],
  "default_travel_type": "couple",
  "default_travel_pace": "relaxed"
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `display_name` | `string` | No | Max 100 characters |
| `dietary_preferences` | `string[]` | No | |
| `accessibility_needs` | `string[]` | No | |
| `default_travel_type` | `string` | No | `solo`, `couple`, `family`, `friends` |
| `default_travel_pace` | `string` | No | `relaxed`, `moderate`, `fast-paced` |

**Response 200** — Updated profile object.

---

## Error Responses

All error responses follow this shape:

```json
{
  "detail": "Human-readable error message"
}
```

Validation errors (422) include field-level details:

```json
{
  "detail": [
    {
      "loc": ["body", "total_budget"],
      "msg": "Input should be greater than 0",
      "type": "greater_than"
    }
  ]
}
```

| Status | Meaning |
|---|---|
| 401 | Missing or invalid JWT |
| 403 | Authenticated but not authorized for this resource |
| 404 | Resource not found or ownership check failed |
| 422 | Request body failed Pydantic validation |
| 429 | Rate limit exceeded |
| 500 | Internal server error (e.g. PDF generation failed) |
| 502 | AI service unavailable after all retries |
| 503 | Database unreachable |
