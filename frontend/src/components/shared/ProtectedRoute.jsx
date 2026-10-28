/**
 * ProtectedRoute - wraps React Router routes that require authentication.
 *
 * Behavior:
 *   - While auth state is loading, shows a centered spinner
 *   - If the user is not authenticated, redirects to /login (preserving the
 *     attempted URL as state.from so LoginPage can redirect back after auth)
 *   - If the user is authenticated, renders the child route element
 */

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Loader2 } from 'lucide-react'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  // Show a minimal loading screen while auth state is being restored from storage
  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
          <p className="text-sm text-navy-500">Loading…</p>
        </div>
      </div>
    )
  }

  // Redirect unauthenticated users to /login, preserving the current path
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
