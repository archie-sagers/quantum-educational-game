<script setup lang="ts">
defineEmits<{
  scrollToSection: [id: string]
}>()
</script>

<template>
  <nav class="manualSidebar">
    <div class="indexTitle">Index</div>
    <a class="indexLink" @click="$emit('scrollToSection', 'prep')">Ion Preparation</a>
    <a class="indexLink" @click="$emit('scrollToSection', 'qubit')">What is a Qubit?</a>
    <a class="indexLink" @click="$emit('scrollToSection', 'mechanics')">Basic Mechanics</a>
    <a class="indexLink" @click="$emit('scrollToSection', 'bloch-sphere')">The Bloch Sphere</a>
    <a class="indexLink" @click="$emit('scrollToSection', 'tips')">Tips for Success</a>
    <a class="indexLink" @click="$emit('scrollToSection', 'legend')">State Legend</a>
    
    <a class="indexLink" @click="$emit('scrollToSection', 'logic-gates')">Quantum Logic Gates</a>
    <a class="indexLink indexLinkSub" @click="$emit('scrollToSection', 'gate-x')">X-Gate</a>
    <a class="indexLink indexLinkSub" @click="$emit('scrollToSection', 'gate-h')">Hadamard Gate</a>
    <a class="indexLink indexLinkSub" @click="$emit('scrollToSection', 'gate-cnot')">C-NOT Gate</a>
    
    <a class="indexLink" @click="$emit('scrollToSection', 'quantum-mechanics')">Quantum Mechanics</a>
    <a class="indexLink indexLinkSub" @click="$emit('scrollToSection', 'qm-superposition')">Superposition</a>
    <a class="indexLink indexLinkSub" @click="$emit('scrollToSection', 'qm-phase')">Phase</a>
    <a class="indexLink indexLinkSub" @click="$emit('scrollToSection', 'qm-entanglement')">Entanglement</a>
    <a class="indexLink indexLinkSub" @click="$emit('scrollToSection', 'qm-bell')">Bell States</a>
    <a class="indexLink indexLinkSub" @click="$emit('scrollToSection', 'qm-ghz')">GHZ States</a>
    <a class="indexLink indexLinkSub" @click="$emit('scrollToSection', 'qm-uncomputing')">Uncomputing</a>
    <a class="indexLink indexLinkSub" @click="$emit('scrollToSection', 'qm-anticorrelation')">Anti-correlation</a>
    
    <a class="indexLink" @click="$emit('scrollToSection', 'trapped-ion')">What is a Trapped Ion?</a>
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
  color: var(--color-primary);
  font-size: 26px;
  font-weight: bold;
  letter-spacing: 0.1em;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--color-primary);
  padding-bottom: 8px;
}

.indexLink {
  display: block;
  color: var(--color-muted);
  text-decoration: none;
  font-family: var(--font-mono);
  font-size: 20px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: color var(--duration-fast);
}

.indexLink:hover {
  color: var(--color-primary);
}

.indexLinkSub {
  margin-left: 16px;
  font-size: 18px;
  color: var(--color-subtle);
}

.indexLinkSub:hover {
  color: var(--color-secondary);
}
</style>