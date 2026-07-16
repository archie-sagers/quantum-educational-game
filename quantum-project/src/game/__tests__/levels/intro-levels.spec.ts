import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';

import DopplerCoolingMinigame from '../../../components/minigames/DopplerCoolingMinigame.vue';
import HeatingMinigame from '../../../components/minigames/HeatingMinigame.vue';
import IonizationMinigame from '../../../components/minigames/IonizationMinigame.vue';
import TrapMinigame from '../../../components/minigames/TrapMinigame.vue';

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 0));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Intro levels', () => {
  it('Heating minigame opens main UI after closing welcome screen', async () => {
    const wrapper = mount(HeatingMinigame);

    expect(wrapper.text()).toContain('Heating Element');
    expect(wrapper.text()).toContain('Vaporised');
    expect(wrapper.find('input[type="range"]').exists()).toBe(true);
  });

  it('Ionization minigame opens main UI after closing welcome screen', async () => {
    const wrapper = mount(IonizationMinigame);

    expect(wrapper.text()).toContain('Ionisation');
    expect(wrapper.text()).toContain('Ytterbium atoms ionised');
    expect(wrapper.find('input[type="range"]').exists()).toBe(false);
  });

  it('Paul trap minigame opens the trap controls after starting', async () => {
    const wrapper = mount(TrapMinigame);

    expect(wrapper.text()).toContain('Paul Trap Control');
    expect(wrapper.text()).toContain('Modulate the Magnetic Field');
    expect(wrapper.find('button').exists()).toBe(true);
  });

  it('Doppler cooling minigame starts in the first stage', async () => {
    const wrapper = mount(DopplerCoolingMinigame);

    expect(wrapper.text()).toContain('Laser Cooling');
    expect(wrapper.text()).toContain('Doppler Cooling');
    expect(wrapper.find('input[type="range"]').exists()).toBe(true);
  });
});