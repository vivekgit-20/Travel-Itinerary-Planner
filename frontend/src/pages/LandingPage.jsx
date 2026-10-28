/**
 * LandingPage - route: /
 *
 * Sections:
 *   1. Navbar (from shared components)
 *   2. Hero - headline, sub-text, CTAs, travel imagery (gradient)
 *   3. Features - 6 feature highlights
 *   4. How It Works - 3 steps
 *   5. Example itinerary preview card
 *   6. Benefits / stats section
 *   7. Footer
 */

import { Link } from 'react-router-dom'
import {
  Sparkles,
  MapPin,
  Calendar,
  DollarSign,
  Download,
  Compass,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import Navbar from '../components/shared/Navbar'

// ─── Feature data ────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI Itineraries',
    description:
      'Get a fully-personalized day-by-day travel plan generated in seconds, tailored to your interests and travel style.',
  },
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description:
      'Activities are grouped by neighborhood and ordered to minimize travel time, so every day flows naturally.',
  },
  {
    icon: DollarSign,
    title: 'Budget Planner',
    description:
      'Set your total budget and get a per-day, per-person cost breakdown with every itinerary-no surprises.',
  },
  {
    icon: MapPin,
    title: 'Multi-Day Plans',
    description:
      'Plan trips from weekend getaways to month-long adventures. Every day gets its own theme and activity set.',
  },
  {
    icon: Download,
    title: 'PDF Export',
    description:
      'Download a beautifully formatted PDF of your itinerary to share, print, or keep offline for your trip.',
  },
  {
    icon: Compass,
    title: 'Destination Discovery',
    description:
      "Tell us your interests and budget and we'll surface destinations you might not have considered.",
  },
]

// ─── How It Works steps ───────────────────────────────────────────────────────

const STEPS = [
  {
    step: '01',
    title: 'Set Preferences',
    description:
      'Enter your destination, travel dates, number of travelers, interests, dietary needs, and total budget.',
  },
  {
    step: '02',
    title: 'AI Generates',
    description:
      'Our AI builds a complete itinerary - optimized daily schedules, curated activities, and cost estimates.',
  },
  {
    step: '03',
    title: 'Explore & Export',
    description:
      'Review and edit your plan, swap out activities, regenerate individual days, then export to PDF.',
  },
]

// ─── Stats ────────────────────────────────────────────────────────────────────

const STATS = [
  { value: '500+', label: 'Destinations' },
  { value: 'AI', label: 'Powered' },
  { value: '5 min', label: 'Setup' },
  { value: 'PDF', label: 'Export' },
]

// ─── Mock Paris itinerary ─────────────────────────────────────────────────────

