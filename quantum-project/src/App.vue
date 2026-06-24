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
  top: 20px;
  left: 20px;
  display: flex;
  gap: 12px;
}

.navLink {
  cursor: pointer;
  background: var(--color-bg-light);
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  padding: 6px 14px;
  font-size: 11px;
  font-family: monospace;
  border-radius: 3px;
  transition: 0.2s;
  text-decoration: none;
  display: inline-block;
}

.navLink:hover {
  background: var(--color-bg-dark);
  box-shadow: 0 0 8px var(--color-primary);
}
</style>