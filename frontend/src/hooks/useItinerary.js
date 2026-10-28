import { useState, useCallback } from 'react'
import apiClient from '../api/client'

export function useItinerary() {
  const [loading, setLoading] = useState(false)
  const [regeneratingDay, setRegeneratingDay] = useState(null)
  const [error, setError] = useState(null)

  const regenerateDay = useCallback(async (tripId, dayNumber, feedback = null) => {
    setRegeneratingDay(dayNumber); setError(null)
    try {
      const { data } = await apiClient.post(`/itinerary/${tripId}/regenerate-day`, {
        day_number: dayNumber,
        feedback: feedback || null,
      })
      return { data, error: null }
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || 'Regeneration failed'
      setError(msg)
      return { data: null, error: msg }
    } finally { setRegeneratingDay(null) }
  }, [])

  const updateDay = useCallback(async (tripId, dayNumber, updates) => {
    setLoading(true); setError(null)
    try {
      const { data } = await apiClient.put(`/itinerary/${tripId}/days/${dayNumber}`, updates)
      return { data, error: null }
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message
      setError(msg)
      return { data: null, error: msg }
    } finally { setLoading(false) }
  }, [])

  const reorderActivities = useCallback(async (tripId, dayNumber, activities) => {
    setLoading(true); setError(null)
    try {
      const { data } = await apiClient.put(`/itinerary/${tripId}/days/${dayNumber}/activities`, activities)
      return { data, error: null }
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message
      setError(msg)
      return { data: null, error: msg }
    } finally { setLoading(false) }
  }, [])

  return { loading, regeneratingDay, error, regenerateDay, updateDay, reorderActivities }
}
