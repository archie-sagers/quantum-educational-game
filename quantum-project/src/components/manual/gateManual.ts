export type TutorialGateKey = 'X' | 'H'

export const GATE_MANUAL_COPY: Record<TutorialGateKey, { title: string; description: string }> = {
  X: {
    title: 'X-Gate',
    description:
      'The X-gate (Pauli-X) flips an ion between |0⟩ and |1⟩. On the Bloch sphere it reflects the state through the center.',
  },
  H: {
    title: 'Hadamard Gate',
    description:
      'The Hadamard gate creates or removes superposition. It moves the state between the poles and the equator of the Bloch sphere.',
  },
}