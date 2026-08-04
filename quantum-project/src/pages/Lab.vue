<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue'
defineOptions({ name: 'LabPage' })
import styles from './Home.module.css'
import GameBoard from '@/components/GameBoard.vue'
import { Level, measureAll, checkWinCondition, calculateQuantumState } from '@/game/quantumgame'
import { type IonQuantumState, type WallType } from '@/game/types'
import MobileWarning from '@/components/mobile/MobileWarning.vue'
import MeasurementSidebar from '@/components/ui/MeasurementSidebar.vue'
import LaserGatesModal from '@/components/ui/LaserGatesModal.vue'
import { useGateInventory } from '@/components/gamelogic/usegateinventory'

// Level config interface
interface LevelConfigLocal {
  name: string
  cols: number
  rows: number
  sources: Array<{ col: number; row: number; dir?: string }>
  ions: Array<{ col: number; row: number }>
  walls?: Array<{ col: number; row: number; type?: WallType }>
  mirrors?: Array<{ col: number; row: number; dir: 'fwd' | 'back' }>
  availableGates?: string[]
  prePlacedGates?: string[][]
  lockedGateIndices?: number[]
  gateInventory?: Record<string, number>
  lockedTo?: Record<string, string>
  hint?: string
  goal?: string
  winCondition?: string
}

const showWelcome = ref(true)

const defaultConfig = (): LevelConfigLocal => ({
  name: 'Custom Level',
  cols: 10,
  rows: 8,
  sources: [],
  ions: [],
  walls: [],
  mirrors: [],
  availableGates: ['X', 'H', 'CNOT'],
  prePlacedGates: [],
  lockedGateIndices: [],
  gateInventory: { 'X': 10, 'H': 10, 'CNOT': 10 },
  lockedTo: { 'X': '', 'H': '', 'CNOT': '' },
  hint: 'Design your custom level',
  goal: 'Test',
  winCondition: 'any',
})

// Checks if a value is a plain object (not null or an array)
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// normalises an uploaded level (to prevent errors)
function normaliseLoadedLevel(data: Partial<LevelConfigLocal>): LevelConfigLocal {
  const fallback = defaultConfig()

  return {
    ...fallback,
    ...data,
    name: typeof data.name === 'string' ? data.name : fallback.name,
    hint: typeof data.hint === 'string' ? data.hint : fallback.hint,
    goal: typeof data.goal === 'string' ? data.goal : fallback.goal,
    winCondition: typeof data.winCondition === 'string' ? data.winCondition : fallback.winCondition,
    cols: typeof data.cols === 'number' ? data.cols : fallback.cols,
    rows: typeof data.rows === 'number' ? data.rows : fallback.rows,
    sources: Array.isArray(data.sources) ? data.sources : fallback.sources,
    ions: Array.isArray(data.ions) ? data.ions : fallback.ions,
    walls: Array.isArray(data.walls) ? data.walls : fallback.walls,
    mirrors: Array.isArray(data.mirrors) ? data.mirrors : fallback.mirrors,
    availableGates: Array.isArray(data.availableGates) ? data.availableGates : fallback.availableGates,
    prePlacedGates: Array.isArray(data.prePlacedGates) ? data.prePlacedGates : fallback.prePlacedGates,
    lockedGateIndices: Array.isArray(data.lockedGateIndices) ? data.lockedGateIndices : fallback.lockedGateIndices,
    gateInventory: isRecord(data.gateInventory) ? data.gateInventory : fallback.gateInventory,
    lockedTo: isRecord(data.lockedTo) ? data.lockedTo : fallback.lockedTo,
  }
}

const statusMessage = ref('')
const statusTone = ref<'neutral' | 'success' | 'error'>('neutral')

function setStatus(message: string, tone: 'neutral' | 'success' | 'error' = 'error') {
  statusMessage.value = message
  statusTone.value = tone
}

function clearStatus() {
  statusMessage.value = ''
  statusTone.value = 'neutral'
}

