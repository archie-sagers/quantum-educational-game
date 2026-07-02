<script setup lang="ts"></script>

<template>
  <nav class="navbar">
    <router-link to="/" class="navLink">Home</router-link>
    <router-link to="/lab" class="navLink">Lab</router-link>
  </nav>

  <router-view />
</template>

<style>
body, html, #app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
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
  font-size: 11px;
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