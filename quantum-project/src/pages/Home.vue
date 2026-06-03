<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { measure, getBlochAngle, getBlochLabel, calculateQuantumState, WELCOME_POPUP, Level, type QuantumState } from '@/game/quantumgame'
import { LEVELS } from '@/game/levels'
import ManualModal from '@/components/ManualModal.vue'
import styles from './Home.module.css'

defineOptions({ name: 'GameHome' })


// Constants
// ------------------

const CELL = 56
const TRAVEL_MS = 800
const FPS = 60

// Colors defined here match the CSS custom properties in Home.module.css
const COLORS = {
  cyan: '#0ef',        // --color-primary
  purple: '#b47cff',   // --color-secondary
  red: '#f84',         // --color-danger
  lightPurple: '#d4aaff',  // --color-secondary-light
  lightRed: '#ff6644'      // --color-danger-light
}


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
const ionInitialized = ref(false)
const showPopup = ref(false)
const popupIndex = ref(0)
const tempPopup = ref<{ title: string; text: string } | null>(null)
const showWelcome = ref(true)
const showManual = ref(false)
const currentPopup = computed(() => {
  if (tempPopup.value) return tempPopup.value
  const popups = level.popups
  return popups[popupIndex.value]
})

let level: Level = LEVELS[currentLevelIndex.value]!
let ctx: CanvasRenderingContext2D | null = null
let photon = { progress: 1, segCount: 0 }
let animationFrameId: number | null = null
const shownPopupIndices = ref(new Set<number>())
let lastPopupTrigger: string | null = null


// Bloch Sphere
// ------------------

const blochAngle = computed(() => getBlochAngle(state.value))

const blochLabel = computed(() => getBlochLabel(state.value))

const laserColor = computed(() => {
  if (laserGates.value.includes('X')) return COLORS.red
  return laserGates.value.length > 0 ? COLORS.purple : COLORS.cyan
})

const stateColorClass = computed(() => {
  if (state.value === '|+⟩' || state.value === '|-⟩') return styles.infoValPurple
  if (state.value === '|1⟩') return styles.infoValOrange
  return styles.infoValCyan
})

const resultColorClass = computed(() => {
  if (result.value === '1') return styles.infoValOrange
  return styles.infoValCyan
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
  // If ion is not initialized on this level, show unknown state
  if (!ionInitialized.value && !level.preInitialized) {
    state.value = '?'
    p0.value = '?'
    p1.value = '?'
    canMeasure.value = false
    return
  }

  // Check if laser hits ion and show popup if triggered
  const { hitIon } = level.trace()
  if (hitIon) {
    showPopupByTrigger('onLaserToIon')
  }

  const result = calculateQuantumState(level, laserGates.value, isMeasured.value ? measuredValue.value : null)
  state.value = result.state
  p0.value = result.p0
  p1.value = result.p1
  // On level 5, only allow measuring when the state is in the ground state |0⟩
  canMeasure.value = result.canMeasure && !(currentLevelIndex.value === 4 && state.value !== '|0⟩')
}

// Level Progression
// ------------------

function nextLevel() {
  showWin.value = false
  tempPopup.value = null
  if (currentLevelIndex.value < LEVELS.length - 1) {
    currentLevelIndex.value++
    level = LEVELS[currentLevelIndex.value]!
    laserGates.value = []
    // Pre-apply H gate for level 5
    if (currentLevelIndex.value === 4) {
      laserGates.value = ['H']
    }
    isMeasured.value = false
    measuredValue.value = null
    ionInitialized.value = level.preInitialized
    shownPopupIndices.value.clear()
    lastPopupTrigger = null
    setupCanvas()
    updateStateForTracing()
    result.value = '—'
    history.value = []
    popupIndex.value = 0
    showPopupByTrigger('onLoad')
  }
}

function selectLevel(index: number) {
  showLevelSelector.value = false
  tempPopup.value = null
  currentLevelIndex.value = index
  level = LEVELS[currentLevelIndex.value]!
  laserGates.value = []
  // Pre-apply H gate for level 5
  if (index === 4) {
    laserGates.value = ['H']
  }
  isMeasured.value = false
  measuredValue.value = null
  ionInitialized.value = level.preInitialized
  shownPopupIndices.value.clear()
  lastPopupTrigger = null
  setupCanvas()
  updateStateForTracing()
  result.value = '—'
  history.value = []
  showWin.value = false
  popupIndex.value = 0
  showPopupByTrigger('onLoad')
}

// Laser Gate Placement
// ------------------

function openLaserGates() {
  if (!showPopupByTrigger('onLaserGatesOpen')) {
    showLaserGates.value = true
  }
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
    isMeasured.value = false
    measuredValue.value = null
    updateStateForTracing()
  }
}

