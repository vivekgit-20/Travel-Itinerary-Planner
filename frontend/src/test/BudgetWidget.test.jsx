import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import BudgetWidget from '../components/BudgetWidget/BudgetWidget'

describe('BudgetWidget', () => {
  it('renders total budget', () => {
    render(<BudgetWidget totalBudget={1000} allocated={500} currency="USD" dailyBreakdown={[]} />)
    expect(screen.getByText(/\$1,000/)).toBeInTheDocument()
  })

  it('shows remaining budget', () => {
    render(<BudgetWidget totalBudget={1000} allocated={600} currency="USD" dailyBreakdown={[]} />)
    expect(screen.getByText(/\$400/)).toBeInTheDocument()
  })

  it('shows over budget state when allocated exceeds total', () => {
    render(<BudgetWidget totalBudget={500} allocated={700} currency="USD" dailyBreakdown={[]} />)
    expect(screen.getByText(/over/i)).toBeInTheDocument()
  })
})
