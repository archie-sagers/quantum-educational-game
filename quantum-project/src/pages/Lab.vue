<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue'
defineOptions({ name: 'LabPage' })
import styles from './Home.module.css'
import GameBoard from '@/components/GameBoard.vue'
import { Level, measureAll, getBlochAngle, checkWinCondition, getBlochLabel, calculateQuantumState } from '@/game/quantumgame'
import { type IonQuantumState, type WallType } from '@/game/types'
import MobileWarning from '@/components/MobileWarning.vue'

// Level config interface
interface LevelConfigLocal {
  name: string
  cols: number
  rows: number
  sources: Array<{ col: number; row: number; dir?: string }>
  ions: Array<{ col: number; row: number }>
  walls?: Array<{ col: number; row: number; type?: WallType }>
  availableGates?: string[]
  prePlacedGates?: string[][]
  lockedGateIndices?: number[]
  gateInventory?: Record<string, number>
  lockedTo?: Record<string, string>
  hint?: string
  goal?: string
  winCondition?: string
}

const defaultConfig = (): LevelConfigLocal => ({
  name: 'Custom Level',
  cols: 10,
  rows: 8,
  sources: [],
  ions: [],
  walls: [],
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
  return new Level({
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
});

// Mode: edit or play
const mode = ref<'edit' | 'play'>('edit')
const levelConfig = reactive<LevelConfigLocal>(defaultConfig())
const gateOptions = ['X', 'H', 'CNOT']

// Play Mode
// -----------------------------------------
const gameBoardRef = ref<InstanceType<typeof GameBoard> | null>(null)
const playLevel = ref<Level | null>(null)
const playSourceGates = ref<string[][]>([])
const ionStates = ref<IonQuantumState[]>([])
const canMeasure = ref(false)
const isMeasured = ref(false)
const measuredValues = ref<number[] | null>(null)
const result = ref('—')
const history = ref<number[][]>([])
const showWin = ref(false)
const showLaserGates = ref(false)
const activeSourceIndex = ref<number>(0)
const playGateInventory = ref<Record<string, number>>({})
const activeGates = computed(() => playSourceGates.value[activeSourceIndex.value] ?? [])

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
  }, 800) // TRAVEL_MS
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
  const clickedSourceIdx = playLevel.value.sources.findIndex(s => s.col === col && s.row === row);

  if (clickedSourceIdx !== -1 && playLevel.value.availableGates.length > 0) {
    activeSourceIndex.value = clickedSourceIdx;
    showLaserGates.value = true;
  }
}

function onGateDragStart(e: DragEvent, gateType: string) {
  const available = playGateInventory.value[gateType] ?? -1
  if (available === 0) {
    e.preventDefault()
    return
  }
  e.dataTransfer!.effectAllowed = 'copy'
  e.dataTransfer!.setData('gateType', gateType)
}

function onLaserDragOver(e: DragEvent) {
  e.preventDefault()
  e.dataTransfer!.dropEffect = 'copy'
}

function onLaserDrop(e: DragEvent) {
  e.preventDefault()
  const gateType = e.dataTransfer!.getData('gateType')
  if (gateType) {
    if (playGateInventory.value[gateType] !== undefined) {
      if (playGateInventory.value[gateType]! > 0) {
        playGateInventory.value[gateType]!--
      } else {
        return
      }
    }
    const idx = activeSourceIndex.value
    if (!playSourceGates.value[idx]) playSourceGates.value[idx] = []
    playSourceGates.value[idx].push(gateType)

    // Reset measurement state when a gate is added
    isMeasured.value = false
    measuredValues.value = null
    updatePlayState()
  }
}

function removeLaserGate(index: number) {
  const activeIdx = activeSourceIndex.value


  if (isGateLocked(index)) {
    return;
  }

  const gate = playSourceGates.value[activeIdx]?.[index];
  if (!gate) return;

  playSourceGates.value[activeIdx]!.splice(index, 1);

  if (playGateInventory.value[gate] !== undefined) {
    playGateInventory.value[gate]!++
  }

  // Reset measurement state when a gate is removed
  isMeasured.value = false
  measuredValues.value = null
  updatePlayState()
}

function isGateLocked(localIndex: number) {
  const activeIdx = activeSourceIndex.value;
  const prePlacedCount = playLevel.value?.prePlacedGates?.[activeIdx]?.length || 0;
  return localIndex < prePlacedCount;
}

