<script setup lang="ts">
import { ref, onMounted } from 'vue'
import styles from './Home.module.css'

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
  <div v-if="showMobileWarning" :class="styles.welcomeOverlay" style="z-index: 10000;">
    <div :class="styles.welcomeModal">
      <div :class="styles.welcomeTitle" style="color: var(--color-danger);">Mobile Notice</div>
      <div :class="styles.welcomeText">
        Warning – this game is best experienced on desktop. Many features may not work properly on mobile.
      </div>
      <button @click="dismissMobileWarning(true)" :class="styles.welcomeBtn">Dismiss</button>
    </div>
  </div>
</template>
