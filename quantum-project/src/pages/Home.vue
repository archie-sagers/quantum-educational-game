<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { measureAll, checkWinCondition, calculateQuantumState, WELCOME_POPUP, MAIN_WELCOME_POPUP,  Level} from '@/game/quantumgame'
import { type IonQuantumState } from '@/game/types'
import { LEVELS, TUTORIAL_LEVEL } from '@/game/levels'
import ManualModal from '@/components/manual/ManualModal.vue'
import GameBoard from '@/components/GameBoard.vue'
import Tutorial, { TUTORIAL_STEPS } from '@/components/tutorial.vue'
import styles from './Home.module.css'
import MobileWarning from '@/components/MobileWarning.vue'
import BlochSpherePanel from '@/components/ui/BlochSpherePanel.vue'
import LaserGatesModal from '@/components/ui/LaserGatesModal.vue'

// Minigame Imports
import HeatingMinigame from '@/components/minigames/HeatingMinigame.vue'
import IonizationMinigame from '@/components/minigames/IonizationMinigame.vue'
import TrapMinigame from '@/components/minigames/TrapMinigame.vue'
import DopplerCoolingMinigame from '@/components/minigames/DopplerCoolingMinigame.vue'


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
const showManual = ref(false)
const gateInventory = ref<Record<string, number>>({})
const showCompletionPopup = ref(false)
const draggedGateIndex = ref<number | null>(null)
const showHint = ref(false)
const manualGlowActive = ref(false)
const manualGlowLockedLevels = ref(new Set<number>())

const MANUAL_GLOW_INTERVAL_MS = 15000

let manualGlowInterval: ReturnType<typeof setInterval> | null = null

function pulseManualGlow(force = false) {
  if (!force && manualGlowLockedLevels.value.has(currentLevelIndex.value)) return

  manualGlowActive.value = false
  nextTick(() => {
    manualGlowActive.value = true
  })
}

function stopManualGlow() {
  manualGlowActive.value = false
}

const currentPopup = computed(() => {
  if (tempPopup.value) return tempPopup.value
  const currentLevel = LEVELS[currentLevelIndex.value]
  if (!currentLevel || !currentLevel.popups) return null
  return currentLevel.popups[popupIndex.value]
})

// Tutorial
// ------------------
const tutorialStep = ref(-1)
const tutorialActive = ref(false)
const tutorialTargetRect = ref<DOMRect | null>(null)
const tutorialPhase = computed(() => (tutorialStep.value < TUTORIAL_STEPS.length ? 'tour' : 'tutorial-sandbox'))
const tutorialCompleteLabel = computed(() => (tutorialStep.value >= TUTORIAL_STEPS.length ? 'Tutorial Sandbox' : 'Tutorial'))

type TutorialStepKey = (typeof TUTORIAL_STEPS)[number]['key']
const tutorialStepData = computed(() => (tutorialStep.value >= 0 ? TUTORIAL_STEPS[tutorialStep.value] ?? null : null))
const tutorialVisible = computed(() => tutorialActive.value)

const goalBoxRef = ref<HTMLElement | null>(null)
const manualBtnRef = ref<HTMLElement | null>(null)
const hintContainerRef = ref<HTMLElement | null>(null)
const levelIndicatorRef = ref<HTMLElement | null>(null)
const boardWrapRef = ref<HTMLElement | null>(null)
const resetBtnRef = ref<HTMLElement | null>(null)
const measureBtnRef = ref<HTMLElement | null>(null)
const historyRef = ref<HTMLElement | null>(null)
const blochPanelRef = ref<HTMLElement | null>(null)

const tutorialTargetMap: Record<TutorialStepKey, typeof goalBoxRef> = {
  goal: goalBoxRef,
  manual: manualBtnRef,
  hint: hintContainerRef,
  level: levelIndicatorRef,
  walls: boardWrapRef,
  reset: resetBtnRef,
  measure: measureBtnRef,
  history: historyRef,
  bloch: blochPanelRef,
}

