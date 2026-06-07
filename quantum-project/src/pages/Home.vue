<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { measureAll, getBlochAngle, getBlochLabel, calculateQuantumState, WELCOME_POPUP, Level, type QuantumState, type IonQuantumState, CELL } from '@/game/quantumgame'
import { LEVELS } from '@/game/levels'
import ManualModal from '@/components/ManualModal.vue'
import styles from './Home.module.css'

defineOptions({ name: 'GameHome' })


// Constants
// ------------------
const TRAVEL_MS = 800
const FPS = 60

const colourS = {
  cyan: '#0ef',        // --colour-primary
  purple: '#b47cff',   // --colour-secondary
  green: '#0f8',
  orange: '#f84',      // --colour-warning
  lightPurple: '#d4aaff',  // --colour-secondary-light
}


// State
// ------------------

const canvas = ref<HTMLCanvasElement | null>(null)
const currentLevelIndex = ref(0)
const ionStates = ref<IonQuantumState[]>([])
const result = ref('—')
const history = ref<number[][]>([])
const showWin = ref(false)
const canMeasure = ref(false)
const showLevelSelector = ref(false)
const showLaserGates = ref(false)
const laserGates = ref<string[]>([])
const isMeasured = ref(false)
const measuredValues = ref<number[] | null>(null)
const ionInitialized = ref(false)
const automatedRunning = ref(false)
const automatedDone = ref(false)
const showPopup = ref(false)
const popupIndex = ref(0)
const tempPopup = ref<{ title: string; text: string } | null>(null)
const showWelcome = ref(true)
const showManual = ref(false)
const gateInventory = ref<Record<string, number>>({})
const currentPopup = computed(() => {
  if (tempPopup.value) return tempPopup.value
  const currentLevel = LEVELS[currentLevelIndex.value]
  if (!currentLevel || !currentLevel.popups) return null
  return currentLevel.popups[popupIndex.value]
})

let level: Level = LEVELS[currentLevelIndex.value]!
let ctx: CanvasRenderingContext2D | null = null
let photon = { progress: 1, segCount: 0 }
let animationFrameId: number | null = null
const shownPopupIndices = ref(new Set<number>())
let lastPopupTrigger: string | null = null


// SAVE/LOAD LOGIC
const savedLevel = localStorage.getItem('quantum_save_level')
if (savedLevel !== null) {
  currentLevelIndex.value = parseInt(savedLevel, 10)
}

// When the level changes, save the new number to the browser
watch(currentLevelIndex, (newLevel) => {
  localStorage.setItem('quantum_save_level', newLevel.toString())
})

// Bloch Sphere
// ------------------

const blochAngle = computed(() => {
  // For multi-ion support, return angle for first ion
  if (ionStates.value.length > 0) {
    return getBlochAngle(ionStates.value[0].state);
  }
  return getBlochAngle('|0⟩');
})

const blochLabel = computed(() => {
  // For multi-ion support, return label for first ion
  if (ionStates.value.length > 0) {
    return getBlochLabel(ionStates.value[0].state);
  }
  return getBlochLabel('|0⟩');
})

const lasercolour = computed(() => {
  if (laserGates.value.includes('CNOT')) return colourS.green
  if (laserGates.value.includes('X')) return colourS.orange
  if (laserGates.value.includes('H')) return colourS.purple
  return colourS.cyan
})

const statecolourClass = computed(() => {
  if (ionStates.value.length === 0) return styles.infoValCyan;
  const state = ionStates.value[0].state;
  if (state === '|+⟩' || state === '|-⟩') return styles.infoValPurple;
  if (state === '|1⟩') return styles.infoValOrange;
  return styles.infoValCyan;
})

