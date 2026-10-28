import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

// ─── Field validation helpers ─────────────────────────────────────────────────

function validateEmail(value) {
  if (!value.trim()) return 'Email is required'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address'
  return ''
}

function validatePassword(value) {
  if (!value) return 'Password is required'
  return ''
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()

  const [fields, setFields] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({ email: '', password: '' })
  const [touched, setTouched] = useState({ email: false, password: false })

  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [authError, setAuthError] = useState('')

  // Tooltip visibility state for "Forgot password?" disabled link
  const [showTooltip, setShowTooltip] = useState(false)

  // ── Validate single field on blur ──────────────────────────────────────────

  function validateField(name, value) {
    switch (name) {
      case 'email':    return validateEmail(value)
      case 'password': return validatePassword(value)
      default: return ''
    }
  }

  function handleBlur(e) {
    const { name, value } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }))
  }

  function handleChange(e) {
    const { name, value } = e.target
    setFields(prev => ({ ...prev, [name]: value }))
    if (touched[name]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, value) }))
    }
    // Clear auth error when user starts editing
    if (authError) setAuthError('')
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(e) {
    e.preventDefault()
    setAuthError('')

    const emailErr    = validateEmail(fields.email)
    const passwordErr = validatePassword(fields.password)

    setTouched({ email: true, password: true })
    setErrors({ email: emailErr, password: passwordErr })

    if (emailErr || passwordErr) return

    setSubmitting(true)
    const { success } = await signIn(fields.email, fields.password)
    setSubmitting(false)

    if (success) {
      // Redirect back to the page the user was trying to visit, or dashboard
      const from = location.state?.from ?? '/dashboard'
      navigate(from, { replace: true })
      return
    }

    setAuthError('Invalid email or password')
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo / wordmark */}
        <div className="text-center mb-8">
          <span className="text-3xl font-bold text-teal-600 font-display tracking-tight">
            ✈ TravelPlanner
          </span>
        </div>

        {/* Card */}
        <div className="card p-8 animate-slide-up">
          <h1 className="text-2xl font-semibold text-navy-900 mb-6">Welcome back</h1>

          {/* Auth error banner */}
          {authError && (
            <div
              role="alert"
              className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
            >
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-navy-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-navy-400">
                  <Mail size={16} aria-hidden="true" />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={fields.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  aria-invalid={!!errors.email}
                  placeholder="you@example.com"
                  className={`input-field pl-9 ${errors.email ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : ''}`}
                />
              </div>
              {errors.email && (
                <p id="email-error" role="alert" className="mt-1.5 text-xs text-red-600">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-navy-700">
                  Password
                </label>

                {/* "Forgot password?" - disabled placeholder with tooltip */}
                <div className="relative inline-block">
                  <button
                    type="button"
                    aria-disabled="true"
                    disabled
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    onFocus={() => setShowTooltip(true)}
                    onBlur={() => setShowTooltip(false)}
                    className="text-xs text-navy-400 cursor-not-allowed focus:outline-none focus:underline"
                  >
                    Forgot password?
                  </button>
                  {showTooltip && (
                    <div
                      role="tooltip"
                      className="absolute bottom-full right-0 mb-1.5 whitespace-nowrap rounded-lg bg-navy-800 px-2.5 py-1.5 text-xs text-white shadow-lg z-10"
                    >
                      Coming soon
                      {/* Small arrow */}
                      <span
                        aria-hidden="true"
                        className="absolute top-full right-3 -translate-x-1/2 border-4 border-transparent border-t-navy-800"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-navy-400">
                  <Lock size={16} aria-hidden="true" />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={fields.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  aria-invalid={!!errors.password}
                  placeholder="Your password"
                  className={`input-field pl-9 pr-10 ${errors.password ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : ''}`}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-navy-400 hover:text-navy-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" role="alert" className="mt-1.5 text-xs text-red-600">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-2.5 mt-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="mt-6 text-center text-sm text-navy-500">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="font-medium text-teal-600 hover:text-teal-700 underline underline-offset-2"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
