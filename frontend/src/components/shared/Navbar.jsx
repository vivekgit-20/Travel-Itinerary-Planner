/**
 * Navbar - fixed top navigation bar.
 *
 * - Authenticated: shows Dashboard, My Trips, Profile links + Sign Out button
 * - Unauthenticated: shows Sign In + Sign Up buttons
 * - Mobile (<768 px): hamburger/close toggle with collapsible dropdown
 */

import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'

const navLinkClass = ({ isActive }) =>
  isActive
    ? 'text-teal-600 font-medium text-sm transition-colors'
    : 'text-navy-600 hover:text-teal-600 font-medium text-sm transition-colors'

export default function Navbar() {
  const { isAuthenticated, signOut, user } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const { profile, getProfile } = useProfile()

  useEffect(() => {
    if (isAuthenticated) {
      getProfile()
    }
  }, [isAuthenticated, getProfile])

  const handleSignOut = async () => {
    await signOut()
    setMobileOpen(false)
    navigate('/login')
  }

  const closeMobile = () => setMobileOpen(false)

  return (
    <nav className="fixed top-0 inset-x-0 z-[9999] bg-surface-card border-b border-surface-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">

          {/* Logo */}
          <Link
            to={isAuthenticated ? '/dashboard' : '/'}
            className="flex items-center gap-1.5 text-teal-600 font-semibold text-base hover:opacity-80 transition-opacity"
          >
            <span aria-hidden="true">✈</span>
            <span>TravelPlanner</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard" className={navLinkClass}>Dashboard</NavLink>
                <NavLink to="/trips" className={navLinkClass}>My Trips</NavLink>
                <NavLink to="/profile" className={navLinkClass}>Profile</NavLink>
                <span className="text-sm text-navy-500 font-medium" aria-label="Signed in as">
                  {profile?.display_name || user?.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="ml-2 px-3 py-1.5 rounded-lg text-sm font-medium text-navy-600 hover:bg-surface-muted transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-navy-600 hover:text-teal-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-navy-600 hover:bg-surface-muted transition-colors"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-surface-border bg-surface-card animate-fade-in">
          <div className="px-4 py-3 flex flex-col gap-3">
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard" className={navLinkClass} onClick={closeMobile}>
                  Dashboard
                </NavLink>
                <NavLink to="/trips" className={navLinkClass} onClick={closeMobile}>
                  My Trips
                </NavLink>
                <NavLink to="/profile" className={navLinkClass} onClick={closeMobile}>
                  Profile
                </NavLink>
                <button
                  onClick={handleSignOut}
                  className="text-left text-sm font-medium text-navy-600 hover:text-teal-600 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-navy-600 hover:text-teal-600 transition-colors"
                  onClick={closeMobile}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium text-navy-600 hover:text-teal-600 transition-colors"
                  onClick={closeMobile}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
