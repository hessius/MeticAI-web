import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Camera, Coffee, Sparkle, CheckCircle, Warning, ArrowClockwise, Upload, X } from '@phosphor-icons/react'
import { loadRuntimeConfig, getApiUrl } from '@/lib/config'

const LOADING_MESSAGES = [
  "Analyzing coffee beans...",
  "Detecting roast profile...",
  "Identifying flavor notes...",
  "Calculating extraction parameters...",
  "Optimizing grind settings...",
  "Fine-tuning temperature curve...",
  "Generating espresso profile...",
  "Almost there..."
]

const PRESET_TAGS = [
  { label: 'Light Body', category: 'body' },
  { label: 'Medium Body', category: 'body' },
  { label: 'Heavy Body', category: 'body' },
  { label: 'Florals', category: 'flavor' },
  { label: 'Acidity', category: 'flavor' },
  { label: 'Fruitiness', category: 'flavor' },
  { label: 'Chocolate', category: 'flavor' },
  { label: 'Thin', category: 'mouthfeel' },
  { label: 'Mouthfeel', category: 'mouthfeel' },
  { label: 'Italian', category: 'style' },
  { label: 'Modern', category: 'style' },
  { label: 'Bloom', category: 'extraction' },
  { label: 'Long', category: 'extraction' },
  { label: 'Short', category: 'extraction' },
]

interface APIResponse {
  status: string
  analysis: string
  reply: string
}

type ViewState = 'form' | 'loading' | 'results' | 'error'

