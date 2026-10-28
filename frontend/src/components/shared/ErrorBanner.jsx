/**
 * ErrorBanner - accessible error message strip.
 *
 * Props:
 *   message    string              Error text to display
 *   onRetry    () => void          Optional - shows "Try again" button
 *   onDismiss  () => void          Optional - shows X close button
 */

import { AlertCircle, X } from 'lucide-react'

export default function ErrorBanner({ message, onRetry, onDismiss }) {
  if (!message) return null

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-rose-800"
    >
      <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-rose-500" aria-hidden="true" />

      <p className="flex-1 text-sm">{message}</p>

      <div className="flex items-center gap-2 flex-shrink-0">
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-sm font-medium text-rose-700 hover:text-rose-900 underline underline-offset-2 transition-colors"
          >
            Try again
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Dismiss error"
            className="p-0.5 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
