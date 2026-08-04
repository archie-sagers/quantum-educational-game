<script lang="ts">
export const TUTORIAL_STEPS = [
  { key: 'goal', title: 'Goal', text: 'The goal box tells you the target state you should reach to pass the level.' },
  { key: 'manual', title: 'Manual', text: 'Open the manual for the longer explanation of the current mechanics and gate rules.' },
  { key: 'hint', title: 'Hint', text: 'The hint is a short strategic clue for the current level.' },
  { key: 'level', title: 'Level', text: 'Use the level selector to revisit earlier puzzles or skip ahead.' },
  { key: 'walls', title: 'Walls', text: 'Walls block or filter the beam, shaping the route the laser can take.' },
  { key: 'reset', title: 'Reset', text: 'Reset returns the ion to the ground state.' },
  { key: 'measure', title: 'Measure', text: 'The measure button is used to see what state the ion is in.' },
  { key: 'history', title: 'History', text: 'History records previous measurement outcomes for comparison.' },
  { key: 'bloch', title: 'Bloch Sphere and State', text: 'This panel shows the current qubit state and its Bloch-sphere orientation.' },
] as const
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {calculateQuantumState, getBlochAngle, getBlochLabel, measureAll } from '@/game/quantumgame'
import type { IonQuantumState, QuantumState } from '@/game/types'
import styles from './tutorial.module.css'
import sharedStyles from '@/pages/Home.module.css'
import { TUTORIAL_LEVEL } from '@/game/levels'

type TutorialPhase = 'tour' | 'tutorial-sandbox'
type TutorialGateKey = 'X' | 'H'

type RectLike = {
  top: number
  left: number
  right: number
  bottom: number
  width: number
  height: number
}

const props = defineProps<{
  visible: boolean
  phase: TutorialPhase
  stepIndex: number
  stepCount: number
  title: string
  text: string
  targetRect: RectLike | null
}>()

const emit = defineEmits<{
  next: []
  skip: []
  finish: []
  advanceSandbox: []
  openManualSection: [sectionId: string]
}>()

const sandboxGates = ref<string[][]>([[]])
const sandboxMeasured = ref<number[] | null>(null)
const sandboxStates = ref<IonQuantumState[]>([])
const sandboxMessage = ref('Try applying a gate to the ion to see what happens to the Bloch sphere.')
const sandboxResult = ref('—')

const activeSandboxState = computed(() => sandboxStates.value[0]?.state ?? '—')
const activeSandboxLabel = computed(() => getBlochLabel(activeSandboxState.value))
const activeSandboxAngle = computed(() => getBlochAngle(activeSandboxState.value))
const sandboxAvailableGates = computed<TutorialGateKey[]>(() => ['X', 'H'])
const sandboxSummary = computed(() => {
  const state = activeSandboxState.value
  if (state === '|0⟩') return 'A definite ground state. Measurement is deterministic.'
  if (state === '|1⟩') return 'A definite excited state. Measurement is deterministic.'
  if (state === '|+⟩' || state === '|-⟩') return 'A superposition on the Bloch equator. Measurement is probabilistic.'
  return 'No visible state yet.'
})

function resetSandbox() {
  sandboxGates.value = [[]]
  sandboxMeasured.value = null
  sandboxResult.value = '—'
  sandboxMessage.value = 'Try applying a gate to the ion to see what happens to the Bloch sphere.'
  recalculateSandbox()
}

function recalculateSandbox(measuredValues: number[] | null = sandboxMeasured.value) {
  const result = calculateQuantumState(TUTORIAL_LEVEL, sandboxGates.value, measuredValues)
  sandboxStates.value = result.states
}

function describeGateChange(gate: TutorialGateKey, beforeState: QuantumState | '—', afterState: QuantumState | '—'): string {
  if (gate === 'X') {
    if (beforeState === afterState) return 'The X-gate did not change the state of the qubit.'
    return afterState === '|1⟩'
      ? 'The X-gate flipped the Bloch sphere from the north pole to the south pole.'
      : 'The X-gate flipped the Bloch sphere back from the south pole to the north pole.'
  }

  if (afterState === '|+⟩') return 'The H-gate created an equal superposition and moved the Bloch vector onto the equator.'
  if (afterState === '|-⟩') return 'The H-gate created a negative phase superposition and moved the Bloch vector onto the equator.'
  if (afterState === '|0⟩') return 'The H-gate removed the superposition and returned the qubit to the north pole.'
  if (afterState === '|1⟩') return 'The H-gate removed the superposition and returned the qubit to the south pole.'
  return `The ${gate}-gate changed the state from ${beforeState} to ${afterState}.`
}

