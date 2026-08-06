<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { measureAll, checkWinCondition, calculateQuantumState, WELCOME_POPUP, MAIN_WELCOME_POPUP,  Level} from '@/game/quantumgame'
import { type IonQuantumState } from '@/game/types'
import { LEVELS, TUTORIAL_LEVEL } from '@/game/levels'

import styles from './Home.module.css'

import ManualModal from '@/components/manual/ManualModal.vue'
import OverlayModal from '@/components/ui/OverlayModal.vue'
import GameBoard from '@/components/GameBoard.vue'
import Tutorial, { TUTORIAL_STEPS } from '@/components/tutorial/tutorial.vue'
import { useTutorial } from '@/components/tutorial/usetutorial'
import MobileWarning from '@/components/mobile/MobileWarning.vue'
import LaserGatesModal from '@/components/ui/LaserGatesModal.vue'
import MeasurementSidebar from '@/components/ui/MeasurementSidebar.vue'

import { useGateInventory } from '@/components/gamelogic/usegateinventory'
import { useMeasurement } from '@/components/gamelogic/usemeasurement'

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
const showLevelSelector = ref(false)
const showLaserGates = ref(false)
const ionInitialized = ref(false)
const automatedRunning = ref(false)
const showPopup = ref(false)
const popupIndex = ref(0)
const tempPopup = ref<{ title: string; text: string } | null>(null)
const showManual = ref(false)
const showCompletionPopup = ref(false)
const showHint = ref(false)
const manualGlowActive = ref(false)
const manualGlowLockedLevels = ref(new Set<number>())

const measurement = useMeasurement(TRAVEL_MS)
const {
  result,
  history,
  showWin,
  canMeasure,
  isMeasured,
  measuredValues,
} = measurement

const gateInv = useGateInventory()
const {
  sourceGates,
  gateInventory,
  activeSourceIndex,
  activeGates,
} = gateInv

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

const goalBoxRef = ref<HTMLElement | null>(null)
const manualBtnRef = ref<HTMLElement | null>(null)
const hintContainerRef = ref<HTMLElement | null>(null)
const levelIndicatorRef = ref<HTMLElement | null>(null)
const boardWrapRef = ref<HTMLElement | null>(null)
const resetBtnRef = ref<HTMLElement | null>(null)
const measureBtnRef = ref<HTMLElement | null>(null)
const historyRef = ref<HTMLElement | null>(null)
const blochPanelRef = ref<HTMLElement | null>(null)

let level: Level = LEVELS[currentLevelIndex.value]!
const shownPopupIndices = ref(new Set<number>())
let lastPopupTrigger: string | null = null

const tutorialTargetRefs = {
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

const {
  tutorialStep,
  tutorialVisible,
  tutorialPhase,
  tutorialCompleteLabel,
  tutorialStepData,
  tutorialTargetRect,
  showTutorialWelcome,
  startTutorial,
  beginTutorialTour,
  nextTutorialStep,
  finishTutorial,
  skipTutorial,
  skipTutorialWelcome,
  isTutorialStep: checkTutorialStep,
} = useTutorial({
  currentLevelIndex,
  showHint,
  showManual,
  showLaserGates,
  showLevelSelector,
  showPopup,
  isMeasured,
  measuredValues,
  history,
  ionStates,
  selectLevel,
  updateStateForTracing,
  configureTutorialLevel: () => {
    level = TUTORIAL_LEVEL
    ionInitialized.value = TUTORIAL_LEVEL.preInitialized
  },
  configureMainLevel: () => {
    level = LEVELS[0]!
    currentStage.value = 'main'
  },
  targetRefs: tutorialTargetRefs,
})

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
  tutorialVisible.value
    ? 'Tutorial'
    : currentStage.value === 'main'
      ? `Level ${currentLevelIndex.value + 1}`
      : STAGE_CONFIG[currentStage.value]?.name ?? ''
)

