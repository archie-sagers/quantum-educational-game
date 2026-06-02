<script setup lang="ts">
defineProps<{
  isOpen: boolean
}>()

defineEmits<{
  close: []
}>()
</script>

<template>
  <div v-if="isOpen" class="manualOverlay" @click="$emit('close')">
    <div class="manualModal" @click.stop>
      <button @click="$emit('close')" class="manualCloseBtn">✕</button>
      <div class="manualContent">
        <h1 class="manualH1">Quantum Laser Puzzle - Player Manual</h1>

        <h2 class="manualH2">Basic Mechanics</h2>

        <h3 class="manualH3">Placing and Removing Mirrors</h3>
        <p><strong>How to Place Mirrors:</strong></p>
        <ul>
          <li>Left-click on any empty grid cell to place or rotate a mirror</li>
          <li>Each click moves the mirror between forward (/) and backward (\) orientations</li>
          <li>Mirrors redirect the laser beam in different directions</li>
        </ul>
        <p><strong>How to Remove Mirrors:</strong></p>
        <ul>
          <li>Right-click on a grid cell to remove a mirror</li>
          <li>You can remove all mirrors using the reset mirrors button at the top of the screen</li>
        </ul>
        <p><strong>Practice:</strong> Level 2 - Reflection</p>

        <h3 class="manualH3">Resetting and Measuring the Ion</h3>
        <p><strong>Reset Button:</strong></p>
        <ul>
          <li>Levels 1 and 2 require you to click the Reset button to initialize the ion to a known quantum state</li>
          <li>This is essential before measuring in real trapped ion systems. This measurement is done for you in later levels</li>
          <li>After resetting, the ion returns to the ground state |0⟩</li>
        </ul>
        <p><strong>Measure Button:</strong></p>
        <ul>
          <li>Click the Measure button to read out the quantum state of the ion</li>
          <li>The measurement result will show as either 0 or 1</li>
          <li>Historical measurements are displayed in the measurement history panel</li>
          <li>You can measure and reset multiple times to see the probability distribution</li>
        </ul>
        <p><strong>Practice:</strong> Level 1 - Initialisation and Measurement</p>

        <h3 class="manualH3">Adding Logic Gates to the Laser</h3>
        <p><strong>Opening the Gate Menu:</strong></p>
        <ul>
          <li>Click on the laser source (the coloured square at the start of the beam) to open the laser gates menu</li>
          <li>This shows available gates for the current level</li>
        </ul>
        <p><strong>Applying Gates:</strong></p>
        <ul>
          <li>Drag and drop available gates from the "Available Gates" section into the drop zone</li>
          <li>Gates are applied in the order they appear (top to bottom)</li>
          <li>The laser changes color to reflect the gates applied (purple for Hadamard, red for X-gate, orange for CNOT)</li>
        </ul>
        <p><strong>Removing Gates:</strong></p>
        <ul>
          <li>Click the red x button next to a gate to remove it</li>
          <li>Note: Some levels may lock certain gates to prevent removal (like the hadamard gate in Level 5)</li>
        </ul>

        <h2 class="manualH2">Quantum Logic Gates</h2>

        <h3 class="manualH3">X-Gate</h3>
        <p><strong>What It Does:</strong></p>
        <ul>
          <li>The <a href="https://www.quera.com/glossary/pauli-x-gate" target="_blank" class="manualLink">X-gate</a> (NOT gate) flips the state of a <a href="https://www.quera.com/glossary/qubit" target="_blank" class="manualLink">qubit</a></li>
          <li>It swaps 0 to 1 or 1 to 0</li>
          <li>In the |±⟩ basis, it leaves the state unchanged</li>
        </ul>
        <p><strong>Effect:</strong></p>
        <ul>
          <li>|0⟩ -> |1⟩</li>
          <li>|1⟩ -> |0⟩</li>
          <li>|+⟩ -> |+⟩</li>
          <li>|-⟩ -> |-⟩</li>
        </ul>

        <h3 class="manualH3">Hadamard Gate</h3>
        <p><strong>What It Does:</strong></p>
        <ul>
          <li>The <a href="https://www.quera.com/glossary/hadamard-gate" target="_blank" class="manualLink">Hadamard (H) gate</a> creates and removes <a href="https://www.quera.com/glossary/superposition" target="_blank" class="manualLink">superposition</a></li>
          <li>It rotates a <a href="https://www.quera.com/glossary/qubit" target="_blank" class="manualLink">qubit</a> between the basis (|0⟩, |1⟩) and the positive or negative superposition (|+⟩, |-⟩)</li>
        </ul>
        <p><strong>Effect:</strong></p>
        <ul>
          <li>|0⟩ -> |+⟩ (ground state to <a href="https://www.quera.com/glossary/superposition" target="_blank" class="manualLink">superposition</a>)</li>
          <li>|1⟩ -> |-⟩ (excited state to <a href="https://www.quera.com/glossary/superposition" target="_blank" class="manualLink">superposition</a>)</li>
          <li>|+⟩ -> |0⟩ (<a href="https://www.quera.com/glossary/superposition" target="_blank" class="manualLink">superposition</a> back to ground state)</li>
          <li>|-⟩ -> |1⟩ (<a href="https://www.quera.com/glossary/superposition" target="_blank" class="manualLink">superposition</a> back to excited state)</li>
        </ul>
        <p><strong>Key Insight:</strong> Applying Hadamard twice returns to the original state!</p>

        <h3 class="manualH3">C-NOT Gate</h3>
        <p><strong>What It Does:</strong></p>
        <ul>
          <li>The <a href="https://www.quera.com/glossary/controlled-not-gate" target="_blank" class="manualLink">Controlled-NOT (C-NOT) gate</a> is a two-<a href="https://www.quera.com/glossary/qubit" target="_blank" class="manualLink">qubit</a> gate</li>
          <li>It flips a target <a href="https://www.quera.com/glossary/qubit" target="_blank" class="manualLink">qubit</a> only when a control <a href="https://www.quera.com/glossary/qubit" target="_blank" class="manualLink">qubit</a> is in state |1⟩</li>
          <li>This is a fundamental gate for creating entanglement</li>
        </ul>

        <h2 class="manualH2">Quantum Mechanics</h2>

        <h3 class="manualH3">Superposition</h3>
        <p><strong>What Is It?</strong></p>
        <ul>
          <li><a href="https://www.quera.com/glossary/superposition" target="_blank" class="manualLink">Superposition</a> is when a quantum system exists in multiple states simultaneously</li>
          <li>Only when measured does the <a href="https://www.quera.com/glossary/measurement" target="_blank" class="manualLink">superposition "collapse" into a definite state</a></li>
        </ul>
        <p><strong>In The Game:</strong></p>
        <ul>
          <li>States like |+⟩ and |-⟩ represent <a href="https://www.quera.com/glossary/superposition" target="_blank" class="manualLink">superposition</a> states</li>
          <li>They have a 50% probability of measuring as either 0 or 1</li>
          <li>The Hadamard gate creates <a href="https://www.quera.com/glossary/superposition" target="_blank" class="manualLink">superpositions</a> from |0⟩ and |1⟩</li>
        </ul>
        <p><strong>Example:</strong></p>
        <ul>
          <li>Starting state: |0⟩ (ground state)</li>
          <li>After Hadamard: |+⟩ (<a href="https://www.quera.com/glossary/superposition" target="_blank" class="manualLink">superposition</a> an equal chance of 0 or 1)</li>
          <li>After another Hadamard: |0⟩ (back to ground state)</li>
        </ul>

        <h3 class="manualH3">Entanglement</h3>
        <p><strong>What Is It?</strong></p>
        <ul>
          <li>Entanglement occurs when two or more <a href="https://www.quera.com/glossary/qubit" target="_blank" class="manualLink">qubits</a> are correlated in a way that cannot be described independently</li>
          <li>Measuring one entangled <a href="https://www.quera.com/glossary/qubit" target="_blank" class="manualLink">qubit</a> instantly affects the others, regardless of distance</li>
        </ul>
        <p><strong>In The Game:</strong></p>
        <ul>
          <li>Entanglement is created using multi-<a href="https://www.quera.com/glossary/qubit" target="_blank" class="manualLink">qubit</a> gates like C-NOT</li>
          <li>The game uses a two-<a href="https://www.quera.com/glossary/qubit" target="_blank" class="manualLink">qubit</a> system under the hood</li>
        </ul>

        <h2 class="manualH2">The Bloch Sphere</h2>
        <p>The circular diagram on the right side of the game shows the <a href="https://www.quera.com/glossary/bloch-sphere" target="_blank" class="manualLink">Bloch Sphere</a>, a geometric representation of the state of a single <a href="https://www.quera.com/glossary/qubit" target="_blank" class="manualLink">qubit</a>.</p>
        <p><strong>Understanding the Bloch Sphere:</strong></p>
        <ul>
          <li>The north pole represents |0⟩ (ground state)</li>
          <li>The south pole represents |1⟩ (excited state)</li>
          <li>Points on the equator represent <a href="https://www.quera.com/glossary/superposition" target="_blank" class="manualLink">superposition</a> in the positive or negative state like |+⟩ and |-⟩</li>
          <li>The arrow shows the current <a href="https://www.quera.com/glossary/qubit" target="_blank" class="manualLink">qubit</a> state</li>
        </ul>

        <h2 class="manualH2">Tips for Success</h2>
        <ol>
          <li><strong>Use the Bloch Sphere Visualization:</strong> The circular diagram on the right shows the current quantum state. Track how it changes as you apply gates.</li>
          <li><strong>Check the Probability Display:</strong> The P(0) and P(1) values show the <a href="https://www.quera.com/glossary/measurement" target="_blank" class="manualLink">measurement</a> probabilities before you measure.</li>
          <li><strong>Review the History:</strong> The <a href="https://www.quera.com/glossary/measurement" target="_blank" class="manualLink">measurement</a> history panel shows previous results, helping you verify the probability distribution.</li>
          <li><strong>Experiment:</strong> Try different mirror configurations or gate combinations to see how they affect the quantum state.</li>
          <li><strong>Reset Between Attempts:</strong> Use the Reset button to return the ion to its initial state when starting over.</li>
        </ol>

        <h2 class="manualH2">Quantum State Legend</h2>
        <ul>
          <li><strong>|0⟩</strong> - Ground state (100% probability of measuring 0)</li>
          <li><strong>|1⟩</strong> - Excited state (100% probability of measuring 1)</li>
          <li><strong>|+⟩</strong> - Superposition (50% chance of 0 or 1, positive phase)</li>
          <li><strong>|-⟩</strong> - Superposition (50% chance of 0 or 1, negative phase)</li>
          <li><strong>?</strong> - Unknown state (ion not initialized)</li>
          <li><strong>—</strong> - State undefined (beam hasn't hit ion yet)</li>
        </ul>

        <h2 class="manualH2">What Is a <a href="https://www.quera.com/glossary/trapped-ions" target="_blank" class="manualLink">Trapped Ion</a>?</h2>
        <p><a href="https://www.quera.com/glossary/trapped-ions" target="_blank" class="manualLink">Trapped ions</a> are one of the leading platforms for building quantum computers. In this game, you're manipulating a simulated <a href="https://www.quera.com/glossary/trapped-ions" target="_blank" class="manualLink">trapped ion</a> using laser pulses to apply <a href="https://www.quera.com/glossary/quantum-gates" target="_blank" class="manualLink">quantum gates</a>.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.manualOverlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.manualModal {
  background: #0a0a0a;
  border: 2px solid #0ef;
  border-radius: 4px;
  padding: 32px;
  max-width: 800px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 0 30px rgba(0, 238, 255, 0.3);
  position: relative;
}

