<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { measureAll, getBlochAngle, getBlochLabel, calculateQuantumState, WELCOME_POPUP, Level, type IonQuantumState, CELL } from '@/game/quantumgame'
import { LEVELS } from '@/game/levels'
import ManualModal from '@/components/ManualModal.vue'
import GameBoard from '@/components/GameBoard.vue'
import styles from './Home.module.css'

defineOptions({ name: 'GameHome' })

// Constants
// ------------------
const TRAVEL_MS = 800

// State
// ------------------
const gameBoardRef = ref<InstanceType<typeof GameBoard> | null>(null)
const currentLevelIndex = ref(0)
const ionStates = ref<IonQuantumState[]>([])
const result = ref('—')
const history = ref<number[][]>([])
const showWin = ref(false)
const canMeasure = ref(false)
const showLevelSelector = ref(false)
const showLaserGates = ref(false)
const sourceGates = ref<string[][]>([])
const activeSourceIndex = ref<number>(0)
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
const shownPopupIndices = ref(new Set<number>())
let lastPopupTrigger: string | null = null


// SAVE/LOAD LOGIC
const savedLevel = localStorage.getItem('quantum_save_level')
if (savedLevel !== null) {
  currentLevelIndex.value = parseInt(savedLevel, 10)
}

watch(currentLevelIndex, (newLevel) => {
  localStorage.setItem('quantum_save_level', newLevel.toString())
})

const displayedGateProgress = computed(() => {
  if (level.requiredGateCount === null) return null;
  
  if (Array.isArray(level.requiredGateCount)) {
    const requiredForThisSource = level.requiredGateCount[activeSourceIndex.value] ?? 0;
    return `(${activeGates.value.length}/${requiredForThisSource})`;
  } else {
    const totalApplied = sourceGates.value.flat().length;
    return `(${totalApplied}/${level.requiredGateCount})`;
  }
})

const activeGates = computed(() => sourceGates.value[activeSourceIndex.value] ?? [])

const resultcolourClass = computed(() => {
  if (result.value === '1') return styles.infoValOrange;
  return styles.infoValCyan;
})


// Level Progression
// ------------------
function nextLevel() {
  if (currentLevelIndex.value < LEVELS.length - 1) {
    selectLevel(currentLevelIndex.value + 1);
  }
}

function updateStateForTracing() {
  if (!ionInitialized.value && !level.preInitialized) {
    ionStates.value = level.ions.map((_, idx) => ({
      ionIndex: idx,
      state: '—' as const,
      p0: '—',
      p1: '—'
    }));
    canMeasure.value = false;
    return;
  }

  const { hitIons } = level.trace(sourceGates.value);
  if (hitIons.length > 0) {
    showPopupByTrigger('onLaserToIon');
  }

  const result = calculateQuantumState(level, sourceGates.value, isMeasured.value ? measuredValues.value : null);
  ionStates.value = result.states;
  canMeasure.value = result.canMeasure;
}

function initLevelGates() {
  sourceGates.value = level.sources.map((_, i) => {
    return level.prePlacedGates && level.prePlacedGates[i] ? [...level.prePlacedGates[i]!] : [];
  });
}

async function selectLevel(index: number) {
  showLevelSelector.value = false;
  tempPopup.value = null;
  currentLevelIndex.value = index;
  level = LEVELS[currentLevelIndex.value]!;
  isMeasured.value = false;
  measuredValues.value = null;
  ionInitialized.value = level.preInitialized;
  shownPopupIndices.value.clear();
  lastPopupTrigger = null;
  
  gateInventory.value = { ...level.gateInventory };
  
  await nextTick();
  initLevelGates();
  
  const flatLocked = sourceGates.value.flat();
  for (const idx of level.lockedGateIndices) {
    if (idx < flatLocked.length) {
      const gate = flatLocked[idx]!;
      if (gateInventory.value[gate] !== undefined) {
        gateInventory.value[gate]--;
      }
    }
  }

  updateStateForTracing();
  result.value = '—';
  history.value = [];
  showWin.value = false;
  popupIndex.value = 0;
  showPopupByTrigger('onLoad');
}


// Laser Gate Placement
// ------------------
function openLaserGates() {
  if (!showPopupByTrigger('onLaserGatesOpen')) {
    showLaserGates.value = true
  }
}

function onGateDragStart(e: DragEvent, gateType: string) {
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
    if (gateInventory.value[gateType] !== undefined) {
      if (gateInventory.value[gateType]! > 0) {
        gateInventory.value[gateType]!--
      } else {
        return 
      }
    }
    const idx = activeSourceIndex.value
    if (!sourceGates.value[idx]) sourceGates.value[idx] = []
    sourceGates.value[idx].push(gateType)
    isMeasured.value = false
    measuredValues.value = null
    updateStateForTracing()
  }
}