function removeLaserGate(index: number) {
  // On level 5, prevent removing the first H gate
  if (currentLevelIndex.value === 4 && index === 0) {
    return
  }
  laserGates.value.splice(index, 1)
  isMeasured.value = false
  measuredValue.value = null
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
    let col = COLORS.cyan
    if (s.afterH) {
      col = COLORS.purple
    } else if (laserColor.value === COLORS.red) {
      col = COLORS.red
    }
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
    const seg = segs[idx]!
    const f = t - Math.floor(t)
    const px = seg.x1 + (seg.x2 - seg.x1) * f
    const py = seg.y1 + (seg.y2 - seg.y1) * f
    let col = '#fff'
    if (seg.afterH || laserColor.value === COLORS.purple) {
      col = COLORS.lightPurple
    } else if (laserColor.value === COLORS.red) {
      col = COLORS.lightRed
    }
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

// Popup Control
// ------------------

function closeWelcome() {
  showWelcome.value = false
}

function showPopupByTrigger(trigger: string): boolean {
  const nextPopupIndex = level.popups.findIndex((p, idx) => p.trigger === trigger && !shownPopupIndices.value.has(idx))
  
  if (nextPopupIndex !== -1) {
    popupIndex.value = nextPopupIndex
    showPopup.value = true
    shownPopupIndices.value.add(nextPopupIndex)
    lastPopupTrigger = trigger
    return true
  }
  return false
}

function closePopup() {
  showPopup.value = false
  
  // Handle post-popup actions based on the trigger that opened this popup
  if (lastPopupTrigger === 'onLaserGatesOpen') {
    showLaserGates.value = true
  }
  
  lastPopupTrigger = null
}

function advancePopup() {
  // Mark current popup as shown before advancing
  shownPopupIndices.value.add(popupIndex.value)
  
  if (popupIndex.value < level.popups.length - 1) {
    const nextPopup = level.popups[popupIndex.value + 1]
    // If the next popup has a trigger other than 'onLoad', don't advance - wait for the trigger
    if (nextPopup?.trigger && nextPopup.trigger !== 'onLoad') {
      closePopup()
      return
    }
    popupIndex.value++
  } else {
    closePopup()
  }
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

    const stateInfo = calculateQuantumState(level, laserGates.value, null)
    const r = measure(stateInfo.state as QuantumState)
    
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
  const scaleX = canvas.value.width / rect.width
  const scaleY = canvas.value.height / rect.height
  const col = Math.floor(((e.clientX - rect.left - 2) * scaleX) / CELL)
  const row = Math.floor(((e.clientY - rect.top - 2) * scaleY) / CELL)

  // Change cursor when hovering over laser if gates are available
  if (col === level.src.col && row === level.src.row && level.availableGates.length > 0) {
    canvas.value.style.cursor = 'pointer'
  } else {
    canvas.value.style.cursor = 'crosshair'
  }
}

function handleReset() {
  ionInitialized.value = true
  isMeasured.value = false
  measuredValue.value = null
  result.value = '—'
  updateStateForTracing()
  showPopupByTrigger('onReset')
}

function handleCanvasClick(e: MouseEvent) {
  if (!canvas.value) return
  const rect = canvas.value.getBoundingClientRect()
  const scaleX = canvas.value.width / rect.width
  const scaleY = canvas.value.height / rect.height
  const col = Math.floor(((e.clientX - rect.left - 2) * scaleX) / CELL)
  const row = Math.floor(((e.clientY - rect.top - 2) * scaleY) / CELL)

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
  const scaleX = canvas.value.width / rect.width
  const scaleY = canvas.value.height / rect.height
  const col = Math.floor(((e.clientX - rect.left - 2) * scaleX) / CELL)
  const row = Math.floor(((e.clientY - rect.top - 2) * scaleY) / CELL)

  if (!level.isFixed(col, row)) level.grid[row]![col] = null
  updateStateForTracing()
}

// Game Loop
// ------------------

onMounted(() => {
  ionInitialized.value = level.preInitialized
  setupCanvas()
  updateStateForTracing()
  draw()
  popupIndex.value = 0
  showPopupByTrigger('onLoad')
})

onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
})
</script>

