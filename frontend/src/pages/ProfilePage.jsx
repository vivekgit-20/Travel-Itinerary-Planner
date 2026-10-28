/**
 * ProfilePage - view and edit travel preferences.
 *
 * Route: /profile
 *
 * - Fetches profile from GET /api/v1/profile on mount
 * - Form fields: display_name, default_travel_type, default_travel_pace,
 *   default_currency, dietary_preferences (multi-select), accessibility_needs (multi-select)
 * - Submit calls PUT /api/v1/profile
 * - Shows success toast on save
 */

import { useState, useEffect, useCallback } from 'react'
import { User, Check } from 'lucide-react'

import LoadingSpinner from '../components/shared/LoadingSpinner'
import ErrorBanner from '../components/shared/ErrorBanner'
import apiClient from '../api/client'

// ─── Option lists ──────────────────────────────────────────────────────────────

const TRAVEL_TYPES = [
  { value: 'adventure',   label: 'Adventure' },
  { value: 'cultural',    label: 'Cultural' },
  { value: 'relaxation',  label: 'Relaxation' },
  { value: 'business',    label: 'Business' },
  { value: 'family',      label: 'Family' },
  { value: 'romantic',    label: 'Romantic' },
  { value: 'budget',      label: 'Budget' },
  { value: 'luxury',      label: 'Luxury' },
]

const TRAVEL_PACES = [
  { value: 'slow',     label: 'Slow - few activities per day' },
  { value: 'moderate', label: 'Moderate - balanced schedule' },
  { value: 'fast',     label: 'Fast - packed itinerary' },
]

const CURRENCIES = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
]

const DIETARY_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-free',
  'Halal',
  'Kosher',
  'Nut-free',
  'Dairy-free',
  'Seafood-free',
]

const ACCESSIBILITY_OPTIONS = [
  'Wheelchair accessible',
  'Limited mobility',
  'Visual impairment',
  'Hearing impairment',
  'Dietary restrictions',
  'Child-friendly',
  'Senior-friendly',
]

// ─── Multi-select chip component ───────────────────────────────────────────────

