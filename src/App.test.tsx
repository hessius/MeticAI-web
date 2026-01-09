import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

// Mock fetch globally
global.fetch = vi.fn()

describe('App component - Form view', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render the application title', () => {
    render(<App />)
    
    expect(screen.getByText(/MeticAI/)).toBeInTheDocument()
    expect(screen.getByText('Meticulous Espresso Profile Generator')).toBeInTheDocument()
  })

  it('should render file upload area', () => {
    render(<App />)
    
    expect(screen.getByText(/Tap to upload or take photo/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Coffee Bag Photo/)).toBeInTheDocument()
  })

  it('should render taste preferences textarea', () => {
    render(<App />)
    
    const textarea = screen.getByPlaceholderText(/Balanced extraction, nutty notes/i)
    expect(textarea).toBeInTheDocument()
  })

  it('should render preset tags', () => {
    render(<App />)
    
    expect(screen.getByText('Light Body')).toBeInTheDocument()
    expect(screen.getByText('Medium Body')).toBeInTheDocument()
    expect(screen.getByText('Heavy Body')).toBeInTheDocument()
    expect(screen.getByText('Florals')).toBeInTheDocument()
    expect(screen.getByText('Chocolate')).toBeInTheDocument()
  })

  it('should have disabled submit button initially', () => {
    render(<App />)
    
    const button = screen.getByRole('button', { name: /Generate Profile/i })
    expect(button).toBeDisabled()
  })

  it('should enable submit button when text is entered', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    const textarea = screen.getByPlaceholderText(/Balanced extraction, nutty notes/i)
    await user.type(textarea, 'Fruity notes')
    
    const button = screen.getByRole('button', { name: /Generate Profile/i })
    expect(button).toBeEnabled()
  })

  it('should enable submit button when a tag is selected', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    const lightBodyTag = screen.getByText('Light Body')
    await user.click(lightBodyTag)
    
    const button = screen.getByRole('button', { name: /Generate Profile/i })
    expect(button).toBeEnabled()
  })

  it('should toggle tags when clicked', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    const lightBodyTag = screen.getByText('Light Body')
    
    // Click to select
    await user.click(lightBodyTag)
    expect(lightBodyTag.closest('button')).toHaveClass('bg-primary')
    
    // Click to deselect
    await user.click(lightBodyTag)
    expect(lightBodyTag.closest('button')).not.toHaveClass('bg-primary')
  })

  it('should allow selecting multiple tags', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    const lightBodyTag = screen.getByText('Light Body')
    const floralsTag = screen.getByText('Florals')
    
    await user.click(lightBodyTag)
    await user.click(floralsTag)
    
    expect(lightBodyTag.closest('button')).toHaveClass('bg-primary')
    expect(floralsTag.closest('button')).toHaveClass('bg-primary')
  })

  it('should handle file upload', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    const file = new File(['test'], 'test.png', { type: 'image/png' })
    const input = screen.getByLabelText(/Coffee Bag Photo/) as HTMLInputElement
    
    await user.upload(input, file)
    
    await waitFor(() => {
      expect(screen.getByAltText('Coffee bag preview')).toBeInTheDocument()
    })
  })

  it('should show error for non-image file upload', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    const input = screen.getByLabelText(/Coffee Bag Photo/) as HTMLInputElement
    
    await user.upload(input, file)
    
    await waitFor(() => {
      expect(screen.getByText(/Please upload an image file/i)).toBeInTheDocument()
    })
  })

  it('should allow removing uploaded image', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    const file = new File(['test'], 'test.png', { type: 'image/png' })
    const input = screen.getByLabelText(/Coffee Bag Photo/) as HTMLInputElement
    
    await user.upload(input, file)
    
    await waitFor(() => {
      expect(screen.getByAltText('Coffee bag preview')).toBeInTheDocument()
    })
    
    const removeButton = screen.getByRole('button', { name: '' })
    await user.click(removeButton)
    
    await waitFor(() => {
      expect(screen.queryByAltText('Coffee bag preview')).not.toBeInTheDocument()
    })
  })

  it('should show error when submitting empty form', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    // Force enable the button (simulating edge case)
    const button = screen.getByRole('button', { name: /Generate Profile/i })
    
    // Add text to enable button
    const textarea = screen.getByPlaceholderText(/Balanced extraction, nutty notes/i)
    await user.type(textarea, 'test')
    await user.clear(textarea)
    
    // Button should be disabled again
    expect(button).toBeDisabled()
  })
})

