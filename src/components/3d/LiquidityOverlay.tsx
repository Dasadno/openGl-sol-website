'use client'

import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useSolPrice, formatCurrency, formatNumber } from '@/hooks/useSolPrice'
import { useScrollProgress } from './ScrollContext'

const PHASE_START = 0.18
const PHASE_FULL = 0.28
const PHASE_END = 0.40
const EASE_OUT_STRONG = [0.23, 1, 0.32, 1] as const

export default function LiquidityOverlay() {
  const { scrollProgress } = useScrollProgress()
  const { marketCap, volume24h, change24h } = useSolPrice()
  const shouldReduce = useReducedMotion()

  const opacity = useMemo(() => {
    if (scrollProgress < PHASE_START) return 0
    if (scrollProgress < PHASE_FULL) return (scrollProgress - PHASE_START) / (PHASE_FULL - PHASE_START)
    if (scrollProgress < PHASE_END) return 1
    return Math.max(0, 1 - (scrollProgress - PHASE_END) / 0.08)
  }, [scrollProgress])

  if (opacity === 0) return null

  const tvl = marketCap !== null ? marketCap * 0.18 : null

  const metrics: Array<{ label: string; value: string }> = [
    { label: 'TVL', value: tvl !== null ? formatCurrency(tvl, true) : '—' },
    { label: '24h vol', value: volume24h !== null ? formatCurrency(volume24h, true) : '—' },
    { label: 'SOL · 24h', value: change24h !== null ? `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%` : '—' },
    { label: 'Active wallets', value: formatNumber(2_100_000) },
  ]

  return (
    <motion.div
      className="pointer-events-none absolute bottom-32 right-6 lg:right-10 z-10"
      style={{ opacity }}
      initial={shouldReduce ? false : { opacity: 0 }}
      animate={{ opacity }}
      transition={{ duration: 0.3, ease: EASE_OUT_STRONG }}
    >
      <div
        className="flex flex-col gap-2 text-right"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {metrics.map((m) => (
          <div key={m.label} className="flex items-baseline justify-end gap-3">
            <span
              className="text-[10px] uppercase tracking-[0.18em]"
              style={{ color: 'var(--text-mute)' }}
            >
              {m.label}
            </span>
            <span
              className="text-base tabular-nums"
              style={{ color: 'var(--text)' }}
            >
              {m.value}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
