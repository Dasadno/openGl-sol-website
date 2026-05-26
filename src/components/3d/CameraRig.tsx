'use client'

import { useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CHAPTERS, chapterFromScroll } from './chapters'

interface CameraRigProps {
  scrollOffsetRef: MutableRefObject<number>
}

// Blur-cut: when transitioning INTO a 'blur-cut' chapter, the boundary windows
// (last 5% of previous segment + first 5% of current segment) snap camera position
// and boost FOV briefly to create motion-blur-like distortion.
const BLUR_CUT_THRESHOLD = 0.05
const BLUR_CUT_FOV_BOOST = 40

// FOV breathing inside the held interior of a blur-cut chapter (e.g. Ch 7):
// a slow sinusoidal oscillation gives the otherwise-static camera a sense of
// life without breaking the "stationary in tunnel" feel.
const BREATHE_AMPLITUDE = 3       // ± degrees
const BREATHE_FREQUENCY = 0.18    // Hz — ~5.5s per full cycle

// Entering a blur-cut chapter from a normal (lerp) chapter — the camera
// arcs through an elevated waypoint before diving into the tunnel. Gives a
// choreographed «float up → drop into the tube» feel rather than a flat
// linear translation. The transition occupies the last 45% of the segment.
const ENTER_BLUR_CUT_BEZIER_START = 0.55  // local progress when arc begins
const ENTER_TUNNEL_LIFT = new THREE.Vector3(0, 5.0, -10) // above + forward
const ENTER_TUNNEL_LIFT_LOOK = new THREE.Vector3(0, -1.0, -22) // looking down/forward

// Quadratic Bezier through (a, b, c) at parameter t, in-place into `out`.
function quadraticBezierVec3(
  out: THREE.Vector3,
  a: THREE.Vector3,
  b: THREE.Vector3,
  c: THREE.Vector3,
  t: number,
) {
  const u = 1 - t
  out.set(
    u * u * a.x + 2 * u * t * b.x + t * t * c.x,
    u * u * a.y + 2 * u * t * b.y + t * t * c.y,
    u * u * a.z + 2 * u * t * b.z + t * t * c.z,
  )
}

