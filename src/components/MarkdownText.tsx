import React from 'react'

interface MarkdownTextProps {
  children?: string
  text?: string
  className?: string
}

export function MarkdownText({ children, text, className = '' }: MarkdownTextProps) {
  const content = text ?? children ?? ''
  
  const renderMarkdown = (textContent: string): React.ReactNode[] => {
    // Split by newlines first to preserve line breaks
    const lines = textContent.split('\n')
    const result: React.ReactNode[] = []
    
    lines.forEach((line, lineIndex) => {
      // Process inline markdown within each line
      const processedLine = processInlineMarkdown(line, lineIndex)
      result.push(...processedLine)
      
      // Add line break after each line except the last
      if (lineIndex < lines.length - 1) {
        result.push(<br key={`br-${lineIndex}`} />)
      }
    })
    
    return result
  }

  const processInlineMarkdown = (text: string, lineIndex: number): React.ReactNode[] => {
    const parts: React.ReactNode[] = []
    let key = 0

    // Combined regex for bold, italic, and code
    const inlineRegex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g
    let lastIndex = 0
    let match

    while ((match = inlineRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index))
      }

      if (match[2]) {
        // ***bold italic***
        parts.push(
          <strong key={`bi-${lineIndex}-${key++}`} className="font-semibold italic">
            {match[2]}
          </strong>
        )
      } else if (match[3]) {
        // **bold**
        parts.push(
          <strong key={`b-${lineIndex}-${key++}`} className="font-semibold">
            {match[3]}
          </strong>
        )
      } else if (match[4]) {
        // *italic*
        parts.push(
          <em key={`i-${lineIndex}-${key++}`} className="italic">
            {match[4]}
          </em>
        )
      } else if (match[5]) {
        // `code`
        parts.push(
          <code key={`c-${lineIndex}-${key++}`} className="bg-muted px-1 py-0.5 rounded text-sm font-mono">
            {match[5]}
          </code>
        )
      }

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex))
    }

    // If no matches found, return original text
    return parts.length > 0 ? parts : [text]
  }

  return (
    <span className={className}>
      {renderMarkdown(content)}
    </span>
  )
}
