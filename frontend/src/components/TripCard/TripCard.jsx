/**
 * TripCard - displays a trip summary with action buttons.
 *
 * Props:
 *   trip      TripSummary object (id, title, destination, start_date, end_date,
 *             duration_days, travelers_count, status, created_at)
 *   onOpen    (tripId) => void
 *   onDelete  (tripId) => void
 */

import { useState } from 'react'
import { MapPin, Calendar, Clock, Users, Trash2 } from 'lucide-react'
import ConfirmDialog from '../shared/ConfirmDialog'

// Gradient backgrounds for destination photo placeholders - cycles by trip id
const DESTINATION_GRADIENTS = [
  'from-teal-400 to-teal-600',
  'from-sky-400 to-blue-600',
  'from-violet-400 to-purple-600',
  'from-rose-400 to-pink-600',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-green-600',
]

function getGradient(id) {
  // Use last character of id as a simple hash
  const code = id ? id.charCodeAt(id.length - 1) : 0
  return DESTINATION_GRADIENTS[code % DESTINATION_GRADIENTS.length]
}

function StatusBadge({ status }) {
  const map = {
    active:    'badge-active',
    draft:     'badge-draft',
    completed: 'badge-completed',
  }
  const cls = map[status] ?? 'badge bg-navy-100 text-navy-600'
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Draft'
  return <span className={cls}>{label}</span>
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function TripCard({ trip = {}, onOpen, onDelete }) {
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    id,
    title = 'Untitled Trip',
    destination = 'Unknown Destination',
    start_date,
    end_date,
    duration_days,
    travelers_count,
    status = 'draft',
  } = trip

  const gradient = getGradient(id ?? title)

  function handleDeleteClick(e) {
    e.stopPropagation()
    setShowConfirm(true)
  }

  function handleConfirmDelete() {
    setShowConfirm(false)
    onDelete?.(id)
  }

  function handleCancelDelete() {
    setShowConfirm(false)
  }

  return (
    <>
      <article
        className="card-hover flex flex-col overflow-hidden group"
        onClick={() => onOpen?.(id)}
        aria-label={`Trip: ${title}`}
      >
        {/* Destination photo placeholder */}
        <div
          className={`relative h-36 bg-gradient-to-br ${gradient} flex items-end p-3`}
          aria-hidden="true"
        >
          {/* Status badge pinned top-right */}
          <div className="absolute top-3 right-3">
            <StatusBadge status={status} />
          </div>

          {/* Destination label over the gradient */}
          <div className="flex items-center gap-1 text-white/90 text-sm font-medium truncate">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{destination}</span>
          </div>
        </div>

        {/* Card body */}
        <div className="flex flex-col gap-3 p-4 flex-1">
          {/* Title */}
          <h3 className="text-base font-semibold text-navy-800 leading-snug line-clamp-2">
            {title}
          </h3>

          {/* Metadata row */}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-navy-500">
            {/* Date range */}
            {(start_date || end_date) && (
              <div className="col-span-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 shrink-0 text-navy-400" />
                <dd>{formatDate(start_date)} - {formatDate(end_date)}</dd>
              </div>
            )}

            {/* Duration */}
            {duration_days != null && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 shrink-0 text-navy-400" />
                <dd>{duration_days} {duration_days === 1 ? 'day' : 'days'}</dd>
              </div>
            )}

            {/* Travelers */}
            {travelers_count != null && (
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 shrink-0 text-navy-400" />
                <dd>{travelers_count} {travelers_count === 1 ? 'traveler' : 'travelers'}</dd>
              </div>
            )}
          </dl>

          {/* Actions */}
          <div className="flex items-center justify-between mt-auto pt-2">
            <button
              className="btn-primary px-3 py-1.5 text-xs"
              onClick={(e) => {
                e.stopPropagation()
                onOpen?.(id)
              }}
              aria-label={`View itinerary for ${title}`}
            >
              View Itinerary
            </button>

            <button
              className="p-1.5 rounded-lg text-navy-400 hover:text-error hover:bg-error/10
                         transition-colors focus:outline-none focus:ring-2 focus:ring-error/40"
              onClick={handleDeleteClick}
              aria-label={`Delete trip: ${title}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </article>

      <ConfirmDialog
        isOpen={showConfirm}
        title="Delete trip?"
        message={`"${title}" will be permanently deleted. This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Keep trip"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </>
  )
}
