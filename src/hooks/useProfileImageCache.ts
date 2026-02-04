import { useState, useEffect, useCallback, useRef } from 'react'
import { getServerUrl } from '@/lib/config'

interface CacheEntry {
  url: string
  timestamp: number
}

interface ImageCache {
  [profileName: string]: CacheEntry
}

const CACHE_KEY = 'meticai-profile-images-cache'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Hook to manage profile image caching with localStorage persistence
 */
export function useProfileImageCache() {
  const [cache, setCache] = useState<ImageCache>({})
  const [isLoading, setIsLoading] = useState(false)
  const loadedRef = useRef(false)

  // Load cache from localStorage on mount
  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    
    try {
      const stored = localStorage.getItem(CACHE_KEY)
      if (stored) {
        const parsed: ImageCache = JSON.parse(stored)
        // Filter out expired entries
        const now = Date.now()
        const validEntries: ImageCache = {}
        for (const [key, entry] of Object.entries(parsed)) {
          if (now - entry.timestamp < CACHE_TTL_MS) {
            validEntries[key] = entry
          }
        }
        setCache(validEntries)
        // Save cleaned cache back
        if (Object.keys(validEntries).length !== Object.keys(parsed).length) {
          localStorage.setItem(CACHE_KEY, JSON.stringify(validEntries))
        }
      }
    } catch (err) {
      console.error('Failed to load image cache:', err)
    }
  }, [])

  // Save cache to localStorage when it changes
  const saveCache = useCallback((newCache: ImageCache) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(newCache))
    } catch (err) {
      console.error('Failed to save image cache:', err)
    }
  }, [])

  // Get image URL for a profile (returns cached or null)
  const getImageUrl = useCallback((profileName: string): string | null => {
    const entry = cache[profileName]
    if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
      return entry.url
    }
    return null
  }, [cache])

  // Set image URL for a profile
  const setImageUrl = useCallback((profileName: string, url: string) => {
    setCache(prev => {
      const newCache = {
        ...prev,
        [profileName]: { url, timestamp: Date.now() }
      }
      saveCache(newCache)
      return newCache
    })
  }, [saveCache])

  // Invalidate cache for a specific profile
  const invalidate = useCallback((profileName: string) => {
    setCache(prev => {
      const newCache = { ...prev }
      delete newCache[profileName]
      saveCache(newCache)
      return newCache
    })
  }, [saveCache])

  // Clear entire cache
  const clearCache = useCallback(() => {
    setCache({})
    try {
      localStorage.removeItem(CACHE_KEY)
    } catch (err) {
      console.error('Failed to clear image cache:', err)
    }
  }, [])

  // Fetch images for multiple profiles, using cache where available
  const fetchImagesForProfiles = useCallback(async (profileNames: string[]): Promise<Record<string, string>> => {
    const serverUrl = await getServerUrl()
    const results: Record<string, string> = {}
    const toFetch: string[] = []

    // Check cache first
    for (const name of profileNames) {
      const cached = getImageUrl(name)
      if (cached) {
        results[name] = cached
      } else {
        toFetch.push(name)
      }
    }

    if (toFetch.length === 0) {
      return results
    }

    setIsLoading(true)

    // Fetch uncached images in batches
    const batchSize = 10
    for (let i = 0; i < toFetch.length; i += batchSize) {
      const batch = toFetch.slice(i, i + batchSize)
      const fetchPromises = batch.map(async (profileName) => {
        try {
          const response = await fetch(
            `${serverUrl}/api/profile/${encodeURIComponent(profileName)}`
          )
          if (response.ok) {
            const data = await response.json()
            if (data.profile?.image) {
              const imageUrl = `${serverUrl}/api/profile/${encodeURIComponent(profileName)}/image-proxy`
              results[profileName] = imageUrl
              setImageUrl(profileName, imageUrl)
            }
          }
        } catch {
          // Silently ignore errors for individual profile fetches
        }
      })

      await Promise.allSettled(fetchPromises)
    }

    setIsLoading(false)
    return results
  }, [getImageUrl, setImageUrl])

  return {
    cache,
    isLoading,
    getImageUrl,
    setImageUrl,
    invalidate,
    clearCache,
    fetchImagesForProfiles
  }
}
