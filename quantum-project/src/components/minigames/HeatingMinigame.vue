<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import './intro-levels.css'
import styles from '@/pages/Home.module.css'

const emits = defineEmits<{
  (e: 'complete'): void
}>()

const showWelcome = ref(true)
const welcomeStep = ref(1)
const temperature = ref(0)
const targetCenter = ref(50)
const progress = ref(0)
const isOverheating = ref(false)
const isComplete = ref(false)

const bubbles = ref<Array<{ id: number; x: number; y: number; speed: number; size: number; opacity: number }>>([])
let rafId: number | null = null
let lastTime = performance.now()
let nextId = 0

const ZONE_WIDTH = 30
const FILL_DURATION = 8000
const WOBBLE_SPEED = 1500;
const FADE_RATE = 3000;
const BUBBLE_SPAWN_CHANCE = 0.1;

const targetMin = computed(() => Math.max(0, targetCenter.value - ZONE_WIDTH / 2))
const targetMax = computed(() => Math.min(100, targetCenter.value + ZONE_WIDTH / 2))

function tick(time: number) {
  if (showWelcome.value || isComplete.value) {
    lastTime = time
    rafId = requestAnimationFrame(tick)
    return
  }

  const dt = time - lastTime
  lastTime = time

  targetCenter.value = 50 + Math.sin(time / WOBBLE_SPEED) * 30 + Math.cos(time / 400) * 5

  const temp = temperature.value
  isOverheating.value = temp > targetMax.value

  if (temp >= targetMin.value && temp <= targetMax.value) {
    progress.value = Math.min(100, progress.value + (dt / FILL_DURATION) * 100)
    if (progress.value >= 100) {
      finish()
      return
    }
  } else if (progress.value > 0) {
    progress.value = Math.max(0, progress.value - (dt / 2000) * 100)
  }

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

  for (const b of bubbles.value) {
    b.y -= (b.speed * dt) / 1000
    b.opacity -= dt / FADE_RATE
  }
  bubbles.value = bubbles.value.filter(b => b.opacity > 0)

  rafId = requestAnimationFrame(tick)
}

function finish() {
  isComplete.value = true
}

function proceed() {
  emits('complete')
}

onMounted(() => {
  lastTime = performance.now()
  rafId = requestAnimationFrame(tick)
})

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
        <input
          type="range"
          v-model.number="temperature"
          min="0"
          max="100"
          class="slider"
        />
      </div>
    </div>

    <div v-if="showWelcome" :class="styles.welcomeOverlay" style="z-index: 9999;">
      <div :class="styles.welcomeModal">

        <template v-if="welcomeStep === 1">
          <div :class="styles.welcomeTitle">Introductory Stage</div>
          <div :class="styles.welcomeText">Welcome to the introductory stage - you will first start by heating Ytterbium in an atomic oven.</div>
          <button :class="styles.welcomeBtn" @click="welcomeStep = 2">Next</button>
        </template>

        <template v-else>
          <div :class="styles.welcomeTitle">Initialise Heating</div>
          <div :class="styles.welcomeText">Start by dragging the slider on the right and holding it in the correct purple position.</div>
          <button :class="styles.welcomeBtn" @click="showWelcome = false">Begin</button>
        </template>

      </div>
    </div>

    <div v-if="isComplete" :class="styles.popupOverlay">
      <div :class="styles.popupModal" style="border-color: var(--color-success); box-shadow: 0 0 20px rgba(0, 255, 0, 0.2);">
        <div :class="styles.popupTitle" style="color: var(--color-success);">Vaporisation Complete</div>
        <div :class="styles.popupText">The Ytterbium atoms have been successfully vaporised. We are now ready to ionise them.</div>
        <button :class="styles.nextBtn" @click="proceed" style="align-self: flex-end;">Proceed to Ionisation</button>
      </div>
    </div>

  </div>
</template>

<style scoped>
.viewport {
  display: flex;
  justify-content: center;
  align-items: center;
  transition: transform 2s cubic-bezier(0.4, 0, 0.2, 1);
}

.zoom-in {
  transform: scale(4) translateY(10%);
}

.warning {
  position: absolute;
  top: 10%;
  color: var(--color-danger);
  font-weight: bold;
  font-size: 24px;
  animation: flash 0.5s infinite alternate;
}

@keyframes flash {
  from { opacity: 1; }
  to   { opacity: 0; }
}

.ytterbium {
  width: 180px;
  height: 120px;
  background: radial-gradient(circle at 30% 30%, var(--color-danger), var(--color-danger-light));
  border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 28px;
  font-weight: bold;
  color: var(--color-text);
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
  box-shadow: 0 0 30px rgba(255, 170, 0, 0.2);
  z-index: 10;
}

.shake {
  animation: shake 0.2s infinite;
  box-shadow: 0 0 40px rgba(255, 68, 68, 0.6);
}

@keyframes shake {
  0%   { transform: translate(2px, 1px); }
  40%  { transform: translate(-3px, -1px) rotate(-1deg); }
  100% { transform: translate(1px, 2px) rotate(1deg); }
}

.bubble {
  position: absolute;
  background: rgba(255, 200, 100, 0.6);
  border-radius: 50%;
  pointer-events: none;
}
</style>
