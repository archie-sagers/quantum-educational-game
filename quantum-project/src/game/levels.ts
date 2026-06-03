import { Level } from './quantumgame'

export const LEVELS = [
  new Level({
    name: '1 - Initialisation and Measurement',
    cols: 12, rows: 8,
    src: { col: 0, row: 4 },
    ion: { col: 11, row: 4 },
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
    ion: { col: 11, row: 4 },
    walls: [{ col: 6, row: 3 }, { col: 6, row: 4 }, { col: 6, row: 5 }],
    goal: '|0⟩',
    winCondition: 'normal',
    hint: 'Place mirrors to route the laser around the wall and hit the ion',
    showResetButton: true,
    preInitialized: false,
    popups: [
      { title: 'Mirrors', text: 'The wall is blocking the direct path. Use mirrors to route the laser beam around it.', trigger: 'onLoad' },
      { title: 'How to Place Mirrors', text: 'Left-click on the grid to place or rotate mirrors. Right-click to remove them. Once you route the beam to the ion, press Reset.', trigger: 'onLoad' },
      { title: 'Reset and Measure', text: 'Measure the ion to complete the level.', trigger: 'onLaserToIon' }
    ]
  }),
  new Level({
    name: '3 - The X-Gate',
    cols: 12, rows: 8,
    src: { col: 0, row: 4 },
    ion: { col: 11, row: 4 },
    availableGates: ['X'],
    goal: '|1⟩',
    winCondition: 'normal',
    hint: 'Select the X-gate from the laser menu and measure the ion',
    showResetButton: false,
    preInitialized: true,
    popups: [
      { title: 'Ion Initialised', text: 'The ion has been initialised to the ground state |0⟩ for you.', trigger: 'onLoad' },
      { title: 'The X-Gate', text: 'Click on the laser source to open the laser gates menu.', trigger: 'onLoad' },
      { title: 'Apply X-Gate', text: 'Select the red X-gate and drag it to the laser. This will flip the qubit to |1⟩.', trigger: 'onLaserGatesOpen' }
    ]
  }),
  new Level({
    name: '4 - Reflection With The X-Gate',
    cols: 12, rows: 8,
    src: { col: 0, row: 4 },
    ion: { col: 11, row: 4 },
    walls: [{ col: 6, row: 3 }, { col: 6, row: 4 }, { col: 6, row: 5 }],
    availableGates: ['X'],
    goal: '|1⟩',
    winCondition: 'normal',
    hint: 'Route the red laser to hit the ion and measure it',
    showResetButton: false,
    preInitialized: true,
    popups: []
  }),
  new Level({
    name: '5 - Superposition',
    cols: 12, rows: 8,
    src: { col: 0, row: 4 },
    ion: { col: 11, row: 4 },
    availableGates: ['H'],
    goal: '|0⟩',
    winCondition: 'normal',
    hint: 'Apply another Hadamard gate to take the ion out of superposition and measure |0⟩',
    showResetButton: false,
    preInitialized: true,
    popups: [
      { title: 'Superposition', text: 'The ion is already in a superposition |+⟩. We want to measure |0⟩. Can you apply another Hadamard gate to collapse the superposition back to |0⟩?', trigger: 'onLoad' }
    ]
  }),
  new Level({
    name: '6 - Hadamard Gate',
    cols: 12, rows: 8,
    src: { col: 0, row: 4 },
    ion: { col: 11, row: 4 },
    availableGates: ['H'],
    goal: '|+⟩',
    winCondition: 'normal',
    hint: 'Use the Hadamard gate to put the ion into a superposition, then measure to see the distribution',
    showResetButton: true,
    preInitialized: true,
    automateMeasurement: true,
    popups: [
      { title: 'Hadamard Gate', text: 'Now we want the ion in a superposition. Use the Hadamard gate to put the ion into |+⟩.', trigger: 'onLoad' },
      { title: 'Automated Measurement', text: 'We will now automatically reset and measure the ion 10 times to show the effect of superposition (roughly 50/50 split between |0⟩ and |1⟩).', trigger: 'onAutomatedStart' },
    ]
  })
]
