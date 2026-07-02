import { describe, expect, it } from 'vitest';

import { CELL, Level } from '../../quantumgame';

// Testing the level class and trace method

describe('Level trace and board logic', () => {
  it('traces a straight beam and detects ion hits', () => {
    const level = new Level({
      name: 'Trace straight',
      cols: 5,
      rows: 1,
      sources: [{ col: 0, row: 0, dir: 'right' }],
      ions: [{ col: 2, row: 0 }],
      walls: [],
    });

    const result = level.trace([[]]);

    expect(result.hitIons).toEqual([0]);
    expect(result.sourceHitIons[0]).toEqual([0]);
    expect(result.segs.length).toBeGreaterThan(0);
  });

  it('handles mirrors by changing direction at 90 degree angles', () => {
    const level = new Level({
      name: 'Mirror bounce',
      cols: 4,
      rows: 4,
      sources: [{ col: 0, row: 2, dir: 'right' }],
      ions: [{ col: 1, row: 1 }],
      walls: [],
    });

    level.grid[2]![1] = 'fwd';

    const result = level.trace([[]]);
    const segs = result.segs;

    expect(segs.length).toBeGreaterThanOrEqual(2);
    expect(segs[0]?.x1).toBe(CELL / 2);
    expect(segs[0]?.y1).toBe(2 * CELL + CELL / 2);
    expect(result.hitIons).toEqual([0]);
  });

  it('stops beam when standard wall blocks all colours', () => {
    const level = new Level({
      name: 'Wall block all',
      cols: 5,
      rows: 1,
      sources: [{ col: 0, row: 0, dir: 'right' }],
      ions: [{ col: 4, row: 0 }],
      walls: [{ col: 2, row: 0, type: 'standard' }],
    });

    const result = level.trace([[]]);

    expect(result.hitIons).toEqual([]);
  });

  it('filters matching colour on colour-specific walls', () => {
    const level = new Level({
      name: 'Color wall block',
      cols: 5,
      rows: 1,
      sources: [{ col: 0, row: 0, dir: 'right' }],
      ions: [{ col: 4, row: 0 }],
      walls: [{ col: 2, row: 0, type: 'orange' }],
    });

    const blocked = level.trace([['X']]);
    const allowed = level.trace([['H']]);

    expect(blocked.hitIons).toEqual([]);
    expect(allowed.hitIons).toEqual([0]);
  });

  it('detects fixed board cells correctly', () => {
    const level = new Level({
      name: 'Fixed cells',
      cols: 3,
      rows: 3,
      sources: [{ col: 0, row: 0, dir: 'right' }],
      ions: [{ col: 1, row: 1 }],
      walls: [{ col: 2, row: 2, type: 'standard' }],
    });

    expect(level.isFixed(0, 0)).toBe(true);
    expect(level.isFixed(1, 1)).toBe(true);
    expect(level.isFixed(2, 2)).toBe(true);
    expect(level.isFixed(0, 2)).toBe(false);
  });
});
