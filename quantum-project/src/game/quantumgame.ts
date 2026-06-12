import { QuantumSystem } from './quantumsystem';

export const CELL = 56;

export type QuantumState = '|0⟩' | '|1⟩' | '|+⟩' | '|-⟩';

let lastQuantumSystem: QuantumSystem | null = null;

export type WallType = 'all' | 'standard' | 'cyan' | 'purple' | 'green' | 'orange';

// Function for 1 qubit quantum state
// Reads amplitudes and probabilities to determine the exact state,
// Has tolerance for floating-point rounding
 
function getLabelFromMath(qs: QuantumSystem): QuantumState {
  // translates the math of the quantum system into a label for the UI
  const [prob0, prob1] = qs.getQubitProbability(0);
  const amp0 = qs.getAmplitude(0);
  const amp1 = qs.getAmplitude(1);

  // Accounts for floating point errors
  const p0normalised = Math.abs(prob0 - 0.5) < 0.01;
  const p1normalised = Math.abs(prob1 - 0.5) < 0.01;

  if (Math.abs(prob0 - 1) < 0.01) {
    return '|0⟩';
  }
  if (Math.abs(prob1 - 1) < 0.01) {
    return '|1⟩';
  }

  if (p0normalised && p1normalised) {
    // If in superposition, check phase to determine if it's |+⟩ or |-⟩
    const phase = Math.atan2(amp0.imaginary, amp0.real) - Math.atan2(amp1.imaginary, amp1.real);
    // Prevents issues with negative angles and angles greater than 2 PI
    const normalisedPhase = ((phase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    if (Math.abs(normalisedPhase) < 0.3 || Math.abs(normalisedPhase - 2 * Math.PI) < 0.3) {
      // If phase difference is close to 0 or 2 PI, it's in sync and is |+⟩
      return '|+⟩';
    }
    if (Math.abs(normalisedPhase - Math.PI) < 0.3) {
      // If phase difference is close to PI, it's out of sync and is |-⟩
      return '|-⟩';
    }
  }
  // fallback to probability if phase doesn't give a clear answer
  return prob0 > 0.5 ? '|0⟩' : '|1⟩';
}

function getLabelForQubit(qs: QuantumSystem, qubitIndex: number): QuantumState {
  // Get state label for a specific qubit in a multi-qubit system
  const [prob0, prob1] = qs.getQubitProbability(qubitIndex);
  const stateVector = qs.getStateVector();
  
  // Accounts for floating point errors
  const p0normalised = Math.abs(prob0 - 0.5) < 0.01;
  const p1normalised = Math.abs(prob1 - 0.5) < 0.01;

  if (Math.abs(prob0 - 1) < 0.01) {
    return '|0⟩';
  }
  if (Math.abs(prob1 - 1) < 0.01) {
    return '|1⟩';
  }

  if (p0normalised && p1normalised) {
    // For superposition, compute phase from state vector amplitudes
    // Get amplitudes for basis states where this qubit is 0 and 1
    let amp0Phase = 0, amp1Phase = 0;
    let amp0Count = 0, amp1Count = 0;
    const numQubits = qs.getNumQubits();
    // Calculate how many states are in the entire state vector
    const stateSize = 1 << numQubits;
    
    for (let i = 0; i < stateSize; i++) {
      const amp = stateVector[i]!;
      const bit = (i >> qubitIndex) & 1;
      
      // Calculate the phase of the state and average it for states where the target qubit is 0 or 1
      if (bit === 0) {
        amp0Phase += Math.atan2(amp.imaginary, amp.real);
        amp0Count++;
      } else {
        amp1Phase += Math.atan2(amp.imaginary, amp.real);
        amp1Count++;
      }
    }
    
    const avgPhase0 = amp0Count > 0 ? amp0Phase / amp0Count : 0;
    const avgPhase1 = amp1Count > 0 ? amp1Phase / amp1Count : 0;
    const phase = avgPhase0 - avgPhase1;
    const normalisedPhase = ((phase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    if (Math.abs(normalisedPhase) < 0.3 || Math.abs(normalisedPhase - 2 * Math.PI) < 0.3) {
      return '|+⟩';
    }
    if (Math.abs(normalisedPhase - Math.PI) < 0.3) {
      return '|-⟩';
    }
  }
  return prob0 > 0.5 ? '|0⟩' : '|1⟩';
}

function getStateProbabilities(state: QuantumState): [number, number] {
  // Returns the probabilities of measuring 0 or 1 for a qubit in a given state
  const probs: Record<QuantumState, [number, number]> = {
    '|0⟩': [1, 0],
    '|1⟩': [0, 1],
    '|+⟩': [0.5, 0.5],
    '|-⟩': [0.5, 0.5]
  };
  return probs[state];
}

export function measure(state: QuantumState): number {
  if (lastQuantumSystem) {
    const result = lastQuantumSystem.measure();
    return result[0] ?? 0;
  }
  // fallback
  return Math.random() < 0.5 ? 0 : 1; 
}

export function measureAll(): number[] {
  if (lastQuantumSystem) {
    return lastQuantumSystem.measure();
  }
  // fallback: return array of random results
  // To prevent crashes
  return [Math.random() < 0.5 ? 0 : 1];
}

export function getBlochAngle(state: string): number | null {
  const angleMap: Record<string, number> = {
    '|+⟩': 0,
    '|0⟩': 90,
    '|-⟩': 180,
    '|1⟩': 270
  };
  // Return the angle corresponding to the state, or null if state is not recognised
  return angleMap[state] ?? null;
}

export function getBlochLabel(state: string): string {
  const labelMap: Record<string, string> = {
    '|0⟩': '|0⟩ Ground state',
    '|+⟩': '|+⟩ Superposition',
    '|-⟩': '|-⟩ Superposition',
    '|1⟩': '|1⟩ Excited state'
  };
  // Return the label corresponding to the state, or a default if state is not recognised
  return labelMap[state] ?? 'No state';
}

export interface IonQuantumState {
  ionIndex: number;
  state: QuantumState | '—';
  p0: string | '—';
  p1: string | '—';
}

export function calculateQuantumState(
  level: Level,
  laserGates: string[][],
  measuredValues: number[] | null
): { states: IonQuantumState[]; canMeasure: boolean } {
  // Initialise quantum system with the number of ions (qubits)
  const numQubits = level.ions.length || 1;
  const qs = new QuantumSystem(numQubits);

  // Apply initial gates
  for (const gate of level.initialGates) {
    if (gate === 'H') {
      for (let i = 0; i < numQubits; i++) qs.applyH(i);
    } else if (gate === 'X') {
      for (let i = 0; i < numQubits; i++) qs.applyX(i);
    }
  }

  // Trace the laser to determine which ions are hit
  const traceResult = level.trace(laserGates);
  const hitIons = traceResult.hitIons;
  const sourceHitIons = traceResult.sourceHitIons || [];

  // If no ions were hit, return unknown state for all
  if (hitIons.length === 0) {
    const states = level.ions.map((_, ionIndex) => ({
      ionIndex,
      state: '—' as const,
      p0: '—' as const,
      p1: '—' as const
    }));
    return { states, canMeasure: false };
  }

  // Apply gates based on which ions were hit
  for (let sIdx = 0; sIdx < laserGates.length; sIdx++) {
    const gates = laserGates[sIdx] || [];
    const sHits = sourceHitIons[sIdx] || [];
    
    for (const gate of gates) {
      if (gate === 'X') {
        if (sHits.length > 0) qs.applyX(sHits[0]!);
      } else if (gate === 'H') {
        if (sHits.length > 0) qs.applyH(sHits[0]!);
      } else if (gate === 'CNOT') {
        if (sHits.length >= 2) qs.applyCNOT(sHits[0]!, sHits[1]!);
      }
    }
  }

  // Cache the last quantum system for measurement
  lastQuantumSystem = qs;

  // Build state objects for each ion
  const states: IonQuantumState[] = [];
  for (let i = 0; i < numQubits; i++) {
    let state: QuantumState | '—' = '—';
    let p0: string | '—' = '—';
    let p1: string | '—' = '—';

    if (measuredValues && measuredValues[i] !== undefined) {
      // If already measured, show the measured state
      state = measuredValues[i] === 0 ? '|0⟩' : '|1⟩';
      p0 = measuredValues[i] === 0 ? '100%' : '0%';
      p1 = measuredValues[i] === 1 ? '100%' : '0%';
    } else if (hitIons.includes(i)) {
      // If this ion was hit, show its calculated state
      // Use old getLabelFromMath for single qubit systems
      state = numQubits === 1 ? getLabelFromMath(qs) : getLabelForQubit(qs, i);
      const [prob0, prob1] = qs.getQubitProbability(i);
      // Format probabilities as percentages with 1 decimal place
      p0 = Math.round(prob0 * 100) + '%';
      p1 = Math.round(prob1 * 100) + '%';
    }

    states.push({ ionIndex: i, state, p0, p1 });
  }

  return { states, canMeasure: hitIons.length > 0 };
}

// Win conditions
// --------------
export function checkWinCondition(wc: string, states: IonQuantumState[]): boolean {
  if (!states) return false;

  // Any Qubit Count
  if (wc === 'any') return true;
  if (wc === 'normal') return states.every(s => s.state === '|0⟩' || s.state === '|1⟩');
  if (wc === 'all-0') return states.every(s => s.state === '|0⟩');
  if (wc === 'all-1') return states.every(s => s.state === '|1⟩');
  
  // Superposition
  if (wc === 'superposition') return states.every(s => s.state === '|+⟩' || s.state === '|-⟩');
  if (wc === 'positive-superposition') return states.every(s => s.state === '|+⟩');
  if (wc === 'negative-superposition') return states.every(s => s.state === '|-⟩');

  // 2 Qubit Specific
  if (wc === '01' || wc === '01') return states.length === 2 && states[0]?.state === '|0⟩' && states[1]?.state === '|1⟩';
  if (wc === '10') return states.length === 2 && states[0]?.state === '|1⟩' && states[1]?.state === '|0⟩';

  return false;
}

interface LevelConfig {
  name: string;
  cols: number;
  rows: number;
  sources: Array<{ col: number; row: number; dir?: string }>;
  ions: Array<{ col: number; row: number }>;
  walls?: Array<{ col: number; row: number; type?: WallType }>;
  hint?: string;
  goal?: string;
  winCondition?: string;
  availableGates?: string[];
  gatePlacementPositions?: Array<[number, number]>;
  showResetButton?: boolean;
  preInitialized?: boolean;
  automateMeasurement?: boolean;
  initialGates?: string[];
  popups?: Array<{ title: string; text: string; trigger?: string }>;
  requiredGateCount?: number | number[] | null;
  prePlacedGates?: string[][];
  lockedGateIndices?: number[];
  gateInventory?: Record<string, number>;
}

interface TraceSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  colours: string[];
}

export class Level {
  name: string;
  cols: number;
  rows: number;
  sources: Array<{ col: number; row: number; dir?: string }>;
  ions: Array<{ col: number; row: number }>;
  walls: Array<{ col: number; row: number; type: WallType }>;
  winCondition: string;
  hint: string;
  goal: string;
  grid: (string | null)[][];
  availableGates: string[];
  gatePlacementPositions: Array<[number, number]>;
  showResetButton: boolean;
  preInitialized: boolean;
  automateMeasurement: boolean;
  initialGates: string[];
  popups: Array<{ title: string; text: string; trigger?: string }>;
  requiredGateCount?: number | number[] | null;
  prePlacedGates?: string[][];
  lockedGateIndices: number[];
  gateInventory: Record<string, number>;

  constructor({ name, cols, rows, sources, ions, walls, hint, goal, winCondition, availableGates, gatePlacementPositions, showResetButton, preInitialized, automateMeasurement, initialGates, popups, requiredGateCount, prePlacedGates, lockedGateIndices, gateInventory }: LevelConfig) {
    this.name = name;
    this.cols = cols;
    this.rows = rows;
    this.sources = (sources || []).map(s => ({ col: s.col, row: s.row, dir: s.dir ?? 'right' }));
    this.ions = ions || [];
    this.walls = (walls || []).map(w => ({ col: w.col, row: w.row, type: w.type ?? 'standard' }));
    this.winCondition = winCondition || 'any';
    this.hint = hint || 'Route the beam to the ions';
    this.goal = goal || '—';
    this.grid = Array.from({ length: rows }, () => Array(cols).fill(null));
    this.availableGates = availableGates || [];
    this.gatePlacementPositions = gatePlacementPositions || [];
    this.showResetButton = showResetButton || false;
    this.preInitialized = preInitialized || false;
    this.automateMeasurement = automateMeasurement || false;
    this.initialGates = initialGates || [];
    this.popups = popups || [];
    this.requiredGateCount = requiredGateCount !== undefined ? requiredGateCount : null;
    this.prePlacedGates = prePlacedGates || [];
    this.lockedGateIndices = lockedGateIndices || [];
    this.gateInventory = gateInventory || {};
  }

  isFixed(col: number, row: number) {
    return [...this.sources, ...this.ions, ...this.walls].some((p: { col: number; row: number }) => p.col === col && p.row === row);
  }

  trace(sourceGates: string[][]) {
    const moves = { right: [1, 0], left: [-1, 0], up: [0, -1], down: [0, 1] };
    const allSegs: TraceSegment[] = [];
    const allHitIons: number[] = [];
    const sourceHitIons: number[][] = [];

    // Infinite loop safety
    const MAX_SEGMENTS = 500; 

    for (let sIdx = 0; sIdx < this.sources.length; sIdx++) {
      const src = this.sources[sIdx];
      if (!src) continue;

      const gates = sourceGates[sIdx] || [];
      let activeColours: string[] = [];
      if (gates.includes('X')) activeColours.push('orange');
      if (gates.includes('H')) activeColours.push('purple');
      if (gates.includes('CNOT')) activeColours.push('green');
      if (activeColours.length === 0) activeColours = ['cyan'];

      const segs: TraceSegment[] = [];
      const hitIons: number[] = [];

      let col = src.col;
      let row = src.row;
      let dir: string = src.dir ?? 'right';

      let safetyCounter = 0;

      while (true) {

        safetyCounter++;
        if (safetyCounter > MAX_SEGMENTS) {
          console.warn(`Infinite loop detected on laser ${sIdx}! Terminating trace.`);
          break;
        }
        
        const [dc, dr] = moves[dir as keyof typeof moves] as [number, number];
        const new_column = col + dc, new_row = row + dr;

        segs.push({
          x1: col * CELL + CELL / 2, y1: row * CELL + CELL / 2,
          x2: new_column * CELL + CELL / 2, y2: new_row * CELL + CELL / 2,
          colours: [...activeColours]
        });

        if (new_column < 0 || new_column >= this.cols || new_row < 0 || new_row >= this.rows) break;
        col = new_column;
        row = new_row;

          for (let i = 0; i < this.ions.length; i++) {
            const ion = this.ions[i]!;
            if (col === ion.col && row === ion.row && !hitIons.includes(i)) {
              hitIons.push(i);
              if (!allHitIons.includes(i)) allHitIons.push(i);
            }
          }

        const wall = this.walls.find(w => w.col === col && w.row === row);
        if (wall) {
          if (wall.type === 'standard' || wall.type === 'all') {
            activeColours = [];
          } else {
            activeColours = activeColours.filter(c => c !== wall.type);
          }
          if (activeColours.length === 0) break;
        }

        const m = this.grid[row]![col]!;
        if (m === 'fwd') dir = { right: 'up', up: 'right', left: 'down', down: 'left' }[dir]!;
        if (m === 'back') dir = { right: 'down', down: 'right', left: 'up', up: 'left' }[dir]!;
      }
      sourceHitIons.push(hitIons);
      for (const s of segs) allSegs.push(s);
      
    }

    return { segs: allSegs, hitIons: allHitIons, sourceHitIons };
  }
}

export const WELCOME_POPUP = {
  title: 'Welcome to the Quantum Laser Puzzle',
  text: 'Explore how quantum logic transitions affect the probability state and phase of a qubit prior to final measurement.'
};