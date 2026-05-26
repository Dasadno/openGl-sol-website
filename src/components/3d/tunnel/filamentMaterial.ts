// saas-landing/src/components/3d/tunnel/filamentMaterial.ts
import * as THREE from 'three'

export interface FilamentMaterialOptions {
  colorPhase?: number     // 0..1, offset for staggered chunks
  pulseSpeed?: number     // pulses per second along edge
}

export function createFilamentMaterial(opts: FilamentMaterialOptions = {}): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPulseSpeed: { value: opts.pulseSpeed ?? 0.45 },
      uColorA: { value: new THREE.Color('#5ee7c8') },  // cyan
      uColorB: { value: new THREE.Color('#c8a8ff') },  // purple
      uColorPhase: { value: opts.colorPhase ?? 0 },
      uGlobalAlpha: { value: 0 },
    },
    vertexShader: /* glsl */ `
      attribute float edgeProgress;
      varying float vProgress;
      void main() {
        vProgress = edgeProgress;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uPulseSpeed;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform float uColorPhase;
      uniform float uGlobalAlpha;
      varying float vProgress;

      void main() {
        float pulsePos = mod(uTime * uPulseSpeed + uColorPhase, 1.0);
        float d = abs(vProgress - pulsePos);
        // Wrap distance (treat edge as a loop so the pulse doesn't disappear at seam)
        d = min(d, 1.0 - d);
        float peak = exp(-d * d * 80.0);

        // Soft ambient baseline so lines are visible even without pulse
        float ambient = 0.08;
        float intensity = peak + ambient;

        float colorMix = sin(uTime * 0.5 + uColorPhase * 6.2831) * 0.5 + 0.5;
        vec3 color = mix(uColorA, uColorB, colorMix);

        float alpha = intensity * uGlobalAlpha;
        gl_FragColor = vec4(color * (peak * 1.8 + ambient * 0.6), alpha);
      }
    `,
  })
}
