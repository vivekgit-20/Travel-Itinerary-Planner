import { useState, useCallback } from 'react'
import apiClient from '../api/client'

export function useProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const getProfile = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const { data } = await apiClient.get('/profile')
      setProfile(data)
      return { data, error: null }
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || 'Failed to load profile'
      setError(msg)
      return { data: null, error: msg }
    } finally { setLoading(false) }
  }, [])

  const updateProfile = useCallback(async (updates) => {
    setLoading(true); setError(null)
    try {
      const { data } = await apiClient.put('/profile', updates)
      setProfile(data)
      return { data, error: null }
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || 'Failed to update profile'
      setError(msg)
      return { data: null, error: msg }
    } finally { setLoading(false) }
  }, [])

  return { profile, loading, error, getProfile, updateProfile }
}
