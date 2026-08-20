<script setup lang="ts">
defineEmits<{
  goToLevel: [index: number]
  scrollToSection: [id: string]
}>()
</script>

<template>
  <div class="manualContent">
    <h1 class="manualH1">Quantum Laser Puzzle - Player Manual</h1>

    <h2 id="prep" class="manualH2">The Science of Ion Preparation</h2>
    <p>Before manipulating quantum information, individual atoms must be isolated and prepared. The intro levels simulate the laboratory process used by research groups like the <a href="https://www.sussex.ac.uk/physics/iqt/" target="_blank" class="manualLink">University of Sussex Ion Quantum Technology Group</a> to create trapped-ion qubits.</p>

    <h3 class="manualH3">1. Heating</h3>
    <p><strong>The Science:</strong> To trap an atom, you first need a source of them. In the lab, a sample (Ytterbium is used at Sussex University) is placed inside an oven within a vacuum chamber. The oven is heated to release neutral Ytterbium atoms.</p>
    <ul>
      <li><strong>Further Reading:</strong> Learn more about trapped ion systems via the <a href="https://www.sussex.ac.uk/physics/iqt/" target="_blank" class="manualLink">Sussex IQT group</a>.</li>
    </ul>

    <h3 class="manualH3">2. Ionisation</h3>
    <p><strong>The Science:</strong> Neutral atoms can't be contained by electric fields so charged Ions are created. The neutral atoms are subjected to high-energy electron bombardment. This process strips an electron from the Yb atom, creating a positively charged Yb+ ion. The charge allows the ion to be manipulated by electromagnetic fields.</p>
    <ul>
      <li><strong>Further Reading:</strong> <a href="https://www.quera.com/glossary/trapped-ions" target="_blank" class="manualLink">Trapped Ions Overview (QuEra)</a></li>
    </ul>

    <h3 class="manualH3">3. The Paul Trap</h3>
    <p><strong>The Science:</strong> A charged particle cannot be held using static electric fields (imagine trying to hold the north poles of two magnets together). Physicists use a <a href="https://medium.com/@anastasiya.khromova17/paul-radio-frequency-ion-traps-e60770ef3b6c" target="_blank" class="manualLink">Paul Trap</a> (named after Wolfgang Paul). By moving electric fields around the ion, the trap pushes the ion toward the center. Imagine the ion is always running towards the exit but you constantly move the door so it can never escape.</p>
    <ul>
      <li><strong>Further Reading:</strong> <a href="https://en.wikipedia.org/wiki/Quadrupole_ion_trap" target="_blank" class="manualLink">The Physics of Quadrupole Ion Traps</a></li>
    </ul>

    <h3 class="manualH3">4. Laser Cooling (Doppler & Sideband)</h3>
    <p><strong>The Science:</strong> When trapped, the ion still vibrates due to thermal energy. Laser cooling uses the momentum of photons to slow the ion down. First, <strong>Doppler Cooling</strong> uses lasers tuned to the ion's resonant frequency to cool the ion. To ensure the ion is stable for longer, researchers then apply <strong>Sideband Cooling</strong> to calm the ion further.</p>
    <ul>
      <li><strong>Further Reading:</strong> Watch this video on Doppler Cooling for more information: <a href="https://www.youtube.com/watch?v=WPwlS8SKlns" target="_blank" class="manualLink">"Laser Cooling | Doppler Effect"</a>.</li>
    </ul>

    <hr style="border-color: var(--color-primary); opacity: 0.3; margin: 30px 0;">

    <h2 id="qubit" class="manualH2">What Is a Qubit?</h2>
    <p>A <strong>qubit</strong> (short for quantum bit) is the basic unit of quantum information. While a standard computer bit can only be a 0 or a 1, a qubit can exist in a <a @click="$emit('scrollToSection', 'qm-superposition')" class="manualLink">superposition</a> of both 0 and 1 at the same time.</p>
    <p>In this game, each trapped ion acts as a single physical qubit. We use laser pulses to change its state (such as moving it from the north pole of the <a @click="$emit('scrollToSection', 'bloch-sphere')" class="manualLink">Bloch Sphere</a> to the equator) before finally measuring it to see what state it collapses into.</p>

    <hr style="border-color: var(--color-primary); opacity: 0.3; margin: 30px 0;">

    <h2 id="mechanics" class="manualH2">Basic Mechanics</h2>

    <h3 class="manualH3">Placing and Removing Mirrors</h3>
    <video 
      src="/videos/mirror-demo.mp4" 
      autoplay 
      loop 
      muted 
      playsinline
      width="324"
      height="266"
      class="manualGif"
    ></video>
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
    <p><strong>Practice:</strong> <span @click="$emit('goToLevel', 1)" class="manualLink">Level 2 - Reflection</span></p>

    <h3 class="manualH3">Resetting and Measuring the Ion</h3>
    <video 
      src="/videos/reset-measure-demo.mp4" 
      autoplay 
      loop 
      muted 
      playsinline
      width="360"
      height="172"
      class="manualGif"
    ></video>
    <p><strong>Reset Button:</strong></p>
    <ul>
      <li>Levels 1 and 2 require you to click the Reset button to initialise the ion to a known quantum state</li>
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
    <p><strong>Practice:</strong> <span @click="$emit('goToLevel', 0)" class="manualLink">Level 1 - Initialisation and Measurement</span></p>

    <h3 class="manualH3">Adding Logic Gates to the Laser</h3>
    <video 
      src="/videos/laser-gates-demo.mp4" 
      autoplay 
      loop 
      muted 
      playsinline
      width="436"
      height="590"
      class="manualGif"
    ></video>
    <p><strong>Opening the Gate Menu:</strong></p>
    <ul>
      <li>Click on the laser source (the coloured square at the start of the beam) to open the laser gates menu</li>
      <li>This shows available gates for the current level</li>
    </ul>
    <p><strong>Applying Gates:</strong></p>
    <ul>
      <li>Drag and drop available gates from the "Available Gates" section into the drop zone</li>
      <li>Gates are applied in the order they appear (top to bottom)</li>
      <li>The laser changes color to reflect the gates applied (purple for Hadamard, orange for X-gate, orange for CNOT)</li>
    </ul>
    <p><strong>Removing Gates:</strong></p>
    <ul>
      <li>Click the x button next to a gate to remove it</li>
      <li>Note: Some levels may lock certain gates to prevent removal</li>
    </ul>

    <p><strong>Practice:</strong> <span @click="$emit('goToLevel', 2)" class="manualLink">Level 3 - X-Gate</span></p>

    <hr style="border-color: var(--color-primary); opacity: 0.3; margin: 30px 0;">

    <h2 id="bloch-sphere" class="manualH2">The Bloch Sphere</h2>
    <video 
      src="/videos/bloch-demo.mp4" 
      autoplay 
      loop 
      muted 
      playsinline
      width="260"
      height="378"
      class="manualGif"
    ></video>
    <p>The circular diagram on the right side of the game shows the Bloch Sphere, a geometric representation of the state of a single ion.</p>
    <p><strong>Understanding the Bloch Sphere:</strong></p>
    <ul>
      <li>The south pole represents |0⟩ (ground state)</li>
      <li>The north pole represents |1⟩ (excited state)</li>
      <li>Points on the equator represent <a @click="$emit('scrollToSection', 'qm-superposition')" class="manualLink">superposition</a> in the positive or negative state like |+⟩ and |-⟩</li>
      <li>The arrow shows the current qubit state</li>
    </ul>

    <h2 id="tips" class="manualH2">Tips for Success</h2>
    <ol>
      <li><strong>Use the Bloch Sphere Visualisation:</strong> The circular diagram on the right shows the current quantum state. Track how it changes as you apply gates.</li>
      <li><strong>Check the Probability Display:</strong> The P(0) and P(1) values show the measurement probabilities before you measure.</li>
      <li><strong>Review the History:</strong> The measurement history panel shows previous results, helping you verify the probability distribution.</li>
      <li><strong>Experiment:</strong> Try different mirror configurations or gate combinations to see how they affect the quantum state.</li>
      <li><strong>Reset Between Attempts:</strong> Use the Reset button to return the ion to its initial state when starting over.</li>
    </ol>

    <h2 id="legend" class="manualH2">Quantum State Legend</h2>
    <ul>
      <li><strong>|0⟩</strong> - Ground state (100% probability of measuring 0)</li>
      <li><strong>|1⟩</strong> - Excited state (100% probability of measuring 1)</li>
      <li><strong>|+⟩</strong> - Superposition (50% chance of 0 or 1, positive phase)</li>
      <li><strong>|-⟩</strong> - Superposition (50% chance of 0 or 1, negative phase)</li>
      <li><strong>?</strong> - Unknown state (ion not initialised)</li>
      <li><strong>—</strong> - State undefined (beam hasn't hit ion yet)</li>
    </ul>

    <hr style="border-color: var(--color-primary); opacity: 0.3; margin: 30px 0;">

    <h2 id="logic-gates" class="manualH2">Quantum Logic Gates</h2>

    <h3 id="gate-x" class="manualH3">X-Gate</h3>
    <video 
      src="/videos/xgate-demo.mp4" 
      autoplay 
      loop 
      muted 
      playsinline
      width="670"
      height="350"
      class="manualGif"
    ></video>
    <p><strong>What It Does:</strong></p>
    <ul>
      <li>The X-gate (NOT gate) flips the state of a <a @click="$emit('scrollToSection', 'qubit')" class="manualLink">qubit</a></li>
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

    <p><strong>Practice:</strong> <span @click="$emit('goToLevel', 2)" class="manualLink">Level 3 - X-Gate</span></p>

    <h3 id="gate-h" class="manualH3">Hadamard Gate</h3>
    <video 
      src="/videos/hgate-demo.mp4" 
      autoplay 
      loop 
      muted 
      playsinline
      width="670"
      height="350"
      class="manualGif"
    ></video>
    <p><strong>What It Does:</strong></p>
    <ul>
      <li>The Hadamard (H) gate creates and removes <a @click="$emit('scrollToSection', 'qm-superposition')" class="manualLink">superposition</a></li>
      <li>It rotates a <a @click="$emit('scrollToSection', 'qubit')" class="manualLink">qubit</a> between the basis (|0⟩, |1⟩) and the positive or negative superposition (|+⟩, |-⟩)</li>
    </ul>
    <p><strong>Effect:</strong></p>
    <ul>
      <li>|0⟩ -> |+⟩ (ground state to superposition)</li>
      <li>|1⟩ -> |-⟩ (excited state to superposition)</li>
      <li>|+⟩ -> |0⟩ (superposition back to ground state)</li>
      <li>|-⟩ -> |1⟩ (superposition back to excited state)</li>
    </ul>
    <p><strong>Key Insight:</strong> Applying Hadamard twice returns to the original state!</p>

    <p><strong>Practice:</strong> <span @click="$emit('goToLevel', 4)" class="manualLink">Level 5</span> <span @click="$emit('goToLevel', 5)" class="manualLink">Level 6</span></p>

    <h3 id="gate-cnot" class="manualH3">C-NOT Gate</h3>
    <video 
      src="/videos/cnot-demo.mp4" 
      autoplay 
      loop 
      muted 
      playsinline
      width="870"
      height="584"
      class="manualGif"
    ></video>
    <p><strong>What It Does:</strong></p>
    <ul>
      <li>The Controlled-NOT (C-NOT) gate is a two-<a @click="$emit('scrollToSection', 'qubit')" class="manualLink">qubit</a> gate</li>
      <li>It flips a target qubit only when a control qubit is in state |1⟩</li>
      <li>This is a fundamental gate for creating <a @click="$emit('scrollToSection', 'qm-entanglement')" class="manualLink">entanglement</a></li>
    </ul>
    <p><strong>Effect:</strong></p>
    <ul>
      <li>|0⟩|0⟩ -> |0⟩|0⟩</li>
      <li>|0⟩|1⟩ -> |0⟩|1⟩</li>
      <li>|1⟩|0⟩ -> |1⟩|1⟩</li>
      <li>|1⟩|1⟩ -> |1⟩|0⟩</li>
    </ul>
    <p>Entanglement</p>
    <ul>
        <li>|+⟩|0⟩ -> |+⟩|+⟩</li>
        <li>|-⟩|0⟩ -> |-⟩|-⟩</li>
        <li>|+⟩|1⟩ -> |+⟩|+⟩</li>
        <li>|-⟩|1⟩ -> |-⟩|-⟩</li>
    </ul>    
    <p><strong>Practice:</strong> <span @click="$emit('goToLevel', 9)" class="manualLink">Level 10</span> <span @click="$emit('goToLevel', 10)" class="manualLink">Level 11</span></p>

    <h2 id="quantum-mechanics" class="manualH2">Quantum Mechanics</h2>

    <h3 id="qm-superposition" class="manualH3">Superposition</h3>
    <video 
      src="/videos/superposition-demo.mp4" 
      autoplay 
      loop 
      muted 
      playsinline
      width="354"
      height="502"
      class="manualGif"
    ></video>
    <p><strong>What Is It?</strong></p>
    <ul>
      <li>Superposition is when a quantum system exists in multiple states simultaneously</li>
      <li>Only when measured does the superposition "collapse" into a definite state</li>
    </ul>
    <p><strong>In The Game:</strong></p>
    <ul>
      <li>States like |+⟩ and |-⟩ represent a superposition of states</li>
      <li>They have a 50% probability of measuring as either 0 or 1</li>
      <li>The Hadamard gate creates superpositions from |0⟩ and |1⟩</li>
    </ul>
    <p><strong>Example:</strong></p>
    <ul>
      <li>Starting state: |0⟩ (ground state)</li>
      <li>After Hadamard: |+⟩ (superposition an equal chance of 0 or 1)</li>
      <li>After another Hadamard: |0⟩ (back to ground state)</li>
    </ul>
    <p><strong>Practice:</strong> <span @click="$emit('goToLevel', 4)" class="manualLink">Level 5</span> <span @click="$emit('goToLevel', 5)" class="manualLink">Level 6</span></p>
    
    <h3 id="qm-phase" class="manualH3">Phase</h3>
    <p><strong>What Is It?</strong></p>
    <ul>
      <li>Quantum phase relates to the wave-like nature of quantum states.</li>
      <li>When a <a @click="$emit('scrollToSection', 'qubit')" class="manualLink">qubit</a> is in <a @click="$emit('scrollToSection', 'qm-superposition')" class="manualLink">superposition</a>, the phase determines how states will interfere with each other during future operations.</li>
    </ul>
    <p><strong>In The Game:</strong></p>
    <ul>
      <li>States like |+⟩ and |-⟩ both have a 50% chance of being measured as 0 or 1, but they have different phases.</li>
      <li>|+⟩ has a positive phase, while |-⟩ has a negative phase.</li>
      <li>This difference is noticable when applying further gates, as it decides whether the state will interfere constructively or destructively (e.g. go back to |0⟩ or to |1⟩ after a Hadamard gate is applied).</li>
    </ul>
    <p><strong>Practice:</strong> <span @click="$emit('goToLevel', 6)" class="manualLink">Level 7</span></p>
    
    <h3 id="qm-entanglement" class="manualH3">Entanglement</h3>
    <video 
      src="/videos/entanglement-demo.mp4" 
      autoplay 
      loop 
      muted 
      playsinline
      width="354"
      height="528"
      class="manualGif"
    ></video>
    <p><strong>What Is It?</strong></p>
    <ul>
      <li>Entanglement occurs when two or more <a @click="$emit('scrollToSection', 'qubit')" class="manualLink">qubits</a> are correlated in a way that cannot be described independently</li>
      <li>Measuring one entangled qubit instantly affects the others, regardless of distance</li>
    </ul>
    <p><strong>In The Game:</strong></p>
    <ul>
      <li>Entanglement is created using multi-qubit gates like <a @click="$emit('scrollToSection', 'gate-cnot')" class="manualLink">Controlled-NOT (C-NOT)</a></li>
    </ul>
    <p><strong>Practice:</strong> <span @click="$emit('goToLevel', 10)" class="manualLink">Level 11</span> <span @click="$emit('goToLevel', 11)" class="manualLink">Level 12</span></p>

    <h3 id="qm-bell" class="manualH3">Bell States (Pairs)</h3>
    <video 
      src="/videos/bell-pairs-demo.mp4" 
      autoplay 
      loop 
      muted 
      playsinline 
      width="348"
      height="540"
      class="manualGif"
    ></video>
    <p><strong>What Are They?</strong></p>
    <ul>
      <li>A Bell State represents the simplest example of quantum entanglement, involving exactly two qubits.</li>
    </ul>
    <p><strong>In The Game:</strong></p>
    <ul>
      <li>You create Bell pairs by applying a Hadamard gate to your first ion and then routing a C-NOT gate through both.</li>
      <li>Once a Bell pair is created, measuring the ions will yield matching results (or opposite results, depending on the specific Bell state).</li>
      <li> Measuring an ion instantly affects the other, regardless of distance.</li>
    </ul>
    <p><strong>Practice:</strong> <span @click="$emit('goToLevel', 10)" class="manualLink">Level 11</span> <span @click="$emit('goToLevel', 19)" class="manualLink">Level 20</span></p>

    <h3 id="qm-ghz" class="manualH3">GHZ States (Multi-Qubit)</h3>
    <p><strong>What Are They?</strong></p>
    <ul>
      <li>The Greenberger-Horne-Zeilinger (GHZ) state is an entangled quantum state involving three or more qubits.</li>
      <li>It shows that entanglement can cascade across multiple qubits and create complex interactions.</li>
    </ul>
    <p><strong>In The Game:</strong></p>
    <ul>
      <li>You create GHZ states by chaining C-NOT gates down a line of multiple ions, starting with the first ion in superposition.</li>
      <li>When you observe the ions, you will notice that all ions collapse to match each other every time (e.g. all |0⟩'s or all |1⟩'s).</li>
    </ul>
    <p><strong>Practice:</strong> <span @click="$emit('goToLevel', 15)" class="manualLink">Level 16</span> <span @click="$emit('goToLevel', 18)" class="manualLink">Level 19</span></p>
    
    <h3 id="qm-uncomputing" class="manualH3">Uncomputing</h3>
    <p><strong>What Is It?</strong></p>
    <ul>
      <li><a href="https://qrisp.eu/reference/Core/Uncomputation.html" target="_blank" class="manualLink">Uncomputing</a> is the process of reversing quantum operations to remove entanglement or return a <a @click="$emit('scrollToSection', 'qubit')" class="manualLink">qubit</a> to a previous state.</li>
      <li>Because quantum gates are reversible (unitary), applying the inverse of an operation undoes (or uncomputes) its effect.</li>
    </ul>

    <li>more on unitary operations: <a href="https://www.youtube.com/watch?v=dD-oYfhSKhg" target="_blank" class="manualLink">(Watch) What are unitary operators? | Maths of Quantum Mechanics</a></li>
    <p><strong>In The Game:</strong></p>
    <ul>
      <li>Gates like Hadamard, X and C-NOT are their own inverses so applying the same gate twice will "uncompute" the operation.</li>
      <li>Applying a C-NOT gate to an entangled pair using the same control and target ions will unentangle them, breaking the connection between them.</li>
    </ul>
    <p><strong>Practice:</strong> <span @click="$emit('goToLevel', 13)" class="manualLink">Level 14</span> <span @click="$emit('goToLevel', 17)" class="manualLink">Level 18</span></p>

    <h3 id="qm-anticorrelation" class="manualH3">Anti-correlation</h3>
    <video 
      src="/videos/anticorrelation-demo.mp4" 
      autoplay 
      loop 
      muted 
      playsinline 
      width="352"
      height="530"
      class="manualGif"
    ></video>
    <p><strong>What Is It?</strong></p>
    <ul>
      <li>Anti-correlation is a measurement outcome of an entangled state where two <a @click="$emit('scrollToSection', 'qubit')" class="manualLink">qubits</a> always yield opposite results.</li>
      <li>If one qubit is measured as |0⟩, the other is guaranteed to measure as |1⟩ (and vice versa.)</li>
    </ul>
    <p><strong>In The Game:</strong></p>
    <ul>
      <li>You can create anti-correlated states by modifying a <a @click="$emit('scrollToSection', 'qm-bell')" class="manualLink">Bell State</a> by applying an X-gate to one of the entangled ions.</li>
      <li>When measuring you will see pairs of measurements like (|0⟩,|1⟩) or (|1⟩,|0⟩) showing up, but never (|0⟩,|0⟩) or (|1⟩,|1⟩).</li>
    </ul>
    <p><strong>Practice:</strong> <span @click="$emit('goToLevel', 12)" class="manualLink">Level 13</span></p>

    <hr style="border-color: var(--color-primary); opacity: 0.3; margin: 30px 0;">
    
    <h2 id="trapped-ion" class="manualH2">What Is a Trapped Ion?</h2>
    <p>Trapped ions are one of the leading platforms for building quantum computers and their technology is currently being researched at the <a href="https://www.sussex.ac.uk/physics/iqt/" target="_blank" class="manualLink">University of Sussex</a>.</p>
    <p>In this game, you're manipulating a simulated trapped ion using laser pulses to apply <a @click="$emit('scrollToSection', 'logic-gates')" class="manualLink">quantum gates</a>.</p>

  </div>
</template>

<style scoped src="./manual.css"></style>