// User made level
const editorLevel = computed(() => {
  const lvl = new Level({
    name: levelConfig.name,
    cols: levelConfig.cols,
    rows: levelConfig.rows,
    sources: levelConfig.sources.map(s => ({ col: s.col, row: s.row, dir: s.dir ?? 'right' })),
    ions: levelConfig.ions.map(i => ({ col: i.col, row: i.row })),
    walls: (levelConfig.walls || []).map(w => ({ col: w.col, row: w.row, type: (w.type ?? 'standard') as WallType })),
    availableGates: levelConfig.availableGates || [],
    prePlacedGates: levelConfig.prePlacedGates || [],
    lockedGateIndices: levelConfig.lockedGateIndices || [],
    gateInventory: levelConfig.gateInventory || {},
    winCondition: levelConfig.winCondition,
    hint: levelConfig.hint,
    goal: levelConfig.goal,
  });

  levelConfig.mirrors?.forEach(m => {
    const row = lvl.grid[m.row];
    if (row) {
      row[m.col] = m.dir;
    }
  });

  return lvl;
});

// Mode: edit or play
const mode = ref<'edit' | 'play'>('edit')
const levelConfig = reactive<LevelConfigLocal>(defaultConfig())
const gateOptions = ['X', 'H', 'CNOT']

// Win Condition
watch(() => levelConfig.ions.length, (newLen) => {
  let wc = levelConfig.winCondition || 'any';
  let conditions: string[] = [];

  if (wc === 'any') {
    conditions = [];
  } else if (wc.includes(',')) {
    conditions = wc.split(',');
  } else if (/^[01]+$/.test(wc)) {
    conditions = wc.split('');
  } else {
    conditions = Array(newLen).fill('any');
  }

  if (conditions.length > newLen) {
    conditions = conditions.slice(0, newLen);
  } else {
    while (conditions.length < newLen) {
      conditions.push('any');
    }
  }
  levelConfig.winCondition = conditions.length ? conditions.join(',') : 'any';
}, { immediate: true });

function getIonWinCondition(index: number): string {
  const wc = levelConfig.winCondition || 'any';
  if (wc === 'any') return 'any';
  const parts = wc.split(',');
  return parts[index] || 'any';
}

function setIonWinCondition(index: number, value: string) {
  let wc = levelConfig.winCondition || 'any';
  let parts = wc === 'any' ? Array(levelConfig.ions.length).fill('any') : wc.split(',');
  
  parts[index] = value;
  levelConfig.winCondition = parts.join(',');
}

function handleWinConditionChange(index: number, event: Event) {
  const val = (event.target as HTMLSelectElement).value;
  setIonWinCondition(index, val);
}

// Play Mode
// -----------------------------------------
const gameBoardRef = ref<InstanceType<typeof GameBoard> | null>(null)
const playLevel = ref<Level | null>(null)
const ionStates = ref<IonQuantumState[]>([])
const canMeasure = ref(false)
const isMeasured = ref(false)
const measuredValues = ref<number[] | null>(null)
const result = ref('—')
const history = ref<number[][]>([])
const showWin = ref(false)
const showLaserGates = ref(false)
const blochPanelRef = ref<HTMLElement | null>(null)
const measureBtnRef = ref<HTMLElement | null>(null)
const resetBtnRef = ref<HTMLElement | null>(null)
const historyRef = ref<HTMLElement | null>(null)

const gateInv = useGateInventory()
const {
  sourceGates: playSourceGates,
  gateInventory: playGateInventory,
  activeSourceIndex,
  activeGates,
} = gateInv

const resultcolourClass = computed(() => {
  if (result.value === '1') return styles.infoValOrange;
  return styles.infoValCyan;
})

function updatePlayState() {
  if (!playLevel.value) return
  const stateResult = calculateQuantumState(playLevel.value, playSourceGates.value, isMeasured.value ? measuredValues.value : null)
  ionStates.value = stateResult.states
  canMeasure.value = stateResult.canMeasure
}

