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
const canMeasure = ref(false)
const showLevelSelector = ref(false)
const showLaserGates = ref(false)
const laserGates = ref<string[]>([])
const isMeasured = ref(false)
const measuredValue = ref<number | null>(null)

let level: Level = LEVELS[currentLevelIndex.value]!
let ctx: CanvasRenderingContext2D | null = null
let photon = { progress: 1, segCount: 0 }
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

const laserColor = computed(() => {
  return laserGates.value.length > 0 ? '#b47cff' : '#0ef'
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

function updateStateForTracing() {
  // If already measured, keep showing the measured state
  if (isMeasured.value) {
    state.value = measuredValue.value === 0 ? '|0⟩' : '|1⟩'
    p0.value = measuredValue.value === 0 ? '100%' : '0%'
    p1.value = measuredValue.value === 1 ? '100%' : '0%'
    canMeasure.value = false
    return
  }

  const { hitIon, hitH } = level.trace()
  
  if (!hitIon) {
    state.value = '—'
    p0.value = '—'
    p1.value = '—'
    canMeasure.value = false
    return
  }

  let s = [1, 0]  // Start in |0⟩
  
  // Apply laser gates
  for (const gate of laserGates.value) {
    if (gate === 'H') s = applyH(s)
  }
  
  if (hitH) s = applyH(s)
  
  p0.value = Math.round(s[0]! ** 2 * 100) + '%'
  p1.value = Math.round(s[1]! ** 2 * 100) + '%'
  
  // Show current superposition
  const hasSuperposition = laserGates.value.length > 0 && laserGates.value.length % 2 === 1 ? true : (hitH ? true : false)
  if (hasSuperposition) {
    state.value = '|+⟩'  // Show superposition state
  } else {
    state.value = '|0⟩'  // Show ground state
  }
  
  canMeasure.value = true
}

// Level Progression
// ------------------

function nextLevel() {
  showWin.value = false
  if (currentLevelIndex.value < LEVELS.length - 1) {
    currentLevelIndex.value++
    level = LEVELS[currentLevelIndex.value]!
    laserGates.value = []
    isMeasured.value = false
    measuredValue.value = null
    setupCanvas()
    updateStateForTracing()
    result.value = '—'
    history.value = []
  }
}

function selectLevel(index: number) {
  showLevelSelector.value = false
  currentLevelIndex.value = index
  level = LEVELS[currentLevelIndex.value]!
  laserGates.value = []
  isMeasured.value = false
  measuredValue.value = null
  setupCanvas()
  updateStateForTracing()
  result.value = '—'
  history.value = []
  showWin.value = false
}

// Laser Gate Placement
// ------------------

function openLaserGates() {
  showLaserGates.value = true
}

function onGateDragStart(e: DragEvent, gateType: string) {
  e.dataTransfer!.effectAllowed = 'copy'
  e.dataTransfer!.setData('gateType', gateType)
}

function onLaserDragOver(e: DragEvent) {
  e.preventDefault()
  e.dataTransfer!.dropEffect = 'copy'
}

function onLaserDrop(e: DragEvent) {
  e.preventDefault()
  const gateType = e.dataTransfer!.getData('gateType')
  if (gateType) {
    laserGates.value.push(gateType)
    updateStateForTracing()
  }
}

function removeLaserGate(index: number) {
  laserGates.value.splice(index, 1)
  updateStateForTracing()
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
    const col = laserColor.value === '#b47cff' || s.afterH ? '#b47cff' : '#0ef'
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
    const col = laserColor.value === '#b47cff' || seg.afterH ? '#d4aaff' : '#fff'
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
  ctx.fillStyle = laserColor.value
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
  updateStateForTracing()
}

function handleMeasure() {
  if (!canMeasure.value) return
  canMeasure.value = false
  
  const { hitH } = level.trace()
  photon = { progress: 0, segCount: level.trace().segs.length }

  setTimeout(() => {
    // If already measured, keep showing the same value but add to history
    if (isMeasured.value) {
      result.value = String(measuredValue.value)
      history.value.push(measuredValue.value!)
      if (history.value.length > 20) history.value.shift()
      canMeasure.value = true
      return
    }

    // Calculate the quantum state with laser gates applied
    let s = [1, 0]
    
    // Apply laser gates
    for (const gate of laserGates.value) {
      if (gate === 'H') s = applyH(s)
    }
    
    if (hitH) s = applyH(s)
    
    // Measure with proper probabilities
    const r = measure(s)
    
    // Store the measured value and mark as measured
    measuredValue.value = r
    isMeasured.value = true
    
    // Update display
    state.value = r === 0 ? '|0⟩' : '|1⟩'
    p0.value = r === 0 ? '100%' : '0%'
    p1.value = r === 1 ? '100%' : '0%'
    result.value = String(r)
    history.value.push(r)
    if (history.value.length > 20) history.value.shift()

    canMeasure.value = true
    if ((level.winCondition === 'any') || 
        (level.winCondition === 'superposition' && hitH) || 
        (level.winCondition === 'normal' && !hitH)) {
      showWin.value = true
    }
  }, TRAVEL_MS)
}

function handleCanvasMouseMove(e: MouseEvent) {
  if (!canvas.value) return
  const rect = canvas.value.getBoundingClientRect()
  const col = Math.floor((e.clientX - rect.left) / CELL)
  const row = Math.floor((e.clientY - rect.top) / CELL)

  // Change cursor when hovering over laser if gates are available
  if (col === level.src.col && row === level.src.row && level.availableGates.length > 0) {
    canvas.value.style.cursor = 'pointer'
  } else {
    canvas.value.style.cursor = 'crosshair'
  }
}

function handleReset() {
  isMeasured.value = false
  measuredValue.value = null
  result.value = '—'
  updateStateForTracing()
}

function handleCanvasClick(e: MouseEvent) {
  if (!canvas.value) return
  const rect = canvas.value.getBoundingClientRect()
  const col = Math.floor((e.clientX - rect.left) / CELL)
  const row = Math.floor((e.clientY - rect.top) / CELL)

  // Check if clicked on laser
  if (col === level.src.col && row === level.src.row && level.availableGates.length > 0) {
    openLaserGates()
    return
  }

  if (level.isFixed(col, row)) return
  level.grid[row]![col]! = level.grid[row]![col]! === 'fwd' ? 'back' : 'fwd'
  updateStateForTracing()
}

function handleCanvasRightClick(e: MouseEvent) {
  e.preventDefault()
  if (!canvas.value) return
  const rect = canvas.value.getBoundingClientRect()
  const col = Math.floor((e.clientX - rect.left) / CELL)
  const row = Math.floor((e.clientY - rect.top) / CELL)

  if (!level.isFixed(col, row)) level.grid[row]![col] = null
  updateStateForTracing()
}

// Game Loop
// ------------------

onMounted(() => {
  setupCanvas()
  updateStateForTracing()
  draw()
})

onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
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

    <!-- Level select and success message on same line -->
    <div :class="styles.controlsRow">
      <button @click="showLevelSelector = true" :class="styles.levelIndicator">
        Level {{ currentLevelIndex + 1 }}
      </button>
      <div :class="styles.successBoxContainer">
        <div v-if="showWin" :class="styles.successBox">
          <div :class="styles.successText">ION SUCCESSFULLY EXCITED</div>
          <button @click="nextLevel" :class="styles.nextBtn">{{ currentLevelIndex < LEVELS.length - 1 ? 'Next Level' : 'Completed!' }}</button>
        </div>
      </div>
    </div>

    <!-- Main game area -->
    <div :class="styles.mainArea">
      <!-- Game canvas -->
      <div :class="styles.canvasWrap">
        <canvas
          ref="canvas"
          @click="handleCanvasClick"
          @contextmenu="handleCanvasRightClick"
          @mousemove="handleCanvasMouseMove"
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
          
          <!-- Measure Button -->
          <button 
            @click="handleMeasure"
            :disabled="!canMeasure"
            :class="styles.measureBtn"
          >
            Measure
          </button>

          <!-- Reset Button (only on certain levels) -->
          <button
            v-if="level.showResetButton"
            @click="handleReset"
            :disabled="!isMeasured"
            :class="styles.resetBtn"
          >
            Reset Ion
          </button>
          
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

    <!-- Level selector modal -->
    <div v-if="showLevelSelector" :class="styles.levelSelectorOverlay" @click="showLevelSelector = false">
      <div :class="styles.levelSelectorGrid" @click.stop>
        <div
          v-for="(_, index) in LEVELS"
          :key="index"
          @click="selectLevel(index)"
          :class="[styles.levelSelectorSquare, { [styles.levelSelectorActive as string]: index === currentLevelIndex }]"
        >
          {{ index + 1 }}
        </div>
      </div>
    </div>

    <!-- Laser Gates modal -->
    <div v-if="showLaserGates" :class="styles.laserGatesOverlay" @click="showLaserGates = false">
      <div :class="styles.laserGatesModal" @click.stop>
        <div :class="styles.laserGatesTitle">Laser Gates</div>
        
        <div :class="styles.gateContainer">
          <!-- Applied gates -->
          <div :class="styles.appliedSection">
            <div :class="styles.sectionLabel">Applied to Laser</div>
            <div
              @dragover="onLaserDragOver"
              @drop="onLaserDrop"
              :class="styles.laserDropZone"
            >
              <div v-if="laserGates.length > 0" :class="styles.gateStack">
                <div
                  v-for="(gate, index) in laserGates"
                  :key="`laser-gate-${index}`"
                  :class="styles.laserGate"
                >
                  <button @click="removeLaserGate(index)" :class="styles.removeBtn">✕</button>
                  <div>{{ gate }}</div>
                </div>
              </div>
              <div v-else :class="styles.dropHint">Drag gates here</div>
            </div>
          </div>

          <!-- Divider -->
          <div :class="styles.divider"></div>

          <!-- Available gates -->
          <div :class="styles.gatesSection">
            <div :class="styles.sectionLabel">Available Gates</div>
            <div :class="styles.gateGrid">
              <div
                v-for="(gate, index) in level.availableGates"
                :key="`gate-${index}`"
                draggable="true"
                @dragstart="onGateDragStart($event, gate)"
                :class="styles.gateItem"
              >
                {{ gate }}
              </div>
            </div>
          </div>
        </div>

        <button @click="showLaserGates = false" :class="styles.doneBtn">Done</button>
      </div>
    </div>
  </div>
</template>
