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

const dopplerDial = makeDial(20, 1500, 30, 8000)
const sidebandDial = makeDial(14, 1100, 24, 8000) // narrower zone + faster wobble, slightly harder

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

  // NOTE - I may need to move this shake logic to a canvas render loop if it causes performance issues

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
        <div :class="styles.welcomeText">We need to prepare the ion using doppler cooling.</div>
        <button :class="styles.welcomeBtn" @click="showWelcome = false">Begin</button>
      </div>
    </div>

    <div v-if="finished" :class="styles.popupOverlay">
      <div :class="styles.popupModal" style="border-color: var(--color-success); box-shadow: 0 0 20px rgba(0, 255, 0, 0.2);">
        <div :class="styles.popupTitle" style="color: var(--color-success);">Ion Stabilized</div>
        <div :class="styles.popupText">Sideband cooling allows for longer coherence times so the ion can be manipulated to store information for longer. The ion is now ready for further manipulation to store information.</div>
        <button :class="styles.nextBtn" @click="proceed" style="align-self: flex-end;">Continue</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid-bg {
  background-image:
    linear-gradient(rgba(0, 238, 255, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 238, 255, 0.06) 1px, transparent 1px);
  background-size: 40px 40px;
}

.laser-emitter {
  position: absolute;
  left: 8%;
  top: 50%;
  transform: translateY(-50%);
  width: 50px;
  height: 50px;
  background: var(--color-danger);
  color: #000;
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: bold;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 5;
  transition: background 0.3s;
}

.laser-emitter.locked {
  background: var(--color-primary);
}

.beam {
  position: absolute;
  left: calc(8% + 32px);
  right: 15%;
  top: 50%;
  height: 2px;
  transform: translateY(-50%);
  background: var(--color-danger);
  box-shadow: 0 0 8px var(--color-danger);
  opacity: 0.7;
  transition: background 0.3s, box-shadow 0.3s;
  z-index: 3;
}

.beam.locked {
  background: var(--color-primary);
  box-shadow: 0 0 8px var(--color-primary);
  opacity: 1;
}

.ion {
  position: absolute;
  right: 15%;
  top: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
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
  transition: all 1.5s ease-in-out;
}

.ion.stable .ion-label {
  background: radial-gradient(circle at 30% 30%, var(--color-primary), var(--color-bg));
  border-color: var(--color-primary-light);
  box-shadow: 0 0 20px var(--color-primary);
}

.photon {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-primary-light);
  box-shadow: 0 0 6px var(--color-primary);
  pointer-events: none;
  z-index: 4;
}

.sidebar h3 {
  margin-bottom: 30px;
}

.dials {
  display: flex;
  gap: 24px;
  margin-top: 20px;
}

.dial-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.dial-label {
  font-size: 12px;
  color: var(--color-text-dim);
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.dial {
  position: relative;
  height: 240px;
  width: 60px;
  background: var(--color-bg-light);
  border: 2px solid var(--color-border);
  border-radius: 30px;
}

.dial-readout {
  font-size: 13px;
  color: var(--color-text-dim);
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
  background: var(--color-secondary-light);
  border-top: 2px solid var(--color-secondary);
  border-bottom: 2px solid var(--color-secondary);
  transform: translateY(50%);
  transition: bottom 0.1s linear;
}

.slider {
  appearance: none;
  position: absolute;
  width: 240px;
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

.slider:disabled {
  cursor: not-allowed;
}

.slider::-webkit-slider-thumb {
  appearance: none;
  width: 36px;
  height: 36px;
  background: var(--color-text);
  border: 4px solid var(--color-border);
  border-radius: 50%;
  cursor: grab;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
}
</style>