function describeMeasurement(beforeState: QuantumState | '—', afterState: QuantumState | '—'): string {
  if (beforeState === '|+⟩' || beforeState === '|-⟩') {
    return `The superposition has collapsed to ${afterState}. Measuring when an ion is in a superposition gives a chance of measuring a 0 or a 1.`
  }
  if (beforeState === '|0⟩') return 'Measurement is deterministic here: the qubit will collapse to 0 every time.'
  if (beforeState === '|1⟩') return 'Measurement is deterministic here: the qubit will collapse to 1 every time.'
  return 'Apply a gate first to give the qubit a measurable state.'
}

function applyGate(gate: TutorialGateKey) {
  const beforeState = activeSandboxState.value
  sandboxMeasured.value = null
  sandboxResult.value = '—'

  if (!sandboxGates.value[0]) sandboxGates.value[0] = []
  sandboxGates.value[0]!.push(gate)

  recalculateSandbox()
  const nextState = activeSandboxState.value
  sandboxMessage.value = describeGateChange(gate, beforeState as QuantumState | '—', nextState as QuantumState | '—')
}

function measureSandbox() {
  const beforeState = activeSandboxState.value
  const measured = measureAll()
  sandboxResult.value = measured.join(', ')
  sandboxGates.value = [measured[0] === 1 ? ['X'] : []]
  sandboxMeasured.value = null
  recalculateSandbox(null)
  sandboxMessage.value = describeMeasurement(beforeState, activeSandboxState.value)
}

function openGateInfo(gate: TutorialGateKey) {
  emit('openManualSection', gate === 'X' ? 'gate-x' : 'gate-h')
}

function tutorialCardPosition(width: number, height: number, fixedHeight = false) {
  const rect = props.targetRect
  const padding = 16

  const baseStyle: Record<string, string> = {
    width: `${width}px`,
    maxWidth: 'calc(100vw - 24px)',
  }
  if (fixedHeight) {
    baseStyle.height = `${height}px`
    baseStyle.maxHeight = 'calc(100vh - 24px)'
  }

  if (!rect || typeof window === 'undefined') {
    return {
      ...baseStyle,
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
    }
  }

  if (window.innerWidth < 760) {
    return {
      ...baseStyle,
      left: '50%',
      top: `${Math.min(rect.bottom + 16, window.innerHeight - padding - 24)}px`,
      transform: 'translateX(-50%)',
      width: `min(${width}px, calc(100vw - 24px))`,
    }
  }

  const spaceRight = window.innerWidth - rect.right - padding
  const spaceLeft = rect.left - padding

  let left = rect.right + 16
  if (spaceRight < width + 24 && spaceLeft >= width + 24) {
    left = rect.left - width - 16
  } else if (spaceRight < width + 24 && spaceLeft < width + 24) {
    left = Math.min(Math.max(rect.left + rect.width / 2 - width / 2, padding), window.innerWidth - width - padding)
  }

  const top = Math.min(
    Math.max(rect.top + rect.height / 2 - height / 2, padding),
    window.innerHeight - height - padding,
  )

  return { ...baseStyle, left: `${left}px`, top: `${top}px` }
}

const popoverStyle = computed(() => {
  if (props.phase === 'tour') {
    return tutorialCardPosition(340, 240)
  }
  const w = typeof window !== 'undefined' ? window.innerWidth * 0.6 : 620
  const h = typeof window !== 'undefined' ? window.innerHeight * 0.6 : 540
  return tutorialCardPosition(w, h, true)
})

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      resetSandbox()
    }
  },
  { immediate: true },
)
</script>

