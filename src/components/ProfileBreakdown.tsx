import { motion } from 'framer-motion'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Thermometer, 
  Scales, 
  Sliders, 
  ListNumbers,
  Timer,
  Drop,
  Gauge,
  Info
} from '@phosphor-icons/react'

interface ProfileVariable {
  name: string
  key: string
  type: string
  value: number
}

interface StageDynamics {
  points?: unknown[]
  over?: string
  interpolation?: string
}

interface StageLimit {
  type: string
  value: number | string
}

interface ExitTrigger {
  type: string
  value?: number
  comparison?: string
}

interface ProfileStage {
  name: string
  type: string
  dynamics?: StageDynamics
  // Flattened format (from history storage)
  dynamics_points?: unknown[]
  dynamics_over?: string
  dynamics_interpolation?: string
  exit_triggers?: ExitTrigger[]
  limits?: StageLimit[]
  key?: string
}

// Normalize stage dynamics - handles both nested and flattened formats
function getNormalizedDynamics(stage: ProfileStage): StageDynamics | undefined {
  // If we have nested dynamics object
  if (stage.dynamics && stage.dynamics.points) {
    return stage.dynamics
  }
  // If we have flattened format (dynamics_points, dynamics_over, etc.)
  if (stage.dynamics_points) {
    return {
      points: stage.dynamics_points,
      over: stage.dynamics_over,
      interpolation: stage.dynamics_interpolation
    }
  }
  // No dynamics found
  return undefined
}

export interface ProfileData {
  temperature?: number
  final_weight?: number
  variables?: ProfileVariable[]
  stages?: ProfileStage[]
}

interface ProfileBreakdownProps {
  profile: ProfileData | null
  className?: string
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'pressure':
      return <Gauge size={14} weight="bold" className="text-amber-400" />
    case 'flow':
      return <Drop size={14} weight="bold" className="text-blue-400" />
    case 'power':
      return <Thermometer size={14} weight="bold" className="text-red-400" />
    default:
      return <Sliders size={14} weight="bold" className="text-muted-foreground" />
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case 'pressure':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    case 'flow':
      return 'bg-blue-500/15 text-blue-400 border-blue-500/30'
    case 'power':
      return 'bg-red-500/15 text-red-400 border-red-500/30'
    default:
      return 'bg-muted text-muted-foreground border-muted'
  }
}

function getTypeUnit(type: string): string {
  switch (type) {
    case 'pressure':
      return 'bar'
    case 'flow':
      return 'ml/s'
    case 'power':
      return '%'
    default:
      return ''
  }
}

function resolveValue(value: unknown, variables?: ProfileVariable[]): number | null {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.startsWith('$') && variables) {
    const varKey = value.substring(1)
    const variable = variables.find(v => v.key === varKey)
    if (variable) return variable.value
  }
  return null
}

