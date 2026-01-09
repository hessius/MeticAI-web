import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useIsMobile } from './use-mobile'

describe('useIsMobile hook', () => {
  beforeEach(() => {
    // Reset window.innerWidth before each test
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
  })

  it('should return false for desktop viewport', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })

    const { result } = renderHook(() => useIsMobile())
    
    expect(result.current).toBe(false)
  })

  it('should return true for mobile viewport', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })

    const { result } = renderHook(() => useIsMobile())
    
    expect(result.current).toBe(true)
  })

  it('should return true for viewport at breakpoint - 1 (767px)', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 767,
    })

    const { result } = renderHook(() => useIsMobile())
    
    expect(result.current).toBe(true)
  })

  it('should return false for viewport at breakpoint (768px)', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    })

    const { result } = renderHook(() => useIsMobile())
    
    expect(result.current).toBe(false)
  })

  it('should update when window is resized to mobile', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })

    const { result, rerender } = renderHook(() => useIsMobile())
    
    expect(result.current).toBe(false)

    // Simulate window resize to mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })

    // Trigger the matchMedia change event
    const mediaQueryList = window.matchMedia('(max-width: 767px)')
    const changeEvent = new Event('change')
    mediaQueryList.dispatchEvent(changeEvent)

    rerender()

    await waitFor(() => {
      expect(result.current).toBe(true)
    })
  })

  it('should update when window is resized to desktop', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })

    const { result, rerender } = renderHook(() => useIsMobile())
    
    expect(result.current).toBe(true)

    // Simulate window resize to desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })

    // Trigger the matchMedia change event
    const mediaQueryList = window.matchMedia('(max-width: 767px)')
    const changeEvent = new Event('change')
    mediaQueryList.dispatchEvent(changeEvent)

    rerender()

    await waitFor(() => {
      expect(result.current).toBe(false)
    })
  })

  it('should cleanup event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window.matchMedia('(max-width: 767px)'), 'removeEventListener')
    
    const { unmount } = renderHook(() => useIsMobile())
    
    unmount()
    
    expect(removeEventListenerSpy).toHaveBeenCalled()
  })
})
