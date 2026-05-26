'use client'

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
  type RefObject,
} from 'react'

interface ScrollState {
  scrollProgress: number
  scrollRef: MutableRefObject<number>
  containerRef: RefObject<HTMLDivElement | null>
}

const ScrollCtx = createContext<ScrollState | null>(null)

export function ScrollProvider({
  containerRef,
  children,
}: {
  containerRef: RefObject<HTMLDivElement | null>
  children: ReactNode
}) {
  const [scrollProgress, setScrollProgress] = useState(0)
  const scrollRef = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const total = rect.height - window.innerHeight
      const scrolled = -rect.top
      const p = total > 0 ? Math.max(0, Math.min(1, scrolled / total)) : 0
      scrollRef.current = p
      setScrollProgress(p)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [containerRef])

  return (
    <ScrollCtx.Provider value={{ scrollProgress, scrollRef, containerRef }}>
      {children}
    </ScrollCtx.Provider>
  )
}

export function useScrollProgress() {
  const ctx = useContext(ScrollCtx)
  if (!ctx) throw new Error('useScrollProgress must be used inside ScrollProvider')
  return ctx
}
