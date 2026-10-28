/**
 * ItineraryDetailsPage - view a saved trip itinerary.
 *
 * Route: /trips/:tripId
 *
 * - Fetches trip via GET /api/v1/trips/:tripId on mount
 * - Shows trip header card, BudgetWidget, one DayPanel per day
 * - "Export PDF" button calls GET /api/v1/trips/:tripId/pdf → browser download
 * - "Edit Itinerary" button navigates to /trips/:tripId/edit
 * - Loading spinner, error banner, 404 handling
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Download,
  Pencil,
  ArrowLeft,
  Loader2,
  AlertTriangle,
} from 'lucide-react'

import BudgetWidget from '../components/BudgetWidget/BudgetWidget'
import DayPanel from '../components/DayPanel/DayPanel'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import ErrorBanner from '../components/shared/ErrorBanner'
import apiClient from '../api/client'

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatShortDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ItineraryDetailsPage() {
  const { tripId } = useParams()
  const navigate = useNavigate()

  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [exportError, setExportError] = useState(null)
  const [regenLoadingDay, setRegenLoadingDay] = useState(null)

  // ─── Fetch trip ────────────────────────────────────────────────────────────

  const fetchTrip = useCallback(async () => {
    setLoading(true)
    setError(null)
    setNotFound(false)
    try {
      const { data } = await apiClient.get(`/trips/${tripId}`)
      setTrip(data)
    } catch (err) {
      if (err.response?.status === 404) {
        setNotFound(true)
      } else {
        console.error('[ItineraryDetailsPage] Failed to fetch trip:', err)
        setError('Could not load the itinerary. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [tripId])

  useEffect(() => {
    fetchTrip()
  }, [fetchTrip])

  // ─── Export PDF ────────────────────────────────────────────────────────────

  async function handleExportPDF() {
    setPdfLoading(true)
    try {
      const response = await apiClient.get(`/pdf/${tripId}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `${trip?.destination || 'trip'}_itinerary.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setExportError('Failed to export PDF. Please try again.')
    } finally {
      setPdfLoading(false)
    }
  }

  // ─── Regenerate day ────────────────────────────────────────────────────────

  const handleRegenDay = useCallback(
    async (dayNumber, feedback) => {
      setRegenLoadingDay(dayNumber)
      try {
        const { data } = await apiClient.post(
          `/itinerary/${tripId}/regenerate-day`,
          { day_number: dayNumber, feedback }
        )
        // data is the updated day object
        setTrip((prev) => {
          if (!prev) return prev
          const days = (prev.itinerary?.days ?? prev.days ?? []).map((d) =>
            d.day_number === dayNumber ? data : d
          )
          if (prev.itinerary) {
            return { ...prev, itinerary: { ...prev.itinerary, days } }
          }
          return { ...prev, days }
        })
      } catch (err) {
        console.error('[ItineraryDetailsPage] Regenerate day failed:', err)
        setError(`Could not regenerate Day ${dayNumber}. Please try again.`)
      } finally {
        setRegenLoadingDay(null)
      }
    },
    [tripId]
  )

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

  if (notFound) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <AlertTriangle className="w-14 h-14 text-amber-400 mx-auto mb-4" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-navy-800 mb-2">Trip Not Found</h1>
          <p className="text-navy-500 mb-6">
            The itinerary you're looking for doesn't exist or may have been deleted.
          </p>
          <Link to="/trips" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to My Trips
          </Link>
        </div>
      </div>
    )
  }

  // ─── Derive data from trip ─────────────────────────────────────────────────

  const {
    title = 'Untitled Trip',
    destination = '',
    start_date,
    end_date,
    duration_days,
    travelers_count,
    travel_type,
    budget_amount,
    budget_currency,
    itinerary_days = [],
  } = trip ?? {}

  const days = itinerary_days ?? []
  const budgetData = {}

  // Build daily breakdown for BudgetWidget
  const dailyBreakdown = days.map((d) => ({
    day_number: d.day_number,
    date: d.date,
    allocated: d.daily_budget ?? 0,
  }))

  const totalAllocated = dailyBreakdown.reduce((s, d) => s + d.allocated, 0)

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Page header ── */}
      <header className="bg-white border-b border-navy-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          {/* Back link */}
          <Link
            to="/trips"
            className="inline-flex items-center gap-1.5 text-sm text-navy-500 hover:text-teal-600
                       transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            My Trips
          </Link>

          {/* Trip header card */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {/* Left: title + meta */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-navy-900 leading-tight mb-3">
                {title}
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

                {travel_type && (
                  <div className="flex items-center gap-1.5">
                    <span className="badge bg-teal-100 text-teal-700 capitalize">
                      {travel_type}
                    </span>
                  </div>
                )}
              </dl>
            </div>

            {/* Right: action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleExportPDF}
                disabled={pdfLoading}
                className="btn-secondary inline-flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Export itinerary as PDF"
              >
                {pdfLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {pdfLoading ? 'Exporting…' : 'Export PDF'}
              </button>

              <button
                type="button"
                onClick={() => navigate(`/trips/${tripId}/edit`)}
                className="btn-primary inline-flex items-center gap-2 text-sm"
                aria-label="Edit itinerary"
              >
                <Pencil className="w-4 h-4" />
                Edit Itinerary
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(error || exportError) && (
          <div className="mb-6">
            <ErrorBanner
              message={exportError || error}
              onRetry={exportError ? undefined : fetchTrip}
              onDismiss={() => { setError(null); setExportError(null) }}
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-start">
          {/* Budget widget */}
          <aside className="lg:col-span-1">
            <BudgetWidget
              totalBudget={budget_amount ?? 0}
              allocated={totalAllocated}
              perPerson={travelers_count ? totalAllocated / travelers_count : null}
              currency={budget_currency ?? 'USD'}
              dailyBreakdown={dailyBreakdown}
              travelers={travelers_count}
            />
          </aside>

          {/* Day panels */}
          <section className="lg:col-span-2 flex flex-col gap-3" aria-label="Itinerary days">
            {days.length === 0 ? (
              <div className="card p-10 text-center">
                <p className="text-navy-400 text-sm">
                  No itinerary days found for this trip.
                </p>
              </div>
            ) : (
              days.map((day) => (
                <DayPanel
                  key={day.day_number}
                  day={day}
                  onRegenerate={handleRegenDay}
                  editable={false}
                  isLoading={regenLoadingDay === day.day_number}
                />
              ))
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
