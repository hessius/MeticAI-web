import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Coffee, Play, Gear } from '@phosphor-icons/react'

const GREETINGS = {
  morning: ["Good morning!", "Rise and shine!", "Morning, coffee time!", "Top of the morning!"],
  afternoon: ["Good afternoon!", "Hey there!", "Howdy!", "What's brewing?"],
  evening: ["Good evening!", "Evening!", "Ready for an espresso?", "Time for coffee!"]
}

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours()
  let greetings: string[]
  
  if (hour >= 5 && hour < 12) {
    greetings = GREETINGS.morning
  } else if (hour >= 12 && hour < 17) {
    greetings = GREETINGS.afternoon
  } else {
    greetings = GREETINGS.evening
  }
  
  return greetings[Math.floor(Math.random() * greetings.length)]
}

interface StartViewProps {
  profileCount: number | null
  onGenerateNew: () => void
  onViewHistory: () => void
  onRunShot: () => void
  onSettings: () => void
}

export function StartView({
  profileCount,
  onGenerateNew,
  onViewHistory,
  onRunShot,
  onSettings
}: StartViewProps) {
  return (
    <motion.div
      key="start"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <Card className="p-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground">{getTimeBasedGreeting()}</h2>
          <p className="text-sm text-muted-foreground">
            {profileCount && profileCount > 0
              ? `You have ${profileCount} profile${profileCount !== 1 ? 's' : ''} saved`
              : 'Get started by generating your first profile'}
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={onGenerateNew}
            className="w-full h-14 text-base font-semibold bg-primary hover:bg-primary/90"
          >
            <Plus size={20} className="mr-2" weight="bold" />
            Generate New Profile
          </Button>
          
          <Button
            onClick={onViewHistory}
            className="w-full h-14 text-base font-semibold bg-primary hover:bg-primary/90"
          >
            <Coffee size={20} className="mr-2" weight="fill" />
            Profile Catalogue
          </Button>
          
          <Button
            onClick={onRunShot}
            className="w-full h-14 text-base font-semibold bg-primary hover:bg-primary/90"
          >
            <Play size={20} className="mr-2" weight="fill" />
            Run / Schedule
          </Button>
          
          <Button
            onClick={onSettings}
            className="w-full h-14 text-base font-semibold bg-muted hover:bg-muted/80 text-foreground"
          >
            <Gear size={20} className="mr-2" weight="duotone" />
            Settings
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}
