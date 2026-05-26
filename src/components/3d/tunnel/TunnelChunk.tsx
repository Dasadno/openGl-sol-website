// saas-landing/src/components/3d/tunnel/TunnelChunk.tsx
'use client'

import { forwardRef, useMemo, useImperativeHandle, useRef } from 'react'
import * as THREE from 'three'
import { buildChunkMatrices, buildFilamentEdges, TUNNEL } from './tunnelGeometry'
import { createFilamentMaterial } from './filamentMaterial'

export interface TunnelChunkHandle {
  group: THREE.Group
  filamentMaterial: THREE.ShaderMaterial
  cubeMaterial: THREE.MeshStandardMaterial
}

interface TunnelChunkProps {
  initialZ: number
  phaseOffset: number     // [0..1) used for filament colorPhase + rotation phase
}

const CUBE_GEOM = new THREE.BoxGeometry(1, 1, 1)

const TunnelChunk = forwardRef<TunnelChunkHandle, TunnelChunkProps>(
  function TunnelChunk({ initialZ, phaseOffset }, ref) {
    const groupRef = useRef<THREE.Group>(null!)
    const instancedMeshRef = useRef<THREE.InstancedMesh>(null!)
    const lineRef = useRef<THREE.LineSegments>(null!)

    // Build geometry once per chunk (cheap — pure functions, ~1ms)
    const { matrices, lineGeometry, filamentMaterial, cubeMaterial } = useMemo(() => {
      const matrices = buildChunkMatrices()
      const { positions, progress } = buildFilamentEdges()

      const lineGeometry = new THREE.BufferGeometry()
      lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      lineGeometry.setAttribute('edgeProgress', new THREE.BufferAttribute(progress, 1))

      const filamentMaterial = createFilamentMaterial({ colorPhase: phaseOffset })
      const cubeMaterial = new THREE.MeshStandardMaterial({
        color: '#1a1230',
        emissive: '#3a1f7a',
        emissiveIntensity: 0.35,
        roughness: 0.55,
        metalness: 0.25,
        transparent: true,
        opacity: 0,
      })

      return { matrices, lineGeometry, filamentMaterial, cubeMaterial }
    }, [phaseOffset])

    // Imperative handle — FractalTunnel will use the group + materials directly each frame
    useImperativeHandle(
      ref,
      () => ({
        group: groupRef.current,
        filamentMaterial,
        cubeMaterial,
      }),
      [filamentMaterial, cubeMaterial],
    )

    return (
      <group ref={groupRef} position={[0, 0, initialZ]}>
        <instancedMesh
          ref={instancedMeshRef}
          args={[CUBE_GEOM, cubeMaterial, matrices.length]}
          onUpdate={(self) => {
            matrices.forEach((m, i) => self.setMatrixAt(i, m))
            self.instanceMatrix.needsUpdate = true
          }}
        />
        <lineSegments ref={lineRef} args={[lineGeometry, filamentMaterial]} />
      </group>
    )
  },
)

export default TunnelChunk
