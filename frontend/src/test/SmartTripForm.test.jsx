import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SmartTripForm from '../components/SmartTripForm/SmartTripForm'

const mockSubmit = vi.fn()

describe('SmartTripForm validation', () => {
  it('shows error for empty destination', () => {
    render(<SmartTripForm onSubmit={mockSubmit} isLoading={false} />)
    fireEvent.click(screen.getByText('Next'))
    expect(screen.getByText(/enter a destination/i)).toBeInTheDocument()
  })

  it('shows error for whitespace-only destination', () => {
    render(<SmartTripForm onSubmit={mockSubmit} isLoading={false} />)
    fireEvent.change(screen.getByPlaceholderText(/paris, france/i), { target: { value: '   ' } })
    fireEvent.click(screen.getByText('Next'))
    expect(screen.getByText(/enter a destination/i)).toBeInTheDocument()
  })

  it('does not call onSubmit when validation fails', () => {
    render(<SmartTripForm onSubmit={mockSubmit} isLoading={false} />)
    fireEvent.click(screen.getByText('Next'))
    expect(mockSubmit).not.toHaveBeenCalled()
  })
})