const currentStageGoal = computed(() =>
  tutorialVisible.value
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

  await nextTick();
  gateInv.setSourceGatesFromLevel(level);
  gateInv.resetGateInventory(level.gateInventory, level.lockedGateIndices);

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

function isGateLocked(localIndex: number) {
  return gateInv.isGateLocked(level, localIndex)
}

function onGateDragStart(e: DragEvent, gateType: string) {
  gateInv.onGateDragStart(e, gateType)
}

function onPlacedGateDragStart(e: DragEvent, index: number, gateType: string) {
  gateInv.onPlacedGateDragStart(e, level, index, gateType)
}

function onLaserDragOver(e: DragEvent) {
  gateInv.onLaserDragOver(e)
}

function afterGateChange(changed: boolean) {
  if (!changed) return
  isMeasured.value = false
  measuredValues.value = null
  updateStateForTracing()
}

function onLaserDrop(e: DragEvent) {
  afterGateChange(gateInv.onLaserDrop(e, level))
}

function onPlacedGateDrop(e: DragEvent, dropIndex: number) {
  afterGateChange(gateInv.onPlacedGateDrop(e, level, dropIndex))
}

function removeLaserGate(index: number) {
  afterGateChange(gateInv.removeLaserGate(level, index))
}

function addGateToActive(gateType: string) {
  afterGateChange(gateInv.addGateToActive(gateType))
}

// Popup Control
// ------------------

const showWelcome = ref(currentStage.value === 'heating')
const showMainWelcome = ref(currentStage.value === 'main')

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

      const measResults = measurement.collapseMeasurement(50)
      results.push(measResults)
      updateStateForTracing()

      await new Promise((res) => setTimeout(res, 50))
    }

    automatedRunning.value = false

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

  const dynamicDelayMs = measurement.computeDynamicDelay(sourceGates.value)

  setTimeout(() => {
    if (isMeasured.value) {
      measurement.repeatLastMeasurement()
      canMeasure.value = true
      return
    }

    measurement.collapseMeasurement()
    updateStateForTracing()

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

    const hasWon = passedGateCountCheck && checkWinCondition(wc, states)
    if (hasWon) {
      showWin.value = true
    }

    if (hasWon && level.automateMeasurement && !automatedRunning.value) {
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
  measurement.resetMeasurementState()
  updateStateForTracing()
  gameBoardRef.value?.triggerFlash()
  showPopupByTrigger('onReset')
}

function handleGameBoardClick(col: number, row: number) {
  const clickedSourceIdx = gateInv.findSourceIndexAt(level, col, row)
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
  gateInv.setSourceGatesFromLevel(level)
  gateInv.resetGateInventory(level.gateInventory, level.lockedGateIndices)
  updateStateForTracing()
  popupIndex.value = 0
  showPopupByTrigger('onLoad')
  manualGlowInterval = setInterval(() => pulseManualGlow(), MANUAL_GLOW_INTERVAL_MS)
})

onUnmounted(() => {
  if (manualGlowInterval !== null) {
    clearInterval(manualGlowInterval)
    manualGlowInterval = null
  }
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

      <MeasurementSidebar
        :ionStates="ionStates"
        :canMeasure="canMeasure"
        :automatedRunning="automatedRunning"
        :showResetButton="level.showResetButton"
        :result="result"
        :isOrangeResult="result === '1'"
        :history="history"
        :tutorialVisible="tutorialVisible"
        :isTutorialStep="checkTutorialStep"
        :blochPanelRef="(el) => blochPanelRef = el"
        :measureBtnRef="(el) => measureBtnRef = el"
        :resetBtnRef="(el) => resetBtnRef = el"
        :historyRef="(el) => historyRef = el"
        @measure="handleMeasure"
        @reset="handleReset"
      />
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
    <OverlayModal
      v-if="currentPopup"
      :show="showPopup"
      kind="popup"
      :title="currentPopup.title"
      :text="currentPopup.text"
      close-on-backdrop
      @backdrop-click="closePopup"
      :buttons="[{ label: level.popups.length - 1 > popupIndex ? 'Next' : 'Got it', onClick: advancePopup }]"
    />
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

    <OverlayModal
      :show="showWelcome"
      kind="welcome"
      :title="WELCOME_POPUP.title"
      :text="WELCOME_POPUP.text"
      :z-index="9999"
      :buttons="[{ label: 'Continue', onClick: closeWelcome }]"
    />

    <OverlayModal
      :show="showTutorialWelcome"
      kind="welcome"
      title="Welcome to the Tutorial"
      :z-index="9999"
      :buttons="[
        { label: 'Start Tutorial', onClick: beginTutorialTour },
        {
          label: 'Skip to Level 1',
          onClick: skipTutorialWelcome,
          style: { background: 'none', border: '1px solid var(--color-primary)', color: 'var(--color-primary)' }
        }
      ]"
    >
      <div :class="styles.welcomeText">
        Learn the basics of the game and how X and H gates work before jumping into the main puzzles.
        You can come back to the tutorial at any time by clicking the "Tutorial" button.
      </div>
    </OverlayModal>

    <OverlayModal
      :show="showMainWelcome"
      kind="welcome"
      :title="MAIN_WELCOME_POPUP.title"
      :text="MAIN_WELCOME_POPUP.text"
      :z-index="9999"
      :buttons="[{ label: 'Continue', onClick: () => showMainWelcome = false }]"
    />

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

    <OverlayModal
      :show="showCompletionPopup"
      kind="welcome"
      title="Congratulations!"
      text="Congratulations on completing the laser puzzle! Read the manual for more info on quantum computing and check out the lab to create and share your own puzzles."
      :z-index="9999"
      :buttons="[
        { label: 'Manual', onClick: () => { showCompletionPopup = false; showManual = true }, style: { flex: '1' } },
        { label: 'Lab', onClick: goToLab, style: { flex: '1', background: 'var(--color-secondary)', color: 'var(--color-bg)' } }
      ]"
    >
      <template #footer>
        <button
          @click="showCompletionPopup = false"
          style="margin-top: 15px; background: none; border: none; color: var(--color-subtle); cursor: pointer; text-decoration: underline;"
        >
          Close
        </button>
      </template>
    </OverlayModal>
</template>
