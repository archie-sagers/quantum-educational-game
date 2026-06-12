<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import styles from './Home.module.css'
import GameBoard from '@/components/GameBoard.vue'
import { Level, CELL, measureAll, getBlochAngle, getBlochLabel, calculateQuantumState, type IonQuantumState } from '@/game/quantumgame'

// Level config interface
interface LevelConfigLocal {
  name: string
  cols: number
  rows: number
  sources: Array<{ col: number; row: number; dir?: string }>
  ions: Array<{ col: number; row: number }>
  walls?: Array<{ col: number; row: number; type?: string }>
  availableGates?: string[]
  prePlacedGates?: string[][]
  lockedGateIndices?: number[]
  gateInventory?: Record<string, number>
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
  gateInventory: {},
  hint: 'Design your custom level',
  goal: 'Test',
  winCondition: 'any',
})

// User made level
const editorLevel = computed(() => {
  return new Level({
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

    const measResults = measureAll()
    measuredValues.value = measResults
    isMeasured.value = true
    
    updatePlayState()
    result.value = measResults.join(',')
    history.value.push(measResults)
    if (history.value.length > 20) history.value.shift()

    canMeasure.value = true
    showWin.value = true 
  }, 800) // TRAVEL_MS
}

function handleReset() {
  isMeasured.value = false
  measuredValues.value = null
  result.value = '—'
  showWin.value = false
  updatePlayState()
}

// Edit Mode
// -------------------------------------------
const paletteItems = [
  { type: 'source', label: 'Laser Source', icon: '■', color: '#0ef' },
  { type: 'ion', label: 'Ion', icon: '●', color: '#f84' },
  { type: 'wall-standard', label: 'Wall (Blocks All)', icon: '✕', color: '#ff4444' },
  { type: 'wall-cyan', label: 'Wall (Cyan)', icon: '✕', color: '#0ef' },
  { type: 'wall-purple', label: 'Wall (Purple)', icon: '✕', color: '#b47cff' },
  { type: 'wall-green', label: 'Wall (Green)', icon: '✕', color: '#0f8' },
  { type: 'wall-orange', label: 'Wall (Orange)', icon: '✕', color: '#f84' },
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
    const wallType = itemType.split('-')[1] || 'standard'
    levelConfig.walls = levelConfig.walls || []
    levelConfig.walls.push({ col, row, type: wallType })
  }
}

function testLevel() {
  if (levelConfig.sources.length === 0) {
    alert('Add at least one laser source to test')
    return
  }
  const cfg: any = {
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
  }
  playLevel.value = new Level(cfg)
  playSourceGates.value = (cfg.prePlacedGates || []).map((g: string[]) => [...g])
  
  // Reset Play state
  isMeasured.value = false
  measuredValues.value = null
  result.value = '—'
  history.value = []
  showWin.value = false
  updatePlayState()
  mode.value = 'play'
}

function backToEdit() {
  mode.value = 'edit'
  playLevel.value = null
}

function toggleGate(g: string) {
  levelConfig.availableGates = levelConfig.availableGates || []
  if (levelConfig.availableGates.includes(g)) {
    levelConfig.availableGates = levelConfig.availableGates.filter(x => x !== g)
  } else {
    levelConfig.availableGates.push(g)
  }
}

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
      const data = JSON.parse(event.target?.result as string)
      Object.assign(levelConfig, data)
    } catch (err) {
      alert('Failed to parse level file')
    }
  }
  reader.readAsText(file)
}
</script>

