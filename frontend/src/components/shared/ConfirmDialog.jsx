/**
 * ConfirmDialog - modal for confirming destructive or important actions.
 *
 * Props:
 *   isOpen        boolean
 *   title         string
 *   message       string
 *   confirmLabel  string   (default "Confirm")
 *   cancelLabel   string   (default "Cancel")
 *   onConfirm     () => void
 *   onCancel      () => void
 *   destructive   boolean  (default true)  - red confirm button when true
 */

import { useEffect, useRef } from 'react'

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  destructive = true,
}) {
  const cancelRef = useRef(null)

  // Focus the cancel button when the dialog opens for safe default action
  useEffect(() => {
    if (isOpen) {
      cancelRef.current?.focus()
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  const confirmBtnClass = destructive
    ? 'px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors'
    : 'px-4 py-2 rounded-lg text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors'

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in"
      aria-modal="true"
      role="dialog"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
      onClick={(e) => {
        // Close when clicking directly on the backdrop
        if (e.target === e.currentTarget) onCancel?.()
      }}
    >
      {/* Card */}
      <div className="w-full max-w-md bg-surface-card rounded-2xl shadow-card-elevated p-6 animate-slide-up">
        <h2
          id="confirm-dialog-title"
          className="text-base font-semibold text-navy-800 mb-2"
        >
          {title}
        </h2>

        {message && (
          <p
            id="confirm-dialog-message"
            className="text-sm text-navy-500 mb-6"
          >
            {message}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-navy-600 bg-surface-muted hover:bg-surface-border focus:outline-none focus:ring-2 focus:ring-navy-300 focus:ring-offset-2 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={confirmBtnClass}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
