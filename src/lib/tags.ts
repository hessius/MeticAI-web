// Preset tags with categories for filtering and display
export const PRESET_TAGS = [
  { label: 'Light Body', category: 'body' },
  { label: 'Medium Body', category: 'body' },
  { label: 'Heavy Body', category: 'body' },
  { label: 'Florals', category: 'flavor' },
  { label: 'Acidity', category: 'flavor' },
  { label: 'Fruitiness', category: 'flavor' },
  { label: 'Chocolate', category: 'flavor' },
  { label: 'Nutty', category: 'flavor' },
  { label: 'Caramel', category: 'flavor' },
  { label: 'Berry', category: 'flavor' },
  { label: 'Citrus', category: 'flavor' },
  { label: 'Funky', category: 'flavor' },
  { label: 'Thin', category: 'mouthfeel' },
  { label: 'Mouthfeel', category: 'mouthfeel' },
  { label: 'Creamy', category: 'mouthfeel' },
  { label: 'Syrupy', category: 'mouthfeel' },
  { label: 'Italian', category: 'style' },
  { label: 'Modern', category: 'style' },
  { label: 'Lever', category: 'style' },
  { label: 'Long', category: 'extraction' },
  { label: 'Short', category: 'extraction' },
  { label: 'Turbo', category: 'extraction' },
  { label: 'Light Roast', category: 'roast' },
  { label: 'Medium Roast', category: 'roast' },
  { label: 'Dark Roast', category: 'roast' },
  { label: 'Sweet', category: 'characteristic' },
  { label: 'Balanced', category: 'characteristic' },
  { label: 'Bloom', category: 'process' },
  { label: 'Pre-infusion', category: 'process' },
  { label: 'Pulse', category: 'process' }
] as const

export type TagCategory = typeof PRESET_TAGS[number]['category']

export const CATEGORY_COLORS: Record<TagCategory, string> = {
  body: 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 text-amber-200',
  flavor: 'bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20 text-rose-200',
  mouthfeel: 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 text-blue-200',
  style: 'bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20 text-purple-200',
  extraction: 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20 text-green-200',
  roast: 'bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20 text-orange-200',
  characteristic: 'bg-cyan-500/10 border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-200',
  process: 'bg-indigo-500/10 border-indigo-500/30 hover:bg-indigo-500/20 text-indigo-200',
}

export const CATEGORY_COLORS_SELECTED: Record<TagCategory, string> = {
  body: 'bg-amber-500 border-amber-500 text-white',
  flavor: 'bg-rose-500 border-rose-500 text-white',
  mouthfeel: 'bg-blue-500 border-blue-500 text-white',
  style: 'bg-purple-500 border-purple-500 text-white',
  extraction: 'bg-green-500 border-green-500 text-white',
  roast: 'bg-orange-500 border-orange-500 text-white',
  characteristic: 'bg-cyan-500 border-cyan-500 text-white',
  process: 'bg-indigo-500 border-indigo-500 text-white',
}

// Get category for a tag label
export function getTagCategory(label: string): TagCategory | null {
  const tag = PRESET_TAGS.find(t => t.label.toLowerCase() === label.toLowerCase())
  return tag ? tag.category : null
}

// Get color classes for a tag
export function getTagColorClass(label: string, selected = false): string {
  const category = getTagCategory(label)
  if (!category) return 'bg-gray-500/10 border-gray-500/30 text-gray-200'
  return selected ? CATEGORY_COLORS_SELECTED[category] : CATEGORY_COLORS[category]
}

// Extract known tags from a user preferences string
export function extractTagsFromPreferences(preferences: string | null): string[] {
  if (!preferences) return []
  
  const prefLower = preferences.toLowerCase()
  return PRESET_TAGS
    .filter(tag => prefLower.includes(tag.label.toLowerCase()))
    .map(tag => tag.label)
}

// Get all unique tags from history entries
export function getAllTagsFromEntries(entries: Array<{ user_preferences: string | null }>): string[] {
  const allTags = new Set<string>()
  
  entries.forEach(entry => {
    const tags = extractTagsFromPreferences(entry.user_preferences)
    tags.forEach(tag => allTags.add(tag))
  })
  
  return Array.from(allTags).sort()
}
