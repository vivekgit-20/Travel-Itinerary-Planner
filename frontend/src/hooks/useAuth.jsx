/**
 * useAuth hook - manages Supabase authentication state across the app.
 *
 * Wraps the Supabase client's onAuthStateChange listener so that any component
 * can access the current user/session without prop drilling.
 */

import { useState, useEffect, useCallback, useContext, createContext } from 'react'
import { signUp, signIn, signOut, getSession, onAuthStateChange } from '../services/authService'

// ─── Auth Context ─────────────────────────────────────────────────────────────
const AuthContext = createContext(null)

/**
 * AuthProvider - wraps the application and provides auth state.
 * Place this at the top of the React tree (inside BrowserRouter).
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  // Initialise: read the existing session on mount
  useEffect(() => {
    let unsubscribe

    async function init() {
      try {
        const { session: currentSession } = await getSession()
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
      } catch (err) {
        console.error('[AuthProvider] Failed to read session:', err)
      } finally {
        setLoading(false)
      }

      // Subscribe to auth state changes (login, logout, token refresh)
      unsubscribe = onAuthStateChange((_event, newSession) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)
        setLoading(false)
      })
    }

    init()

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  const handleSignUp = useCallback(async (email, password) => {
    setAuthError(null)
    const { data, error } = await signUp(email, password)
    if (error) {
      setAuthError(error.message)
      return { success: false, error }
    }
    return { success: true, data }
  }, [])

  const handleSignIn = useCallback(async (email, password) => {
    setAuthError(null)
    const { data, error } = await signIn(email, password)
    if (error) {
      setAuthError(error.message)
      return { success: false, error }
    }
    return { success: true, data }
  }, [])

  const handleSignOut = useCallback(async () => {
    const { error } = await signOut()
    if (!error) {
      setUser(null)
      setSession(null)
    }
    return { error }
  }, [])

  const value = {
    user,
    session,
    loading,
    authError,
    isAuthenticated: !!user,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,
    accessToken: session?.access_token ?? null,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * useAuth - consume auth state in any component.
 * Must be called inside an <AuthProvider>.
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return ctx
}
