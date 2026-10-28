/**
 * CreateTripPage - route: /trips/new
 *
 * Wraps SmartTripForm, calls POST /api/v1/trips, handles loading + errors.
 * On success → navigates to /trips/:tripId
 * On error   → shows ErrorBanner (form state is preserved)
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

import SmartTripForm from '../components/SmartTripForm/SmartTripForm'
import ErrorBanner from '../components/shared/ErrorBanner'
import apiClient from '../api/client'
import { useProfile } from '../hooks/useProfile'

export default function CreateTripPage() {
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState(null)
  const [profileDefaults, setProfileDefaults] = useState({})

  const { getProfile } = useProfile()

  useEffect(() => {
    getProfile().then(({ data }) => {
      if (data?.preferences) {
        setProfileDefaults({
          dietary_preferences: data.preferences.dietary_preferences || [],
          accessibility_needs: data.preferences.accessibility_needs || [],
          traveler_type: data.preferences.default_travel_type || '',
          travel_pace: data.preferences.default_travel_pace || '',
          budget_currency: data.preferences.default_currency || 'USD',
          accommodation_pref: data.preferences.default_accommodation_pref || 'Hotel',
        })
      }
    })
  }, [])

  async function handleSubmit(formData) {
    setIsLoading(true)
    setError(null)

    try {
      const { data } = await apiClient.post('/trips', formData)
      const tripId = data?.id ?? data?.trip?.id

      if (!tripId) {
        throw new Error('Unexpected response from server: missing trip ID')
      }

      navigate(`/trips/${tripId}`)
    } catch (err) {
      console.error('[CreateTripPage] Failed to create trip:', err)

      // Extract message from API error payload, or fall back to a generic message
      const apiMessage =
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        err?.message ??
        'Something went wrong while generating your itinerary. Please try again.'

      setError(typeof apiMessage === 'string' ? apiMessage : JSON.stringify(apiMessage))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Page header ── */}
      <header className="bg-white border-b border-navy-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-navy-800 leading-tight">Plan a New Trip</h1>
          <p className="mt-1 text-sm text-navy-500">
            Tell us your preferences and we'll craft a personalised itinerary.
          </p>
        </div>
      </header>

      {/* ── Loading overlay ── */}
      {isLoading && (
        <div
          role="status"
          aria-live="polite"
          aria-label="Generating your itinerary, this may take up to 30 seconds"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center
                     bg-white/80 backdrop-blur-sm gap-4"
        >
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin" aria-hidden="true" />
          <div className="text-center">
            <p className="text-base font-semibold text-navy-800">Generating your itinerary…</p>
            <p className="text-sm text-navy-500 mt-1">This can take 10-30 seconds. Please wait.</p>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error banner - sits above the form */}
        {error && (
          <div className="mb-6">
            <ErrorBanner
              message={error}
              onDismiss={() => setError(null)}
            />
          </div>
        )}

        <SmartTripForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          defaultValues={profileDefaults}
        />
      </main>
    </div>
  )
}
