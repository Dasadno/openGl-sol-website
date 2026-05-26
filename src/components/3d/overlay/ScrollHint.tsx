'use client'

import { motion, useReducedMotion } from 'framer-motion'

const EASE_OUT_STRONG = [0.23, 1, 0.32, 1] as const

export default function ScrollHint() {
  const shouldReduce = useReducedMotion()

  return (
    <motion.div
      className="absolute bottom-8 right-6 lg:bottom-10 lg:right-10 flex flex-col items-center gap-2 pointer-events-none"
      initial={shouldReduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduce ? { duration: 0 } : { duration: 0.4, delay: 2.4, ease: EASE_OUT_STRONG }}
      style={{ color: 'var(--text-mute)' }}
    >
      <span
        className="text-[9px] uppercase tracking-[0.32em]"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        Scroll
      </span>
      <span
        aria-hidden
        className="block w-px h-9"
        style={{
          background: 'linear-gradient(180deg, var(--text-mute), transparent)',
        }}
      />
      <span aria-hidden className="text-xs leading-none">↓</span>
    </motion.div>
  )
}
