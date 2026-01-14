import { describe, it, expect, beforeEach } from 'vitest'
import { getNetworkUrl, isLocalhostUrl } from './network-url'

describe('network-url utilities', () => {
  beforeEach(() => {
    // Reset location mock before each test
    delete (window as { location?: Location }).location
  })

  describe('isLocalhostUrl', () => {
    it('should return true for localhost hostname', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost' },
        writable: true,
        configurable: true,
      })
      
      expect(isLocalhostUrl()).toBe(true)
    })

    it('should return true for 127.0.0.1 hostname', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: '127.0.0.1' },
        writable: true,
        configurable: true,
      })
      
      expect(isLocalhostUrl()).toBe(true)
    })

    it('should return true for ::1 hostname', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: '::1' },
        writable: true,
        configurable: true,
      })
      
      expect(isLocalhostUrl()).toBe(true)
    })

    it('should return false for non-localhost hostname', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'example.com' },
        writable: true,
        configurable: true,
      })
      
      expect(isLocalhostUrl()).toBe(false)
    })

    it('should return false for IP address hostname', () => {
      Object.defineProperty(window, 'location', {
        value: { hostname: '192.168.1.100' },
        writable: true,
        configurable: true,
      })
      
      expect(isLocalhostUrl()).toBe(false)
    })
  })

  describe('getNetworkUrl', () => {
    it('should return current URL when not localhost', () => {
      Object.defineProperty(window, 'location', {
        value: { 
          href: 'https://example.com/app',
          hostname: 'example.com'
        },
        writable: true,
        configurable: true,
      })
      
      expect(getNetworkUrl()).toBe('https://example.com/app')
    })

    it('should return current URL when localhost', () => {
      Object.defineProperty(window, 'location', {
        value: { 
          href: 'http://localhost:5173/app',
          hostname: 'localhost'
        },
        writable: true,
        configurable: true,
      })
      
      expect(getNetworkUrl()).toBe('http://localhost:5173/app')
    })

    it('should return current URL when 127.0.0.1', () => {
      Object.defineProperty(window, 'location', {
        value: { 
          href: 'http://127.0.0.1:5173/app',
          hostname: '127.0.0.1'
        },
        writable: true,
        configurable: true,
      })
      
      expect(getNetworkUrl()).toBe('http://127.0.0.1:5173/app')
    })
  })
})
