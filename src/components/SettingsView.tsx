import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CaretLeft, GithubLogo, FloppyDisk, Info, CheckCircle, Warning, ArrowsClockwise } from '@phosphor-icons/react'
import { getServerUrl } from '@/lib/config'

interface SettingsViewProps {
  onBack: () => void
}

interface Settings {
  geminiApiKey: string
  meticulousIp: string
  serverIp: string
  authorName: string
  geminiApiKeyMasked?: boolean
  geminiApiKeyConfigured?: boolean
}

export function SettingsView({ onBack }: SettingsViewProps) {
  const [settings, setSettings] = useState<Settings>({
    geminiApiKey: '',
    meticulousIp: '',
    serverIp: '',
    authorName: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isRestarting, setIsRestarting] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [restartStatus, setRestartStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Load current settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const serverUrl = await getServerUrl()
        const response = await fetch(`${serverUrl}/api/settings`)
        if (response.ok) {
          const data = await response.json()
          setSettings({
            geminiApiKey: data.geminiApiKey || '',
            meticulousIp: data.meticulousIp || '',
            serverIp: data.serverIp || '',
            authorName: data.authorName || '',
            geminiApiKeyMasked: data.geminiApiKeyMasked || false,
            geminiApiKeyConfigured: data.geminiApiKeyConfigured || false
          })
        }
      } catch (err) {
        console.error('Failed to load settings:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('idle')
    setErrorMessage('')

    try {
      const serverUrl = await getServerUrl()
      const response = await fetch(`${serverUrl}/api/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        setSaveStatus('success')
        setTimeout(() => setSaveStatus('idle'), 3000)
      } else {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to save settings')
      }
    } catch (err) {
      setSaveStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (field: keyof Settings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }))
    setSaveStatus('idle')
  }

  const handleRestart = async () => {
    if (!confirm('Are you sure you want to restart MeticAI? The system will be unavailable for a few seconds.')) {
      return
    }
    
    setIsRestarting(true)
    setRestartStatus('idle')

    try {
      const serverUrl = await getServerUrl()
      const response = await fetch(`${serverUrl}/api/restart`, {
        method: 'POST'
      })

      if (response.ok) {
        setRestartStatus('success')
      } else {
        const error = await response.json()
        throw new Error(error.detail?.message || 'Failed to trigger restart')
      }
    } catch (err) {
      setRestartStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Failed to restart')
    } finally {
      setIsRestarting(false)
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
        <h2 className="text-xl font-bold">Settings & About</h2>
      </div>

      {/* About Section */}
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-primary">About MeticAI</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          When I got my Meticulous, after a loooong wait, I was overwhelmed with the options — 
          dialing in was no longer just adjusting grind size, the potential was (and is) basically 
          limitless — my knowledge and time not so.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This, "MeticAI", is a growing set of AI tools to enable me, and you, to get the most 
          out of a Meticulous Espresso machine. Among other things it lets you automatically 
          create espresso profiles tailored to your preferences and coffee at hand, understand 
          your espresso profiles and shot data like never before, and ultimately — lets you 
          unleash your Meticulous.
        </p>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => window.open('https://github.com/hessius/MeticAI', '_blank')}
        >
          <GithubLogo size={18} className="mr-2" weight="bold" />
          View on GitHub
        </Button>
      </Card>

      {/* Settings Section */}
      <Card className="p-6 space-y-5">
        <h3 className="text-lg font-semibold text-primary">Configuration</h3>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground text-sm">Loading settings...</div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Gemini API Key */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="apiKey" className="text-sm font-medium">
                  Gemini API Key
                </Label>
                {settings.geminiApiKeyConfigured && (
                  <span className="text-xs text-success flex items-center gap-1">
                    <CheckCircle size={12} weight="fill" />
                    Configured
                  </span>
                )}
              </div>
              <div className="relative">
                <Input
                  id="apiKey"
                  type="password"
                  value={settings.geminiApiKey}
                  onChange={(e) => handleChange('geminiApiKey', e.target.value)}
                  placeholder={settings.geminiApiKeyConfigured ? "Enter new key to change" : "Enter your Gemini API key"}
                  className="pr-10"
                  readOnly={settings.geminiApiKeyMasked && settings.geminiApiKey.startsWith('*')}
                  onClick={() => {
                    // Clear the masked value when clicking to allow entering a new key
                    if (settings.geminiApiKeyMasked && settings.geminiApiKey.startsWith('*')) {
                      handleChange('geminiApiKey', '')
                    }
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {settings.geminiApiKeyConfigured 
                  ? "API key is configured. Click the field to enter a new key."
                  : <>Get your API key from{' '}
                    <a 
                      href="https://aistudio.google.com/app/apikey" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Google AI Studio
                    </a>
                  </>
                }
              </p>
            </div>

            {/* Meticulous IP */}
            <div className="space-y-2">
              <Label htmlFor="meticulousIp" className="text-sm font-medium">
                Meticulous Machine IP
              </Label>
              <Input
                id="meticulousIp"
                type="text"
                value={settings.meticulousIp}
                onChange={(e) => handleChange('meticulousIp', e.target.value)}
                placeholder="e.g., 192.168.1.100"
              />
              <p className="text-xs text-muted-foreground">
                The IP address of your Meticulous espresso machine on your local network
              </p>
            </div>

            {/* Server IP */}
            <div className="space-y-2">
              <Label htmlFor="serverIp" className="text-sm font-medium">
                Server IP
              </Label>
              <Input
                id="serverIp"
                type="text"
                value={settings.serverIp}
                onChange={(e) => handleChange('serverIp', e.target.value)}
                placeholder="e.g., 192.168.1.50"
              />
              <p className="text-xs text-muted-foreground">
                The IP address of the server running MeticAI (usually a Raspberry Pi)
              </p>
            </div>

            {/* Author Name */}
            <div className="space-y-2">
              <Label htmlFor="authorName" className="text-sm font-medium">
                Author Name
              </Label>
              <Input
                id="authorName"
                type="text"
                value={settings.authorName}
                onChange={(e) => handleChange('authorName', e.target.value)}
                placeholder="MeticAI"
              />
              <p className="text-xs text-muted-foreground">
                Your name for the author field in generated profile JSON. Defaults to "MeticAI" if left empty.
              </p>
            </div>

            {/* Info Alert */}
            <Alert className="bg-primary/5 border-primary/20">
              <Info size={16} className="text-primary" />
              <AlertDescription className="text-xs">
                Changes to IP settings require restarting the Docker containers to take effect.
              </AlertDescription>
            </Alert>

            {/* Save Button */}
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? (
                'Saving...'
              ) : (
                <>
                  <FloppyDisk size={18} className="mr-2" weight="bold" />
                  Save Settings
                </>
              )}
            </Button>

            {/* Status Messages */}
            {saveStatus === 'success' && (
              <Alert className="bg-success/10 border-success/20">
                <CheckCircle size={16} className="text-success" weight="fill" />
                <AlertDescription className="text-sm text-success">
                  Settings saved successfully!
                </AlertDescription>
              </Alert>
            )}

            {saveStatus === 'error' && (
              <Alert variant="destructive">
                <Warning size={16} weight="fill" />
                <AlertDescription className="text-sm">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </Card>

      {/* System Section */}
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-primary">System</h3>
        
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Restart all MeticAI services. Use this after changing IP settings or if you're experiencing issues.
          </p>
          
          <Button
            onClick={handleRestart}
            disabled={isRestarting}
            variant="outline"
            className="w-full border-destructive/30 hover:border-destructive/50 hover:bg-destructive/5 text-destructive hover:text-destructive"
          >
            {isRestarting ? (
              'Restarting...'
            ) : (
              <>
                <ArrowsClockwise size={18} className="mr-2" weight="bold" />
                Restart MeticAI
              </>
            )}
          </Button>

          {restartStatus === 'success' && (
            <Alert className="bg-success/10 border-success/20">
              <CheckCircle size={16} className="text-success" weight="fill" />
              <AlertDescription className="text-sm text-success">
                Restart triggered! The system will restart momentarily.
              </AlertDescription>
            </Alert>
          )}

          {restartStatus === 'error' && (
            <Alert variant="destructive">
              <Warning size={16} weight="fill" />
              <AlertDescription className="text-sm">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </Card>

      {/* Version Info */}
      <div className="text-center text-xs text-muted-foreground/50 pb-4">
        MeticAI • Built with ❤️ for coffee lovers
      </div>
    </motion.div>
  )
}
