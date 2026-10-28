import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  if (value.length < 8) return 'Password must be at least 8 characters'
  return ''
}

function validateConfirmPassword(value, password) {
  if (!value) return 'Please confirm your password'
  if (value !== password) return 'Passwords do not match'
  return ''
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SignUpPage() {
  const navigate = useNavigate()
  const { signUp } = useAuth()

  const [fields, setFields] = useState({ email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({ email: '', password: '', confirmPassword: '' })
  const [touched, setTouched] = useState({ email: false, password: false, confirmPassword: false })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [generalError, setGeneralError] = useState('')

  // ── Validate single field on blur ──────────────────────────────────────────

  function validateField(name, value) {
    switch (name) {
      case 'email':      return validateEmail(value)
      case 'password':   return validatePassword(value)
      case 'confirmPassword': return validateConfirmPassword(value, fields.password)
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
    // Re-validate live once user has already blurred the field
    if (touched[name]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, value) }))
    }
    // If password changes, re-validate confirmPassword if it was already touched
    if (name === 'password' && touched.confirmPassword) {
      setErrors(prev => ({
        ...prev,
        confirmPassword: validateConfirmPassword(fields.confirmPassword, value),
      }))
    }
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(e) {
    e.preventDefault()
    setGeneralError('')

    // Touch all fields and validate
    const emailErr        = validateEmail(fields.email)
    const passwordErr     = validatePassword(fields.password)
    const confirmErr      = validateConfirmPassword(fields.confirmPassword, fields.password)

    setTouched({ email: true, password: true, confirmPassword: true })
    setErrors({ email: emailErr, password: passwordErr, confirmPassword: confirmErr })

    if (emailErr || passwordErr || confirmErr) return

    setSubmitting(true)
    const { success, error } = await signUp(fields.email, fields.password)
    setSubmitting(false)

    if (success) {
      navigate('/dashboard')
      return
    }

    // Map known Supabase error messages to friendly copy
    const msg = error?.message ?? ''
    if (
      msg.toLowerCase().includes('user already registered') ||
      msg.toLowerCase().includes('already exists') ||
      msg.toLowerCase().includes('email address is already')
    ) {
      setErrors(prev => ({ ...prev, email: 'An account with this email already exists' }))
    } else {
      setGeneralError('Something went wrong. Please try again.')
    }
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
          <h1 className="text-2xl font-semibold text-navy-900 mb-6">Create your account</h1>

          {/* Generic error banner */}
          {generalError && (
            <div
              role="alert"
              className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
            >
              {generalError}
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
              <label htmlFor="password" className="block text-sm font-medium text-navy-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-navy-400">
                  <Lock size={16} aria-hidden="true" />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={fields.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  aria-invalid={!!errors.password}
                  placeholder="Min. 8 characters"
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

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-navy-700 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-navy-400">
                  <Lock size={16} aria-hidden="true" />
                </span>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={fields.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
                  aria-invalid={!!errors.confirmPassword}
                  placeholder="Re-enter your password"
                  className={`input-field pl-9 pr-10 ${errors.confirmPassword ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : ''}`}
                />
                <button
                  type="button"
                  aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-navy-400 hover:text-navy-600 focus:outline-none"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p id="confirm-error" role="alert" className="mt-1.5 text-xs text-red-600">
                  {errors.confirmPassword}
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
                  Creating account…
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="mt-6 text-center text-sm text-navy-500">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-teal-600 hover:text-teal-700 underline underline-offset-2"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
