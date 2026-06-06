import { QuantumSystem } from './quantumsystem';

export const CELL = 56;

export type QuantumState = '|0⟩' | '|1⟩' | '|+⟩' | '|-⟩';

let lastQuantumSystem: QuantumSystem | null = null;

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
    return lastQuantumSystem.measure()[0]?? 0;
  }
  // fallback
  return Math.random() < 0.5 ? 0 : 1; 
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

export function calculateQuantumState(
  level: Level,
  laserGates: string[],
  measuredValue: number | null
): { state: QuantumState | '—'; p0: string | '—'; p1: string | '—'; canMeasure: boolean } {
  // If already measured, keep showing the measured state
  if (measuredValue !== null) {
    return {
      state: measuredValue === 0 ? '|0⟩' : '|1⟩',
      p0: measuredValue === 0 ? '100%' : '0%',
      p1: measuredValue === 1 ? '100%' : '0%',
      canMeasure: false
    };
  }

  const { hitIon, hitH } = level.trace();

  if (!hitIon) { // If the beam hasn't hit the ion, we can't determine the state
    return {
      state: '—',
      p0: '—',
      p1: '—',
      canMeasure: false
    };
  }

  const qs = new QuantumSystem(1);

  // Apply gates in the order they were hit
  // Start with initial gates
  for (const gate of level.initialGates) {
    if (gate === 'H') {
      qs.applyH(0);
    } else if (gate === 'X') {
      qs.applyX(0);
    }
  }

  for (const gate of laserGates) {
    if (gate === 'H') {
      qs.applyH(0);
    } else if (gate === 'X') {
      qs.applyX(0);
    }
  }

  // Cache the last quantum system for measurement 
  lastQuantumSystem = qs;

  const state = getLabelFromMath(qs);
  const [prob0, prob1] = qs.getQubitProbability(0);
  const p0 = Math.round(prob0 * 100) + '%';
  const p1 = Math.round(prob1 * 100) + '%';

  return { state, p0, p1, canMeasure: true };
}

interface LevelConfig {
  name: string;
  cols: number;
  rows: number;
  src: { col: number; row: number };
  ion: { col: number; row: number };
  hgates?: Array<{ col: number; row: number }>;
  walls?: Array<{ col: number; row: number }>;
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
  requiredGateCount?: number;
  lockedGateIndices?: number[];
  gateInventory?: Record<string, number>;
}

interface TraceSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  afterH: boolean;
}

export class Level {
  name: string;
  cols: number;
  rows: number;
  src: { col: number; row: number };
  ion: { col: number; row: number };
  hgates: Array<{ col: number; row: number }>;
  walls: Array<{ col: number; row: number }>;
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
  requiredGateCount: number | null;
  lockedGateIndices: number[];
  gateInventory: Record<string, number>;

  constructor({ name, cols, rows, src, ion, hgates, walls, hint, goal, winCondition, availableGates, gatePlacementPositions, showResetButton, preInitialized, automateMeasurement, initialGates, popups, requiredGateCount, lockedGateIndices, gateInventory }: LevelConfig) {
    this.name = name;
    this.cols = cols;
    this.rows = rows;
    this.src = src;
    this.ion = ion;
    this.hgates = hgates || [];
    this.walls = walls || [];
    this.winCondition = winCondition || 'any';
    this.hint = hint || 'Route the beam to the ion';
    this.goal = goal || '—';
    this.grid = Array.from({ length: rows }, () => Array(cols).fill(null));
    this.availableGates = availableGates || [];
    this.gatePlacementPositions = gatePlacementPositions || [];
    this.showResetButton = showResetButton || false;
    this.preInitialized = preInitialized || false;
    this.automateMeasurement = automateMeasurement || false;
    this.initialGates = initialGates || [];
    this.popups = popups || [];
    this.requiredGateCount = requiredGateCount || null;
    this.lockedGateIndices = lockedGateIndices || [];
    this.gateInventory = gateInventory || {};
  }

  isFixed(col: number, row: number) {
    return [this.src, this.ion, ...this.hgates, ...this.walls].some(p => p.col === col && p.row === row);
  }

  trace() {
    const moves = { right: [1, 0], left: [-1, 0], up: [0, -1], down: [0, 1] };
    const segs: TraceSegment[] = [];
    let { col, row } = this.src;
    let dir: string = 'right', hitIon = false, hitH = false;

    while (true) {
      const [dc, dr] = moves[dir as keyof typeof moves] as [number, number];
      const new_column = col + dc, new_row = row + dr;

      segs.push({
        x1: col * CELL + CELL / 2, y1: row * CELL + CELL / 2,
        x2: new_column * CELL + CELL / 2, y2: new_row * CELL + CELL / 2,
        afterH: hitH
      });

      if (new_column < 0 || new_column >= this.cols || new_row < 0 || new_row >= this.rows) break;
      col = new_column;
      row = new_row;

      if (col === this.ion.col && row === this.ion.row) { hitIon = true; break; }
      if (this.walls.some(w => w.col === col && w.row === row)) break;
      if (this.hgates.some(g => g.col === col && g.row === row)) hitH = !hitH;

      const m = this.grid[row]![col]!;
      if (m === 'fwd') dir = { right: 'up', up: 'right', left: 'down', down: 'left' }[dir]!;
      if (m === 'back') dir = { right: 'down', down: 'right', left: 'up', up: 'left' }[dir]!;
    }

    return { segs, hitIon, hitH };
  }
}

export const WELCOME_POPUP = {
  title: 'Welcome to the Quantum Laser Puzzle',
  text: 'Explore how quantum logic transitions affect the probability state and phase of a qubit prior to final measurement.'
};