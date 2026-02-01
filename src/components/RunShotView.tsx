import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { 
  CaretLeft, 
  Play, 
  Clock, 
  Fire,
  Coffee,
  CalendarBlank,
  X,
  SpinnerGap,
  CheckCircle,
  Warning
} from '@phosphor-icons/react'
import { getServerUrl } from '@/lib/config'
import { format, addMinutes } from 'date-fns'

interface MachineProfile {
  id: string
  name: string
  author?: string
  temperature?: number
  final_weight?: number
}

interface ScheduledShot {
  id: string
  profile_id: string | null
  scheduled_time: string
  preheat: boolean
  status: string
  created_at: string
  error?: string
}

interface RunShotViewProps {
  onBack: () => void
  initialProfileId?: string
  initialProfileName?: string
}

const PREHEAT_DURATION_MINUTES = 10

export function RunShotView({ onBack, initialProfileId, initialProfileName }: RunShotViewProps) {
  const [selectedProfile, setSelectedProfile] = useState<MachineProfile | null>(
    initialProfileId && initialProfileName 
      ? { id: initialProfileId, name: initialProfileName } 
      : null
  )
  const [profiles, setProfiles] = useState<MachineProfile[]>([])
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true)
  const [showProfileSelector, setShowProfileSelector] = useState(false)
  
  const [preheat, setPreheat] = useState(false)
  const [scheduleMode, setScheduleMode] = useState(false)
  const [scheduledTime, setScheduledTime] = useState<Date>(addMinutes(new Date(), 30))
  
  const [isRunning, setIsRunning] = useState(false)
  const [isPreheating, setIsPreheating] = useState(false)
  
  const [scheduledShots, setScheduledShots] = useState<ScheduledShot[]>([])
  const [machineStatus, setMachineStatus] = useState<string>('unknown')

  // Calculate minimum scheduled time based on preheat setting
  const minScheduledTime = useMemo(() => {
    return preheat ? addMinutes(new Date(), PREHEAT_DURATION_MINUTES) : new Date()
  }, [preheat])

  // Fetch profiles from machine
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const serverUrl = await getServerUrl()
        const response = await fetch(`${serverUrl}/api/machine/profiles`)
        if (response.ok) {
          const data = await response.json()
          setProfiles(data.profiles || [])
        }
      } catch (err) {
        console.error('Failed to fetch profiles:', err)
        toast.error('Failed to load profiles from machine')
      } finally {
        setIsLoadingProfiles(false)
      }
    }
    fetchProfiles()
  }, [])

  // Fetch machine status and scheduled shots
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const serverUrl = await getServerUrl()
        const response = await fetch(`${serverUrl}/api/machine/status`)
        if (response.ok) {
          const data = await response.json()
          setMachineStatus(data.machine_status?.state || 'unknown')
          setScheduledShots(data.scheduled_shots || [])
        }
      } catch (err) {
        console.error('Failed to fetch machine status:', err)
      }
    }
    fetchStatus()
    
    // Poll for updates
    const interval = setInterval(fetchStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleRunNow = async () => {
    if (!selectedProfile && !preheat) {
      toast.error('Please select a profile or enable preheat')
      return
    }

    setIsRunning(true)
    
    try {
      const serverUrl = await getServerUrl()
      
      if (preheat) {
        // Start preheat
        setIsPreheating(true)
        const preheatResponse = await fetch(`${serverUrl}/api/machine/preheat`, {
          method: 'POST'
        })
        
        if (!preheatResponse.ok) {
          const error = await preheatResponse.json()
          throw new Error(error.detail || 'Failed to start preheat')
        }
        
        toast.success(`Preheating started! Ready in ${PREHEAT_DURATION_MINUTES} minutes`)
        
        if (selectedProfile) {
          // Schedule the profile to run after preheat
          const shotTime = addMinutes(new Date(), PREHEAT_DURATION_MINUTES)
          const scheduleResponse = await fetch(`${serverUrl}/api/machine/schedule-shot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              profile_id: selectedProfile.id,
              scheduled_time: shotTime.toISOString(),
              preheat: false // Already preheating
            })
          })

          if (!scheduleResponse.ok) {
            let errorMessage = 'Failed to schedule profile after preheat'
            try {
              const error = await scheduleResponse.json()
              errorMessage = error?.detail || errorMessage
            } catch {
              // Ignore JSON parse errors and fall back to default message
            }
            throw new Error(errorMessage)
          }

          toast.success(`Profile "${selectedProfile.name}" will run in ${PREHEAT_DURATION_MINUTES} minutes`)
        }
      } else if (selectedProfile) {
        // Run profile immediately
        const response = await fetch(`${serverUrl}/api/machine/run-profile/${selectedProfile.id}`, {
          method: 'POST'
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.detail || 'Failed to run profile')
        }
        
        toast.success(`Started "${selectedProfile.name}"!`)
      }
    } catch (err) {
      console.error('Failed to run shot:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to run shot')
    } finally {
      setIsRunning(false)
    }
  }

  const handleSchedule = async () => {
    if (!selectedProfile && !preheat) {
      toast.error('Please select a profile or enable preheat')
      return
    }

    // Validate minimum scheduled time when preheat is enabled
    // Recalculate at validation time to ensure accuracy
    if (preheat) {
      const currentMinScheduledTime = addMinutes(new Date(), PREHEAT_DURATION_MINUTES)
      if (scheduledTime < currentMinScheduledTime) {
        toast.error(`Scheduled time must be at least ${PREHEAT_DURATION_MINUTES} minutes from now when preheat is enabled`)
        return
      }
    }

    setIsRunning(true)
    
    try {
      const serverUrl = await getServerUrl()
      
      const response = await fetch(`${serverUrl}/api/machine/schedule-shot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: selectedProfile?.id || null,
          scheduled_time: scheduledTime.toISOString(),
          preheat
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to schedule shot')
      }
      
      const data = await response.json()
      setScheduledShots(prev => [...prev, data.scheduled_shot])
      
      const preheatInfo = preheat ? ` (preheat starts ${PREHEAT_DURATION_MINUTES} min before)` : ''
      toast.success(`Shot scheduled for ${format(scheduledTime, 'HH:mm')}${preheatInfo}`)
      setScheduleMode(false)
    } catch (err) {
      console.error('Failed to schedule shot:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to schedule shot')
    } finally {
      setIsRunning(false)
    }
  }

  const handleCancelScheduled = async (scheduleId: string) => {
    try {
      const serverUrl = await getServerUrl()
      const response = await fetch(`${serverUrl}/api/machine/schedule-shot/${scheduleId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setScheduledShots(prev => prev.filter(s => s.id !== scheduleId))
        toast.success('Scheduled shot cancelled')
      }
    } catch (err) {
      console.error('Failed to cancel scheduled shot:', err)
      toast.error('Failed to cancel scheduled shot')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock size={16} className="text-blue-500" />
      case 'preheating':
        return <Fire size={16} className="text-orange-500" />
      case 'running':
        return <SpinnerGap size={16} className="text-primary animate-spin" />
      case 'completed':
        return <CheckCircle size={16} className="text-green-500" />
      case 'failed':
      case 'cancelled':
        return <Warning size={16} className="text-red-500" />
      default:
        return null
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="shrink-0"
          title="Back"
        >
          <CaretLeft size={22} weight="bold" />
        </Button>
        <h2 className="text-xl font-bold">Run Shot</h2>
      </div>

      {/* Profile Selection */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Profile</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowProfileSelector(!showProfileSelector)}
          >
            {selectedProfile ? 'Change' : 'Select Profile'}
          </Button>
        </div>
        
        {selectedProfile ? (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Coffee size={24} className="text-primary" weight="duotone" />
            <div>
              <p className="font-medium">{selectedProfile.name}</p>
              {selectedProfile.temperature != null && selectedProfile.final_weight != null && (
                <p className="text-sm text-muted-foreground">
                  {selectedProfile.temperature}°C • {selectedProfile.final_weight}g
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No profile selected. Select a profile or use preheat only.
          </p>
        )}

        {/* Profile Selector */}
        <AnimatePresence>
          {showProfileSelector && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="max-h-48 overflow-y-auto space-y-1 pt-2 border-t">
                {isLoadingProfiles ? (
                  <div className="flex items-center justify-center py-4">
                    <SpinnerGap size={24} className="animate-spin text-muted-foreground" />
                  </div>
                ) : profiles.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No profiles found on machine
                  </p>
                ) : (
                  profiles.map(profile => (
                    <button
                      key={profile.id}
                      onClick={() => {
                        setSelectedProfile(profile)
                        setShowProfileSelector(false)
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedProfile?.id === profile.id
                          ? 'bg-primary/10 border border-primary/30'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <p className="font-medium">{profile.name}</p>
                      {profile.author && (
                        <p className="text-xs text-muted-foreground">by {profile.author}</p>
                      )}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Options */}
      <Card className="p-6 space-y-4">
        <h3 className="text-base font-medium">Options</h3>
        
        {/* Preheat Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="preheat" className="text-sm font-medium flex items-center gap-2">
              <Fire size={18} className={preheat ? 'text-orange-500' : 'text-muted-foreground'} />
              Preheat
            </Label>
            <p className="text-xs text-muted-foreground">
              Heat the machine for {PREHEAT_DURATION_MINUTES} minutes before extraction
            </p>
          </div>
          <Switch
            id="preheat"
            checked={preheat}
            onCheckedChange={setPreheat}
          />
        </div>

        {/* Schedule Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="schedule" className="text-sm font-medium flex items-center gap-2">
              <CalendarBlank size={18} className={scheduleMode ? 'text-primary' : 'text-muted-foreground'} />
              Schedule
            </Label>
            <p className="text-xs text-muted-foreground">
              Run later at a specific time
            </p>
          </div>
          <Switch
            id="schedule"
            checked={scheduleMode}
            onCheckedChange={setScheduleMode}
          />
        </div>

        {/* Time Picker (when scheduling) */}
        <AnimatePresence>
          {scheduleMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 border-t space-y-2">
                <Label className="text-sm">Scheduled Time</Label>
                <input
                  type="datetime-local"
                  value={format(scheduledTime, "yyyy-MM-dd'T'HH:mm")}
                  onChange={(e) => {
                    const next = new Date(e.target.value)
                    if (!isNaN(next.getTime())) {
                      setScheduledTime(next)
                    }
                  }}
                  min={format(minScheduledTime, "yyyy-MM-dd'T'HH:mm")}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                />
                {preheat && (
                  <p className="text-xs text-muted-foreground">
                    Preheat will start at {format(addMinutes(scheduledTime, -PREHEAT_DURATION_MINUTES), 'HH:mm')}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Scheduled Shots */}
      {scheduledShots.filter(s => s.status !== 'completed' && s.status !== 'cancelled').length > 0 && (
        <Card className="p-6 space-y-4">
          <h3 className="text-base font-medium">Scheduled Shots</h3>
          <div className="space-y-2">
            {scheduledShots
              .filter(s => s.status !== 'completed' && s.status !== 'cancelled')
              .map(shot => (
                <div key={shot.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(shot.status)}
                    <div>
                      <p className="text-sm font-medium">
                        {format(new Date(shot.scheduled_time), 'HH:mm')}
                        {shot.preheat && <span className="text-orange-500 ml-1">(with preheat)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">{shot.status}</p>
                    </div>
                  </div>
                  {shot.status === 'scheduled' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCancelScheduled(shot.id)}
                    >
                      <X size={16} />
                    </Button>
                  )}
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Action Button */}
      <Button
        size="lg"
        className="w-full"
        onClick={scheduleMode ? handleSchedule : handleRunNow}
        disabled={isRunning || (!selectedProfile && !preheat)}
      >
        {isRunning ? (
          <SpinnerGap size={20} className="animate-spin mr-2" />
        ) : scheduleMode ? (
          <Clock size={20} className="mr-2" />
        ) : (
          <Play size={20} className="mr-2" weight="fill" />
        )}
        {isRunning 
          ? 'Starting...' 
          : scheduleMode 
            ? 'Schedule Shot'
            : preheat && selectedProfile 
              ? 'Preheat & Run' 
              : preheat 
                ? 'Start Preheat' 
                : 'Run Now'}
      </Button>

      {/* Help Text */}
      <p className="text-xs text-muted-foreground text-center">
        {!selectedProfile && preheat && 'Preheat only - no profile will be run'}
        {selectedProfile && !preheat && !scheduleMode && 'Profile will start immediately'}
        {selectedProfile && preheat && !scheduleMode && `Preheat will start now, profile runs in ${PREHEAT_DURATION_MINUTES} min`}
        {scheduleMode && preheat && `Preheat starts ${PREHEAT_DURATION_MINUTES} min before scheduled time`}
      </p>
    </motion.div>
  )
}
