'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { CHAPTERS } from '../chapters'

const EASE_OUT_STRONG = [0.23, 1, 0.32, 1] as const

interface ChapterProgressProps {
  chapterIndex: number // 1..6
}

export default function ChapterProgress({ chapterIndex }: ChapterProgressProps) {
  const shouldReduce = useReducedMotion()

  return (
    <div className="absolute bottom-7 left-6 lg:bottom-8 lg:left-10 flex gap-1.5 pointer-events-none">
      {CHAPTERS.map((c) => {
        const isActive = c.index === chapterIndex
        return (
          <motion.span
            key={c.index}
            initial={shouldReduce ? false : { scaleX: 0.4, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={
              shouldReduce
                ? { duration: 0 }
                : { duration: 0.4, delay: 2.0 + c.index * 0.05, ease: EASE_OUT_STRONG }
            }
            className="h-px transition-colors duration-300"
            style={{
              width: '20px',
              background: isActive ? 'var(--text)' : 'var(--line-strong)',
              transformOrigin: 'left center',
            }}
          />
        )
      })}
    </div>
  )
}
