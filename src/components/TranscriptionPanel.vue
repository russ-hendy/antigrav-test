<script setup>
import { ref, watch, nextTick } from 'vue';

const props = defineProps({
  transcript: {
    type: String,
    default: ''
  }
});

const containerRef = ref(null);

// Auto-scroll to bottom when transcript changes
watch(() => props.transcript, async () => {
  await nextTick();
  if (containerRef.value) {
    containerRef.value.scrollTop = containerRef.value.scrollHeight;
  }
});
</script>

<template>
  <div class="w-full max-w-2xl mx-auto mt-8">
    <div class="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 h-96 flex flex-col shadow-xl">
      <h2 class="text-gray-400 text-sm font-medium mb-4 uppercase tracking-wider">Live Transcript</h2>
      
      <div 
        ref="containerRef"
        class="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent"
      >
        <p v-if="!transcript" class="text-gray-500 italic text-center mt-20">
          Start speaking to see transcription...
        </p>
        <p v-else class="text-gray-100 text-lg leading-relaxed whitespace-pre-wrap">
          {{ transcript }}
        </p>
      </div>
    </div>
  </div>
</template>