function handleMeasure() {
  if (!canMeasure.value || !playLevel.value) return
  canMeasure.value = false

  gameBoardRef.value?.resetPhoton()

  const maxGates = Math.max(1, ...playSourceGates.value.map(g => g ? g.length : 0))
  const dynamicDelayMs = 800 * (1 + (maxGates - 1) * 0.1)

  setTimeout(() => {
    if (isMeasured.value) {
      result.value = measuredValues.value ? measuredValues.value.join(',') : '—'
      history.value.push(measuredValues.value!)
      if (history.value.length > 20) history.value.shift()
      canMeasure.value = true
      return
    }

    // Check win condition before collapsing the states
    const uncollapsedStates = ionStates.value || [];
    const wc = playLevel.value?.winCondition || 'any';
    const hasWon = checkWinCondition(wc, uncollapsedStates);

    const measResults = measureAll()
    measuredValues.value = measResults
    isMeasured.value = true
    updatePlayState()

    result.value = measResults.join(',')
    history.value.push(measResults)
    if (history.value.length > 20) history.value.shift()

    canMeasure.value = true

    if (hasWon) {
      showWin.value = true
    }
  }, dynamicDelayMs) // TRAVEL_MS
}

function handleReset() {
  isMeasured.value = false
  measuredValues.value = null
  result.value = '—'
  showWin.value = false
  updatePlayState()
}

// Laser Gate Handlers
function handleGameBoardClick(col: number, row: number) {
  if (mode.value !== 'play' || !playLevel.value) return;
  const clickedSourceIdx = gateInv.findSourceIndexAt(playLevel.value, col, row);

  if (clickedSourceIdx !== -1 && playLevel.value.availableGates.length > 0) {
    activeSourceIndex.value = clickedSourceIdx;
    showLaserGates.value = true;
  }
}

function onGateDragStart(e: DragEvent, gateType: string) {
  gateInv.onGateDragStart(e, gateType)
}

function onLaserDragOver(e: DragEvent) {
  gateInv.onLaserDragOver(e)
}

function onLaserDrop(e: DragEvent) {
  if (!playLevel.value) return
  const changed = gateInv.onLaserDrop(e, playLevel.value)
  if (changed) {
    isMeasured.value = false
    measuredValues.value = null
    updatePlayState()
  }
}

function removeLaserGate(index: number) {
  if (!playLevel.value) return
  const changed = gateInv.removeLaserGate(playLevel.value, index)
  if (changed) {
    isMeasured.value = false
    measuredValues.value = null
    updatePlayState()
  }
}

function isGateLocked(localIndex: number) {
  if (!playLevel.value) return false
  return gateInv.isGateLocked(playLevel.value, localIndex)
}

// Edit Mode
// -------------------------------------------
const paletteItems = [
  { type: 'source', label: 'Laser Source', icon: '■', color: 'var(--color-primary)' },
  { type: 'ion', label: 'Ion', icon: '●', color: 'var(--color-danger)' },
  { type: 'mirror', label: 'Fixed Mirror', icon: '⤡', color: '#888' },
  { type: 'wall-standard', label: 'Wall (Blocks All)', icon: '✕', color: 'var(--color-danger)' },
  { type: 'wall-cyan', label: 'Wall (Cyan)', icon: '✕', color: 'var(--color-primary)' },
  { type: 'wall-purple', label: 'Wall (Purple)', icon: '✕', color: 'var(--color-secondary)' },
  { type: 'wall-green', label: 'Wall (Green)', icon: '✕', color: 'var(--color-success)' },
  { type: 'wall-orange', label: 'Wall (Orange)', icon: '✕', color: 'var(--color-danger)' },
]

function onPaletteItemDragStart(e: DragEvent, item: typeof paletteItems[0]) {
  e.dataTransfer!.effectAllowed = 'copy'
  e.dataTransfer!.setData('itemType', item.type)
}

function handleItemDrop(col: number, row: number, itemType: string) {
  if (itemType === 'DELETE') {
    levelConfig.sources = levelConfig.sources.filter(s => !(s.col === col && s.row === row))
    levelConfig.ions = levelConfig.ions.filter(i => !(i.col === col && i.row === row))
    levelConfig.walls = levelConfig.walls?.filter(w => !(w.col === col && w.row === row))
    levelConfig.mirrors = levelConfig.mirrors?.filter(m => !(m.col === col && m.row === row))
    return
  }
  if (itemType === 'source') {
    if (levelConfig.sources.some(s => s.col === col && s.row === row)) return
    levelConfig.sources.push({ col, row, dir: 'right' })
  } else if (itemType === 'ion') {
    if (levelConfig.ions.length >= 6) {
      setStatus('Limit reached: Maximum 6 ions allowed', 'error')
      return
    }
    if (levelConfig.ions.some(i => i.col === col && i.row === row)) return
    levelConfig.ions.push({ col, row })
  } else if (itemType === 'mirror') {
    levelConfig.mirrors = levelConfig.mirrors || []
    if (!levelConfig.mirrors.some(m => m.col === col && m.row === row)) {
      levelConfig.mirrors.push({ col, row, dir: 'fwd' })
    }
  } else if (itemType.startsWith('wall-')) {
    if (levelConfig.walls?.some(w => w.col === col && w.row === row)) return
    const wallType = (itemType.split('-')[1] || 'standard') as WallType
    levelConfig.walls = levelConfig.walls || []
    levelConfig.walls.push({ col, row, type: wallType })
  }
}

