import { afterEach, describe, expect, it } from 'vitest'

import { mount } from '@vue/test-utils'
import App from '../../../App.vue'
import { appError, clearAppError, reportAppError } from '../../../stores/appError';

afterEach(() => {
  clearAppError()
})

describe('App', () => {
  it('renders a fallback when a global error is reported', () => {
    reportAppError(new Error('Boom'), 'Lab page')

    const wrapper = mount(App, {
      global: {
        stubs: {
          RouterLink: true,
          RouterView: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Application error')
    expect(wrapper.text()).toContain('Boom')
    expect(wrapper.text()).toContain('Lab page')
    expect(appError.value?.message).toBe('Boom')
  })
})
