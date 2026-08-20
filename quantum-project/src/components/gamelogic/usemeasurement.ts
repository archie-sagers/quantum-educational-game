import { ref, computed, type ComputedRef } from 'vue'
import { measureAll } from '@/game/quantumgame'

// Shared measurement state + mechanics used by both Home and Lab
export function useMeasurement(baseDelayMs = 800) {
  const result = ref('—')
  const history = ref<number[][]>([])
  const showWin = ref(false)
  const canMeasure = ref(false)
  const isMeasured = ref(false)
  const measuredValues = ref<number[] | null>(null)

  // Delay scales with the number of gates
  function computeDynamicDelay(sourceGates: string[][]) {
    const maxGates = Math.max(1, ...sourceGates.map(g => (g ? g.length : 0)))
    return baseDelayMs * (1 + (maxGates - 1) * 0.1)
  }

  function pushHistory(values: number[], maxLen = 20) {
    history.value.push(values)
    if (history.value.length > maxLen) history.value.shift()
  }

  // Runs measureAll(), updates measuredValues/isMeasured/result and records history
  function collapseMeasurement(maxLen = 20) {
    const values = measureAll()
    measuredValues.value = values
    isMeasured.value = true
    result.value = values.join(',')
    pushHistory(values, maxLen)
    return values
  }

  // If already measured, re-emit result into history
  function repeatLastMeasurement(maxLen = 20) {
    result.value = measuredValues.value ? measuredValues.value.join(',') : '—'
    if (measuredValues.value) pushHistory(measuredValues.value, maxLen)
  }

  // Clears collapsed state and result readout
  function resetMeasurementState() {
    isMeasured.value = false
    measuredValues.value = null
    result.value = '—'
  }

  function resultColourClass(styles: Record<string, string>) {
    return computed(() => (result.value === '1' ? styles.infoValOrange : styles.infoValCyan))
  }

  return {
    result,
    history,
    showWin,
    canMeasure,
    isMeasured,
    measuredValues,
    computeDynamicDelay,
    pushHistory,
    collapseMeasurement,
    repeatLastMeasurement,
    resetMeasurementState,
    resultColourClass,
  }
}