function analyzePattern(values: (number | null)[]): 'flat' | 'ascending' | 'descending' | 'ramp-up-hold' | 'ramp-down-hold' | 'oscillating' | 'peak' | 'valley' | 'complex' {
  const validValues = values.filter((v): v is number => v !== null)
  if (validValues.length === 0) return 'complex'
  if (validValues.length === 1) return 'flat'
  
  const first = validValues[0]
  const last = validValues[validValues.length - 1]
  const min = Math.min(...validValues)
  const max = Math.max(...validValues)
  
  // Check if all values are the same (flat)
  if (max - min < 0.1) return 'flat'
  
  // Check for simple ascending/descending
  let isAscending = true
  let isDescending = true
  for (let i = 1; i < validValues.length; i++) {
    if (validValues[i] < validValues[i - 1] - 0.1) isAscending = false
    if (validValues[i] > validValues[i - 1] + 0.1) isDescending = false
  }
  if (isAscending) return 'ascending'
  if (isDescending) return 'descending'
  
  // Check for ramp-up-hold or ramp-down-hold
  const midPoint = Math.floor(validValues.length / 2)
  const firstHalf = validValues.slice(0, midPoint)
  const secondHalf = validValues.slice(midPoint)
  
  const firstHalfAscending = firstHalf.every((v, i) => i === 0 || v >= firstHalf[i - 1] - 0.1)
  const secondHalfFlat = secondHalf.length > 1 && Math.max(...secondHalf) - Math.min(...secondHalf) < 0.5
  if (firstHalfAscending && secondHalfFlat) return 'ramp-up-hold'
  
  const firstHalfDescending = firstHalf.every((v, i) => i === 0 || v <= firstHalf[i - 1] + 0.1)
  if (firstHalfDescending && secondHalfFlat) return 'ramp-down-hold'
  
  // Check for peak (goes up then down)
  const maxIndex = validValues.indexOf(max)
  if (maxIndex > 0 && maxIndex < validValues.length - 1) {
    const beforePeak = validValues.slice(0, maxIndex + 1)
    const afterPeak = validValues.slice(maxIndex)
    const beforeAscending = beforePeak.every((v, i) => i === 0 || v >= beforePeak[i - 1] - 0.1)
    const afterDescending = afterPeak.every((v, i) => i === 0 || v <= afterPeak[i - 1] + 0.1)
    if (beforeAscending && afterDescending) return 'peak'
  }
  
  // Check for valley (goes down then up)
  const minIndex = validValues.indexOf(min)
  if (minIndex > 0 && minIndex < validValues.length - 1) {
    const beforeValley = validValues.slice(0, minIndex + 1)
    const afterValley = validValues.slice(minIndex)
    const beforeDescending = beforeValley.every((v, i) => i === 0 || v <= beforeValley[i - 1] + 0.1)
    const afterAscending = afterValley.every((v, i) => i === 0 || v >= afterValley[i - 1] - 0.1)
    if (beforeDescending && afterAscending) return 'valley'
  }
  
  // Check for oscillating (multiple direction changes)
  let directionChanges = 0
  for (let i = 2; i < validValues.length; i++) {
    const prevDir = validValues[i - 1] - validValues[i - 2]
    const currDir = validValues[i] - validValues[i - 1]
    if ((prevDir > 0.1 && currDir < -0.1) || (prevDir < -0.1 && currDir > 0.1)) {
      directionChanges++
    }
  }
  if (directionChanges >= 2) return 'oscillating'
  
  return 'complex'
}

function getPatternEmoji(pattern: string): string {
  switch (pattern) {
    case 'flat': return '➡️'
    case 'ascending': return '📈'
    case 'descending': return '📉'
    case 'ramp-up-hold': return '📈➡️'
    case 'ramp-down-hold': return '📉➡️'
    case 'peak': return '⛰️'
    case 'valley': return '🏜️'
    case 'oscillating': return '〰️'
    default: return '🔀'
  }
}

function getPatternDescription(pattern: string): string {
  switch (pattern) {
    case 'flat': return 'constant'
    case 'ascending': return 'ramping up'
    case 'descending': return 'declining'
    case 'ramp-up-hold': return 'ramp then hold'
    case 'ramp-down-hold': return 'decline then hold'
    case 'peak': return 'up then down'
    case 'valley': return 'down then up'
    case 'oscillating': return 'oscillating'
    default: return 'variable'
  }
}

interface DynamicsDescription {
  summary: string
  startValue: string | null
  endValue: string | null
  pattern: string
  duration: string | null
}

