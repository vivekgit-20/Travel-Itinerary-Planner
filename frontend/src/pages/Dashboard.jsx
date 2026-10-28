/**
 * Dashboard - authenticated landing page showing recent trips.
 *
 * Behaviour:
 *  - Fetches trips from GET /api/v1/trips on mount
 *  - Shows a loading spinner while fetching
 *  - Shows an error banner with a retry button on failure
 *  - Shows an empty-state CTA when the user has no trips
 *  - Shows a grid (max 6) of TripCard components; links to /trips for more
 *  - "Create New Trip" button in the header navigates to /trips/new
 *  - DELETE /api/v1/trips/{id} on delete, then removes from local state
 *  - Responsive: 1-col mobile → 2-col md → 3-col lg
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { PlusCircle, MapPin, Compass } from 'lucide-react'

import TripCard from '../components/TripCard/TripCard'
import LoadingSpinner from '../components/shared/LoadingSpinner'
import ErrorBanner from '../components/shared/ErrorBanner'
import { useAuth } from '../hooks/useAuth'
import apiClient from '../api/client'

const MAX_DASHBOARD_TRIPS = 6

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // ─── Data fetching ─────────────────────────────────────────────────────────

  const fetchTrips = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await apiClient.get('/trips')
      // API may return { trips: [...] } or a bare array - handle both
      const list = Array.isArray(data) ? data : (data?.trips ?? [])
      setTrips(list)
    } catch (err) {
      console.error('[Dashboard] Failed to fetch trips:', err)
      setError('Could not load your trips. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTrips()
  }, [fetchTrips])

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleOpen = useCallback((tripId) => {
    navigate(`/trips/${tripId}`)
  }, [navigate])

  const handleDelete = useCallback(async (tripId) => {
    try {
      await apiClient.delete(`/trips/${tripId}`)
      setTrips((prev) => prev.filter((t) => t.id !== tripId))
    } catch (err) {
      console.error('[Dashboard] Failed to delete trip:', err)
      setError('Could not delete the trip. Please try again.')
    }
  }, [])

  // ─── Derived values ────────────────────────────────────────────────────────

  const displayName = user?.email ?? 'Traveler'
  const recentTrips = trips.slice(0, MAX_DASHBOARD_TRIPS)
  const hasMore = trips.length > MAX_DASHBOARD_TRIPS

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Page header ── */}
      <header className="bg-white border-b border-navy-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-4
                        sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-navy-800 leading-tight">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-navy-500">
              Welcome back,{' '}
              <span className="font-medium text-teal-700">{displayName}</span>!
              Ready to plan your next adventure?
            </p>
          </div>

          <button
            onClick={() => navigate('/trips/new')}
            className="btn-primary inline-flex items-center gap-2 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" aria-hidden="true" />
            Create New Trip
          </button>
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

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-navy-500">Loading your trips…</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && trips.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-6">
            <div className="rounded-full bg-teal-50 p-6">
              <Compass
                className="w-16 h-16 text-teal-500"
                aria-hidden="true"
              />
            </div>

            <div className="max-w-sm">
              <h2 className="text-xl font-semibold text-navy-800 mb-2">No trips yet</h2>
              <p className="text-sm text-navy-500">
                Start planning your first adventure - we'll handle the details.
              </p>
            </div>

            <button
              onClick={() => navigate('/trips/new')}
              className="btn-primary inline-flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" aria-hidden="true" />
              Create Your First Trip
            </button>
          </div>
        )}

        {/* Trip grid */}
        {!loading && trips.length > 0 && (
          <section aria-label="Recent trips">
            {/* Section heading + "View all" link */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-navy-800 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-teal-600" aria-hidden="true" />
                Recent Trips
              </h2>

              {hasMore && (
                <Link
                  to="/trips"
                  className="text-sm font-medium text-teal-700 hover:text-teal-900 transition-colors"
                >
                  View all {trips.length} trips →
                </Link>
              )}
            </div>

            {/* Responsive grid */}
            <div
              className="grid grid-cols-1 gap-5
                         md:grid-cols-2
                         lg:grid-cols-3"
            >
              {recentTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onOpen={handleOpen}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {/* "View all" footer link when there are more trips */}
            {hasMore && (
              <div className="mt-8 text-center">
                <Link
                  to="/trips"
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  View all trips
                </Link>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
