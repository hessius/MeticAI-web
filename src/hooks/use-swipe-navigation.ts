import { useEffect, useRef } from "react"

interface SwipeNavigationOptions {
  onSwipeRight?: () => void
  onSwipeLeft?: () => void
  enabled?: boolean
  threshold?: number // Minimum distance in pixels to trigger swipe
  velocityThreshold?: number // Minimum velocity to trigger swipe
}

interface TouchData {
  startX: number
  startY: number
  startTime: number
}

/**
 * Hook to handle swipe gestures for navigation on mobile devices
 * 
 * @param options Configuration options for swipe behavior
 * @param options.onSwipeRight Callback for right swipe (typically back navigation)
 * @param options.onSwipeLeft Callback for left swipe
 * @param options.enabled Whether swipe detection is active (default: true)
 * @param options.threshold Minimum swipe distance in pixels (default: 50)
 * @param options.velocityThreshold Minimum swipe velocity (default: 0.3)
 */
export function useSwipeNavigation({
  onSwipeRight,
  onSwipeLeft,
  enabled = true,
  threshold = 50,
  velocityThreshold = 0.3,
}: SwipeNavigationOptions) {
  const touchDataRef = useRef<TouchData | null>(null)

  useEffect(() => {
    if (!enabled) return

    const handleTouchStart = (e: TouchEvent) => {
      // Only track single-finger touches
      if (e.touches.length !== 1) {
        // Clear any existing single-touch data to avoid misclassifying multi-touch as a swipe
        touchDataRef.current = null
        return
      }

      const touch = e.touches[0]
      touchDataRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchDataRef.current || e.changedTouches.length !== 1) return

      const touch = e.changedTouches[0]
      const { startX, startY, startTime } = touchDataRef.current

      const deltaX = touch.clientX - startX
      const deltaY = touch.clientY - startY
      const deltaTime = Date.now() - startTime

      // Calculate velocity (pixels per millisecond)
      const velocity = Math.abs(deltaX) / deltaTime

      // Check if swipe is primarily horizontal
      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY)

      // Check if swipe meets threshold and velocity requirements
      const meetsThreshold = Math.abs(deltaX) > threshold
      const meetsVelocity = velocity > velocityThreshold

      if (isHorizontal && meetsThreshold && meetsVelocity) {
        if (deltaX > 0 && onSwipeRight) {
          // Swipe right
          onSwipeRight()
        } else if (deltaX < 0 && onSwipeLeft) {
          // Swipe left
          onSwipeLeft()
        }
      }

      touchDataRef.current = null
    }

    const handleTouchCancel = () => {
      touchDataRef.current = null
    }

    // Add event listeners to document for global swipe detection
    // Note: This hook is designed to be used once at the app level (e.g., in App.tsx)
    // If using multiple instances, consider implementing a singleton pattern or
    // attaching listeners to a specific container element instead
    document.addEventListener("touchstart", handleTouchStart, { passive: true })
    document.addEventListener("touchend", handleTouchEnd, { passive: true })
    document.addEventListener("touchcancel", handleTouchCancel, { passive: true })

    return () => {
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchend", handleTouchEnd)
      document.removeEventListener("touchcancel", handleTouchCancel)
    }
  }, [enabled, onSwipeRight, onSwipeLeft, threshold, velocityThreshold])
}
