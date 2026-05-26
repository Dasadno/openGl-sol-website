'use client'

import { useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface RippleRingsProps {
  scrollOffset: MutableRefObject<number>
}

// Concentric rings emanating from the logo. Active during chapters 3–5
// (Settlement / Throughput). Each ring loops scale-up + fade-out on its own phase.
export default function RippleRings({ scrollOffset }: RippleRingsProps) {
  const groupRef = useRef<THREE.Group>(null)
  const RING_COUNT = 5
  const LOOP_DURATION = 4.2 // seconds for a full expand-and-fade cycle

  const ringRefs = useRef<(THREE.Mesh | null)[]>([])

  const ringConfig = useMemo(
    () =>
      Array.from({ length: RING_COUNT }, (_, i) => ({
        phaseOffset: (i / RING_COUNT) * LOOP_DURATION,
        color: new THREE.Color(i % 2 === 0 ? '#a78bfa' : '#5ee7c8'),
      })),
    []
  )

  useFrame((state) => {
    if (!groupRef.current) return
    const time = state.clock.elapsedTime
    const offset = scrollOffset.current

    // Visibility 0.30 → 0.62
    let alpha = 0
    if (offset > 0.28 && offset < 0.66) {
      if (offset < 0.38) alpha = (offset - 0.28) / 0.10
      else if (offset < 0.56) alpha = 1
      else alpha = 1 - (offset - 0.56) / 0.10
    }
    groupRef.current.visible = alpha > 0.01

    ringRefs.current.forEach((ring, i) => {
      if (!ring) return
      const cfg = ringConfig[i]
      const tLocal = ((time + cfg.phaseOffset) % LOOP_DURATION) / LOOP_DURATION // 0..1
      const radius = 0.6 + tLocal * 4.5
      ring.scale.setScalar(radius)
      // Smooth in-out: fade in for first 15%, plateau, fade out last 50%
      let ringAlpha = 0
      if (tLocal < 0.15) ringAlpha = tLocal / 0.15
      else if (tLocal < 0.5) ringAlpha = 1
      else ringAlpha = 1 - (tLocal - 0.5) / 0.5
      const mat = ring.material as THREE.MeshBasicMaterial
      mat.opacity = ringAlpha * alpha * 0.6
      // Slight tilt — rings sit on a tilted plane for depth, not flat
      ring.rotation.x = -Math.PI / 2 + Math.sin(time * 0.2 + i) * 0.08
    })
  })

  return (
    <group ref={groupRef}>
      {ringConfig.map((cfg, i) => (
        <mesh
          key={i}
          ref={(m) => {
            ringRefs.current[i] = m
          }}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.95, 1.0, 96]} />
          <meshBasicMaterial
            color={cfg.color}
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}
