import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorFallback } from './ErrorFallback'

describe('ErrorFallback component', () => {
  const mockError = new Error('Test error message')
  const mockResetErrorBoundary = vi.fn()

  // Set DEV to false for testing
  beforeEach(() => {
    Object.defineProperty(import.meta, 'env', {
      value: { DEV: false },
      writable: true,
      configurable: true
    })
  })

  it('should render error message', () => {
    render(
      <ErrorFallback 
        error={mockError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    )

    expect(screen.getByText('Application Error')).toBeInTheDocument()
    expect(screen.getByText(/Something unexpected happened/)).toBeInTheDocument()
    expect(screen.getByText('Test error message')).toBeInTheDocument()
  })

  it('should display error details section', () => {
    render(
      <ErrorFallback 
        error={mockError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    )

    expect(screen.getByText('Error Details:')).toBeInTheDocument()
  })

  it('should render try again button', () => {
    render(
      <ErrorFallback 
        error={mockError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    )

    const button = screen.getByRole('button', { name: /try again/i })
    expect(button).toBeInTheDocument()
  })

  it('should call resetErrorBoundary when try again button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <ErrorFallback 
        error={mockError} 
        resetErrorBoundary={mockResetErrorBoundary} 
      />
    )

    const button = screen.getByRole('button', { name: /try again/i })
    await user.click(button)

    expect(mockResetErrorBoundary).toHaveBeenCalledTimes(1)
  })
})
