/**
 * DayPanel - accordion panel for one itinerary day.
 *
 * Props:
 *   day           ItineraryDay object (day_number, date, theme, activities, daily_budget)
 *   onRegenerate  (dayNumber, feedback) => void  (optional)
 *   editable      boolean
 *   isLoading     boolean  (show spinner while regenerating)
 */

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronUp, Sparkles, Loader2 } from 'lucide-react'
import ActivityCard from '../ActivityCard/ActivityCard'

function formatDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function LoadingSpinner({ size = 'sm' }) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
  return (
    <Loader2
      className={`${sizeClass} animate-spin text-teal-500`}
      aria-label="Loading"
    />
  )
}

export default function DayPanel({
  day = {},
  onRegenerate,
  editable = false,
  isLoading = false,
}) {
  const [open, setOpen] = useState(false)
  const [showRegenModal, setShowRegenModal] = useState(false)
  const [feedback, setFeedback] = useState('')
  const feedbackRef = useRef(null)

  const {
    day_number,
    date,
    theme,
    activities = [],
    daily_budget,
  } = day

  const formattedDate = formatDate(date)

  // Focus textarea when regenerate modal opens
  useEffect(() => {
    if (showRegenModal) {
      feedbackRef.current?.focus()
    }
  }, [showRegenModal])

  // Close modal on Escape
  useEffect(() => {
    if (!showRegenModal) return
    const handler = (e) => {
      if (e.key === 'Escape') setShowRegenModal(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [showRegenModal])

  function handleRegenerate() {
    setShowRegenModal(false)
    onRegenerate?.(day_number, feedback.trim())
    setFeedback('')
  }

  return (
    <div className="card overflow-hidden">
      {/* ── Accordion header ── */}
      <button
        type="button"
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5
                   hover:bg-surface-muted transition-colors focus:outline-none
                   focus:ring-2 focus:ring-inset focus:ring-teal-500"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`day-panel-content-${day_number}`}
      >
        {/* Left: day number + date + theme */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0 text-left">
          <span className="text-sm font-bold text-teal-600 shrink-0">
            Day {day_number ?? '?'}
          </span>

          {formattedDate && (
            <span className="text-sm text-navy-600 shrink-0">{formattedDate}</span>
          )}

          {theme && (
            <span className="text-sm text-navy-500 italic truncate">{theme}</span>
          )}
        </div>

        {/* Right: budget + chevron */}
        <div className="flex items-center gap-3 shrink-0">
          {daily_budget != null && (
            <span className="hidden sm:inline text-xs font-medium text-navy-500 bg-surface-muted
                             px-2 py-0.5 rounded-full border border-surface-border">
              ${Number(daily_budget).toLocaleString()}
            </span>
          )}
          {open ? (
            <ChevronUp className="w-4 h-4 text-navy-400" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-4 h-4 text-navy-400" aria-hidden="true" />
          )}
        </div>
      </button>

      {/* ── Expanded content ── */}
      {open && (
        <div
          id={`day-panel-content-${day_number}`}
          className="border-t border-surface-border"
        >
          {/* Mobile budget (hidden on sm+) */}
          {daily_budget != null && (
            <div className="sm:hidden px-4 py-2 bg-surface-muted text-xs text-navy-500">
              Daily budget: ${Number(daily_budget).toLocaleString()}
            </div>
          )}

          {/* Activity list */}
          <div className="flex flex-col gap-2 p-4">
            {activities.length === 0 ? (
              <p className="text-sm text-navy-400 text-center py-4">
                No activities planned for this day.
              </p>
            ) : (
              activities.map((activity) => (
                <ActivityCard
                  key={activity.id ?? activity.name}
                  activity={activity}
                  editable={editable}
                  draggable={editable}
                />
              ))
            )}
          </div>

          {/* ── Footer: Regenerate Day ── */}
          {onRegenerate && (
            <div className="px-4 pb-4 flex justify-end border-t border-surface-border pt-3">
              <button
                type="button"
                className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1.5
                           disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setShowRegenModal(true)}
                disabled={isLoading}
                aria-label={`Regenerate day ${day_number}`}
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {isLoading ? 'Regenerating…' : 'Regenerate Day'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Inline regenerate feedback modal ── */}
      {showRegenModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`regen-modal-title-${day_number}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRegenModal(false)
          }}
        >
          <div className="w-full max-w-sm bg-surface-card rounded-2xl shadow-card-elevated p-5 animate-slide-up">
            <h3
              id={`regen-modal-title-${day_number}`}
              className="text-sm font-semibold text-navy-800 mb-1"
            >
              Regenerate Day {day_number}
            </h3>
            <p className="text-xs text-navy-500 mb-3">
              Optionally tell us what to change, or leave blank to get fresh ideas.
            </p>

            <textarea
              ref={feedbackRef}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="E.g. more outdoor activities, skip museums…"
              rows={3}
              className="input-field resize-none text-sm mb-4"
              aria-label="Feedback for regeneration"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn-secondary px-3 py-1.5 text-xs"
                onClick={() => setShowRegenModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1.5"
                onClick={handleRegenerate}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
