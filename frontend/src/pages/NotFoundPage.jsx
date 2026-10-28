import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <span className="p-6 rounded-full bg-teal-50">
            <MapPin className="w-12 h-12 text-teal-400" />
          </span>
        </div>
        <h1 className="text-7xl font-bold text-navy-200 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-navy-800 mb-3">Page not found</h2>
        <p className="text-navy-500 mb-8">
          Looks like this destination doesn't exist on our map. Let's get you back on track.
        </p>
        <Link to="/" className="btn-primary px-6 py-2.5 text-base">
          Go Home
        </Link>
      </div>
    </div>
  )
}
