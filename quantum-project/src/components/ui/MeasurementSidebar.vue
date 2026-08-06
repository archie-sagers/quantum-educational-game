<script setup lang="ts">
import type { IonQuantumState } from '@/game/types'
import BlochSpherePanel from './BlochSpherePanel.vue'
import styles from '@/pages/Home.module.css'

const props = defineProps<{
  ionStates: IonQuantumState[]
  canMeasure: boolean
  automatedRunning: boolean
  showResetButton: boolean
  result: string
  isOrangeResult: boolean
  history: number[][]
  tutorialVisible: boolean
  isTutorialStep: (key: 'bloch' | 'measure' | 'reset' | 'history') => boolean // Check if a tutorial step is active
  blochPanelRef: (el: any) => void
  measureBtnRef: (el: any) => void
  resetBtnRef: (el: any) => void
  historyRef: (el: any) => void
}>()

defineEmits<{
  (e: 'measure'): void
  (e: 'reset'): void
}>()
</script>

<template>
  <aside :class="styles.sidebar" aria-label="Quantum state and measurement controls">
    <div :ref="blochPanelRef" :class="[styles.ionWrapper, { [styles.tutorialHighlight as string]: isTutorialStep('bloch') }]" aria-label="Bloch sphere and ion state panel">
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
        :ref="measureBtnRef"
        @click="$emit('measure')"
        :disabled="!canMeasure || automatedRunning"
        :class="[styles.measureBtn, { [styles.tutorialHighlight as string]: isTutorialStep('measure') }]"
        aria-label="Measure ion state"
      >
        Measure
      </button>

      <button
        v-if="showResetButton"
        :ref="resetBtnRef"
        @click="$emit('reset')"
        :disabled="automatedRunning"
        :class="[styles.resetBtn, { [styles.tutorialHighlight as string]: isTutorialStep('reset') }]"
        aria-label="Reset ion to the ground state"
      >
        Reset Ion (Optical Pumping)
      </button>

      <div :class="styles.infoRow" aria-live="polite" aria-atomic="true">
        <span :class="styles.infoKey">Last</span>
        <span :class="[styles.infoVal, isOrangeResult ? styles.infoValOrange : styles.infoValCyan]">{{ result }}</span>
      </div>

      <div
        :ref="historyRef"
        :class="[styles.history, { [styles.tutorialHighlight as string]: isTutorialStep('history') }]"
        aria-live="polite"
        aria-atomic="true"
        aria-label="Measurement history"
      >
        <span :class="styles.infoKey">History</span>
        <span :class="styles.historyBits">
          {{ history.length ? history.map((r) => r.join('')).join(' ') : 'No measurements yet' }}
        </span>
      </div>
    </div>
  </aside>
</template>
