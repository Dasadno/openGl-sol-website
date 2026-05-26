// saas-landing/src/components/3d/tunnel/FractalTunnel.tsx
'use client'

import { useEffect, useRef, type MutableRefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type {
  BloomEffect,
  ChromaticAberrationEffect,
  VignetteEffect,
  NoiseEffect,
} from 'postprocessing'
import RaymarchedTunnel from './RaymarchedTunnel'

// Scroll segment occupied by Ch 7 in a 9-chapter story: (7-1)/8 = 0.75 to 7/8 = 0.875
const CHAPTER_RANGE = { start: 0.75, end: 0.875 } as const
const FADE_IN = 0.02
// Postprocessing/fog peak stays at full intensity through the chapter boundary
// (the blur-cut moment) and fades AFTER, into the first ~1.5% of Ch 8 — bloom
// + chromatic + fog mask the camera teleport. Fading before the cut would
// leave it visually exposed.
const FX_PEAK_END = CHAPTER_RANGE.end                // 0.875
const FX_FADE_OUT_END = CHAPTER_RANGE.end + 0.015    // 0.890

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

interface VortexEffects {
  bloom: BloomEffect
  chromatic: ChromaticAberrationEffect
  vignette: VignetteEffect
  noise: NoiseEffect
}

interface FractalTunnelProps {
  scrollOffsetRef: MutableRefObject<number>
  effects: VortexEffects
}

const IOS_UA_REGEX = /iPad|iPhone|iPod/

export default function FractalTunnel({ scrollOffsetRef, effects }: FractalTunnelProps) {
  const groupRef = useRef<THREE.Group>(null!)
  // Per-frame alpha for the raymarched shader. FractalTunnel owns the scroll
  // math; RaymarchedTunnel reads this ref each frame in its own useFrame.
  const shaderAlphaRef = useRef(0)
  const { scene } = useThree()

  // iOS gate: cap intensity to keep mobile GPUs alive
  const isIOS =
    typeof window !== 'undefined' && IOS_UA_REGEX.test(window.navigator.userAgent)
  const bloomCap = isIOS ? 1.4 : 1.8
  const chromaXCap = isIOS ? 0.0018 : 0.0028
  const chromaYCap = isIOS ? 0.0022 : 0.0034

  // Snapshot original fog values so we can restore them outside Ch 7
  const fogDefaults = useRef<{ near: number; far: number } | null>(null)
  useEffect(() => {
    if (scene.fog && scene.fog instanceof THREE.Fog) {
      fogDefaults.current = { near: scene.fog.near, far: scene.fog.far }
    }
  }, [scene.fog])

  const fxDefaults = useRef({
    bloom: 1.1,
    bloomThreshold: 0.55,
    chromaX: 0.0006,
    chromaY: 0.0009,
    vignette: 0.78,
    noise: 0.035,
  })

  useFrame(() => {
    const t = scrollOffsetRef.current

    // Plateau-fade: full intensity through the chapter boundary, dissolves
    // afterward across the first ~1.5% of Ch 8.
    const inOut =
      smoothstep(CHAPTER_RANGE.start, CHAPTER_RANGE.start + FADE_IN, t) -
      smoothstep(FX_PEAK_END, FX_FADE_OUT_END, t)

    shaderAlphaRef.current = inOut
    groupRef.current.visible = inOut > 0.001

    // Postprocessing boost
    const { bloom, chromatic, vignette, noise } = effects
    bloom.intensity = THREE.MathUtils.lerp(fxDefaults.current.bloom, bloomCap, inOut)
    bloom.luminanceMaterial.threshold = THREE.MathUtils.lerp(
      fxDefaults.current.bloomThreshold,
      0.45,
      inOut,
    )
    chromatic.offset.set(
      THREE.MathUtils.lerp(fxDefaults.current.chromaX, chromaXCap, inOut),
      THREE.MathUtils.lerp(fxDefaults.current.chromaY, chromaYCap, inOut),
    )
    vignette.darkness = THREE.MathUtils.lerp(fxDefaults.current.vignette, 0.92, inOut)
    noise.blendMode.opacity.value = THREE.MathUtils.lerp(fxDefaults.current.noise, 0.06, inOut)

    // Fog tightening
    if (scene.fog && scene.fog instanceof THREE.Fog && fogDefaults.current) {
      scene.fog.near = THREE.MathUtils.lerp(fogDefaults.current.near, 8, inOut)
      scene.fog.far = THREE.MathUtils.lerp(fogDefaults.current.far, 22, inOut)
    }
  })

  return (
    <group ref={groupRef}>
      <RaymarchedTunnel alphaRef={shaderAlphaRef} />
    </group>
  )
}