function describeDynamics(dynamics: StageDynamics | undefined, stageType: string, variables?: ProfileVariable[]): DynamicsDescription {
  const unit = getTypeUnit(stageType)
  
  if (!dynamics || !dynamics.points || dynamics.points.length === 0) {
    return {
      summary: 'Static (no dynamics defined)',
      startValue: null,
      endValue: null,
      pattern: 'flat',
      duration: null
    }
  }
  
  const points = dynamics.points as [number | string, number | string][]
  const times = points.map(p => typeof p[0] === 'number' ? p[0] : null)
  const values = points.map(p => resolveValue(p[1], variables))
  
  const validValues = values.filter((v): v is number => v !== null)
  const validTimes = times.filter((t): t is number => t !== null)
  
  const startValue = validValues.length > 0 ? validValues[0] : null
  const endValue = validValues.length > 0 ? validValues[validValues.length - 1] : null
  const minValue = validValues.length > 0 ? Math.min(...validValues) : null
  const maxValue = validValues.length > 0 ? Math.max(...validValues) : null
  
  const pattern = analyzePattern(values)
  const patternDesc = getPatternDescription(pattern)
  const patternEmoji = getPatternEmoji(pattern)
  
  // Calculate duration
  let duration: string | null = null
  if (validTimes.length >= 2 && dynamics.over === 'time') {
    const totalTime = validTimes[validTimes.length - 1] - validTimes[0]
    duration = `${totalTime.toFixed(0)}s`
  } else if (dynamics.over === 'weight' && validTimes.length >= 2) {
    const weightRange = validTimes[validTimes.length - 1] - validTimes[0]
    duration = `${weightRange.toFixed(0)}g range`
  }
  
  // Build summary
  let summary = ''
  if (startValue !== null && endValue !== null) {
    if (pattern === 'flat') {
      summary = `${patternEmoji} Holds at ${startValue.toFixed(1)} ${unit}`
    } else if (pattern === 'ascending' || pattern === 'descending') {
      summary = `${patternEmoji} ${startValue.toFixed(1)} → ${endValue.toFixed(1)} ${unit} (${patternDesc})`
    } else if (pattern === 'peak' && maxValue !== null) {
      summary = `${patternEmoji} ${startValue.toFixed(1)} → ${maxValue.toFixed(1)} → ${endValue.toFixed(1)} ${unit}`
    } else if (pattern === 'valley' && minValue !== null) {
      summary = `${patternEmoji} ${startValue.toFixed(1)} → ${minValue.toFixed(1)} → ${endValue.toFixed(1)} ${unit}`
    } else if (pattern === 'oscillating' && minValue !== null && maxValue !== null) {
      summary = `${patternEmoji} Oscillates ${minValue.toFixed(1)}-${maxValue.toFixed(1)} ${unit}`
    } else {
      summary = `${patternEmoji} ${startValue.toFixed(1)} → ${endValue.toFixed(1)} ${unit} (${patternDesc})`
    }
  } else {
    summary = `${patternEmoji} Variable ${stageType} (uses variables)`
  }
  
  // Add interpolation info
  if (dynamics.interpolation === 'curve') {
    summary += ' (smooth)'
  }
  
  return {
    summary,
    startValue: startValue !== null ? `${startValue.toFixed(1)} ${unit}` : null,
    endValue: endValue !== null ? `${endValue.toFixed(1)} ${unit}` : null,
    pattern,
    duration
  }
}

function formatExitTriggers(triggers?: ExitTrigger[]): string | null {
  if (!triggers || triggers.length === 0) return null
  
  return triggers.map(t => {
    if (t.value !== undefined) {
      const unit = t.type === 'weight' ? 'g' : t.type === 'time' ? 's' : ''
      return `${t.type} ${t.comparison || '>='} ${t.value}${unit}`
    }
    return t.type
  }).join(', ')
}

function formatLimits(limits?: StageLimit[], variables?: ProfileVariable[]): string | null {
  if (!limits || limits.length === 0) return null
  
  return limits.map(l => {
    const unit = getTypeUnit(l.type)
    // Resolve variable references
    let displayValue: string
    if (typeof l.value === 'string' && l.value.startsWith('$')) {
      const resolved = resolveValue(l.value, variables)
      displayValue = resolved !== null ? resolved.toFixed(1) : l.value
    } else {
      displayValue = typeof l.value === 'number' ? l.value.toFixed(1) : String(l.value)
    }
    return `${l.type} ≤ ${displayValue}${unit ? ` ${unit}` : ''}`
  }).join(', ')
}

