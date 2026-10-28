/**
 * SmartTripForm - 4-step wizard for creating a new trip.
 *
 * Steps:
 *   1. Destination & Dates
 *   2. Budget & Travelers
 *   3. Interests & Preferences
 *   4. Review & Submit
 *
 * Props:
 *   onSubmit       (formData) => Promise<void>   Called with validated form data
 *   defaultValues  object                         Optional pre-fill from profile
 *   isLoading      boolean                        Disables submit / shows spinner
 */

import { useState, useMemo } from 'react'
import {
  MapPin, Calendar, DollarSign, Users, Heart,
  CheckCircle2, Circle, ChevronRight, ChevronLeft,
  Loader2, ClipboardList,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Destination',  Icon: MapPin },
  { id: 2, label: 'Budget',       Icon: DollarSign },
  { id: 3, label: 'Interests',    Icon: Heart },
  { id: 4, label: 'Review',       Icon: ClipboardList },
]

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY']

const TRAVELER_TYPES = [
  { value: 'solo',   label: 'Solo' },
  { value: 'couple', label: 'Couple' },
  { value: 'family', label: 'Family' },
  { value: 'friends', label: 'Friends' },
]

const TRAVEL_PACES = [
  { value: 'relaxed',     label: 'Relaxed' },
  { value: 'moderate',    label: 'Moderate' },
  { value: 'fast-paced',  label: 'Fast-paced' },
]

const INTERESTS_LIST = [
  'Food', 'Adventure', 'History', 'Culture', 'Nature', 'Beaches',
  'Mountains', 'Shopping', 'Nightlife', 'Architecture', 'Photography',
  'Local Experiences',
]

const ACCOMMODATION_OPTIONS = ['Hotel', 'Hostel', 'Airbnb', 'Resort', 'Budget']

const DIETARY_OPTIONS = [
  'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-Free', 'No restrictions',
]

const ACCESSIBILITY_OPTIONS = ['Wheelchair', 'Elevator', 'No stairs']

// ─── Default form state ───────────────────────────────────────────────────────

const DEFAULT_FORM = {
  destination:          '',
  start_date:           '',
  end_date:             '',
  budget_amount:        '',
  budget_currency:      'USD',
  travelers_count:      1,
  traveler_type:        '',
  travel_pace:          '',
  interests:            [],
  accommodation_pref:   'Hotel',
  dietary_preferences:  [],
  accessibility_needs:  [],
  special_requests:     '',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcDuration(start, end) {
  if (!start || !end) return null
  const diff = new Date(end) - new Date(start)
  if (diff < 0) return null
  return Math.round(diff / (1000 * 60 * 60 * 24))
}

function toggleArrayItem(arr, item) {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]
}

// ─── StepIndicator ────────────────────────────────────────────────────────────

