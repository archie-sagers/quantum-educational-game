<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import type { Photon } from '@/game/types'
import './intro-levels.css'
import styles from '@/pages/Home.module.css'

const emits = defineEmits<{
  (e: 'complete'): void
}>()

// UI & Progression State
// ------------------
const showWelcome = ref(true)
const finished = ref(false)
const stage = ref<'doppler' | 'sideband' | 'done'>('doppler')

// Function to create a dial state
// Both cooling phases share this data structure but use different difficulty parameters
function makeDial(zoneWidth: number, wobbleSpeed: number, wobbleAmp: number, fillMs: number) {
  return reactive({
    value: 0,
    targetCenter: 50,
    zoneWidth, // Width of the target zone (percentage)
    wobbleSpeed, // How fast the target oscillates (lower is faster)
    wobbleAmp, // Amplitude of the primary oscillation
    fillMs, // How many milliseconds it takes to reach 100% progress
    progress: 0,
    locked: false,
  })
}

export type Dial = ReturnType<typeof makeDial>

// Sideband is harder
const dopplerDial = makeDial(30, 1500, 30, 8000)
const sidebandDial = makeDial(20, 1100, 24, 8000) 

const sidebandVisible = computed(() => stage.value !== 'doppler')

// Simulation & Game Loop State
// ------------------
const ionShake = reactive({ x: 0, y: 0 })
const laserLocked = ref(false)

const photons = ref<Photon[]>([])
let nextPhotonId = 0

let rafId: number | null = null
let lastTime = performance.now()

// Calculates the vibration amplitude based on cooling stage
const vibration = computed(() => {
  // doppler cooling reduces vibration from 1.0 to 0.3
  if (stage.value === 'doppler') return 1 - (dopplerDial.progress / 100) * 0.7
  // sideband cooling reduces vibration from 0.3 to 0.0
  if (stage.value === 'sideband') return 0.3 - (sidebandDial.progress / 100) * 0.3
  return 0
})

// Updates a dial's target position and calculates user progress
function updateDial(dial: Dial, dt: number, time: number, onDone: () => void) {
  dial.targetCenter = 50 + Math.sin(time / dial.wobbleSpeed) * dial.wobbleAmp + Math.cos(time / 380) * 4
  
  // Calculate bounds to see if the user's slider value overlaps target zone
  const min = Math.max(0, dial.targetCenter - dial.zoneWidth / 2)
  const max = Math.min(100, dial.targetCenter + dial.zoneWidth / 2)
  const inZone = dial.value >= min && dial.value <= max

  if (inZone) {
    dial.progress = Math.min(100, dial.progress + (dt / dial.fillMs) * 100)
    if (dial.progress >= 100) {
      dial.locked = true
      onDone()
    }
  } else if (dial.progress > 0) {
    // Slowly drain progress when outside the zone
    dial.progress = Math.max(0, dial.progress - (dt / 2000) * 100)
  }

  return inZone // Return whether the user is currently in the target zone
}

// Main render/game loop
// ------------------
function tick(time: number) {
  const dt = time - lastTime
  lastTime = time

  // Run game logic if overlays are closed
  if (!showWelcome.value && !finished.value) {
    let inZone = false

    if (stage.value === 'doppler') {
      inZone = updateDial(dopplerDial, dt, time, () => { stage.value = 'sideband' })
    } else if (stage.value === 'sideband') {
      inZone = updateDial(sidebandDial, dt, time, () => {
        stage.value = 'done'
        finished.value = true
      })
    }

    laserLocked.value = inZone

    // If dial in zone, emit visual photon particles
    if (inZone && Math.random() < 0.25) {
      photons.value.push({
        id: nextPhotonId++,
        x: 85, // Centered on the ion in the UI (right: 15%)
        y: 50,
        vx: (Math.random() - 0.5) * 90,
        vy: (Math.random() - 0.5) * 90,
        opacity: 0.9,
      })
    }
  }

  for (const p of photons.value) {
    p.x += (p.vx * dt) / 1000
    p.y += (p.vy * dt) / 1000
    p.opacity -= dt / 600
  }
  
  // Remove invisible photons
  photons.value = photons.value.filter(p => p.opacity > 0)

  // Apply random jitter to the ion based on vibration levels
  const amp = vibration.value
  ionShake.x = (Math.random() - 0.5) * 14 * amp
  ionShake.y = (Math.random() - 0.5) * 14 * amp
  // NOTE - may need to move this shake logic to a canvas render loop if it causes performance issues

  rafId = requestAnimationFrame(tick)
}

