<script setup lang="ts">
import { onErrorCaptured } from 'vue'
import { appError, clearAppError, reportAppError } from './stores/appError'

onErrorCaptured((error, instance, info) => {
  reportAppError(error, info)
  return false
})

function reloadPage() {
  window.location.reload()
}
</script>

<template>
  <nav class="navbar">
    <router-link to="/" class="navLink">Home</router-link>
    <router-link to="/lab" class="navLink">Lab</router-link>
  </nav>

  <main v-if="!appError" class="appShell">
    <router-view />
  </main>

  <main v-else class="errorShell" role="alert" aria-live="assertive">
    <section class="errorCard">
      <div class="errorLabel">Application error</div>
      <h1 class="errorTitle">Something went wrong</h1>
      <p class="errorMessage">{{ appError.message }}</p>
      <p v-if="appError.info" class="errorInfo">Context: {{ appError.info }}</p>
      <div class="errorActions">
        <button class="errorBtn" @click="clearAppError">Dismiss</button>
        <button class="errorBtn errorBtnPrimary" @click="reloadPage">Reload</button>
      </div>
    </section>
  </main>
</template>

<style>
body, html, #app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.appShell {
  width: 100%;
  height: 100%;
}

.errorShell {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  background: linear-gradient(160deg, var(--color-bg-dark), var(--color-bg));
}

.errorCard {
  width: min(640px, calc(100vw - 32px));
  padding: 24px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: rgba(10, 10, 12, 0.92);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
}

.errorLabel {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-danger);
  margin-bottom: 10px;
}

.errorTitle {
  margin: 0 0 12px 0;
  font-size: 28px;
  color: var(--color-text);
}

.errorMessage,
.errorInfo {
  margin: 0 0 10px 0;
  color: var(--color-subtle);
  font-size: 13px;
  line-height: 1.5;
}

.errorActions {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}

.errorBtn {
  border: 1px solid var(--color-border);
  background: var(--color-bg-light);
  color: var(--color-text);
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.errorBtnPrimary {
  background: var(--color-primary);
  color: var(--color-bg);
  border-color: var(--color-primary);
}
</style>

<style scoped>
.navbar {
  position: absolute;
  top: var(--space-lg);
  left: var(--space-lg);
  display: flex;
  gap: var(--space-md);
}

.navLink {
  cursor: pointer;
  background: var(--color-bg-light);
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  padding: 6px 14px;
  font-size: 20px;
  font-family: var(--font-mono);
  border-radius: var(--radius-sm);
  transition: var(--duration-fast);
  text-decoration: none;
  display: inline-block;
}

.navLink:hover {
  background: var(--color-bg-dark);
  box-shadow: 0 0 8px var(--color-primary);
}
</style>
