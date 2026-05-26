'use client'

import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useScrollProgress } from './ScrollContext'

const PHASE_START = 0.58
const PHASE_FULL = 0.66
const PHASE_END = 0.78
const EASE_OUT_STRONG = [0.23, 1, 0.32, 1] as const

const TPS_LINES = [
  { time: '12:18:04', op: 'Swap', detail: '12.4k SOL → 2.32m USDC' },
  { time: '12:18:04', op: 'LP Add', detail: '880k USDC · Pool 7' },
  { time: '12:18:03', op: 'Settle', detail: '$184.21M batch · 412ms' },
  { time: '12:18:03', op: 'Stake', detail: '32k SOL · Validator 04' },
  { time: '12:18:02', op: 'Swap', detail: '4.1k SOL → 770k USDT' },
]

export default function TransactionsOverlay() {
  const { scrollProgress } = useScrollProgress()
  const shouldReduce = useReducedMotion()

  const opacity = useMemo(() => {
    if (scrollProgress < PHASE_START) return 0
    if (scrollProgress < PHASE_FULL) return (scrollProgress - PHASE_START) / (PHASE_FULL - PHASE_START)
    if (scrollProgress < PHASE_END) return 1
    return Math.max(0, 1 - (scrollProgress - PHASE_END) / 0.08)
  }, [scrollProgress])

  if (opacity === 0) return null

  return (
    <motion.div
      className="pointer-events-none absolute bottom-32 right-6 lg:right-10 z-10"
      style={{ opacity, fontFamily: 'var(--font-mono)' }}
      initial={shouldReduce ? false : { opacity: 0 }}
      animate={{ opacity }}
      transition={{ duration: 0.3, ease: EASE_OUT_STRONG }}
    >
      <div className="flex flex-col gap-1.5 text-right">
        <div
          className="flex items-baseline justify-end gap-3 mb-2"
          style={{ color: 'var(--text-mute)' }}
        >
          <span className="text-[10px] uppercase tracking-[0.18em]">TPS · 1h avg</span>
          <span className="text-xl tabular-nums" style={{ color: 'var(--text)' }}>4,210</span>
        </div>
        {TPS_LINES.map((line, i) => (
          <div
            key={i}
            className="flex items-baseline justify-end gap-3 text-[11px]"
            style={{ color: 'var(--text-dim)' }}
          >
            <span style={{ color: 'var(--text-mute)' }}>{line.time}</span>
            <span style={{ color: 'var(--accent-soft)' }}>{line.op}</span>
            <span className="tabular-nums">{line.detail}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