function removeLaserGate(index: number) {
  const activeIdx = activeSourceIndex.value
  const flatIndexBase = sourceGates.value.slice(0, activeIdx).flat().length
  if (level.lockedGateIndices.includes(flatIndexBase + index)) {
    return
  }
  const gate = sourceGates.value[activeIdx]![index]!
  sourceGates.value[activeIdx]!.splice(index, 1)
  if (gateInventory.value[gate] !== undefined) {
    gateInventory.value[gate]!++
  }
  isMeasured.value = false
  measuredValues.value = null
  updateStateForTracing()
}

function isGateLocked(localIndex: number) {
  const activeIdx = activeSourceIndex.value;
  const flatIndexBase = sourceGates.value.slice(0, activeIdx).flat().length;
  return level.lockedGateIndices.includes(flatIndexBase + localIndex);
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
  tempPopup.value = null
  if (lastPopupTrigger === 'onLaserGatesOpen') {
    showLaserGates.value = true
  }
  if (lastPopupTrigger === 'onAutomatedStart') {
    startAutomatedDemo()
  }
  lastPopupTrigger = null
}

function startAutomatedDemo() {
  automatedRunning.value = true
  ;(async () => {
    const iterations = 10
    const results: number[][] = []
    for (let i = 0; i < iterations; i++) {
      ionInitialized.value = true
      isMeasured.value = false
      measuredValues.value = null
      result.value = '—'
      updateStateForTracing()

      gameBoardRef.value?.resetPhoton()
      await new Promise((res) => setTimeout(res, TRAVEL_MS))

      const measResults = measureAll()
      results.push(measResults)

      measuredValues.value = measResults
      isMeasured.value = true
      updateStateForTracing()
      result.value = measResults.join(',')
      history.value.push(measResults)
      if (history.value.length > 50) history.value.shift()

      await new Promise((res) => setTimeout(res, 50))
    }

    automatedRunning.value = false
    automatedDone.value = true

    tempPopup.value = {
      title: 'Measurement Demo Results',
      text: `Measurements: ${results.map(r => r.join('')).join(' ')}
      (A superposition state will randomly collapse to either |0⟩ or |1⟩ when measured.)`
    }
    showPopup.value = true
    showWin.value = true
    canMeasure.value = true
  })()
}

