<script setup lang="ts">
defineEmits<{
  scrollToSection: [id: string]
}>()
</script>

<template>
  <nav class="manualSidebar">
    <div class="indexTitle">Index</div>
    <a class="indexLink" @click="$emit('scrollToSection', 'prep')">Ion Preparation</a>
    <a class="indexLink" @click="$emit('scrollToSection', 'mechanics')">Basic Mechanics</a>
    <a class="indexLink" @click="$emit('scrollToSection', 'logic-gates')">Quantum Logic Gates</a>
    <a class="indexLink indexLinkSub" @click="$emit('scrollToSection', 'gate-x')">X-Gate</a>
    <a class="indexLink indexLinkSub" @click="$emit('scrollToSection', 'gate-h')">Hadamard Gate</a>
    <a class="indexLink indexLinkSub" @click="$emit('scrollToSection', 'gate-cnot')">C-NOT Gate</a>
    <a class="indexLink" @click="$emit('scrollToSection', 'quantum-mechanics')">Quantum Mechanics</a>
    <a class="indexLink indexLinkSub" @click="$emit('scrollToSection', 'qm-superposition')">Superposition</a>
    <a class="indexLink indexLinkSub" @click="$emit('scrollToSection', 'qm-entanglement')">Entanglement</a>
    <a class="indexLink indexLinkSub" @click="$emit('scrollToSection', 'qm-bell')">Bell States</a>
    <a class="indexLink indexLinkSub" @click="$emit('scrollToSection', 'qm-ghz')">GHZ States</a>
    <a class="indexLink" @click="$emit('scrollToSection', 'bloch-sphere')">The Bloch Sphere</a>
    <a class="indexLink" @click="$emit('scrollToSection', 'tips')">Tips for Success</a>
    <a class="indexLink" @click="$emit('scrollToSection', 'legend')">State Legend</a>
  </nav>
</template>

<style scoped>
.manualSidebar {
  position: sticky;
  top: 0;
  width: 200px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.indexTitle {
  color: #0ef;
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 0.1em;
  margin-bottom: 20px;
  border-bottom: 1px solid #0ef;
  padding-bottom: 8px;
}

.indexLink {
  display: block;
  color: #aaa;
  text-decoration: none;
  font-family: monospace;
  font-size: 14px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: color 0.2s;
}

.indexLink:hover {
  color: #0ef;
}

.indexLinkSub {
  margin-left: 16px;
  font-size: 12px;
  color: #888;
}

.indexLinkSub:hover {
  color: #b47cff;
}
</style>