function App() {
  const [viewState, setViewState] = useState<ViewState>('form')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [userPrefs, setUserPrefs] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [currentMessage, setCurrentMessage] = useState(0)
  const [apiResponse, setApiResponse] = useState<APIResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load runtime configuration on mount
  useEffect(() => {
    loadRuntimeConfig().catch(error => {
      console.error('Failed to load runtime configuration:', error)
    })
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please upload an image file (JPG, PNG, etc.)')
        return
      }
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const handleSubmit = async () => {
    if (!imageFile && !userPrefs.trim() && selectedTags.length === 0) {
      setErrorMessage('Please provide at least a coffee bag photo or taste preferences')
      return
    }

    setViewState('loading')
    setCurrentMessage(0)
    setErrorMessage('')

    const messageInterval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % LOADING_MESSAGES.length)
    }, 3500)

    try {
      const formData = new FormData()
      if (imageFile) {
        formData.append('file', imageFile)
      }
      
      const combinedPrefs = [
        ...selectedTags,
        userPrefs.trim()
      ].filter(Boolean).join(', ')
      
      if (combinedPrefs) {
        formData.append('user_prefs', combinedPrefs)
      }

      const response = await fetch(getApiUrl('/analyze_and_profile'), {
        method: 'POST',
        body: formData,
      })

      clearInterval(messageInterval)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: APIResponse = await response.json()
      setApiResponse(data)
      setViewState('results')
    } catch (error) {
      clearInterval(messageInterval)
      console.error('Error:', error)
      setErrorMessage(
        error instanceof Error 
          ? `Failed to generate profile: ${error.message}` 
          : 'Failed to generate profile. Please check your connection and try again.'
      )
      setViewState('error')
    }
  }

  const handleReset = () => {
    setViewState('form')
    setImageFile(null)
    setImagePreview(null)
    setUserPrefs('')
    setSelectedTags([])
    setApiResponse(null)
    setErrorMessage('')
    setCurrentMessage(0)
  }

  const canSubmit = imageFile || userPrefs.trim().length > 0 || selectedTags.length > 0

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <Coffee size={40} className="text-primary" weight="fill" />
            <h1 className="text-4xl font-bold tracking-tight">
              Metic<span className="text-primary neon-text">AI</span>
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">Meticulous Espresso Profile Generator</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {viewState === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold tracking-wide">
                    Coffee Bag Photo <span className="text-muted-foreground font-normal">(Optional)</span>
                  </Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  
                  {!imagePreview ? (
                    <label htmlFor="file-upload">
                      <div className="border-2 border-dashed border-input hover:border-primary rounded-lg p-8 cursor-pointer transition-all hover:bg-secondary/50 group">
                        <div className="flex flex-col items-center gap-3 text-muted-foreground group-hover:text-primary transition-colors">
                          <div className="flex gap-2">
                            <Camera size={32} weight="duotone" />
                            <Upload size={32} weight="duotone" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium">Tap to upload or take photo</p>
                            <p className="text-xs mt-1">JPG, PNG, or other image formats</p>
                          </div>
                        </div>
                      </div>
                    </label>
                  ) : (
                    <div className="relative rounded-lg overflow-hidden border border-primary/50">
                      <img 
                        src={imagePreview} 
                        alt="Coffee bag preview" 
                        className="w-full h-48 object-cover"
                      />
                      <button
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 p-2 bg-destructive/90 hover:bg-destructive rounded-full transition-colors"
                      >
                        <X size={20} weight="bold" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferences" className="text-sm font-semibold tracking-wide">
                    Taste Preferences <span className="text-muted-foreground font-normal">(Optional)</span>
                  </Label>
                  
                  <div className="space-y-3">
                    <Textarea
                      id="preferences"
                      value={userPrefs}
                      onChange={(e) => setUserPrefs(e.target.value)}
                      placeholder="e.g., Balanced extraction, nutty notes..."
                      className="min-h-[80px] resize-none bg-secondary border-input focus:border-primary transition-all"
                    />
                    
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Or select preset tags:</p>
                      <div className="flex flex-wrap gap-2">
                        {PRESET_TAGS.map((tag) => {
                          const isSelected = selectedTags.includes(tag.label)
                          return (
                            <motion.button
                              key={tag.label}
                              onClick={() => toggleTag(tag.label)}
                              whileTap={{ scale: 0.95 }}
                              className="relative"
                            >
                              <Badge
                                variant={isSelected ? "default" : "outline"}
                                className={`
                                  px-3 py-1.5 text-xs font-medium cursor-pointer transition-all duration-200
                                  ${isSelected 
                                    ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_10px_var(--primary)] hover:bg-primary/90' 
                                    : 'border-input hover:border-primary/50 hover:bg-secondary/80'
                                  }
                                `}
                              >
                                {tag.label}
                              </Badge>
                            </motion.button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-2">
                    Describe your ideal espresso flavor profile using text, tags, or both
                  </p>
                </div>

                {errorMessage && (
                  <Alert variant="destructive" className="border-destructive/50">
                    <Warning size={20} weight="fill" />
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  Generate Profile
                </Button>
              </Card>
            </motion.div>
          )}

          {viewState === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-8">
                <div className="flex flex-col items-center gap-6">
                  <motion.div
                    animate={{ 
                      rotate: 360,
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                      scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                    className="animate-pulse-glow rounded-full p-6"
                  >
                    <Sparkle size={48} className="text-primary" weight="fill" />
                  </motion.div>

                  <div className="text-center space-y-4 w-full">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={currentMessage}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4 }}
                        className="text-lg font-medium text-primary neon-text"
                      >
                        {LOADING_MESSAGES[currentMessage]}
                      </motion.p>
                    </AnimatePresence>
                    <p className="text-sm text-muted-foreground">
                      This may take up to 30 seconds
                    </p>
                  </div>

                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary via-neon-pink to-neon-green"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 30, ease: "linear" }}
                    />
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {viewState === 'results' && apiResponse && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ 
                type: "spring",
                stiffness: 200,
                damping: 20
              }}
            >
              <Card className="p-6 space-y-6">
                <div className="flex items-center gap-3 text-neon-green">
                  <CheckCircle size={32} weight="fill" />
                  <h2 className="text-2xl font-bold">Profile Generated!</h2>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold tracking-wide text-primary">
                      Coffee Analysis
                    </Label>
                    <div className="p-4 bg-secondary rounded-lg border border-primary/30">
                      <p className="text-base leading-relaxed">{apiResponse.analysis}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold tracking-wide text-neon-pink">
                      Status
                    </Label>
                    <div className="p-4 bg-secondary rounded-lg border border-neon-pink/30">
                      <p className="text-base">{apiResponse.reply}</p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleReset}
                  className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-95"
                >
                  Create Another Profile
                </Button>
              </Card>
            </motion.div>
          )}

          {viewState === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6 space-y-6">
                <div className="flex items-center gap-3 text-destructive">
                  <Warning size={32} weight="fill" />
                  <h2 className="text-2xl font-bold">Error</h2>
                </div>

                <Alert variant="destructive" className="border-destructive/50">
                  <AlertDescription className="text-base">
                    {errorMessage}
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3">
                  <Button
                    onClick={handleSubmit}
                    className="flex-1 h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-95"
                  >
                    <ArrowClockwise size={20} weight="bold" className="mr-2" />
                    Retry
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="flex-1 h-12 text-base font-semibold border-primary/50 hover:bg-secondary transition-all active:scale-95"
                  >
                    Back to Form
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default App
