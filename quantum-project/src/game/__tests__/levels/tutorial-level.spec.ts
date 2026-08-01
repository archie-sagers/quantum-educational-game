import { describe, expect, it } from 'vitest';

import { TUTORIAL_LEVEL } from '../../levels';
import { calculateQuantumState, checkWinCondition } from '../../quantumgame';

describe('Tutorial level', () => {
  it('keeps the sandbox configured for the introductory gate walkthrough', () => {
    expect(TUTORIAL_LEVEL.availableGates).toEqual(['X', 'H']);
    expect(TUTORIAL_LEVEL.preInitialized).toBe(true);
    expect(TUTORIAL_LEVEL.showResetButton).toBe(true);
    expect(TUTORIAL_LEVEL.goal).toBe('|1⟩');
    expect(TUTORIAL_LEVEL.winCondition).toBe('all-1');
    expect(TUTORIAL_LEVEL.walls).toHaveLength(7);

    const xResult = calculateQuantumState(TUTORIAL_LEVEL, [['X']], null);
    const hResult = calculateQuantumState(TUTORIAL_LEVEL, [['H']], null);

    expect(xResult.states[0]?.state).toBe('|1⟩');
    expect(checkWinCondition(TUTORIAL_LEVEL.winCondition, xResult.states)).toBe(true);
    expect(hResult.states[0]?.state).toBe('|+⟩');
  });
});