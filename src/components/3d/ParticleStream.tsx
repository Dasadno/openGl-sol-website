'use client'

import { useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ParticleStreamProps {
  scrollOffset: MutableRefObject<number>
}

const PARTICLE_COUNT = 800
const LENGTH = 24       // depth of the stream tunnel along Z
const RADIUS_MAX = 5.5  // outer radius of the cylindrical cloud
const RADIUS_MIN = 1.4
const FLOW_SPEED = 4.0  // units per second the particles drift in +Z

// Long cylindrical particle cloud streaming through the scene. Conveys
// "throughput" during chapters 5–6. Particles loop back to the far end when
// they exit the near plane.
export default function ParticleStream({ scrollOffset }: ParticleStreamProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.PointsMaterial>(null)

  // Seed positions once. Math.random in useMemo is intentional and stable
  // because the dependency array is empty (one-time seed per mount).
  const { positions, speeds, sizes } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const speeds = new Float32Array(PARTICLE_COUNT)
    const sizes = new Float32Array(PARTICLE_COUNT)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const radius = RADIUS_MIN + Math.random() * (RADIUS_MAX - RADIUS_MIN)
      const angle = Math.random() * Math.PI * 2
      positions[i * 3 + 0] = Math.cos(angle) * radius
      positions[i * 3 + 1] = (Math.random() - 0.5) * 1.6
      positions[i * 3 + 2] = -LENGTH / 2 + Math.random() * LENGTH
      speeds[i] = 0.55 + Math.random() * 1.0
      sizes[i] = 0.6 + Math.random() * 1.6
    }
    return { positions, speeds, sizes }
  }, [])

  useFrame((state, delta) => {
    if (!pointsRef.current || !materialRef.current) return
    const offset = scrollOffset.current

    let alpha = 0
    if (offset > 0.48 && offset < 0.86) {
      if (offset < 0.58) alpha = (offset - 0.48) / 0.10
      else if (offset < 0.76) alpha = 1
      else alpha = 1 - (offset - 0.76) / 0.10
    }
    pointsRef.current.visible = alpha > 0.01
    materialRef.current.opacity = alpha * 0.85

    const arr = pointsRef.current.geometry.attributes.position.array as Float32Array
    const dz = FLOW_SPEED * delta
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr[i * 3 + 2] += dz * speeds[i]
      if (arr[i * 3 + 2] > LENGTH / 2) {
        arr[i * 3 + 2] -= LENGTH
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true
    // Slow subtle rotation of the whole stream for parallax interest
    pointsRef.current.rotation.z = state.clock.elapsedTime * 0.04
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={0.05}
        sizeAttenuation
        color="#c8a8ff"
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
