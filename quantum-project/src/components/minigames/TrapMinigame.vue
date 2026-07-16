<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { Ion } from '@/game/types'
import './intro-levels.css'
import styles from '@/pages/Home.module.css'

const emits = defineEmits<{
  (e: 'complete'): void
}>()

const showWelcome = ref(true)
const isComplete = ref(false)
const isTopBottomActive = ref(true)
const viewportRef = ref<HTMLElement | null>(null)

const WIN_TIME_MS = 8000
const SPRING_CONSTANT = 0.0007
const TRAP_BOUNDS = { min: 25, max: 75 }

const ions = ref<Ion[]>([
  { id: 1, x: 10, y: 25, vx: 0, vy: 0, isDragging: false, inTrap: false, timeInTrap: 0 },
  { id: 2, x: 10, y: 50, vx: 0, vy: 0, isDragging: false, inTrap: false, timeInTrap: 0 },
  { id: 3, x: 10, y: 75, vx: 0, vy: 0, isDragging: false, inTrap: false, timeInTrap: 0 },
  { id: 4, x: 90, y: 25, vx: 0, vy: 0, isDragging: false, inTrap: false, timeInTrap: 0 },
  { id: 5, x: 90, y: 50, vx: 0, vy: 0, isDragging: false, inTrap: false, timeInTrap: 0 },
  { id: 6, x: 90, y: 75, vx: 0, vy: 0, isDragging: false, inTrap: false, timeInTrap: 0 },
])

const draggedIon = ref<Ion | null>(null)
let rafId: number | null = null
let lastTime = performance.now()

function toggleModulation() {
  if (showWelcome.value || isComplete.value) return
  isTopBottomActive.value = !isTopBottomActive.value
}

function startDrag(ion: Ion, e: MouseEvent) {
  if (showWelcome.value || isComplete.value) return
  draggedIon.value = ion
  ion.isDragging = true
  ion.vx = 0
  ion.vy = 0
  dragMove(e)
}

function handleMove(e: MouseEvent) {
  if (!draggedIon.value) return
  dragMove(e)
}

function dragMove(e: MouseEvent) {
  if (!viewportRef.value || !draggedIon.value) return
  const rect = viewportRef.value.getBoundingClientRect()
  const nx = ((e.clientX - rect.left) / rect.width) * 100
  const ny = ((e.clientY - rect.top) / rect.height) * 100

  draggedIon.value.x = Math.max(0, Math.min(100, nx))
  draggedIon.value.y = Math.max(0, Math.min(100, ny))
}

function onMouseUp() {
  if (!draggedIon.value) return
  const ion = draggedIon.value

  // Check if the ion is dropped inside the trap bounds
  const droppedInTrap =
    ion.x >= TRAP_BOUNDS.min && ion.x <= TRAP_BOUNDS.max &&
    ion.y >= TRAP_BOUNDS.min && ion.y <= TRAP_BOUNDS.max

  ion.inTrap = droppedInTrap
  if (droppedInTrap) ion.timeInTrap = 0

  ion.isDragging = false
  draggedIon.value = null
}

function loop(time: number) {
  if (showWelcome.value || isComplete.value) {
    lastTime = time
    rafId = requestAnimationFrame(loop)
    return
  }

  const dt = time - lastTime
  lastTime = time

  for (const ion of ions.value) {
    if (ion.isDragging) continue

    if (ion.inTrap) {
      const dx = ion.x - 50
      const dy = ion.y - 50

      if (isTopBottomActive.value) {
        ion.vx += dx * SPRING_CONSTANT * dt
        ion.vy -= dy * SPRING_CONSTANT * dt
      } else {
        ion.vx -= dx * SPRING_CONSTANT * dt
        ion.vy += dy * SPRING_CONSTANT * dt
      }

      ion.x += (ion.vx * dt) / 100
      ion.y += (ion.vy * dt) / 100
      // console.log(ion.x, ion.y)

      // Apply damping to the velocity
      ion.vx *= 0.98
      ion.vy *= 0.98

      const escaped =
        ion.x < TRAP_BOUNDS.min || ion.x > TRAP_BOUNDS.max ||
        ion.y < TRAP_BOUNDS.min || ion.y > TRAP_BOUNDS.max

      if (escaped) {
        ion.inTrap = false
        ion.timeInTrap = 0
        ion.vx = dx * 0.2
        ion.vy = dy * 0.2
      } else {
        ion.timeInTrap += dt
        if (ion.timeInTrap >= WIN_TIME_MS && !isComplete.value) winTrap()
      }
    } else {
      ion.x += (ion.vx * dt) / 100
      ion.y += (ion.vy * dt) / 100
      ion.vx *= 0.9
      ion.vy *= 0.9

      if (ion.x < 5 || ion.x > 95) ion.vx *= -1
      if (ion.y < 5 || ion.y > 95) ion.vy *= -1
      ion.x = Math.max(5, Math.min(95, ion.x))
      ion.y = Math.max(5, Math.min(95, ion.y))
    }
  }

  rafId = requestAnimationFrame(loop)
}

function winTrap() {
  isComplete.value = true
}

function proceed() {
  emits('complete')
}

