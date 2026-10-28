import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DayPanel from '../components/DayPanel/DayPanel'

const mockDay = {
  day_number: 1,
  date: '2024-06-01',
  theme: 'Arrival & City Tour',
  activities: [
    { id: 'act1', name: 'City Walking Tour', description: 'A great walk', location: 'Downtown',
      start_time: '09:00', end_time: '11:00', estimated_cost: 20, currency: 'USD', category: 'sightseeing' }
  ],
  daily_budget: 200,
}

describe('DayPanel', () => {
  it('renders day number and theme', () => {
    render(<DayPanel day={mockDay} />)
    expect(screen.getByText(/Day 1/i)).toBeInTheDocument()
    expect(screen.getByText(/Arrival & City Tour/i)).toBeInTheDocument()
  })

  it('expands to show activities on click', () => {
    render(<DayPanel day={mockDay} />)
    fireEvent.click(screen.getByRole('button', { expanded: false }))
    expect(screen.getByText('City Walking Tour')).toBeInTheDocument()
  })

  it('shows regenerate button when onRegenerate is provided', () => {
    render(<DayPanel day={mockDay} onRegenerate={vi.fn()} />)
    fireEvent.click(screen.getAllByRole('button')[0])
    expect(screen.getByText(/Regenerate Day/i)).toBeInTheDocument()
  })
})
