'use client'

import { useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Props {
  scrollOffset: MutableRefObject<number>
}

const NODE_COUNT = 14
const SHELL_RADIUS = 4.5
// "k-nearest" edges per node; small graph but visually busy
const EDGES_PER_NODE = 3

/**
 * A floating constellation of glowing liquidity nodes connected by thin
 * pulsing lines. Active during Chapters 3–4 (Liquidity / Settlement).
 * Geometry is built once on mount; we animate node positions + edge alphas in useFrame.
 */
export default function LiquidityNetwork({ scrollOffset }: Props) {
  const groupRef = useRef<THREE.Group>(null)
  const linesRef = useRef<THREE.LineSegments>(null)
  const nodeRefs = useRef<(THREE.Mesh | null)[]>([])

  // Seed node base positions on a thick sphere shell
  const nodes = useMemo(() => {
    return Array.from({ length: NODE_COUNT }, (_, i) => {
      const phi = Math.acos(2 * (i / NODE_COUNT) - 1)
      const theta = i * 2.4 // golden-angle-ish spread for even distribution
      const r = SHELL_RADIUS + (Math.random() - 0.5) * 1.0
      return {
        basePos: new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.cos(phi) * 0.5, // squash vertically — disk-ish
          r * Math.sin(phi) * Math.sin(theta)
        ),
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.5,
        wobble: 0.25 + Math.random() * 0.35,
        scale: 0.10 + Math.random() * 0.10,
      }
    })
  }, [])

  // Build edge list once (k nearest neighbours per node)
  const edgeIndices = useMemo(() => {
    const edges: Array<[number, number]> = []
    const seen = new Set<string>()
    nodes.forEach((a, i) => {
      const distances = nodes
        .map((b, j) => ({ j, d: i === j ? Infinity : a.basePos.distanceTo(b.basePos) }))
        .sort((x, y) => x.d - y.d)
        .slice(0, EDGES_PER_NODE)
      distances.forEach((d) => {
        const key = i < d.j ? `${i}-${d.j}` : `${d.j}-${i}`
        if (!seen.has(key)) {
          seen.add(key)
          edges.push([i, d.j])
        }
      })
    })
    return edges
  }, [nodes])

  // Buffer for line positions — 2 vertices × 3 coords per edge
  const linePositions = useMemo(
    () => new Float32Array(edgeIndices.length * 2 * 3),
    [edgeIndices]
  )

  const liveNodePositions = useRef(nodes.map((n) => n.basePos.clone()))

  useFrame((state) => {
    if (!groupRef.current) return
    const time = state.clock.elapsedTime
    const offset = scrollOffset.current

    // Visibility window — active across chapters 3-4 (scroll 0.22 → 0.55)
    let alpha = 0
    if (offset > 0.20 && offset < 0.58) {
      if (offset < 0.30) alpha = (offset - 0.20) / 0.10
      else if (offset < 0.50) alpha = 1
      else alpha = 1 - (offset - 0.50) / 0.08
    }
    groupRef.current.visible = alpha > 0.01

    // Animate nodes: subtle orbital wobble around base position
    nodes.forEach((n, i) => {
      const live = liveNodePositions.current[i]
      const w = Math.sin(time * n.speed + n.phase) * n.wobble
      live.copy(n.basePos).add(new THREE.Vector3(w * 0.3, w * 0.15, w * 0.2))
      const mesh = nodeRefs.current[i]
      if (mesh) {
        mesh.position.copy(live)
        ;(mesh.material as THREE.MeshBasicMaterial).opacity = alpha * 0.95
      }
    })

    // Update line buffer
    edgeIndices.forEach((edge, e) => {
      const [a, b] = edge
      const pa = liveNodePositions.current[a]
      const pb = liveNodePositions.current[b]
      const base = e * 6
      linePositions[base + 0] = pa.x
      linePositions[base + 1] = pa.y
      linePositions[base + 2] = pa.z
      linePositions[base + 3] = pb.x
      linePositions[base + 4] = pb.y
      linePositions[base + 5] = pb.z
    })
    if (linesRef.current) {
      const attr = linesRef.current.geometry.attributes.position
      attr.needsUpdate = true
      ;(linesRef.current.material as THREE.LineBasicMaterial).opacity = alpha * 0.45
    }

    // Slow group rotation for parallax
    groupRef.current.rotation.y = time * 0.05
  })

  return (
    <group ref={groupRef}>
      {nodes.map((n, i) => (
        <mesh
          key={i}
          ref={(m) => {
            nodeRefs.current[i] = m
          }}
          position={n.basePos}
        >
          <sphereGeometry args={[n.scale, 16, 16]} />
          <meshBasicMaterial
            color={i % 3 === 0 ? '#c8a8ff' : i % 3 === 1 ? '#5ee7c8' : '#a8e2ff'}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color="#a78bfa"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  )
}
