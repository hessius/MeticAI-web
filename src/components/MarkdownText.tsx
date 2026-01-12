import React from 'react'

interface MarkdownTextProps {
  children: string
  className?: string
}

export function MarkdownText({ children, className = '' }: MarkdownTextProps) {
  const renderMarkdown = (text: string) => {
    const parts: (string | React.ReactElement)[] = []
    let lastIndex = 0
    let key = 0

    // Match **bold** text
    const boldRegex = /\*\*(.+?)\*\*/g
    let match

    while ((match = boldRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index))
      }
      
      // Add bold text
      parts.push(
        <strong key={`bold-${key++}`} className="font-semibold">
          {match[1]}
        </strong>
      )
      
      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex))
    }

    return parts.length > 0 ? parts : text
  }

  return (
    <span className={className}>
      {renderMarkdown(children)}
    </span>
  )
}
