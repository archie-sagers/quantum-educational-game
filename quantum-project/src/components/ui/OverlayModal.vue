<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import styles from '@/pages/Home.module.css'

let overlayModalId = 0

export interface OverlayButton {
  label: string
  onClick: () => void
  class?: string
  style?: Record<string, string>
}

const props = withDefaults(defineProps<{
  show: boolean
  title: string
  text?: string
  kind?: 'welcome' | 'popup'
  buttons?: OverlayButton[]
  accent?: 'success' | null
  closeOnBackdrop?: boolean
  zIndex?: number
  modalStyle?: Record<string, string>
  titleStyle?: Record<string, string>
}>(), {
  kind: 'popup',
  buttons: () => [],
  accent: null,
  closeOnBackdrop: false,
})

const emit = defineEmits<{ (e: 'backdrop-click'): void }>()

const modalRef = ref<HTMLElement | null>(null)
const instanceId = ++overlayModalId
const titleId = `overlay-modal-title-${instanceId}`
const textId = `overlay-modal-text-${instanceId}`

watch(
  () => props.show,
  async (show) => {
    if (show) {
      await nextTick()
      modalRef.value?.focus()
    }
  },
)

const overlayClass = computed(() => props.kind === 'welcome' ? styles.welcomeOverlay : styles.popupOverlay)
const modalClass = computed(() => props.kind === 'welcome' ? styles.welcomeModal : styles.popupModal)
const titleClass = computed(() => props.kind === 'welcome' ? styles.welcomeTitle : styles.popupTitle)
const textClass = computed(() => props.kind === 'welcome' ? styles.welcomeText : styles.popupText)
const defaultBtnClass = computed(() => props.kind === 'welcome' ? styles.welcomeBtn : styles.popupBtn)

const accentStyle = computed(() => {
  if (props.accent !== 'success') return {}
  return {
    borderColor: 'var(--color-success)',
    boxShadow: 'var(--shadow-glow-success)',
  }
})

const overlayStyle = computed(() => (props.zIndex ? { zIndex: String(props.zIndex) } : {}))
const combinedModalStyle = computed(() => ({ ...accentStyle.value, ...(props.modalStyle || {}) }))

function handleBackdropClick() {
  if (props.closeOnBackdrop) emit('backdrop-click')
}
</script>

<template>
  <div v-if="show" :class="overlayClass" :style="overlayStyle" @click="handleBackdropClick">
    <div
      ref="modalRef"
      :class="modalClass"
      :style="combinedModalStyle"
      @click.stop
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      :aria-describedby="text ? textId : undefined"
      tabindex="-1"
    >
      <div :id="titleId" :class="titleClass" :style="titleStyle">{{ title }}</div>
      <div v-if="text" :id="textId" :class="textClass">{{ text }}</div>

      <slot />

      <div v-if="buttons.length" style="display: flex; gap: 12px; justify-content: center; margin-top: 12px;">
        <button
          v-for="(btn, i) in buttons"
          :key="i"
          :class="btn.class || defaultBtnClass"
          :style="btn.style"
          @click="btn.onClick"
        >
          {{ btn.label }}
        </button>
      </div>

      <slot name="footer" />
    </div>
  </div>
</template>