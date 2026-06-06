export class ComplexNumber {
  constructor(
    public real: number,
    public imaginary: number = 0
  ) {}

  add(other: ComplexNumber): ComplexNumber {
    return new ComplexNumber(
      this.real + other.real,
      this.imaginary + other.imaginary
    );
  }

  subtract(other: ComplexNumber): ComplexNumber {
    return new ComplexNumber(
      this.real - other.real,
      this.imaginary - other.imaginary
    );
  }

  multiply(other: ComplexNumber): ComplexNumber {
    return new ComplexNumber(
      this.real * other.real - this.imaginary * other.imaginary,
      this.real * other.imaginary + this.imaginary * other.real
    );
  }

  scale(scalar: number): ComplexNumber {
    return new ComplexNumber(this.real * scalar, this.imaginary * scalar);
  }

  magnitude(): number {
    return Math.sqrt(this.magnitudeSquared());
  }

  magnitudeSquared(): number {
    return this.real * this.real + this.imaginary * this.imaginary;
  }

  conjugate(): ComplexNumber {
    return new ComplexNumber(this.real, -this.imaginary);
  }
}
