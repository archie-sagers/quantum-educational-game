import { describe, expect, it } from 'vitest';

import { ComplexNumber } from '../../math';

// Tests ComplexNumber 

describe('ComplexNumber', () => {
  it('creates complex numbers with default imaginary part', () => {
    const z = new ComplexNumber(5);

    expect(z.real).toBe(5);
    expect(z.imaginary).toBe(0);
  });

  it('adds and subtracts correctly', () => {
    const a = new ComplexNumber(2, 3);
    const b = new ComplexNumber(-1, 4);

    const sum = a.add(b);
    const diff = a.subtract(b);

    expect(sum.real).toBe(1);
    expect(sum.imaginary).toBe(7);
    expect(diff.real).toBe(3);
    expect(diff.imaginary).toBe(-1);
  });

  it('multiplies correctly', () => {
    const a = new ComplexNumber(1, 2);
    const b = new ComplexNumber(3, 4);

    const product = a.multiply(b);

    expect(product.real).toBe(-5);
    expect(product.imaginary).toBe(10);
  });

  it('scales correctly', () => {
    const a = new ComplexNumber(3, -2);
    const scaled = a.scale(0.5);

    expect(scaled.real).toBe(1.5);
    expect(scaled.imaginary).toBe(-1);
  });

  it('computes magnitude and magnitudeSquared correctly', () => {
    const z = new ComplexNumber(3, 4);

    expect(z.magnitudeSquared()).toBe(25);
    expect(z.magnitude()).toBe(5);
  });

  it('returns conjugate correctly', () => {
    const z = new ComplexNumber(7, -9);
    const conjugate = z.conjugate();

    expect(conjugate.real).toBe(7);
    expect(conjugate.imaginary).toBe(9);
  });
});
