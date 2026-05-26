'use client'

import { useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { ScreenQuad } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Full-screen raymarched fractal — organic twisting metallic fibers built
 * from Mandelbox-style fold iterations + domain warping. Has its own
 * "infinite fly-through" virtual camera animated via sine path + hash-noise
 * wobble. The real Three.js camera's FOV is fed in as a uniform so engine
 * FOV changes (e.g. blur-cut boost during Ch 7 exit) still affect the view.
 *
 * Rendered as a fullscreen overlay (depthTest disabled, renderOrder high)
 * during Ch 7. uAlpha drives in/out fade; when alpha is 0 the material is
 * fully transparent and the underlying scene is visible.
 *
 * Performance: MAX_STEPS=80, 4-iteration fold, hash-based value noise — fits
 * a 16ms budget on M1/RTX-class hardware at 1080p. On low-end mobile, drop
 * MAX_STEPS to 56 and FOLD_ITER to 3 (see constants).
 */

interface RaymarchedTunnelProps {
  alphaRef: MutableRefObject<number>
}

const vertexShader = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 0.999, 1.0); // clip-space, far plane
  }
`

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uAlpha;
  uniform float uFov;        // radians
  uniform vec2  uResolution;

  // ---- Tunables --------------------------------------------------------
  #define MAX_STEPS   72
  #define MIN_DIST    0.0015
  #define MAX_DIST    24.0
  #define STEP_DAMP   0.85

  mat2 r2(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

  float hash3(vec3 p) {
    p = fract(p * vec3(443.8975, 397.2973, 491.1871));
    p += dot(p, p.zxy + 19.27);
    return fract(p.x * p.y * p.z);
  }

  // ---- SDF — hexagonal honeycomb tunnel + longitudinal ribbing ---------
  // Architectural pattern in the spirit of «The Lattice within». Wall is
  // a cylindrical shell at radius R; the surface is embossed with a hex
  // grid in (arc, z) coords — cells protrude inward, borders sit at the
  // base radius. Additional Z-axis grooves (ribbing) every 2.5 units add
  // a sense of forward motion.
  float sdTunnel(vec3 p, float t) {
    // Subtle centerline drift — tube stays close to Z axis so the vortex
    // vanishing point sits at screen centre.
    vec2 centerShift = vec2(
      sin(p.z * 0.4  + t * 0.30) * 0.18,
      cos(p.z * 0.55 - t * 0.22) * 0.15
    );
    p.xy -= centerShift;

    // Slow twist — gives the honeycomb a gentle spiral feel
    float twist = p.z * 0.25 + t * 0.06;
    p.xy = r2(twist) * p.xy;

    float angle  = atan(p.y, p.x);
    float radius = length(p.xy);

    float R = 2.2;  // base wall radius

    // Unfold the wall into 2D coords (u = arc length, v = z) and apply
    // a hex grid pattern. ~9 cells around the circumference, ~variable
    // along z.
    vec2 wallUV = vec2(angle * R * 0.7, p.z * 0.55);

    // Hex grid: pick the nearest of two staggered cell centres
    vec2 cellSize = vec2(1.5, 2.598);   // sqrt(3) ≈ 2.598 — hex row spacing
    vec2 halfCell = cellSize * 0.5;
    vec2 candA = mod(wallUV, cellSize) - halfCell;
    vec2 candB = mod(wallUV + halfCell, cellSize) - halfCell;
    vec2 local = dot(candA, candA) < dot(candB, candB) ? candA : candB;

    // Distance from hex CENTRE to nearest hex EDGE (6-fold symmetric)
    vec2 absL = abs(local);
    float dEdge = max(absL.x * 0.866 + absL.y * 0.5, absL.y);

    // Cells protrude inward: deeper at centre, flush at borders.
    // smoothstep gives a soft bevelled look rather than sharp edges.
    float cellDepth = smoothstep(0.74, 0.40, dEdge) * 0.18;

    // Border ridges — small bump along hex edges (catch specular)
    float borderRidge = smoothstep(0.70, 0.74, dEdge) * smoothstep(0.78, 0.74, dEdge) * 0.04;

    // Longitudinal ribbing — circular grooves every ~2.5 units along Z
    float ribPhase = abs(fract(p.z * 0.4) - 0.5) * 2.0;  // sawtooth in [0,1]
    float rib = smoothstep(0.85, 1.0, ribPhase) * 0.05;

    float wallR = R - cellDepth - rib + borderRidge;
    float wallDist = abs(radius - wallR) - 0.08;

    return wallDist;
  }

  vec3 calcNormal(vec3 p, float t) {
    const vec2 e = vec2(0.004, 0.0);
    return normalize(vec3(
      sdTunnel(p + e.xyy, t) - sdTunnel(p - e.xyy, t),
      sdTunnel(p + e.yxy, t) - sdTunnel(p - e.yxy, t),
      sdTunnel(p + e.yyx, t) - sdTunnel(p - e.yyx, t)
    ));
  }

  void main() {
    if (uAlpha < 0.001) {
      gl_FragColor = vec4(0.0);
      return;
    }

    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
    float t = uTime;

    // Fly-through camera: stays close to the tube's Z axis. xy wobble
    // halved (was 0.15/0.10) so the camera doesn't drift into the wall
    // structure. Walls are >1 unit away at all times.
    vec3 ro = vec3(
      sin(t * 0.35) * 0.08,
      cos(t * 0.27) * 0.05,
      t * 0.8
    );

    // Looking forward along +Z — minimal pitch/yaw breathing so the
    // vortex's vanishing point sits firmly at screen centre.
    vec3 forward = normalize(vec3(
      sin(t * 0.4) * 0.03,
      cos(t * 0.31) * 0.02,
      1.0
    ));
    vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
    vec3 up    = cross(forward, right);

    float fovScale = tan(uFov * 0.5);
    vec3 rd = normalize(forward + right * uv.x * fovScale + up * uv.y * fovScale);

    // Ray march
    float d = 0.0;
    float stepCount = 0.0;
    vec3 p = ro;
    bool hit = false;
    for (int i = 0; i < MAX_STEPS; i++) {
      p = ro + rd * d;
      float ds = sdTunnel(p, t);
      if (ds < MIN_DIST) { hit = true; break; }
      if (d > MAX_DIST) break;
      d += max(ds, MIN_DIST) * STEP_DAMP;
      stepCount += 1.0;
    }

    // Atmospheric base — deep Solana indigo
    vec3 col = vec3(0.06, 0.02, 0.14);

    if (hit) {
      vec3 n = calcNormal(p, t);

      // Single accent light — moves with camera, slightly side+forward.
      vec3 lightPos = ro + right * 1.4 + up * 0.6 + forward * 1.0;
      vec3 lightDir = normalize(lightPos - p);
      float lightDist = length(lightPos - p);
      float attenuation = 1.0 / (1.0 + lightDist * 0.4);
      float diff = max(dot(n, lightDir), 0.0);
      float spec = pow(max(dot(reflect(-lightDir, n), -rd), 0.0), 20.0);

      // Solana palette: brand purple #9945FF body, brand green #14F195
      // rim/spec, mint fresnel. Body shifts from deep indigo (shadow) to
      // saturated violet (lit), spec adds vivid green highlights.
      vec3 bodyDark  = vec3(0.10, 0.03, 0.28);  // shadowed violet
      vec3 bodyLit   = vec3(0.60, 0.27, 1.00);  // Solana purple #9945FF
      vec3 accent    = vec3(0.08, 0.95, 0.58);  // Solana green  #14F195
      vec3 fresnelHue = vec3(0.35, 0.94, 0.77);  // mint cyan

      vec3 body = mix(bodyDark, bodyLit, diff) * attenuation;
      vec3 rim  = accent * spec * 2.2 * attenuation;
      col = body + rim;

      // Cheap AO via step count
      float ao = 1.0 - stepCount / float(MAX_STEPS);
      col *= mix(0.35, 1.0, ao);

      // Fresnel-ish edge for bloom (mint accent on grazing angles)
      float fres = pow(1.0 - max(dot(n, -rd), 0.0), 2.5);
      col += fresnelHue * fres * 0.9;
    }

    // Distance fog blends toward deep indigo
    float fog = 1.0 - exp(-d * 0.06);
    col = mix(col, vec3(0.03, 0.0, 0.09), fog);

    // Film grain
    float grain = hash3(vec3(gl_FragCoord.xy, fract(t * 60.0))) - 0.5;
    col += grain * 0.035;

    gl_FragColor = vec4(col, uAlpha);
  }
`

export default function RaymarchedTunnel({ alphaRef }: RaymarchedTunnelProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null!)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAlpha: { value: 0 },
      uFov: { value: THREE.MathUtils.degToRad(45) },
      uResolution: { value: new THREE.Vector2(1, 1) },
    }),
    [],
  )

  useFrame((state) => {
    const mat = matRef.current
    if (!mat) return
    mat.uniforms.uTime.value = state.clock.elapsedTime
    mat.uniforms.uAlpha.value = alphaRef.current
    mat.uniforms.uResolution.value.set(state.size.width, state.size.height)
    if ('fov' in state.camera) {
      mat.uniforms.uFov.value = THREE.MathUtils.degToRad(
        (state.camera as THREE.PerspectiveCamera).fov,
      )
    }
  })

  return (
    <ScreenQuad renderOrder={9999}>
      <shaderMaterial
        ref={matRef}
        transparent
        depthTest={false}
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </ScreenQuad>
  )
}
