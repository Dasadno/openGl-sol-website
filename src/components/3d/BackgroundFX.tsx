'use client'

import { useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Props {
  scrollOffset: MutableRefObject<number>
}

const STAR_COUNT = 900

/**
 * Build a small radial-gradient sprite once and reuse it for every star.
 * Without this, three's default pointsMaterial renders hard-edged squares
 * which look like pixel noise — especially after chromatic aberration.
 */
function makeStarTexture(): THREE.CanvasTexture {
  const size = 64
  const c = document.createElement('canvas')
  c.width = size
  c.height = size
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.3, 'rgba(255,255,255,0.7)')
  grad.addColorStop(0.7, 'rgba(255,255,255,0.1)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(c)
  tex.needsUpdate = true
  return tex
}

export default function BackgroundFX({ scrollOffset: _scrollOffset }: Props) {
  const pointsRef = useRef<THREE.Points>(null)
  const auraRef = useRef<THREE.Mesh>(null)

  const positions = useMemo(() => {
    const arr = new Float32Array(STAR_COUNT * 3)
    for (let i = 0; i < STAR_COUNT; i++) {
      // Push stars to a far shell so the spiral never flies through them
      const radius = 26 + Math.random() * 28
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      arr[i * 3 + 0] = radius * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      arr[i * 3 + 2] = radius * Math.cos(phi) - 10
    }
    return arr
  }, [])

  const starTexture = useMemo(() => makeStarTexture(), [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (pointsRef.current) {
      pointsRef.current.rotation.y = t * 0.005
      pointsRef.current.rotation.x = Math.sin(t * 0.04) * 0.04
    }
    if (auraRef.current) {
      const breathe = 1 + Math.sin(t * 0.3) * 0.02
      auraRef.current.scale.setScalar(breathe)
    }
  })

  return (
    <group>
      {/* Single ambient halo behind the logo. Replaces the previous
          opaque inside-out sphere + multiple competing aura meshes. */}
      <mesh ref={auraRef} position={[0, 0, -3]}>
        <sphereGeometry args={[8, 32, 32]} />
        <meshBasicMaterial
          color="#7b3aed"
          transparent
          opacity={0.04}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Soft round stars far away */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#e8d4ff"
          size={0.32}
          sizeAttenuation
          map={starTexture}
          transparent
          opacity={0.85}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}
