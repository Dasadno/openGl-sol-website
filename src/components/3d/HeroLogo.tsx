'use client'

import { useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

interface HeroLogoProps {
  scrollOffset: MutableRefObject<number>
}

useGLTF.preload('/models/solana_logo.glb')

const SPRING_STIFFNESS = 60
const SPRING_DAMPING = 14
const ROTATION_RANGE_Y = 0.18
const ROTATION_RANGE_X = 0.08
const AUTO_ROTATE_RAD_PER_SEC = (0.5 * Math.PI) / 180

export default function HeroLogo({ scrollOffset }: HeroLogoProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF('/models/solana_logo.glb')

  const springRotY = useRef({ current: 0, velocity: 0 })
  const springRotX = useRef({ current: 0, velocity: 0 })

  const centeredScene = useMemo(() => {
    const cloned = scene.clone(true)
    cloned.scale.setScalar(0.45)
    const box = new THREE.Box3().setFromObject(cloned)
    const center = box.getCenter(new THREE.Vector3())
    cloned.position.sub(center)
    return cloned
  }, [scene])

  useFrame((state, delta) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    const offset = scrollOffset.current

    // Logo is the centre of the spiral — keep it visible across all 8 chapters,
    // fading only at the very end (chapter 8 close-up).
    const fadeOut = THREE.MathUtils.clamp(1 - (offset - 0.88) / 0.08, 0, 1)
    groupRef.current.visible = fadeOut > 0.01

    // Billboard: face the logo toward the camera every frame so the spiral
    // camera path never catches it edge-on (the GLB is essentially 3 flat
    // 3D bars). The pointer-tracking offset and slow auto-rotate apply on
    // top of the billboard rotation.
    const cam = state.camera
    const billboardY = Math.atan2(
      cam.position.x - groupRef.current.position.x,
      cam.position.z - groupRef.current.position.z
    )
    groupRef.current.rotation.z = AUTO_ROTATE_RAD_PER_SEC * t

    let targetY = billboardY + state.pointer.x * ROTATION_RANGE_Y
    // Shortest-arc wrap: if target jumps by >π (atan2 wrap behind the logo),
    // shift it by ±2π so the spring takes the short way around.
    const dY = targetY - springRotY.current.current
    if (dY > Math.PI) targetY -= 2 * Math.PI
    else if (dY < -Math.PI) targetY += 2 * Math.PI

    const targetX = -state.pointer.y * ROTATION_RANGE_X
    integrateSpring(springRotY.current, targetY, delta)
    integrateSpring(springRotX.current, targetX, delta)
    groupRef.current.rotation.y = springRotY.current.current
    groupRef.current.rotation.x = springRotX.current.current

    const breathe = 1 + Math.sin(t * (Math.PI * 2 / 4)) * 0.01
    groupRef.current.scale.setScalar(fadeOut * breathe)

    groupRef.current.position.y = Math.sin(t * 0.6) * 0.06
  })

  return (
    <group ref={groupRef}>
      <primitive object={centeredScene} />
    </group>
  )
}

function integrateSpring(state: { current: number; velocity: number }, target: number, delta: number) {
  const force = -SPRING_STIFFNESS * (state.current - target)
  const damping = -SPRING_DAMPING * state.velocity
  const accel = force + damping
  state.velocity += accel * delta
  state.current += state.velocity * delta
}
