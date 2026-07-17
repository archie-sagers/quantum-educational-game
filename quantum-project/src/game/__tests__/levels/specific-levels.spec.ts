import { describe, expect, it } from 'vitest';

import { LEVELS } from '../../levels';
import { calculateQuantumState, checkWinCondition } from '../../quantumgame';

describe('Specific level behavior', () => {
  
    it('level 1 requires manual initialisation', () => {
    const level = LEVELS[0];
    expect(level.preInitialized).toBe(false);
    expect(level.showResetButton).toBe(true);
    expect(level.winCondition).toBe('normal');
    expect(level.goal).toBe('|0⟩');
  });
  
    it('level 2 keeps the beam blocked by the cyan wall', () => {
    const level = LEVELS[1];

    const result = calculateQuantumState(level, [[]], null);

    expect(result.canMeasure).toBe(false);
    expect(result.states[0]?.state).toBe('—');
    expect(result.states[0]?.p0).toBe('—');
    expect(result.states[0]?.p1).toBe('—');
  });

    it('level 3 X gate flips the ion to |1⟩', () => {
    const level = LEVELS[2];

    const result = calculateQuantumState(level, [['X']], null);

    expect(level.availableGates).toEqual(['X']);
    expect(result.canMeasure).toBe(false);
    expect(checkWinCondition(level.winCondition, result.states)).toBe(false);
  });

    it('level 5 locks a pre-placed Hadamard gate', () => {
    const level = LEVELS[4];
    expect(level.prePlacedGates).toEqual([['H']]);
    expect(level.lockedGateIndices).toEqual([0]);
    expect(level.gateInventory).toHaveProperty('H', 12);
    expect(level.winCondition).toBe('all-0');
  });

    it('level 6 creates a positive superposition and is configured for auto measurement', () => {
    const level = LEVELS[5];

    const result = calculateQuantumState(level, [['H']], null);

    expect(level.preInitialized).toBe(true);
    expect(level.automateMeasurement).toBe(true);
    expect(level.manualLink?.sectionId).toBe('qm-superposition');
    expect(result.states[0]?.state).toBe('|+⟩');
    expect(checkWinCondition(level.winCondition, result.states)).toBe(true);
  });

    it('level 10 sets up CNOT with orange walls to block X gates', () => {
    const level = LEVELS[9];
    expect(level.availableGates).toContain('CNOT');
    expect(level.availableGates).toContain('X');
    expect(level.walls.length).toBeGreaterThan(0);
    const allOrange = level.walls.every(w => w.type === 'orange');
    expect(allOrange).toBe(true);
  });

    it('level 14 (Uncomputing) enforces exact reverse operations', () => {
    const level = LEVELS[13];
    expect(level.prePlacedGates).toEqual([['H', 'CNOT']]);
    expect(level.lockedGateIndices).toEqual([0, 1]);
    expect(level.requiredGateCount).toBe(4); 
    expect(level.goal).toBe('|0⟩ |0⟩');
    expect(level.winCondition).toBe('all-0');
  });

    it('level 16 enforces per-source gate quotas for GHZ state', () => {
    const level = LEVELS[15];

    expect(level.sources).toHaveLength(2);
    expect(level.ions).toHaveLength(3);
    expect(level.requiredGateCount).toEqual([2, 1]);
    expect(level.gateInventory).toMatchObject({ H: 1, CNOT: 2 });
    expect(level.manualLink?.sectionId).toBe('qm-ghz');
  });

  it('level 19 routes multiple sources for a 4-qubit GHZ state', () => {
    const level = LEVELS[18];

    expect(level.sources).toHaveLength(3);
    expect(level.ions).toHaveLength(4);
    expect(level.requiredGateCount).toEqual([2, 1, 1]);
    expect(level.automateMeasurement).toBe(true);
  });

  it('level 20 (Bell Pairs) isolates qubits with a giant wall', () => {
    const level = LEVELS[19];

    expect(level.sources).toHaveLength(2);
    expect(level.ions).toHaveLength(4);
    expect(level.walls.length).toBe(12);
    const wallIsRow4 = level.walls.every(w => w.row === 4 && w.type === 'standard');
    expect(wallIsRow4).toBe(true);
    expect(level.requiredGateCount).toEqual([2, 2]);
  });
});