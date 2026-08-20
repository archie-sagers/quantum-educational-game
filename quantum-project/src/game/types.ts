// Quantum States
// ----------------------------------
export type QuantumState = '|0⟩' | '|1⟩' | '|+⟩' | '|-⟩';

// Ion's index, quantum state and measurement probabilities.
export interface IonQuantumState {
  ionIndex: number;
  state: QuantumState | '—';
  p0: string;
  p1: string;
}

// Level and Game Board Types
// ----------------------------------
export type WallType = 'all' | 'standard' | 'cyan' | 'purple' | 'green' | 'orange';

export interface LevelConfig {
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
  manualLink?: { label: string; sectionId: string };
}

// Lab Level Config Types
export interface LevelConfigLocal 
  extends Pick<LevelConfig, 'name' | 'cols' | 'rows' | 'sources' | 'ions' | 'walls' | 'availableGates' | 'prePlacedGates' | 'lockedGateIndices' | 'gateInventory' | 'hint' | 'goal' | 'winCondition'> {
  mirrors?: Array<{ col: number; row: number; dir: 'fwd' | 'back' }>
  lockedTo?: Record<string, string>
}

// Segment of laser beam path
export interface TraceSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  colours: string[];
}

// Minigame Types
// ----------------------------------

// Doppler Coooling Minigame
export interface Photon {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
}

// Trap Minigame
export interface Ion {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isDragging: boolean;
  inTrap: boolean;
  timeInTrap: number;
}

// Tutorial Types
// ----------------------------------
export type TutorialStepKey = 'goal' | 'manual' | 'hint' | 'level' | 'walls' | 'reset' | 'measure' | 'history' | 'bloch';