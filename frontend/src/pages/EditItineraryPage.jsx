/**
 * EditItineraryPage - edit an existing trip itinerary.
 *
 * Route: /trips/:tripId/edit
 *
 * - Loads trip data (same as ItineraryDetailsPage)
 * - Passes editable={true} + onReplace / onRemove to each DayPanel/ActivityCard
 * - Remove activity: updates local state, calls PUT /api/v1/itinerary/:tripId/days/:dayNumber
 * - Regenerate day: calls POST /api/v1/itinerary/:tripId/regenerate-day, updates that day
 * - "Save Changes" navigates back to /trips/:tripId
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  MapPin,
  Calendar,
  Users,
  Clock,
} from 'lucide-react'

import DayPanel from '../components/DayPanel/DayPanel'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import ErrorBanner from '../components/shared/ErrorBanner'
import apiClient from '../api/client'

function formatShortDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function EditItineraryPage() {
  const { tripId } = useParams()
  const navigate = useNavigate()

  const [trip, setTrip] = useState(null)
  const [days, setDays] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [regenLoadingDay, setRegenLoadingDay] = useState(null)
  const [saving, setSaving] = useState(false)

  // ─── Fetch trip ────────────────────────────────────────────────────────────

  const fetchTrip = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await apiClient.get(`/trips/${tripId}`)
      setTrip(data)
      const itineraryDays = data.itinerary_days ?? data.itinerary?.days ?? data.days ?? []
      setDays(itineraryDays)
    } catch (err) {
      console.error('[EditItineraryPage] Failed to fetch trip:', err)
      setError('Could not load the itinerary. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [tripId])

  useEffect(() => {
    fetchTrip()
  }, [fetchTrip])

  // ─── Remove activity ───────────────────────────────────────────────────────

  const handleRemoveActivity = useCallback(
    async (dayNumber, activityId) => {
      // Optimistic update
      setDays((prev) =>
        prev.map((d) => {
          if (d.day_number !== dayNumber) return d
          return {
            ...d,
            activities: (d.activities ?? []).filter((a) => a.id !== activityId),
          }
        })
      )

      // Persist to backend - send the updated day activities list
      try {
        const updatedDay = days.find((d) => d.day_number === dayNumber)
        if (!updatedDay) return
        const activities = (updatedDay.activities ?? []).filter(
          (a) => a.id !== activityId
        )
        await apiClient.put(`/itinerary/${tripId}/days/${dayNumber}`, { activities })
      } catch (err) {
        console.error('[EditItineraryPage] Failed to remove activity:', err)
        setError('Could not remove the activity. Please try again.')
        // Re-fetch to restore consistent state
        fetchTrip()
      }
    },
    [days, tripId, fetchTrip]
  )

  // ─── Regenerate day ────────────────────────────────────────────────────────

  const handleRegenDay = useCallback(
    async (dayNumber, feedback) => {
      setRegenLoadingDay(dayNumber)
      try {
        const { data } = await apiClient.post(
          `/itinerary/${tripId}/regenerate-day`,
          { day_number: dayNumber, feedback }
        )
        setDays((prev) =>
          prev.map((d) => (d.day_number === dayNumber ? data : d))
        )
      } catch (err) {
        console.error('[EditItineraryPage] Regenerate day failed:', err)
        setError(`Could not regenerate Day ${dayNumber}. Please try again.`)
      } finally {
        setRegenLoadingDay(null)
      }
    },
    [tripId]
  )

  // ─── Build DayPanel with editable ActivityCards ────────────────────────────

  // DayPanel passes onReplace/onRemove down to each ActivityCard.
  // We build per-day handlers that close over dayNumber.
  function makeDayHandlers(dayNumber) {
    return {
      onRemove: (activityId) => handleRemoveActivity(dayNumber, activityId),
      onReplace: () => {
        // Replacement via regenerate with specific hint - not implemented at
        // the activity level; the "Regenerate Day" button is the primary path.
      },
    }
  }

  // ─── Save changes (navigate back) ─────────────────────────────────────────

  const handleSave = () => {
    setSaving(true)
    navigate(`/trips/${tripId}`)
  }

  // ─── Render states ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-navy-500">Loading itinerary…</p>
        </div>
      </div>
    )
  }

  const {
    title = 'Untitled Trip',
    destination = '',
    start_date,
    end_date,
    duration_days,
    travelers_count,
  } = trip ?? {}

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Page header ── */}
      <header className="bg-white border-b border-navy-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          {/* Back link */}
          <Link
            to={`/trips/${tripId}`}
            className="inline-flex items-center gap-1.5 text-sm text-navy-500 hover:text-teal-600
                       transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Itinerary
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-navy-900 leading-tight mb-3">
                Edit: {title}
              </h1>

              <dl className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-navy-600">
                {destination && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-teal-500 shrink-0" />
                    <dd className="font-medium">{destination}</dd>
                  </div>
                )}
                {(start_date || end_date) && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-teal-500 shrink-0" />
                    <dd>
                      {formatShortDate(start_date)} - {formatShortDate(end_date)}
                    </dd>
                  </div>
                )}
                {duration_days != null && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-navy-400 shrink-0" />
                    <dd>{duration_days} {duration_days === 1 ? 'day' : 'days'}</dd>
                  </div>
                )}
                {travelers_count != null && (
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-navy-400 shrink-0" />
                    <dd>
                      {travelers_count} {travelers_count === 1 ? 'traveler' : 'travelers'}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Save button */}
            <div className="shrink-0">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn-primary inline-flex items-center gap-2 text-sm disabled:opacity-50"
                aria-label="Save changes and return to itinerary view"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6">
            <ErrorBanner
              message={error}
              onRetry={fetchTrip}
              onDismiss={() => setError(null)}
            />
          </div>
        )}

        {days.length === 0 && !loading && (
          <div className="card p-10 text-center">
            <p className="text-navy-400 text-sm">
              No itinerary days found for this trip.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {days.map((day) => {
            const { onReplace, onRemove } = makeDayHandlers(day.day_number)
            // Clone day with per-activity onReplace/onRemove injected
            // DayPanel accepts them and threads them to ActivityCard
            const editableDay = {
              ...day,
              activities: (day.activities ?? []).map((a) => ({
                ...a,
                _onReplace: onReplace,
                _onRemove: onRemove,
              })),
            }
            return (
              <DayPanel
                key={day.day_number}
                day={editableDay}
                onRegenerate={handleRegenDay}
                editable={true}
                isLoading={regenLoadingDay === day.day_number}
              />
            )
          })}
        </div>

        {/* Bottom save button */}
        {days.length > 0 && (
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