export default function CameraRig({ scrollOffsetRef }: CameraRigProps) {
  const lookAtTarget = useRef(new THREE.Vector3(0, 0, 0))
  const tmpPos = useRef(new THREE.Vector3())
  const tmpLook = useRef(new THREE.Vector3())

  // Per-segment data. We do NOT use a single CatmullRomCurve3 through all chapters:
  // adding a far-away keyframe (Ch 7 at z=-30, while orbital chapters sit at radius
  // ~5) makes chordal arc-length normalization allocate most of t-range to the long
  // chords, desynchronizing the camera from `chapterFromScroll`'s even segment
  // assumption. Per-segment lerp keeps each chapter at exactly 1/(N-1) of t.
  const { positions, looks, fovs, enterModes } = useMemo(() => {
    const positions = CHAPTERS.map((c) => c.cameraKeyframe.pos.clone())
    const looks = CHAPTERS.map((c) => c.cameraKeyframe.look.clone())
    const fovs = CHAPTERS.map((c) => c.cameraKeyframe.fov ?? 45)
    const enterModes = CHAPTERS.map((c) => c.enterMode ?? 'lerp')
    return { positions, looks, fovs, enterModes }
  }, [])

  useFrame((state, delta) => {
    const offset = scrollOffsetRef.current
    const t = Math.max(0, Math.min(0.9999, offset))

    const { index, local } = chapterFromScroll(t)
    const currentEnterMode = enterModes[index]
    const nextEnterMode = enterModes[index + 1]
    const inBlurCutEnter = nextEnterMode === 'blur-cut' && local > 1 - BLUR_CUT_THRESHOLD
    const inBlurCutExit = currentEnterMode === 'blur-cut' && local < BLUR_CUT_THRESHOLD
    const eased = THREE.MathUtils.smoothstep(local, 0, 1)

    // Three motion regimes:
    //  1. Entering a blur-cut chapter from a normal one  (e.g. Ch 6 → Ch 7):
    //     Hold for the first 55% of the segment, then arc through an elevated
    //     waypoint into the next chapter's keyframe via a quadratic Bezier.
    //     Reads as «float upward then drop into the tube».
    //  2. Interior of a blur-cut chapter (Ch 7 segment, current AND next
    //     blur-cut): pure hold at current keyframe.
    //  3. Normal segment: per-segment lerp between keyframes.
    const isEnteringBlurCut =
      currentEnterMode !== 'blur-cut' && nextEnterMode === 'blur-cut'
    const isInsideBlurCut =
      currentEnterMode === 'blur-cut' && nextEnterMode === 'blur-cut'

    if (isEnteringBlurCut) {
      if (local < ENTER_BLUR_CUT_BEZIER_START) {
        tmpPos.current.copy(positions[index])
        tmpLook.current.copy(looks[index])
      } else {
        const t01 =
          (local - ENTER_BLUR_CUT_BEZIER_START) / (1 - ENTER_BLUR_CUT_BEZIER_START)
        const easedArc = t01 * t01 * (3 - 2 * t01)
        quadraticBezierVec3(
          tmpPos.current,
          positions[index],
          ENTER_TUNNEL_LIFT,
          positions[index + 1],
          easedArc,
        )
        quadraticBezierVec3(
          tmpLook.current,
          looks[index],
          ENTER_TUNNEL_LIFT_LOOK,
          looks[index + 1],
          easedArc,
        )
      }
    } else if (isInsideBlurCut) {
      tmpPos.current.copy(positions[index])
      tmpLook.current.copy(looks[index])
      // Last 5% of the segment: smooth lerp into next chapter's keyframe
      // (Ch 7 → Ch 8 blur-cut transition out of the tunnel).
      if (inBlurCutEnter) {
        const enterT = (local - (1 - BLUR_CUT_THRESHOLD)) / BLUR_CUT_THRESHOLD
        const easedEnter = enterT * enterT * (3 - 2 * enterT)
        tmpPos.current.lerpVectors(positions[index], positions[index + 1], easedEnter)
        tmpLook.current.lerpVectors(looks[index], looks[index + 1], easedEnter)
      }
    } else {
      tmpPos.current.lerpVectors(positions[index], positions[index + 1], eased)
      tmpLook.current.lerpVectors(looks[index], looks[index + 1], eased)
    }

    // FOV: matches the position regime —
    //  - isEnteringBlurCut: hold then arc-lerp during the Bezier window
    //  - isInsideBlurCut: hold at current FOV + breathing
    //  - Otherwise: per-segment lerp
    if ('fov' in state.camera) {
      const cam = state.camera as THREE.PerspectiveCamera
      let targetFov: number
      if (isEnteringBlurCut) {
        if (local < ENTER_BLUR_CUT_BEZIER_START) {
          targetFov = fovs[index]
        } else {
          const t01 =
            (local - ENTER_BLUR_CUT_BEZIER_START) / (1 - ENTER_BLUR_CUT_BEZIER_START)
          const easedArc = t01 * t01 * (3 - 2 * t01)
          targetFov = THREE.MathUtils.lerp(fovs[index], fovs[index + 1], easedArc)
        }
      } else if (isInsideBlurCut) {
        targetFov = fovs[index]
      } else {
        targetFov = THREE.MathUtils.lerp(fovs[index], fovs[index + 1], eased)
      }

      if (isInsideBlurCut && !inBlurCutEnter && !inBlurCutExit) {
        targetFov +=
          Math.sin(state.clock.elapsedTime * BREATHE_FREQUENCY * Math.PI * 2) *
          BREATHE_AMPLITUDE
      }

      if (inBlurCutEnter) {
        // Boost UP from the current chapter's base FOV (monotonic rise
        // 64 → 104 over the enter window). Targeting fovs[index + 1] would
        // dip FOV down first (to Ch 8's 42°) before rising — jarring.
        const boostT = (local - (1 - BLUR_CUT_THRESHOLD)) / BLUR_CUT_THRESHOLD
        targetFov = fovs[index] + boostT * BLUR_CUT_FOV_BOOST
      }
      if (inBlurCutExit) {
        // Decay smoothly FROM the enter window's peak (fovs[index-1] + BOOST)
        // TO the current chapter's base. Without this, FOV would jump 104→82
        // at the boundary instead of decaying continuously 104→42.
        const boostT = 1 - local / BLUR_CUT_THRESHOLD
        const peakFov = fovs[index - 1] + BLUR_CUT_FOV_BOOST
        targetFov = THREE.MathUtils.lerp(fovs[index], peakFov, boostT)
      }

      cam.fov = THREE.MathUtils.lerp(cam.fov, targetFov, delta * 8)
      cam.updateProjectionMatrix()
    }

    // Position commit: snap on blur-cut, smooth-lerp otherwise.
    if (inBlurCutEnter || inBlurCutExit) {
      state.camera.position.copy(tmpPos.current)
      lookAtTarget.current.copy(tmpLook.current)
    } else {
      state.camera.position.lerp(tmpPos.current, delta * 4)
      lookAtTarget.current.lerp(tmpLook.current, delta * 4)
    }
    state.camera.lookAt(lookAtTarget.current)
  })

  return null
}
