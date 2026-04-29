<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { LEVELS, Level, applyH, measure } from '@/game/quantumGame'

const CELL = 56
const canvas = ref<HTMLCanvasElement | null>(null)
const currentLevelIndex = ref(0)
let level = LEVELS[currentLevelIndex.value]
let ctx: CanvasRenderingContext2D | null = null

const state = ref('|0⟩')
const p0 = ref('100%')
const p1 = ref('0%')
const result = ref('—')
const history = ref<number[]>([])
const showWin = ref(false)
let isTransitioning = false
let winTimer: ReturnType<typeof setTimeout> | null = null
let photon = { progress: 1, segCount: 0 }
let gameInterval: ReturnType<typeof setInterval> | null = null
let animationFrameId: number | null = null

const SHOOT_MS = 800
const TRAVEL_MS = 800
const FPS = 60

function setupCanvas() {
  if (!canvas.value) return
  canvas.value.width = level.cols * CELL
  canvas.value.height = level.rows * CELL
  ctx = canvas.value.getContext('2d')
  history.value = []
}

function updateUI(s: number[] | null, hitH: boolean, r: number | null) {
  state.value = s ? (hitH ? '|+⟩' : '|0⟩') : '—'
  p0.value = s ? Math.round(s[0] ** 2 * 100) + '%' : '—'
  p1.value = s ? Math.round(s[1] ** 2 * 100) + '%' : '—'
  result.value = r !== null ? String(r) : 'missed'

  if (r !== null) {
    history.value.push(r)
    if (history.value.length > 20) history.value.shift()
  }
}

function startWinTimer() {
  if (winTimer || isTransitioning) return
  isTransitioning = true

  winTimer = setTimeout(() => {
    showWin.value = true

    setTimeout(() => {
      showWin.value = false
      if (currentLevelIndex.value < LEVELS.length - 1) {
        currentLevelIndex.value++
        level = LEVELS[currentLevelIndex.value]
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
      const m = level.grid[r][c]
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

function clearMirrors() {
  level.grid = Array.from({ length: level.rows }, () => Array(level.cols).fill(null))
}

function handleCanvasClick(e: MouseEvent) {
  if (!canvas.value) return
  const rect = canvas.value.getBoundingClientRect()
  const col = Math.floor((e.clientX - rect.left) / CELL)
  const row = Math.floor((e.clientY - rect.top) / CELL)

  if (level.isFixed(col, row)) return
  level.grid[row][col] = level.grid[row][col] === 'fwd' ? 'back' : 'fwd'
}

function handleCanvasRightClick(e: MouseEvent) {
  e.preventDefault()
  if (!canvas.value) return
  const rect = canvas.value.getBoundingClientRect()
  const col = Math.floor((e.clientX - rect.left) / CELL)
  const row = Math.floor((e.clientY - rect.top) / CELL)

  if (!level.isFixed(col, row)) level.grid[row][col] = null
}

onMounted(() => {
  setupCanvas()
  draw()

  gameInterval = setInterval(() => {
    const { segs } = level.trace()
    photon = { progress: 0, segCount: segs.length }

    setTimeout(() => {
      const { hitIon, hitH } = level.trace()
      if (!hitIon) {
        updateUI(null, false, null)
        cancelWinTimer()
        return
      }

      let s = [0, 1]
      if (hitH) s = applyH(s)
      const r = measure(s)
      updateUI(s, hitH, r)

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
  <div class="game-container">
    <h1>Quantum Laser Puzzle Game</h1>
    <p class="hint">{{ level.hint }}</p>

    <div class="controls">
      <p>Left-click to place/rotate mirror · Right-click to remove</p>
      <button @click="clearMirrors" class="clear-btn">Clear Mirrors</button>
    </div>

    <canvas
      ref="canvas"
      @click="handleCanvasClick"
      @contextmenu="handleCanvasRightClick"
      class="game-canvas"
    ></canvas>

    <div class="info">
      <div>Level: <b>{{ level.name }}</b></div>
      <div>State: <b :style="{ color: state === '|+⟩' ? '#b47cff' : '#0ef' }">{{ state }}</b> | P(0)=<b>{{ p0 }}</b> P(1)=<b>{{ p1 }}</b></div>
      <div>Last measurement: <b :style="{ color: result === '1' ? '#f84' : '#0ef' }">{{ result }}</b></div>
      <div v-if="history.length > 0">History: {{ history.join(' ') }}</div>
    </div>

    <div v-if="showWin" class="win-overlay">
      ION SUCCESSFULLY EXCITED
    </div>
  </div>
</template>

<style scoped>
.game-container {
  background: #000000;
  color: #eee;
  font-family: monospace;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  margin: 0;
  gap: 10px;
  padding: 20px;
}

h1 {
  color: #0ef;
  margin: 0;
}

.hint {
  color: rgb(255, 255, 255);
  margin: 0;
  font-size: 16px;
}

.controls {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 5px;
}

.controls p {
  color: #555;
  margin: 0;
  font-size: 12px;
}

.clear-btn {
  cursor: pointer;
  background: #222;
  color: #ccc;
  border: 1px solid #555;
  padding: 3px 8px;
  font-size: 10px;
  font-family: monospace;
  border-radius: 4px;
  transition: 0.2s;
}

.clear-btn:hover {
  background: #333;
  border-color: #777;
}

.game-canvas {
  border: 2px solid #333;
  cursor: pointer;
}

.info {
  text-align: center;
  line-height: 2;
  font-size: 17px;
}

.win-overlay {
  display: flex;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  color: #0f0;
  font-size: 32px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  z-index: 1000;
}
</style>