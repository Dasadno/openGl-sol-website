'use client'

import { useEffect, useRef, useState } from 'react'

interface AnimatedCounterProps {
  value: number | null
  active: boolean
  format: (n: number) => string
  duration?: number
}

export default function AnimatedCounter({
  value,
  active,
  format,
  duration = 1200,
}: AnimatedCounterProps) {
  const [displayed, setDisplayed] = useState(0)
  const fromRef = useRef(0)
  const targetRef = useRef(0)
  const startRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (value === null || value === undefined || !active) return

    fromRef.current = displayed
    targetRef.current = value
    startRef.current = null

    const tick = (t: number) => {
      if (startRef.current === null) startRef.current = t
      const elapsed = t - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const next =
        fromRef.current + (targetRef.current - fromRef.current) * eased
      setDisplayed(next)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, active, duration])

  if (value === null || value === undefined) return <>—</>
  return <>{format(displayed)}</>
}
