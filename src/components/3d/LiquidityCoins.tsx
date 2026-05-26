'use client'

import { useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Props {
  scrollOffset: MutableRefObject<number>
}

const COIN_COUNT = 26

export default function LiquidityCoins({ scrollOffset }: Props) {
  const groupRef = useRef<THREE.Group>(null)
  const meshRefs = useRef<(THREE.Mesh | null)[]>([])

  const coins = useMemo(() => {
    return Array.from({ length: COIN_COUNT }, (_, i) => ({
      basePos: new THREE.Vector3(
        (Math.random() - 0.5) * 13,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 6 - 0.5
      ),
      rotSpeed: 0.4 + Math.random() * 0.9,
      phase: Math.random() * Math.PI * 2,
      scale: 0.35 + Math.random() * 0.35,
      tone: i % 3,
    }))
  }, [])

  useFrame((state) => {
    const offset = scrollOffset.current
    const t = state.clock.elapsedTime

    const phaseStart = 0.22
    const phaseFull = 0.32
    const phaseFade = 0.55
    const phaseEnd = 0.62

    let visibility = 0
    if (offset > phaseStart) {
      const fadeIn = THREE.MathUtils.smoothstep(
        (offset - phaseStart) / (phaseFull - phaseStart),
        0,
        1
      )
      const fadeOut = 1 - THREE.MathUtils.smoothstep(
        (offset - phaseFade) / (phaseEnd - phaseFade),
        0,
        1
      )
      visibility = Math.min(fadeIn, fadeOut)
    }

    if (!groupRef.current) return
    groupRef.current.visible = visibility > 0.01
    if (!groupRef.current.visible) return

    coins.forEach((coin, i) => {
      const m = meshRefs.current[i]
      if (!m) return
      m.position.set(
        coin.basePos.x + Math.sin(t * 0.4 + coin.phase) * 0.22,
        coin.basePos.y + Math.cos(t * 0.5 + coin.phase) * 0.18,
        coin.basePos.z
      )
      m.rotation.x = t * coin.rotSpeed
      m.rotation.y = t * coin.rotSpeed * 1.3
      m.scale.setScalar(coin.scale * visibility)
    })
  })

  const colors = ['#9945FF', '#14F195', '#22D3EE']

  return (
    <group ref={groupRef}>
      {coins.map((c, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshRefs.current[i] = el
          }}
        >
          <cylinderGeometry args={[0.4, 0.4, 0.08, 28]} />
          <meshPhysicalMaterial
            color={colors[c.tone]}
            metalness={0.85}
            roughness={0.18}
            emissive={colors[c.tone]}
            emissiveIntensity={0.18}
            clearcoat={0.6}
            clearcoatRoughness={0.2}
          />
        </mesh>
      ))}
    </group>
  )
}