function MultiSelectChips({ label, id, options, selected, onChange }) {
  const toggle = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <fieldset>
      <legend className="block text-sm font-medium text-navy-700 mb-2">{label}</legend>
      <div className="flex flex-wrap gap-2" id={id}>
        {options.map((opt) => {
          const active = selected.includes(opt)
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              aria-pressed={active}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm
                border transition-all duration-100 focus:outline-none focus:ring-2 focus:ring-teal-400/50
                ${
                  active
                    ? 'bg-teal-600 border-teal-600 text-white'
                    : 'bg-white border-surface-border text-navy-600 hover:border-teal-400'
                }
              `}
            >
              {active && <Check className="w-3 h-3" aria-hidden="true" />}
              {opt}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

// ─── Toast component ───────────────────────────────────────────────────────────

function SuccessToast({ visible }) {
  if (!visible) return null
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-teal-600 text-white
                 px-4 py-3 rounded-xl shadow-lg animate-slide-up"
    >
      <Check className="w-4 h-4" aria-hidden="true" />
      <span className="text-sm font-medium">Profile saved successfully!</span>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

const DEFAULT_FORM = {
  display_name: '',
  default_travel_type: '',
  default_travel_pace: 'moderate',
  default_currency: 'USD',
  dietary_preferences: [],
  accessibility_needs: [],
}

export default function ProfilePage() {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [toastVisible, setToastVisible] = useState(false)

  // ─── Fetch profile ─────────────────────────────────────────────────────────

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await apiClient.get('/profile')
      const prefs = data.preferences ?? {}
      setForm({
        display_name:         data.display_name ?? '',
        default_travel_type:  prefs.default_travel_type ?? '',
        default_travel_pace:  prefs.default_travel_pace ?? 'moderate',
        default_currency:     prefs.default_currency ?? 'USD',
        dietary_preferences:  prefs.dietary_preferences ?? [],
        accessibility_needs:  prefs.accessibility_needs ?? [],
      })
    } catch (err) {
      // 404 is acceptable (first-time user with no profile yet)
      if (err.response?.status !== 404) {
        console.error('[ProfilePage] Failed to fetch profile:', err)
        setError('Could not load your profile. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // ─── Form helpers ──────────────────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleMultiChange = (field) => (values) => {
    setForm((prev) => ({ ...prev, [field]: values }))
  }

  // ─── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      // Convert empty strings to null so Pydantic accepts optional enum fields
      const payload = {
        ...form,
        default_travel_type: form.default_travel_type || null,
        default_travel_pace: form.default_travel_pace || null,
        default_currency:    form.default_currency || 'USD',
        display_name:        form.display_name || null,
      }
      await apiClient.put('/profile', payload)
      setToastVisible(true)
      setTimeout(() => setToastVisible(false), 3000)
    } catch (err) {
      console.error('[ProfilePage] Failed to save profile:', err)
      setError('Could not save your profile. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-navy-500">Loading profile…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Page header ── */}
      <header className="bg-white border-b border-navy-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
              <User className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-navy-800 leading-tight">Profile</h1>
              <p className="text-sm text-navy-500 mt-0.5">
                Set your travel preferences to get personalised itineraries.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6">
            <ErrorBanner
              message={error}
              onDismiss={() => setError(null)}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">

          {/* ── Section: Personal ── */}
          <section className="card p-6 flex flex-col gap-5">
            <h2 className="text-base font-semibold text-navy-800">Personal</h2>

            <div>
              <label htmlFor="display_name" className="block text-sm font-medium text-navy-700 mb-1.5">
                Display name
              </label>
              <input
                id="display_name"
                name="display_name"
                type="text"
                value={form.display_name}
                onChange={handleChange}
                placeholder="E.g. Alex"
                className="input-field"
                autoComplete="name"
              />
            </div>
          </section>

          {/* ── Section: Defaults ── */}
          <section className="card p-6 flex flex-col gap-5">
            <h2 className="text-base font-semibold text-navy-800">Travel defaults</h2>

            {/* Travel type */}
            <div>
              <label htmlFor="default_travel_type" className="block text-sm font-medium text-navy-700 mb-1.5">
                Default travel type
              </label>
              <select
                id="default_travel_type"
                name="default_travel_type"
                value={form.default_travel_type}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">- Select type -</option>
                {TRAVEL_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Travel pace */}
            <div>
              <label htmlFor="default_travel_pace" className="block text-sm font-medium text-navy-700 mb-1.5">
                Default travel pace
              </label>
              <select
                id="default_travel_pace"
                name="default_travel_pace"
                value={form.default_travel_pace}
                onChange={handleChange}
                className="input-field"
              >
                {TRAVEL_PACES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Currency */}
            <div>
              <label htmlFor="default_currency" className="block text-sm font-medium text-navy-700 mb-1.5">
                Preferred currency
              </label>
              <select
                id="default_currency"
                name="default_currency"
                value={form.default_currency}
                onChange={handleChange}
                className="input-field"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </section>

          {/* ── Section: Dietary & Accessibility ── */}
          <section className="card p-6 flex flex-col gap-6">
            <h2 className="text-base font-semibold text-navy-800">Dietary & accessibility</h2>

            <MultiSelectChips
              label="Dietary preferences"
              id="dietary-preferences"
              options={DIETARY_OPTIONS}
              selected={form.dietary_preferences}
              onChange={handleMultiChange('dietary_preferences')}
            />

            <MultiSelectChips
              label="Accessibility needs"
              id="accessibility-needs"
              options={ACCESSIBILITY_OPTIONS}
              selected={form.accessibility_needs}
              onChange={handleMultiChange('accessibility_needs')}
            />
          </section>

          {/* ── Submit ── */}
          <div className="flex justify-end pb-4">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>
      </main>

      <SuccessToast visible={toastVisible} />
    </div>
  )
}
