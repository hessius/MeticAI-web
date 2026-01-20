import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { CaretDown } from '@phosphor-icons/react'

export interface AdvancedCustomizationOptions {
  basketType?: string
  waterTemp?: number
  maxPressure?: number
  maxFlow?: number
  shotVolume?: number
  dose?: number
  bottomFilter?: boolean
}

interface AdvancedCustomizationProps {
  value: AdvancedCustomizationOptions
  onChange: (value: AdvancedCustomizationOptions) => void
}

export function AdvancedCustomization({ value, onChange }: AdvancedCustomizationProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleChange = (key: keyof AdvancedCustomizationOptions, newValue: string | number | boolean) => {
    onChange({
      ...value,
      [key]: newValue,
    })
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full flex items-center justify-between p-3 rounded-xl border border-border/50 bg-secondary/30 hover:bg-secondary/50 transition-all duration-200"
        >
          <span className="text-sm font-semibold tracking-wide text-foreground/90">
            Advanced Customization
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <CaretDown size={18} weight="bold" className="text-muted-foreground" />
          </motion.div>
        </motion.button>
      </CollapsibleTrigger>
      
      <AnimatePresence>
        {isOpen && (
          <CollapsibleContent forceMount>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 p-4 rounded-xl border border-border/50 bg-secondary/30 space-y-4">
                {/* Basket Type */}
                <div className="space-y-2">
                  <Label htmlFor="basket-type" className="text-sm font-medium text-foreground/90">
                    Basket Type
                  </Label>
                  <Select
                    value={value.basketType || ''}
                    onValueChange={(val) => handleChange('basketType', val)}
                  >
                    <SelectTrigger id="basket-type" className="w-full bg-background/50">
                      <SelectValue placeholder="Select basket type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="double">Double</SelectItem>
                      <SelectItem value="step-down">Step-down</SelectItem>
                      <SelectItem value="vst">VST</SelectItem>
                      <SelectItem value="high-extraction">High Extraction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Water Temperature */}
                <div className="space-y-2">
                  <Label htmlFor="water-temp" className="text-sm font-medium text-foreground/90">
                    Water Temperature (°C)
                  </Label>
                  <Input
                    id="water-temp"
                    type="number"
                    min="85"
                    max="100"
                    step="0.5"
                    value={value.waterTemp || ''}
                    onChange={(e) => handleChange('waterTemp', e.target.value ? parseFloat(e.target.value) : '')}
                    placeholder="e.g., 93"
                    className="bg-background/50"
                  />
                </div>

                {/* Max Pressure */}
                <div className="space-y-2">
                  <Label htmlFor="max-pressure" className="text-sm font-medium text-foreground/90">
                    Max Pressure (bar)
                  </Label>
                  <Input
                    id="max-pressure"
                    type="number"
                    min="1"
                    max="12"
                    step="0.1"
                    value={value.maxPressure || ''}
                    onChange={(e) => handleChange('maxPressure', e.target.value ? parseFloat(e.target.value) : '')}
                    placeholder="e.g., 9"
                    className="bg-background/50"
                  />
                </div>

                {/* Max Flow */}
                <div className="space-y-2">
                  <Label htmlFor="max-flow" className="text-sm font-medium text-foreground/90">
                    Max Flow (ml/s)
                  </Label>
                  <Input
                    id="max-flow"
                    type="number"
                    min="0.5"
                    max="10"
                    step="0.1"
                    value={value.maxFlow || ''}
                    onChange={(e) => handleChange('maxFlow', e.target.value ? parseFloat(e.target.value) : '')}
                    placeholder="e.g., 4.5"
                    className="bg-background/50"
                  />
                </div>

                {/* Shot Volume */}
                <div className="space-y-2">
                  <Label htmlFor="shot-volume" className="text-sm font-medium text-foreground/90">
                    Shot Volume (ml)
                  </Label>
                  <Input
                    id="shot-volume"
                    type="number"
                    min="15"
                    max="100"
                    step="1"
                    value={value.shotVolume || ''}
                    onChange={(e) => handleChange('shotVolume', e.target.value ? parseFloat(e.target.value) : '')}
                    placeholder="e.g., 40"
                    className="bg-background/50"
                  />
                </div>

                {/* Dose */}
                <div className="space-y-2">
                  <Label htmlFor="dose" className="text-sm font-medium text-foreground/90">
                    Dose (g)
                  </Label>
                  <Input
                    id="dose"
                    type="number"
                    min="7"
                    max="25"
                    step="0.1"
                    value={value.dose || ''}
                    onChange={(e) => handleChange('dose', e.target.value ? parseFloat(e.target.value) : '')}
                    placeholder="e.g., 18"
                    className="bg-background/50"
                  />
                </div>

                {/* Bottom Filter */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="bottom-filter" className="text-sm font-medium text-foreground/90 cursor-pointer">
                    Bottom Filter
                  </Label>
                  <Switch
                    id="bottom-filter"
                    checked={value.bottomFilter || false}
                    onCheckedChange={(checked) => handleChange('bottomFilter', checked)}
                  />
                </div>
              </div>
            </motion.div>
          </CollapsibleContent>
        )}
      </AnimatePresence>
    </Collapsible>
  )
}