function StepIndicator({ currentStep }) {
  return (
    <nav aria-label="Form progress" className="mb-8">
      <ol className="flex items-center justify-between">
        {STEPS.map((step, idx) => {
          const completed = step.id < currentStep
          const active    = step.id === currentStep

          return (
            <li key={step.id} className="flex-1 flex items-center">
              {/* Step bubble */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div
                  className={[
                    'w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors duration-200',
                    completed ? 'bg-teal-600 border-teal-600 text-white'
                               : active ? 'border-teal-600 text-teal-600 bg-white'
                               : 'border-surface-border text-navy-400 bg-white',
                  ].join(' ')}
                  aria-current={active ? 'step' : undefined}
                >
                  {completed
                    ? <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                    : <span className="text-xs font-semibold">{step.id}</span>
                  }
                </div>
                <span
                  className={[
                    'text-xs font-medium hidden sm:block',
                    active ? 'text-teal-700' : completed ? 'text-teal-600' : 'text-navy-400',
                  ].join(' ')}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line (not after last step) */}
              {idx < STEPS.length - 1 && (
                <div
                  className={[
                    'flex-1 h-0.5 mx-2 transition-colors duration-200',
                    completed ? 'bg-teal-500' : 'bg-surface-border',
                  ].join(' ')}
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// ─── ToggleButton ─────────────────────────────────────────────────────────────

function ToggleButton({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={[
        'px-4 py-2 rounded-xl text-sm font-medium border transition-colors duration-150',
        selected
          ? 'bg-teal-600 border-teal-600 text-white'
          : 'bg-white border-surface-border text-navy-700 hover:border-teal-400 hover:text-teal-700',
      ].join(' ')}
    >
      {label}
    </button>
  )
}

// ─── FieldError ───────────────────────────────────────────────────────────────

function FieldError({ id, message }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="mt-1 text-xs text-red-600">
      {message}
    </p>
  )
}

// ─── Step 1: Destination & Dates ─────────────────────────────────────────────

function StepDestination({ form, onChange, errors }) {
  const duration = calcDuration(form.start_date, form.end_date)

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="destination" className="block text-sm font-medium text-navy-700 mb-1.5">
          Destination <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-navy-400">
            <MapPin size={16} aria-hidden="true" />
          </span>
          <input
            id="destination"
            type="text"
            placeholder="e.g. Paris, France"
            value={form.destination}
            onChange={(e) => onChange('destination', e.target.value)}
            aria-describedby={errors.destination ? 'dest-error' : undefined}
            aria-invalid={!!errors.destination}
            className={`input-field pl-9 ${errors.destination ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : ''}`}
          />
        </div>
        <FieldError id="dest-error" message={errors.destination} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-navy-700 mb-1.5">
            Start Date <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-navy-400">
              <Calendar size={16} aria-hidden="true" />
            </span>
            <input
              id="start_date"
              type="date"
              value={form.start_date}
              onChange={(e) => onChange('start_date', e.target.value)}
              aria-describedby={errors.start_date ? 'start-date-error' : undefined}
              aria-invalid={!!errors.start_date}
              className={`input-field pl-9 ${errors.start_date ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : ''}`}
            />
          </div>
          <FieldError id="start-date-error" message={errors.start_date} />
        </div>

        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-navy-700 mb-1.5">
            End Date <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-navy-400">
              <Calendar size={16} aria-hidden="true" />
            </span>
            <input
              id="end_date"
              type="date"
              value={form.end_date}
              min={form.start_date || undefined}
              onChange={(e) => onChange('end_date', e.target.value)}
              aria-describedby={errors.end_date ? 'end-date-error' : undefined}
              aria-invalid={!!errors.end_date}
              className={`input-field pl-9 ${errors.end_date ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : ''}`}
            />
          </div>
          <FieldError id="end-date-error" message={errors.end_date} />
        </div>
      </div>

      {/* Duration badge */}
      {duration !== null && (
        <p className="text-sm text-teal-700 font-medium flex items-center gap-1.5">
          <Calendar size={14} aria-hidden="true" />
          {duration} {duration === 1 ? 'day' : 'days'}
        </p>
      )}
    </div>
  )
}

// ─── Step 2: Budget & Travelers ───────────────────────────────────────────────

function StepBudget({ form, onChange, errors }) {
  return (
    <div className="space-y-6">
      {/* Budget amount + currency */}
      <div>
        <label className="block text-sm font-medium text-navy-700 mb-1.5">
          Total Budget <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-navy-400">
              <DollarSign size={16} aria-hidden="true" />
            </span>
            <input
              id="budget_amount"
              type="number"
              min="1"
              step="any"
              placeholder="1000"
              value={form.budget_amount}
              onChange={(e) => onChange('budget_amount', e.target.value)}
              aria-describedby={errors.budget_amount ? 'budget-error' : undefined}
              aria-invalid={!!errors.budget_amount}
              className={`input-field pl-9 ${errors.budget_amount ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : ''}`}
            />
          </div>
          <select
            id="budget_currency"
            value={form.budget_currency}
            onChange={(e) => onChange('budget_currency', e.target.value)}
            className="input-field w-24"
            aria-label="Currency"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <FieldError id="budget-error" message={errors.budget_amount} />
      </div>

      {/* Travelers count */}
      <div>
        <label htmlFor="travelers_count" className="block text-sm font-medium text-navy-700 mb-1.5">
          Number of Travelers
        </label>
        <div className="relative w-32">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-navy-400">
            <Users size={16} aria-hidden="true" />
          </span>
          <input
            id="travelers_count"
            type="number"
            min="1"
            max="50"
            value={form.travelers_count}
            onChange={(e) => onChange('travelers_count', Number(e.target.value))}
            aria-describedby={errors.travelers_count ? 'travelers-error' : undefined}
            aria-invalid={!!errors.travelers_count}
            className={`input-field pl-9 ${errors.travelers_count ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : ''}`}
          />
        </div>
        <FieldError id="travelers-error" message={errors.travelers_count} />
      </div>

      {/* Traveler type */}
      <div>
        <fieldset>
          <legend className="block text-sm font-medium text-navy-700 mb-2">
            Traveler Type <span className="text-red-500">*</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {TRAVELER_TYPES.map(({ value, label }) => (
              <ToggleButton
                key={value}
                label={label}
                selected={form.traveler_type === value}
                onClick={() => onChange('traveler_type', value)}
              />
            ))}
          </div>
          <FieldError id="traveler-type-error" message={errors.traveler_type} />
        </fieldset>
      </div>

      {/* Travel pace */}
      <div>
        <fieldset>
          <legend className="block text-sm font-medium text-navy-700 mb-2">
            Travel Pace <span className="text-red-500">*</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {TRAVEL_PACES.map(({ value, label }) => (
              <ToggleButton
                key={value}
                label={label}
                selected={form.travel_pace === value}
                onClick={() => onChange('travel_pace', value)}
              />
            ))}
          </div>
          <FieldError id="travel-pace-error" message={errors.travel_pace} />
        </fieldset>
      </div>
    </div>
  )
}

// ─── Step 3: Interests & Preferences ─────────────────────────────────────────

function StepInterests({ form, onChange, errors }) {
  return (
    <div className="space-y-6">
      {/* Interests grid */}
      <div>
        <fieldset>
          <legend className="block text-sm font-medium text-navy-700 mb-2">
            Interests <span className="text-red-500">*</span>
            <span className="ml-2 text-xs font-normal text-navy-400">(select at least one)</span>
          </legend>
          <div
            className="grid grid-cols-2 gap-2 sm:grid-cols-3"
            aria-describedby={errors.interests ? 'interests-error' : undefined}
          >
            {INTERESTS_LIST.map((interest) => {
              const checked = form.interests.includes(interest)
              return (
                <label
                  key={interest}
                  className={[
                    'flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer',
                    'text-sm transition-colors duration-150',
                    checked
                      ? 'bg-teal-50 border-teal-500 text-teal-800'
                      : 'bg-white border-surface-border text-navy-700 hover:border-teal-300',
                  ].join(' ')}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onChange('interests', toggleArrayItem(form.interests, interest))}
                    className="sr-only"
                  />
                  <span
                    className={checked ? 'text-teal-600' : 'text-navy-400'}
                    aria-hidden="true"
                  >
                    {checked ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                  </span>
                  {interest}
                </label>
              )
            })}
          </div>
          <FieldError id="interests-error" message={errors.interests} />
        </fieldset>
      </div>

      {/* Accommodation preference */}
      <div>
        <label htmlFor="accommodation_pref" className="block text-sm font-medium text-navy-700 mb-1.5">
          Accommodation Preference
        </label>
        <select
          id="accommodation_pref"
          value={form.accommodation_pref}
          onChange={(e) => onChange('accommodation_pref', e.target.value)}
          className="input-field"
        >
          {ACCOMMODATION_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/* Dietary preferences */}
      <div>
        <fieldset>
          <legend className="block text-sm font-medium text-navy-700 mb-2">
            Dietary Preferences
            <span className="ml-2 text-xs font-normal text-navy-400">(optional)</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map((opt) => (
              <ToggleButton
                key={opt}
                label={opt}
                selected={form.dietary_preferences.includes(opt)}
                onClick={() => onChange('dietary_preferences', toggleArrayItem(form.dietary_preferences, opt))}
              />
            ))}
          </div>
        </fieldset>
      </div>

      {/* Accessibility needs */}
      <div>
        <fieldset>
          <legend className="block text-sm font-medium text-navy-700 mb-2">
            Accessibility Needs
            <span className="ml-2 text-xs font-normal text-navy-400">(optional)</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {ACCESSIBILITY_OPTIONS.map((opt) => (
              <ToggleButton
                key={opt}
                label={opt}
                selected={form.accessibility_needs.includes(opt)}
                onClick={() => onChange('accessibility_needs', toggleArrayItem(form.accessibility_needs, opt))}
              />
            ))}
          </div>
        </fieldset>
      </div>
    </div>
  )
}

// ─── Step 4: Review ───────────────────────────────────────────────────────────

function ReviewRow({ label, value }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4 py-3 border-b border-surface-border last:border-0">
      <dt className="text-sm font-medium text-navy-500 sm:w-40 flex-shrink-0">{label}</dt>
      <dd className="text-sm text-navy-800 mt-0.5 sm:mt-0">{value}</dd>
    </div>
  )
}

function StepReview({ form, onChange, errors, isLoading }) {
  const duration = calcDuration(form.start_date, form.end_date)

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <div className="card p-5">
        <h3 className="text-base font-semibold text-navy-800 mb-3">Trip Summary</h3>
        <dl>
          <ReviewRow label="Destination"   value={form.destination} />
          <ReviewRow label="Dates"         value={form.start_date && form.end_date ? `${form.start_date} → ${form.end_date} (${duration} ${duration === 1 ? 'day' : 'days'})` : ''} />
          <ReviewRow label="Budget"        value={form.budget_amount ? `${form.budget_currency} ${Number(form.budget_amount).toLocaleString()}` : ''} />
          <ReviewRow label="Travelers"     value={`${form.travelers_count} (${form.traveler_type})`} />
          <ReviewRow label="Pace"          value={form.travel_pace} />
          <ReviewRow label="Interests"     value={form.interests.join(', ')} />
          <ReviewRow label="Accommodation" value={form.accommodation_pref} />
          {form.dietary_preferences.length > 0 && (
            <ReviewRow label="Dietary"     value={form.dietary_preferences.join(', ')} />
          )}
          {form.accessibility_needs.length > 0 && (
            <ReviewRow label="Accessibility" value={form.accessibility_needs.join(', ')} />
          )}
        </dl>
      </div>

      {/* Special requests */}
      <div>
        <label htmlFor="special_requests" className="block text-sm font-medium text-navy-700 mb-1.5">
          Special Requests
          <span className="ml-2 text-xs font-normal text-navy-400">(optional, max 1000 chars)</span>
        </label>
        <textarea
          id="special_requests"
          rows={4}
          maxLength={1000}
          placeholder="Anything else you'd like us to know? e.g. travelling with a baby, celebrating an anniversary…"
          value={form.special_requests}
          onChange={(e) => onChange('special_requests', e.target.value)}
          aria-describedby={errors.special_requests ? 'special-req-error' : undefined}
          aria-invalid={!!errors.special_requests}
          className={`input-field resize-none ${errors.special_requests ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : ''}`}
        />
        <div className="flex justify-between mt-1">
          <FieldError id="special-req-error" message={errors.special_requests} />
          <span className="text-xs text-navy-400 ml-auto">
            {form.special_requests.length}/1000
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateStep(step, form) {
  const errors = {}

  if (step === 1) {
    if (!form.destination.trim() || form.destination.trim().length < 2) {
      errors.destination = 'Please enter a destination (at least 2 characters)'
    }
    if (!form.start_date) {
      errors.start_date = 'Start date is required'
    }
    if (!form.end_date) {
      errors.end_date = 'End date is required'
    } else if (form.start_date && new Date(form.end_date) < new Date(form.start_date)) {
      errors.end_date = 'End date must be on or after start date'
    }
  }

  if (step === 2) {
    const budget = Number(form.budget_amount)
    if (!form.budget_amount || isNaN(budget) || budget <= 0) {
      errors.budget_amount = 'Budget must be greater than 0'
    }
    const count = Number(form.travelers_count)
    if (!count || count < 1 || count > 50) {
      errors.travelers_count = 'Number of travelers must be between 1 and 50'
    }
    if (!form.traveler_type) {
      errors.traveler_type = 'Please select a traveler type'
    }
    if (!form.travel_pace) {
      errors.travel_pace = 'Please select a travel pace'
    }
  }

  if (step === 3) {
    if (form.interests.length === 0) {
      errors.interests = 'Please select at least one interest'
    }
  }

  // Step 4 is always valid (textarea is optional and capped by maxLength)

  return errors
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SmartTripForm({ onSubmit, defaultValues = {}, isLoading = false }) {
  const [step, setStep]   = useState(1)
  const [form, setForm]   = useState({ ...DEFAULT_FORM, ...defaultValues })
  const [errors, setErrors] = useState({})

  // Update a single field
  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    // Clear error on change
    if (errors[field]) {
      setErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
    }
  }

  // Advance to next step with validation
  function handleNext() {
    const stepErrors = validateStep(step, form)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }
    setErrors({})
    setStep((s) => s + 1)
  }

  function handleBack() {
    setErrors({})
    setStep((s) => s - 1)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    // Step 4 always valid, but run validation anyway for safety
    const stepErrors = validateStep(4, form)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }

    // Build the payload matching TripCreate schema
    const payload = {
      destination:          form.destination.trim(),
      start_date:           form.start_date,
      end_date:             form.end_date,
      budget_amount:        Number(form.budget_amount),
      budget_currency:      form.budget_currency,
      travelers_count:      Number(form.travelers_count),
      traveler_type:        form.traveler_type,
      travel_pace:          form.travel_pace,
      interests:            form.interests,
      accommodation_pref:   form.accommodation_pref,
      dietary_preferences:  form.dietary_preferences,
      accessibility_needs:  form.accessibility_needs,
      special_requests:     form.special_requests.trim() || null,
    }

    await onSubmit(payload)
  }

  const stepTitles = [
    'Where are you going?',
    'Budget & Travelers',
    'Your Interests',
    'Review Your Trip',
  ]

  return (
    <div className="w-full max-w-2xl mx-auto">
      <StepIndicator currentStep={step} />

      <div className="card p-6 sm:p-8">
        {/* Step title */}
        <h2 className="text-xl font-semibold text-navy-900 mb-6">
          {stepTitles[step - 1]}
        </h2>

        <form onSubmit={handleSubmit} noValidate>
          {/* Step panels */}
          {step === 1 && (
            <StepDestination form={form} onChange={handleChange} errors={errors} />
          )}
          {step === 2 && (
            <StepBudget form={form} onChange={handleChange} errors={errors} />
          )}
          {step === 3 && (
            <StepInterests form={form} onChange={handleChange} errors={errors} />
          )}
          {step === 4 && (
            <StepReview form={form} onChange={handleChange} errors={errors} isLoading={isLoading} />
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-surface-border">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={isLoading}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <ChevronLeft size={16} aria-hidden="true" />
                Back
              </button>
            ) : (
              <div aria-hidden="true" />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn-primary inline-flex items-center gap-2"
              >
                Next
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary inline-flex items-center gap-2 px-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                    Generating…
                  </>
                ) : (
                  <>
                    Generate My Itinerary
                    <ChevronRight size={16} aria-hidden="true" />
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
