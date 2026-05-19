const CELL = 56;

export function applyH(s: number[]) {
  return [
    (s[0]! + s[1]!) / Math.sqrt(2),
    (s[0]! - s[1]!) / Math.sqrt(2)
  ];
}

export function applyX(s: number[]) {
  return [s[1]!, s[0]!];
}

export function measure(s: number[]) {
  const prob0 = s[0]! ** 2;
  const randomValue = Math.random();
  return randomValue < prob0 ? 0 : 1;
}

export function getBlochAngle(state: string): number | null {
  const angleMap: Record<string, number> = {
    '|0⟩': 90,
    '|+⟩': 0,
    '|-⟩': 180,
    '|1⟩': 270
  };
  return angleMap[state] ?? null;
}

export function getBlochLabel(state: string): string {
  const labelMap: Record<string, string> = {
    '|0⟩': '|0⟩ Ground state',
    '|+⟩': '|+⟩ Superposition',
    '|-⟩': '|-⟩ Superposition',
    '|1⟩': '|1⟩ Excited state'
  };
  return labelMap[state] ?? 'No state';
}

export function calculateQuantumState(
  level: Level,
  laserGates: string[],
  measuredValue: number | null
): { state: string; p0: string; p1: string; canMeasure: boolean } {
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

  if (!hitIon) {
    return {
      state: '—',
      p0: '—',
      p1: '—',
      canMeasure: false
    };
  }

  let s = [1, 0]; // Start in |0⟩

  // Apply laser gates
  for (const gate of laserGates) {
    if (gate === 'H') s = applyH(s);
    if (gate === 'X') s = applyX(s);
  }

  if (hitH) s = applyH(s);

  const p0 = Math.round(s[0]! ** 2 * 100) + '%';
  const p1 = Math.round(s[1]! ** 2 * 100) + '%';

  // Determine the state
  const xGateCount = laserGates.filter(g => g === 'X').length;
  const hGateCount = laserGates.filter(g => g === 'H').length;

  // Base state after X gates
  const baseState = xGateCount % 2 === 1 ? '|1⟩' : '|0⟩';

  // Check for superposition from H gates
  const hasSuperposition = (hGateCount > 0 && hGateCount % 2 === 1) || hitH;
  const state = hasSuperposition
    ? (baseState === '|0⟩' ? '|+⟩' : '|-⟩')
    : baseState;

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
  winCondition?: string;
  availableGates?: string[];
  gatePlacementPositions?: Array<[number, number]>;
  showResetButton?: boolean;
  preInitialized?: boolean;
  popups?: Array<{ title: string; text: string; trigger?: string }>;
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
  grid: (string | null)[][];
  availableGates: string[];
  gatePlacementPositions: Array<[number, number]>;
  showResetButton: boolean;
  preInitialized: boolean;
  popups: Array<{ title: string; text: string; trigger?: string }>;

  constructor({ name, cols, rows, src, ion, hgates, walls, hint, winCondition, availableGates, gatePlacementPositions, showResetButton, preInitialized, popups }: LevelConfig) {
    this.name = name;
    this.cols = cols;
    this.rows = rows;
    this.src = src;
    this.ion = ion;
    this.hgates = hgates || [];
    this.walls = walls || [];
    this.winCondition = winCondition || 'any';
    this.hint = hint || 'Route the beam to the ion';
    this.grid = Array.from({ length: rows }, () => Array(cols).fill(null));
    this.availableGates = availableGates || [];
    this.gatePlacementPositions = gatePlacementPositions || [];
    this.showResetButton = showResetButton || false;
    this.preInitialized = preInitialized || false;
    this.popups = popups || [];
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

export const LEVELS = [
  new Level({
    name: '1 - Initialisation and Measurement',
    cols: 12, rows: 8,
    src: { col: 0, row: 4 },
    ion: { col: 11, row: 4 },
    winCondition: 'normal',
    hint: 'Press reset to initialise the ion, then measure it',
    showResetButton: true,
    preInitialized: false,
    popups: [
      { title: 'Unknown State', text: 'The ion is in an unknown quantum state. It needs optical pumping to reset it to a ground state.', trigger: 'onLoad' },
      { title: 'Step 1', text: 'Click the Reset button to initialize the ion to the ground state |0⟩.', trigger: 'onLoad' },
      { title: 'Step 2', text: 'Click the Measure button to read out the state of the ion.', trigger: 'onReset' }
    ]
  }),
  new Level({
    name: '2 - Reflection',
    cols: 12, rows: 8,
    src: { col: 0, row: 4 },
    ion: { col: 11, row: 4 },
    walls: [{ col: 6, row: 3 }, { col: 6, row: 4 }, { col: 6, row: 5 }],
    winCondition: 'normal',
    hint: 'Place mirrors to route the laser around the wall and hit the ion',
    showResetButton: true,
    preInitialized: false,
    popups: [
      { title: 'Mirrors', text: 'The wall is blocking the direct path. Use mirrors to route the laser beam around it.', trigger: 'onLoad' },
      { title: 'How to Place Mirrors', text: 'Left-click on the grid to place or rotate mirrors. Right-click to remove them.', trigger: 'onLoad' },
      { title: 'Reset and Measure', text: 'Once you route the beam to the ion, press Reset, then Measure to complete the level.', trigger: 'onLaserToIon' }
    ]
  }),
  new Level({
    name: '3 - The X-Gate',
    cols: 12, rows: 8,
    src: { col: 0, row: 4 },
    ion: { col: 11, row: 4 },
    availableGates: ['X'],
    winCondition: 'normal',
    hint: 'Select the X-gate from the laser menu and measure the ion',
    showResetButton: false,
    preInitialized: true,
    popups: [
      { title: 'Ion Initialised', text: 'The ion has been initialised to the ground state |0⟩ for you.', trigger: 'onLoad' },
      { title: 'The X-Gate', text: 'Click on the laser source to open the laser gates menu.', trigger: 'onLoad' },
      { title: 'Apply X-Gate', text: 'Select the red X-gate and drag it to the laser. This will flip the qubit to |1⟩.', trigger: 'onLaserGatesOpen' }
    ]
  }),
  new Level({
    name: '4 - The Hadamard Gate',
    cols: 12, rows: 8,
    src: { col: 0, row: 5 },
    ion: { col: 11, row: 7 },
    walls: [{ col: 9, row: 4 }, { col: 9, row: 5 }, { col: 9, row: 6 }, { col: 9, row: 7 }],
    availableGates: ['H'],
    gatePlacementPositions: [[6, 2]],
    winCondition: 'superposition',
    hint: 'Route the beam through the Hadamard Gate to create a superposition and excite the ion',
    showResetButton: true
  }),
  new Level({
    name: '5 - Cancellation',
    cols: 12, rows: 8,
    src: { col: 0, row: 0 },
    ion: { col: 11, row: 0 },
    availableGates: ['H', 'H'],
    gatePlacementPositions: [[1, 0], [8, 3]],
    winCondition: 'normal',
    hint: 'Pass through BOTH H-gates to cancel out the superposition and return to |0>',
    showResetButton: true
  })
];