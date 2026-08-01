import { describe, expect, it } from 'vitest';

import { LEVELS } from '../../levels';

describe('LEVELS integrity', () => {
  it('has all levels', () => {
    expect(LEVELS.length).equal(20);

    const names = LEVELS.map((level) => level.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  it('keeps board entities inside level bounds', () => {
    for (const level of LEVELS) {
      expect(level.cols).toBeGreaterThan(0);
      expect(level.rows).toBeGreaterThan(0);

      for (const source of level.sources) {
        expect(source.col).toBeGreaterThanOrEqual(0);
        expect(source.row).toBeGreaterThanOrEqual(0);
        expect(source.col).toBeLessThan(level.cols);
        expect(source.row).toBeLessThan(level.rows);
      }

      for (const ion of level.ions) {
        expect(ion.col).toBeGreaterThanOrEqual(0);
        expect(ion.row).toBeGreaterThanOrEqual(0);
        expect(ion.col).toBeLessThan(level.cols);
        expect(ion.row).toBeLessThan(level.rows);
      }

      for (const wall of level.walls) {
        expect(wall.col).toBeGreaterThanOrEqual(0);
        expect(wall.row).toBeGreaterThanOrEqual(0);
        expect(wall.col).toBeLessThan(level.cols);
        expect(wall.row).toBeLessThan(level.rows);
      }
    }
  });

  it('keeps pre-placed and locked gate indices correct', () => {
    for (const level of LEVELS) {
      const prePlaced = level.prePlacedGates ?? [];
      const flat = prePlaced.flat(Infinity);

      for (const lockedIndex of level.lockedGateIndices) {
        if (lockedIndex >= flat.length) {
          console.error(`Error in level:`, level); 
        }
        expect(lockedIndex).toBeGreaterThanOrEqual(0);
        expect(lockedIndex).toBeLessThan(flat.length);
      }

      expect(prePlaced.length).toBeLessThanOrEqual(level.sources.length);
    }
  });

  it('uses valid gate names in inventory and available gate lists', () => {
    const allowed = new Set(['X', 'H', 'CNOT']);

    for (const level of LEVELS) {
      for (const gate of level.availableGates) {
        expect(allowed.has(gate)).toBe(true);
      }

      for (const gate of Object.keys(level.gateInventory)) {
        expect(allowed.has(gate)).toBe(true);
        expect(level.gateInventory[gate]).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('keeps optional requiredGateCount values valid', () => {
    for (const level of LEVELS) {
      const required = level.requiredGateCount;
      if (required === null || required === undefined) continue;

      if (Array.isArray(required)) {
        expect(required.length).toBeLessThanOrEqual(level.sources.length);
        for (const n of required) {
          expect(Number.isInteger(n)).toBe(true);
          expect(n).toBeGreaterThanOrEqual(0);
        }
      } else {
        expect(Number.isInteger(required)).toBe(true);
        expect(required).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