// Directions for laser sources
const DIRS = ['right', 'down', 'left', 'up']

function handleEditCanvasClick(col: number, row: number) {
  const source = levelConfig.sources.find(s => s.col === col && s.row === row)

  if (source) {
    const currentDir = source.dir || 'right'
    const nextIdx = (DIRS.indexOf(currentDir) + 1) % DIRS.length
    source.dir = DIRS[nextIdx]
    return;
  }

  const mirror = levelConfig.mirrors?.find(m => m.col === col && m.row === row)
  if (mirror) {
    mirror.dir = mirror.dir === 'fwd' ? 'back' : 'fwd'
  }
}

function testLevel() {
  if (levelConfig.sources.length === 0) {
    setStatus('Add at least one laser source to test', 'error')
    return
  }
  try {
    const cfg: LevelConfigLocal = {
      name: levelConfig.name,
      cols: levelConfig.cols,
      rows: levelConfig.rows,
      sources: levelConfig.sources.map(s => ({ col: s.col, row: s.row, dir: s.dir ?? 'right' })),
      ions: levelConfig.ions.map(i => ({ col: i.col, row: i.row })),
      walls: (levelConfig.walls || []).map(w => ({ col: w.col, row: w.row, type: w.type ?? 'standard' })),
      availableGates: levelConfig.availableGates || [],
      prePlacedGates: levelConfig.prePlacedGates || [],
      lockedGateIndices: levelConfig.lockedGateIndices || [],
      gateInventory: levelConfig.gateInventory || {},
      winCondition: levelConfig.winCondition,
      hint: levelConfig.hint,
      goal: levelConfig.goal,
    }
    
    playLevel.value = new Level(cfg)
    levelConfig.mirrors?.forEach(m => {
      const row = playLevel.value!.grid[m.row];
      if (row) {
        row[m.col] = m.dir;
      }
    })

    // Lock preplaced mirrors in place for the play level
    const originalIsFixed = playLevel.value.isFixed.bind(playLevel.value)
    playLevel.value.isFixed = (c: number, r: number) => {
      if (levelConfig.mirrors?.some(m => m.col === c && m.row === r)) return true;
      return originalIsFixed(c, r);
    }

    gateInv.setSourceGatesFromLevel(playLevel.value)
    gateInv.resetGateInventory(levelConfig.gateInventory || {}, cfg.lockedGateIndices ?? [], true)

    // Reset Play state
    isMeasured.value = false
    measuredValues.value = null
    result.value = '—'
    history.value = []
    showWin.value = false
    clearStatus()
    updatePlayState()
    mode.value = 'play'
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Failed to start test level', 'error')
  }
}

function backToEdit() {
  mode.value = 'edit'
  playLevel.value = null
}

function toggleGate(g: string) {
  levelConfig.availableGates = levelConfig.availableGates || []
  levelConfig.gateInventory = levelConfig.gateInventory || {}
  levelConfig.lockedTo = levelConfig.lockedTo || {}

  if (levelConfig.availableGates.includes(g)) {
    levelConfig.availableGates = levelConfig.availableGates.filter(x => x !== g)
  } else {
    levelConfig.availableGates.push(g)
    if (levelConfig.gateInventory[g] === undefined) {
      levelConfig.gateInventory[g] = 10
    }
    if (levelConfig.lockedTo[g] === undefined) {
      levelConfig.lockedTo[g] = ''
    }
  }
}

