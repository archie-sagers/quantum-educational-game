<script setup lang="ts">
import { computed } from 'vue'
import { getBlochAngle, getBlochLabel } from '@/game/quantumgame'
import type { IonQuantumState } from '@/game/types'
import styles from '@/pages/Home.module.css'

// Receive props from home.vue
const props = defineProps<{
  ionState: IonQuantumState
  ionIndex: number
  compact: boolean
}>()

// Converts ion index to a letter label
const label = String.fromCharCode(65 + props.ionIndex)

// Converts degrees to radians
const angleRad = computed(() => {
  const deg = getBlochAngle(props.ionState.state)
  return deg === null ? null : (deg * Math.PI) / 180
})

// Compute the tip and dot positions based on the angle
const tipX = computed(() => (angleRad.value === null ? 80 : 80 + 44 * Math.cos(angleRad.value)))
const tipY = computed(() => (angleRad.value === null ? 80 : 80 + 44 * Math.sin(angleRad.value)))
const dotX = computed(() => (angleRad.value === null ? 80 : 80 + 46 * Math.cos(angleRad.value)))
const dotY = computed(() => (angleRad.value === null ? 80 : 80 + 46 * Math.sin(angleRad.value)))

// Change colour of state label if in superposition
const isSuperposition = computed(() => props.ionState.state === '|+⟩' || props.ionState.state === '|-⟩')
const stateColourClass = computed(() =>
  isSuperposition.value ? styles.infoValPurple : props.ionState.state === '|1⟩' ? styles.infoValOrange : styles.infoValCyan
)
</script>

<template>
  <div :class="[styles.ionSection, { [styles.ionSectionCompact as string]: compact }]">
    <div :class="[styles.blochPanel, { [styles.blochPanelCompact as string]: compact }]" style="text-align: center;">
      <div :class="styles.blochTitle">
        Ion {{ label }}<span v-if="!compact"> - Bloch Sphere</span>
      </div>

      <svg
        :class="[styles.blochSvg, { [styles.blochSvgCompact as string]: compact }]"
        viewBox="0 0 160 160"
        xmlns="http://www.w3.org/2000/svg"
        :style="compact ? 'max-width: 90px; height: auto; margin: 0 auto;' : 'max-width: 100%; height: auto; margin: 0 auto;'"
      >
        <text x="80" y="14" :class="styles.blochLabel" text-anchor="middle">|1⟩</text>
        <text x="80" y="156" :class="styles.blochLabel" text-anchor="middle">|0⟩</text>
        <text x="10" y="84" :class="styles.blochLabel" text-anchor="middle">−</text>
        <text x="150" y="84" :class="styles.blochLabel" text-anchor="middle">+</text>

        <circle cx="80" cy="80" r="52" :class="styles.blochCircle" />
        <ellipse cx="80" cy="80" rx="52" ry="14" :class="styles.blochEquator" />

        <g v-if="angleRad !== null">
          <line x1="80" y1="80" :x2="tipX" :y2="tipY" :class="styles.blochArrow" />
          <circle :cx="dotX" :cy="dotY" r="3" :class="styles.blochTip" />
        </g>

        <circle cx="80" cy="80" r="3" :class="styles.blochCenter" />
      </svg>

      <div
        :class="{ [styles.blochState as string]: true, [styles.blochStateSuperposition as string]: isSuperposition }"
        :style="compact
          ? 'max-width: 90px; white-space: normal !important; word-wrap: break-word; line-height: 1.2; margin: 0 auto;'
          : 'max-width: 100%; white-space: normal !important; word-wrap: break-word; line-height: 1.2; margin: 0 auto;'"
      >
        {{ getBlochLabel(ionState.state) }}
      </div>
    </div>

    <div v-if="!compact" :class="styles.infoPanel">
      <div :class="styles.infoRow">
        <span :class="styles.infoKey">State</span>
        <span :class="[styles.infoVal, stateColourClass]">{{ ionState.state }}</span>
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
</template>
