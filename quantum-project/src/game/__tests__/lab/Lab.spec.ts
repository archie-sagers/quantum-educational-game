import { nextTick } from 'vue';
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';

import Lab from '../Lab.vue';

const GameBoardStub = {
  template: `
    <div>
      <button class="add-source" @click="$emit('item-drop', 0, 0, 'source')">Add Source</button>
      <button class="canvas-click" @click="$emit('canvas-click', 0, 0)">Canvas Click</button>
    </div>
  `,
};

describe('Lab mode', () => {
  it('starts in edit mode and switches into play mode after building test level', async () => {
    const wrapper = mount(Lab, {
      global: {
        stubs: {
          GameBoard: GameBoardStub,
          ManualModal: true,
        },
      },
    });

    expect(wrapper.text()).toContain('Palette');
    expect(wrapper.text()).toContain('Test Level');

    const testLevelButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Test Level'));

    expect(testLevelButton?.attributes('disabled')).toBeDefined();

    await wrapper.get('button.add-source').trigger('click');
    await nextTick();

    const enabledTestLevelButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Test Level'));

    expect(enabledTestLevelButton?.attributes('disabled')).toBeUndefined();

    await enabledTestLevelButton!.trigger('click');
    await nextTick();

    expect(wrapper.text()).toContain('Test Results');
    expect(wrapper.text()).toContain('Level Information');
    expect(wrapper.text()).not.toContain('Palette');
  });
});
