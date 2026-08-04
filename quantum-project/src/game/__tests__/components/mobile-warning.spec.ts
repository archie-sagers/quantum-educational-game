import { nextTick } from 'vue';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';

import MobileWarning from '@/components/mobile/MobileWarning.vue'

const STORAGE_KEY = 'quantum_mobile_warning_dismissed';

function setViewport(isMobile: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: isMobile,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe('MobileWarning', () => {
  beforeEach(() => {
    localStorage.clear();
    setViewport(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not show the warning on desktop viewports', () => {
    setViewport(false);

    const wrapper = mount(MobileWarning);

    expect(wrapper.text()).not.toContain('Mobile Notice');
  });

it('shows the warning on mobile viewports', async () => {
  setViewport(true);

  const wrapper = mount(MobileWarning);

  await nextTick();

  expect(wrapper.text()).toContain('Mobile Notice');
  expect(wrapper.text()).toContain('best experienced on desktop');
});

  });
