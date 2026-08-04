import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../../../App.vue'
import { appError, clearAppError, reportAppError } from '../../../stores/appError'

const { mockRoute } = vi.hoisted(() => ({
  mockRoute: { path: '/' }
}))

// Mock vue-router
vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
}))

afterEach(() => {
  clearAppError()
  mockRoute.path = '/' // reset the route after each test
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

  it('shows the Discord button on non-lab pages', () => {
    mockRoute.path = '/'

    const wrapper = mount(App, {
      global: {
        stubs: {
          RouterLink: true,
          RouterView: true,
        },
      },
    })

    expect(wrapper.find('.discordLink').exists()).toBe(true)
    expect(wrapper.text()).toContain('Discord')
  })

  it('hides the Discord button when on the lab page', () => {
    mockRoute.path = '/lab'

    const wrapper = mount(App, {
      global: {
        stubs: {
          RouterLink: true,
          RouterView: true,
        },
      },
    })

    expect(wrapper.find('.discordLink').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Discord')
  })
})