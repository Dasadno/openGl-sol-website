// saas-landing/src/components/3d/tunnel/tunnelGeometry.ts
import * as THREE from 'three'

export const TUNNEL = {
  depth: 3,          // Menger 2D recursion depth — 8 → 64 → 512 cells per panel
  panelSize: 6,      // edge length of one panel (in world units)
  chunkLength: 8,    // chunk size along Z
  chunkCount: 5,     // chunks alive at once — longer visible tunnel
  cubeDepth: 0.15,   // how far each cube juts out of its panel
} as const

/**
 * Build 2D Menger-Sierpinski subdivisions at `depth`.
 * Returns an array of { cx, cy, size } cells in the unit square centered at (0, 0).
 */
export function buildMengerCells(depth: number): Array<{ cx: number; cy: number; size: number }> {
  const cells: Array<{ cx: number; cy: number; size: number }> = []

  function subdivide(cx: number, cy: number, size: number, level: number) {
    if (level === 0) {
      cells.push({ cx, cy, size })
      return
    }
    const childSize = size / 3
    // 3x3 grid, skip the center
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue
        subdivide(cx + i * childSize, cy + j * childSize, childSize, level - 1)
      }
    }
  }

  subdivide(0, 0, 1, depth)
  return cells
}

/**
 * Build instance matrices for one chunk's 256 cubes (4 panels × 64 cells at depth=2).
 * Returns matrices in chunk-local space; the chunk group provides the Z position.
 */
export function buildChunkMatrices(): THREE.Matrix4[] {
  const cells = buildMengerCells(TUNNEL.depth)
  const matrices: THREE.Matrix4[] = []
  const half = TUNNEL.panelSize / 2

  // Four panel orientations: top, bottom, left, right
  // Each panel is a square in its local plane, scaled by panelSize, offset to chunk wall.
  const panels = [
    // top panel: normal pointing down (-Y); plane lies in XZ at y = +half
    { rotation: new THREE.Euler(Math.PI / 2, 0, 0), offset: new THREE.Vector3(0, +half, 0) },
    // bottom: normal +Y, plane in XZ at y = -half
    { rotation: new THREE.Euler(-Math.PI / 2, 0, 0), offset: new THREE.Vector3(0, -half, 0) },
    // left: normal +X, plane in YZ at x = -half
    { rotation: new THREE.Euler(0, Math.PI / 2, 0), offset: new THREE.Vector3(-half, 0, 0) },
    // right: normal -X, plane in YZ at x = +half
    { rotation: new THREE.Euler(0, -Math.PI / 2, 0), offset: new THREE.Vector3(+half, 0, 0) },
  ]

  const tmpMatrix = new THREE.Matrix4()
  const tmpScale = new THREE.Vector3()

  for (const panel of panels) {
    const panelRotQuat = new THREE.Quaternion().setFromEuler(panel.rotation)
    for (const cell of cells) {
      // Cell is in unit square at z=0. Scale to panelSize, position on panel plane.
      const u = cell.cx * TUNNEL.panelSize
      const v = cell.cy * TUNNEL.panelSize
      const localOnPlane = new THREE.Vector3(u, v, TUNNEL.cubeDepth / 2)

      const cellPos = localOnPlane.applyQuaternion(panelRotQuat).add(panel.offset)

      const cellSize = cell.size * TUNNEL.panelSize
      tmpScale.set(cellSize, cellSize, TUNNEL.cubeDepth)
      tmpMatrix.compose(cellPos, panelRotQuat, tmpScale)
      matrices.push(tmpMatrix.clone())
    }
  }

  return matrices
}

/**
 * Build line-segment vertices tracing the perimeter of every Menger cell on all 4 panels.
 * Each segment has an associated `edgeProgress` in [0, 1] for the filament shader.
 *
 * Returns { positions: Float32Array, progress: Float32Array } where:
 *   positions has 6 floats per segment (x1,y1,z1, x2,y2,z2)
 *   progress has 2 floats per segment (0 at vertex1, 1 at vertex2)
 */
export function buildFilamentEdges(): { positions: Float32Array; progress: Float32Array } {
  const cells = buildMengerCells(TUNNEL.depth)
  const half = TUNNEL.panelSize / 2

  const panels = [
    { rotation: new THREE.Euler(Math.PI / 2, 0, 0), offset: new THREE.Vector3(0, +half, 0) },
    { rotation: new THREE.Euler(-Math.PI / 2, 0, 0), offset: new THREE.Vector3(0, -half, 0) },
    { rotation: new THREE.Euler(0, Math.PI / 2, 0), offset: new THREE.Vector3(-half, 0, 0) },
    { rotation: new THREE.Euler(0, -Math.PI / 2, 0), offset: new THREE.Vector3(+half, 0, 0) },
  ]

  const positions: number[] = []
  const progress: number[] = []

  for (const panel of panels) {
    const panelRotQuat = new THREE.Quaternion().setFromEuler(panel.rotation)
    for (const cell of cells) {
      const cellHalf = (cell.size * TUNNEL.panelSize) / 2
      const cx = cell.cx * TUNNEL.panelSize
      const cy = cell.cy * TUNNEL.panelSize
      // 4 corners of the cell square in panel-local plane (z = +cubeDepth/2 to sit on top of cubes)
      const corners = [
        new THREE.Vector3(cx - cellHalf, cy - cellHalf, TUNNEL.cubeDepth / 2 + 0.005),
        new THREE.Vector3(cx + cellHalf, cy - cellHalf, TUNNEL.cubeDepth / 2 + 0.005),
        new THREE.Vector3(cx + cellHalf, cy + cellHalf, TUNNEL.cubeDepth / 2 + 0.005),
        new THREE.Vector3(cx - cellHalf, cy + cellHalf, TUNNEL.cubeDepth / 2 + 0.005),
      ].map((v) => v.applyQuaternion(panelRotQuat).add(panel.offset))

      // 4 edges per cell: 0→1, 1→2, 2→3, 3→0
      for (let i = 0; i < 4; i++) {
        const a = corners[i]
        const b = corners[(i + 1) % 4]
        positions.push(a.x, a.y, a.z, b.x, b.y, b.z)
        progress.push(0, 1)
      }
    }
  }

  return {
    positions: new Float32Array(positions),
    progress: new Float32Array(progress),
  }
}
