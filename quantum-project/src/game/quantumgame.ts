const CELL = 56;

export type QuantumState = '|0⟩' | '|1⟩' | '|+⟩' | '|-⟩';

type Complex = { real: number; imaginary: number };

class TwoQubitSystem {
  public amplitudes: Complex[] = [
    // Two qubit system. Starts in |00⟩ state
    { real: 1, imaginary: 0 }, // |00⟩
    { real: 0, imaginary: 0 }, // |01⟩
    { real: 0, imaginary: 0 }, // |10⟩
    { real: 0, imaginary: 0 } // |11⟩
  ];

  applyHadamardQ0() {
    const factor = 1 / Math.sqrt(2);
    const newAmps = [...this.amplitudes];

    // [0] = |00⟩, [1] = |01⟩, [2] = |10⟩, [3] = |11⟩

    newAmps[0] = this.scale(this.add(this.amplitudes[0]!, this.amplitudes[2]!), factor);
    newAmps[2] = this.scale(this.sub(this.amplitudes[0]!, this.amplitudes[2]!), factor);
    
    newAmps[1] = this.scale(this.add(this.amplitudes[1]!, this.amplitudes[3]!), factor);
    newAmps[3] = this.scale(this.sub(this.amplitudes[1]!, this.amplitudes[3]!), factor);

    this.amplitudes = newAmps;
  }

  applyHadamardQ1() {
    const factor = 1 / Math.sqrt(2);
    const newAmps = [...this.amplitudes];

    newAmps[0] = this.scale(this.add(this.amplitudes[0]!, this.amplitudes[1]!), factor);
    newAmps[1] = this.scale(this.sub(this.amplitudes[0]!, this.amplitudes[1]!), factor);
    
    newAmps[2] = this.scale(this.add(this.amplitudes[2]!, this.amplitudes[3]!), factor);
    newAmps[3] = this.scale(this.sub(this.amplitudes[2]!, this.amplitudes[3]!), factor);

    this.amplitudes = newAmps;
  }

  applyXQ0() {
    // X on Q0 flips |0x⟩ and |1x⟩
    // Swap |00⟩, |10⟩ and |01⟩, |11⟩
    const temp0 = this.amplitudes[0]!;
    this.amplitudes[0] = this.amplitudes[2]!;
    this.amplitudes[2] = temp0;

    const temp1 = this.amplitudes[1]!;
    this.amplitudes[1] = this.amplitudes[3]!;
    this.amplitudes[3] = temp1;
  }

  applyXQ1() {
    // X on Q1 flips |x0⟩ and |x1⟩
    // Swap |00⟩, |01⟩ and |10⟩, |11⟩
    const temp0 = this.amplitudes[0]!;
    this.amplitudes[0] = this.amplitudes[1]!;
    this.amplitudes[1] = temp0;

    const temp2 = this.amplitudes[2]!;
    this.amplitudes[2] = this.amplitudes[3]!;
    this.amplitudes[3] = temp2;
  }

  applyCNOT_01() {
    const temp = this.amplitudes[2]!;
    // [0] and [1] stay the same as the control (left qubit) is |0⟩, but [2] and [3] swap
    // use temp variable to avoid overwriting before swap
    this.amplitudes[2] = this.amplitudes[3]!;
    this.amplitudes[3] = temp;
  }

  applyCNOT_10() {
    const temp = this.amplitudes[1]!;
    // [0] and [2] stay the same as the control (right qubit) is |0⟩, but [1] and [3] swap
    this.amplitudes[1] = this.amplitudes[3]!;
    this.amplitudes[3] = temp;
  }

  measure(): [number, number] {
    // Uses the Born rule to simulate measurement based on probabilities
    // Returns a random outcome based on those probabilities
    const r = Math.random();

    // Calculate probabilities for each state
    const p00 = this.amplitudes[0]!.real ** 2 + this.amplitudes[0]!.imaginary ** 2;
    const p01 = this.amplitudes[1]!.real ** 2 + this.amplitudes[1]!.imaginary ** 2;
    const p10 = this.amplitudes[2]!.real ** 2 + this.amplitudes[2]!.imaginary ** 2;

    if (r < p00) return [0, 0];
    if (r < p00 + p01) return [0, 1];
    if (r < p00 + p01 + p10) return [1, 0];
    else return [1, 1]
  }

  private add(a: Complex, b: Complex): Complex {
    return { real: a.real + b.real, imaginary: a.imaginary + b.imaginary };
  }

  private sub(a: Complex, b: Complex): Complex {
    return { real: a.real - b.real, imaginary: a.imaginary - b.imaginary };
  }

  private scale(a: Complex, s: number): Complex {
    return { real: a.real * s, imaginary: a.imaginary * s };
  }
}

function applyGate(state: QuantumState, gate: string): QuantumState {
  if (gate === 'H') {
    const hMap: Record<QuantumState, QuantumState> = {
      '|0⟩': '|+⟩',
      '|1⟩': '|-⟩',
      '|+⟩': '|0⟩',
      '|-⟩': '|1⟩'
    };
    return hMap[state];
  }

  if (gate === 'X') {
    const xMap: Record<QuantumState, QuantumState> = {
      '|0⟩': '|1⟩',
      '|1⟩': '|0⟩',
      '|+⟩': '|+⟩',
      '|-⟩': '|-⟩'
    };
    return xMap[state];
  }

  return state;
}

function getStateProbabilities(state: QuantumState): [number, number] {
  const probs: Record<QuantumState, [number, number]> = {
    '|0⟩': [1, 0],
    '|1⟩': [0, 1],
    '|+⟩': [0.5, 0.5],
    '|-⟩': [0.5, 0.5]
  };
  return probs[state];
}

export function measure(state: QuantumState): number {
  const [prob0] = getStateProbabilities(state);
  return Math.random() < prob0 ? 0 : 1;
}

export { TwoQubitSystem };

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

  let state: QuantumState = '|0⟩';

  // Apply initial gates (set up starting superposition, etc)
  for (const gate of level.initialGates) {
    state = applyGate(state, gate);
  }

  // Apply laser gates
  for (const gate of laserGates) {
    state = applyGate(state, gate);
  }

  if (hitH) {
    state = applyGate(state, 'H');
  }

  const [prob0, prob1] = getStateProbabilities(state as QuantumState);
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