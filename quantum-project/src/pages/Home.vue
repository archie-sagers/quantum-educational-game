<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { LEVELS, Level, applyH, measure } from '@/game/quantumgame'
import styles from './Home.module.css'


// Constants
// ------------------

const CELL = 56
const SHOOT_MS = 800
const TRAVEL_MS = 800
const FPS = 60


// State
// ------------------

const canvas = ref<HTMLCanvasElement | null>(null)
const currentLevelIndex = ref(0)
const state = ref('|0⟩')
const p0 = ref('100%')
const p1 = ref('0%')
const result = ref('—')
const history = ref<number[]>([])
const showWin = ref(false)

let level: Level = LEVELS[currentLevelIndex.value]!
let ctx: CanvasRenderingContext2D | null = null
let isTransitioning = false
let winTimer: ReturnType<typeof setTimeout> | null = null
let photon = { progress: 1, segCount: 0 }
let gameInterval: ReturnType<typeof setInterval> | null = null
let animationFrameId: number | null = null


// Bloch Sphere
// ------------------

const blochAngle = computed(() => {
  const angleMap: Record<string, number> = {
    '|0⟩': 90,
    '|+⟩': 0,
    '|-⟩': 180,
    '|1⟩': 270
  }
  return angleMap[state.value] ?? null
})

const blochLabel = computed(() => {
  const labelMap: Record<string, string> = {
    '|0⟩': '|0⟩ Ground state',
    '|+⟩': '|+⟩ Superposition',
    '|-⟩': '|-⟩ Superposition',
    '|1⟩': '|1⟩ Excited state'
  }
  return labelMap[state.value] ?? 'No state'
})

// Canvas Functions
// ------------------

function setupCanvas() {
  if (!canvas.value) return
  canvas.value.width = level.cols * CELL
  canvas.value.height = level.rows * CELL
  ctx = canvas.value.getContext('2d')
  history.value = []
}

function updateUI(s: number[] | null, hitH: boolean, r: number | null, preMeasure: number | null = null) {
  if (!s) {
    state.value = '—'
  } else if (hitH) {
    // If pre-gate state was 1, show |+⟩; if 0, show |-⟩
    state.value = preMeasure === 1 ? '|+⟩' : '|-⟩'
  } else {
    // |0⟩ when r=0, |1⟩ when r=1
    state.value = r === 0 ? '|0⟩' : '|1⟩'
  }

  p0.value = s ? Math.round(s[0]! ** 2 * 100) + '%' : '—'
  p1.value = s ? Math.round(s[1]! ** 2 * 100) + '%' : '—'
  result.value = r !== null ? String(r) : 'missed'

  if (r !== null) {
    history.value.push(r)
    if (history.value.length > 20) history.value.shift()
  }
}

// Level Progression
// ------------------

function startWinTimer() {
  if (winTimer || isTransitioning) return
  isTransitioning = true

  winTimer = setTimeout(() => {
    showWin.value = true

    setTimeout(() => {
      showWin.value = false
      if (currentLevelIndex.value < LEVELS.length - 1) {
        currentLevelIndex.value++
        level = LEVELS[currentLevelIndex.value]!
        setupCanvas()
      }
      isTransitioning = false
    }, 2000)
    winTimer = null
  }, 2000)
}

function cancelWinTimer() {
  if (isTransitioning) return
  if (winTimer) clearTimeout(winTimer)
  winTimer = null
}

// Canvas draw loop
// ------------------

