import { describe, expect, it, vi } from 'vitest';

import { QuantumSystem } from '../../quantumsystem';

// Tests the QuantumSystem class and its methods

describe('QuantumSystem', () => {
  it('initialises in |0> state for all ions', () => {
    const qs = new QuantumSystem(2);

    expect(qs.getNumQubits()).toBe(2);
    expect(qs.getProbability(0)).toBe(1);
    expect(qs.getProbability(1)).toBe(0);
    expect(qs.getProbability(2)).toBe(0);
    expect(qs.getProbability(3)).toBe(0);
  });

  it('validates qubit bounds', () => {
    expect(() => new QuantumSystem(0)).toThrow('Number of qubits must be an integer between 1 and 6');
    expect(() => new QuantumSystem(7)).toThrow('Number of qubits must be an integer between 1 and 6');
  });

  it('applies X gate correctly', () => {
    const qs = new QuantumSystem(1);
    qs.applyX(0);

    expect(qs.getProbability(0)).toBe(0);
    expect(qs.getProbability(1)).toBe(1);
  });

  it('applies H gate correctly', () => {
    const qs = new QuantumSystem(1);
    qs.applyH(0);

    const [p0, p1] = qs.getQubitProbability(0);
    expect(p0).toBeCloseTo(0.5, 6);
    expect(p1).toBeCloseTo(0.5, 6);
  });

  it('applies CNOT correctly when control is |1>', () => {
    const qs = new QuantumSystem(2);
    qs.applyX(0);
    qs.applyCNOT(0, 1);

    const [q0p0, q0p1] = qs.getQubitProbability(0);
    const [q1p0, q1p1] = qs.getQubitProbability(1);

    expect(q0p0).toBe(0);
    expect(q0p1).toBe(1);
    expect(q1p0).toBe(0);
    expect(q1p1).toBe(1);
  });

  it('applies CNOT correctly when control is |0>', () => {
    const qs = new QuantumSystem(2);
    qs.applyCNOT(0, 1);

    const [q0p0, q0p1] = qs.getQubitProbability(0);
    const [q1p0, q1p1] = qs.getQubitProbability(1);

    expect(q0p0).toBe(1);
    expect(q0p1).toBe(0);
    expect(q1p0).toBe(1);
    expect(q1p1).toBe(0);
  });

  it('throws error when CNOT control and target are the same', () => {
    const qs = new QuantumSystem(2);
    expect(() => qs.applyCNOT(0, 0)).toThrow('Control and target qubits cannot be the same');
  });

  it('measures superposition correctly (forces measurments)', () => {
    const qs = new QuantumSystem(1);
    qs.applyH(0);

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const resultLow = qs.measure();

    randomSpy.mockReturnValue(0.9);
    const resultHigh = qs.measure();

    randomSpy.mockRestore();

    expect(resultLow).toEqual([0]);
    expect(resultHigh).toEqual([1]);
  });

  it('prevents direct modification of getAmplitude and getStateVector', () => {
    const qs = new QuantumSystem(1);

    // Modify the returned amplitude and state vector to corrupt state
    const amp = qs.getAmplitude(0);
    amp.real = 0;

    const vec = qs.getStateVector();
    vec[0]!.real = 0;

    // Check that the internal state is unchanged
    expect(qs.getAmplitude(0).real).toBe(1);
    expect(qs.getStateVector()[0]!.real).toBe(1);
  });

  it('validates state and qubit indices', () => {
    const qs = new QuantumSystem(1);

    expect(() => qs.getAmplitude(-1)).toThrow('State index -1 out of bounds');
    expect(() => qs.getProbability(2)).toThrow('State index 2 out of bounds');
    expect(() => qs.getQubitProbability(1)).toThrow('Qubit index 1 out of range [0, 0]');
    expect(() => qs.applyX(1)).toThrow('Qubit index 1 out of range [0, 0]');
  });
});