describe('App component - Loading state', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('should show loading state after submit', async () => {
    const user = userEvent.setup({ delay: null })
    
    // Mock a delayed API response
    ;(global.fetch as any).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({
          status: 'success',
          analysis: 'Test analysis',
          reply: 'Test reply'
        })
      }), 5000))
    )
    
    render(<App />)
    
    const textarea = screen.getByPlaceholderText(/Balanced extraction, nutty notes/i)
    await user.type(textarea, 'Fruity notes')
    
    const button = screen.getByRole('button', { name: /Generate Profile/i })
    await user.click(button)
    
    await waitFor(() => {
      expect(screen.getByText(/Analyzing coffee beans/i)).toBeInTheDocument()
    })
  })

  it('should cycle through loading messages', async () => {
    const user = userEvent.setup({ delay: null })
    
    ;(global.fetch as any).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({
          status: 'success',
          analysis: 'Test analysis',
          reply: 'Test reply'
        })
      }), 10000))
    )
    
    render(<App />)
    
    const textarea = screen.getByPlaceholderText(/Balanced extraction, nutty notes/i)
    await user.type(textarea, 'Fruity notes')
    
    const button = screen.getByRole('button', { name: /Generate Profile/i })
    await user.click(button)
    
    await waitFor(() => {
      expect(screen.getByText(/Analyzing coffee beans/i)).toBeInTheDocument()
    })
    
    // Fast forward to next message
    vi.advanceTimersByTime(3500)
    
    await waitFor(() => {
      expect(screen.queryByText(/Analyzing coffee beans/i)).not.toBeInTheDocument()
    })
  })

  it('should show progress bar during loading', async () => {
    const user = userEvent.setup({ delay: null })
    
    ;(global.fetch as any).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({
          status: 'success',
          analysis: 'Test analysis',
          reply: 'Test reply'
        })
      }), 5000))
    )
    
    render(<App />)
    
    const textarea = screen.getByPlaceholderText(/Balanced extraction, nutty notes/i)
    await user.type(textarea, 'Fruity notes')
    
    const button = screen.getByRole('button', { name: /Generate Profile/i })
    await user.click(button)
    
    await waitFor(() => {
      const progressBar = document.querySelector('.bg-gradient-to-r')
      expect(progressBar).toBeInTheDocument()
    })
  })
})

describe('App component - Results state', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should display results after successful submission', async () => {
    const user = userEvent.setup()
    
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        analysis: 'Medium roast Ethiopian coffee with fruity notes',
        reply: 'Profile generated successfully'
      })
    })
    
    render(<App />)
    
    const textarea = screen.getByPlaceholderText(/Balanced extraction, nutty notes/i)
    await user.type(textarea, 'Fruity notes')
    
    const button = screen.getByRole('button', { name: /Generate Profile/i })
    await user.click(button)
    
    await waitFor(() => {
      expect(screen.getByText('Profile Generated!')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Medium roast Ethiopian coffee with fruity notes')).toBeInTheDocument()
    expect(screen.getByText('Profile generated successfully')).toBeInTheDocument()
  })

  it('should show create another profile button in results', async () => {
    const user = userEvent.setup()
    
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        analysis: 'Test analysis',
        reply: 'Test reply'
      })
    })
    
    render(<App />)
    
    const textarea = screen.getByPlaceholderText(/Balanced extraction, nutty notes/i)
    await user.type(textarea, 'Fruity notes')
    
    const button = screen.getByRole('button', { name: /Generate Profile/i })
    await user.click(button)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create Another Profile/i })).toBeInTheDocument()
    })
  })

  it('should reset form when create another profile is clicked', async () => {
    const user = userEvent.setup()
    
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        analysis: 'Test analysis',
        reply: 'Test reply'
      })
    })
    
    render(<App />)
    
    const textarea = screen.getByPlaceholderText(/Balanced extraction, nutty notes/i)
    await user.type(textarea, 'Fruity notes')
    
    const submitButton = screen.getByRole('button', { name: /Generate Profile/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Profile Generated!')).toBeInTheDocument()
    })
    
    const resetButton = screen.getByRole('button', { name: /Create Another Profile/i })
    await user.click(resetButton)
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Balanced extraction, nutty notes/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Generate Profile/i })).toBeInTheDocument()
    })
  })
})

