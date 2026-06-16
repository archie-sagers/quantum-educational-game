<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

const emits = defineEmits<{
  (e: 'complete'): void
}>()

const temperature = ref(0)
const targetCenter = ref(50)
const progress = ref(0)
const isOverheating = ref(false)
const isComplete = ref(false)

const bubbles = ref<Array<{ id: number; x: number; y: number; speed: number; size: number; opacity: number }>>([])
let rafId: number | null = null
let lastTime = performance.now()
let nextId = 0

const ZONE_WIDTH = 20
const FILL_DURATION = 8000
const WOBBLE_SPEED = 1500;
const FADE_RATE = 3000;
const BUBBLE_SPAWN_CHANCE = 0.1;

const targetMin = computed(() => Math.max(0, targetCenter.value - ZONE_WIDTH / 2))
const targetMax = computed(() => Math.min(100, targetCenter.value + ZONE_WIDTH / 2))

function tick(time: number) {
  if (isComplete.value) return

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
  if (rafId) cancelAnimationFrame(rafId)
  setTimeout(() => emits('complete'), 2000)
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

      <div class="progress-bar-track">
        <div class="progress-bar-fill" :style="{ width: progress + '%' }" />
      </div>
      <div class="progress-label">{{ Math.floor(progress) }}% Vaporised</div>

      <div class="dial">
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

  </div>
</template>

<style scoped>
.container {
  display: flex;
  width: 100%;
  height: 80vh;
  background: #0a0a0a;
  border: 1px solid #333;
  overflow: hidden;
  color: #eee;
}

.viewport {
  flex: 1;
  position: relative;
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
  color: #ff4444;
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
  background: radial-gradient(circle at 30% 30%, #ffaa00, #d35400);
  border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 28px;
  font-weight: bold;
  color: #fff;
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

.sidebar {
  flex: 0 0 300px;
  background: #111;
  border-left: 1px solid #333;
  padding: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.progress-bar-track {
  width: 100%;
  height: 20px;
  background: #222;
  border: 1px solid #444;
  border-radius: 10px;
  overflow: hidden;
  margin-top: 20px;
}

.progress-bar-fill {
  height: 100%;
  background: #0ef;
  transition: width 0.1s linear;
}

.progress-label {
  margin-top: 8px;
  font-size: 14px;
  color: #888;
}

.dial {
  position: relative;
  height: 300px;
  width: 60px;
  margin-top: 50px;
  background: #1a1a1a;
  border: 2px solid #333;
  border-radius: 30px;
}

.slider {
  appearance: none;
  position: absolute;
  width: 300px;
  height: 60px;
  background: transparent;
  outline: none;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-90deg);
  margin: 0;
  cursor: pointer;
  z-index: 5;
}

.target-track {
  position: absolute;
  inset: 20px 0;
  pointer-events: none;
  z-index: 2;
  overflow: hidden;
}

.target-zone {
  position: absolute;
  left: 0;
  width: 100%;
  background: rgba(255, 255, 0, 0.3);
  border-top: 2px solid #ff0;
  border-bottom: 2px solid #ff0;
  transform: translateY(50%);
  transition: bottom 0.1s linear;
}

.slider::-webkit-slider-thumb {
  appearance: none;
  width: 40px;
  height: 40px;
  background: #eee;
  border: 4px solid #333;
  border-radius: 50%;
  cursor: grab;
  box-shadow: 0 2px 5px rgba(0,0,0,0.5);
}
</style>