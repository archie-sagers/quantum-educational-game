import { ComplexNumber } from './math';

export class QuantumSystem {
  private numQubits: number;
  private stateVector: ComplexNumber[];

  constructor(numQubits: number) {
    this.validateQubitCount(numQubits);

    this.numQubits = numQubits;
    const stateSize = 1 << numQubits;
    this.stateVector = Array.from({ length: stateSize }, (_, i) =>
      i === 0 ? new ComplexNumber(1, 0) : new ComplexNumber(0, 0)
    );
  }

  // X GATE
  // -----------
  // Apply X gate to a specific qubit
  // Bitwise swap for X-gate to avoid matrix multiplication overhead
  applyX(targetQubit: number): void {
    // Validate target qubit index (throws error if out of range)
    this.validateQubitIndex(targetQubit);
    // the swapMask identifies which pairs of states to swap based on the target qubit
    const swapMask = 1 << targetQubit;
    // stateSize is the total number of states (2^numQubits)
    const stateSize = this.stateVector.length;

    for (let i = 0; i < stateSize; i++) {
      // Only swap pairs where the target qubit is 0 (i & swapMask) === 0 (to avoid swapping the same pair twice)
      if ((i & swapMask) === 0) {
        // compares current index against swapMask and flips where the mask has a 1
        const j = i ^ swapMask;
        const temp = this.stateVector[i]!;

        // Swap the amplitudes of the two states in the state vector
        this.stateVector[i] = this.stateVector[j]!;
        this.stateVector[j] = temp;
      }
    }
  }

  // HADAMARD GATE
  // -----------
  // Apply Hadamard (H) gate to a specific qubit

  applyH(targetQubit: number): void {
    // Validate target qubit index
    this.validateQubitIndex(targetQubit);
    // The factor of 1/sqrt(2) is used to normalise the state after applying the H gate
    // 1/sqrt(2) = 0.5 when squared (during measurement)
    const factor = 1 / Math.sqrt(2);
    const stateSize = this.stateVector.length;
    const bitMask = 1 << targetQubit;

    // Create a new temporary state vector to hold the results of applying the H gate
    const newState: ComplexNumber[] = Array.from({ length: stateSize }, (_, i) => {
      const amp = this.stateVector[i]!;
      return new ComplexNumber(amp.real, amp.imaginary);
    });

    for (let i = 0; i < stateSize; i++) {
      // Only process pairs where the target qubit is 0 to avoid duplicate work
      if ((i & bitMask) === 0) {
        const j = i | bitMask;

        // Get the amplitudes for the two states that will be affected by the H gate
        const amp0 = this.stateVector[i]!;
        const amp1 = this.stateVector[j]!;

        // add two amplitudes and scale by 1/sqrt(2) (so probabilities sum to 1)
        newState[i] = amp0.add(amp1).scale(factor);

        // subtract two amplitudes and scale by 1/sqrt(2) (so probabilities sum to 1)
        // this creates negative phase
        newState[j] = amp0.subtract(amp1).scale(factor);
      }
    }

    this.stateVector = newState;
  }

  // CNOT GATE
  // -----------
  // Apply CNOT (Controlled-NOT) gate.
  // Takes two qubit indices as input
  // If control qubit is |1⟩, flip the target qubit.

  applyCNOT(controlQubit: number, targetQubit: number): void {

    // Validate control and target qubit indices
    this.validateQubitIndex(controlQubit);
    this.validateQubitIndex(targetQubit);

    // Control and target qubits cannot be the same
    if (controlQubit === targetQubit) {
      throw new Error('Control and target qubits cannot be the same');
    }

    // Create bit masks for control and target qubits to identify which states to swap
    const controlMask = 1 << controlQubit;
    const targetMask = 1 << targetQubit;
    const stateSize = this.stateVector.length;

    for (let i = 0; i < stateSize; i++) {

      // Check if control qubit is |1⟩ and target qubit is |0⟩
      // checking target qubit is |0⟩ ensures we only swap each pair once
      if ((i & controlMask) !== 0 && (i & targetMask) === 0) {
        const j = i | targetMask;
        // Swap the amplitudes of the two states in the state vector
        const temp = this.stateVector[i]!;
        this.stateVector[i] = this.stateVector[j]!;
        this.stateVector[j] = temp;
      }
    }
  }