function advancePopup() {
  shownPopupIndices.value.add(popupIndex.value)
  if (popupIndex.value < level.popups.length - 1) {
    const nextPopup = level.popups[popupIndex.value + 1]
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

  gameBoardRef.value?.resetPhoton()

  setTimeout(() => {
    if (isMeasured.value) {
      result.value = measuredValues.value ? measuredValues.value.join(',') : '—'
      history.value.push(measuredValues.value!)
      if (history.value.length > 20) history.value.shift()
      canMeasure.value = true
      return
    }

    const measResults = measureAll()
    measuredValues.value = measResults
    isMeasured.value = true
    
    updateStateForTracing()
    result.value = measResults.join(',')
    history.value.push(measResults)
    if (history.value.length > 20) history.value.shift()

    canMeasure.value = true
    
    if (level.requiredGateCount !== null) {
      if (Array.isArray(level.requiredGateCount)) {
        let isValid = true;
        for (let i = 0; i < level.requiredGateCount.length; i++) {
          const count = sourceGates.value[i]?.length || 0;
          if (count !== level.requiredGateCount[i]) {
            isValid = false;
            break;
          }
        }
        if (!isValid) {
          showWin.value = false;
          return;
        }
      } else {
        const flatGateCount = sourceGates.value.flat().length;
        if (flatGateCount !== level.requiredGateCount) {
          showWin.value = false;
          return;
        }
      }
    }
    
    const stateInfo = calculateQuantumState(level, sourceGates.value, null)
    const states = stateInfo.states ?? []
    const wc = level.winCondition
    let win = false
    
    if (wc === 'any') win = true
    else if (wc === 'superposition') win = states.some(s => s.state === '|+⟩' || s.state === '|-⟩')
    else if (wc === 'positive-superposition') win = states.some(s => s.state === '|+⟩')
    else if (wc === 'negative-superposition') win = states.some(s => s.state === '|-⟩')
    else if (wc === 'normal') win = states.every(s => s.state === '|0⟩' || s.state === '|1⟩')
    else if (wc === '|0⟩' || wc === '0') win = states.length === 1 && states[0]?.state === '|0⟩'
    else if (wc === '|1⟩' || wc === '1') win = states.length === 1 && states[0]?.state === '|1⟩'
    else if (wc === 'cnot-success') win = states.length === 2 && states[0]?.state === '|1⟩' && states[1]?.state === '|1⟩'
    else if (wc === 'cnot-01') win = states.length === 2 && states[0]?.state === '|0⟩' && states[1]?.state === '|1⟩'
    else if (wc === 'cnot-00') win = states.length === 2 && states[0]?.state === '|0⟩' && states[1]?.state === '|0⟩'
    else if (wc === 'multi-superposition') win = states.length >= 2 && states.every(s => s.state === '|+⟩')
    else if (wc === '111') win = states.length === 3 && states[0]?.state === '|1⟩' && states[1]?.state === '|1⟩' && states[2]?.state === '|1⟩'

    if (win) { showWin.value = true

    if (level.automateMeasurement && !automatedRunning.value) {
      const anySuperposition = states.some(s => s.state === '|+⟩' || s.state === '|-⟩')
      if (anySuperposition) {
        const shown = showPopupByTrigger('onAutomatedStart')
        if (!shown) startAutomatedDemo()
        }
      }
    }
  }, TRAVEL_MS)
}

function handleReset() {
  ionInitialized.value = true
  isMeasured.value = false
  measuredValues.value = null
  result.value = '—'
  updateStateForTracing()
  showPopupByTrigger('onReset')
}

function handleGameBoardClick(col: number, row: number) {
  const clickedSourceIdx = level.sources.findIndex(s => s.col === col && s.row === row)
  if (clickedSourceIdx !== -1 && level.availableGates.length > 0) {
    activeSourceIndex.value = clickedSourceIdx
    openLaserGates()
    return
  }
}

// Game Loop
// ------------------
onMounted(() => {
  level = LEVELS[currentLevelIndex.value]!
  ionInitialized.value = level.preInitialized
  initLevelGates()
  updateStateForTracing()
  popupIndex.value = 0
  showPopupByTrigger('onLoad')
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
      <button 
        @click="showLevelSelector = true" 
        :disabled="automatedRunning"
        :class="styles.levelIndicator"
      >
        Level {{ currentLevelIndex + 1 }}
      </button>
      
      <button 
        @click="showManual = true" 
        :disabled="automatedRunning"
        :class="styles.manualBtn"
      >
        Manual
      </button>
      
      <div :class="styles.goalBox">
        <div :class="styles.goalLabel">Goal</div>
        <div :class="styles.goalValue">{{ level.goal }}</div>
      </div>
      
      <div :class="styles.successBoxContainer">
        <div v-if="showWin" :class="styles.successBox">
          <div :class="styles.successText">ION SUCCESSFULLY EXCITED</div>
          <button 
            @click="nextLevel" 
            :disabled="automatedRunning"
            :class="styles.nextBtn"
          >
            {{ LEVELS.length - 1 > currentLevelIndex ? 'Next Level' : 'Completed!' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Main game area -->
    <div :class="styles.mainArea">
      <!-- Game canvas - using extracted GameBoard component -->
      <div :class="styles.canvasWrap">
        <GameBoard
          ref="gameBoardRef"
          mode="play"
          :level="level"
          :sourceGates="sourceGates"
          @canvas-click="handleGameBoardClick"
          @canvas-mirror-place="updateStateForTracing"
        />
      </div>
 
      <!-- Sidebar: Bloch sphere + measurement info for each ion -->
      <aside :class="styles.sidebar">
 
        <div :class="styles.ionWrapper">
          <div 
            v-for="(ionState, idx) in ionStates" 
            :key="idx" 
            :class="[styles.ionSection, { [styles.ionSectionCompact as string]: ionStates.length >= 3 }]"
          >
            <div :class="[styles.blochPanel, { [styles.blochPanelCompact as string]: ionStates.length >= 3 }]" style="text-align: center;">
              <div :class="styles.blochTitle">
                Ion {{ String.fromCharCode(65 + idx) }}<span v-if="ionStates.length < 3"> - Bloch Sphere</span>
              </div>
              
              <svg :class="[styles.blochSvg, { [styles.blochSvgCompact as string]: ionStates.length >= 3 }]" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" style="max-width: 90px; height: auto; margin: 0 auto;">
                <text x="80" y="14" :class="styles.blochLabel" text-anchor="middle">|1⟩</text>
                <text x="80" y="156" :class="styles.blochLabel" text-anchor="middle">|0⟩</text>
                <text x="10" y="84" :class="styles.blochLabel" text-anchor="middle">−</text>
                <text x="150" y="84" :class="styles.blochLabel" text-anchor="middle">+</text>
    
                <circle cx="80" cy="80" r="52" :class="styles.blochCircle" />
    
                <ellipse cx="80" cy="80" rx="52" ry="14" :class="styles.blochEquator" />
    
                <g v-if="getBlochAngle(ionState.state) !== null">
                  <line
                    x1="80" y1="80"
                    :x2="80 + 44 * Math.cos(((getBlochAngle(ionState.state) ?? 0) * Math.PI) / 180)"
                    :y2="80 + 44 * Math.sin(((getBlochAngle(ionState.state) ?? 0) * Math.PI) / 180)"
                    :class="styles.blochArrow"
                  />
                  <circle
                    :cx="80 + 46 * Math.cos(((getBlochAngle(ionState.state) ?? 0) * Math.PI) / 180)"
                    :cy="80 + 46 * Math.sin(((getBlochAngle(ionState.state) ?? 0) * Math.PI) / 180)"
                    r="3"
                    :class="styles.blochTip"
                  />
                </g>
    
                <circle cx="80" cy="80" r="3" :class="styles.blochCenter" />
              </svg>
    
              <div :class="{
                [styles.blochState as string]: true,
                [styles.blochStateSuperposition as string]: ionState.state === '|+⟩' || ionState.state === '|-⟩'
              }" style="max-width: 90px; white-space: normal !important; word-wrap: break-word; line-height: 1.2; margin: 0 auto;">
                {{ getBlochLabel(ionState.state) }}
              </div>
            </div>
    
            <div v-if="ionStates.length < 3" :class="styles.infoPanel">
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
        </div>
        
        <div :class="styles.sharedControls">
          <button 
            @click="handleMeasure"
            :disabled="!canMeasure || automatedRunning"
            :class="styles.measureBtn"
          >
            Measure
          </button>

          <button
            v-if="level.showResetButton"
            @click="handleReset"
            :disabled="automatedRunning"
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
      <div :class="styles.levelSelectorModal" @click.stop>
        
        <div :class="styles.levelGroup">
          
          <div :class="styles.levelGroupTitle">1 Qubit Systems</div>
          <div :class="styles.levelSelectorGrid">
            <div
              v-for="(_, index) in LEVELS.slice(0, 9)"
              :key="'group1-' + index"
              @click="selectLevel(index)"
              :class="[styles.levelSelectorSquare, { [styles.levelSelectorActive as string]: index === currentLevelIndex }]"
            >
              {{ index + 1 }}
            </div>
          </div>
        </div>

        <div :class="styles.levelGroup">
          
          <div :class="styles.levelGroupTitle">2 Qubit Systems</div>
          <div :class="styles.levelSelectorGrid">
            <div
              v-for="(_, index) in LEVELS.slice(9,15)"
              :key="'group2-' + index"
              @click="selectLevel(index + 9)"
              :class="[styles.levelSelectorSquare, { [styles.levelSelectorActive as string]: (index + 9) === currentLevelIndex }]"
            >
              {{ index + 10 }}
            </div>
          </div>
        </div>

        <div :class="styles.levelGroup">
          
          <div :class="styles.levelGroupTitle">3 & 4 Qubit Systems</div>
          <div :class="styles.levelSelectorGrid">
            <div
              v-for="(_, index) in LEVELS.slice(15)"
              :key="'group3-' + index"
              @click="selectLevel(index + 15)"
              :class="[styles.levelSelectorSquare, { [styles.levelSelectorActive as string]: (index + 15) === currentLevelIndex }]"
            >
              {{ index + 16 }}
            </div>
          </div>
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
                <span v-if="displayedGateProgress !== null" :class="styles.gateCount">
                  {{ displayedGateProgress }}
              </span>
            </div>
            <div
              @dragover="onLaserDragOver"
              @drop="onLaserDrop"
              :class="styles.laserDropZone"
            >
              <div v-if="activeGates.length > 0" :class="styles.gateStack">
                <div
                  v-for="(gate, index) in activeGates"
                  :key="`laser-gate-${index}`"
                  :class="[
                    styles.laserGate,
                    { [styles.laserGateX as string]: gate === 'X' }, 
                    { [styles.laserGateH as string]: gate === 'H' },
                    { [styles.laserGateCNOT as string]: gate === 'CNOT' }
                  ]"
                >
                <button v-if="!isGateLocked(index)" @click="removeLaserGate(index)" :class="styles.removeBtn">✕</button>
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