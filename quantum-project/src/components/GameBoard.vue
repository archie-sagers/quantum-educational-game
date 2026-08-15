<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Level, CELL } from '@/game/quantumgame'
import { BOARD_STYLE, COLORS, TIMING } from '@/constants'

const TRAVEL_MS = TIMING.PHOTON_TRAVEL_MS
const FPS = TIMING.ANIMATION_FPS
const colours = COLORS

// Props
const props = defineProps<{
  mode: 'edit' | 'play'
  level: Level
  sourceGates: string[][]
  fillParent?: boolean
  disableMirrors?: boolean
}>()

interface BeamSegment {
  x1: number
  y1: number
  x2: number
  y2: number
  colours: string[]
}

const emits = defineEmits<{
  (e: 'canvas-click', col: number, row: number): void
  (e: 'canvas-right-click', col: number, row: number): void
  (e: 'canvas-mirror-place', col: number, row: number): void
  (e: 'item-drop', col: number, row: number, itemType: string): void
  (e: 'mouse-move', col: number, row: number): void
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let animationFrameId: number | null = null
let lastFrameTime = performance.now()

let globalProgress = 1 // Start at 1 so the photon isn't animating upon initial load

// Flash effect for reset
let flashAlpha = 0

function triggerFlash() {
  flashAlpha = 0.2 
}

// Setup canvas and context
function setupCanvas() {
  if (!canvas.value) return

  const baseWidth = props.level.cols * CELL
  const baseHeight = props.level.rows * CELL

  // Scale up canvas resolution
  const dpr = window.devicePixelRatio || 1
  const scale = dpr * 3
  canvas.value.width = baseWidth * scale
  canvas.value.height = baseHeight * scale

  ctx = canvas.value.getContext('2d')
  ctx?.setTransform(1, 0, 0, 1, 0, 0)
  ctx?.scale(scale, scale)
}

// Resize window
let resizeTimeout: number
function handleResize() {
  clearTimeout(resizeTimeout)
  resizeTimeout = window.setTimeout(setupCanvas, 150)
}

// Draw Functions
// -----------------------------

function draw() {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
  }

  if (!ctx) return

  const now = performance.now()
  let dt = now - lastFrameTime
  lastFrameTime = now
  dt = Math.min(dt, 100)

  ctx.clearRect(0, 0, canvas.value!.width, canvas.value!.height)

  // Grid lines
  ctx.strokeStyle = colours.gray
  ctx.lineWidth = 1
  for (let r = 0; r <= props.level.rows; r++) {
    ctx.beginPath()
    ctx.moveTo(0, r * CELL)
    ctx.lineTo(canvas.value!.width, r * CELL)
    ctx.stroke()
  }
  for (let c = 0; c <= props.level.cols; c++) {
    ctx.beginPath()
    ctx.moveTo(c * CELL, 0)
    ctx.lineTo(c * CELL, canvas.value!.height)
    ctx.stroke()
  }

  // Beam - render parallel split lines for each colour
  const { segs } = props.level.trace(props.sourceGates)
  ctx.lineWidth = 2
  for (const s of segs) {
    // Calculate offset for each colour
    const dx = s.x2 - s.x1
    const dy = s.y2 - s.y1
    const len = Math.sqrt(dx * dx + dy * dy)
    const perpX = len > 0 ? -dy / len : 0
    const perpY = len > 0 ? dx / len : 0

    const numColours = s.colours.length
    let offsets: number[] = []
    if (numColours === 1) offsets = [0]
    else if (numColours === 2) offsets = [-3, 3]
    else if (numColours === 3) offsets = [-5, 0, 5]
    else offsets = s.colours.map((_: string, i: number) => -3 + ((i * 6) / (numColours - 1)))

    for (let i = 0; i < s.colours.length; i++) {
      const offset = offsets[i] || 0
      const x1 = s.x1 + perpX * offset
      const y1 = s.y1 + perpY * offset
      const x2 = s.x2 + perpX * offset
      const y2 = s.y2 + perpY * offset

      const colourMap: Record<string, string> = {
        cyan: colours.cyan,
        orange: colours.orange,
        purple: colours.purple,
        green: colours.green,
      }

      const colourKey = s.colours[i] || 'cyan'
      ctx.strokeStyle = colourMap[colourKey] || colours.cyan
      ctx.shadowColor = String(ctx.strokeStyle)
      ctx.shadowBlur = BOARD_STYLE.BEAM_GLOW_BLUR
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }
  }
  ctx.shadowBlur = 0

  // Photon dots
  globalProgress += dt / TRAVEL_MS
  
  if (globalProgress < 3 && segs.length > 0) { 
    const paths: BeamSegment[][] = []
    for (const seg of segs) {
      let added = false
      for (const p of paths) {
        const lastSeg = p[p.length - 1]!
        if (Math.abs(seg.x1 - lastSeg.x2) < 1 && Math.abs(seg.y1 - lastSeg.y2) < 1) {
          p.push(seg)
          added = true
          break
        }
      }
      if (!added) {
        paths.push([seg])
      }
    }

    const colourMap: Record<string, string> = {
      cyan: colours.cyan,
      orange: colours.orange,
      purple: colours.purple,
      green: colours.green,
    }

    const GATE_DELAY = 0.1

    for (const path of paths) {
    const firstSeg = path[0]
    if (!firstSeg) continue

    const baseColours = firstSeg.colours

      for (let cIdx = 0; cIdx < baseColours.length; cIdx++) {
        const p = globalProgress - (cIdx * GATE_DELAY)
        
        if (p >= 0 && p <= 1) {
          const t = p * path.length
          const idx = Math.min(Math.floor(t), path.length - 1)
          const seg = path[idx]!
          
          let f = t - Math.floor(t)
          if (t >= path.length) f = 1

          const dx = seg.x2 - seg.x1
          const dy = seg.y2 - seg.y1
          const len = Math.sqrt(dx * dx + dy * dy)
          const perpX = len > 0 ? -dy / len : 0
          const perpY = len > 0 ? dx / len : 0

          const numColours = seg.colours.length
          let offsets: number[] = []
          if (numColours === 1) offsets = [0]
          else if (numColours === 2) offsets = [-3, 3]
          else if (numColours === 3) offsets = [-5, 0, 5]
          else offsets = seg.colours.map((_: string, i: number) => -3 + ((i * 6) / (numColours - 1)))

          const colourKey = baseColours[cIdx] || 'cyan'
          const myColorIdx = Math.min(cIdx, numColours - 1)
          const offset = offsets[myColorIdx] || 0

          const px = seg.x1 + dx * f + perpX * offset
          const py = seg.y1 + dy * f + perpY * offset

          ctx.fillStyle = colourMap[colourKey] || colours.cyan
          ctx.shadowColor = String(ctx.fillStyle)
          ctx.shadowBlur = BOARD_STYLE.PHOTON_GLOW_BLUR
          ctx.beginPath()
          ctx.arc(px, py, BOARD_STYLE.PHOTON_RADIUS, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
    ctx.shadowBlur = 0
  }

  // Laser sources
  for (let sIdx = 0; sIdx < props.level.sources.length; sIdx++) {
    const src = props.level.sources[sIdx]
    if (!src) continue
    const sx = src.col * CELL
    const sy = src.row * CELL

    // Calculate colour specifically for this source
    const myGates = props.sourceGates[sIdx] || []
    let myColour: string = colours.cyan
    if (myGates.includes('CNOT')) myColour = colours.green
    else if (myGates.includes('X')) myColour = colours.orange
    else if (myGates.includes('H')) myColour = colours.purple

    ctx.fillStyle = myColour
    ctx.fillRect(
      sx + BOARD_STYLE.LASER_INSET,
      sy + BOARD_STYLE.LASER_INSET,
      CELL - BOARD_STYLE.LASER_INSET * 2,
      CELL - BOARD_STYLE.LASER_INSET * 2,
    )
    ctx.fillStyle = colours.black
    ctx.font = `${BOARD_STYLE.LABEL_FONT_PX}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const labelText = props.level.sources.length > 1 ? `LASER ${sIdx + 1}` : 'LASER'
    ctx.fillText(labelText, sx + CELL / 2, sy + CELL / 2)
  }

  // Walls
  ctx.lineWidth = 2
  for (const w of props.level.walls) {
    const wx = w.col * CELL
    const wy = w.row * CELL
    let strokeCol: string = colours.red
    if (w.type === 'standard' || w.type === 'all') strokeCol = colours.red
    else if (w.type === 'cyan') strokeCol = colours.cyan
    else if (w.type === 'orange') strokeCol = colours.orange
    else if (w.type === 'purple') strokeCol = colours.purple
    else if (w.type === 'green') strokeCol = colours.green
    const wallInset = BOARD_STYLE.WALL_INSET
    ctx.strokeStyle = strokeCol
    ctx.beginPath()
    ctx.moveTo(wx + wallInset, wy + wallInset)
    ctx.lineTo(wx + CELL - wallInset, wy + CELL - wallInset)
    ctx.moveTo(wx + CELL - wallInset, wy + wallInset)
    ctx.lineTo(wx + wallInset, wy + CELL - wallInset)
    ctx.stroke()
  }

  // Ions
  const ionLabels = ['A', 'B', 'C', 'D', 'E', 'F']
  for (let ionIdx = 0; ionIdx < props.level.ions.length; ionIdx++) {
    const ion = props.level.ions[ionIdx]!
    const ix = ion.col * CELL + CELL / 2
    const iy = ion.row * CELL + CELL / 2
    ctx.strokeStyle = colours.orange
    ctx.lineWidth = 2
    ctx.shadowColor = colours.orange
    ctx.shadowBlur = BOARD_STYLE.ION_GLOW_BLUR
    ctx.beginPath()
    ctx.arc(ix, iy, BOARD_STYLE.ION_RADIUS, 0, Math.PI * 2)
    ctx.stroke()
    ctx.shadowBlur = 0
    ctx.fillStyle = colours.orange
    ctx.font = `bold ${BOARD_STYLE.LABEL_FONT_PX}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('ION ' + ionLabels[ionIdx], ix, iy)
  }

  // Mirrors
  ctx.strokeStyle = colours.lightGray
  ctx.lineWidth = 3
  for (let r = 0; r < props.level.rows; r++) {
    for (let c = 0; c < props.level.cols; c++) {
      const m = props.level.grid[r]![c]!
      if (!m) continue
      ctx.beginPath()
      if (m === 'fwd') {
        ctx.moveTo(c * CELL + 8, (r + 1) * CELL - 8)
        ctx.lineTo((c + 1) * CELL - 8, r * CELL + 8)
      } else {
        ctx.moveTo(c * CELL + 8, r * CELL + 8)
        ctx.lineTo((c + 1) * CELL - 8, (r + 1) * CELL - 8)
      }
      ctx.stroke()
    }
  }
  // Flash overlay for reset
  if (flashAlpha > 0) {
    ctx.fillStyle = `rgba(0, 150, 255, ${flashAlpha})`;
    ctx.fillRect(0, 0, canvas.value!.width, canvas.value!.height);
    flashAlpha -= dt * 0.0009
  }

  animationFrameId = requestAnimationFrame(draw)
}

// EVENT HANDLERS
// -------------------------------------------------------------

function getCellFromEvent(e: MouseEvent | DragEvent): { col: number; row: number } {
  if (!canvas.value) return { col: -1, row: -1 }
  const rect = canvas.value.getBoundingClientRect()
  const clientX = e instanceof DragEvent ? e.clientX : (e as MouseEvent).clientX
  const clientY = e instanceof DragEvent ? e.clientY : (e as MouseEvent).clientY
  const internalAspect = props.level.cols / props.level.rows
  const cssAspect = rect.width / rect.height
  let drawWidth = rect.width
  let drawHeight = rect.height
  let offsetX = 0
  let offsetY = 0

  if (cssAspect > internalAspect) {
    // Canvas is wider than level aspect ratio
    drawWidth = rect.height * internalAspect
    offsetX = (rect.width - drawWidth) / 2
  } else {
    // Canvas is taller than level aspect ratio
    drawHeight = rect.width / internalAspect
    offsetY = (rect.height - drawHeight) / 2
  }

  // Get mouse position relative to the drawn grid area
  const mouseX = clientX - rect.left - offsetX
  const mouseY = clientY - rect.top - offsetY
  const col = Math.floor((mouseX / drawWidth) * props.level.cols)
  const row = Math.floor((mouseY / drawHeight) * props.level.rows)
  const safeCol = Math.max(0, Math.min(col, props.level.cols - 1))
  const safeRow = Math.max(0, Math.min(row, props.level.rows - 1))
  return { col: safeCol, row: safeRow }
}

function handleCanvasClick(e: MouseEvent) {
  const { col, row } = getCellFromEvent(e)
  if (col < 0 || row < 0) return

  if (props.mode === 'play') {
    // In play mode, handle mirror placement
    if (props.disableMirrors) return;
    if (!props.level.isFixed(col, row)) {
      // Three click cycle for mirrors
      const current = props.level.grid[row]![col]
      const next = current === null ? 'fwd' : current === 'fwd' ? 'back' : null
      props.level.grid[row]![col] = next
      emits('canvas-mirror-place', col, row)
    }
  }

  emits('canvas-click', col, row)
}

function handleCanvasRightClick(e: MouseEvent) {
  e.preventDefault()
  const { col, row } = getCellFromEvent(e)
  if (col < 0 || row < 0) return

  if (props.mode === 'edit') {
    // In edit mode, right-click removes items at this coordinate
    emits('item-drop', col, row, 'DELETE')
  } else if (props.mode === 'play') {
    // In play mode, right-click clears mirrors
    if (!props.level.isFixed(col, row)) {
      props.level.grid[row]![col] = null

      emits('canvas-mirror-place', col, row)
      emits('canvas-right-click', col, row)
    }
  }
}

function handleCanvasMouseMove(e: MouseEvent) {
  const { col, row } = getCellFromEvent(e)

  if (col >= 0 && row >= 0) {
    emits('mouse-move', col, row)

    // Dynamically change cursor to pointer
    if (canvas.value) {
      const isSource = props.level.sources.some(s => s.col === col && s.row === row)

      // Only if in play mode
      if (props.mode === 'play' && isSource && props.level.availableGates.length > 0) {
        canvas.value.style.cursor = 'pointer'
      } else {
        canvas.value.style.cursor = 'crosshair'
      }
    }
  }
}

function handleCanvasDragOver(e: DragEvent) {
  e.preventDefault()
  if (props.mode === 'edit') {
    e.dataTransfer!.dropEffect = 'copy'
  }
}

function handleCanvasDrop(e: DragEvent) {
  e.preventDefault()
  if (props.mode !== 'edit') return

  const itemType = e.dataTransfer!.getData('itemType')
  if (!itemType) return

  const { col, row } = getCellFromEvent(e)

  if (col >= 0 && col < props.level.cols && row >= 0 && row < props.level.rows) {
    emits('item-drop', col, row, itemType)
  }
}

// Mounting and cleanup
//--------------------------------------------------------------

onMounted(async () => {
  await nextTick()
  setupCanvas()
  draw()
  window.addEventListener('resize', handleResize)
  window.addEventListener('orientationchange', handleResize)
})

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('orientationchange', handleResize)
})

// Watch for level changes and reset animation frame
watch(
  () => props.level,
  () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
    globalProgress = 1
    setupCanvas()
    draw()
  }
)

function resetPhoton() {
  globalProgress = 0
}

defineExpose({ resetPhoton, triggerFlash })
</script>

<template>
  <div class="gameboard-wrapper">
    <canvas
      ref="canvas"
      :class="['gameCanvas', { 'gameCanvas-fill': fillParent }]"
      @click="handleCanvasClick"
      @contextmenu="handleCanvasRightClick"
      @mousemove="handleCanvasMouseMove"
      @dragover="handleCanvasDragOver"
      @drop="handleCanvasDrop"
      role="application"
      aria-label="Interactive quantum puzzle board. Click to place mirrors to direct lasers to the ions."
      tabindex="0"
    />
  </div>
</template>

<style scoped>
.gameboard-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

/* Game Style (Home.vue) */
.gameCanvas {
  border: 2px solid var(--color-border);
  cursor: crosshair;
  max-width: 100%;
  width: auto;
  height: auto;
  max-height: 60vh;
  object-fit: contain;
}

/* Lab Style (Lab.vue) */
.gameCanvas-fill {
  width: 100%;
  height: 90%;
  max-height: 90%;
}
</style>
