import { Level } from './quantumgame'

export const LEVELS = [
  new Level({
    name: '1 - Initialisation and Measurement',
    cols: 12, rows: 8,
    src: { col: 0, row: 4 },
    ions: [{ col: 11, row: 4 }],
    goal: '|0⟩',
    winCondition: 'normal',
    hint: 'Press reset to initialise the ion, then measure it',
    showResetButton: true,
    preInitialized: false,
    popups: [
      { title: 'Unknown State', text: 'The ion is in an unknown quantum state. It needs optical pumping to reset it to a ground state.', trigger: 'onLoad' },
      { title: 'Your Goal', text: 'Notice the goal box above the Bloch sphere: we need to measure the ion in the ground state |0⟩.', trigger: 'onLoad' },
      { title: 'Step 1', text: 'Click the Reset button to initialise the ion to the ground state |0⟩.', trigger: 'onLoad' },
      { title: 'Step 2', text: 'Click the Measure button to read out the state of the ion.', trigger: 'onReset' }
    ]
  }),
  new Level({
    name: '2 - Reflection',
    cols: 12, rows: 8,
    src: { col: 0, row: 4 },
    ions: { col: 11, row: 4 },
    walls: [{ col: 6, row: 3, type: 'cyan' }, { col: 6, row: 4, type: 'cyan' }, { col: 6, row: 5, type: 'cyan' }],
    goal: '|0⟩',
    winCondition: 'normal',
    hint: 'Place mirrors to route the laser around the wall and hit the ion',
    showResetButton: true,
    preInitialized: false,
    popups: [
      { title: 'How to Place Mirrors', text: 'Left-click on the grid to place or rotate mirrors. Right-click to remove them. Once you route the beam to the ion, press Reset.', trigger: 'onLoad' },
      { title: 'Measure', text: 'Measure the ion to complete the level.', trigger: 'onLaserToIon' }
    ]
  }),
  new Level({
    name: '3 - The X-Gate',
    cols: 12, rows: 8,
    src: { col: 0, row: 4 },
    ions: { col: 11, row: 4 },
    availableGates: ['X'],
    goal: '|1⟩',
    winCondition: '|1⟩',
    hint: 'Select the X-gate from the laser menu and measure the ion',
    showResetButton: false,
    preInitialized: true,
    popups: [
      { title: 'Ion Initialised', text: 'The ion has been initialised to the ground state |0⟩ for you.', trigger: 'onLoad' },
      { title: 'The X-Gate', text: 'Click on the laser source to open the laser gates menu.', trigger: 'onLoad' },
      { title: 'Apply X-Gate', text: 'Select the orange X-gate and drag it to the laser. This will flip the qubit to |1⟩.', trigger: 'onLaserGatesOpen' }
    ]
  }),
  new Level({
    name: '4 - Reflection With The X-Gate',
    cols: 12, rows: 8,
    src: { col: 0, row: 4 },
    ions: { col: 11, row: 4 },
    walls: [{ col: 6, row: 3, type: 'orange' }, { col: 6, row: 4, type: 'orange' }, { col: 6, row: 5, type: 'orange' }],
    availableGates: ['X'],
    goal: '|1⟩',
    winCondition: '|1⟩',
    hint: 'Route the red laser to hit the ion and measure it',
    showResetButton: false,
    preInitialized: true,
    popups: []
  }),
  new Level({
    name: '5 - Superposition',
    cols: 12, rows: 8,
    src: { col: 0, row: 4 },
    ions: { col: 11, row: 4 },
    availableGates: ['H'],
    goal: '|0⟩',
    winCondition: '|0⟩',
    hint: 'Apply another Hadamard gate to take the ion out of superposition and measure |0⟩',
    showResetButton: true,
    preInitialized: true,
    lockedGateIndices: [0],
    gateInventory: { 'H': 12 },
    popups: [
      { title: 'Superposition', text: 'The ion is already in a superposition |+⟩. We want to measure |0⟩. Can you apply another Hadamard gate to collapse the superposition back to |0⟩?', trigger: 'onLoad' }
    ]
  }),
  new Level({
    name: '6 - Hadamard Gate',
    cols: 12, rows: 8,
    src: { col: 0, row: 4 },
    ions: { col: 11, row: 4 },
    availableGates: ['H'],
    goal: '|+⟩',
    winCondition: 'positive-superposition',
    hint: 'Use the Hadamard gate to put the ion into a superposition, then measure to see the distribution',
    showResetButton: true,
    preInitialized: true,
    automateMeasurement: true,
    popups: [
      { title: 'Hadamard Gate', text: 'Now we want the ion in a superposition. Use the Hadamard gate to put the ion into |+⟩.', trigger: 'onLoad' },
      { title: 'Automated Measurement', text: 'We will now automatically reset and measure the ion 10 times to show the effect of superposition (roughly 50/50 split between |0⟩ and |1⟩).', trigger: 'onAutomatedStart' },
    ]
  }),
    new Level({
      name: '7 - Negative Superposition',
      cols: 12, rows: 8,
      src: { col: 0, row: 4 },
      ions: { col: 11, row: 4 },
      availableGates: ['X', 'H'],
      walls: [{ col: 6, row: 3, type: 'cyan' }, { col: 6, row: 4, type: 'cyan' }, { col: 6, row: 5, type: 'cyan' },{ col: 6, row: 6, type: 'cyan' },{ col: 3, row: 4 },{ col: 3, row: 3 },{ col: 3, row: 2 }],
      goal: '|-⟩',
      winCondition: 'negative-superposition',
      hint: 'Flip the ion with an X-gate, then apply H to create |-⟩ and measure the distribution',
      showResetButton: true,
      preInitialized: true,
      automateMeasurement: true,
      popups: [
        { title: 'Negative Superposition', text: 'Create a negative superposition (|-⟩)', trigger: 'onLoad' },
        { title: 'Automated Measurement', text: 'The ion will be automatically reset and measured 10 times to show the superposition. You will see that phase is not visible in measurement statistics.', trigger: 'onAutomatedStart' },
      ]
    }),
    new Level({
      name: '8 - Sequencing Gates',
      cols: 12, rows: 8,
      src: { col: 0, row: 4 },
      ions: [{ col: 11, row: 4 }],
      availableGates: ['X', 'H'],
      goal: '|0⟩',
      winCondition: 'normal',
      hint: 'Apply 3 gates in sequence, then measure the result.',
      showResetButton: false,
      preInitialized: true,
      requiredGateCount: 3,
      gateInventory: { 'X': 1, 'H': 2 },
      popups: [
        { title: 'Gate Sequencing', text: 'The ion starts in |0⟩. You must use exactly 3 laser gates.', trigger: 'onLoad' },
      ]
    }),
    new Level({
      name: '9 - Sequencing Gates Pt 2',
      cols: 12, rows: 8,
      src: { col: 0, row: 4 },
      ions: [{ col: 11, row: 4 }],
      availableGates: ['X', 'H'],
      goal: '|1⟩',
      winCondition: 'normal',
      hint: 'Use 3 gates to achieve a |1⟩ state, then measure the result.',
      showResetButton: false,
      preInitialized: true,
      requiredGateCount: 3,
      lockedGateIndices: [0],
      gateInventory: { 'X': 1, 'H': 2 },
      popups: [
        { title: 'Phase Matters', text: 'You must use exactly 3 laser gates total to achieve the |1⟩ state. The first X gate is locked in place.', trigger: 'onLoad' },
      ]    }),
    new Level({
      name: '10 - CNOT Gate',
      cols: 12, rows: 8,
      src: { col: 0, row: 4 },
      ions: [{ col: 4, row: 4 }, { col: 8, row: 5 }],
      walls: [{ col: 5, row: 5, type: 'orange' }, { col: 5, row: 6, type: 'orange' },{ col: 5, row: 7, type: 'orange' },{ col: 5, row: 4, type: 'orange' },{ col: 5, row: 3, type: 'orange' },{ col: 5, row: 2, type: 'orange' },{ col: 5, row: 1, type: 'orange' },{ col: 5, row: 0, type: 'orange' }],
      availableGates: ['X', 'CNOT'],
      goal: '|1⟩',
      winCondition: 'cnot-success',
      hint: 'Apply X-gate to Ion A, then route CNOT through both ions to flip Ion B',
      showResetButton: true,
      preInitialized: true,
      gateInventory: { 'X': 1, 'CNOT': 1 },
      popups: [
        { title: 'Objective', text: 'Read a state of |1⟩ from the 2nd ion using the new CNOT gate.', trigger: 'onLoad' },
        { title: 'Strategy', text: 'You can only reach Ion B with a CNOT laser gate (shown in green). An orange wall prevents direct access.', trigger: 'onLoad' },
        { title: 'CNOT Explained', text: 'When the 1st ion is |1⟩ and the laser hits both ions, the 2nd ion will turn to |1⟩.', trigger: 'onLaserGatesOpen' }
      ]    })
]
