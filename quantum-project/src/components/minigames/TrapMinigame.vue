<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { Ion } from '@/game/types'
import './intro-levels.css'
import styles from '@/pages/Home.module.css'

const emits = defineEmits<{
  (e: 'complete'): void
}>()

// UI & State
// ----------
const showWelcome = ref(true)
const isComplete = ref(false)
const viewportRef = ref<HTMLElement | null>(null)

// Game Logic State 
// ----------
const isTopBottomActive = ref(true)
const draggedIon = ref<Ion | null>(null)

// Physics Constants
// ----------
const WIN_TIME_MS = 8000 // How long the player must hold the ion in the trap
const SPRING_CONSTANT = 0.0007 // Strength of the electric field pushing/pulling the ion
const TRAP_BOUNDS = { min: 25, max: 75 } // The area in the center that constitutes the trap

// Initialise ions on the left and right sides of the screen
const ions = ref<Ion[]>([
  { id: 1, x: 10, y: 25, vx: 0, vy: 0, isDragging: false, inTrap: false, timeInTrap: 0 },
  { id: 2, x: 10, y: 50, vx: 0, vy: 0, isDragging: false, inTrap: false, timeInTrap: 0 },
  { id: 3, x: 10, y: 75, vx: 0, vy: 0, isDragging: false, inTrap: false, timeInTrap: 0 },
  { id: 4, x: 90, y: 25, vx: 0, vy: 0, isDragging: false, inTrap: false, timeInTrap: 0 },
  { id: 5, x: 90, y: 50, vx: 0, vy: 0, isDragging: false, inTrap: false, timeInTrap: 0 },
  { id: 6, x: 90, y: 75, vx: 0, vy: 0, isDragging: false, inTrap: false, timeInTrap: 0 },
])

let rafId: number | null = null
let lastTime = performance.now()

// Flips the electric field polarity. 
function toggleModulation() {
  if (showWelcome.value || isComplete.value) return
  isTopBottomActive.value = !isTopBottomActive.value
}

// Drag & Drop Handling
// ----------
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

// Translates pixel mouse coordinates into viewport percentages (0-100%)
function dragMove(e: MouseEvent) {
  if (!viewportRef.value || !draggedIon.value) return
  
  const rect = viewportRef.value.getBoundingClientRect()
  const nx = ((e.clientX - rect.left) / rect.width) * 100
  const ny = ((e.clientY - rect.top) / rect.height) * 100

  // Clamp the ion to edges of viewport (so it can't be dragged off screen)
  draggedIon.value.x = Math.max(0, Math.min(100, nx))
  draggedIon.value.y = Math.max(0, Math.min(100, ny))
}

function onMouseUp() {
  if (!draggedIon.value) return
  const ion = draggedIon.value

  // Check if the player let go of the ion inside the trap zone
  const droppedInTrap =
    ion.x >= TRAP_BOUNDS.min && ion.x <= TRAP_BOUNDS.max &&
    ion.y >= TRAP_BOUNDS.min && ion.y <= TRAP_BOUNDS.max

  ion.inTrap = droppedInTrap
  if (droppedInTrap) ion.timeInTrap = 0

  ion.isDragging = false
  draggedIon.value = null
}

// Main Physics Loop
// ----------
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
      // Calculate distance from the centre
      const dx = ion.x - 50
      const dy = ion.y - 50

      // PAUL TRAP PHYSICS
      // Pushes the ion towards the center on one axis, but away on the other axis
      if (isTopBottomActive.value) {
        ion.vx += dx * SPRING_CONSTANT * dt // Repulsive on X axis
        ion.vy -= dy * SPRING_CONSTANT * dt // Attractive on Y axis
      } else {
        ion.vx -= dx * SPRING_CONSTANT * dt // Attractive on X axis
        ion.vy += dy * SPRING_CONSTANT * dt // Repulsive on Y axis
      }

      ion.x += (ion.vx * dt) / 100
      ion.y += (ion.vy * dt) / 100

      // Apply damping
      ion.vx *= 0.98
      ion.vy *= 0.98

      // Check if ion fell out of the trap
      const escaped =
        ion.x < TRAP_BOUNDS.min || ion.x > TRAP_BOUNDS.max ||
        ion.y < TRAP_BOUNDS.min || ion.y > TRAP_BOUNDS.max

      if (escaped) {
        ion.inTrap = false
        ion.timeInTrap = 0
        // Push outward when it escapes
        ion.vx = dx * 0.2
        ion.vy = dy * 0.2
      } else {
        // Increment win timer if still trapped
        ion.timeInTrap += dt
        if (ion.timeInTrap >= WIN_TIME_MS && !isComplete.value) winTrap()
      }
    } else {
      // Not in trap physics
      ion.x += (ion.vx * dt) / 100
      ion.y += (ion.vy * dt) / 100
      
      // Slow when drifting outside the trap
      ion.vx *= 0.9
      ion.vy *= 0.9

      // Collision detection with the viewport walls
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