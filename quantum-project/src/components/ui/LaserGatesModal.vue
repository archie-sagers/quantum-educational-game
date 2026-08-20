<script setup lang="ts">
import styles from '@/pages/Home.module.css'

defineProps<{
  activeGates: string[]
  displayedGateProgress: string | null
  availableGates: string[]
  gateInventory: Record<string, number>
  isGateLocked: (index: number) => boolean
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'gateDragStart', ev: DragEvent, gateType: string): void
  (e: 'placedGateDragStart', ev: DragEvent, index: number, gateType: string): void
  (e: 'laserDragOver', ev: DragEvent): void
  (e: 'laserDrop', ev: DragEvent): void
  (e: 'placedGateDrop', ev: DragEvent, index: number): void
  (e: 'removeGate', index: number): void
  (e: 'addGate', gateType: string): void
  (e: 'openGateManual', gateType: string): void
}>()
</script>

<template>
  <div :class="styles.laserGatesOverlay" @click="$emit('close')">
    <div :class="styles.laserGatesModal" @click.stop>
      <div :class="styles.laserGatesTitle">Laser Gates</div>

      <div :class="styles.gateContainer">
        <div :class="styles.appliedSection">
          <div :class="styles.sectionLabel">
            Applied to Laser
            <span v-if="displayedGateProgress !== null" :class="styles.gateCount">
                {{ displayedGateProgress }}
            </span>
          </div>
          <div @dragover="$emit('laserDragOver', $event)" @drop="$emit('laserDrop', $event)" :class="styles.laserDropZone">
            <div v-if="activeGates.length > 0" :class="styles.gateStack">
              <div
                v-for="(gate, index) in activeGates"
                :key="`laser-gate-${index}`"
                :class="[
                  styles.laserGate,
                  { [styles.laserGateX as string]: gate === 'X' },
                  { [styles.laserGateH as string]: gate === 'H' },
                  { [styles.laserGateCNOT as string]: gate === 'CNOT' },
                  { [styles.draggableGate as string]: !isGateLocked(index) }
                ]"
                :draggable="!isGateLocked(index)"
                @dragstart="$emit('placedGateDragStart', $event, index, gate)"
                @dragover.prevent
                @drop.stop="$emit('placedGateDrop', $event, index)"
              >
                <div>{{ gate === 'X' ? 'X-Gate' : gate }}</div>
                <button v-if="!isGateLocked(index)" @click="$emit('removeGate', index)" :class="styles.removeBtn">✕</button>
              </div>
            </div>
            <div v-else :class="styles.dropHint">Drag gates here</div>
          </div>
        </div>

        <div :class="styles.divider"></div>

        <div :class="styles.gatesSection">
          <div :class="styles.sectionLabel">Available Gates</div>
          <div :class="styles.gateGrid">
            <div
              v-for="(gate, index) in availableGates"
              :key="`gate-${index}`"
              draggable="true"
              @dragstart="$emit('gateDragStart', $event, gate)"
              @click="$emit('addGate', gate)"
              :class="[
                styles.gateItem,
                { [styles.gateItemX as string]: gate === 'X' },
                { [styles.gateItemH as string]: gate === 'H' },
                { [styles.gateItemCNOT as string]: gate === 'CNOT' },
                { [styles.gateItemDisabled as string]: (gateInventory[gate] ?? -1) === 0 }
              ]"
            >
              <button type="button" :class="styles.gateInfoBtn" @click.stop="$emit('openGateManual', gate)">i</button>
              <div>{{ gate }}-Gate</div>
            </div>
          </div>
        </div>
      </div>
      <button @click="$emit('close')" :class="styles.doneBtn">Done</button>
    </div>
  </div>
</template>
