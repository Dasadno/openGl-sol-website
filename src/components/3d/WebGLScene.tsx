'use client'

import { Suspense, useMemo, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Preload } from '@react-three/drei'
import {
  EffectComposer,
  BrightnessContrast,
} from '@react-three/postprocessing'
import {
  BloomEffect,
  ChromaticAberrationEffect,
  VignetteEffect,
  NoiseEffect,
  KernelSize,
  BlendFunction,
} from 'postprocessing'
import * as THREE from 'three'
import HeroLogo from './HeroLogo'
import CameraRig from './CameraRig'
import SceneLoader from './SceneLoader'
import HeroOverlay from './HeroOverlay'
import LiquidityOverlay from './LiquidityOverlay'
import TransactionsOverlay from './TransactionsOverlay'
import BackgroundFX from './BackgroundFX'
import OrbitalGlow from './OrbitalGlow'
import RippleRings from './RippleRings'
import ParticleStream from './ParticleStream'
import LiquidityNetwork from './LiquidityNetwork'
import Lattice from './Lattice'
import FractalTunnel from './tunnel/FractalTunnel'
import CutsceneController from './CutsceneController'
import { ScrollProvider, useScrollProgress } from './ScrollContext'

const SCROLL_LENGTH_VH = 2250  // 5× longer per chapter — slow, deliberate pacing

export default function WebGLScene() {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <ScrollProvider containerRef={containerRef}>
      <div
        ref={containerRef}
        className="relative w-full"
        style={{ height: `${SCROLL_LENGTH_VH}vh` }}
      >
        <div className="sticky top-0 w-full h-screen overflow-hidden">
          <SceneCanvas />
          <HeroOverlay />
          <LiquidityOverlay />
          <TransactionsOverlay />
          <CutsceneController />
        </div>
      </div>
    </ScrollProvider>
  )
}

function SceneCanvas() {
  const { scrollRef } = useScrollProgress()

  // Create Effect instances imperatively so we can pass them directly to FractalTunnel.
  // Using `<Bloom ref={...}>` triggers a known @react-three/postprocessing 3.x +
  // React 19 incompatibility: the library's P() wrapper does JSON.stringify(props)
  // for memoization, and in React 19 `ref` is a regular prop — after the ref is
  // populated with an Effect instance (which has cyclic THREE refs), the stringify
  // throws "cyclic object value". The <primitive> route bypasses that wrapper.
  const bloomEffect = useMemo(
    () =>
      new BloomEffect({
        intensity: 1.1,
        luminanceThreshold: 0.55,
        luminanceSmoothing: 0.7,
        mipmapBlur: true,
        kernelSize: KernelSize.LARGE,
      }),
    [],
  )
  const chromaticEffect = useMemo(
    () =>
      new ChromaticAberrationEffect({
        blendFunction: BlendFunction.NORMAL,
        offset: new THREE.Vector2(0.0006, 0.0009),
        radialModulation: false,
        modulationOffset: 0,
      }),
    [],
  )
  const vignetteEffect = useMemo(
    () =>
      new VignetteEffect({
        eskil: false,
        offset: 0.18,
        darkness: 0.78,
      }),
    [],
  )
  const noiseEffect = useMemo(() => {
    const eff = new NoiseEffect({ blendFunction: BlendFunction.OVERLAY })
    eff.blendMode.opacity.value = 0.035
    return eff
  }, [])

  return (
    <Canvas
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 6], fov: 45 }}
    >
      <color attach="background" args={['#06060a']} />
      <fog attach="fog" args={['#0a0612', 14, 44]} />

      <ambientLight intensity={0.12} color="#1a0c2e" />
      <directionalLight position={[-4, 5, 3]} intensity={2.4} color="#c8a8ff" />
      <directionalLight position={[5, -2, -4]} intensity={1.6} color="#5ee7c8" />
      <pointLight position={[0, -3, 4]} intensity={0.8} color="#7b3aed" />
      <pointLight position={[3, 4, -2]} intensity={1.2} color="#a8e2ff" />

      <Suspense fallback={<SceneLoader />}>
        <BackgroundFX scrollOffset={scrollRef} />
        <CameraRig scrollOffsetRef={scrollRef} />
        <HeroLogo scrollOffset={scrollRef} />
        <OrbitalGlow scrollOffset={scrollRef} />
        <LiquidityNetwork scrollOffset={scrollRef} />
        <RippleRings scrollOffset={scrollRef} />
        <ParticleStream scrollOffset={scrollRef} />
        <Lattice scrollOffset={scrollRef} />
        <FractalTunnel
          scrollOffsetRef={scrollRef}
          effects={{
            bloom: bloomEffect,
            chromatic: chromaticEffect,
            vignette: vignetteEffect,
            noise: noiseEffect,
          }}
        />
        <Environment preset="night" background={false} />
        <Preload all />
      </Suspense>

      <EffectComposer multisampling={4} enableNormalPass={false}>
        <primitive object={bloomEffect} />
        <primitive object={chromaticEffect} />
        <BrightnessContrast brightness={-0.02} contrast={0.08} />
        <primitive object={vignetteEffect} />
        <primitive object={noiseEffect} />
      </EffectComposer>
    </Canvas>
  )
}
