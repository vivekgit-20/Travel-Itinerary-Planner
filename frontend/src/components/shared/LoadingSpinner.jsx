/**
 * LoadingSpinner - animated teal spinner.
 *
 * Props:
 *   size  'sm' | 'md' | 'lg'  (default 'md')
 */

import { Loader2 } from 'lucide-react'

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-10 h-10',
}

export default function LoadingSpinner({ size = 'md' }) {
  const sizeClass = sizeMap[size] ?? sizeMap.md

  return (
    <Loader2
      className={`${sizeClass} text-teal-600 animate-spin`}
      aria-label="Loading"
      role="status"
    />
  )
}
