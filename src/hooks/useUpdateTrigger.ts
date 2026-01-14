import { useState, useCallback } from 'react'
import { getServerUrl } from '@/lib/config'

interface TriggerUpdateResponse {
  status: 'success' | 'error'
  output?: string
  message?: string
  error?: string
}

interface UseUpdateTriggerReturn {
  triggerUpdate: () => Promise<void>
  isUpdating: boolean
  updateError: string | null
  updateSuccess: boolean
}

// Poll server health every 3 seconds after triggering update
const HEALTH_CHECK_INTERVAL = 3000
// Maximum number of health checks (60 checks * 3 seconds = 3 minutes max wait)
const MAX_HEALTH_CHECKS = 60
// Wait 2 seconds before starting health checks to allow server to begin shutdown
const INITIAL_SHUTDOWN_WAIT = 2000
// Wait 1 second after server is back up to ensure it's stable
const SERVER_STABILIZATION_WAIT = 1000

export function useUpdateTrigger(): UseUpdateTriggerReturn {
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [updateSuccess, setUpdateSuccess] = useState(false)

  const checkServerHealth = useCallback(async (serverUrl: string): Promise<boolean> => {
    try {
      const response = await fetch(`${serverUrl}/status`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000), // 2 second timeout
      })
      return response.ok
    } catch {
      return false
    }
  }, [])

  const waitForServerRestart = useCallback(async (serverUrl: string) => {
    let checks = 0
    
    // Wait for server to go down first (optional, server might restart quickly)
    await new Promise(resolve => setTimeout(resolve, INITIAL_SHUTDOWN_WAIT))

    // Poll until server is back up
    while (checks < MAX_HEALTH_CHECKS) {
      const isHealthy = await checkServerHealth(serverUrl)
      
      if (isHealthy) {
        // Server is back up, wait a bit more to ensure it's stable
        await new Promise(resolve => setTimeout(resolve, SERVER_STABILIZATION_WAIT))
        return true
      }

      checks++
      await new Promise(resolve => setTimeout(resolve, HEALTH_CHECK_INTERVAL))
    }

    return false
  }, [checkServerHealth])

  const triggerUpdate = useCallback(async () => {
    setIsUpdating(true)
    setUpdateError(null)
    setUpdateSuccess(false)

    try {
      const serverUrl = await getServerUrl()
      
      // Trigger the update
      const response = await fetch(`${serverUrl}/api/trigger-update`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(
          errorData?.detail?.message || 
          errorData?.message || 
          `Update failed with status ${response.status}`
        )
      }

      const data: TriggerUpdateResponse = await response.json()

      if (data.status === 'error') {
        throw new Error(data.error || data.message || 'Update failed')
      }

      // Wait for server to restart
      const serverRestarted = await waitForServerRestart(serverUrl)

      if (!serverRestarted) {
        throw new Error('Server did not restart within expected time. Please refresh manually.')
      }

      setUpdateSuccess(true)
      
      // Reload the page to get the new version
      window.location.reload()
    } catch (err) {
      console.error('Error triggering update:', err)
      setUpdateError(err instanceof Error ? err.message : 'Failed to trigger update')
      setIsUpdating(false)
    }
  }, [waitForServerRestart])

  return {
    triggerUpdate,
    isUpdating,
    updateError,
    updateSuccess,
  }
}
