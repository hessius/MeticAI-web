import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useIsDesktop } from './use-desktop'

describe('useIsDesktop', () => {
  beforeEach(() => {
    // Reset window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
  })

  it('should return true for desktop width (>= 768px)', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })

    const { result } = renderHook(() => useIsDesktop())
    
    await waitFor(() => {
      expect(result.current).toBe(true)
    })
  })

  it('should return false for mobile width (< 768px)', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })

    const { result } = renderHook(() => useIsDesktop())
    
    await waitFor(() => {
      expect(result.current).toBe(false)
    })
  })

  it('should return true for exactly 768px width', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    })

    const { result } = renderHook(() => useIsDesktop())
    
    await waitFor(() => {
      expect(result.current).toBe(true)
    })
  })

  it('should return false for exactly 767px width', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 767,
    })

    const { result } = renderHook(() => useIsDesktop())
    
    await waitFor(() => {
      expect(result.current).toBe(false)
    })
  })
})
