import { nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';

import styles from '@/pages/Home.module.css';
import Home from '@/pages/Home.vue'

vi.mock('@/components/manual/ManualModal.vue', () => ({
  default: defineComponent({
    name: 'ManualModalMock',
    template: '<div />',
  }),
}));

vi.mock('@/components/GameBoard.vue', () => ({
  default: defineComponent({
    name: 'GameBoardMock',
    template: '<div />',
  }),
}));

vi.mock('@/components/mobile/MobileWarning.vue', () => ({
  default: defineComponent({
    name: 'MobileWarningMock',
    template: '<div />',
  }),
}));

vi.mock('@/components/tutorial/tutorial.vue', () => ({
  default: defineComponent({
    name: 'TutorialMock',
    template: '<div />',
  }),
  TUTORIAL_STEPS: [],
}));

vi.mock('@/components/minigames/HeatingMinigame.vue', () => ({
  default: defineComponent({ name: 'HeatingMinigameMock', template: '<div />' }),
}));

vi.mock('@/components/minigames/IonizationMinigame.vue', () => ({
  default: defineComponent({ name: 'IonizationMinigameMock', template: '<div />' }),
}));

vi.mock('@/components/minigames/TrapMinigame.vue', () => ({
  default: defineComponent({ name: 'TrapMinigameMock', template: '<div />' }),
}));

vi.mock('@/components/minigames/DopplerCoolingMinigame.vue', () => ({
  default: defineComponent({ name: 'DopplerCoolingMinigameMock', template: '<div />' }),
}));

const GameBoardStub = defineComponent({
  name: 'GameBoardStub',
  props: {
    level: { type: Object, default: null },
    sourceGates: { type: Array, default: () => [] },
    mode: { type: String, default: 'play' },
    fillParent: { type: Boolean, default: false },
  },
  emits: ['canvas-click', 'canvas-mirror-place', 'item-drop'],
  template: '<div class="gameboard-stub" />',
});

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('Home page manual glow', () => {
  it('glows the manual button after the hint is shown', async () => {
    localStorage.setItem('quantum_save_stage', 'main');
    localStorage.setItem('quantum_save_level', '0');

    const wrapper = mount(Home, {
      global: {
        stubs: {
          ManualModal: true, 
          Tutorial: true
        },
      },
    });

    const hintButton = wrapper.findAll('button').find((button) => button.text() === 'Show Hint');
    expect(hintButton).toBeTruthy();

    await hintButton!.trigger('click');
    await nextTick();
    await nextTick();

    const manualButton = wrapper.findAll('button').find((button) => button.text() === 'Manual');
    expect(manualButton?.classes()).toContain(styles.manualBtnGlow);
    expect(wrapper.text()).toContain('Press reset to initialise the ion, then measure it');
  });
});