watch([() => levelConfig.lockedTo, () => levelConfig.sources, () => levelConfig.availableGates], () => {
  if (!levelConfig.lockedTo) return;

  const newPrePlaced: string[][] = Array.from({ length: levelConfig.sources.length }, () => []);
  const newLockedIndices: number[] = [];

  for (const g of levelConfig.availableGates || []) {
    const lockedStr = levelConfig.lockedTo[g] || '';
    // Extracts letters regardless of commas, spaces, or casing
    const targets = lockedStr.toUpperCase().match(/[A-Z]/g) || [];

    for (const t of targets) {
      // 'A' -> 0, 'B' -> 1, etc
      const sourceIdx = t.charCodeAt(0) - 65;
      if (sourceIdx >= 0 && sourceIdx < levelConfig.sources.length) {
        newPrePlaced[sourceIdx]!.push(g);
      }
    }
  }

  let flatIndex = 0;
  for (let i = 0; i < newPrePlaced.length; i++) {
    for (let j = 0; j < newPrePlaced[i]!.length; j++) {
      newLockedIndices.push(flatIndex);
      flatIndex++;
    }
  }

  levelConfig.prePlacedGates = newPrePlaced;
  levelConfig.lockedGateIndices = newLockedIndices;
}, { deep: true })

// Save/Load functions
// -----------------------------------------
function downloadLevel() {
  const json = JSON.stringify(levelConfig, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${levelConfig.name.replace(/\s+/g, '_')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function uploadLevel(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (event) => {
    try {
      const parsed = JSON.parse(event.target?.result as string) as Partial<LevelConfigLocal>
      Object.assign(levelConfig, normaliseLoadedLevel(parsed))
      setStatus('Level file loaded.', 'success')
    } catch {
      setStatus('Failed to parse level file', 'error')
    }
  }
  reader.readAsText(file)
}
</script>

<template>
  <div :class="styles.gameContainer" style="display: flex; flex-direction: column; height: 100%; min-height: 85vh; padding: 0;">
    <MobileWarning />

    <div style="display: flex; flex: 1; align-items: stretch; width: 100%; overflow: hidden; border-top: 1px solid var(--color-border); border-left: 6px solid var(--color-border);">

      <div style="flex: 0 0 320px; background: var(--color-bg-light); border-right: 1px solid var(--color-border); padding: 15px; overflow-y: auto; display: flex; flex-direction: column;">

        <h1 :class="styles.title" style="margin: 50px 0 4px 0; font-size: 22px;">Lab Mode</h1>
        <p :class="styles.hint" style="margin-bottom: 12px;">Design your own quantum puzzle levels</p>

        <div style="display: flex; gap: 8px; margin-bottom: 12px">
          <button
            @click="backToEdit"
            class="lab-btn"
            :disabled="mode === 'edit'"
            :class="{ active: mode === 'edit' }"
            style="flex: 1; padding: 6px; cursor: pointer"
          >
            Edit
          </button>
          <button
            @click="testLevel"
            class="lab-btn"
            :disabled="levelConfig.sources.length === 0 || mode === 'play'"
            :class="{ active: mode === 'play' }"
            style="flex: 1; padding: 6px; cursor: pointer"
          >
            Test Level
          </button>
        </div>

        <div
          v-if="statusMessage"
          :style="{
            marginBottom: '12px',
            padding: '8px 10px',
            borderRadius: '3px',
            border: '1px solid',
            fontSize: '11px',
            lineHeight: '1.4',
            color: statusTone === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
            borderColor: statusTone === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
            background: statusTone === 'success' ? 'rgba(0, 160, 110, 0.1)' : 'rgba(220, 70, 70, 0.12)'
          }"
        >
          {{ statusMessage }}
        </div>

        <div v-if="mode === 'edit'" style="display: flex; flex-direction: column; gap: 10px;">

          <section style="padding: 10px; background: var(--color-bg-light); border: 1px solid var(--color-border); border-radius: 3px">
            <h3 style="margin: 0 0 6px 0; font-size: 11px; color: var(--color-subtle); text-transform: uppercase">Metadata</h3>
            <label style="display: block; margin-bottom: 6px">
              Name
              <input v-model="levelConfig.name" type="text" style="width: 100%; padding: 2px 4px; margin-top: 2px" />
            </label>
            <label style="display: block; margin-bottom: 6px">
              Hint
              <input v-model="levelConfig.hint" type="text" style="width: 100%; padding: 2px 4px; margin-top: 2px" />
            </label>
            <label style="display: block; margin-bottom: 6px">
              Goal
              <input v-model="levelConfig.goal" type="text" style="width: 100%; padding: 2px 4px; margin-top: 2px" />
            </label>
            
            <div style="display: block; margin-top: 6px;">
              <span style="display: block; margin-bottom: 6px; font-size: 12px; color: #ccc;">Win Condition</span>
              <div v-if="levelConfig.ions.length === 0" style="padding: 8px; background: rgba(255,255,255,0.05); border: 1px dashed var(--color-border); border-radius: 3px; font-size: 11px; color: var(--color-subtle); text-align: center;">
                Place an ion to set win conditions
              </div>
              <div v-else style="display: flex; flex-wrap: wrap; gap: 8px;">
                <div v-for="(ion, idx) in levelConfig.ions" :key="idx" style="display: flex; flex-direction: column; gap: 4px;">
                  <span style="font-size: 10px; color: var(--color-subtle); text-transform: uppercase;">Ion {{ String.fromCharCode(65 + idx) }}</span>
                  <select
                    :value="getIonWinCondition(idx)"
                    @change="handleWinConditionChange(idx, $event)"
                    style="width: 55px; padding: 2px 4px; font-size: 11px;"
                  >
                    <option value="any">any</option>
                    <option value="0">|0⟩</option>
                    <option value="1">|1⟩</option>
                    <option value="+">|+⟩</option>
                    <option value="-">|-⟩</option>
                  </select>
                </div>
              </div>
            </div>

          </section>

          <section style="padding: 10px; background: var(--color-bg-light); border: 1px solid var(--color-border); border-radius: 3px">
            <h3 style="margin: 0 0 6px 0; font-size: 11px; color: var(--color-subtle); text-transform: uppercase">Grid Size</h3>
            <div style="display: flex; gap: 8px; align-items: center">
              <label style="display: flex; align-items: center; gap: 4px">
                Cols
                <input type="number" v-model.number="levelConfig.cols" min="3" max="24" style="width: 50px; padding: 2px 4px" />
              </label>
              <label style="display: flex; align-items: center; gap: 4px">
                Rows
                <input type="number" v-model.number="levelConfig.rows" min="3" max="16" style="width: 50px; padding: 2px 4px" />
              </label>
            </div>
          </section>

          <section style="padding: 10px; background: var(--color-bg-light); border: 1px solid var(--color-border); border-radius: 3px">
            <h3 style="margin: 0 0 6px 0; font-size: 11px; color: var(--color-subtle); text-transform: uppercase">Available Gates</h3>

            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 4px;">
              <div v-for="g in gateOptions" :key="g" style="display: flex; flex-direction: column; gap: 4px;">

                <label style="display: flex; align-items: center; gap: 4px; cursor: pointer;">
                  <input type="checkbox" :checked="levelConfig.availableGates?.includes(g)" @change="() => toggleGate(g)" />
                  <span :style="{ color: levelConfig.availableGates?.includes(g) ? 'var(--color-text)' : 'var(--color-muted)' }">
                    {{ g }} Gate
                  </span>
                </label>

                <div v-if="levelConfig.availableGates?.includes(g) && levelConfig.gateInventory && levelConfig.lockedTo" style="padding-left: 20px; display: flex; align-items: center; gap: 6px;">
                  <span style="font-size: 11px; color: #888;">Count:</span>
                    <input
                      type="number"
                      v-model.number="levelConfig.gateInventory[g]"
                      min="1"
                      max="99"
                      style="width: 50px; padding: 2px 4px; font-size: 11px;"
                    />

                  <span style="font-size: 11px; color: var(--color-subtle); margin-left: 10px;">Locked?</span>
                    <input
                      type="text"
                      v-model="levelConfig.lockedTo[g]"
                      placeholder="e.g. A, B"
                      style="width: 70px; padding: 2px 4px; font-size: 11px;"
                    />
                </div>

              </div>
            </div>

          </section>

          <section style="padding: 10px; background: var(--color-bg-light); border: 1px solid var(--color-border); border-radius: 3px">
            <h3 style="margin: 0 0 6px 0; font-size: 11px; color: var(--color-subtle); text-transform: uppercase">Save/Load</h3>
            <div style="display: flex; gap: 8px;">
              <button @click="downloadLevel" style="flex: 1; padding: 4px; font-size: 11px;">
                Download
              </button>
              <label style="flex: 1;">
                <input type="file" accept=".json" @change="uploadLevel" style="display: none" />
                <span style="display: block; padding: 4px; background: var(--color-success); border: 1px solid var(--color-success); cursor: pointer; text-align: center; border-radius: 3px; font-size: 11px;">
                  Upload
                </span>
              </label>
            </div>
          </section>
        </div>

        <div v-if="mode === 'play'" style="display: flex; flex-direction: column; gap: 10px;">
          <section style="padding: 10px; background: var(--color-bg-light); border: 1px solid var(--color-border); border-radius: 3px">
            <h3 style="margin: 0 0 8px 0; font-size: 11px; color: var(--color-subtle); text-transform: uppercase">Level Information</h3>
            <div style="margin-bottom: 6px; font-size: 12px; color: var(--color-text);"><strong style="color: var(--color-subtle); display: inline-block; width: 60px;">Name:</strong> {{ levelConfig.name }}</div>
            <div style="margin-bottom: 6px; font-size: 12px; color: var(--color-text);"><strong style="color: var(--color-subtle); display: inline-block; width: 60px;">Hint:</strong> {{ levelConfig.hint || 'None' }}</div>
            <div style="margin-bottom: 6px; font-size: 12px; color: var(--color-text);"><strong style="color: var(--color-subtle); display: inline-block; width: 60px;">Goal:</strong> {{ levelConfig.goal || 'None' }}</div>
            <div style="font-size: 12px; color: var(--color-text);"><strong style="color: var(--color-subtle); display: inline-block; width: 60px;">Win:</strong> {{ levelConfig.winCondition }}</div>
          </section>
        </div>

      </div>

      <div v-if="mode === 'edit'" style="flex: 0 0 180px; background: var(--color-bg); border-right: 1px solid var(--color-border); padding: 20px; overflow-y: auto;">
        <h3 style="margin: 50px 0 12px 0; font-size: 12px; color: var(--color-subtle); text-transform: uppercase">Palette</h3>
        <p style="font-size: 11px; color: var(--color-subtle); margin-bottom: 16px; line-height: 1.4;">
          Drag to canvas.<br/>Right-click to delete.
        </p>
        <div style="display: flex; flex-direction: column; gap: 10px">
          <div
            v-for="item in paletteItems"
            :key="item.type"
            draggable="true"
            @dragstart="item.type === 'ion' && levelConfig.ions.length >= 6 ? $event.preventDefault() : onPaletteItemDragStart($event, item)"
              :style="{
              padding: '10px 8px',
              background: item.color,
              color: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: '3px',
              cursor: (item.type === 'ion' && levelConfig.ions.length >= 6) ? 'not-allowed' : 'grab',
              fontSize: '11px',
              fontWeight: 'bold',
              textAlign: 'center',
              userSelect: 'none',
              boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
              opacity: (item.type === 'ion' && levelConfig.ions.length >= 6) ? 0.3 : 1,
            }"
          >
            {{ item.icon }} {{ item.label }}
          </div>
        </div>
      </div>

      <div style="flex: 1; display: flex; justify-content: center; align-items: center; overflow: hidden; background: var(--color-bg); padding: 20px; position: relative;">
        <GameBoard
          v-if="mode === 'edit' && !playLevel"
          :mode="'edit'"
          :fillParent="true"
          :level="editorLevel"
          :sourceGates="levelConfig.prePlacedGates || []"
          @item-drop="handleItemDrop"
          @canvas-click="handleEditCanvasClick"
        />
        <GameBoard
          v-if="mode === 'play' && playLevel"
          ref="gameBoardRef"
          mode="play"
          :fillParent="true"
          :level="playLevel"
          :sourceGates="playSourceGates"
          @canvas-mirror-place="updatePlayState"
          @canvas-click="handleGameBoardClick"
        />
      </div>

      <MeasurementSidebar
        v-if="mode === 'play'"
        class="lab-sidebar-override"
        :ionStates="ionStates"
        :canMeasure="canMeasure"
        :automatedRunning="false"
        :showResetButton="ionStates.length > 0"
        :result="result"
        :isOrangeResult="result === '1'"
        :history="history"
        :tutorialVisible="false"
        :isTutorialStep="() => false"
        :blochPanelRef="(el) => blochPanelRef = el"
        :measureBtnRef="(el) => measureBtnRef = el"
        :resetBtnRef="(el) => resetBtnRef = el"
        :historyRef="(el) => historyRef = el"
        @measure="handleMeasure"
        @reset="handleReset"
      />
      </div>

      <LaserGatesModal
        v-if="showLaserGates && playLevel"
        :activeGates="activeGates"
        :displayedGateProgress="null" 
        :availableGates="playLevel.availableGates"
        :gateInventory="playGateInventory"
        :isGateLocked="isGateLocked"
        @close="showLaserGates = false"
        @gateDragStart="onGateDragStart"
        @laserDragOver="onLaserDragOver"
        @laserDrop="onLaserDrop"
        @removeGate="removeLaserGate"
      />

        <div v-if="showWin && mode === 'play'" :class="styles.popupOverlay" @click="showWin = false">
        <div :class="styles.popupModal" style="text-align: center; border-color: #0f8; box-shadow: 0 0 20px rgba(0, 255, 136, 0.2);" @click.stop>
          <div :class="styles.popupTitle" style="color: #0f8; font-size: 20px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">
            Level Passed!
          </div>
          <div :class="styles.popupText" style="margin-bottom: 24px; font-size: 14px;">
            The win condition (<strong>{{ playLevel?.winCondition }}</strong>) was successfully met.
          </div>
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button @click="showWin = false" class="lab-btn" style="flex: 1;">
              Continue Testing
            </button>
            <button @click="backToEdit(); showWin = false" class="lab-btn" style="flex: 1; border-color: #0ef; box-shadow: 0 0 8px rgba(0, 238, 255, 0.3);">
              Back to Edit
            </button>
          </div>
        </div>
      </div>
      <div v-if="showWelcome" :class="styles.popupOverlay" @click="showWelcome = false" style="z-index: 9999;">
        <div :class="styles.popupModal" style="text-align: center; max-width: 400px;" @click.stop>
          <div :class="styles.popupTitle" style="color: var(--color-primary); font-size: 20px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">
            Lab Mode
          </div>
          <div :class="styles.popupText" style="margin-bottom: 24px; font-size: 14px; line-height: 1.5;">
            Create your own custom levels in edit mode. Press the test level button on the left to play them. Right click to remove elements.
          </div>
          <button @click="showWelcome = false" class="lab-btn" style="width: 100%; padding: 8px; border-color: var(--color-primary); box-shadow: 0 0 8px rgba(0, 238, 255, 0.3);">
            Got it
          </button>
        </div>
      </div>
      </div>
</template>

<style scoped>
.active {
  outline: 2px solid #0ef;
}

input[type='number'],
input[type='text'],
select {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 2px;
  font-family: var(--font-mono);
}

input[type='number']:focus,
input[type='text']:focus,
select:focus {
  outline: 1px solid var(--color-primary);
  border-color: var(--color-primary);
}

.lab-button {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  padding: 6px 10px;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: 0.2s;
}

.lab-button:hover:not(:disabled) {
  background: #2a2a2a;
  border-color: #555;
}

.lab-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

section h3 {
  margin: 0;
}

label {
  font-size: 12px;
  color: #ccc;
}

/* Override styles for the MeasurementSidebar component to fit the lab mode layout*/
:deep(.lab-sidebar-override) {
  flex: 0 0 320px !important;
  background: var(--color-bg-light) !important;
  border-left: 1px solid var(--color-border) !important;
  display: flex !important;
  flex-direction: column !important;
  padding: 0 !important;
  overflow: hidden !important;
}
:deep(.lab-sidebar-override > div:first-child) {
  display: flex !important;
  flex-wrap: wrap !important;
  justify-content: center !important;
  gap: 15px !important;
  padding: 10px !important;
  flex: 0 1 auto !important;
  min-height: min-content !important;
  overflow-y: auto !important;
}

:deep(.lab-sidebar-override > div:nth-child(2)) {
  flex: 0 0 auto !important;
  padding: 20px !important;
  border-top: 1px solid #1a1a1a !important;
}
</style>