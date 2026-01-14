import { useEffect, useState } from "react"

const DESKTOP_BREAKPOINT = 768

/**
 * Hook to detect if the current device is a desktop (non-mobile)
 * Returns true if the viewport width is >= 768px
 * @returns boolean True if on desktop, false if on mobile
 */
export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`)
    const onChange = () => {
      setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isDesktop
}