function updateTutorialTargetRect() {
  if (!tutorialVisible.value || !tutorialStepData.value) {
    tutorialTargetRect.value = null
    return
  }
  const target = tutorialTargetMap[tutorialStepData.value.key]?.value
  tutorialTargetRect.value = target ? target.getBoundingClientRect() : null
}

async function startTutorial() {
  if (currentStage.value !== 'main' || currentLevelIndex.value !== 0) {
    await selectLevel(0)
  }
  showManual.value = false
  showLaserGates.value = false
  showLevelSelector.value = false
  showPopup.value = false
  isMeasured.value = false
  measuredValues.value = null
  level = TUTORIAL_LEVEL
  ionInitialized.value = TUTORIAL_LEVEL.preInitialized
  initLevelGates()
  updateStateForTracing()
  showTutorialWelcome.value = true
}

async function beginTutorialTour() {
  showTutorialWelcome.value = false
  tutorialActive.value = true
  tutorialStep.value = 0
  await nextTick()
  updateTutorialTargetRect()
}

function skipTutorialWelcome() {
  showTutorialWelcome.value = false
  finishTutorial()
}

async function nextTutorialStep() {
  if (tutorialStep.value < TUTORIAL_STEPS.length - 1) {
    tutorialStep.value += 1
    await nextTick()
    updateTutorialTargetRect()
    return
  }

  tutorialStep.value = TUTORIAL_STEPS.length
  await nextTick()
  updateTutorialTargetRect()
}

function finishTutorial() {
  showManual.value = false
  showLaserGates.value = false
  showLevelSelector.value = false
  showPopup.value = false
  tutorialActive.value = false
  tutorialStep.value = -1
  localStorage.setItem('quantum_tutorial_completed', 'true')
  level = LEVELS[0]!
  currentStage.value = 'main'
  selectLevel(0)
}

function skipTutorial() {
  finishTutorial()
}

watch([tutorialStep, currentLevelIndex, showHint, showLaserGates, () => history.value.length, ionStates], () => {
  if (tutorialVisible.value) {
    nextTick(() => updateTutorialTargetRect())
  }
})

function handleWindowResize() {
  updateTutorialTargetRect()
}

let level: Level = LEVELS[currentLevelIndex.value]!
const shownPopupIndices = ref(new Set<number>())
let lastPopupTrigger: string | null = null

// MINIGAMES
// ------------------

const STAGE_ORDER = ['heating', 'ionization', 'paul-trap', 'cooling', 'main']

const STAGE_CONFIG: Record<string, { name: string; goal: string; component?: object }> = {
  'heating': {
    name: 'Intro 1: Heating',
    goal: 'Vaporise the Ytterbium',
    component: HeatingMinigame
  },
  'ionization': {
    name: 'Intro 2: Ionization',
    goal: 'Ionize 15 Yb Atoms',
    component: IonizationMinigame
  },
  'paul-trap': {
    name: 'Intro 3: Paul Trap',
    goal: 'Trap the Yb+ Ion',
    component: TrapMinigame
  },
  'cooling': {
    name: 'Intro 4: Cooling',
    goal: 'Cool the Yb+ Ion',
    component: DopplerCoolingMinigame
  }
}

const savedStage = localStorage.getItem('quantum_save_stage')
const currentStage = ref(
  (savedStage && STAGE_ORDER.includes(savedStage) ? savedStage : STAGE_ORDER[0]) as string
)

function advanceStage() {
  if (currentStage.value === 'cooling') {
    void startTutorial()
    return
  }

  const currentIndex = STAGE_ORDER.indexOf(currentStage.value)
  if (currentIndex < STAGE_ORDER.length - 1) {
    currentStage.value = STAGE_ORDER[currentIndex + 1]!
  }
}

function selectMinigame(stage: string) {
  showLevelSelector.value = false;
  currentStage.value = stage;
}

const currentStageName = computed(() =>
  tutorialActive.value
    ? 'Tutorial'
    : currentStage.value === 'main'
      ? `Level ${currentLevelIndex.value + 1}`
      : STAGE_CONFIG[currentStage.value]?.name ?? ''
)

const currentStageGoal = computed(() =>
  tutorialActive.value
    ? TUTORIAL_LEVEL.goal
    : currentStage.value === 'main'
      ? LEVELS[currentLevelIndex.value]?.goal
      : STAGE_CONFIG[currentStage.value]?.goal ?? ''
)


