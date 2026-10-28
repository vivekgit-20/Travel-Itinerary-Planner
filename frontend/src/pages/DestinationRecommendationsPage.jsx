/**
 * DestinationRecommendationsPage - discover destinations via AI.
 *
 * Route: /recommendations
 *
 * - Form: interests (multi-select), traveler_type, budget_range, trip_duration_days
 * - Submit calls POST /api/v1/recommendations
 * - Shows destination cards: name, country, reasoning, highlights, suggested_duration
 * - "Plan this trip" navigates to /trips/new with destination pre-filled in state
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Compass,
  Sparkles,
  MapPin,
  Clock,
  ArrowRight,
  Check,
  Loader2,
} from 'lucide-react'

import ErrorBanner from '../components/shared/ErrorBanner'
import apiClient from '../api/client'

// ─── Option lists ──────────────────────────────────────────────────────────────

const INTERESTS_OPTIONS = [
  'History & culture',
  'Beaches',
  'Mountains & hiking',
  'Food & cuisine',
  'Art & museums',
  'Wildlife & nature',
  'Architecture',
  'Nightlife',
  'Shopping',
  'Adventure sports',
  'Wellness & spas',
  'Photography',
]

const TRAVELER_TYPES = [
  { value: 'solo',      label: 'Solo traveler' },
  { value: 'couple',    label: 'Couple' },
  { value: 'family',    label: 'Family with kids' },
  { value: 'friends',   label: 'Group of friends' },
  { value: 'business',  label: 'Business traveler' },
]

const BUDGET_RANGES = [
  { value: 'budget',    label: 'Budget (< $50/day)' },
  { value: 'moderate',  label: 'Moderate ($50-$150/day)' },
  { value: 'comfort',   label: 'Comfort ($150-$300/day)' },
  { value: 'luxury',    label: 'Luxury (> $300/day)' },
]

// ─── Multi-select chips ────────────────────────────────────────────────────────

function MultiSelectChips({ label, options, selected, onChange }) {
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
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt)
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              aria-pressed={active}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border
                transition-all duration-100 focus:outline-none focus:ring-2 focus:ring-teal-400/50
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

// ─── Destination card ──────────────────────────────────────────────────────────

const CARD_GRADIENTS = [
  'from-teal-400 to-teal-600',
  'from-sky-400 to-blue-600',
  'from-violet-400 to-purple-600',
  'from-rose-400 to-pink-600',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-green-600',
]

function DestinationCard({ destination, index, onPlanTrip }) {
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length]
  const {
    name,
    country,
    reasoning,
    highlights = [],
    suggested_duration,
  } = destination

  return (
    <article className="card overflow-hidden flex flex-col">
      {/* Gradient header */}
      <div
        className={`h-28 bg-gradient-to-br ${gradient} flex items-end p-4`}
        aria-hidden="true"
      >
        <div className="flex items-center gap-1.5 text-white font-semibold text-lg">
          <MapPin className="w-5 h-5 shrink-0" />
          {name}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Country + duration */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          {country && (
            <span className="text-sm text-navy-500 font-medium">{country}</span>
          )}
          {suggested_duration && (
            <span className="badge bg-navy-100 text-navy-600 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {suggested_duration}
            </span>
          )}
        </div>

        {/* Reasoning */}
        {reasoning && (
          <p className="text-sm text-navy-600 leading-relaxed">{reasoning}</p>
        )}

        {/* Highlights */}
        {highlights.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {highlights.map((h) => (
              <li
                key={h}
                className="badge bg-teal-50 text-teal-700 border border-teal-100"
              >
                {h}
              </li>
            ))}
          </ul>
        )}

        {/* CTA */}
        <div className="mt-auto pt-2">
          <button
            type="button"
            onClick={() => onPlanTrip(destination)}
            className="btn-primary w-full inline-flex items-center justify-center gap-2 text-sm"
            aria-label={`Plan a trip to ${name}`}
          >
            Plan this trip
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DestinationRecommendationsPage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    interests: [],
    traveler_type: '',
    budget_range: '',
    trip_duration_days: '',
  })
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const payload = {
        ...form,
        trip_duration_days: form.trip_duration_days
          ? Number(form.trip_duration_days)
          : undefined,
      }
      const { data } = await apiClient.post('/recommendations', payload)
      const list = Array.isArray(data)
        ? data
        : (data?.recommendations ?? data?.destinations ?? [])
      setResults(list)
      setSubmitted(true)
    } catch (err) {
      console.error('[DestinationRecommendationsPage] Failed to fetch recommendations:', err)
      setError('Could not fetch recommendations. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePlanTrip = (destination) => {
    navigate('/trips/new', {
      state: {
        prefillDestination: destination.name,
        prefillCountry: destination.country,
      },
    })
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Page header ── */}
      <header className="bg-white border-b border-navy-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
              <Compass className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-navy-800 leading-tight">
                Destination Recommendations
              </h1>
              <p className="text-sm text-navy-500 mt-0.5">
                Tell us what you're into and we'll suggest the perfect destinations.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6">
            <ErrorBanner message={error} onDismiss={() => setError(null)} />
          </div>
        )}

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="card p-6 flex flex-col gap-6 mb-8">
          <MultiSelectChips
            label="Interests (select any that apply)"
            options={INTERESTS_OPTIONS}
            selected={form.interests}
            onChange={(values) => setForm((prev) => ({ ...prev, interests: values }))}
          />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {/* Traveler type */}
            <div>
              <label htmlFor="traveler_type" className="block text-sm font-medium text-navy-700 mb-1.5">
                Traveler type
              </label>
              <select
                id="traveler_type"
                name="traveler_type"
                value={form.traveler_type}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">- Select -</option>
                {TRAVELER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Budget range */}
            <div>
              <label htmlFor="budget_range" className="block text-sm font-medium text-navy-700 mb-1.5">
                Budget range
              </label>
              <select
                id="budget_range"
                name="budget_range"
                value={form.budget_range}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">- Select -</option>
                {BUDGET_RANGES.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>

            {/* Trip duration */}
            <div>
              <label htmlFor="trip_duration_days" className="block text-sm font-medium text-navy-700 mb-1.5">
                Trip duration (days)
              </label>
              <input
                id="trip_duration_days"
                name="trip_duration_days"
                type="number"
                min="1"
                max="60"
                value={form.trip_duration_days}
                onChange={handleChange}
                placeholder="E.g. 7"
                className="input-field"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary inline-flex items-center gap-2 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Finding destinations…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Get Recommendations
                </>
              )}
            </button>
          </div>
        </form>

        {/* ── Results ── */}
        {submitted && !loading && results.length === 0 && (
          <div className="text-center py-12">
            <p className="text-navy-500">
              No recommendations found. Try adjusting your preferences.
            </p>
          </div>
        )}

        {results.length > 0 && (
          <section aria-label="Recommended destinations">
            <h2 className="text-lg font-semibold text-navy-800 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-500" aria-hidden="true" />
              Recommended for you
            </h2>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((dest, i) => (
                <DestinationCard
                  key={`${dest.name}-${i}`}
                  destination={dest}
                  index={i}
                  onPlanTrip={handlePlanTrip}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
