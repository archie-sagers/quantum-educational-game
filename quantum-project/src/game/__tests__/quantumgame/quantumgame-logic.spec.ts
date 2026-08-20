import { describe, expect, it, vi } from 'vitest';

import {
  Level,
  calculateQuantumState,
  checkWinCondition,
  getBlochAngle,
  getBlochLabel,
  measureAll,
} from '../../quantumgame';

// Tests blochsphere mapping, win conditions and quantum state calculations

describe('quantumgame logic', () => {
  it('maps Bloch labels and angles', () => {
    expect(getBlochAngle('|+⟩')).toBe(0);
    expect(getBlochAngle('|0⟩')).toBe(90);
    expect(getBlochAngle('unknown')).toBeNull();

    expect(getBlochLabel('|1⟩')).toBe('|1⟩ Excited state');
    expect(getBlochLabel('unknown')).toBe('No state');
  });

  it('evaluates win conditions for single and two qubits', () => {
    const oneQubit = [{ ionIndex: 0, state: '|0⟩' as const, p0: '100%', p1: '0%' }];
    const twoQubits = [
      { ionIndex: 0, state: '|0⟩' as const, p0: '100%', p1: '0%' },
      { ionIndex: 1, state: '|1⟩' as const, p0: '0%', p1: '100%' },
    ];

    expect(checkWinCondition('any', oneQubit)).toBe(true);
    expect(checkWinCondition('all-0', oneQubit)).toBe(true);
    expect(checkWinCondition('all-1', oneQubit)).toBe(false);
    expect(checkWinCondition('01', twoQubits)).toBe(true);
    expect(checkWinCondition('10', twoQubits)).toBe(false);
  });

  it('returns unknown states and disables measurement when no ion is hit', () => {
    const level = new Level({
      name: 'No hit',
      cols: 3,
      rows: 3,
      sources: [{ col: 0, row: 0, dir: 'right' }],
      ions: [{ col: 2, row: 2 }],
      walls: [],
    });

    const result = calculateQuantumState(level, [[]], null);

    expect(result.canMeasure).toBe(false);
    expect(result.states).toEqual([{ ionIndex: 0, state: '—', p0: '—', p1: '—' }]);
  });

  it('calculates hit ion states and measured results', () => {
    const level = new Level({
      name: 'Single ion',
      cols: 4,
      rows: 1,
      sources: [{ col: 0, row: 0, dir: 'right' }],
      ions: [{ col: 2, row: 0 }],
      walls: [],
    });

    const unmeasured = calculateQuantumState(level, [[]], null);
    expect(unmeasured.canMeasure).toBe(true);
    expect(unmeasured.states[0]?.state).toBe('|0⟩');
    expect(unmeasured.states[0]?.p0).toBe('100%');
    expect(unmeasured.states[0]?.p1).toBe('0%');

    const measured = calculateQuantumState(level, [[]], [1]);
    expect(measured.states[0]?.state).toBe('|1⟩');
    expect(measured.states[0]?.p0).toBe('0%');
    expect(measured.states[0]?.p1).toBe('100%');
  });

  it('supports two-qubit gate sequences', () => {
    const level = new Level({
      name: 'Two ions',
      cols: 6,
      rows: 1,
      sources: [{ col: 0, row: 0, dir: 'right' }],
      ions: [
        { col: 2, row: 0 },
        { col: 4, row: 0 },
      ],
      walls: [],
    });

    // Apply X gate to first ion and CNOT to second ion
    const result = calculateQuantumState(level, [['X', 'CNOT']], null);

    expect(result.canMeasure).toBe(true);
    expect(result.states).toHaveLength(2);
    expect(result.states[0]?.state).toBe('|1⟩');
    expect(result.states[1]?.state).toBe('|1⟩');
  });

  it('accepts only correlated GHZ states for the GHZ win condition', () => {
    const level = new Level({
      name: 'GHZ Check',
      cols: 4,
      rows: 1,
      sources: [{ col: 0, row: 0, dir: 'right' }],
      ions: [
        { col: 1, row: 0 },
        { col: 2, row: 0 },
        { col: 3, row: 0 },
      ],
      walls: [],
    });

    calculateQuantumState(level, [[]], null);

    const ghzStates = [
      { ionIndex: 0, state: '|0⟩' as const, p0: '100%', p1: '0%' },
      { ionIndex: 1, state: '|0⟩' as const, p0: '100%', p1: '0%' },
      { ionIndex: 2, state: '|0⟩' as const, p0: '100%', p1: '0%' },
    ];
    expect(checkWinCondition('ghz', ghzStates)).toBe(true);

    calculateQuantumState(level, [['X']], null);

    expect(
      checkWinCondition('ghz', [
        { ionIndex: 0, state: '|1⟩' as const, p0: '0%', p1: '100%' },
        { ionIndex: 1, state: '|0⟩' as const, p0: '100%', p1: '0%' },
        { ionIndex: 2, state: '|0⟩' as const, p0: '100%', p1: '0%' },
      ]),
    ).toBe(false);

    expect(checkWinCondition('ghz', ghzStates.slice(0, 2))).toBe(false);
  });

  it('check lastQuantumSystem is working', () => {
    const level = new Level({
      name: 'Measure cache',
      cols: 4,
      rows: 1,
      sources: [{ col: 0, row: 0, dir: 'right' }],
      ions: [{ col: 2, row: 0 }],
      walls: [],
    });

    calculateQuantumState(level, [['X']], null);

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.123);
    expect(measureAll()).toEqual([1]);
    randomSpy.mockRestore();
  });

  it('falls back to random on error', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.8);

    const all = measureAll();
    expect(all).toHaveLength(1);
    expect(all[0]).toBe(1);

    randomSpy.mockRestore();
  });
});