// Edit Mode
// -------------------------------------------
const paletteItems = [
  { type: 'source', label: 'Laser Source', icon: '■', color: 'var(--color-primary)' },
  { type: 'ion', label: 'Ion', icon: '●', color: 'var(--color-danger)' },
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
    return
  }
  if (itemType === 'source') {
    if (levelConfig.sources.some(s => s.col === col && s.row === row)) return
    levelConfig.sources.push({ col, row, dir: 'right' })
  } else if (itemType === 'ion') {
    if (levelConfig.ions.some(i => i.col === col && i.row === row)) return
    levelConfig.ions.push({ col, row })
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
    playSourceGates.value = (cfg.prePlacedGates || []).map((g: string[]) => [...g])
    playGateInventory.value = { ...(levelConfig.gateInventory || {}) }

    const flatLocked = playSourceGates.value.flat()
    for (const idx of cfg.lockedGateIndices ?? []) {
      if (idx < flatLocked.length) {
        const gate = flatLocked[idx]
        if (gate && playGateInventory.value[gate] !== undefined && playGateInventory.value[gate] > 0) {
          playGateInventory.value[gate]--
        }
      }
    }

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
            <label style="display: block">
              Win Condition
              <select v-model="levelConfig.winCondition" style="width: 100%; padding: 2px 4px; margin-top: 2px">
                <option value="any">Any</option>

                <optgroup label="General States (Any Qubit Count)">
                  <option value="normal">All Normal (|0⟩ or |1⟩)</option>
                  <option value="all-0">All |0⟩</option>
                  <option value="all-1">All |1⟩</option>
                </optgroup>

                <optgroup label="Superposition">
                  <option value="superposition">All in Superposition (|+⟩ or |-⟩)</option>
                  <option value="positive-superposition">All |+⟩</option>
                  <option value="negative-superposition">All |-⟩</option>
                  <option value="mixed">Mixed (Normal & Superposition)</option>
                </optgroup>

                <optgroup label="2 Qubit Specific">
                  <option value="01">|01⟩ State</option>
                  <option value="10">|10⟩ State</option>
                </optgroup>
              </select>
            </label>
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
            @dragstart="onPaletteItemDragStart($event, item)"
              :style="{
              padding: '10px 8px',
              background: item.color,
              color: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: '3px',
              cursor: 'grab',
              fontSize: '11px',
              fontWeight: 'bold',
              textAlign: 'center',
              userSelect: 'none',
              boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
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

  <aside v-if="mode === 'play'" :class="styles.sidebar" style="flex: 0 0 400px; background: var(--color-bg-light); border-left: 1px solid var(--color-border); display: flex; flex-direction: column; padding: 0; overflow: hidden;">

        <div style="flex: 0 0 auto; padding: 30px 20px 10px;">
          <h3 style="margin: 0; font-size: 12px; color: var(--color-subtle); text-transform: uppercase;">Test Results</h3>
        </div>

          <div :class="styles.ionWrapper" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 15px; padding: 10px; flex: 0 1 auto; min-height: min-content;">
            <div
              v-for="(ionState, idx) in ionStates"
              :key="idx"
              :class="[styles.ionSection, { [styles.ionSectionCompact as string]: ionStates.length >= 3 }]"
            >
            <div :class="[styles.blochPanel, { [styles.blochPanelCompact as string]: ionStates.length >= 3 }]">
              <div :class="styles.blochTitle">
                Ion {{ String.fromCharCode(65 + idx) }}<span v-if="ionStates.length < 3"> - Bloch Sphere</span>
              </div>
              <svg :class="[styles.blochSvg, { [styles.blochSvgCompact as string]: ionStates.length >= 2 }]" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
                <text x="80" y="14" :class="styles.blochLabel" text-anchor="middle">|1⟩</text>
                <text x="80" y="156" :class="styles.blochLabel" text-anchor="middle">|0⟩</text>
                <text x="10" y="84" :class="styles.blochLabel" text-anchor="middle">−</text>
                <text x="150" y="84" :class="styles.blochLabel" text-anchor="middle">+</text>

                <circle cx="80" cy="80" r="52" :class="styles.blochCircle" />
                <ellipse cx="80" cy="80" rx="52" ry="14" :class="styles.blochEquator" />

                <g v-if="getBlochAngle(ionState.state) !== null">
                  <line
                    x1="80" y1="80"
                    :x2="80 + 44 * Math.cos(((getBlochAngle(ionState.state) ?? 0) * Math.PI) / 180)"
                    :y2="80 + 44 * Math.sin(((getBlochAngle(ionState.state) ?? 0) * Math.PI) / 180)"
                    :class="styles.blochArrow"
                  />
                  <circle
                    :cx="80 + 46 * Math.cos(((getBlochAngle(ionState.state) ?? 0) * Math.PI) / 180)"
                    :cy="80 + 46 * Math.sin(((getBlochAngle(ionState.state) ?? 0) * Math.PI) / 180)"
                    r="3"
                    :class="styles.blochTip"
                  />
                </g>

                <circle cx="80" cy="80" r="3" :class="styles.blochCenter" />
              </svg>

              <div :class="{
                [styles.blochState as string]: true,
                [styles.blochStateSuperposition as string]: ionState.state === '|+⟩' || ionState.state === '|-⟩'
              }">
                {{ getBlochLabel(ionState.state) }}
              </div>
            </div>

            <div v-if="ionStates.length < 3" :class="styles.infoPanel">
              <div :class="styles.infoRow">
                <span :class="styles.infoKey">State</span>
                <span :class="[styles.infoVal, ionState.state === '|+⟩' || ionState.state === '|-⟩' ? styles.infoValPurple : ionState.state === '|1⟩' ? styles.infoValOrange : styles.infoValCyan]">{{ ionState.state }}</span>
              </div>
              <div :class="styles.infoRow">
                <span :class="styles.infoKey">P(|0⟩)</span>
                <span :class="styles.infoVal">{{ ionState.p0 }}</span>
              </div>
              <div :class="styles.infoRow">
                <span :class="styles.infoKey">P(|1⟩)</span>
                <span :class="styles.infoVal">{{ ionState.p1 }}</span>
              </div>
            </div>
          </div>
        </div>

        <div :class="styles.sharedControls" style="flex: 0 0 auto; padding: 20px; border-top: 1px solid #1a1a1a;">
          <button
            @click="handleMeasure"
            :disabled="!canMeasure"
            :class="styles.measureBtn"
            style="width: 100%; margin-bottom: 10px;"
          >
            Measure
          </button>

          <button
            v-if="ionStates.length > 0"
            @click="handleReset"
            :class="styles.resetBtn"
            style="width: 100%; margin-bottom: 20px;"
          >
            Reset Ion
          </button>

          <div :class="styles.infoRow">
            <span :class="styles.infoKey">Last</span>
            <span :class="[styles.infoVal, resultcolourClass]">{{ result }}</span>
          </div>
          <div v-if="history.length" :class="styles.history" style="margin-top: 10px;">
            <span :class="styles.infoKey">History</span>
            <span :class="styles.historyBits">{{ history.map((r: number[]) => r.join('')).join(' ') }}</span>
          </div>
        </div>

      </aside>
      </div>

      <div v-if="showLaserGates && playLevel" :class="styles.laserGatesOverlay" @click="showLaserGates = false">
        <div :class="styles.laserGatesModal" @click.stop>
          <div :class="styles.laserGatesTitle">Laser Gates</div>

          <div :class="styles.gateContainer">
            <div :class="styles.appliedSection">
              <div :class="styles.sectionLabel">Applied to Laser</div>
              <div
                @dragover="onLaserDragOver"
                @drop="onLaserDrop"
                :class="styles.laserDropZone"
              >
                <div v-if="activeGates.length > 0" :class="styles.gateStack">
                  <div
                    v-for="(gate, index) in activeGates"
                    :key="`laser-gate-${index}`"
                    :class="[
                      styles.laserGate,
                      { [styles.laserGateX as string]: gate === 'X' },
                      { [styles.laserGateH as string]: gate === 'H' },
                      { [styles.laserGateCNOT as string]: gate === 'CNOT' }
                    ]"
                  >
                  <button v-if="!isGateLocked(index)" @click="removeLaserGate(index)" :class="styles.removeBtn">✕</button>
                    <div>{{ gate }}</div>
                  </div>
                </div>
                <div v-else :class="styles.dropHint">Drag gates here</div>
              </div>
            </div>

            <div :class="styles.divider"></div>

            <div :class="styles.gatesSection">
              <div :class="styles.sectionLabel">Available Gates</div>
              <div :class="styles.gateGrid">
                <div
                    v-for="(gate, index) in playLevel.availableGates"
                    :key="`gate-${index}`"
                    draggable="true"
                    @dragstart="onGateDragStart($event, gate)"
                    :class="[styles.gateItem,
                      { [styles.gateItemX as string]: gate === 'X' },
                      { [styles.gateItemH as string]: gate === 'H' },
                      { [styles.gateItemCNOT as string]: gate === 'CNOT' },
                      { [styles.gateItemDisabled as string]: (playGateInventory[gate] ?? -1) === 0 }
                    ]"
                  >
                  <div>{{ gate }}</div>
                  <div v-if="playGateInventory[gate] !== undefined" :class="styles.gateItemCount">
                    {{ playGateInventory[gate] }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button @click="showLaserGates = false" :class="styles.doneBtn">Done</button>
        </div>
      </div>
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
</style>
