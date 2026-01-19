import React, { useEffect, useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  ClockCounterClockwise, 
  Trash, 
  CaretLeft, 
  Warning,
  FileJs,
  Coffee,
  Image,
  Funnel,
  X
} from '@phosphor-icons/react'
import { useHistory, HistoryEntry } from '@/hooks/useHistory'
import { MarkdownText } from '@/components/MarkdownText'
import { formatDistanceToNow } from 'date-fns'
import { domToPng } from 'modern-screenshot'
import { MeticAILogo } from '@/components/MeticAILogo'
import { 
  extractTagsFromPreferences, 
  getAllTagsFromEntries, 
  getTagColorClass
} from '@/lib/tags'

interface HistoryViewProps {
  onBack: () => void
  onViewProfile: (entry: HistoryEntry) => void
}

export function HistoryView({ onBack, onViewProfile }: HistoryViewProps) {
  const { 
    entries, 
    total, 
    isLoading, 
    error, 
    fetchHistory, 
    deleteEntry, 
    downloadJson 
  } = useHistory()
  
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedFilterTags, setSelectedFilterTags] = useState<string[]>([])
  const [filterMode, setFilterMode] = useState<'AND' | 'OR'>('OR')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  // Get all available tags from entries for filtering
  const availableTags = useMemo(() => {
    return getAllTagsFromEntries(entries)
  }, [entries])

  // Filter entries based on selected tags
  const filteredEntries = useMemo(() => {
    if (selectedFilterTags.length === 0) return entries
    
    return entries.filter(entry => {
      const entryTags = extractTagsFromPreferences(entry.user_preferences)
      
      if (filterMode === 'AND') {
        // All selected tags must be present
        return selectedFilterTags.every(tag => entryTags.includes(tag))
      } else {
        // At least one selected tag must be present
        return selectedFilterTags.some(tag => entryTags.includes(tag))
      }
    })
  }, [entries, selectedFilterTags, filterMode])

  const toggleFilterTag = (tag: string) => {
    setSelectedFilterTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const clearFilters = () => {
    setSelectedFilterTags([])
  }

  const handleDelete = async (entryId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this profile from history?')) {
      return
    }
    
    try {
      setDeletingId(entryId)
      await deleteEntry(entryId)
    } catch (err) {
      console.error('Failed to delete:', err)
    } finally {
      setDeletingId(null)
    }
  }

  const handleDownload = async (entry: HistoryEntry, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await downloadJson(entry)
    } catch (err) {
      console.error('Failed to download:', err)
      alert('Profile JSON not available for this entry')
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
    } catch {
      return dateStr
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="shrink-0"
          >
            <CaretLeft size={24} weight="bold" />
          </Button>
          <div className="flex items-center gap-2">
            <ClockCounterClockwise size={28} className="text-primary" weight="fill" />
            <h2 className="text-xl font-bold">Profile History</h2>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant={showFilters ? "default" : "ghost"}
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={`shrink-0 ${selectedFilterTags.length > 0 ? 'text-primary' : ''}`}
              title="Filter by tags"
            >
              <Funnel size={20} weight={showFilters || selectedFilterTags.length > 0 ? "fill" : "regular"} />
            </Button>
            <span className="text-sm text-muted-foreground">
              {selectedFilterTags.length > 0 
                ? `${filteredEntries.length}/${total}` 
                : `${total}`
              } profile{(selectedFilterTags.length > 0 ? filteredEntries.length : total) !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Filter Section */}
        <AnimatePresence>
          {showFilters && availableTags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-secondary/50 rounded-lg border border-primary/10 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Filter by Tags</Label>
                  <div className="flex items-center gap-2">
                    {selectedFilterTags.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-7 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <X size={14} className="mr-1" />
                        Clear
                      </Button>
                    )}
                    <div className="flex items-center bg-secondary rounded-md p-0.5">
                      <button
                        onClick={() => setFilterMode('OR')}
                        className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                          filterMode === 'OR' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        OR
                      </button>
                      <button
                        onClick={() => setFilterMode('AND')}
                        className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                          filterMode === 'AND' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        AND
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => {
                    const isSelected = selectedFilterTags.includes(tag)
                    return (
                      <Badge
                        key={tag}
                        onClick={() => toggleFilterTag(tag)}
                        className={`
                          px-2 py-1 text-xs font-medium cursor-pointer transition-all duration-200 border
                          ${getTagColorClass(tag, isSelected)}
                        `}
                      >
                        {tag}
                      </Badge>
                    )
                  })}
                </div>
                {selectedFilterTags.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {filterMode === 'OR' 
                      ? 'Showing profiles with any of the selected tags'
                      : 'Showing profiles with all selected tags'
                    }
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {error && (
          <Alert variant="destructive" className="border-destructive/50">
            <Warning size={20} weight="fill" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">
              Loading history...
            </div>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <Coffee size={48} className="mx-auto text-muted-foreground/50 mb-4" weight="duotone" />
            <p className="text-muted-foreground">No profiles yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Generate your first espresso profile to see it here
            </p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <Funnel size={48} className="mx-auto text-muted-foreground/50 mb-4" weight="duotone" />
            <p className="text-muted-foreground">No matching profiles</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Try adjusting your filter settings
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="mt-4"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            <AnimatePresence>
              {filteredEntries.map((entry) => {
                const entryTags = extractTagsFromPreferences(entry.user_preferences)
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => onViewProfile(entry)}
                    className="group cursor-pointer"
                  >
                    <div className="p-4 bg-secondary rounded-lg border border-primary/10 hover:border-primary/30 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-primary truncate">
                            {entry.profile_name}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(entry.created_at)}
                          </p>
                          {entryTags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {entryTags.slice(0, 5).map((tag) => (
                                <Badge
                                  key={tag}
                                  className={`
                                    px-1.5 py-0.5 text-[10px] font-medium border
                                    ${getTagColorClass(tag, false)}
                                  `}
                                >
                                  {tag}
                                </Badge>
                              ))}
                              {entryTags.length > 5 && (
                                <Badge className="px-1.5 py-0.5 text-[10px] font-medium bg-muted border-muted-foreground/20 text-muted-foreground">
                                  +{entryTags.length - 5}
                                </Badge>
                              )}
                            </div>
                          )}
                          {entry.coffee_analysis && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {entry.coffee_analysis}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          {entry.profile_json && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={(e) => handleDownload(entry, e)}
                              title="Download JSON"
                            >
                              <FileJs size={18} weight="bold" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={(e) => handleDelete(entry.id, e)}
                            disabled={deletingId === entry.id}
                            title="Delete"
                          >
                            <Trash size={18} weight="bold" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </Card>
    </motion.div>
  )
}

interface ProfileDetailViewProps {
  entry: HistoryEntry
  onBack: () => void
  onNewProfile: () => void
}

export function ProfileDetailView({ entry, onBack, onNewProfile }: ProfileDetailViewProps) {
  const { downloadJson } = useHistory()
  const [isDownloading, setIsDownloading] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const resultsCardRef = useRef<HTMLDivElement>(null)

  const handleDownload = async () => {
    try {
      setIsDownloading(true)
      await downloadJson(entry)
    } catch (err) {
      console.error('Failed to download:', err)
      alert('Profile JSON not available for this entry')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleSaveImage = async () => {
    if (!resultsCardRef.current) return
    
    try {
      const safeFilename = entry.profile_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      
      setIsCapturing(true)
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const dataUrl = await domToPng(resultsCardRef.current, {
        scale: 2,
        backgroundColor: '#09090b',
        style: {
          padding: '20px',
          boxSizing: 'content-box'
        }
      })
      
      setIsCapturing(false)
      
      const link = document.createElement('a')
      link.download = `${safeFilename}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error('Error saving results:', error)
      setIsCapturing(false)
      alert('Failed to save image. Please try again.')
    }
  }

  const parseProfileSections = (text: string) => {
    const sections: { title: string; content: string }[] = []
    // Note: 'Profile Created' is excluded as it's already shown in the header
    const sectionHeaders = [
      'Description',
      'Preparation',
      'Why This Works',
      'Special Notes'
    ]
    
    const remainingText = text
    
    sectionHeaders.forEach((header, index) => {
      const headerPattern = new RegExp(`${header}:\\s*`, 'i')
      const match = remainingText.match(headerPattern)
      
      if (match && match.index !== undefined) {
        const startIndex = match.index + match[0].length
        
        let endIndex = remainingText.length
        for (let i = index + 1; i < sectionHeaders.length; i++) {
          const nextHeaderPattern = new RegExp(`${sectionHeaders[i]}:`, 'i')
          const nextMatch = remainingText.match(nextHeaderPattern)
          if (nextMatch && nextMatch.index !== undefined) {
            endIndex = nextMatch.index
            break
          }
        }
        
        const content = remainingText.substring(startIndex, endIndex).trim()
        // Stop at "PROFILE JSON" section
        const jsonSectionIndex = content.indexOf('PROFILE JSON')
        let finalContent = jsonSectionIndex > 0 
          ? content.substring(0, jsonSectionIndex).trim() 
          : content
        
        // Also remove any code blocks that might contain JSON
        finalContent = finalContent.replace(/```json[\s\S]*?```/g, '').trim()
        finalContent = finalContent.replace(/```[\s\S]*?```/g, '').trim()
        
        if (finalContent) {
          sections.push({ title: header, content: finalContent })
        }
      }
    })
    
    return sections
  }

  const sections = parseProfileSections(entry.reply)

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
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
          {!isCapturing && (
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="shrink-0"
              >
                <CaretLeft size={24} weight="bold" />
              </Button>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-primary truncate">
                  {entry.profile_name}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {new Date(entry.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          )}
          {isCapturing && (
            <div className="text-neon-green w-full">
              <h2 className="text-2xl font-bold break-words">{entry.profile_name}</h2>
            </div>
          )}

        <div className="space-y-4">
          {entry.coffee_analysis && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold tracking-wide text-primary">
                Coffee Analysis
              </Label>
              <div className="p-4 bg-secondary rounded-lg border border-primary/30">
                <p className="text-base leading-relaxed">
                  <MarkdownText>{entry.coffee_analysis}</MarkdownText>
                </p>
              </div>
            </div>
          )}

          {sections.length > 0 ? (
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
            <div className="space-y-2">
              <Label className="text-sm font-semibold tracking-wide text-neon-pink">
                Profile
              </Label>
              <div className="p-4 bg-secondary rounded-lg border border-neon-pink/30">
                <p className="text-base leading-relaxed whitespace-pre-wrap">
                  <MarkdownText>{entry.reply}</MarkdownText>
                </p>
              </div>
            </div>
          )}
        </div>

        {!isCapturing && (
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={handleSaveImage}
              variant="outline"
              className="h-12 text-sm font-semibold border-primary/30 hover:bg-primary/10 transition-all active:scale-95"
              title="Save results as image"
            >
              <Image size={18} className="mr-1" weight="bold" />
              Image
            </Button>
            {entry.profile_json && (
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                variant="outline"
                className="h-12 text-sm font-semibold border-primary/30 hover:bg-primary/10 transition-all active:scale-95"
              >
                <FileJs size={18} className="mr-1" weight="bold" />
                JSON
              </Button>
            )}
            <Button
              onClick={onNewProfile}
              className={`h-12 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-95 ${!entry.profile_json ? 'col-span-2' : ''}`}
            >
              New Profile
            </Button>
          </div>
        )}
        </Card>
      </div>
    </motion.div>
  )
}
