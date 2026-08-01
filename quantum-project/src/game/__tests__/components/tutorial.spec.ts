import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';

import Tutorial, { TUTORIAL_STEPS } from '@/components/tutorial.vue';

describe('Tutorial component', () => {
  it('opens the matching manual section from the gate info buttons', async () => {
    const wrapper = mount(Tutorial, {
      props: {
        visible: true,
        phase: 'tutorial-sandbox',
        stepIndex: 0,
        stepCount: TUTORIAL_STEPS.length,
        title: TUTORIAL_STEPS[0]?.title ?? 'Goal',
        text: TUTORIAL_STEPS[0]?.text ?? '',
        targetRect: null,
      },
    });

    const infoButtons = wrapper
      .findAll('button')
      .filter((button) => button.text().trim() === 'i');

    expect(infoButtons).toHaveLength(2);

    await infoButtons[0]!.trigger('click');
    await infoButtons[1]!.trigger('click');

    expect(wrapper.emitted('openManualSection')).toEqual([['gate-x'], ['gate-h']]);
  });
});