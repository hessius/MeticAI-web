import { useState, useEffect, useCallback } from 'react'
import { getServerUrl } from '@/lib/config'

interface UpdateStatus {
  update_available: boolean
  last_check?: string
  repositories?: Record<string, unknown>
}

interface UseUpdateStatusReturn {
  updateAvailable: boolean
  isChecking: boolean
  error: string | null
  checkForUpdates: () => Promise<void>
  lastChecked: string | null
}

// Check for updates every 5 minutes
const CHECK_INTERVAL_MINUTES = 5
const CHECK_INTERVAL = CHECK_INTERVAL_MINUTES * 60 * 1000

export function useUpdateStatus(): UseUpdateStatusReturn {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastChecked, setLastChecked] = useState<string | null>(null)

  const checkForUpdates = useCallback(async () => {
    setIsChecking(true)
    setError(null)

    try {
      const serverUrl = await getServerUrl()
      const response = await fetch(`${serverUrl}/status`)

      if (!response.ok) {
        throw new Error(`Failed to check for updates: ${response.status}`)
      }

      const data: UpdateStatus = await response.json()
      setUpdateAvailable(data.update_available || false)
      setLastChecked(data.last_check || new Date().toISOString())
    } catch (err) {
      console.error('Error checking for updates:', err)
      setError(err instanceof Error ? err.message : 'Failed to check for updates')
      setUpdateAvailable(false)
    } finally {
      setIsChecking(false)
    }
  }, [])

  // Check for updates on mount and periodically
  useEffect(() => {
    checkForUpdates()

    const interval = setInterval(checkForUpdates, CHECK_INTERVAL)
    return () => clearInterval(interval)
  }, [checkForUpdates])

  return {
    updateAvailable,
    isChecking,
    error,
    checkForUpdates,
    lastChecked,
  }
}
