'use client'

import { useEffect, useRef } from 'react'
import { useScrollProgress } from './ScrollContext'

interface CutsceneControllerProps {
  triggerProgress?: number   // 0..1 — scroll progress that fires the cutscene
  endProgress?: number       // 0..1 — scroll progress at the end of cutscene
  durationMs?: number        // length of the autoscroll in ms
}

// easeOutCubic — fast start to absorb the user's wheel momentum, then a
// long deceleration. Using easeInOutCubic would create a noticeable jerk
// at trigger because the auto-scroll starts at zero velocity while the
// user's scroll was still accelerating.
function ease(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Cinematic auto-scroll for the Vortex chapter. When the user's scroll
 * crosses `triggerProgress`, the page is pinned for `durationMs`: user
 * scroll/wheel/touch/key input is blocked, and `window.scrollY` is
 * programmatically animated to the position corresponding to `endProgress`
 * with a cubic ease. The ScrollContext's listener picks up the synthetic
 * scrolls and drives all scene animations as if the user scrolled normally.
 *
 * Single-fire per session; respects prefers-reduced-motion.
 */
export default function CutsceneController({
  triggerProgress = 0.75,
  // End past the Ch 7→Ch 8 boundary (0.875) so the cutscene also covers
  // the blur-cut exit window (0.875–0.881) and postprocessing fade-out
  // (up to 0.890). Without this, the auto-scroll would stop with FOV
  // still boosted to ~104° and tunnel echoes lingering — user would have
  // to manually scroll a bit more to reach the settled Ch 8 orbital view.
  endProgress = 0.892,
  durationMs = 7000,
}: CutsceneControllerProps) {
  const { scrollRef, containerRef } = useScrollProgress()
  const playingRef = useRef(false)
  // Re-fires on every downward crossing of triggerProgress (no single-fire
  // lock). The crossing detection itself prevents continuous re-triggering
  // during the cutscene since `prevProgress` advances monotonically with
  // the auto-scroll.
  // `prevProgress` captures the previous frame's scroll to detect a true
  // downward crossing — prevents firing when the page is loaded with a
  // restored scroll position already past `triggerProgress`.
  const prevProgress = useRef<number | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return

    const blockWheelOrTouch = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
    }
    const blockKeys = (e: KeyboardEvent) => {
      const k = e.code
      if (
        k === 'Space' ||
        k === 'PageDown' ||
        k === 'PageUp' ||
        k === 'ArrowDown' ||
        k === 'ArrowUp' ||
        k === 'Home' ||
        k === 'End'
      ) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    function startCutscene() {
      if (playingRef.current) return
      const container = containerRef.current
      if (!container) return
      playingRef.current = true

      // Convert scroll-progress (0..1 over the scroll container) to absolute
      // window.scrollY. Mirrors the math in ScrollContext:
      //   scrollRef = -rect.top / (rect.height - innerHeight)
      // so window.scrollY for a target progress P is:
      //   containerTopAbs + P * (rect.height - innerHeight)
      const rect = container.getBoundingClientRect()
      const total = rect.height - window.innerHeight
      const containerTopAbs = window.scrollY + rect.top
      const startY = window.scrollY
      const targetY = containerTopAbs + endProgress * total
      const distance = targetY - startY
      if (distance <= 1 || total <= 0) {
        playingRef.current = false
        return
      }

      window.addEventListener('wheel', blockWheelOrTouch, { passive: false, capture: true })
      window.addEventListener('touchmove', blockWheelOrTouch, { passive: false, capture: true })
      window.addEventListener('keydown', blockKeys, { capture: true })

      const releaseInput = () => {
        window.removeEventListener('wheel', blockWheelOrTouch, { capture: true } as EventListenerOptions)
        window.removeEventListener('touchmove', blockWheelOrTouch, { capture: true } as EventListenerOptions)
        window.removeEventListener('keydown', blockKeys, { capture: true } as EventListenerOptions)
      }

      const t0 = performance.now()
      const failsafe = window.setTimeout(() => {
        playingRef.current = false
        releaseInput()
      }, durationMs + 1500)

      function tick(now: number) {
        if (!playingRef.current) {
          releaseInput()
          window.clearTimeout(failsafe)
          return
        }
        const elapsed = now - t0
        const t = Math.min(1, elapsed / durationMs)
        const eased = ease(t)
        window.scrollTo({ top: startY + distance * eased, behavior: 'auto' })
        if (t < 1) {
          requestAnimationFrame(tick)
        } else {
          playingRef.current = false
          releaseInput()
          window.clearTimeout(failsafe)
        }
      }
      requestAnimationFrame(tick)
    }

    let raf = 0
    const probe = () => {
      const curr = scrollRef.current
      if (prevProgress.current === null) {
        // First observation after mount — establish baseline; never fires
        // on initial load even if the browser restored a scroll past trigger.
        prevProgress.current = curr
        raf = requestAnimationFrame(probe)
        return
      }
      if (!playingRef.current) {
        // Fire on every downward crossing of the trigger.
        if (prevProgress.current < triggerProgress && curr >= triggerProgress) {
          startCutscene()
        }
      }
      prevProgress.current = curr
      raf = requestAnimationFrame(probe)
    }
    raf = requestAnimationFrame(probe)

    return () => {
      cancelAnimationFrame(raf)
      playingRef.current = false
    }
  }, [scrollRef, triggerProgress, endProgress, durationMs])

  return null
}
