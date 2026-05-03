import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * Combined useIsMobile Hook
 * * Returns:
 * - null: Initial state (prevents hydration mismatch/layout shifts)
 * - true: Mobile device (< 768px)
 * - false: Desktop device (>= 768px)
 */
export function useIsMobile() {
  // Start with null to indicate detection hasn't happened yet
  const [isMobile, setIsMobile] = React.useState(null)

  React.useEffect(() => {
    // Define the media query listener
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    // Set initial value on mount
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)

    // Add listener for screen size changes
    mql.addEventListener("change", onChange)
    
    // Clean up listener on unmount
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}