<template>
  <div :class="styles.gameContainer" style="display: flex; flex-direction: column; height: 100%; min-height: 85vh; padding: 0;">
    
    <div style="display: flex; flex: 1; align-items: stretch; width: 100%; overflow: hidden; border-top: 1px solid #333; border-left: 6px solid #333;">
      
      <div style="flex: 0 0 320px; background: #0a0a0a; border-right: 1px solid #333; padding: 15px; overflow-y: auto; display: flex; flex-direction: column;">
        
        <h1 :class="styles.title" style="margin: 50px 0 4px 0; font-size: 22px;">Lab Mode</h1>
        <p :class="styles.hint" style="margin-bottom: 12px;">Design your own quantum puzzle levels</p>

        <div style="display: flex; gap: 8px; margin-bottom: 12px">
          <button
            @click="backToEdit"
            :disabled="mode === 'edit'"
            :class="{ active: mode === 'edit' }"
            style="flex: 1; padding: 6px; cursor: pointer"
          >
            Edit
          </button>
          <button
            @click="testLevel"
            :disabled="levelConfig.sources.length === 0 || mode === 'play'"
            :class="{ active: mode === 'play' }"
            style="flex: 1; padding: 6px; cursor: pointer"
          >
            Test Level
          </button>
        </div>

        <div v-if="mode === 'edit'" style="display: flex; flex-direction: column; gap: 10px;">
          
          <section style="padding: 10px; background: #0a0a0a; border: 1px solid #333; border-radius: 3px">
            <h3 style="margin: 0 0 6px 0; font-size: 11px; color: #888; text-transform: uppercase">Metadata</h3>
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
                <option value="superposition">Superposition</option>
                <option value="normal">Normal (|0⟩ or |1⟩)</option>
                <option value="|0⟩">|0⟩ State</option>
                <option value="|1⟩">|1⟩ State</option>
              </select>
            </label>
          </section>

          <section style="padding: 10px; background: #0a0a0a; border: 1px solid #333; border-radius: 3px">
            <h3 style="margin: 0 0 6px 0; font-size: 11px; color: #888; text-transform: uppercase">Grid Size</h3>
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

          <section style="padding: 10px; background: #0a0a0a; border: 1px solid #333; border-radius: 3px">
            <h3 style="margin: 0 0 6px 0; font-size: 11px; color: #888; text-transform: uppercase">Available Gates</h3>
            <div style="display: flex; gap: 10px; margin-bottom: 8px;">
              <div v-for="g in gateOptions" :key="g">
                <label style="display: flex; align-items: center; gap: 4px;">
                  <input type="checkbox" :checked="levelConfig.availableGates?.includes(g)" @change="() => toggleGate(g)" />
                  <span>{{ g }}</span>
                </label>
              </div>
            </div>
          </section>

          <section style="padding: 10px; background: #0a0a0a; border: 1px solid #333; border-radius: 3px">
            <h3 style="margin: 0 0 6px 0; font-size: 11px; color: #888; text-transform: uppercase">Save/Load</h3>
            <div style="display: flex; gap: 8px;">
              <button @click="downloadLevel" style="flex: 1; padding: 4px; font-size: 11px;">
                Download
              </button>
              <label style="flex: 1;">
                <input type="file" accept=".json" @change="uploadLevel" style="display: none" />
                <span style="display: block; padding: 4px; background: #0a3a0a; border: 1px solid #0f8; cursor: pointer; text-align: center; border-radius: 3px; font-size: 11px;">
                  Upload
                </span>
              </label>
            </div>
          </section>
        </div>

        <div v-if="mode === 'play'" style="display: flex; flex-direction: column; gap: 10px;">
          <section style="padding: 10px; background: #0a0a0a; border: 1px solid #333; border-radius: 3px">
            <h3 style="margin: 0 0 8px 0; font-size: 11px; color: #888; text-transform: uppercase">Level Information</h3>
            <div style="margin-bottom: 6px; font-size: 12px; color: #eee;"><strong style="color: #888; display: inline-block; width: 60px;">Name:</strong> {{ levelConfig.name }}</div>
            <div style="margin-bottom: 6px; font-size: 12px; color: #eee;"><strong style="color: #888; display: inline-block; width: 60px;">Hint:</strong> {{ levelConfig.hint || 'None' }}</div>
            <div style="margin-bottom: 6px; font-size: 12px; color: #eee;"><strong style="color: #888; display: inline-block; width: 60px;">Goal:</strong> {{ levelConfig.goal || 'None' }}</div>
            <div style="font-size: 12px; color: #eee;"><strong style="color: #888; display: inline-block; width: 60px;">Win:</strong> {{ levelConfig.winCondition }}</div>
          </section>
        </div>

      </div>

      <div v-if="mode === 'edit'" style="flex: 0 0 180px; background: #111; border-right: 1px solid #333; padding: 20px; overflow-y: auto;">
        <h3 style="margin: 50px 0 12px 0; font-size: 12px; color: #888; text-transform: uppercase">Palette</h3>
        <p style="font-size: 11px; color: #888; margin-bottom: 16px; line-height: 1.4;">
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
              color: '#000',
              border: '1px solid #555',
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

      <div style="flex: 1; display: flex; justify-content: center; align-items: center; overflow: hidden; background: #000; padding: 20px; position: relative;">
        <GameBoard
          v-if="mode === 'edit' && !playLevel"
          :mode="'edit'"
          :fillParent="true" 
          :level="editorLevel" 
          :sourceGates="levelConfig.prePlacedGates || []"
          @item-drop="handleItemDrop"
        />
        <GameBoard
          v-if="mode === 'play' && playLevel"
          ref="gameBoardRef"
          mode="play"
          :fillParent="true"
          :level="playLevel"
          :sourceGates="playSourceGates"
          @canvas-mirror-place="updatePlayState"
        />
      </div>

<aside v-if="mode === 'play'" :class="styles.sidebar" style="flex: 0 0 400px; background: #0a0a0a; border-left: 1px solid #333; display: flex; flex-direction: column; padding: 0; overflow: hidden;">
        
        <div style="flex: 0 0 auto; padding: 30px 20px 10px;">
          <h3 style="margin: 0; font-size: 12px; color: #888; text-transform: uppercase;">Test Results</h3>
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
    </div>
</template>

<style scoped>
.active {
  outline: 2px solid #0ef;
}

input[type='number'],
input[type='text'],
select {
  background: #1a1a1a;
  color: #eee;
  border: 1px solid #333;
  border-radius: 2px;
  font-family: monospace;
}

input[type='number']:focus,
input[type='text']:focus,
select:focus {
  outline: 1px solid #0ef;
  border-color: #0ef;
}

button {
  background: #1a1a1a;
  color: #eee;
  border: 1px solid #333;
  padding: 6px 10px;
  cursor: pointer;
  border-radius: 3px;
  transition: 0.2s;
}

button:hover:not(:disabled) {
  background: #2a2a2a;
  border-color: #555;
}

button:disabled {
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