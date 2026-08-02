<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import type { Photon } from '@/game/types'
import './intro-levels.css'
import styles from '@/pages/Home.module.css'

const emits = defineEmits<{
  (e: 'complete'): void
}>()

const showWelcome = ref(true)
const finished = ref(false)
const stage = ref<'doppler' | 'sideband' | 'done'>('doppler')

// Dials for both Doppler and Sideband cooling
// same shape used for both dials, sideband is harder
function makeDial(zoneWidth: number, wobbleSpeed: number, wobbleAmp: number, fillMs: number) {
  return reactive({
    value: 0,
    targetCenter: 50,
    zoneWidth,
    wobbleSpeed,
    wobbleAmp,
    fillMs,
    progress: 0,
    locked: false,
  })
}

export type Dial = ReturnType<typeof makeDial>

const dopplerDial = makeDial(30, 1500, 30, 8000)
const sidebandDial = makeDial(20, 1100, 24, 8000) // narrower zone + faster wobble, slightly harder

const sidebandVisible = computed(() => stage.value !== 'doppler')

const ionShake = reactive({ x: 0, y: 0 })
const laserLocked = ref(false)

const photons = ref<Photon[]>([])
let nextPhotonId = 0

let rafId: number | null = null
let lastTime = performance.now()

// vibration goes 1 to 0.3 during doppler, then 0.3 to 0 during sideband
const vibration = computed(() => {
  if (stage.value === 'doppler') return 1 - (dopplerDial.progress / 100) * 0.7
  if (stage.value === 'sideband') return 0.3 - (sidebandDial.progress / 100) * 0.3
  return 0
})

function updateDial(dial: Dial, dt: number, time: number, onDone: () => void) {
  dial.targetCenter = 50 + Math.sin(time / dial.wobbleSpeed) * dial.wobbleAmp + Math.cos(time / 380) * 4
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
    dial.progress = Math.max(0, dial.progress - (dt / 2000) * 100)
  }

  return inZone
}

function tick(time: number) {
  const dt = time - lastTime
  lastTime = time

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

    if (inZone && Math.random() < 0.25) {
      photons.value.push({
        id: nextPhotonId++,
        x: 85, // Centered on the ion (right: 15%)
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
  photons.value = photons.value.filter(p => p.opacity > 0)

  // ion jitters based on current vibration amount
  const amp = vibration.value
  ionShake.x = (Math.random() - 0.5) * 14 * amp
  ionShake.y = (Math.random() - 0.5) * 14 * amp

  // NOTE - may need to move this shake logic to a canvas render loop if it causes performance issues

  rafId = requestAnimationFrame(tick)
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
      <div :class="styles.popupModal" style="border-color: var(--color-success); box-shadow: 0 0 20px rgba(0, 255, 0, 0.2);">
        <div :class="styles.popupTitle" style="color: var(--color-success);">Ion Stabilised</div>
        <div :class="styles.popupText">Sideband cooling allows for the ion to remain stable for longer (a longer coherence time). The ion is now ready for further manipulation to store information.</div>
        <button :class="styles.nextBtn" @click="proceed" style="align-self: flex-end;">Continue</button>
      </div>
    </div>
  </div>
</template>