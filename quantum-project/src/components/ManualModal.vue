<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import ManualSidebar from './manual/ManualSidebar.vue'
import ManualContent from './manual/ManualContent.vue'

const props = defineProps<{
  isOpen: boolean
  targetSection?: string | null
}>()

const emit = defineEmits<{
  close: []
  selectLevel: [index: number]
}>()

const modalRef = ref<HTMLElement | null>(null)

function goToLevel(index: number) {
  emit('selectLevel', index)
  emit('close')
}

function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (el && modalRef.value) {
    modalRef.value.scrollTo({
      top: el.offsetTop - 32, 
      behavior: 'smooth'
    })
  }
}

function saveScrollPosition(e: Event) {
  const target = e.target as HTMLElement
  localStorage.setItem('quantum_manual_scroll', target.scrollTop.toString())
}

// rstore scroll position when the modal opens
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    nextTick(() => {
      if (modalRef.value) {
        if (props.targetSection) {
          // If a target section is specified, scroll to that section
          scrollToSection(props.targetSection)
        } else {
          const savedScroll = localStorage.getItem('quantum_manual_scroll')
          if (savedScroll) {
            modalRef.value.scrollTop = parseInt(savedScroll, 10)
          }
        }
      }
    })
  }
})
</script>

<template>
  <div v-if="isOpen" class="manualOverlay" @click="$emit('close')">
    <div class="manualModal" ref="modalRef" @scroll="saveScrollPosition" @click.stop>
      <button @click="$emit('close')" class="manualCloseBtn">✕</button>
      
      <ManualSidebar @scrollToSection="scrollToSection" />
      <ManualContent @goToLevel="goToLevel" />
    </div>
  </div>
</template>

<style scoped>
.manualOverlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.manualModal {
  background: var(--color-bg-light);
  border: 2px solid var(--color-primary);
  border-radius: 4px;
  padding: 32px;
  max-width: 1040px; 
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: var(--shadow-glow);
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 32px;
}

.manualCloseBtn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: transparent;
  border: none;
  color: var(--color-primary);
  font-size: 24px;
  cursor: pointer;
  transition: 0.2s;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.manualCloseBtn:hover {
  color: var(--color-primary-light);
  transform: scale(1.2);
}
</style>