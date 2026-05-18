const CELL = 56;

export function applyH(s: number[]) {
  return [
    (s[0]! + s[1]!) / Math.sqrt(2),
    (s[0]! - s[1]!) / Math.sqrt(2)
  ];
}

export function measure(s: number[]) {
  const prob0 = s[0]! ** 2;
  const randomValue = Math.random();
  return randomValue < prob0 ? 0 : 1;
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

  constructor({ name, cols, rows, src, ion, hgates, walls, hint, winCondition, availableGates, gatePlacementPositions, showResetButton }: any) {
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
  }

  isFixed(col: number, row: number) {
    return [this.src, this.ion, ...this.hgates, ...this.walls].some(p => p.col === col && p.row === row);
  }

  trace() {
    const moves = { right: [1, 0], left: [-1, 0], up: [0, -1], down: [0, 1] };
    const segs: any[] = [];
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
    name: '1',
    cols: 12, rows: 8,
    src: { col: 0, row: 2 },
    ion: { col: 11, row: 7 },
    winCondition: 'normal',
    hint: 'Route the beam to excite the ion'
  }),
  new Level({
    name: '2 - The Wall',
    cols: 12, rows: 8,
    src: { col: 0, row: 4 },
    ion: { col: 11, row: 4 },
    walls: [{ col: 6, row: 4 }, { col: 6, row: 5 }, { col: 6, row: 6 }, { col: 6, row: 7 }],
    winCondition: 'normal',
    hint: 'Route the beam to excite the ion'
  }),
  new Level({
    name: '3 - The Hadamard Gate',
    cols: 12, rows: 8,
    src: { col: 0, row: 5 },
    ion: { col: 11, row: 5 },
    availableGates: ['H'],
    gatePlacementPositions: [[6, 2]],
    winCondition: 'superposition',
    hint: 'Route the beam through the Hadamard Gate to create a superposition and excite the ion',
    showResetButton: true
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