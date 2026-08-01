<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import './intro-levels.css'
import styles from '@/pages/Home.module.css'

const emit = defineEmits<{
  (e: 'complete'): void
}>()

const showWelcome = ref(true)
const score = ref(0)
const isComplete = ref(false)
const gunAngleRad = ref(-Math.PI / 2)
const viewportRef = ref<HTMLElement | null>(null)
const targetAtom = ref<{ x: number; y: number } | null>(null)
const atoms = ref<Array<{ id: number; x: number; y: number; speed: number; isIonized: boolean }>>([])
const pulses = ref<Array<{ id: number; x: number; y: number; vx: number; vy: number; angle: number }>>([])
const electrons = ref<Array<{ id: number; x: number; y: number; vx: number; vy: number; opacity: number }>>([])

let rafId: number | null = null
let lastTime = performance.now()
let nextId = 0

const TARGET_SCORE = 15
const ATOM_SPAWN_RATE = 0.0005
// TODO: add difficulty scaling as score increases
const PULSE_SPEED = 60
const HIT_RADIUS = 6
const GUN_LENGTH_PX = 60
const GUN_PIVOT_OFFSET_BOTTOM_PX = 10

// Gun tracking
function updateAim(e: MouseEvent) {
  if (isComplete.value || !viewportRef.value) return

  const rect = viewportRef.value.getBoundingClientRect()
  const gunX = rect.left + rect.width / 2
  const gunY = rect.bottom - GUN_PIVOT_OFFSET_BOTTOM_PX

  const dx = e.clientX - gunX
  const dy = e.clientY - gunY

  let angle = Math.atan2(dy, dx)
  if (angle > 0) angle = angle > Math.PI / 2 ? Math.PI : 0

  gunAngleRad.value = angle
}

function fire() {
  if (isComplete.value || !viewportRef.value) return

  const rect = viewportRef.value.getBoundingClientRect()

  const pivotYPercent = 100 - (GUN_PIVOT_OFFSET_BOTTOM_PX / rect.height) * 100
  const tipXPercent = 50 + (Math.cos(gunAngleRad.value) * GUN_LENGTH_PX / rect.width) * 100
  const tipYPercent = pivotYPercent + (Math.sin(gunAngleRad.value) * GUN_LENGTH_PX / rect.height) * 100

  pulses.value.push({
    id: nextId++,
    x: tipXPercent,
    y: tipYPercent,
    vx: Math.cos(gunAngleRad.value) * PULSE_SPEED,
    vy: Math.sin(gunAngleRad.value) * PULSE_SPEED,
    angle: gunAngleRad.value
  })
}

function tick(time: number) {
  if (showWelcome.value || isComplete.value) {
    lastTime = time
    rafId = requestAnimationFrame(tick)
    return
  }

  const dt = time - lastTime
  lastTime = time

  // Spawn Atoms
  if (Math.random() < ATOM_SPAWN_RATE * dt) {
    atoms.value.push({
      id: nextId++,
      x: -10,
      y: 20 + Math.random() * 60,
      speed: 10 + Math.random() * 15,
      isIonized: false
    })
  }

  // Move Atoms
  for (const atom of atoms.value) {
    atom.x += (atom.speed * dt) / 1000
  }
  atoms.value = atoms.value.filter(a => a.x < 110)

  // Electrons
  for (const electron of electrons.value) {
    electron.x += (electron.vx * dt) / 1000
    electron.y += (electron.vy * dt) / 1000
    electron.opacity -= dt / 1000
  }
  electrons.value = electrons.value.filter(e => e.opacity > 0)

  // Move Pulses, check collisions
  for (let i = pulses.value.length - 1; i >= 0; i--) {
    const pulse = pulses.value[i]!
    pulse.x += (pulse.vx * dt) / 1000
    pulse.y += (pulse.vy * dt) / 1000

    let pulseHit = false

    for (const atom of atoms.value) {
      if (atom.isIonized) continue

      const dx = atom.x - pulse.x
      const dy = atom.y - pulse.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < HIT_RADIUS) {
        atom.isIonized = true
        pulseHit = true
        score.value++

        electrons.value.push({
          id: nextId++,
          x: atom.x,
          y: atom.y,
          vx: (Math.random() - 0.5) * 40,
          vy: -20 - Math.random() * 30,
          opacity: 1
        })

        if (score.value >= TARGET_SCORE) {
          triggerWin(atom)
        }
        break
      }
    }

    if (pulseHit || pulse.y < -10 || pulse.x < -10 || pulse.x > 110) {
      pulses.value.splice(i, 1)
    }
  }

  rafId = requestAnimationFrame(tick)
}

