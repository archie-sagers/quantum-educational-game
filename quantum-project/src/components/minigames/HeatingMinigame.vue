<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import './intro-levels.css'
import styles from '@/pages/Home.module.css'
import OverlayModal from '@/components/ui/OverlayModal.vue'

const emits = defineEmits<{
  (e: 'complete'): void
}>()

// UI & Progression State
// ------------------
const showWelcome = ref(true)
const welcomeStep = ref(1)
const isComplete = ref(false)

// Game Logic
// ------------------
const temperature = ref(0)
const targetCenter = ref(50)
const progress = ref(0)
const isOverheating = ref(false)

// Particle System
// Stores bubbles representing vaporisation
// ------------------
const bubbles = ref<Array<{ id: number; x: number; y: number; speed: number; size: number; opacity: number }>>([])
let nextId = 0

// Game Loop
// ------------------
let rafId: number | null = null
let lastTime = performance.now()

// Tuning Constants
// ------------------
const ZONE_WIDTH = 30
const FILL_DURATION = 8000
const WOBBLE_SPEED = 1500;
const FADE_RATE = 3000;
const BUBBLE_SPAWN_CHANCE = 0.1;

// Calculate upper and lower bounds of the target zone
const targetMin = computed(() => Math.max(0, targetCenter.value - ZONE_WIDTH / 2))
const targetMax = computed(() => Math.min(100, targetCenter.value + ZONE_WIDTH / 2))

// Main Game Loop
// ------------------
function tick(time: number) {
  // Pause simulation if popup is open or level is complete
  if (showWelcome.value || isComplete.value) {
    lastTime = time
    rafId = requestAnimationFrame(tick)
    return
  }

  const dt = time - lastTime
  lastTime = time

  // Move Target Zone
  targetCenter.value = 50 + Math.sin(time / WOBBLE_SPEED) * 30 + Math.cos(time / 400) * 5

  // Check User Input
  const temp = temperature.value
  isOverheating.value = temp > targetMax.value // Visual warning

  if (temp >= targetMin.value && temp <= targetMax.value) {
    // Fill progress if inside zone
    progress.value = Math.min(100, progress.value + (dt / FILL_DURATION) * 100)
    if (progress.value >= 100) {
      finish()
      return
    }
  } else if (progress.value > 0) {
    // Draining progress if they move out of zone
    progress.value = Math.max(0, progress.value - (dt / 2000) * 100)
  }

  // Spawn Bubbles
  if (temp >= targetMin.value && Math.random() < BUBBLE_SPAWN_CHANCE * (temp / 50)) {
    bubbles.value.push({
      id: nextId++,
      x: 30 + Math.random() * 40,
      y: 60,
      speed: 20 + Math.random() * 30,
      size: 4 + Math.random() * 8,
      opacity: 0.8
    })
  }

  // Physics for bubbles
  for (const b of bubbles.value) {
    b.y -= (b.speed * dt) / 1000 // Move up
    b.opacity -= dt / FADE_RATE  // Fade out
  }
  // Remove invisible bubbles
  bubbles.value = bubbles.value.filter(b => b.opacity > 0)

  rafId = requestAnimationFrame(tick)
}

function finish() {
  isComplete.value = true
}

function proceed() {
  emits('complete')
}

// Start game loop on mount
onMounted(() => {
  lastTime = performance.now()
  rafId = requestAnimationFrame(tick)
})

// Prevent the loop from running in the background if finished
onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<template>
  <div class="container">

    <div class="viewport" :class="{ 'zoom-in': isComplete }">

      <div v-if="isOverheating && !isComplete" class="warning">
        WARNING: TEMPERATURE CRITICAL
      </div>

      <div
        v-for="bubble in bubbles"
        :key="bubble.id"
        class="bubble"
        :style="{
          left: bubble.x + '%',
          top: bubble.y + '%',
          width: bubble.size + 'px',
          height: bubble.size + 'px',
          opacity: bubble.opacity
        }"
      />

      <div class="ytterbium" :class="{ shake: isOverheating && !isComplete }">
        Yb 171
      </div>

    </div>

    <div class="sidebar">
      <h3>Heating Element</h3>
      <p class="description">
        Adjust the temperature to vaporise the ytterbium atoms. Keep it within the purple zone to fill the progress bar.
      </p>

      <div class="progress-bar-track">
        <div class="progress-bar-fill" :style="{ width: progress + '%' }" />
      </div>
      <div class="progress-label">{{ Math.floor(progress) }}% Vaporised</div>

      <div class="dial dial--lg">
        <div class="target-track">
          <div
            class="target-zone"
            :style="{ bottom: targetCenter + '%', height: ZONE_WIDTH + '%' }"
          />
        </div>
        <!-- User input -->
        <input
          type="range"
          v-model.number="temperature"
          min="0"
          max="100"
          class="slider"
        />
      </div>
    </div>

    <OverlayModal
      :show="showWelcome && welcomeStep === 1"
      kind="welcome"
      title="Introductory Stage"
      text="Welcome to the introductory stage - you will first start by heating Ytterbium in an atomic oven."
      :z-index="9999"
      :buttons="[{ label: 'Next', onClick: () => welcomeStep = 2 }]"
    />
    <OverlayModal
      :show="showWelcome && welcomeStep === 2"
      kind="welcome"
      title="Initialise Heating"
      text="Start by dragging the slider on the right and holding it in the correct purple position."
      :z-index="9999"
      :buttons="[{ label: 'Begin', onClick: () => showWelcome = false }]"
    />
    <OverlayModal
      :show="isComplete"
      kind="popup"
      title="Vaporisation Complete"
      :title-style="{ color: 'var(--color-success)' }"
      :modal-style="{ borderColor: 'var(--color-success)', boxShadow: '0 0 20px rgba(0, 255, 0, 0.2)' }"
      text="The Ytterbium atoms have been successfully vaporised. We are now ready to ionise them."
      :buttons="[{ label: 'Proceed to Ionisation', onClick: proceed, class: styles.nextBtn, style: { alignSelf: 'flex-end' } }]"
    />

  </div>
</template>