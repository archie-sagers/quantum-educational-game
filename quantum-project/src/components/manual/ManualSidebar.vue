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

<style scoped src="./ManualStyles.css"></style>