const PARIS_PREVIEW = [
  {
    day: 'Day 1',
    theme: 'Iconic Paris',
    activities: [
      { time: '9:00 AM', name: 'Eiffel Tower', cost: '€29' },
      { time: '12:00 PM', name: 'Lunch at Café de Flore', cost: '€22' },
      { time: '2:30 PM', name: 'Musée du Louvre', cost: '€17' },
      { time: '7:00 PM', name: 'Seine River Cruise', cost: '€15' },
    ],
    budget: '€83',
  },
  {
    day: 'Day 2',
    theme: 'Art & Montmartre',
    activities: [
      { time: '10:00 AM', name: 'Sacré-Cœur Basilica', cost: 'Free' },
      { time: '12:30 PM', name: 'Crêperie Suzette', cost: '€14' },
      { time: '2:00 PM', name: 'Musée d\'Orsay', cost: '€14' },
      { time: '6:30 PM', name: 'Wine tasting in Le Marais', cost: '€35' },
    ],
    budget: '€63',
  },
  {
    day: 'Day 3',
    theme: 'Versailles & Farewell',
    activities: [
      { time: '9:00 AM', name: 'Palace of Versailles', cost: '€20' },
      { time: '1:00 PM', name: 'Garden picnic', cost: '€12' },
      { time: '4:00 PM', name: 'Champs-Élysées stroll', cost: 'Free' },
      { time: '7:30 PM', name: 'Farewell dinner', cost: '€45' },
    ],
    budget: '€77',
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface font-sans">
      {/* ── 1. Navbar ─────────────────────────────────────────────────────── */}
      <Navbar />

      {/* ── 2. Hero ───────────────────────────────────────────────────────── */}
      <section
        className="relative pt-28 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 25%, #0369a1 65%, #0f172a 100%)',
        }}
        aria-label="Hero"
      >
        {/* Decorative background circles */}
        <span
          aria-hidden="true"
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #5eead4, transparent)' }}
        />
        <span
          aria-hidden="true"
          className="absolute bottom-0 -left-16 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #38bdf8, transparent)' }}
        />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-teal-200 text-xs font-medium mb-6 border border-white/20">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            AI-Powered Travel Planning
          </span>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight mb-6">
            Your Next Adventure,{' '}
            <span className="text-teal-300">Planned Intelligently.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-teal-100/90 max-w-2xl mx-auto mb-10 leading-relaxed">
            Create personalized travel itineraries with AI-powered recommendations, smart daily
            schedules, and budget estimates-all in one place.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/trips/new"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-navy-900 font-semibold text-base transition-colors shadow-lg hover:shadow-teal-400/30 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:ring-offset-2 focus:ring-offset-transparent"
            >
              Plan My Trip
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 text-white font-semibold text-base transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent"
            >
              Explore Features
            </a>
          </div>

          {/* Quick stats under hero */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-sm text-teal-200 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Features ───────────────────────────────────────────────────── */}
      <section
        id="features"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-surface"
        aria-label="Features"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-navy-800 mb-4">
              Everything you need to travel smarter
            </h2>
            <p className="text-navy-500 text-lg max-w-xl mx-auto">
              From first idea to downloaded itinerary, TravelPlanner handles every step.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="bg-surface-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-shadow border border-surface-border"
              >
                <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-teal-600" aria-hidden="true" />
                </div>
                <h3 className="text-navy-800 font-semibold text-base mb-2">{title}</h3>
                <p className="text-navy-500 text-sm leading-relaxed">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. How It Works ───────────────────────────────────────────────── */}
      <section
        className="py-20 px-4 sm:px-6 lg:px-8 bg-surface-muted"
        aria-label="How It Works"
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-navy-800 mb-4">
              How it works
            </h2>
            <p className="text-navy-500 text-lg max-w-lg mx-auto">
              Three simple steps from idea to itinerary.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map(({ step, title, description }, idx) => (
              <div key={step} className="relative flex flex-col items-center text-center">
                {/* Connector line (desktop only) */}
                {idx < STEPS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="hidden md:block absolute top-7 left-[calc(50%+2.5rem)] w-[calc(100%-5rem)] h-px bg-teal-200"
                  />
                )}
                {/* Step number bubble */}
                <div className="w-14 h-14 rounded-full bg-teal-600 text-white font-bold text-lg flex items-center justify-center mb-5 shadow-md relative z-10">
                  {step}
                </div>
                <h3 className="text-navy-800 font-semibold text-lg mb-2">{title}</h3>
                <p className="text-navy-500 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Example Itinerary Preview ──────────────────────────────────── */}
      <section
        className="py-20 px-4 sm:px-6 lg:px-8 bg-surface"
        aria-label="Itinerary preview"
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-navy-800 mb-4">
              See what your itinerary looks like
            </h2>
            <p className="text-navy-500 text-lg max-w-lg mx-auto">
              A real 3-day Paris trip generated in under 5 minutes.
            </p>
          </div>

          {/* Card */}
          <div className="bg-surface-card border border-surface-border rounded-2xl shadow-card-elevated overflow-hidden">
            {/* Card header */}
            <div
              className="px-6 py-5 flex items-center justify-between"
              style={{ background: 'linear-gradient(90deg, #0f766e, #0369a1)' }}
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-teal-200" aria-hidden="true" />
                <div>
                  <p className="text-white font-semibold text-base">Paris, France</p>
                  <p className="text-teal-200 text-xs">3 days · 2 travelers · Budget €700</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-white/15 text-white text-xs font-medium border border-white/20">
                AI Generated
              </span>
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-surface-border">
              {PARIS_PREVIEW.map(({ day, theme, activities, budget }) => (
                <div key={day} className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-navy-800 font-semibold text-sm">{day}</p>
                      <p className="text-teal-600 text-xs font-medium">{theme}</p>
                    </div>
                    <span className="text-xs text-navy-500 font-medium bg-surface-muted px-2 py-0.5 rounded-full">
                      {budget}
                    </span>
                  </div>
                  <ul className="space-y-2.5">
                    {activities.map(({ time, name, cost }) => (
                      <li key={name} className="flex items-start gap-2">
                        <CheckCircle2
                          className="w-3.5 h-3.5 text-teal-500 mt-0.5 shrink-0"
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <p className="text-navy-700 text-xs font-medium truncate">{name}</p>
                          <p className="text-navy-400 text-2xs">
                            {time} · {cost}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Card footer */}
            <div className="px-6 py-4 bg-surface-muted border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-navy-500 text-sm">
                Total estimated cost: <span className="text-navy-800 font-semibold">€223 / person</span>
              </p>
              <Link
                to="/trips/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1"
              >
                Create your own
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Benefits / Stats banner ────────────────────────────────────── */}
      <section
        className="py-20 px-4 sm:px-6 lg:px-8"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #0f766e 100%)',
        }}
        aria-label="Benefits"
      >
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Why travelers choose TravelPlanner
          </h2>
          <p className="text-teal-200 text-lg mb-14 max-w-xl mx-auto">
            Built for people who love to travel but hate spending hours planning.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-14">
            {[
              { value: '500+', label: 'Destinations covered' },
              { value: '< 5 min', label: 'Average setup time' },
              { value: '100%', label: 'AI-powered plans' },
              { value: 'Free', label: 'PDF export' },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="bg-white/10 border border-white/15 rounded-2xl px-6 py-8"
              >
                <p className="text-3xl font-bold text-teal-300 mb-2">{value}</p>
                <p className="text-teal-100 text-sm">{label}</p>
              </div>
            ))}
          </div>

          <Link
            to="/trips/new"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-teal-400 hover:bg-teal-300 text-navy-900 font-semibold text-base transition-colors shadow-lg focus:outline-none focus:ring-2 focus:ring-teal-300 focus:ring-offset-2 focus:ring-offset-transparent"
          >
            Start planning for free
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* ── 7. Footer ─────────────────────────────────────────────────────── */}
      <footer className="bg-navy-900 text-navy-400 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2 text-white font-semibold text-base">
            <span aria-hidden="true">✈</span>
            <span>TravelPlanner</span>
          </div>

          {/* Links */}
          <nav aria-label="Footer navigation" className="flex items-center gap-6 text-sm">
            <a href="#" className="hover:text-teal-400 transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-teal-400 transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-teal-400 transition-colors">
              About
            </a>
          </nav>

          {/* Copyright */}
          <p className="text-sm text-navy-500">
            © {new Date().getFullYear()} TravelPlanner. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
