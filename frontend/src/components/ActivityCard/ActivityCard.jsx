/**
 * ActivityCard - a single scheduled activity within a DayPanel.
 *
 * Props:
 *   activity    Activity object (id, name, description, location, start_time,
 *               end_time, estimated_cost, currency, category, neighborhood)
 *   onReplace   (activity) => void  (optional)
 *   onRemove    (activityId) => void  (optional)
 *   editable    boolean
 *   draggable   boolean
 */

import { useState } from 'react'
import {
  Clock,
  DollarSign,
  IndianRupee,
  MapPin,
  RefreshCw,
  X,
  GripVertical,
} from 'lucide-react'

// Category colour map - badge colours per activity type
const CATEGORY_STYLES = {
  food:         'bg-amber-100 text-amber-700',
  dining:       'bg-amber-100 text-amber-700',
  sightseeing:  'bg-sky-100 text-sky-700',
  attraction:   'bg-sky-100 text-sky-700',
  transport:    'bg-purple-100 text-purple-700',
  accommodation:'bg-teal-100 text-teal-700',
  shopping:     'bg-pink-100 text-pink-700',
  outdoor:      'bg-green-100 text-green-700',
  culture:      'bg-indigo-100 text-indigo-700',
  entertainment:'bg-rose-100 text-rose-700',
}

function categoryStyle(category) {
  if (!category) return 'bg-navy-100 text-navy-600'
  return CATEGORY_STYLES[category.toLowerCase()] ?? 'bg-navy-100 text-navy-600'
}

function formatTime(timeStr) {
  if (!timeStr) return null
  // Accepts 'HH:MM' or 'HH:MM:SS'
  const [h, m] = timeStr.split(':').map(Number)
  if (isNaN(h)) return timeStr
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

function CurrencyIcon({ currency }) {
  if (currency === 'INR') return <IndianRupee className="w-3 h-3" />
  return <DollarSign className="w-3 h-3" />
}

export default function ActivityCard({
  activity = {},
  onReplace,
  onRemove,
  editable = false,
  draggable = false,
}) {
  const [expanded, setExpanded] = useState(false)

  const {
    id,
    name = 'Unnamed Activity',
    description,
    location,
    start_time,
    end_time,
    estimated_cost,
    currency = 'USD',
    category,
    neighborhood,
  } = activity

  const timeRange =
    start_time && end_time
      ? `${formatTime(start_time)} - ${formatTime(end_time)}`
      : start_time
      ? `From ${formatTime(start_time)}`
      : null

  const displayLocation = neighborhood
    ? `${location}${location ? ', ' : ''}${neighborhood}`
    : location

  return (
    <div
      className="flex gap-2 p-3 rounded-xl bg-surface-card border border-surface-border
                 hover:border-teal-200 hover:shadow-card transition-all duration-150"
    >
      {/* Drag handle */}
      {draggable && (
        <div
          className="flex items-center self-stretch cursor-grab active:cursor-grabbing
                     text-navy-300 hover:text-navy-500 transition-colors shrink-0"
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        {/* Badge row */}
        <div className="flex flex-wrap items-center gap-1.5">
          {timeRange && (
            <span className="badge bg-navy-100 text-navy-600 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeRange}
            </span>
          )}

          {estimated_cost != null && (
            <span className="badge bg-teal-100 text-teal-700 flex items-center gap-0.5">
              <CurrencyIcon currency={currency} />
              {Number(estimated_cost).toLocaleString()}
            </span>
          )}

          {category && (
            <span className={`badge ${categoryStyle(category)}`}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </span>
          )}
        </div>

        {/* Activity name */}
        <h4 className="text-sm font-semibold text-navy-800 leading-snug">{name}</h4>

        {/* Description with expand toggle */}
        {description && (
          <div>
            <p
              className={`text-xs text-navy-500 leading-relaxed ${
                expanded ? '' : 'line-clamp-2'
              }`}
            >
              {description}
            </p>
            {description.length > 120 && (
              <button
                className="text-xs text-teal-600 hover:text-teal-700 font-medium mt-0.5
                           focus:outline-none focus:underline"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
              >
                {expanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}

        {/* Location */}
        {displayLocation && (
          <div className="flex items-start gap-1 text-xs text-navy-400">
            <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{displayLocation}</span>
          </div>
        )}
      </div>

      {/* Editable action buttons */}
      {editable && (
        <div className="flex flex-col gap-1 shrink-0">
          {onReplace && (
            <button
              className="p-1.5 rounded-lg text-navy-400 hover:text-teal-600 hover:bg-teal-50
                         transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400/50"
              onClick={() => onReplace(activity)}
              aria-label={`Replace activity: ${name}`}
              title="Replace"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          {onRemove && (
            <button
              className="p-1.5 rounded-lg text-navy-400 hover:text-error hover:bg-error/10
                         transition-colors focus:outline-none focus:ring-2 focus:ring-error/40"
              onClick={() => onRemove(id)}
              aria-label={`Remove activity: ${name}`}
              title="Remove"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