function draw() {
  if (!ctx) return

  ctx.clearRect(0, 0, canvas.value!.width, canvas.value!.height)

  // Grid lines
  ctx.strokeStyle = '#1a1a1a'
  ctx.lineWidth = 1
  for (let r = 0; r <= level.rows; r++) {
    ctx.beginPath()
    ctx.moveTo(0, r * CELL)
    ctx.lineTo(canvas.value!.width, r * CELL)
    ctx.stroke()
  }
  for (let c = 0; c <= level.cols; c++) {
    ctx.beginPath()
    ctx.moveTo(c * CELL, 0)
    ctx.lineTo(c * CELL, canvas.value!.height)
    ctx.stroke()
  }

  // Beam
  const { segs } = level.trace()
  ctx.lineWidth = 2
  for (const s of segs) {
    const col = s.afterH ? '#b47cff' : '#0ef'
    ctx.strokeStyle = col
    ctx.shadowColor = col
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.moveTo(s.x1, s.y1)
    ctx.lineTo(s.x2, s.y2)
    ctx.stroke()
  }
  ctx.shadowBlur = 0

  // Photon dot
  photon.progress += 1 / ((TRAVEL_MS / 1000) * FPS)
  if (photon.progress < 1 && segs.length > 0) {
    const t = photon.progress * photon.segCount
    const idx = Math.min(Math.floor(t), segs.length - 1)
    const seg = segs[idx]
    const f = t - Math.floor(t)
    const px = seg.x1 + (seg.x2 - seg.x1) * f
    const py = seg.y1 + (seg.y2 - seg.y1) * f
    const col = seg.afterH ? '#d4aaff' : '#fff'
    ctx.fillStyle = col
    ctx.shadowColor = col
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.arc(px, py, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
  }

  // Laser source
  const sx = level.src.col * CELL
  const sy = level.src.row * CELL
  ctx.fillStyle = '#0ef'
  ctx.fillRect(sx + 4, sy + 4, CELL - 8, CELL - 8)
  ctx.fillStyle = '#000'
  ctx.font = '9px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('LASER', sx + CELL / 2, sy + CELL / 2)

  // H gates
  for (const hg of level.hgates) {
    const hx = hg.col * CELL
    const hy = hg.row * CELL
    ctx.strokeStyle = '#b47cff'
    ctx.lineWidth = 2
    ctx.strokeRect(hx + 8, hy + 8, CELL - 16, CELL - 16)
    ctx.fillStyle = '#b47cff'
    ctx.font = 'bold 18px monospace'
    ctx.fillText('H', hx + CELL / 2, hy + CELL / 2)
  }

  // Walls
  ctx.strokeStyle = '#ff4444'
  ctx.lineWidth = 2
  for (const w of level.walls) {
    const wx = w.col * CELL
    const wy = w.row * CELL
    ctx.beginPath()
    ctx.moveTo(wx + 16, wy + 16)
    ctx.lineTo(wx + CELL - 16, wy + CELL - 16)
    ctx.moveTo(wx + CELL - 16, wy + 16)
    ctx.lineTo(wx + 16, wy + CELL - 16)
    ctx.stroke()
  }

  // Ion
  const ix = level.ion.col * CELL + CELL / 2
  const iy = level.ion.row * CELL + CELL / 2
  ctx.strokeStyle = '#f84'
  ctx.lineWidth = 2
  ctx.shadowColor = '#f84'
  ctx.shadowBlur = 12
  ctx.beginPath()
  ctx.arc(ix, iy, 20, 0, Math.PI * 2)
  ctx.stroke()
  ctx.shadowBlur = 0
  ctx.fillStyle = '#f84'
  ctx.font = '9px monospace'
  ctx.fillText('ION', ix, iy)

  // Mirrors
  ctx.strokeStyle = '#aaa'
  ctx.lineWidth = 3
  for (let r = 0; r < level.rows; r++) {
    for (let c = 0; c < level.cols; c++) {
      const m = level.grid[r]![c]!
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

  animationFrameId = requestAnimationFrame(draw)
}

// Mirror Controls
// ------------------

function clearMirrors() {
  level.grid = Array.from({ length: level.rows }, () => Array(level.cols).fill(null))
}

function handleCanvasClick(e: MouseEvent) {
  if (!canvas.value) return
  const rect = canvas.value.getBoundingClientRect()
  const col = Math.floor((e.clientX - rect.left) / CELL)
  const row = Math.floor((e.clientY - rect.top) / CELL)

  if (level.isFixed(col, row)) return
  level.grid[row]![col]! = level.grid[row]![col]! === 'fwd' ? 'back' : 'fwd'
}

function handleCanvasRightClick(e: MouseEvent) {
  e.preventDefault()
  if (!canvas.value) return
  const rect = canvas.value.getBoundingClientRect()
  const col = Math.floor((e.clientX - rect.left) / CELL)
  const row = Math.floor((e.clientY - rect.top) / CELL)

  if (!level.isFixed(col, row)) level.grid[row]![col] = null
}

// Game Loop
// ------------------

onMounted(() => {
  setupCanvas()
  draw()

  gameInterval = setInterval(() => {
    const { segs } = level.trace()
    photon = { progress: 0, segCount: segs.length }

    setTimeout(() => {
      const { hitIon, hitH } = level.trace()
      if (!hitIon) {
        updateUI(null, false, null, null)
        cancelWinTimer()
        return
      }

      let s = [0, 1]  // Start in |1⟩ by default
      const preMeasure = measure(s)  // Measure before applying gate
      
      // Set s to the measured state
      s = preMeasure === 0 ? [1, 0] : [0, 1]
      
      if (hitH) s = applyH(s)
      const r = measure(s)
      updateUI(s, hitH, r, preMeasure)

      let isWinningState = false
      if (level.winCondition === 'any') isWinningState = true
      else if (level.winCondition === 'superposition' && hitH) isWinningState = true
      else if (level.winCondition === 'normal' && !hitH) isWinningState = true

      isWinningState ? startWinTimer() : cancelWinTimer()
    }, TRAVEL_MS)
  }, SHOOT_MS)
})

onUnmounted(() => {
  if (gameInterval) clearInterval(gameInterval)
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  if (winTimer) clearTimeout(winTimer)
})
</script>

<template>
  <div :class="styles.gameContainer">
    <h1 :class="styles.title">Quantum Laser Puzzle Game</h1>
    <p :class="styles.hint">{{ level.hint }}</p>

    <div :class="styles.controls">
      <p :class="styles.controlsText">Left-click to place/rotate mirror · Right-click to remove</p>
      <button @click="clearMirrors" :class="styles.clearBtn">Clear Mirrors</button>
    </div>

    <!-- Main game area -->
    <div :class="styles.mainArea">
      <!-- Game canvas -->
      <div :class="styles.canvasWrap">
        <canvas
          ref="canvas"
          @click="handleCanvasClick"
          @contextmenu="handleCanvasRightClick"
          :class="styles.gameCanvas"
        />
      </div>
 
      <!-- Sidebar: Bloch sphere + measurement info -->
      <aside :class="styles.sidebar">
 
        <!-- Bloch sphere -->
        <div :class="styles.blochPanel">
          <div :class="styles.blochTitle">Bloch Sphere</div>
          <svg :class="styles.blochSvg" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
            <!-- Axis labels -->
            <text x="80" y="14" :class="styles.blochLabel" text-anchor="middle">|1⟩</text>
            <text x="80" y="156" :class="styles.blochLabel" text-anchor="middle">|0⟩</text>
            <text x="10" y="84" :class="styles.blochLabel" text-anchor="middle">−</text>
            <text x="150" y="84" :class="styles.blochLabel" text-anchor="middle">+</text>
 
            <!-- Sphere outline -->
            <circle cx="80" cy="80" r="52" :class="styles.blochCircle" />
 
            <!-- Dashed equator -->
            <ellipse cx="80" cy="80" rx="52" ry="14" :class="styles.blochEquator" />
 
            <!-- State arrow — only drawn when ion is hit -->
            <g v-if="blochAngle !== null">
              <!-- Arrow line from centre in the direction of blochAngle -->
              <line
                x1="80" y1="80"
                :x2="80 + 44 * Math.cos((blochAngle * Math.PI) / 180)"
                :y2="80 + 44 * Math.sin((blochAngle * Math.PI) / 180)"
                :class="styles.blochArrow"
              />
              <!-- Arrowhead circle at tip -->
              <circle
                :cx="80 + 46 * Math.cos((blochAngle * Math.PI) / 180)"
                :cy="80 + 46 * Math.sin((blochAngle * Math.PI) / 180)"
                r="3"
                :class="styles.blochTip"
              />
            </g>
 
            <!-- Centre dot -->
            <circle cx="80" cy="80" r="3" :class="styles.blochCenter" />
          </svg>
 
          <!-- State label below sphere -->
          <div :class="{
            [styles.blochState as string]: true,
            [styles.blochStateSuperposition as string]: state === '|+⟩' || state === '|-⟩'
          }">
            {{ blochLabel }}
          </div>
        </div>
 
        <!-- Measurement info panel -->
        <div :class="styles.infoPanel">
          <div :class="styles.infoRow">
            <span :class="styles.infoKey">State</span>
            <span :class="{
              [styles.infoVal as string]: true,
              [styles.infoValCyan as string]: state === '|0⟩', 
              [styles.infoValPurple as string]: state === '|+⟩', 
              [styles.infoValMagenta as string]: state === '|-⟩',
              [styles.infoValOrange as string]: state === '|1⟩'
            }">{{ state }}</span>
          </div>
          <div :class="styles.infoRow">
            <span :class="styles.infoKey">P(|0⟩)</span>
            <span :class="styles.infoVal">{{ p0 }}</span>
          </div>
          <div :class="styles.infoRow">
            <span :class="styles.infoKey">P(|1⟩)</span>
            <span :class="styles.infoVal">{{ p1 }}</span>
          </div>
          <div :class="styles.infoRow">
            <span :class="styles.infoKey">Last</span>
            <span :class="{
              [styles.infoVal as string]: true,
              [styles.infoValOrange as string]: result === '1',
              [styles.infoValCyan as string]: result === '0'
            }">{{ result }}</span>
          </div>
          <div v-if="history.length" :class="styles.history">
            <span :class="styles.infoKey">History</span>
            <span :class="styles.historyBits">{{ history.join(' ') }}</span>
          </div>
        </div>
 
      </aside>
    </div>
    <!-- End main-area -->
 
    <!-- Win overlay -->
    <div v-if="showWin" :class="styles.winOverlay">ION SUCCESSFULLY EXCITED</div>
  </div>
</template>
