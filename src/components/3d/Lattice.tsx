'use client'

import { useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Props {
  scrollOffset: MutableRefObject<number>
}

/**
 * A bloom-emitting wireframe icosahedron surrounded by a faint inner glow.
 * Visual language for Chapter 6 (Institutional control) — rigid geometric
 * structure, order, precision. Slowly rotates with subtle scale breathing.
 */
export default function Lattice({ scrollOffset }: Props) {
  const groupRef = useRef<THREE.Group>(null)
  const innerRef = useRef<THREE.Mesh>(null)
  const wireRef = useRef<THREE.LineSegments>(null)

  // Build wireframe geometry once
  const wireGeometry = useMemo(() => {
    const base = new THREE.IcosahedronGeometry(2.0, 1)
    return new THREE.EdgesGeometry(base)
  }, [])

  const wireMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: '#e2c8ff',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  )

  useFrame((state) => {
    if (!groupRef.current) return
    const time = state.clock.elapsedTime
    const offset = scrollOffset.current

    // Visible chapters 6-7 (scroll 0.58 → 0.88)
    let alpha = 0
    if (offset > 0.56 && offset < 0.92) {
      if (offset < 0.66) alpha = (offset - 0.56) / 0.10
      else if (offset < 0.84) alpha = 1
      else alpha = 1 - (offset - 0.84) / 0.08
    }
    groupRef.current.visible = alpha > 0.01

    groupRef.current.rotation.y = time * 0.12
    groupRef.current.rotation.x = Math.sin(time * 0.18) * 0.18
    const breathe = 1 + Math.sin(time * 0.6) * 0.03
    groupRef.current.scale.setScalar(breathe)

    wireMaterial.opacity = alpha * 0.85
    if (innerRef.current) {
      ;(innerRef.current.material as THREE.MeshBasicMaterial).opacity = alpha * 0.12
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Inner translucent core */}
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[1.95, 1]} />
        <meshBasicMaterial
          color="#7b3aed"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Wireframe edges */}
      <lineSegments
        ref={wireRef}
        geometry={wireGeometry}
        material={wireMaterial}
      />
    </group>
  )
}
