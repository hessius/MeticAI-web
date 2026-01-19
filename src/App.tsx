import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Camera, Sparkle, CheckCircle, Warning, ArrowClockwise, Upload, X, DownloadSimple, Info, QrCode, ClockCounterClockwise, FileJs, Coffee, Image, CaretLeft } from '@phosphor-icons/react'
import { getServerUrl } from '@/lib/config'
import { MarkdownText } from '@/components/MarkdownText'
import { domToPng } from 'modern-screenshot'
import { UpdateBanner } from '@/components/UpdateBanner'
import { useUpdateStatus } from '@/hooks/useUpdateStatus'
import { useUpdateTrigger } from '@/hooks/useUpdateTrigger'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { QRCodeDialog } from '@/components/QRCodeDialog'
import { useIsDesktop } from '@/hooks/use-desktop'
import { MeticAILogo } from '@/components/MeticAILogo'
import { HistoryView, ProfileDetailView } from '@/components/HistoryView'
import { HistoryEntry } from '@/hooks/useHistory'

const LOADING_MESSAGES = [
  "Analyzing coffee beans...",
  "Detecting roast profile...",
  "Watching a Lance video...",
  "Identifying flavor notes...",
  "Checking for Kickstarter updates...",
  "Feeling some Aramse ASMR...",
  "Calculating extraction parameters...",
  "Perusing a Daddy Hoff book...",
  "Optimizing grind settings...",
  "Logging into Discord...",
  "Checking James Hoffmann's notes...",
  "Fine-tuning flow curve...",
  "Consulting the Sprometheus archives...",
  "Generating espresso profile...",
  "Channeling my inner Morgan Drinks Coffee...",
  "Almost there..."
]

import { PRESET_TAGS, CATEGORY_COLORS } from '@/lib/tags'

interface APIResponse {
  status: string
  analysis: string
  reply: string
  history_id?: string
}

type ViewState = 'form' | 'loading' | 'results' | 'error' | 'history' | 'history-detail'