function triggerWin(finalAtom: { x: number; y: number }) {
  isComplete.value = true
  targetAtom.value = { x: finalAtom.x, y: finalAtom.y }

  if (rafId) cancelAnimationFrame(rafId)

  setTimeout(() => emit('complete'), 2500)
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
  <div class="container" @mousemove="updateAim" @click="fire">

    <div
      class="viewport"
      ref="viewportRef"
      :class="{ 'zoom-in': isComplete }"
      :style="targetAtom ? { '--zoom-x': targetAtom.x + '%', '--zoom-y': targetAtom.y + '%' } : {}"
    >

      <div
        v-for="atom in atoms"
        :key="atom.id"
        class="atom"
        :class="{ 'ionized': atom.isIonized }"
        :style="{ left: atom.x + '%', top: atom.y + '%' }"
      >
        {{ atom.isIonized ? 'Yb+' : 'Yb' }}
      </div>

      <div
        v-for="pulse in pulses"
        :key="pulse.id"
        class="pulse"
        :style="{
          left: pulse.x + '%',
          top: pulse.y + '%',
          transform: `translate(-50%, -50%) rotate(${pulse.angle}rad)`
        }"
      />

      <div
        v-for="electron in electrons"
        :key="electron.id"
        class="electron"
        :style="{
          left: electron.x + '%',
          top: electron.y + '%',
          opacity: electron.opacity
        }"
      >
        e⁻
      </div>

      <div
        class="gun"
        :style="{ transform: `rotate(${gunAngleRad}rad)` }"
      />

    </div>

    <div class="sidebar">
      <h3>Ionisation</h3>

      <div class="score-display">
        Ytterbium atoms ionised
        <div class="score-numbers">
          <span :class="{ 'complete-text': score >= TARGET_SCORE }">{{ score }}</span>
          / {{ TARGET_SCORE }}
        </div>
      </div>

      <div class="instructions">
        <p>Target un-ionised Yb atoms.</p>
        <p><strong>Click</strong> to fire high energy electrons.</p>
      </div>
    </div>

    <!-- Welcome Modal -->
    <div v-if="showWelcome" :class="styles.welcomeOverlay" style="z-index: 9999;">
      <div :class="styles.welcomeModal">
        <div :class="styles.welcomeTitle">Ionisation Stage</div>
        <div :class="styles.welcomeText">Point and click to fire electrons at the Yb atoms and Ionise them.</div>
        <button :class="styles.welcomeBtn" @click="showWelcome = false">Begin</button>
      </div>
    </div>

  </div>
</template>

<style scoped>
.container {
  cursor: crosshair;
}

.viewport {
  overflow: hidden;
  --zoom-x: 50%;
  --zoom-y: 50%;
  transform-origin: var(--zoom-x) var(--zoom-y);
  transition: transform 2.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.zoom-in {
  transform: scale(8);
}

.atom {
  position: absolute;
  width: 60px;
  height: 60px;
  background: radial-gradient(circle at 30% 30%, var(--color-border), var(--color-bg-dark));
  border: 2px solid var(--color-border);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  font-size: 18px;
  color: var(--color-text-dim);
  transform: translate(-50%, -50%);
  transition: all 0.2s ease-out;
  box-shadow: 0 0 10px rgba(0,0,0,0.8);
}

.atom.ionized {
  background: radial-gradient(circle at 30% 30%, var(--color-secondary), var(--color-secondary));
  border-color: var(--color-secondary);
  color: var(--color-text);
  box-shadow: 0 0 20px rgba(162, 0, 255, 0.6);
}

.pulse {
  position: absolute;
  width: 24px;
  height: 6px;
  background: var(--color-primary);
  border-radius: 4px;
  box-shadow: 0 0 15px var(--color-primary-light);
}

.electron {
  position: absolute;
  width: 20px;
  height: 20px;
  background: var(--color-danger);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
  font-weight: bold;
  color: white;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 10px var(--color-danger-light);
}

.gun {
  position: absolute;
  bottom: 10px;
  left: 50%;
  width: 70px;
  height: 16px;
  background: var(--color-primary);
  border-radius: 4px;
  transform-origin: left center;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.4);
  margin-bottom: -6px;
}

</style>
