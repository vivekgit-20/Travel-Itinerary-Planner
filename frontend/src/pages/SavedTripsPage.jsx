/**
 * SavedTripsPage - browse all saved trips.
 *
 * Route: /trips
 *
 * - Fetches all trips from GET /api/v1/trips on mount
 * - Status filter tabs: All / Active / Draft / Completed
 * - TripCard grid with delete confirmation
 * - Empty state when no trips match the filter
 * - Delete removes from local state without a full page reload
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, Compass } from 'lucide-react'

import TripCard from '../components/TripCard/TripCard'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import ErrorBanner from '../components/shared/ErrorBanner'
import apiClient from '../api/client'

const STATUS_TABS = [
  { value: 'all',       label: 'All' },
  { value: 'active',    label: 'Active' },
  { value: 'draft',     label: 'Draft' },
  { value: 'completed', label: 'Completed' },
]

export default function SavedTripsPage() {
  const navigate = useNavigate()

  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')

  // ─── Fetch trips ───────────────────────────────────────────────────────────

  const fetchTrips = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await apiClient.get('/trips')
      const list = Array.isArray(data) ? data : (data?.trips ?? [])
      setTrips(list)
    } catch (err) {
      console.error('[SavedTripsPage] Failed to fetch trips:', err)
      setError('Could not load your trips. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTrips()
  }, [fetchTrips])

  // ─── Delete trip ───────────────────────────────────────────────────────────

  const handleDelete = useCallback(async (tripId) => {
    // Optimistic removal
    setTrips((prev) => prev.filter((t) => t.id !== tripId))
    try {
      await apiClient.delete(`/trips/${tripId}`)
    } catch (err) {
      console.error('[SavedTripsPage] Failed to delete trip:', err)
      setError('Could not delete the trip. Refreshing list…')
      fetchTrips()
    }
  }, [fetchTrips])

  const handleOpen = useCallback(
    (tripId) => navigate(`/trips/${tripId}`),
    [navigate]
  )

  // ─── Filtered trips ────────────────────────────────────────────────────────

  const filteredTrips = useMemo(() => {
    if (activeFilter === 'all') return trips
    return trips.filter((t) => (t.status ?? 'draft') === activeFilter)
  }, [trips, activeFilter])

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Page header ── */}
      <header className="bg-white border-b border-navy-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-4
                        sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-navy-800 leading-tight">My Trips</h1>
            <p className="mt-1 text-sm text-navy-500">
              {trips.length > 0
                ? `${trips.length} ${trips.length === 1 ? 'trip' : 'trips'} saved`
                : 'No trips saved yet'}
            </p>
          </div>

          <button
            onClick={() => navigate('/trips/new')}
            className="btn-primary inline-flex items-center gap-2 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" aria-hidden="true" />
            New Trip
          </button>
        </div>

        {/* Status filter tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav
            className="flex gap-0 overflow-x-auto scrollbar-none border-t border-surface-border"
            aria-label="Filter trips by status"
          >
            {STATUS_TABS.map((tab) => {
              const count =
                tab.value === 'all'
                  ? trips.length
                  : trips.filter((t) => (t.status ?? 'draft') === tab.value).length
              const isActive = activeFilter === tab.value
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveFilter(tab.value)}
                  aria-pressed={isActive}
                  className={`
                    px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                    focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500
                    ${
                      isActive
                        ? 'border-teal-600 text-teal-700'
                        : 'border-transparent text-navy-500 hover:text-navy-700 hover:border-navy-300'
                    }
                  `}
                >
                  {tab.label}
                  {count > 0 && (
                    <span
                      className={`ml-2 rounded-full px-1.5 py-0.5 text-xs font-medium ${
                        isActive
                          ? 'bg-teal-100 text-teal-700'
                          : 'bg-navy-100 text-navy-500'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error banner */}
        {error && (
          <div className="mb-6">
            <ErrorBanner
              message={error}
              onRetry={fetchTrips}
              onDismiss={() => setError(null)}
            />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-navy-500">Loading your trips…</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredTrips.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-6">
            <div className="rounded-full bg-teal-50 p-6">
              <Compass className="w-16 h-16 text-teal-500" aria-hidden="true" />
            </div>

            <div className="max-w-sm">
              <h2 className="text-xl font-semibold text-navy-800 mb-2">
                {activeFilter === 'all'
                  ? 'No trips yet'
                  : `No ${activeFilter} trips`}
              </h2>
              <p className="text-sm text-navy-500">
                {activeFilter === 'all'
                  ? "Start planning your first adventure. We will handle all the details."
                  : `You have no trips with status "${activeFilter}".`}
              </p>
            </div>

            {activeFilter === 'all' && (
              <button
                onClick={() => navigate('/trips/new')}
                className="btn-primary inline-flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" aria-hidden="true" />
                Create Your First Trip
              </button>
            )}
          </div>
        )}

        {/* Trip grid */}
        {!loading && filteredTrips.length > 0 && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onOpen={handleOpen}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
