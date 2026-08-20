<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from 'vue'
import ManualSidebar from './ManualSidebar.vue'
import ManualContent from './ManualContent.vue'

let scrollSaveTimeout: number | null = null

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
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function saveScrollPosition(e: Event) {
  const target = e.target as HTMLElement
  if (scrollSaveTimeout !== null) clearTimeout(scrollSaveTimeout)
  scrollSaveTimeout = window.setTimeout(() => {
    localStorage.setItem('quantum_manual_scroll', target.scrollTop.toString())
  }, 300) // Save scroll position after 300ms of inactivity
}

onUnmounted(() => {
  if (scrollSaveTimeout !== null) clearTimeout(scrollSaveTimeout)
})

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
      <ManualContent @goToLevel="goToLevel" @scrollToSection="scrollToSection" />
    </div>
  </div>
</template>

<style scoped src="./manual.css"></style>