.manualCloseBtn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: transparent;
  border: none;
  color: #0ef;
  font-size: 24px;
  cursor: pointer;
  transition: 0.2s;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.manualCloseBtn:hover {
  color: #1af;
  transform: scale(1.2);
}

.manualContent {
  color: #eee;
  font-size: 14px;
  line-height: 1.8;
  font-family: monospace;
}

.manualH1 {
  color: #0ef;
  font-size: 24px;
  font-weight: bold;
  letter-spacing: 0.1em;
  margin: 0 0 24px 0;
  border-bottom: 2px solid #0ef;
  padding-bottom: 12px;
}

.manualH2 {
  color: #b47cff;
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 0.08em;
  margin: 24px 0 12px 0;
}

.manualH3 {
  color: #0ef;
  font-size: 14px;
  font-weight: bold;
  letter-spacing: 0.05em;
  margin: 16px 0 8px 0;
}

.manualLink {
  color: #b47cff;
  text-decoration: none;
  transition: 0.2s;
  cursor: pointer;
  border-bottom: 1px dotted #b47cff;
}

.manualLink:hover {
  color: #d4aaff;
  border-bottom: 1px solid #b47cff;
}

.manualContent p {
  margin: 8px 0;
}

.manualContent ul,
.manualContent ol {
  margin: 8px 0 8px 20px;
  padding: 0;
}

.manualContent li {
  margin: 6px 0;
  color: #eee;
}

.manualContent strong {
  color: #eee;
  font-weight: bold;
}
</style>
