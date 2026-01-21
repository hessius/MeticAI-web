import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  CaretLeft,
  Warning,
  ChartLine,
  Clock,
  Drop,
  Thermometer,
  Gauge,
  ArrowsCounterClockwise
} from '@phosphor-icons/react'
import { useShotHistory, ShotInfo, ShotData } from '@/hooks/useShotHistory'
import { formatDistanceToNow, format } from 'date-fns'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea
} from 'recharts'

// Chart colors matching Meticulous app style (muted to fit dark theme)
const CHART_COLORS = {
  pressure: '#4ade80',      // Green (muted)
  flow: '#67e8f9',          // Light cyan/blue (muted)
  weight: '#fbbf24',        // Amber/Yellow (muted)
  gravimetricFlow: '#c2855a' // Brown-orange (muted to fit dark theme)
}

// Stage colors for background areas (matching tag colors)
const STAGE_COLORS = [
  'rgba(239, 68, 68, 0.15)',   // Red
  'rgba(249, 115, 22, 0.15)',  // Orange  
  'rgba(234, 179, 8, 0.15)',   // Yellow
  'rgba(34, 197, 94, 0.15)',   // Green
  'rgba(59, 130, 246, 0.15)',  // Blue
  'rgba(168, 85, 247, 0.15)',  // Purple
  'rgba(236, 72, 153, 0.15)',  // Pink
  'rgba(20, 184, 166, 0.15)',  // Teal
]

const STAGE_BORDER_COLORS = [
  'rgba(239, 68, 68, 0.4)',
  'rgba(249, 115, 22, 0.4)',
  'rgba(234, 179, 8, 0.4)',
  'rgba(34, 197, 94, 0.4)',
  'rgba(59, 130, 246, 0.4)',
  'rgba(168, 85, 247, 0.4)',
  'rgba(236, 72, 153, 0.4)',
  'rgba(20, 184, 166, 0.4)',
]

interface ShotHistoryViewProps {
  profileName: string
  onBack: () => void
}

interface ChartDataPoint {
  time: number
  pressure?: number
  flow?: number
  weight?: number
  gravimetricFlow?: number
  stage?: string
}

interface StageRange {
  name: string
  startTime: number
  endTime: number
  colorIndex: number
}