const resultcolourClass = computed(() => {
  if (result.value === '1') return styles.infoValOrange;
  return styles.infoValCyan;
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
  // If no ions initialised on this level, show unknown state
  if (!ionInitialized.value && !level.preInitialized) {
    ionStates.value = level.ions.map((_, idx) => ({
      ionIndex: idx,
      state: '?' as any,
      p0: '?',
      p1: '?'
    }));
    canMeasure.value = false;
    return;
  }

  // Check if laser hits ions and show popup if triggered
  const { hitIons } = level.trace(laserGates.value);
  if (hitIons.length > 0) {
    showPopupByTrigger('onLaserToIon');
  }

  const result = calculateQuantumState(level, laserGates.value, isMeasured.value ? measuredValues.value : null);
  ionStates.value = result.states;
  canMeasure.value = result.canMeasure;
}

// Level Progression
// ------------------

function nextLevel() {
  showWin.value = false
  tempPopup.value = null
  if (currentLevelIndex.value < LEVELS.length - 1) {
    currentLevelIndex.value++
    level = LEVELS[currentLevelIndex.value]!
    // Pre-apply any locked gates (insert at locked indices)
    laserGates.value = []
    // Pre-apply locked gate for levels that require it
    if (level.lockedGateIndices.length > 0) {
      for (const idx of level.lockedGateIndices) {
        if (idx === 0 && level.availableGates.length > 0) {
          laserGates.value.push(level.availableGates[0]!)
        }
      }
    }
    isMeasured.value = false
    measuredValues.value = null
    ionInitialized.value = level.preInitialized
    shownPopupIndices.value.clear()
    lastPopupTrigger = null
    setupCanvas()
    // Initialise gate inventory
    gateInventory.value = { ...level.gateInventory }
    // Decrement inventory for locked gates
    for (const idx of level.lockedGateIndices) {
      if (idx < laserGates.value.length) {
        const gate = laserGates.value[idx]!
        if (gateInventory.value[gate] !== undefined) {
          gateInventory.value[gate]--
        }
      }
    }
    
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
  // Pre-apply locked gate for levels that require it
  if (level.lockedGateIndices.length > 0) {
    for (const idx of level.lockedGateIndices) {
      if (idx === 0 && level.availableGates.length > 0) {
        laserGates.value.push(level.availableGates[0]!)
      }
    }
  }
  // Pre-apply H gate for level 5 (special case)
  if (index === 4) {
    laserGates.value = ['H']
  }
  isMeasured.value = false
  measuredValues.value = null
  ionInitialized.value = level.preInitialized
  shownPopupIndices.value.clear()
  lastPopupTrigger = null
  setupCanvas()
  // Initialise gate inventory
  gateInventory.value = { ...level.gateInventory }
  // Decrement inventory for locked gates
  for (const idx of level.lockedGateIndices) {
    if (idx < laserGates.value.length) {
      const gate = laserGates.value[idx]!
      if (gateInventory.value[gate] !== undefined) {
        gateInventory.value[gate]--
      }
    }
  }
  // Special case for level 5's pre-applied H gate
  if (index === 4 && gateInventory.value['H'] !== undefined) {
    gateInventory.value['H']--
  }
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
  // Check if gate is available in inventory
  const available = gateInventory.value[gateType] ?? -1
  if (available === 0) {
    e.preventDefault()
    return
  }
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
    // Decrement inventory if it exists
    if (gateInventory.value[gateType] !== undefined) {
      if (gateInventory.value[gateType]! > 0) {
        gateInventory.value[gateType]!--
      } else {
        return // Can't add gate, no inventory left
      }
    }
    laserGates.value.push(gateType)
    isMeasured.value = false
    measuredValues.value = null
    updateStateForTracing()
  }
}

function removeLaserGate(index: number) {
  // Prevent removing locked gates
  if (level.lockedGateIndices.includes(index)) {
    return
  }
  const gate = laserGates.value[index]!
  laserGates.value.splice(index, 1)
  // Restore inventory
  if (gateInventory.value[gate] !== undefined) {
    gateInventory.value[gate]!++
  }
  isMeasured.value = false
  measuredValues.value = null
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

  // Beam - render parallel split lines for each colour
  const { segs } = level.trace(laserGates.value)
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
    else offsets = s.colours.map((_, i) => -3 + (i * 6 / (numColours - 1)))
    
    for (let i = 0; i < s.colours.length; i++) {
      const offset = offsets[i] || 0
      const x1 = s.x1 + perpX * offset
      const y1 = s.y1 + perpY * offset
      const x2 = s.x2 + perpX * offset
      const y2 = s.y2 + perpY * offset
      
      const colourMap: Record<string, string> = {
        cyan: colourS.cyan,
        orange: colourS.orange,
        purple: colourS.purple,
        green: colourS.green
      }
      
      ctx.strokeStyle = colourMap[s.colours[i]] || colourS.cyan
      ctx.shadowcolor = ctx.strokeStyle
      ctx.shadowBlur = 8
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }
  }
  ctx.shadowBlur = 0

  // Photon dots - render parallel photons for each colour
  photon.progress += 1 / ((TRAVEL_MS / 1000) * FPS)
  if (photon.progress < 1 && segs.length > 0) {
    const t = photon.progress * photon.segCount
    const idx = Math.min(Math.floor(t), segs.length - 1)
    const seg = segs[idx]!
    const f = t - Math.floor(t)
    
    // Calculate perpendicular offset for photon
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
    else offsets = seg.colours.map((_, i) => -3 + (i * 6 / (numColours - 1)))
    
    const colourMap: Record<string, string> = {
      cyan: colourS.cyan,
      orange: colourS.orange,
      purple: colourS.lightPurple,
      green: colourS.green
    }
    
    for (let i = 0; i < seg.colours.length; i++) {
      const offset = offsets[i] || 0
      const px = seg.x1 + (seg.x2 - seg.x1) * f + perpX * offset
      const py = seg.y1 + (seg.y2 - seg.y1) * f + perpY * offset
      
      ctx.fillStyle = colourMap[seg.colours[i]] || colourS.cyan
      ctx.shadowColor = ctx.fillStyle
      ctx.shadowBlur = 10
      ctx.beginPath()
      ctx.arc(px, py, 4, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.shadowBlur = 0
  }

  // Laser source
  const sx = level.src.col * CELL
  const sy = level.src.row * CELL
  ctx.fillStyle = lasercolour.value
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
  ctx.lineWidth = 2
  for (const w of level.walls) {
    const wx = w.col * CELL
    const wy = w.row * CELL
    let strokeCol = '#ff4444'
    if (w.type === 'standard' || w.type === 'all') strokeCol = '#ff4444'
    else if (w.type === 'cyan') strokeCol = colourS.cyan
    else if (w.type === 'orange') strokeCol = colourS.orange
    else if (w.type === 'purple') strokeCol = colourS.purple
    else if (w.type === 'green') strokeCol = colourS.green
    ctx.strokeStyle = strokeCol
    ctx.beginPath()
    ctx.moveTo(wx + 16, wy + 16)
    ctx.lineTo(wx + CELL - 16, wy + CELL - 16)
    ctx.moveTo(wx + CELL - 16, wy + 16)
    ctx.lineTo(wx + 16, wy + CELL - 16)
    ctx.stroke()
  }

  // Ions
  const ionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
  for (let ionIdx = 0; ionIdx < level.ions.length; ionIdx++) {
    const ion = level.ions[ionIdx];
    const ix = ion.col * CELL + CELL / 2;
    const iy = ion.row * CELL + CELL / 2;
    ctx.strokeStyle = '#f84';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#f84';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(ix, iy, 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#f84';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ION ' + ionLabels[ionIdx], ix, iy);
  }

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
  // clear any temporary popup content
  tempPopup.value = null
  
  // Handle post-popup actions based on the trigger that opened this popup
  if (lastPopupTrigger === 'onLaserGatesOpen') {
    showLaserGates.value = true
  }
  
    // If  popup was confirmation to start the automated demo, start it after it's closed
    if (lastPopupTrigger === 'onAutomatedStart') {
      startAutomatedDemo()
    }
  
    lastPopupTrigger = null
}

  // Start the automated reset / measure demo (10 iterations)
  function startAutomatedDemo() {
    automatedRunning.value = true
    ;(async () => {
      const iterations = 10
      const results: number[][] = []
      for (let i = 0; i < iterations; i++) {

        // visual reset
        ionInitialized.value = true
        isMeasured.value = false
        measuredValues.value = null
        result.value = '—'
        updateStateForTracing()

        // photon travel
        photon = { progress: 0, segCount: level.trace(laserGates.value).segs.length }
        await new Promise((res) => setTimeout(res, TRAVEL_MS))

        // perform measurement
        const measResults = measureAll()
        results.push(measResults)

        // update UI 
        measuredValues.value = measResults
        isMeasured.value = true
        updateStateForTracing()
        result.value = measResults.join(',')
        history.value.push(measResults)
        if (history.value.length > 50) history.value.shift()

        // small pause 
        await new Promise((res) => setTimeout(res, 100))
      }

      automatedRunning.value = false
      automatedDone.value = true

      // Show popup with history
      tempPopup.value = {
        title: 'Measurement Demo Results',
        text: `Measurements: ${results.map(r => r.join('')).join(' ')}
        (A superposition state will randomly collapse to either |0⟩ or |1⟩ when measured.)`
      }
      showPopup.value = true

      // mark level complete after demo
      showWin.value = true
      canMeasure.value = true
    })()
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

  photon = { progress: 0, segCount: level.trace(laserGates.value).segs.length }

  setTimeout(() => {
    // If already measured, keep showing the same value but add to history
    if (isMeasured.value) {
      result.value = measuredValues.value ? measuredValues.value.join(',') : '—'
      history.value.push(measuredValues.value!)
      if (history.value.length > 20) history.value.shift()
      canMeasure.value = true
      return
    }

    // Measure all ions
    const measResults = measureAll()
    measuredValues.value = measResults
    isMeasured.value = true
    
    // Update display
    updateStateForTracing()
    result.value = measResults.join(',')
    history.value.push(measResults)
    if (history.value.length > 20) history.value.shift()

    canMeasure.value = true
    // Check if required gate count is met
    if (level.requiredGateCount !== null && laserGates.value.length !== level.requiredGateCount) {
      // Don't allow winning without the correct number of gates
      showWin.value = false
      return
    }
    
    // Evaluate win condition based on the pre-measure quantum state
    const stateInfo = calculateQuantumState(level, laserGates.value, null)
    const wc = level.winCondition
    let win = false
    if (wc === 'any') win = true
    else if (wc === 'superposition') {
      win = stateInfo.states.some(s => s.state === '|+⟩' || s.state === '|-⟩')
    }
    else if (wc === 'positive-superposition') {
      win = stateInfo.states.some(s => s.state === '|+⟩')
    }
    else if (wc === 'negative-superposition') {
      win = stateInfo.states.some(s => s.state === '|-⟩')
    }
    else if (wc === 'normal') {
      win = stateInfo.states.every(s => s.state === '|0⟩' || s.state === '|1⟩')
    }
    else if (wc === '|0⟩' || wc === '0') {
      win = stateInfo.states.length === 1 && stateInfo.states[0].state === '|0⟩'
    }
    else if (wc === '|1⟩' || wc === '1') {
      win = stateInfo.states.length === 1 && stateInfo.states[0].state === '|1⟩'
    }
    else if (wc === 'cnot-success') {
      // For CNOT level: both ions should be measured as |1⟩
      win = stateInfo.states.length === 2 && 
            stateInfo.states[0].state === '|1⟩' &&
            stateInfo.states[1].state === '|1⟩'
    }

    if (win) showWin.value = true

    // If the level requests an automated measurement demo
    // show the automated-demo popup & fallback to starting immediately
    if (level.automateMeasurement && !automatedRunning.value) {
      if (currentLevelIndex.value === 5 && stateInfo.state === '|+⟩' || stateInfo.state === '|-⟩') {
        const shown = showPopupByTrigger('onAutomatedStart')
        if (!shown) startAutomatedDemo()
      } else {
        // If not in superposition, no automated demo
      }
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
  measuredValues.value = null
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
  level = LEVELS[currentLevelIndex.value]!
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
 
      <!-- Sidebar: Bloch sphere + measurement info for each ion -->
      <aside :class="styles.sidebar">
 
        <!-- Loop over all ions and display their Bloch spheres -->
        <div v-for="(ionState, idx) in ionStates" :key="idx" :class="styles.ionSection">
          <!-- Bloch sphere for this ion -->
          <div :class="styles.blochPanel">
            <div :class="styles.blochTitle">Ion {{ String.fromCharCode(65 + idx) }} - Bloch Sphere</div>
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
              <g v-if="getBlochAngle(ionState.state) !== null">
                <!-- Arrow line from centre in the direction of angle -->
                <line
                  x1="80" y1="80"
                  :x2="80 + 44 * Math.cos((getBlochAngle(ionState.state) * Math.PI) / 180)"
                  :y2="80 + 44 * Math.sin((getBlochAngle(ionState.state) * Math.PI) / 180)"
                  :class="styles.blochArrow"
                />
                <!-- Arrowhead circle at tip -->
                <circle
                  :cx="80 + 46 * Math.cos((getBlochAngle(ionState.state) * Math.PI) / 180)"
                  :cy="80 + 46 * Math.sin((getBlochAngle(ionState.state) * Math.PI) / 180)"
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
              [styles.blochStateSuperposition as string]: ionState.state === '|+⟩' || ionState.state === '|-⟩'
            }">
              {{ getBlochLabel(ionState.state) }}
            </div>
          </div>
   
          <!-- Measurement info panel for this ion -->
          <div :class="styles.infoPanel">
            <div :class="styles.infoRow">
              <span :class="styles.infoKey">State</span>
              <span :class="[styles.infoVal, ionState.state === '|+⟩' || ionState.state === '|-⟩' ? styles.infoValPurple : ionState.state === '|1⟩' ? styles.infoValOrange : styles.infoValCyan]">{{ ionState.state }}</span>
            </div>
            <div :class="styles.infoRow">
              <span :class="styles.infoKey">P(|0⟩)</span>
              <span :class="styles.infoVal">{{ ionState.p0 }}</span>
            </div>
            <div :class="styles.infoRow">
              <span :class="styles.infoKey">P(|1⟩)</span>
              <span :class="styles.infoVal">{{ ionState.p1 }}</span>
            </div>
          </div>
        </div>
        
        <!-- Shared measurement button and controls -->
        <div :class="styles.sharedControls">
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
            <span :class="[styles.infoVal, resultcolourClass]">{{ result }}</span>
          </div>
          <div v-if="history.length" :class="styles.history">
            <span :class="styles.infoKey">History</span>
            <span :class="styles.historyBits">{{ history.map((r: number[]) => r.join('')).join(' ') }}</span>
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
            <div :class="styles.sectionLabel">Applied to Laser
              <span v-if="level.requiredGateCount !== null" :class="styles.gateCount">
                ({{ laserGates.length }}/{{ level.requiredGateCount }})
              </span>
            </div>
            <div
              @dragover="onLaserDragOver"
              @drop="onLaserDrop"
              :class="styles.laserDropZone"
            >
              <div v-if="laserGates.length > 0" :class="styles.gateStack">
                <div
                  v-for="(gate, index) in laserGates"
                  :key="`laser-gate-${index}`"
                  :class="[
                    styles.laserGate,
                    { [styles.laserGateX as string]: gate === 'X' }, 
                    { [styles.laserGateH as string]: gate === 'H' },
                    { [styles.laserGateCNOT as string]: gate === 'CNOT' }
                  ]"
                >
                  <button v-if="!level.lockedGateIndices.includes(index)" @click="removeLaserGate(index)" :class="styles.removeBtn">✕</button>
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
                  :class="[styles.gateItem, 
                    { [styles.gateItemX as string]: gate === 'X' },
                    { [styles.gateItemH as string]: gate === 'H' },
                    { [styles.gateItemCNOT as string]: gate === 'CNOT' },
                    { [styles.gateItemDisabled as string]: (gateInventory[gate] ?? -1) === 0 }
                  ]"
                >
                <div>{{ gate }}</div>
                <div v-if="gateInventory[gate] !== undefined" :class="styles.gateItemCount">
                  {{ gateInventory[gate] }}
                </div>
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