export function ProfileBreakdown({ profile, className = '' }: ProfileBreakdownProps) {
  if (!profile) return null
  
  const hasBasicInfo = profile.temperature !== undefined || profile.final_weight !== undefined
  const hasVariables = profile.variables && profile.variables.length > 0
  const hasStages = profile.stages && profile.stages.length > 0
  
  if (!hasBasicInfo && !hasVariables && !hasStages) return null
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={`space-y-3 ${className}`}
    >
      <Label className="text-sm font-semibold tracking-wide text-primary">
        Profile Details
      </Label>
      
      <div className="p-4 bg-secondary/60 rounded-xl border border-primary/20 space-y-4">
        {/* Temperature and Target Weight */}
        {hasBasicInfo && (
          <div className="flex flex-wrap gap-4">
            {profile.temperature !== undefined && (
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-red-500/15">
                  <Thermometer size={16} weight="bold" className="text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Temperature</p>
                  <p className="text-sm font-semibold">{profile.temperature}°C</p>
                </div>
              </div>
            )}
            
            {profile.final_weight !== undefined && (
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-green-500/15">
                  <Scales size={16} weight="bold" className="text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Target Weight</p>
                  <p className="text-sm font-semibold">{profile.final_weight}g</p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Variables */}
        {hasVariables && (() => {
          // Separate info variables (key starts with info_) from adjustable variables
          const infoVars = profile.variables!.filter(v => v.key.startsWith('info_'))
          const adjustableVars = profile.variables!.filter(v => !v.key.startsWith('info_'))
          
          return (
            <div className="space-y-3">
              {/* Info Variables - display as tips/recommendations */}
              {infoVars.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Info size={14} weight="bold" className="text-blue-400" />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Preparation</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {infoVars.map((variable, idx) => {
                      // Format the display value based on the info type
                      let displayValue = ''
                      if (variable.key === 'info_dose') {
                        displayValue = `${variable.value}g`
                      } else if (variable.key === 'info_dilute') {
                        displayValue = `${variable.value}ml`
                      } else if (variable.key === 'info_grind') {
                        displayValue = `~${variable.value}`
                      } else if (variable.key === 'info_filter' || variable.value === 1 || variable.value === 0) {
                        displayValue = '' // Boolean-style info, name says it all
                      } else {
                        displayValue = String(variable.value)
                      }
                      
                      return (
                        <div 
                          key={idx}
                          className="px-2.5 py-1.5 rounded-lg border text-xs bg-blue-500/10 text-blue-300 border-blue-500/30"
                        >
                          <span className="font-medium">{variable.name}</span>
                          {displayValue && (
                            <span className="opacity-80 ml-1.5">{displayValue}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              
              {/* Adjustable Variables */}
              {adjustableVars.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sliders size={14} weight="bold" className="text-muted-foreground" />
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Adjustable Variables</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {adjustableVars.map((variable, idx) => (
                      <div 
                        key={idx}
                        className={`px-2.5 py-1.5 rounded-lg border text-xs ${getTypeColor(variable.type)}`}
                      >
                        <span className="font-medium">{variable.name}</span>
                        <span className="opacity-70 ml-1.5">
                          {variable.value}
                          {variable.type === 'pressure' && ' bar'}
                          {variable.type === 'flow' && ' ml/s'}
                          {variable.type === 'time' && 's'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })()}
        
        {/* Stages */}
        {hasStages && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ListNumbers size={14} weight="bold" className="text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Stages ({profile.stages!.length})
              </p>
            </div>
            <div className="space-y-2">
              {profile.stages!.map((stage, idx) => {
                const exitInfo = formatExitTriggers(stage.exit_triggers)
                const limitsInfo = formatLimits(stage.limits, profile.variables)
                // Normalize dynamics - handles both nested and flattened formats
                const normalizedDynamics = getNormalizedDynamics(stage)
                const dynamicsDesc = describeDynamics(normalizedDynamics, stage.type, profile.variables)
                
                return (
                  <div 
                    key={idx}
                    className="p-2.5 rounded-lg bg-background/50 border border-border/30 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {getTypeIcon(stage.type)}
                        <span className="text-sm font-medium truncate">{stage.name}</span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] px-1.5 py-0 shrink-0 ${getTypeColor(stage.type)}`}
                      >
                        {stage.type}
                      </Badge>
                    </div>
                    
                    {/* Dynamics Summary - the main info about what this stage does */}
                    <p className="text-xs text-foreground/90">
                      {dynamicsDesc.summary}
                    </p>
                    
                    {/* Additional details */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                      {dynamicsDesc.duration && (
                        <span className="flex items-center gap-1">
                          <Timer size={11} />
                          {dynamicsDesc.duration}
                        </span>
                      )}
                      {limitsInfo && (
                        <span className="text-amber-400/80">
                          Max: {limitsInfo}
                        </span>
                      )}
                      {exitInfo && (
                        <span className="text-green-400/80">
                          Exit: {exitInfo}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