<template>
  <div v-if="visible" :class="styles.tutorialLayer">
    <div :class="styles.tutorialDimmer"></div>

    <div :class="[styles.tutorialPopover, phase !== 'tour' ? styles.tutorialSandboxPopover : '']" :style="popoverStyle">
      <div v-if="phase === 'tour'" :class="styles.tutorialTourContent">
        <div :class="styles.tutorialProgress">Step {{ stepIndex + 1 }} / {{ stepCount }}</div>
        <div :class="styles.tutorialTitle">{{ title }}</div>
        <div :class="styles.tutorialText">{{ text }}</div>

        <div :class="styles.tutorialActions">
          <button :class="styles.tutorialSecondaryBtn" @click="emit('skip')">Skip to Level 1</button>
          <button :class="styles.tutorialPrimaryBtn" @click="emit('next')">
            {{ stepIndex === stepCount - 1 ? 'Start Sandbox' : 'Next' }}
          </button>
        </div>
      </div>

      <div v-else :class="styles.tutorialSandboxContent">
        <div :class="styles.tutorialSandboxHeader">
          <div :class="styles.tutorialTitle">Sandbox: Quantum Gates</div>
          <div :class="styles.tutorialText">Experiment with the H and X gates to try and understand what they do to the Bloch sphere.</div>
          <div :class="styles.tutorialText">The Bloch Sphere is a way to visualise the state of the ion.</div>
        </div>

        <div :class="styles.tutorialSandboxGrid">
          <div :class="styles.tutorialControlsCard">
            <div :class="styles.tutorialStateMessage">{{ sandboxMessage }}</div>
            <div :class="styles.tutorialGateRow">
              <div
                v-for="gate in sandboxAvailableGates"
                :key="gate"
                :class="[styles.tutorialGateCard, styles[`tutorialGate${gate}`]]"
              >
                <div :class="styles.tutorialGateTopRow">
                  <div :class="styles.tutorialGateName">{{ gate }}-Gate</div>
                  <button :class="styles.tutorialInfoBtn" @click="openGateInfo(gate)">i</button>
                </div>
                <button
                  :class="[styles.tutorialGateAction, styles[`tutorialGateAction${gate}`]]"
                  @click="applyGate(gate)"
                >
                  Apply {{ gate }}
                </button>
              </div>
            </div>

            <div :class="styles.tutorialSandboxActions">
              <button :class="styles.tutorialSecondaryBtn" @click="resetSandbox">Reset Sandbox</button>
              <button :class="styles.tutorialPrimaryBtn" @click="measureSandbox">Measure</button>
            </div>

            <div :class="[styles.tutorialSandboxActions, styles.tutorialSandboxActionsBottom]">
                <button :class="styles.tutorialPrimaryBtn" @click="emit('finish')">Finish Tutorial</button>
            </div>
          </div>

          <div :class="styles.tutorialBlochCard">
            <div :class="styles.tutorialBlochTitle">Bloch Sphere</div>
            <svg :class="styles.tutorialBlochSvg" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
                <text x="80" y="14" :class="sharedStyles.blochLabel" text-anchor="middle">|1⟩</text>
                <text x="80" y="156" :class="sharedStyles.blochLabel" text-anchor="middle">|0⟩</text>
                <text x="10" y="84" :class="sharedStyles.blochLabel" text-anchor="middle">−</text>
                <text x="150" y="84" :class="sharedStyles.blochLabel" text-anchor="middle">+</text>

                <circle cx="80" cy="80" r="52" :class="sharedStyles.blochCircle" />
                <ellipse cx="80" cy="80" rx="52" ry="14" :class="sharedStyles.blochEquator" />

                <g v-if="activeSandboxAngle !== null">
                    <line
                    x1="80" y1="80"
                    :x2="80 + 44 * Math.cos(((activeSandboxAngle ?? 0) * Math.PI) / 180)"
                    :y2="80 + 44 * Math.sin(((activeSandboxAngle ?? 0) * Math.PI) / 180)"
                    :class="sharedStyles.blochArrow"
                    />
                    <circle
                    :cx="80 + 46 * Math.cos(((activeSandboxAngle ?? 0) * Math.PI) / 180)"
                    :cy="80 + 46 * Math.sin(((activeSandboxAngle ?? 0) * Math.PI) / 180)"
                    r="3"
                    :class="sharedStyles.blochTip"
                    />
                </g>

                <circle cx="80" cy="80" r="3" :class="sharedStyles.blochCenter" />
                </svg>

            <div :class="styles.tutorialStateLabel">{{ activeSandboxLabel }}</div>
            <div :class="styles.tutorialStateSummary">{{ sandboxSummary }}</div>
            <div :class="styles.tutorialStateResult">Measure: {{ sandboxResult }}</div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>