'use client'

import { useMemo, useRef, useState, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Edges, Html, MeshReflectorMaterial } from '@react-three/drei'
import * as THREE from 'three'

const BAR_COUNT = 16
const BAR_WIDTH = 0.45
const BAR_GAP = 0.22
const BAR_DEPTH = 0.45
const MAX_HEIGHT = 3.2

interface BarData {
  open: number
  close: number
  high: number
  low: number
  volume: number
  isUp: boolean
}

interface BarChartProps {
  scrollOffset: MutableRefObject<number>
}

function generateRandomWalk(count: number, start: number, volatility: number): BarData[] {
  const bars: BarData[] = []
  let prevClose = start

  for (let i = 0; i < count; i++) {
    const open = prevClose
    const drift = (Math.random() - 0.5) * volatility
    let close = open + drift
    close = Math.max(0.6, Math.min(MAX_HEIGHT - 0.4, close))
    const wick = Math.random() * volatility * 0.4
    const high = Math.min(MAX_HEIGHT, Math.max(open, close) + wick)
    const low = Math.max(0.3, Math.min(open, close) - wick)
    const volume = 0.5 + Math.random() * 1.5

    bars.push({ open, close, high, low, volume, isUp: close >= open })
    prevClose = close
  }

  return bars
}

export default function BarChart({ scrollOffset }: BarChartProps) {
  const groupRef = useRef<THREE.Group>(null)
  const refs = useRef<(THREE.Mesh | null)[]>([])
  const [hovered, setHovered] = useState<number | null>(null)

  const bars = useMemo(() => generateRandomWalk(BAR_COUNT, 1.8, 0.9), [])

  // Per-bar reveal start offset with subtle jitter for organic, less mechanical entrance
  const revealStarts = useMemo(
    () =>
      Array.from({ length: BAR_COUNT }, (_, i) => {
        const baseStart = (i / BAR_COUNT) * 0.6
        const jitter = (Math.random() - 0.5) * 0.2
        return Math.max(0, Math.min(0.7, baseStart + jitter))
      }),
    []
  )

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    const offset = scrollOffset.current

    const phaseProgress = THREE.MathUtils.clamp((offset - 0.6) / 0.35, 0, 1)
    groupRef.current.visible = offset > 0.55
    if (!groupRef.current.visible) return

    bars.forEach((bar, i) => {
      const mesh = refs.current[i]
      if (!mesh) return

      const start = revealStarts[i]
      const reveal = THREE.MathUtils.smoothstep(
        phaseProgress,
        start,
        Math.min(1, start + 0.4)
      )

      const liveWobble = 1 + Math.sin(t * 1.2 + i * 0.3) * 0.04
      const targetH = bar.high * reveal * liveWobble
      const isHovered = hovered === i

      mesh.scale.x = reveal > 0.01 ? (isHovered ? 1.08 : 1) : 0.001
      mesh.scale.z = reveal > 0.01 ? (isHovered ? 1.08 : 1) : 0.001
      mesh.scale.y = THREE.MathUtils.lerp(
        mesh.scale.y,
        Math.max(0.001, targetH),
        0.12
      )
      mesh.position.y = mesh.scale.y / 2

      const mat = mesh.material as THREE.MeshPhysicalMaterial
      const targetEmissive = isHovered ? 1.4 : 0.55
      mat.emissiveIntensity = THREE.MathUtils.lerp(
        mat.emissiveIntensity,
        targetEmissive,
        0.18
      )
    })

    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      state.pointer.x * 0.12,
      0.04
    )
  })

  const totalWidth = BAR_COUNT * (BAR_WIDTH + BAR_GAP) - BAR_GAP

  return (
    <group ref={groupRef} position={[0, -2.4, 0]} scale={[1.2, 1.2, 1]}>
      {/* Reflective floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[totalWidth + 8, 14]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={1024}
          mixBlur={1}
          mixStrength={50}
          roughness={0.6}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#06060a"
          metalness={0.65}
          mirror={0.5}
        />
      </mesh>

      {/* Reference price levels — thin horizontal lines */}
      {[1.5, 3, 4.5].map((y, i) => (
        <mesh key={`ref-${i}`} position={[0, y, -0.4]}>
          <boxGeometry args={[totalWidth + 2, 0.005, 0.005]} />
          <meshBasicMaterial color="#9945FF" transparent opacity={0.18} />
        </mesh>
      ))}

      {bars.map((bar, i) => {
        const color = bar.isUp ? '#14F195' : '#FF4D6D'
        return (
          <mesh
            key={i}
            ref={(el) => {
              refs.current[i] = el
            }}
            position={[
              i * (BAR_WIDTH + BAR_GAP) - totalWidth / 2 + BAR_WIDTH / 2,
              0,
              0,
            ]}
            scale={[1, 0.001, 1]}
            onPointerOver={(e) => {
              e.stopPropagation()
              setHovered(i)
              document.body.style.cursor = 'pointer'
            }}
            onPointerOut={() => {
              setHovered(null)
              document.body.style.cursor = 'auto'
            }}
          >
            <boxGeometry args={[BAR_WIDTH, 1, BAR_DEPTH]} />
            <meshPhysicalMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.55}
              metalness={0.6}
              roughness={0.25}
              transparent
              opacity={0.85}
            />
            <Edges threshold={15} color={color} scale={1.001} />

            {/* Wick line on top */}
            <mesh position={[0, 0.5 + (bar.high - bar.close) * 0.15, 0]}>
              <boxGeometry args={[0.02, (bar.high - bar.close) * 0.3, 0.02]} />
              <meshBasicMaterial color={color} transparent opacity={0.5} />
            </mesh>

            {hovered === i && (
              <Html
                position={[0, 1 / Math.max(0.01, bar.high) + 0.4, 0]}
                center
                distanceFactor={6}
                style={{ pointerEvents: 'none' }}
              >
                <div className="px-3 py-2 rounded-lg backdrop-blur-glass border border-white/10 text-[10px] font-mono whitespace-nowrap">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-gray-400 uppercase tracking-widest">
                      Block #{(38420 + i).toLocaleString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                    <span className="text-gray-500">Open</span>
                    <span className="text-white tabular-nums">${bar.open.toFixed(2)}</span>
                    <span className="text-gray-500">Close</span>
                    <span className="tabular-nums" style={{ color }}>
                      ${bar.close.toFixed(2)}
                    </span>
                    <span className="text-gray-500">High</span>
                    <span className="text-white tabular-nums">${bar.high.toFixed(2)}</span>
                    <span className="text-gray-500">Low</span>
                    <span className="text-white tabular-nums">${bar.low.toFixed(2)}</span>
                  </div>
                </div>
              </Html>
            )}
          </mesh>
        )
      })}
    </group>
  )
}
