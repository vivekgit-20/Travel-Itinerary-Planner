import { useState, useCallback } from 'react'
import apiClient from '../api/client'

export function useTrip() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const createTrip = useCallback(async (tripData) => {
    setLoading(true); setError(null)
    try {
      const { data } = await apiClient.post('/trips', tripData)
      return { data, error: null }
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || 'Failed to create trip'
      setError(msg)
      return { data: null, error: msg }
    } finally { setLoading(false) }
  }, [])

  const getTrip = useCallback(async (tripId) => {
    setLoading(true); setError(null)
    try {
      const { data } = await apiClient.get(`/trips/${tripId}`)
      return { data, error: null }
    } catch (err) {
      const msg = err?.response?.status === 404 ? 'Trip not found' : (err?.response?.data?.detail || err.message)
      setError(msg)
      return { data: null, error: msg }
    } finally { setLoading(false) }
  }, [])

  const listTrips = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const { data } = await apiClient.get('/trips')
      return { data, error: null }
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || 'Failed to load trips'
      setError(msg)
      return { data: null, error: msg }
    } finally { setLoading(false) }
  }, [])

  const updateTrip = useCallback(async (tripId, updates) => {
    setLoading(true); setError(null)
    try {
      const { data } = await apiClient.put(`/trips/${tripId}`, updates)
      return { data, error: null }
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message
      setError(msg)
      return { data: null, error: msg }
    } finally { setLoading(false) }
  }, [])

  const deleteTrip = useCallback(async (tripId) => {
    setLoading(true); setError(null)
    try {
      await apiClient.delete(`/trips/${tripId}`)
      return { success: true, error: null }
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message
      setError(msg)
      return { success: false, error: msg }
    } finally { setLoading(false) }
  }, [])

  return { loading, error, createTrip, getTrip, listTrips, updateTrip, deleteTrip }
}
