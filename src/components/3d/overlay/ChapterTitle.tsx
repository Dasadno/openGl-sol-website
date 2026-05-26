'use client'

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { CHAPTERS } from '../chapters'

const EASE_OUT_STRONG = [0.23, 1, 0.32, 1] as const

interface ChapterTitleProps {
  chapterIndex: number // 1..6
}

export default function ChapterTitle({ chapterIndex }: ChapterTitleProps) {
  const shouldReduce = useReducedMotion()
  const chapter = CHAPTERS.find((c) => c.index === chapterIndex) ?? CHAPTERS[0]

  return (
    <div className="absolute top-6 right-6 lg:top-8 lg:right-10 text-right pointer-events-none">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={chapter.index}
          initial={shouldReduce ? false : { opacity: 0, filter: 'blur(2px)', x: 12 }}
          animate={{ opacity: 1, filter: 'blur(0px)', x: 0 }}
          exit={shouldReduce ? { opacity: 0 } : { opacity: 0, filter: 'blur(2px)' }}
          transition={shouldReduce ? { duration: 0 } : { duration: 0.3, ease: EASE_OUT_STRONG }}
        >
          <div
            className="text-base lg:text-lg italic"
            style={{
              fontFamily: 'var(--font-italic-serif)',
              color: 'var(--text-dim)',
            }}
          >
            {chapter.title}
          </div>
          <div
            className="mt-1 text-[9px] uppercase tracking-[0.24em]"
            style={{ color: 'var(--text-mute)', fontFamily: 'var(--font-mono)' }}
          >
            Chapter {String(chapter.index).padStart(2, '0')} / {String(CHAPTERS.length).padStart(2, '0')}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
