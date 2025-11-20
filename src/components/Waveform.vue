<script setup>
import { computed } from 'vue';

const props = defineProps({
  volume: {
    type: Number,
    default: 0
  },
  isRecording: {
    type: Boolean,
    default: false
  }
});

// Create a dynamic style for the bars based on volume
const bars = computed(() => {
  const count = 5;
  return Array.from({ length: count }).map((_, i) => {
    // Randomize slightly but scale with volume
    // Volume is roughly 0-255
    const normalizedVol = Math.min(props.volume / 100, 1); // Cap at 1 for scaling
    const baseHeight = 20;
    const variableHeight = normalizedVol * 80; 
    const height = props.isRecording ? Math.max(baseHeight, variableHeight * (0.5 + Math.random())) : 4;
    
    return {
      height: `${height}%`,
      animationDelay: `${i * 0.1}s`
    };
  });
});
</script>

<template>
  <div class="flex items-center justify-center h-32 gap-2 bg-gray-900 rounded-xl p-4 w-full max-w-md mx-auto shadow-inner shadow-black/50">
    <div 
      v-for="(bar, index) in bars" 
      :key="index"
      class="w-3 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-full transition-all duration-75 ease-out"
      :style="{ height: bar.height }"
    ></div>
  </div>
</template>