  // MEASURE
  // ---------
  // Measure the quantum system and collapse to a basis state.
  // Returns an array of measured bit values (0 or 1) for each qubit.
  measure(): number[] {
    // Generate a random number between 0 and 1
    const r = Math.random();
    // Cumulative probability keeps track of the total probability as we iterate through the state vector
    let cumulativeProbability = 0;

    // Iterate through the state vector
    // For each state, calculate its probability (magnitude squared of the amplitude (Born Rule)) and add it to the cumulative probability
    for (let i = 0; i < this.stateVector.length; i++) {
      const probability = this.stateVector[i]!.magnitudeSquared();
      cumulativeProbability += probability;

      if (r < cumulativeProbability) {
        return this.indexToBitArray(i);
      }
    }
    
    // In case of rounding errors, return the last state 
    return this.indexToBitArray(this.stateVector.length - 1);
  }

  // GET AMPLITUDE
  // ---------------
  // Get the amplitude for a specific basis state.
  getAmplitude(index: number): ComplexNumber {
    // Validate index to ensure it's within the bounds of the state vector
    this.validateStateIndex(index);
    // Return a new instance of the ComplexNumber 
    // This prevents accidental overwriting of the state by other code
    const amp = this.stateVector[index]!;
    return new ComplexNumber(amp.real, amp.imaginary);
  }

  // GET PROBABILITY
  // -----------------
  // Get probability for a specific basis state.
  getProbability(index: number): number {
    // Validate index to ensure it's within the bounds of the state vector
    this.validateStateIndex(index);
    return this.getAmplitude(index).magnitudeSquared();
  }

  // GET STATE VECTOR
  // ------------------
  // Get the entire state vector as an array of ComplexNumbers.
  getStateVector(): ComplexNumber[] {
    // Return a new array of ComplexNumbers to prevent external code from modifying the state vector
    return this.stateVector.map(amp => new ComplexNumber(amp.real, amp.imaginary));
  }

  // GET QUBIT PROBABILITY
  // -----------------------
  // Get probability for a specific qubit.
  getQubitProbability(qubitIndex: number): [number, number] {
    this.validateQubitIndex(qubitIndex);
    let prob0 = 0;
    let prob1 = 0;

    // Iterate through the state vector and sum probabilities for states where the target qubit is 0 or 1
    for (let i = 0; i < this.stateVector.length; i++) {

      // Determine if the target qubit is 0 or 1 in the current state index
      // This is done by right-shifting the index by the qubit index
      const bit = (i >> qubitIndex) & 1;
      const amplitude = this.stateVector[i]!.magnitudeSquared();
      
      // Add the probability to the appropriate sum based on whether the target qubit is 0 or 1
      if (bit === 0) {
        prob0 += amplitude;
      } else {
        prob1 += amplitude;
      }
    }

    return [prob0, prob1];
  }

  // Get the number of qubits in this system.
  getNumQubits(): number {
    return this.numQubits;
  }

  // PRIVATE HELPER METHODS
  // -----------------------

  private validateQubitCount(numQubits: number): void {
    // Limiting to 6 qubits to keep state vector size manageable
    if (!Number.isInteger(numQubits) || numQubits < 1 || numQubits > 6) {
      throw new RangeError('Number of qubits must be an integer between 1 and 6');
    }
  }

  private validateQubitIndex(qubitIndex: number): void {
    if (!Number.isInteger(qubitIndex) || qubitIndex < 0 || qubitIndex >= this.numQubits) {
      throw new Error(`Qubit index ${qubitIndex} out of range [0, ${this.numQubits - 1}]`);
    }
  }

  private validateStateIndex(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= this.stateVector.length) {
      throw new Error(`State index ${index} out of bounds`);
    }
  }

  private indexToBitArray(index: number): number[] {
    const bits: number[] = Array(this.numQubits);
    for (let i = 0; i < this.numQubits; i++) {
      bits[i] = (index >> i) & 1;
    }
    return bits;
  }
}