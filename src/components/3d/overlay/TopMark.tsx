'use client'

import { motion, useReducedMotion } from 'framer-motion'

const EASE_OUT_STRONG = [0.23, 1, 0.32, 1] as const

export default function TopMark() {
  const shouldReduce = useReducedMotion()

  return (
    <motion.div
      className="absolute top-6 left-6 lg:top-8 lg:left-10 flex items-center gap-3 text-xs tracking-wide pointer-events-auto"
      initial={shouldReduce ? false : { opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduce ? { duration: 0 } : { duration: 0.6, ease: EASE_OUT_STRONG }}
      style={{ color: 'var(--text)' }}
    >
      <span
        aria-hidden
        className="w-3.5 h-3.5 rounded-sm"
        style={{ background: 'linear-gradient(135deg, var(--accent), oklch(55% 0.18 200))' }}
      />
      <b className="font-medium">SolanaDefi</b>
      <span style={{ color: 'var(--text-mute)' }}>·</span>
      <span
        style={{ color: 'var(--text-mute)' }}
        className="text-[10px] uppercase tracking-[0.22em]"
      >
        Atelier · Mainnet v2
      </span>
    </motion.div>
  )
}
