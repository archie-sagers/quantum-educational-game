import { computed, nextTick, onMounted, onUnmounted, ref, watch, type Ref } from 'vue'
import { TUTORIAL_STEPS } from './tutorial.vue'
import type { IonQuantumState, TutorialStepKey } from '@/game/types'

type TutorialTargetRefs = Record<TutorialStepKey, Ref<HTMLElement | null>>

// Options passed to useTutorial() from the parent component
interface UseTutorialOptions {
  currentLevelIndex: Ref<number>
  showHint: Ref<boolean>
  showManual: Ref<boolean>
  showLaserGates: Ref<boolean>
  showLevelSelector: Ref<boolean>
  showPopup: Ref<boolean>
  isMeasured: Ref<boolean>
  measuredValues: Ref<number[] | null>
  history: Ref<number[][]>
  ionStates: Ref<IonQuantumState[]>
  selectLevel: (index: number) => Promise<void> | void
  updateStateForTracing: () => void
  configureTutorialLevel: () => void
  configureMainLevel: () => void
  targetRefs: TutorialTargetRefs
}

export function useTutorial(options: UseTutorialOptions) {
  const tutorialStep = ref(-1)
  const tutorialActive = ref(false)
  const tutorialTargetRect = ref<DOMRect | null>(null)
  const showTutorialWelcome = ref(false)

  const tutorialPhase = computed(() => (tutorialStep.value < TUTORIAL_STEPS.length ? 'tour' : 'tutorial-sandbox'))
  const tutorialCompleteLabel = computed(() => (tutorialStep.value >= TUTORIAL_STEPS.length ? 'Tutorial Sandbox' : 'Tutorial'))
  const tutorialStepData = computed(() => (tutorialStep.value >= 0 ? TUTORIAL_STEPS[tutorialStep.value] ?? null : null))
  const tutorialVisible = computed(() => tutorialActive.value)

  // Updates the target box for the current tutorial step
  function updateTutorialTargetRect() {
    if (!tutorialVisible.value || !tutorialStepData.value) {
      tutorialTargetRect.value = null
      return
    }

    const target = options.targetRefs[tutorialStepData.value.key]?.value
    tutorialTargetRect.value = target ? target.getBoundingClientRect() : null
  }

  // Starts the tutorial by selecting the first level and configuring the tutorial state
  async function startTutorial() {
    await options.selectLevel(0)
    // Reset all UI for the tutorial
    options.showHint.value = false
    options.showManual.value = false
    options.showLaserGates.value = false
    options.showLevelSelector.value = false
    options.showPopup.value = false
    options.isMeasured.value = false
    options.measuredValues.value = null
    options.configureTutorialLevel()
    options.updateStateForTracing()
    showTutorialWelcome.value = true
  }

  async function beginTutorialTour() {
    showTutorialWelcome.value = false
    tutorialActive.value = true
    tutorialStep.value = 0
    await nextTick()
    updateTutorialTargetRect()
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

  // Finishes the tutorial and returns to the main level
  async function finishTutorial() {
    options.showHint.value = false
    options.showManual.value = false
    options.showLaserGates.value = false
    options.showLevelSelector.value = false
    options.showPopup.value = false
    showTutorialWelcome.value = false
    tutorialActive.value = false
    tutorialStep.value = -1
    localStorage.setItem('quantum_tutorial_completed', 'true')
    options.configureMainLevel()
    await options.selectLevel(0)
  }

  function skipTutorial() {
    void finishTutorial()
  }

  function skipTutorialWelcome() {
    showTutorialWelcome.value = false
    void finishTutorial()
  }

  function isTutorialStep(key: TutorialStepKey) {
    return tutorialVisible.value && tutorialStepData.value?.key === key
  }

  // Watch for changes in tutorial step or layout
  watch(
    [
      tutorialStep,
      options.currentLevelIndex,
      options.showHint,
      options.showLaserGates,
      () => options.history.value.length,
      options.ionStates,
    ],
    () => {
      if (tutorialVisible.value) {
        nextTick(() => updateTutorialTargetRect())
      }
    },
  )
  
  // keep the target rect updated on window resize
  onMounted(() => {
    window.addEventListener('resize', updateTutorialTargetRect)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateTutorialTargetRect)
  })

  return {
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
    isTutorialStep,
  }
}