<template>
  <div :class="styles.gameContainer">
    <h1 :class="styles.title">Quantum Laser Puzzle Game</h1>
    <p :class="styles.hint">{{ level.hint }}</p>

    <!-- Welcome popup modal -->
    <div v-if="showWelcome" :class="styles.welcomeOverlay">
      <div :class="styles.welcomeModal">
        <div :class="styles.welcomeTitle">{{ WELCOME_POPUP.title }}</div>
        <div :class="styles.welcomeText">{{ WELCOME_POPUP.text }}</div>
        <button @click="closeWelcome()" :class="styles.welcomeBtn">Continue</button>
      </div>
    </div>

    <div :class="styles.controls">
      <p :class="styles.controlsText">Left-click to place/rotate mirror · Right-click to remove</p>
      <button @click="clearMirrors" :class="styles.clearBtn">Clear Mirrors</button>
    </div>

    <!-- Level select, goal and success message on same line -->
    <div :class="styles.controlsRow">
      <button @click="showLevelSelector = true" :class="styles.levelIndicator">
        Level {{ currentLevelIndex + 1 }}
      </button>
      <button @click="showManual = true" :class="styles.manualBtn">
        Manual
      </button>
      <div :class="styles.goalBox">
        <div :class="styles.goalLabel">Goal</div>
        <div :class="styles.goalValue">{{ level.goal }}</div>
      </div>
      <div :class="styles.successBoxContainer">
        <div v-if="showWin" :class="styles.successBox">
          <div :class="styles.successText">ION SUCCESSFULLY EXCITED</div>
          <button @click="nextLevel" :class="styles.nextBtn">{{  LEVELS.length - 1 > currentLevelIndex ? 'Next Level' : 'Completed!' }}</button>
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
            <span :class="[styles.infoVal, stateColorClass]">{{ state }}</span>
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
            :class="styles.resetBtn"
          >
            Reset Ion
          </button>
          
          <div :class="styles.infoRow">
            <span :class="styles.infoKey">Last</span>
            <span :class="[styles.infoVal, resultColorClass]">{{ result }}</span>
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
                  :class="[styles.laserGate, { [styles.laserGateX as string]: gate === 'X' }]"
                >
                  <button v-if="!(currentLevelIndex === 4 && index === 0)" @click="removeLaserGate(index)" :class="styles.removeBtn">✕</button>
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
                :class="[styles.gateItem, { [styles.gateItemX as string]: gate === 'X' }]"
              >
                {{ gate }}
              </div>
            </div>
          </div>
        </div>

        <button @click="showLaserGates = false" :class="styles.doneBtn">Done</button>
      </div>
    </div>

    <!-- Tutorial popup modal -->
    <div v-if="showPopup && currentPopup" :class="styles.popupOverlay" @click="closePopup()">
      <div :class="styles.popupModal" @click.stop>
        <div :class="styles.popupTitle">{{ currentPopup.title }}</div>
        <div :class="styles.popupText">{{ currentPopup.text }}</div>
        <button @click="advancePopup()" :class="styles.popupBtn">
          {{ level.popups.length - 1 > popupIndex ? 'Next' : 'Got it' }}
        </button>
      </div>
    </div>

    <!-- Manual Modal Component -->
    <ManualModal :isOpen="showManual" @close="showManual = false" @selectLevel="selectLevel" />
  </div>
</template>