// SAVE/LOAD LOGIC
// ------------------
const savedLevel = localStorage.getItem('quantum_save_level')
if (savedLevel !== null) {
  currentLevelIndex.value = parseInt(savedLevel, 10)
}

watch(currentLevelIndex, (newLevel) => {
  localStorage.setItem('quantum_save_level', newLevel.toString())
  showHint.value = false
})

watch(currentStage, (newStage) => {
  localStorage.setItem('quantum_save_stage', String(newStage))
})

const displayedGateProgress = computed(() => {
  const activeLevel = LEVELS[currentLevelIndex.value];
  if (!activeLevel || activeLevel.requiredGateCount === null) return null;

  if (Array.isArray(activeLevel.requiredGateCount)) {
    const requiredForThisSource = activeLevel.requiredGateCount[activeSourceIndex.value] ?? 0;
    return `(${activeGates.value.length}/${requiredForThisSource})`;
  } else {
    const totalApplied = sourceGates.value.flat().length;
    return `(${totalApplied}/${activeLevel.requiredGateCount})`;
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
  } else {
    showCompletionPopup.value = true;
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
  currentStage.value = 'main';
  showLevelSelector.value = false;
  tempPopup.value = null;
  currentLevelIndex.value = index;
  level = LEVELS[currentLevelIndex.value]!;
  isMeasured.value = false;
  measuredValues.value = null;
  ionInitialized.value = level.preInitialized;
  shownPopupIndices.value.clear();
  lastPopupTrigger = null;
  stopManualGlow();

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
  draggedGateIndex.value = null
  e.dataTransfer!.effectAllowed = 'copy'
  e.dataTransfer!.setData('gateType', gateType)
}

function onPlacedGateDragStart(e: DragEvent, index: number, gateType: string) {
  if (isGateLocked(index)) {
    e.preventDefault()
    return
  }
  draggedGateIndex.value = index
  e.dataTransfer!.effectAllowed = 'move'
  e.dataTransfer!.setData('gateType', gateType)
}

function handleDrop(e: DragEvent, dropIndex?: number) {
  e.preventDefault()
  const gateType = e.dataTransfer!.getData('gateType')
  if (!gateType) return

  const idx = activeSourceIndex.value
  if (!sourceGates.value[idx]) sourceGates.value[idx] = []
  const list = sourceGates.value[idx]!

  // Protect locked gates
  const lockedCount = level.prePlacedGates?.[idx]?.length || 0
  let safeDropIndex = dropIndex !== undefined ? Math.max(dropIndex, lockedCount) : list.length

  if (draggedGateIndex.value !== null) {
    const oldIndex = draggedGateIndex.value
    if (oldIndex === safeDropIndex) return 

    const [movedGate] = list.splice(oldIndex, 1)
    
    if (oldIndex < safeDropIndex && dropIndex !== undefined) {
      safeDropIndex--
    }
    
    list.splice(safeDropIndex, 0, movedGate!)
  } else {
    if (gateInventory.value[gateType] !== undefined) {
      if (gateInventory.value[gateType]! > 0) {
        gateInventory.value[gateType]!--
      } else {
        return
      }
    }
    list.splice(safeDropIndex, 0, gateType)
  }

  draggedGateIndex.value = null
  isMeasured.value = false
  measuredValues.value = null
  updateStateForTracing()
}

function onLaserDragOver(e: DragEvent) {
  e.preventDefault()
  e.dataTransfer!.dropEffect = draggedGateIndex.value !== null ? 'move' : 'copy'
}

function onLaserDrop(e: DragEvent) {
  handleDrop(e) 
}

function onPlacedGateDrop(e: DragEvent, dropIndex: number) {
  handleDrop(e, dropIndex)
}

function removeLaserGate(index: number) {
  const activeIdx = activeSourceIndex.value;

  if (isGateLocked(index)) {
    return;
  }

  const gate = sourceGates.value[activeIdx]![index]!;
  sourceGates.value[activeIdx]!.splice(index, 1);

  if (gateInventory.value[gate] !== undefined) {
    gateInventory.value[gate]!++;
  }

  isMeasured.value = false;
  measuredValues.value = null;
  updateStateForTracing();
}

function isGateLocked(localIndex: number) {
  const activeIdx = activeSourceIndex.value;
  const prePlacedCount = level.prePlacedGates?.[activeIdx]?.length || 0;
  return localIndex < prePlacedCount;
}

const showWelcome = ref(currentStage.value === 'heating')
const showMainWelcome = ref(currentStage.value === 'main')
const showTutorialWelcome = ref(false)

// Mobile
// ----------------
function addGateToActive(gateType: string) {
  const available = gateInventory.value[gateType] ?? -1
  if (available === 0) return
  if (gateInventory.value[gateType] !== undefined) {
    gateInventory.value[gateType]!--
  }
  const idx = activeSourceIndex.value
  if (!sourceGates.value[idx]) sourceGates.value[idx] = []
  sourceGates.value[idx].push(gateType)
  isMeasured.value = false
  measuredValues.value = null
  updateStateForTracing()
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

function goToLab() {
  window.location.href = '/lab'
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
      gameBoardRef.value?.triggerFlash();
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

// Manual Modal Control
const targetManualSection = ref<string | null>(null)

function openManualToSection(sectionId: string) {
  targetManualSection.value = sectionId
  showManual.value = true
}

function openGateManual(gate: string) {
  const sectionId = gate === 'X'
    ? 'gate-x'
    : gate === 'H'
      ? 'gate-h'
      : gate === 'CNOT'
        ? 'gate-cnot'
        : null
  if (!sectionId) return

  openManualToSection(sectionId)
}

const activeManualLink = computed(() => {
  if (currentStage.value !== 'main') return null;
  return LEVELS[currentLevelIndex.value]?.manualLink;
})

function handleManualClick() {
  manualGlowLockedLevels.value.add(currentLevelIndex.value)
  stopManualGlow()
  if (activeManualLink.value) {
    openManualToSection(activeManualLink.value.sectionId)
  } else {
    targetManualSection.value = null
    showManual.value = true
  }
}

function handleShowHint() {
  showHint.value = true
  pulseManualGlow(true)
}

// Mirror Controls
// ------------------
function clearMirrors() {
  level.grid = Array.from({ length: level.rows }, () => Array(level.cols).fill(null))
  updateStateForTracing()
}

// Measurement Logic
// ------------------
function handleMeasure() {
  if (!canMeasure.value) return
  canMeasure.value = false

  gameBoardRef.value?.resetPhoton()

  const maxGates = Math.max(1, ...sourceGates.value.map(g => g ? g.length : 0))
  const dynamicDelayMs = 800 * (1 + (maxGates - 1) * 0.1)

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
    let passedGateCountCheck = true

    if (level.requiredGateCount !== null) {
      if (Array.isArray(level.requiredGateCount)) {
        for (let i = 0; i < level.requiredGateCount.length; i++) {
          const count = sourceGates.value[i]?.length || 0;
          if (count !== level.requiredGateCount[i]) {
            passedGateCountCheck = false;
            break;
          }
        }
      } else {
        const flatGateCount = sourceGates.value.flat().length;
        if (flatGateCount !== level.requiredGateCount) {
          passedGateCountCheck = false;
        }
      }
    }

    const stateInfo = calculateQuantumState(level, sourceGates.value, null)
    const states = stateInfo.states ?? []
    const wc = level.winCondition

    if (passedGateCountCheck && checkWinCondition(wc, states)) {
      showWin.value = true
    }

    if (passedGateCountCheck && checkWinCondition(wc, states) && level.automateMeasurement && !automatedRunning.value) {
      const allIonsHit = states.every(s => s.state !== '—');
      
      let shouldRunDemo = allIonsHit && states.some(s => s.state === '|+⟩' || s.state === '|-⟩');

      // Check for GHZ states
      if (level.winCondition === 'ghz') {
        let isGHZ = true;
        
        for (let i = 0; i < 20; i++) {
          const sample = measureAll();
          if (!sample.every(val => val === sample[0])) {
            isGHZ = false;
            break; 
          }
        }
        shouldRunDemo = shouldRunDemo && isGHZ;
      }
      if (shouldRunDemo) {
        const shown = showPopupByTrigger('onAutomatedStart')
        if (!shown) startAutomatedDemo()
      }
    }

    if (!showWin.value && !automatedRunning.value) {
      setTimeout(() => {
        isMeasured.value = false;
        measuredValues.value = null;
        updateStateForTracing();
        gameBoardRef.value?.triggerFlash();
      }, 500); 
    }
  }, dynamicDelayMs)
}

function handleReset() {
  ionInitialized.value = true
  isMeasured.value = false
  measuredValues.value = null
  result.value = '—'
  updateStateForTracing()
  gameBoardRef.value?.triggerFlash()
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
  manualGlowInterval = setInterval(() => pulseManualGlow(), MANUAL_GLOW_INTERVAL_MS)
  window.addEventListener('resize', handleWindowResize)
})

onUnmounted(() => {
  if (manualGlowInterval !== null) {
    clearInterval(manualGlowInterval)
    manualGlowInterval = null
  }
  window.removeEventListener('resize', handleWindowResize)
})
</script>

<template>
  <div :class="styles.gameContainer">
    <MobileWarning />
    <h1 :class="styles.title">Quantum Laser Puzzle Game</h1>

    <div :class="styles.controlsRow">
      <button
        @click="showLevelSelector = true"
        :disabled="automatedRunning"
        :class="[styles.levelIndicator, { [styles.tutorialHighlight as string]: tutorialVisible && tutorialStepData?.key === 'level' }]"
        ref="levelIndicatorRef"
      >
        {{ currentStageName }}
      </button>

      <button
        v-if="!tutorialVisible"
        @click="startTutorial"
        :disabled="automatedRunning"
        :class="styles.manualBtn"
      >
        Tutorial
      </button>

      <button
        @click="handleManualClick"
        @animationend="manualGlowActive = false"
        :disabled="automatedRunning"
        :class="[
          styles.manualBtn,
          {
            [styles.manualBtnGlow as string]: manualGlowActive,
            [styles.tutorialHighlight as string]: tutorialVisible && tutorialStepData?.key === 'manual'
          }
        ]"
        ref="manualBtnRef"
        :style="activeManualLink"
      >
        {{ activeManualLink ? activeManualLink.label : 'Manual' }}
      </button>

      <div :class="[styles.goalBox, { [styles.tutorialHighlight as string]: tutorialVisible && tutorialStepData?.key === 'goal' }]" ref="goalBoxRef">
        <div :class="styles.goalLabel">Goal</div>
        <div :class="styles.goalValue">{{ currentStageGoal }}</div>
      </div>

      <div :class="styles.successBoxContainer">
        <div v-if="showWin && currentStage === 'main'" :class="styles.successBox">
          <div :class="styles.successText">ION SUCCESSFULLY EXCITED</div>
          <button
            @click="nextLevel"
            :disabled="automatedRunning"
            :class="styles.nextBtn"
          >
            {{ LEVELS.length - 1 > currentLevelIndex ? 'Next Level' : 'Finish!' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="currentStage !== 'main'" style="width: 100%; display: flex; flex-direction: column; flex: 1; margin-top: 10px;">
      <component
        :is="STAGE_CONFIG[currentStage]?.component"
        @complete="advanceStage"
      />
    </div>

    <div v-else style="display: contents;">

      <div v-if="currentLevelIndex !== 0" :class="styles.controls">
        <p :class="styles.controlsText">Left-click to place/rotate mirror · Right-click to remove</p>
        <button @click="clearMirrors" :class="styles.clearBtn">Clear Mirrors</button>
      </div>

      <div :class="[styles.hintContainer, { [styles.tutorialHighlight as string]: tutorialVisible && tutorialStepData?.key === 'hint' }]" ref="hintContainerRef">
        <button
          v-if="!showHint"
          @click="handleShowHint"
          :class="[styles.clearBtn, styles.hintButton]"
        >
          Show Hint
        </button>

        <p v-else :class="styles.hint">
          {{ level.hint }}
        </p>
      </div>



    <!-- Main game area -->
    <div :class="styles.mainArea">
      <!-- Game canvas - using extracted GameBoard component -->
      <div :class="[styles.canvasWrap, { [styles.tutorialHighlight as string]: tutorialVisible && tutorialStepData?.key === 'walls' }]" ref="boardWrapRef">
        <GameBoard
          ref="gameBoardRef"
          mode="play"
          :level="level"
          :sourceGates="sourceGates"
          :disableMirrors="currentLevelIndex === 0"
          @canvas-click="handleGameBoardClick"
          @canvas-mirror-place="updateStateForTracing"
        />
      </div>

      <!-- Sidebar: Bloch sphere + measurement info for each ion -->
      <aside :class="styles.sidebar">

        <div :class="[styles.ionWrapper, { [styles.tutorialHighlight as string]: tutorialVisible && tutorialStepData?.key === 'bloch' }]" ref="blochPanelRef">
          <BlochSpherePanel
            v-for="(ionState, idx) in ionStates"
            :key="idx"
            :ionState="ionState"
            :ionIndex="idx"
            :compact="ionStates.length >= 3"
          />
        </div>

        <div :class="styles.sharedControls">
          <button
            @click="handleMeasure"
            :disabled="!canMeasure || automatedRunning"
            :class="[styles.measureBtn, { [styles.tutorialHighlight as string]: tutorialVisible && tutorialStepData?.key === 'measure' }]"
            ref="measureBtnRef"
          >
            Measure
          </button>

          <button
            v-if="level.showResetButton"
            @click="handleReset"
            :disabled="automatedRunning"
            :class="[styles.resetBtn, { [styles.tutorialHighlight as string]: tutorialVisible && tutorialStepData?.key === 'reset' }]"
            ref="resetBtnRef"
          >
            Reset Ion (Optical Pumping)
          </button>

          <div :class="styles.infoRow">
            <span :class="styles.infoKey">Last</span>
            <span :class="[styles.infoVal, resultcolourClass]">{{ result }}</span>
          </div>
          <div :class="[styles.history, { [styles.tutorialHighlight as string]: tutorialVisible && tutorialStepData?.key === 'history' }]" ref="historyRef">
            <span :class="styles.infoKey">History</span>
            <span :class="styles.historyBits">
              {{ history.length ? history.map((r: number[]) => r.join('')).join(' ') : 'No measurements yet' }}
            </span>
          </div>
        </div>

      </aside>
    </div>

    <LaserGatesModal
      v-if="showLaserGates"
      :activeGates="activeGates"
      :displayedGateProgress="displayedGateProgress"
      :availableGates="level.availableGates"
      :gateInventory="gateInventory"
      :isGateLocked="isGateLocked"
      @close="showLaserGates = false"
      @gateDragStart="onGateDragStart"
      @placedGateDragStart="onPlacedGateDragStart"
      @laserDragOver="onLaserDragOver"
      @laserDrop="onLaserDrop"
      @placedGateDrop="onPlacedGateDrop"
      @removeGate="removeLaserGate"
      @addGate="addGateToActive"
      @openGateManual="openGateManual"
    />
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
    </div>

    <!-- Level selector modal -->
    <div v-if="showLevelSelector" :class="styles.levelSelectorOverlay" @click="showLevelSelector = false">
      <div :class="styles.levelSelectorModal" @click.stop style="max-height: 90vh; overflow-y: auto;">

        <div :class="styles.levelGroup">
          <div :class="styles.levelGroupTitle">Introduction</div>
          <div :class="styles.levelSelectorGrid">
            <div
              @click="selectMinigame('heating')"
              :class="[styles.levelSelectorSquare, { [styles.levelSelectorActive as string]: currentStage === 'heating' }]"
            >
              1
            </div>
            <div
              @click="selectMinigame('ionization')"
              :class="[styles.levelSelectorSquare, { [styles.levelSelectorActive as string]: currentStage === 'ionization' }]"
            >
              2
            </div>
            <div
              @click="selectMinigame('paul-trap')"
              :class="[styles.levelSelectorSquare, { [styles.levelSelectorActive as string]: currentStage === 'paul-trap' }]"
            >
              3
            </div>
            <div
              @click="selectMinigame('cooling')"
              :class="[styles.levelSelectorSquare, { [styles.levelSelectorActive as string]: currentStage === 'cooling' }]"
            >
              4
            </div>
          </div>
        </div>

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

    <!-- Manual Modal Component -->
    <ManualModal
      :isOpen="showManual"
      :targetSection="targetManualSection"
      @close="showManual = false; targetManualSection = null"
      @selectLevel="selectLevel"
    />

    <div v-if="showWelcome" :class="styles.welcomeOverlay" style="z-index: 9999;">
        <div :class="styles.welcomeModal">
          <div :class="styles.welcomeTitle">{{ WELCOME_POPUP.title }}</div>
          <div :class="styles.welcomeText">{{ WELCOME_POPUP.text }}</div>
          <button @click="closeWelcome()" :class="styles.welcomeBtn">Continue</button>
        </div>
      </div>

    <div v-if="showTutorialWelcome" :class="styles.welcomeOverlay" style="z-index: 9999;">
      <div :class="styles.welcomeModal">
        <div :class="styles.welcomeTitle">Welcome to the Tutorial</div>
        <div :class="styles.welcomeText">
          Learn the basics of the game and how X and H gates work before jumping into the main puzzles. You can come back to the tutorial at any time by clicking the "Tutorial" button.
        </div>
        <div style="display: flex; gap: 15px; justify-content: center; margin-top: 20px;">
          <button @click="beginTutorialTour()" :class="styles.welcomeBtn">Start Tutorial</button>
          <button
            @click="skipTutorialWelcome()"
            :class="styles.welcomeBtn"
            style="background: none; border: 1px solid var(--color-primary); color: var(--color-primary);"
          >
            Skip to Level 1
          </button>
        </div>
      </div>
    </div>

    <div v-if="showMainWelcome" :class="styles.welcomeOverlay" style="z-index: 9999;">
        <div :class="styles.welcomeModal">
          <div :class="styles.welcomeTitle">{{ MAIN_WELCOME_POPUP.title }}</div>
          <div :class="styles.welcomeText">{{ MAIN_WELCOME_POPUP.text }}</div>
          <button @click="showMainWelcome = false" :class="styles.welcomeBtn">Continue</button>
        </div>
      </div>

    <Tutorial
      v-if="tutorialVisible"
      :visible="tutorialVisible"
      :phase="tutorialPhase"
      :stepIndex="tutorialStep >= 0 ? tutorialStep : TUTORIAL_STEPS.length - 1"
      :stepCount="TUTORIAL_STEPS.length"
      :title="tutorialStepData?.title ?? tutorialCompleteLabel"
      :text="tutorialStepData?.text ?? 'Experiment with the gates in the sandbox.'"
      :targetRect="tutorialTargetRect"
      @next="nextTutorialStep"
      @skip="skipTutorial"
      @finish="finishTutorial"
      @openManualSection="openManualToSection"
    />

    <div v-if="showCompletionPopup" :class="styles.welcomeOverlay" style="z-index: 9999;">
      <div :class="styles.welcomeModal">
        <div :class="styles.welcomeTitle">Congratulations!</div>
        <div :class="styles.welcomeText">
          Congratulations on completing the laser puzzle! Read the manual for more info on quantum computing and check out the lab to create and share your own puzzles.
        </div>
        
        <div style="display: flex; gap: 15px; justify-content: center; margin-top: 20px;">
          <button 
            @click="showCompletionPopup = false; showManual = true" 
            :class="styles.welcomeBtn" 
            style="flex: 1;"
          >
            Manual
          </button>
          
          <button 
            @click="goToLab" 
            :class="styles.welcomeBtn" 
            style="flex: 1; background: purple; color: white;"
          >
            Lab
          </button>
        </div>
        
        <button 
          @click="showCompletionPopup = false" 
          style="margin-top: 15px; background: none; border: none; color: gray; cursor: pointer; text-decoration: underline;"
        >
          Close
        </button>
      </div>
    </div>
</template>
