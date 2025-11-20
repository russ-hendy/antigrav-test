<script setup>
import { ref, onUnmounted, watch } from 'vue';
import { Mic, Square, Activity, Zap, FileAudio } from 'lucide-vue-next';
import Waveform from './components/Waveform.vue';
import TranscriptionPanel from './components/TranscriptionPanel.vue';
import { AudioService } from './services/audioService';
import { WhisperService } from './services/whisperService';
import { RealtimeService } from './services/realtimeService';

const audioService = new AudioService();
const whisperService = new WhisperService();
const realtimeService = new RealtimeService();

const isRecording = ref(false);
const useRealtime = ref(false); // Toggle state
const volume = audioService.volume;
const transcript = ref('');
const isProcessing = ref(false);

// Handle audio chunks (Whisper Mode)
audioService.onAudioChunk = async (blob) => {
  if (useRealtime.value) return; // Ignore chunks in Realtime mode
  
  isProcessing.value = true;
  try {
    await whisperService.sendAudio(blob);
  } catch (error) {
    console.error('Transcription failed:', error);
  } finally {
    isProcessing.value = false;
  }
};

// Setup Whisper Callback
whisperService.onTranscription((text, isFinal) => {
  if (text) {
    transcript.value += (transcript.value ? ' ' : '') + text;
  }
});

// Setup Realtime Callback
realtimeService.onTranscription((text, isFinal) => {
  if (text) {
    // Realtime sends deltas, so we might need to handle accumulation differently
    // For simplicity, we just append for now, but Realtime API logic can be complex
    // Ideally we'd handle 'delta' vs 'done' events more gracefully in the UI
    // But appending deltas directly works for a basic stream
    transcript.value += text; 
  }
});

const toggleRecording = async () => {
  if (isRecording.value) {
    // STOP
    audioService.stopRecording();
    if (useRealtime.value) {
      realtimeService.disconnect();
    } else {
      whisperService.disconnect();
    }
    isRecording.value = false;
  } else {
    // START
    try {
      const mode = useRealtime.value ? 'continuous' : 'chunked';
      const stream = await audioService.startRecording(mode, 3000);
      
      if (useRealtime.value) {
        await realtimeService.connect(stream);
      } else {
        await whisperService.connect();
      }
      
      isRecording.value = true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Could not start recording. Check console for details.');
    }
  }
};

// Watch for mode change to reset if recording
watch(useRealtime, () => {
  if (isRecording.value) {
    toggleRecording(); // Stop current
    transcript.value = ''; // Clear transcript on mode switch? Maybe optional.
  }
});

onUnmounted(() => {
  audioService.stopRecording();
  realtimeService.disconnect();
  whisperService.disconnect();
});
</script>

<template>
  <div class="min-h-screen bg-gray-950 text-white font-sans selection:bg-blue-500/30">
    <div class="container mx-auto px-4 py-12 flex flex-col items-center min-h-screen">
      
      <!-- Header -->
      <header class="text-center mb-8 space-y-2">
        <div class="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-full mb-4 ring-1 ring-blue-500/50">
          <Activity class="w-6 h-6 text-blue-400" />
        </div>
        <h1 class="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent tracking-tight">
          Sonic Scribe
        </h1>
        <p class="text-gray-400 text-lg">Real-time AI Transcription</p>
      </header>

      <!-- Mode Toggle -->
      <div class="flex items-center gap-4 bg-gray-900/50 p-1.5 rounded-full border border-gray-800 mb-8">
        <button 
          @click="useRealtime = false"
          class="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
          :class="!useRealtime ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'"
        >
          <FileAudio class="w-4 h-4" />
          Whisper
        </button>
        <button 
          @click="useRealtime = true"
          class="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
          :class="useRealtime ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20' : 'text-gray-400 hover:text-gray-200'"
        >
          <Zap class="w-4 h-4" />
          Realtime
        </button>
      </div>

      <!-- Main Controls -->
      <main class="w-full max-w-3xl flex flex-col items-center gap-8">
        
        <!-- Waveform Visualization -->
        <div class="w-full transition-opacity duration-500" :class="{ 'opacity-100': isRecording, 'opacity-50': !isRecording }">
          <Waveform :volume="volume" :isRecording="isRecording" />
        </div>

        <!-- Record Button -->
        <button 
          @click="toggleRecording"
          class="group relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500/30"
          :class="isRecording ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/40' : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/40'"
        >
          <div class="absolute inset-0 rounded-full border border-white/20 group-hover:scale-110 transition-transform duration-300"></div>
          <Square v-if="isRecording" class="w-8 h-8 text-white fill-current" />
          <Mic v-else class="w-8 h-8 text-white" />
        </button>

        <div class="text-sm font-medium tracking-wide text-gray-500 uppercase">
          {{ isRecording ? 'Listening...' : 'Tap to Record' }}
        </div>

        <!-- Transcription Output -->
        <TranscriptionPanel :transcript="transcript" />

      </main>

      <!-- Footer -->
      <footer class="mt-auto pt-12 text-gray-600 text-sm">
        <p>Powered by OpenAI Whisper</p>
      </footer>

    </div>
  </div>
</template>

<style>
/* Global scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #374151;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #4b5563;
}
</style>
