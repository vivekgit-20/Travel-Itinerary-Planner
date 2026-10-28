import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/shared/ProtectedRoute'
import Navbar from './components/shared/Navbar'

import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import Dashboard from './pages/Dashboard'
import CreateTripPage from './pages/CreateTripPage'
import ItineraryDetailsPage from './pages/ItineraryDetailsPage'
import EditItineraryPage from './pages/EditItineraryPage'
import SavedTripsPage from './pages/SavedTripsPage'
import DestinationRecommendationsPage from './pages/DestinationRecommendationsPage'
import ProfilePage from './pages/ProfilePage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <main className="pt-14">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/trips/new" element={
              <ProtectedRoute><CreateTripPage /></ProtectedRoute>
            } />
            <Route path="/trips/:tripId/edit" element={
              <ProtectedRoute><EditItineraryPage /></ProtectedRoute>
            } />
            <Route path="/trips/:tripId" element={
              <ProtectedRoute><ItineraryDetailsPage /></ProtectedRoute>
            } />
            <Route path="/trips" element={
              <ProtectedRoute><SavedTripsPage /></ProtectedRoute>
            } />
            <Route path="/recommendations" element={
              <ProtectedRoute><DestinationRecommendationsPage /></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><ProfilePage /></ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
