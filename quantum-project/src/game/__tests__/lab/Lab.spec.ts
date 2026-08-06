import { nextTick } from 'vue';
import { defineComponent } from 'vue';
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';

import Lab from '@/pages/Lab.vue';

const GameBoardStub = defineComponent({
  name: 'GameBoardStub',
  props: {
    level: { type: Object, default: null },
    sourceGates: { type: Array, default: () => [] },
    mode: { type: String, default: 'edit' },
    fillParent: { type: Boolean, default: false },
  },
  emits: ['item-drop', 'canvas-click', 'canvas-mirror-place'],
  template: `
    <div>
      <button class="add-source" @click="$emit('item-drop', 0, 0, 'source')">Add Source</button>
      <button class="add-ion" @click="$emit('item-drop', 1, 1, 'ion')">Add Ion</button>
      <button class="add-mirror" @click="$emit('item-drop', 2, 2, 'mirror')">Add Mirror</button>
      <button class="canvas-click" @click="$emit('canvas-click', 0, 0)">Canvas Click</button>
    </div>
  `,
});

function mountLab() {
  return mount(Lab, {
    global: {
      stubs: {
        GameBoard: GameBoardStub,
        ManualModal: true,
        MobileWarning: true,
      },
    },
  });
}

async function addSource(wrapper: ReturnType<typeof mountLab>) {
  wrapper.findComponent(GameBoardStub).vm.$emit('item-drop', 0, 0, 'source');
  await nextTick();
}

async function addIon(wrapper: ReturnType<typeof mountLab>, x: number, y: number) {
  wrapper.findComponent(GameBoardStub).vm.$emit('item-drop', x, y, 'ion');
  await nextTick();
}

async function addMirror(wrapper: ReturnType<typeof mountLab>, x: number, y: number) {
  wrapper.findComponent(GameBoardStub).vm.$emit('item-drop', x, y, 'mirror');
  await nextTick();
}

describe('Lab mode', () => {
  it('starts in edit mode and switches into play mode after building test level', async () => {
    const wrapper = mountLab();

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

    expect(wrapper.text()).toContain('Lab ModeDesign your own quantum puzzle levels Edit  Test Level Level InformationName: Custom LevelHint: Design your custom levelGoal: TestWin: anyAdd SourceAdd IonAdd MirrorCanvas Click Measure Last—HistoryNo measurements yetLab Mode Create your own custom levels in edit mode. Press the test level button on the left to play them. Right click to remove elements. Got it');
    expect(wrapper.text()).toContain('Level Information');
    expect(wrapper.text()).not.toContain('Palette');
  });

  it('blocks ion placement after six ions and shows win-condition controls only when ions exist', async () => {
    const wrapper = mountLab();

    expect(wrapper.text()).toContain('Place an ion to set win conditions');
    expect(wrapper.findAll('select')).toHaveLength(0);

    await addSource(wrapper);

    for (let index = 0; index < 6; index += 1) {
      await addIon(wrapper, index + 1, index + 1);
    }

    expect(wrapper.findAll('select')).toHaveLength(6);
    expect(wrapper.text()).not.toContain('Place an ion to set win conditions');

    await addIon(wrapper, 7, 7);

    expect(wrapper.text()).toContain('Limit reached: Maximum 6 ions allowed');
    expect(wrapper.findAll('select')).toHaveLength(6);
  });

  it('locks pre-placed mirrors when the level is tested', async () => {
    const wrapper = mountLab();

    await addSource(wrapper);
    await addIon(wrapper, 1, 1);
    await addMirror(wrapper, 2, 2);

    const testButtonBeforePlay = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Test Level'));

    await testButtonBeforePlay!.trigger('click');
    await nextTick();

    const playBoard = wrapper.findComponent(GameBoardStub);
    const playLevel = playBoard.props('level') as { isFixed: (col: number, row: number) => boolean; grid: string[][] };

    expect(playLevel.grid[2]?.[2]).toBe('fwd');
    expect(playLevel.isFixed(2, 2)).toBe(true);
  });

  it('preserves custom ion win conditions in lab play mode', async () => {
    const wrapper = mountLab();

    await addSource(wrapper);
    await addIon(wrapper, 1, 1);
    await addIon(wrapper, 2, 2);

    const selects = wrapper.findAll('select');
    await selects[0]!.setValue('0');
    await selects[1]!.setValue('1');

    const testButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Test Level'));

    await testButton!.trigger('click');
    await nextTick();

    expect(wrapper.text()).toContain('Win: 0,1');
  });
});