function App() {
  const [viewState, setViewState] = useState<ViewState>('form')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [userPrefs, setUserPrefs] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [currentMessage, setCurrentMessage] = useState(0)
  const [apiResponse, setApiResponse] = useState<APIResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isCapturing, setIsCapturing] = useState(false)
  const [clickCount, setClickCount] = useState(0)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<HistoryEntry | null>(null)
  const [currentProfileJson, setCurrentProfileJson] = useState<Record<string, unknown> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const resultsCardRef = useRef<HTMLDivElement>(null)
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Update functionality
  const { updateAvailable, checkForUpdates, isChecking } = useUpdateStatus()
  const { triggerUpdate, isUpdating, updateError } = useUpdateTrigger()
  
  // Desktop detection for QR code feature
  const isDesktop = useIsDesktop()

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

      const serverUrl = await getServerUrl()
      console.log('Sending request to:', `${serverUrl}/analyze_and_profile`)
      
      const response = await fetch(`${serverUrl}/analyze_and_profile`, {
        method: 'POST',
        body: formData,
      })

      clearInterval(messageInterval)

      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response:', errorText)
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`)
      }

      const responseText = await response.text()
      console.log('Response text:', responseText)
      
      const data: APIResponse = JSON.parse(responseText)
      
      // Check if the API returned an error status
      if (data.status === 'error') {
        throw new Error((data as unknown as { message?: string }).message || 'Profile generation failed on the server')
      }
      
      setApiResponse(data)
      
      // Extract profile JSON from the reply for download functionality
      const extractProfileJson = (text: string | undefined | null): Record<string, unknown> | null => {
        if (!text) return null
        const jsonBlockPattern = /```json\s*([\s\S]*?)```/gi
        const matches = text.matchAll(jsonBlockPattern)
        
        for (const match of matches) {
          try {
            const parsed = JSON.parse(match[1].trim())
            if (typeof parsed === 'object' && parsed !== null && ('name' in parsed || 'stages' in parsed)) {
              return parsed
            }
          } catch {
            continue
          }
        }
        return null
      }
      
      setCurrentProfileJson(extractProfileJson(data.reply))
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
    setCurrentProfileJson(null)
    setSelectedHistoryEntry(null)
  }

  const handleViewHistoryEntry = (entry: HistoryEntry) => {
    setSelectedHistoryEntry(entry)
    setViewState('history-detail')
  }

  const handleDownloadJson = () => {
    const jsonData = selectedHistoryEntry?.profile_json || currentProfileJson
    if (!jsonData) {
      toast.error('No profile JSON available')
      return
    }

    const profileName = selectedHistoryEntry?.profile_name || 
      apiResponse?.reply.match(/Profile Created:\s*(.+?)(?:\n|$)/i)?.[1]?.trim() || 
      'profile'
    
    const safeName = profileName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${safeName || 'profile'}.json`
    link.click()
    URL.revokeObjectURL(url)
    
    toast.success('Profile JSON downloaded!')
  }

  const handleSaveResults = async () => {
    if (!resultsCardRef.current || !apiResponse) return
    
    try {
      // Extract profile name from the reply
      const profileNameMatch = apiResponse.reply.match(/Profile Created:\s*(.+?)(?:\n|$)/i)
      const profileName = profileNameMatch ? profileNameMatch[1].trim() : 'espresso-profile'
      const safeFilename = profileName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      
      // Enable capturing mode to show header and hide buttons
      setIsCapturing(true)
      
      // Wait for DOM to update
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const dataUrl = await domToPng(resultsCardRef.current, {
        scale: 2,
        backgroundColor: '#09090b',
        style: {
          padding: '20px',
          boxSizing: 'content-box'
        }
      })
      
      // Disable capturing mode
      setIsCapturing(false)
      
      const link = document.createElement('a')
      link.download = `${safeFilename}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Error saving results:', error)
      setIsCapturing(false)
      setErrorMessage('Failed to save results. Please try again.')
    }
  }

  const loadMockResults = () => {
    setApiResponse({
      status: 'success',
      analysis: "Standout Coffee's Washed Pink Bourbon, grown in the Huila region of Colombia at 1800 masl on the Zarza farm, offers floral notes of rose and lily with flavors of cantaloupe, sweet mango, pink lemonade, and sparkling Austrian riesling.",
      reply: `Profile Created: Riesling to the Occasion

Description: A modern, multi-stage profile designed to highlight the delicate florals and funky fruit-forward nature of the Washed Pink Bourbon. It uses an extended blooming phase to deepen complexity and a declining pressure ramp to deliver a clean, sparkling finish reminiscent of a fine white wine.

Preparation: • Dose: 18g
• Grind: Fine; slightly finer than a standard espresso grind to accommodate the long, gentle pre-infusion.
• Water Temp: 94°C
• Yield: 45g (approx. 1:2.5 ratio)
• Total Time: ~45-55 seconds

Why This Works: We're giving this exceptional coffee the spa treatment. The initial low-flow soak gently saturates the puck, preventing any harshness. The long, low-energy "Funk Tank Bloom" is where the magic happens, allowing unique, soluble compounds to develop, pushing those mango and cantaloupe notes forward. The pressure ramp extracts the core sweetness and body, while the final, declining pressure phase mimics a lever machine, which prevents over-extraction of bitter compounds and lets that bright, acidic "Riesling" and pink lemonade sparkle.

Special Notes: For maximum clarity and to really make those delicate floral notes pop, consider using a paper filter at the bottom of your basket.`
    })
    setViewState('results')
  }

  const handleTitleClick = () => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current)
    }
    
    const newCount = clickCount + 1
    setClickCount(newCount)
    
    if (newCount === 5) {
      loadMockResults()
      setClickCount(0)
    } else {
      clickTimerRef.current = setTimeout(() => {
        setClickCount(0)
      }, 1000)
    }
  }

  const canSubmit = imageFile || userPrefs.trim().length > 0 || selectedTags.length > 0

  const handleUpdate = async () => {
    setBannerDismissed(false)
    toast.info('Starting update process...')
    await triggerUpdate()
  }

  const handleDismissBanner = () => {
    setBannerDismissed(true)
    toast('Update notification dismissed', {
      description: 'You can check for updates again later',
    })
  }

  const getCategoryColor = (category: string) => {
    return CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] || ''
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <Toaster />
      <UpdateBanner
        updateAvailable={updateAvailable && !bannerDismissed}
        isUpdating={isUpdating}
        updateError={updateError}
        onUpdate={handleUpdate}
        onDismiss={handleDismissBanner}
      />
      <div className="w-full max-w-md relative">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-2 relative">
            <MeticAILogo size={40} variant="white" />
            <h1 
              className="text-4xl font-bold tracking-tight"
              onClick={handleTitleClick}
              title="Click 5 times to load test results"
            >
              Metic<span className="text-primary neon-text">AI</span>
            </h1>
            {isDesktop && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                onClick={() => setQrDialogOpen(true)}
                title="Open on mobile"
              >
                <QrCode size={24} weight="duotone" />
              </Button>
            )}
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
                                    : `${getCategoryColor(tag.category)} border hover:border-primary/40`
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

                <div className="space-y-3">
                  <Button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                  >
                    Generate Profile
                  </Button>
                  
                  <Button
                    onClick={() => setViewState('history')}
                    variant="outline"
                    className="w-full h-10 text-sm font-medium border-primary/30 hover:bg-primary/10 transition-all"
                  >
                    <ClockCounterClockwise size={18} className="mr-2" weight="bold" />
                    View History
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {viewState === 'history' && (
            <HistoryView
              onBack={() => setViewState('form')}
              onViewProfile={handleViewHistoryEntry}
            />
          )}

          {viewState === 'history-detail' && selectedHistoryEntry && (
            <ProfileDetailView
              entry={selectedHistoryEntry}
              onBack={() => setViewState('history')}
              onNewProfile={handleReset}
            />
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
                        className="text-lg font-medium text-primary neon-text min-h-[3.5rem]"
                      >
                        {LOADING_MESSAGES[currentMessage]}
                      </motion.p>
                    </AnimatePresence>
                    <p className="text-sm text-muted-foreground">
                      This may take 60-90 seconds
                    </p>
                  </div>

                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary via-neon-pink to-neon-green"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 75, ease: "linear" }}
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
              <div ref={resultsCardRef}>
                {isCapturing && (
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <MeticAILogo size={40} variant="white" />
                      <h1 className="text-4xl font-bold tracking-tight">
                        Metic<span className="text-primary neon-text">AI</span>
                      </h1>
                    </div>
                    <p className="text-muted-foreground text-sm">Meticulous Espresso Profile Generator</p>
                  </div>
                )}
              <Card className={`p-6 ${isCapturing ? 'space-y-4' : 'space-y-6'}`}>
                {(() => {
                  const profileNameMatch = apiResponse.reply.match(/Profile Created:\s*(.+?)(?:\n|$)/i)
                  const profileName = profileNameMatch?.[1]?.trim()
                  
                  if (isCapturing && profileName) {
                    return (
                      <div className="text-neon-green w-full">
                        <h2 className="text-2xl font-bold break-words">{profileName}</h2>
                      </div>
                    )
                  }
                  
                  return (
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleReset}
                        className="shrink-0"
                        title="Back to form"
                      >
                        <CaretLeft size={24} weight="bold" />
                      </Button>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <CheckCircle size={28} weight="fill" className="text-neon-green shrink-0" />
                        <div className="min-w-0">
                          <h2 className="text-lg font-bold text-neon-green truncate">
                            {profileName || 'Profile Generated!'}
                          </h2>
                          <p className="text-xs text-muted-foreground">Profile saved to device</p>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                <div className="space-y-4">
                  {/* Only show Coffee Analysis if it has content */}
                  {apiResponse.analysis && apiResponse.analysis.trim() && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold tracking-wide text-primary">
                        Coffee Analysis
                      </Label>
                      <div className="p-4 bg-secondary rounded-lg border border-primary/30">
                        <p className="text-base leading-relaxed">
                          <MarkdownText>{apiResponse.analysis}</MarkdownText>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Parse and display structured profile sections */}
                  {(() => {
                    const parseProfileSections = (text: string) => {
                      const sections: { title: string; content: string }[] = []
                      const sectionHeaders = [
                        'Description',
                        'Preparation',
                        'Why This Works',
                        'Special Notes'
                      ]
                      
                      // Split by section headers
                      const remainingText = text
                      
                      sectionHeaders.forEach((header, index) => {
                        const headerPattern = new RegExp(`${header}:\\s*`, 'i')
                        const match = remainingText.match(headerPattern)
                        
                        if (match && match.index !== undefined) {
                          const startIndex = match.index + match[0].length
                          
                          // Find the next section header or end of text
                          let endIndex = remainingText.length
                          for (let i = index + 1; i < sectionHeaders.length; i++) {
                            const nextHeaderPattern = new RegExp(`${sectionHeaders[i]}:`, 'i')
                            const nextMatch = remainingText.match(nextHeaderPattern)
                            if (nextMatch && nextMatch.index !== undefined) {
                              endIndex = nextMatch.index
                              break
                            }
                          }
                          
                          let content = remainingText.substring(startIndex, endIndex).trim()
                          
                          // Stop at PROFILE JSON section to hide JSON output
                          const jsonSectionIndex = content.indexOf('PROFILE JSON')
                          if (jsonSectionIndex > 0) {
                            content = content.substring(0, jsonSectionIndex).trim()
                          }
                          // Also remove any code blocks that might contain JSON
                          content = content.replace(/```json[\s\S]*?```/g, '').trim()
                          content = content.replace(/```[\s\S]*?```/g, '').trim()
                          
                          if (content) {
                            sections.push({ title: header, content })
                          }
                        }
                      })
                      
                      return sections
                    }
                    
                    const sections = parseProfileSections(apiResponse.reply)
                    
                    return sections.length > 0 ? (
                      <div className="space-y-3">
                        {sections.map((section, index) => (
                          <div key={index} className="space-y-2">
                            <Label className="text-sm font-semibold tracking-wide text-neon-pink">
                              {section.title}
                            </Label>
                            <div className="p-4 bg-secondary rounded-lg border border-neon-pink/30">
                              <p className="text-base leading-relaxed whitespace-pre-wrap">
                                <MarkdownText>{section.content}</MarkdownText>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      // Fallback to original display if parsing fails
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold tracking-wide text-neon-pink">
                          Profile
                        </Label>
                        <div className="p-4 bg-secondary rounded-lg border border-neon-pink/30">
                          <p className="text-base leading-relaxed whitespace-pre-wrap">
                            <MarkdownText>{apiResponse.reply}</MarkdownText>
                          </p>
                        </div>
                      </div>
                    )
                  })()}
                </div>

                {!isCapturing && (
                  <>
                    <Alert className="bg-primary/10 border-primary/30">
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        Profile has been saved to your Meticulous device and history
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        onClick={handleSaveResults}
                        variant="outline"
                        className="h-12 text-sm font-semibold border-primary/30 hover:bg-primary/10 transition-all active:scale-95"
                        title="Save results as image"
                      >
                        <Image size={18} className="mr-1" weight="bold" />
                        Image
                      </Button>
                      {currentProfileJson && (
                        <Button
                          onClick={handleDownloadJson}
                          variant="outline"
                          className="h-12 text-sm font-semibold border-primary/30 hover:bg-primary/10 transition-all active:scale-95"
                        >
                          <FileJs size={18} className="mr-1" weight="bold" />
                          JSON
                        </Button>
                      )}
                      <Button
                        onClick={handleReset}
                        className={`h-12 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-95 ${!currentProfileJson ? 'col-span-2' : ''}`}
                      >
                        New Profile
                      </Button>
                    </div>
                  </>
                )}
              </Card>
              </div>
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
        
        <QRCodeDialog open={qrDialogOpen} onOpenChange={setQrDialogOpen} />
        
        {/* Discrete footer with check for updates */}
        <div className="mt-8 pb-4 flex justify-center">
          <Button
            onClick={async () => {
              const result = await checkForUpdates()
              if (result.error) {
                toast.error('Check failed', {
                  description: result.error,
                })
              } else if (result.updateAvailable) {
                toast.success('Update available!', {
                  description: 'A new version is ready to install.',
                })
              } else {
                toast.info('You\'re up to date', {
                  description: 'No updates available.',
                })
              }
            }}
            disabled={isChecking}
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            {isChecking ? (
              <>
                <ArrowClockwise size={12} className="mr-1 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <DownloadSimple size={12} className="mr-1" />
                Check for updates
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default App