describe('App component - Error state', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should display error state on API failure', async () => {
    const user = userEvent.setup()
    
    ;(global.fetch as any).mockRejectedValue(new Error('Network error'))
    
    render(<App />)
    
    const textarea = screen.getByPlaceholderText(/Balanced extraction, nutty notes/i)
    await user.type(textarea, 'Fruity notes')
    
    const button = screen.getByRole('button', { name: /Generate Profile/i })
    await user.click(button)
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument()
    })
    
    expect(screen.getByText(/Failed to generate profile: Network error/i)).toBeInTheDocument()
  })

  it('should display error for HTTP error status', async () => {
    const user = userEvent.setup()
    
    ;(global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
    })
    
    render(<App />)
    
    const textarea = screen.getByPlaceholderText(/Balanced extraction, nutty notes/i)
    await user.type(textarea, 'Fruity notes')
    
    const button = screen.getByRole('button', { name: /Generate Profile/i })
    await user.click(button)
    
    await waitFor(() => {
      expect(screen.getByText(/HTTP error! status: 500/i)).toBeInTheDocument()
    })
  })

  it('should show retry button in error state', async () => {
    const user = userEvent.setup()
    
    ;(global.fetch as any).mockRejectedValue(new Error('Network error'))
    
    render(<App />)
    
    const textarea = screen.getByPlaceholderText(/Balanced extraction, nutty notes/i)
    await user.type(textarea, 'Fruity notes')
    
    const button = screen.getByRole('button', { name: /Generate Profile/i })
    await user.click(button)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument()
    })
  })

  it('should retry on retry button click', async () => {
    const user = userEvent.setup()
    
    // First call fails, second succeeds
    ;(global.fetch as any)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'success',
          analysis: 'Test analysis',
          reply: 'Test reply'
        })
      })
    
    render(<App />)
    
    const textarea = screen.getByPlaceholderText(/Balanced extraction, nutty notes/i)
    await user.type(textarea, 'Fruity notes')
    
    const submitButton = screen.getByRole('button', { name: /Generate Profile/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument()
    })
    
    const retryButton = screen.getByRole('button', { name: /Retry/i })
    await user.click(retryButton)
    
    await waitFor(() => {
      expect(screen.getByText('Profile Generated!')).toBeInTheDocument()
    })
  })

  it('should show back to form button in error state', async () => {
    const user = userEvent.setup()
    
    ;(global.fetch as any).mockRejectedValue(new Error('Network error'))
    
    render(<App />)
    
    const textarea = screen.getByPlaceholderText(/Balanced extraction, nutty notes/i)
    await user.type(textarea, 'Fruity notes')
    
    const button = screen.getByRole('button', { name: /Generate Profile/i })
    await user.click(button)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Back to Form/i })).toBeInTheDocument()
    })
  })

  it('should reset to form on back to form button click', async () => {
    const user = userEvent.setup()
    
    ;(global.fetch as any).mockRejectedValue(new Error('Network error'))
    
    render(<App />)
    
    const textarea = screen.getByPlaceholderText(/Balanced extraction, nutty notes/i)
    await user.type(textarea, 'Fruity notes')
    
    const submitButton = screen.getByRole('button', { name: /Generate Profile/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Back to Form/i })).toBeInTheDocument()
    })
    
    const backButton = screen.getByRole('button', { name: /Back to Form/i })
    await user.click(backButton)
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Balanced extraction, nutty notes/i)).toBeInTheDocument()
    })
  })
})

describe('App component - API integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should send user preferences in API request', async () => {
    const user = userEvent.setup()
    
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        analysis: 'Test',
        reply: 'Test'
      })
    })
    
    render(<App />)
    
    const textarea = screen.getByPlaceholderText(/Balanced extraction, nutty notes/i)
    await user.type(textarea, 'Fruity and bright')
    
    const button = screen.getByRole('button', { name: /Generate Profile/i })
    await user.click(button)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/analyze_and_profile',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData)
        })
      )
    })
    
    const callArgs = (global.fetch as any).mock.calls[0]
    const formData = callArgs[1].body as FormData
    expect(formData.get('user_prefs')).toBe('Fruity and bright')
  })

  it('should send selected tags in API request', async () => {
    const user = userEvent.setup()
    
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        analysis: 'Test',
        reply: 'Test'
      })
    })
    
    render(<App />)
    
    const lightBodyTag = screen.getByText('Light Body')
    const floralsTag = screen.getByText('Florals')
    
    await user.click(lightBodyTag)
    await user.click(floralsTag)
    
    const button = screen.getByRole('button', { name: /Generate Profile/i })
    await user.click(button)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })
    
    const callArgs = (global.fetch as any).mock.calls[0]
    const formData = callArgs[1].body as FormData
    const userPrefs = formData.get('user_prefs') as string
    
    expect(userPrefs).toContain('Light Body')
    expect(userPrefs).toContain('Florals')
  })

  it('should combine tags and text preferences', async () => {
    const user = userEvent.setup()
    
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        analysis: 'Test',
        reply: 'Test'
      })
    })
    
    render(<App />)
    
    const lightBodyTag = screen.getByText('Light Body')
    await user.click(lightBodyTag)
    
    const textarea = screen.getByPlaceholderText(/Balanced extraction, nutty notes/i)
    await user.type(textarea, 'Bright acidity')
    
    const button = screen.getByRole('button', { name: /Generate Profile/i })
    await user.click(button)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })
    
    const callArgs = (global.fetch as any).mock.calls[0]
    const formData = callArgs[1].body as FormData
    const userPrefs = formData.get('user_prefs') as string
    
    expect(userPrefs).toContain('Light Body')
    expect(userPrefs).toContain('Bright acidity')
  })
})
