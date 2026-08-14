import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App shell', () => {
  it('renders the dashboard placeholder and full nav on load', async () => {
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()

    for (const label of [
      'Dashboard',
      'Expenses',
      'Income',
      'Budgets',
      'Savings',
      'Reports',
      'Backup',
      'Settings',
    ]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0)
    }
  })
})