// Custom tooltip for the chart
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string; dataKey: string }>; label?: number }) {
  if (!active || !payload || !payload.length) return null
  
  // Find stage from the first payload item if available
  const stageData = payload[0]?.payload as ChartDataPoint | undefined
  
  return (
    <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
      <p className="text-xs font-medium text-muted-foreground mb-1.5">
        Time: {label?.toFixed(1)}s
      </p>
      {stageData?.stage && (
        <p className="text-xs font-medium text-primary mb-1.5">
          Stage: {stageData.stage}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((item, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: item.color }}
            />
            <span className="capitalize">{item.name}:</span>
            <span className="font-medium">{item.value?.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Shot-related quotes for the loader
const SHOT_QUOTES = [
  { quote: "You Miss 100% of the Shots You Don't Take", author: "Wayne Gretzky", meta: "— Michael Scott" },
  { quote: "I'm not throwing away my shot", author: "Lin-Manuel Miranda" },
  { quote: "Take your best shot", author: "Common saying" },
  { quote: "Give it your best shot", author: "English proverb" },
  { quote: "One shot, one opportunity", author: "Eminem" },
  { quote: "A shot in the dark", author: "Ozzy Osbourne" },
  { quote: "Shoot for the moon", author: "Les Brown" },
]

// Progress loader component with fake progress
function SearchingLoader({ estimatedSeconds = 60 }: { estimatedSeconds?: number }) {
  const [progress, setProgress] = useState(0)
  const [showQuote, setShowQuote] = useState(false)
  const [currentQuote] = useState(() => SHOT_QUOTES[Math.floor(Math.random() * SHOT_QUOTES.length)])
  const startTimeRef = useRef(Date.now())
  
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      // Use an easing function that slows down as it approaches 95%
      // Never reaches 100% until actually complete
      const newProgress = Math.min(95, (1 - Math.exp(-elapsed / (estimatedSeconds / 3))) * 100)
      setProgress(newProgress)
    }, 100)
    
    return () => clearInterval(interval)
  }, [estimatedSeconds])

  // Show quote after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowQuote(true), 3000)
    return () => clearTimeout(timer)
  }, [])
  
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <div className="w-full max-w-xs space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Searching machine history...</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>
      <AnimatePresence mode="wait">
        {!showQuote ? (
          <motion.p
            key="scanning"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-xs text-muted-foreground/60 text-center max-w-[200px]"
          >
            Scanning shot logs from your Meticulous machine
          </motion.p>
        ) : (
          <motion.div
            key="quote"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-[280px] space-y-1"
          >
            <p className="text-xs text-muted-foreground/80 italic">
              "{currentQuote.quote}"
            </p>
            <p className="text-[10px] text-muted-foreground/50">
              — {currentQuote.author}{currentQuote.meta ? ` ${currentQuote.meta}` : ''}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function ShotHistoryView({ profileName, onBack }: ShotHistoryViewProps) {
  const { shots, isLoading, error, fetchShotsByProfile, fetchShotData } = useShotHistory()
  const [selectedShot, setSelectedShot] = useState<ShotInfo | null>(null)
  const [shotData, setShotData] = useState<ShotData | null>(null)
  const [loadingData, setLoadingData] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)

  useEffect(() => {
    fetchShotsByProfile(profileName, { limit: 20, includeData: false })
      .catch(err => console.error('Failed to fetch shots:', err))
  }, [profileName, fetchShotsByProfile])

  const handleSelectShot = async (shot: ShotInfo) => {
    setSelectedShot(shot)
    setLoadingData(true)
    setDataError(null)
    setShotData(null)

    try {
      const data = await fetchShotData(shot.date, shot.filename)
      setShotData(data)
    } catch (err) {
      setDataError(err instanceof Error ? err.message : 'Failed to load shot data')
    } finally {
      setLoadingData(false)
    }
  }

  const handleBack = () => {
    if (selectedShot) {
      setSelectedShot(null)
      setShotData(null)
      setDataError(null)
    } else {
      onBack()
    }
  }

  const handleRefresh = () => {
    fetchShotsByProfile(profileName, { limit: 20, includeData: false })
      .catch(err => console.error('Failed to refresh shots:', err))
  }

  // Transform shot data into chart-compatible format
  const getChartData = (data: ShotData): ChartDataPoint[] => {
    // Meticulous shot data structure: array of entries with nested 'shot' object
    // Each entry has: { shot: { pressure, flow, weight, gravimetric_flow, ... }, time: milliseconds, status: stageName, sensors: {...} }
    const dataEntries = data.data as Array<{
      shot?: { pressure?: number; flow?: number; weight?: number; gravimetric_flow?: number };
      time?: number;
      profile_time?: number;
      status?: string;
    }> || []
    
    if (Array.isArray(dataEntries) && dataEntries.length > 0 && dataEntries[0]?.shot) {
      // Meticulous format with nested shot object
      return dataEntries.map(entry => ({
        time: (entry.time || entry.profile_time || 0) / 1000, // Convert ms to seconds
        pressure: entry.shot?.pressure,
        flow: entry.shot?.flow,
        weight: entry.shot?.weight,
        gravimetricFlow: entry.shot?.gravimetric_flow,
        stage: entry.status
      }))
    }
    
    // Fallback: try other formats
    const telemetry = data.data || data
    
    // Check if we have arrays of data (alternate format)
    const timeArray = (telemetry as Record<string, unknown>).time as number[] || []
    const pressureArray = (telemetry as Record<string, unknown>).pressure as number[] || []
    const flowArray = (telemetry as Record<string, unknown>).flow as number[] || []
    const weightArray = (telemetry as Record<string, unknown>).weight as number[] || []
    
    if (Array.isArray(timeArray) && timeArray.length > 0) {
      // Standard array format
      const chartData: ChartDataPoint[] = []
      for (let i = 0; i < timeArray.length; i++) {
        chartData.push({
          time: timeArray[i],
          pressure: pressureArray[i],
          flow: flowArray[i],
          weight: weightArray[i]
        })
      }
      return chartData
    }
    
    // Try log entries format
    const logEntries = (data as Record<string, unknown>).log as Array<Record<string, number>> || []
    if (logEntries.length > 0) {
      return logEntries.map(entry => ({
        time: entry.time || entry.t || 0,
        pressure: entry.pressure || entry.p,
        flow: entry.flow || entry.f,
        weight: entry.weight || entry.w
      }))
    }
    
    return []
  }

  // Extract stage ranges for background coloring
  const getStageRanges = (chartData: ChartDataPoint[]): StageRange[] => {
    const ranges: StageRange[] = []
    let currentStage: string | null = null
    let stageStart = 0
    let colorIndex = 0
    const stageColorMap = new Map<string, number>()
    
    chartData.forEach((point, index) => {
      if (point.stage && point.stage !== currentStage) {
        // End previous stage
        if (currentStage !== null) {
          ranges.push({
            name: currentStage,
            startTime: stageStart,
            endTime: point.time,
            colorIndex: stageColorMap.get(currentStage) || 0
          })
        }
        
        // Start new stage
        currentStage = point.stage
        stageStart = point.time
        
        if (!stageColorMap.has(currentStage)) {
          stageColorMap.set(currentStage, colorIndex % STAGE_COLORS.length)
          colorIndex++
        }
      }
      
      // Handle last point
      if (index === chartData.length - 1 && currentStage) {
        ranges.push({
          name: currentStage,
          startTime: stageStart,
          endTime: point.time,
          colorIndex: stageColorMap.get(currentStage) || 0
        })
      }
    })
    
    return ranges
  }

  const formatShotTime = (shot: ShotInfo) => {
    try {
      if (shot.timestamp) {
        // Unix timestamp in seconds
        const date = new Date(shot.timestamp * 1000)
        return format(date, 'MMM d, HH:mm')
      }
      // Extract time from filename (format: HH:MM:SS.shot.json.zst or HH:MM:SS.shot.json)
      const timeMatch = shot.filename.match(/^(\d{2}):(\d{2}):(\d{2})/)
      if (timeMatch) {
        return `${shot.date} ${timeMatch[0]}`
      }
      return shot.date
    } catch {
      return shot.date
    }
  }

  if (selectedShot) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="shrink-0"
            >
              <CaretLeft size={22} weight="bold" />
            </Button>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-foreground truncate">
                Shot Details
              </h2>
              <p className="text-xs text-muted-foreground/70">
                {formatShotTime(selectedShot)}
              </p>
            </div>
          </div>

          {loadingData ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <p className="text-sm text-muted-foreground">Loading shot data...</p>
              </div>
            </div>
          ) : dataError ? (
            <Alert variant="destructive" className="border-destructive/30 bg-destructive/8 rounded-xl">
              <Warning size={18} weight="fill" />
              <AlertDescription className="text-sm">{dataError}</AlertDescription>
            </Alert>
          ) : shotData ? (
            <div className="space-y-4">
              {/* Shot Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                {selectedShot.total_time && (
                  <div className="p-3 bg-secondary/40 rounded-xl border border-border/20">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Clock size={14} weight="bold" />
                      <span className="text-xs font-medium">Duration</span>
                    </div>
                    <p className="text-lg font-bold">
                      {selectedShot.total_time.toFixed(1)}s
                    </p>
                  </div>
                )}
                {selectedShot.final_weight && (
                  <div className="p-3 bg-secondary/40 rounded-xl border border-border/20">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Drop size={14} weight="fill" />
                      <span className="text-xs font-medium">Yield</span>
                    </div>
                    <p className="text-lg font-bold">
                      {selectedShot.final_weight.toFixed(1)}g
                    </p>
                  </div>
                )}
                {shotData.profile?.temperature && (
                  <div className="p-3 bg-secondary/40 rounded-xl border border-border/20">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Thermometer size={14} weight="fill" />
                      <span className="text-xs font-medium">Temp</span>
                    </div>
                    <p className="text-lg font-bold">
                      {shotData.profile.temperature}°C
                    </p>
                  </div>
                )}
              </div>

              {/* Chart */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold tracking-wide text-primary flex items-center gap-2">
                  <ChartLine size={16} weight="bold" />
                  Extraction Graph
                </Label>
                <div className="p-1 bg-secondary/40 rounded-xl border border-border/20">
                  <div className="h-80">
                    {(() => {
                      const chartData = getChartData(shotData)
                      const stageRanges = getStageRanges(chartData)
                      const hasGravFlow = chartData.some(d => d.gravimetricFlow !== undefined && d.gravimetricFlow > 0)
                      
                      return (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData} margin={{ top: 5, right: 0, left: -5, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
                            
                            {/* Stage background areas */}
                            {stageRanges.map((stage, idx) => (
                              <ReferenceArea
                                key={idx}
                                yAxisId="left"
                                x1={stage.startTime}
                                x2={stage.endTime}
                                fill={STAGE_COLORS[stage.colorIndex]}
                                fillOpacity={1}
                                stroke={STAGE_BORDER_COLORS[stage.colorIndex]}
                                strokeWidth={0}
                                ifOverflow="extendDomain"
                              />
                            ))}
                            
                            <XAxis 
                              dataKey="time" 
                              stroke="#666" 
                              fontSize={10}
                              tickFormatter={(value) => `${Math.round(value)}s`}
                              axisLine={{ stroke: '#444' }}
                              tickLine={{ stroke: '#444' }}
                            />
                            <YAxis 
                              yAxisId="left" 
                              stroke="#666" 
                              fontSize={10}
                              domain={[0, 'auto']}
                              axisLine={{ stroke: '#444' }}
                              tickLine={{ stroke: '#444' }}
                              width={35}
                            />
                            <YAxis 
                              yAxisId="right" 
                              orientation="right" 
                              stroke="#666" 
                              fontSize={10}
                              domain={[0, 'auto']}
                              axisLine={{ stroke: '#444' }}
                              tickLine={{ stroke: '#444' }}
                              width={35}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend 
                              wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
                              iconType="circle"
                              iconSize={8}
                            />
                            <Line
                              yAxisId="left"
                              type="monotone"
                              dataKey="pressure"
                              stroke={CHART_COLORS.pressure}
                              strokeWidth={2}
                              dot={false}
                              name="Pressure (bar)"
                            />
                            <Line
                              yAxisId="left"
                              type="monotone"
                              dataKey="flow"
                              stroke={CHART_COLORS.flow}
                              strokeWidth={2}
                              dot={false}
                              name="Flow (ml/s)"
                            />
                            <Line
                              yAxisId="right"
                              type="monotone"
                              dataKey="weight"
                              stroke={CHART_COLORS.weight}
                              strokeWidth={2}
                              dot={false}
                              name="Weight (g)"
                            />
                            {hasGravFlow && (
                              <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="gravimetricFlow"
                                stroke={CHART_COLORS.gravimetricFlow}
                                strokeWidth={1.5}
                                dot={false}
                                strokeDasharray="4 2"
                                name="Grav. Flow (g/s)"
                              />
                            )}
                          </LineChart>
                        </ResponsiveContainer>
                      )
                    })()}
                  </div>
                </div>
                
                {/* Stage Legend */}
                {(() => {
                  const chartData = getChartData(shotData)
                  const stageRanges = getStageRanges(chartData)
                  if (stageRanges.length === 0) return null
                  
                  return (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {stageRanges.map((stage, idx) => (
                        <Badge 
                          key={idx}
                          variant="outline"
                          className="text-[10px] px-2 py-0.5"
                          style={{
                            backgroundColor: STAGE_COLORS[stage.colorIndex],
                            borderColor: STAGE_BORDER_COLORS[stage.colorIndex]
                          }}
                        >
                          {stage.name}
                        </Badge>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No data available for this shot
            </p>
          )}
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <Card className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="shrink-0"
          >
            <CaretLeft size={22} weight="bold" />
          </Button>
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <ChartLine size={22} className="text-primary" weight="fill" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight truncate">Shot History</h2>
              <p className="text-xs text-muted-foreground/70 truncate">
                {profileName}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {shots.length} shots
          </Badge>
        </div>

        {error && (
          <Alert variant="destructive" className="border-destructive/30 bg-destructive/8 rounded-xl">
            <Warning size={18} weight="fill" />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <SearchingLoader estimatedSeconds={60} />
        ) : shots.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-4 rounded-2xl bg-secondary/40 inline-block mb-4">
              <ChartLine size={40} className="text-muted-foreground/40" weight="duotone" />
            </div>
            <p className="text-foreground/80 font-medium">No shots found</p>
            <p className="text-sm text-muted-foreground/60 mt-1.5">
              No shots have been pulled with this profile yet
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1 -mr-1">
            <AnimatePresence>
              {shots.map((shot, index) => (
                <motion.div
                  key={`${shot.date}-${shot.filename}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                  onClick={() => handleSelectShot(shot)}
                  className="group cursor-pointer"
                >
                  <div className="p-4 bg-secondary/40 hover:bg-secondary/70 rounded-xl border border-border/20 hover:border-border/40 transition-all duration-200">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {formatShotTime(shot)}
                        </h3>
                        <div className="flex items-center gap-3 mt-1.5">
                          {shot.total_time && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock size={12} weight="bold" />
                              {shot.total_time.toFixed(1)}s
                            </span>
                          )}
                          {shot.final_weight && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Drop size={12} weight="fill" />
                              {shot.final_weight.toFixed(1)}g
                            </span>
                          )}
                        </div>
                      </div>
                      <ChartLine 
                        size={20} 
                        weight="bold" 
                        className="text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" 
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
        
        {/* Refresh Button */}
        {!isLoading && (
          <div className="pt-2 border-t border-border/20">
            <Button
              variant="ghost"
              onClick={handleRefresh}
              className="w-full h-10 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowsCounterClockwise size={16} weight="bold" className="mr-2" />
              Refresh Shot History
            </Button>
          </div>
        )}
      </Card>
    </motion.div>
  )
}
