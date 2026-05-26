import * as THREE from 'three'

export type CameraKey = {
  pos: THREE.Vector3
  look: THREE.Vector3
  fov?: number
}

export type Chapter = {
  index: number              // 1..N
  title: string              // displayed top-right, italic serif
  kicker: string             // small uppercase line above headline
  headline: string           // may contain <em>…</em> markers for italic-serif accent
  caption: string            // body line under headline
  cameraKeyframe: CameraKey
  enterMode?: 'lerp' | 'blur-cut'  // default: 'lerp'. 'blur-cut' = snap + FOV overshoot
}

/**
 * Spiral camera path: each chapter is (angle θ in degrees, radius r, height y, fov).
 * Position = (r·sin θ, y, r·cos θ). LookAt stays near the central axis.
 * Going through chapters 1→8 traces ~1.06 full rotation around the logo while
 * radius/height varies — a true cinematic flythrough rather than linear lerps.
 */
function spiralKey(thetaDeg: number, radius: number, height: number, fov: number): CameraKey {
  const t = (thetaDeg * Math.PI) / 180
  return {
    pos: new THREE.Vector3(Math.sin(t) * radius, height, Math.cos(t) * radius),
    look: new THREE.Vector3(0, height * 0.15, 0),
    fov,
  }
}

export const CHAPTERS: Chapter[] = [
  {
    index: 1,
    title: 'The Speed of Capital',
    kicker: 'An institutional view of Solana DeFi',
    headline: 'Капитал, движущийся <em>со скоростью</em> света.',
    caption: 'Прокрутите вниз — камера полетит по спирали через девять глав.',
    cameraKeyframe: spiralKey(0, 6.0, 0, 45),
  },
  {
    index: 2,
    title: 'Approach',
    kicker: 'Глава 02',
    headline: 'Приближение <em>к ядру</em> сети.',
    caption: 'Орбита сужается, освещение переходит в тёплую сторону.',
    cameraKeyframe: spiralKey(45, 5.2, 0.6, 44),
  },
  {
    index: 3,
    title: 'Liquidity, in motion',
    kicker: 'Глава 03',
    headline: 'Ликвидность, <em>распределённая</em> по всей сети.',
    caption: 'TVL $12.4B · нативная глубина без оффчейн-агрегаторов.',
    cameraKeyframe: spiralKey(110, 4.6, 1.4, 42),
  },
  {
    index: 4,
    title: 'Settlement',
    kicker: 'Глава 04',
    headline: 'Расчёт — <em>за миллисекунды</em>, не за дни.',
    caption: '400 мс на блок. Финализация быстрее, чем взмах ресниц.',
    cameraKeyframe: spiralKey(175, 4.0, 2.4, 40),
  },
  {
    index: 5,
    title: 'Throughput',
    kicker: 'Глава 05',
    headline: 'Поток <em>в шестьдесят пять тысяч</em> транзакций в секунду.',
    caption: 'Сеть, способная нести объём целого фондового рынка.',
    cameraKeyframe: spiralKey(240, 4.4, 1.8, 46),
  },
  {
    index: 6,
    title: 'Institutional control',
    kicker: 'Глава 06',
    headline: 'Контроль <em>уровня institutional</em>: аудиты, отчётность, регулирование.',
    caption: 'SOC 2 · Halborn audit · регулируемые контрагенты.',
    cameraKeyframe: spiralKey(310, 5.8, 0.8, 50),
  },
  {
    index: 7,
    title: 'The Lattice within',
    kicker: 'Глава 07',
    headline: 'Архитектура, повторяющаяся <em>на всех уровнях</em>.',
    caption: 'От агрегата сети — к матрице каждой транзакции.',
    cameraKeyframe: {
      pos: new THREE.Vector3(0, 0, -30),
      look: new THREE.Vector3(0, 0, -50),
      fov: 64,
    },
    enterMode: 'blur-cut',
  },
  {
    index: 8,
    title: 'Re-entry',
    kicker: 'Глава 08',
    headline: 'Возвращение <em>к центру</em>.',
    caption: 'Камера приближается. Проступает торговый интерфейс.',
    cameraKeyframe: spiralKey(360, 4.0, 0, 42),
    enterMode: 'blur-cut',
  },
  {
    index: 9,
    title: 'The View',
    kicker: 'Глава 09',
    headline: 'Откройте <em>торговый терминал</em>.',
    caption: 'Один интерфейс — для исполнения, аналитики и отчётности.',
    cameraKeyframe: spiralKey(380, 2.8, 0, 38),
  },
]

/**
 * Map a scroll progress 0..1 to (currentChapterIndex 0..N-2, localProgress 0..1)
 * where localProgress is how far we are between chapter[i] and chapter[i+1].
 */
export function chapterFromScroll(scroll: number): { index: number; local: number } {
  const clamped = Math.max(0, Math.min(0.9999, scroll))
  const segment = 1 / (CHAPTERS.length - 1)
  const index = Math.min(CHAPTERS.length - 2, Math.floor(clamped / segment))
  const local = (clamped - index * segment) / segment
  return { index, local }
}

/**
 * Return chapter to display in the overlay (1..N).
 *
 * Each chapter's overlay is shown during ITS OWN scroll segment (not bleeding
 * into the previous/next segment). This keeps overlay text in sync with the
 * 3D content that's actually rendering: Lattice for Ch 6, raymarched fractal
 * for Ch 7, etc. The final chapter (which has no segment after it) takes
 * over the last 50% of the final segment as a "close-up" approach.
 */
export function activeChapterIndex(scroll: number): number {
  const { index, local } = chapterFromScroll(scroll)
  const lastSegmentIndex = CHAPTERS.length - 2
  if (index === lastSegmentIndex && local >= 0.5) {
    return CHAPTERS.length
  }
  return index + 1
}
