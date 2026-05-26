'use client'

import { type ReactNode } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { CHAPTERS } from '../chapters'

const EASE_OUT_STRONG = [0.23, 1, 0.32, 1] as const

interface EditionNoteProps {
  chapterIndex: number // 1..6
}

function renderHeadline(html: string): ReactNode[] {
  const parts = html.split(/(<em>|<\/em>)/)
  let inEm = false
  const nodes: ReactNode[] = []
  parts.forEach((part, i) => {
    if (part === '<em>') {
      inEm = true
      return
    }
    if (part === '</em>') {
      inEm = false
      return
    }
    if (!part) return
    if (inEm) {
      nodes.push(
        <em
          key={i}
          style={{
            fontFamily: 'var(--font-italic-serif)',
            fontStyle: 'italic',
            fontWeight: 400,
            color: 'var(--accent-soft)',
          }}
        >
          {part}
        </em>
      )
    } else {
      nodes.push(<span key={i}>{part}</span>)
    }
  })
  return nodes
}

export default function EditionNote({ chapterIndex }: EditionNoteProps) {
  const shouldReduce = useReducedMotion()
  const chapter = CHAPTERS.find((c) => c.index === chapterIndex) ?? CHAPTERS[0]

  return (
    <div className="absolute bottom-16 left-6 lg:bottom-20 lg:left-10 max-w-[50%] pointer-events-none">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={chapter.index}
          initial={shouldReduce ? false : { opacity: 0, filter: 'blur(2px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={shouldReduce ? { opacity: 0 } : { opacity: 0, filter: 'blur(2px)' }}
          transition={shouldReduce ? { duration: 0 } : { duration: 0.3, ease: EASE_OUT_STRONG }}
        >
          <div className="flex items-center gap-3 mb-5">
            <span
              aria-hidden
              className="h-px"
              style={{ width: '32px', background: 'var(--accent)' }}
            />
            <span
              className="text-[10px] uppercase tracking-[0.28em]"
              style={{ color: 'var(--text-mute)' }}
            >
              {chapter.kicker}
            </span>
          </div>
          <h1
            className="font-display font-light text-[clamp(28px,4vw,56px)] leading-[1.04]"
            style={{ color: 'var(--text)', letterSpacing: '-0.03em' }}
          >
            {renderHeadline(chapter.headline)}
          </h1>
          <p
            className="mt-4 max-w-[38ch] text-sm leading-relaxed"
            style={{ color: 'var(--text-dim)' }}
          >
            {chapter.caption}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