onMounted(() => {
  window.addEventListener('mousemove', handleMove)
  window.addEventListener('mouseup', onMouseUp)
  lastTime = performance.now()
  rafId = requestAnimationFrame(loop)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMove)
  window.removeEventListener('mouseup', onMouseUp)
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<template>
  <div class="container">
    <div class="viewport" ref="viewportRef">
      <div class="trap-bounds" />

      <div class="electrode top" :class="{ active: isTopBottomActive }" />
      <div class="electrode bottom" :class="{ active: isTopBottomActive }" />
      <div class="electrode left" :class="{ active: !isTopBottomActive }" />
      <div class="electrode right" :class="{ active: !isTopBottomActive }" />

      <div
        v-for="ion in ions"
        :key="ion.id"
        class="ion"
        :class="{ dragging: ion.isDragging, trapped: ion.inTrap }"
        :style="{ left: ion.x + '%', top: ion.y + '%' }"
        @mousedown="startDrag(ion, $event)"
      >
        <div class="ion-label">Yb+</div>

        <div
          v-if="ion.inTrap"
          class="progress-ring"
          :style="{ background: `conic-gradient(var(--color-primary) ${(ion.timeInTrap / WIN_TIME_MS) * 360}deg, transparent 0)` }"
        />
      </div>
    </div>

    <div class="sidebar">
      <h3>Paul Trap Control</h3>

      <button
        class="modulate-btn"
        @click="toggleModulation"
        :disabled="showWelcome || isComplete"
      >
        Modulate the Magnetic Field
      </button>

      <div class="instructions">
        <p><strong>Drag and drop</strong> Yb+ ions into the trap.</p>
        <p>Repeatedly press the button to balance the ion in the trap.</p>
      </div>
    </div>

    <div v-if="showWelcome" :class="styles.welcomeOverlay">
      <div :class="styles.welcomeModal">
        <div :class="styles.welcomeTitle">Initialise Trap</div>
        <div :class="styles.welcomeText">Drag and drop a Yb+ ion into the Paul trap and modulate the magnetic field to keep it in place.</div>
        <button :class="styles.welcomeBtn" @click="showWelcome = false">Begin</button>
      </div>
    </div>

    <div v-if="isComplete" :class="styles.popupOverlay">
      <div :class="styles.popupModal" style="border-color: var(--color-success); box-shadow: 0 0 20px rgba(0, 255, 0, 0.2);">
        <div :class="styles.popupTitle" style="color: var(--color-success);">Trap Stabilised</div>
        <div :class="styles.popupText">The ion is now contained in the Paul trap using modulating magnetic fields. We need to cool it and prepare it for storing information.</div>
        <button :class="styles.nextBtn" @click="proceed" style="align-self: flex-end;">Proceed to Cooling</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.viewport {
  user-select: none;
}

.sidebar {
  z-index: 20;
}

.trap-bounds {
  position: absolute;
  left: 25%;
  top: 25%;
  right: 25%;
  bottom: 25%;
  border: 1px dashed var(--color-border);
  background: radial-gradient(circle at center, rgba(0, 238, 255, 0.05), transparent 70%);
}

.electrode {
  position: absolute;
  background: var(--color-primary);
  box-shadow: 0 0 10px var(--color-primary-light);
  transition: all var(--transition) cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: var(--border-radius);
  opacity: 0.6;
}

.electrode.active {
  background: var(--color-secondary);
  box-shadow: 0 0 20px var(--color-secondary-light);
  opacity: 1;
  z-index: 5;
}

/* BAse states */
.electrode.top { top: 23%; left: 30%; right: 30%; height: 6px; }
.electrode.bottom { bottom: 23%; left: 30%; right: 30%; height: 6px; }
.electrode.left { left: 23%; top: 30%; bottom: 30%; width: 6px; }
.electrode.right { right: 23%; top: 30%; bottom: 30%; width: 6px; }

/* Active states */
.electrode.top.active { top: 20%; left: 25%; right: 25%; height: 16px; }
.electrode.bottom.active { bottom: 20%; left: 25%; right: 25%; height: 16px; }
.electrode.left.active { left: 20%; top: 25%; bottom: 25%; width: 16px; }
.electrode.right.active { right: 20%; top: 25%; bottom: 25%; width: 16px; }

.ion {
  position: absolute;
  width: 50px;
  height: 50px;
  transform: translate(-50%, -50%);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: grab;
  z-index: 10;
}

.ion.dragging {
  cursor: grabbing;
  z-index: 100;
  transform: translate(-50%, -50%) scale(1.2);
}

.ion-label {
  width: 40px;
  height: 40px;
  background: radial-gradient(circle at 30% 30%, var(--color-secondary), var(--color-bg));
  border: 2px solid var(--color-secondary-light);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  font-size: 14px;
  color: var(--color-text);
  box-shadow: 0 0 15px var(--color-secondary);
  position: relative;
  z-index: 2;
}

.progress-ring {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  z-index: 1;
  opacity: 0.8;
  mask: radial-gradient(transparent 26px, black 27px);
  -webkit-mask: radial-gradient(transparent 26px, black 27px);
}

.modulate-btn {
  margin-top: 50px;
  width: 100%;
  padding: 20px 15px;
  background: var(--color-bg-light);
  border: 2px solid var(--color-secondary);
  color: var(--color-text);
  font-size: 20px;
  font-weight: bold;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all var(--transition);
  text-transform: uppercase;
}

.modulate-btn:hover:not(:disabled) {
  background: var(--color-secondary);
  box-shadow: 0 0 20px var(--color-secondary-light);
}

.modulate-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.modulate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: var(--color-text-dim);
}
</style>