function proceed() {
  emits('complete')
}

// Start the game loop when mounted
onMounted(() => {
  lastTime = performance.now()
  rafId = requestAnimationFrame(tick)
})

// Clean up loop to prevent running in the background
onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<template>
  <div class="container">
    <div class="viewport grid-bg">

      <div class="laser-emitter" :class="{ locked: laserLocked }">
        LASER
      </div>

      <div class="beam" :class="{ locked: laserLocked }" />

      <div
        class="ion"
        :class="{ stable: stage === 'done' }"
        :style="{ transform: `translate(calc(-50% + ${ionShake.x}px), calc(-50% + ${ionShake.y}px))` }"
      >
        <div class="ion-label">Yb+</div>
      </div>

      <div
        v-for="p in photons"
        :key="p.id"
        class="photon"
        :style="{ left: p.x + '%', top: p.y + '%', opacity: p.opacity }"
      />
    </div>

    <div class="sidebar">
      <h3>Laser Cooling</h3>

      <div class="dials">
        <div class="dial-group">
          <div class="dial-label">Doppler Cooling</div>
          <div class="dial">
            <div class="target-track">
              <div
                class="target-zone"
                :style="{ bottom: dopplerDial.targetCenter + '%', height: dopplerDial.zoneWidth + '%' }"
              />
            </div>
            <input
              type="range"
              v-model.number="dopplerDial.value"
              min="0"
              max="100"
              class="slider"
              :disabled="dopplerDial.locked"
            />
          </div>
          <div class="dial-readout">
            {{ dopplerDial.locked ? '✓ stable' : Math.floor(dopplerDial.progress) + '%' }}
          </div>
        </div>

        <div v-if="sidebandVisible" class="dial-group">
          <div class="dial-label">Sideband Cooling</div>
          <div class="dial">
            <div class="target-track">
              <div
                class="target-zone"
                :style="{ bottom: sidebandDial.targetCenter + '%', height: sidebandDial.zoneWidth + '%' }"
              />
            </div>
            <input
              type="range"
              v-model.number="sidebandDial.value"
              min="0"
              max="100"
              class="slider"
              :disabled="sidebandDial.locked"
            />
          </div>
          <div class="dial-readout">
            {{ sidebandDial.locked ? '✓ stable' : Math.floor(sidebandDial.progress) + '%' }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="showWelcome" :class="styles.welcomeOverlay">
      <div :class="styles.welcomeModal">
        <div :class="styles.welcomeTitle">Initiate Cooling</div>
        <div :class="styles.welcomeText">Cool the Yb+ ion using Doppler Cooling and then Sideband Cooling. Drag the slider to keep the circle inside the purple zone.</div>
        <button :class="styles.welcomeBtn" @click="showWelcome = false">Begin</button>
      </div>
    </div>

    <div v-if="finished" :class="styles.popupOverlay">
      <div :class="styles.popupModal" style="border-color: var(--color-success); box-shadow: var(--shadow-glow-success);">
        <div :class="styles.popupTitle" style="color: var(--color-success);">Ion Stabilised</div>
        <div :class="styles.popupText">Sideband cooling allows for the ion to remain stable for longer (a longer coherence time). The ion is now ready for further manipulation to store information.</div>
        <button :class="styles.nextBtn" @click="proceed" style="align-self: flex-end;">Continue</button>
      </div>
    </div>
  </div>
</template>