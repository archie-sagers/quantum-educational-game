<script setup lang="ts">
import { ref, onMounted } from 'vue'
import OverlayModal from '@/components/ui/OverlayModal.vue' 

const STORAGE_KEY = 'quantum_mobile_warning_dismissed'
const showMobileWarning = ref(false)

function checkMobileWarning() {
  const isMobile = window.matchMedia('(max-width: 768px)').matches
  const dismissed = localStorage.getItem(STORAGE_KEY)
  showMobileWarning.value = isMobile && !dismissed
}

function dismissMobileWarning(remember = true) {
  showMobileWarning.value = false
  if (remember) {
    localStorage.setItem(STORAGE_KEY, '1')
  }
}

onMounted(() => {
  checkMobileWarning()
})
</script>

<template>
  <OverlayModal
    :show="showMobileWarning"
    kind="welcome"
    title="Mobile Notice"
    text="Warning – this game is best experienced on desktop. Many features may not work properly on mobile."
    :z-index="10000"
    :title-style="{ color: 'var(--color-danger)' }"
    :buttons="[
      { label: 'Dismiss', onClick: () => dismissMobileWarning(true) }
    ]"
  />
</template>