import { useState, useCallback } from 'react'
import { getServerUrl } from '@/lib/config'

export interface ShotInfo {
  date: string
  filename: string
  timestamp: string | null
  profile_name: string
  final_weight: number | null
  total_time: number | null
  data?: ShotData
}

export interface ShotData {
  profile: {
    name: string
    author?: string
    temperature?: number
    final_weight?: number
    stages?: Array<{
      name: string
      type: string
      key?: string
    }>
  }
  start_time?: string
  elapsed_time?: number
  final_weight?: number
  data?: {
    time: number[]
    pressure: number[]
    flow: number[]
    weight: number[]
    temperature?: number[]
  }
  // The shot log can have varying structures, this is a common format
  [key: string]: unknown
}

export interface ProfileShotsResponse {
  profile_name: string
  shots: ShotInfo[]
  count: number
  limit: number
}

export interface ShotDataResponse {
  date: string
  filename: string
  data: ShotData
}

export function useShotHistory() {
  const [shots, setShots] = useState<ShotInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchShotsByProfile = useCallback(async (
    profileName: string, 
    options?: { limit?: number; includeData?: boolean }
  ): Promise<ProfileShotsResponse> => {
    setIsLoading(true)
    setError(null)

    try {
      const serverUrl = await getServerUrl()
      const params = new URLSearchParams()
      if (options?.limit) params.set('limit', options.limit.toString())
      if (options?.includeData) params.set('include_data', 'true')
      
      const url = `${serverUrl}/api/shots/by-profile/${encodeURIComponent(profileName)}?${params}`
      const response = await fetch(url)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail?.message || `Failed to fetch shots: ${response.status}`)
      }

      const data: ProfileShotsResponse = await response.json()
      setShots(data.shots)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch shot history'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchShotData = useCallback(async (
    date: string, 
    filename: string
  ): Promise<ShotData> => {
    setIsLoading(true)
    setError(null)

    try {
      const serverUrl = await getServerUrl()
      const url = `${serverUrl}/api/shots/data/${date}/${encodeURIComponent(filename)}`
      const response = await fetch(url)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail?.message || `Failed to fetch shot data: ${response.status}`)
      }

      const result: ShotDataResponse = await response.json()
      return result.data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch shot data'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchAvailableDates = useCallback(async (): Promise<string[]> => {
    try {
      const serverUrl = await getServerUrl()
      const response = await fetch(`${serverUrl}/api/shots/dates`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dates: ${response.status}`)
      }

      const data = await response.json()
      return data.dates || []
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch dates'
      setError(message)
      throw err
    }
  }, [])

  return {
    shots,
    isLoading,
    error,
    fetchShotsByProfile,
    fetchShotData,
    fetchAvailableDates
  }
}
