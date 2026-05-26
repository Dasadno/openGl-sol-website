'use client'

import { useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface OrbitalGlowProps {
  scrollOffset: MutableRefObject<number>
}

// Atmospheric soft-glow spheres that orbit behind the logo.
// Active during chapters 2–4 (scroll ~0.12 → 0.55).
export default function OrbitalGlow({ scrollOffset }: OrbitalGlowProps) {
  const groupRef = useRef<THREE.Group>(null)

  const orbs = useMemo(
    () => [
      { radius: 3.4, speed: 0.10, yPhase: 0.4, size: 0.7, color: new THREE.Color('#7b3aed'), angle: 0 },
      { radius: 4.2, speed: 0.06, yPhase: -0.6, size: 1.1, color: new THREE.Color('#5ee7c8'), angle: Math.PI * 0.7 },
      { radius: 3.0, speed: 0.14, yPhase: 0.9, size: 0.55, color: new THREE.Color('#a8e2ff'), angle: Math.PI * 1.3 },
      { radius: 4.6, speed: 0.04, yPhase: -0.2, size: 1.3, color: new THREE.Color('#c8a8ff'), angle: Math.PI * 1.9 },
    ],
    []
  )

  const meshRefs = useRef<(THREE.Mesh | null)[]>([])

  useFrame((state) => {
    if (!groupRef.current) return
    const time = state.clock.elapsedTime
    const offset = scrollOffset.current

    // Visibility window — fade in 0.08→0.18, full to 0.45, fade out by 0.58
    let alpha = 0
    if (offset > 0.08 && offset < 0.58) {
      if (offset < 0.18) alpha = (offset - 0.08) / 0.10
      else if (offset < 0.45) alpha = 1
      else alpha = 1 - (offset - 0.45) / 0.13
    }
    groupRef.current.visible = alpha > 0.01

    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return
      const o = orbs[i]
      const ang = o.angle + time * o.speed
      mesh.position.set(
        Math.sin(ang) * o.radius,
        o.yPhase + Math.sin(time * o.speed * 1.5 + i) * 0.3,
        Math.cos(ang) * o.radius
      )
      const mat = mesh.material as THREE.MeshBasicMaterial
      mat.opacity = alpha * 0.28
    })
  })

  return (
    <group ref={groupRef}>
      {orbs.map((o, i) => (
        <mesh
          key={i}
          ref={(m) => {
            meshRefs.current[i] = m
          }}
        >
          <sphereGeometry args={[o.size, 24, 24]} />
          <meshBasicMaterial
            color={o.color}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}
