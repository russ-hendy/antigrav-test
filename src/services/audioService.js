import { ref } from 'vue';

export class AudioService {
    constructor() {
        this.mediaRecorder = null;
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.source = null;
        this.stream = null;
        this.isRecording = ref(false);
        this.volume = ref(0);
        this.onAudioChunk = null; // Callback for audio chunks
    }

    async startRecording(mode = 'chunked', chunkInterval = 3000) {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Setup Audio Analysis
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.source = this.audioContext.createMediaStreamSource(this.stream);
            this.source.connect(this.analyser);
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

            this.isRecording.value = true;
            this.animateVolume();

            if (mode === 'chunked') {
                // Setup MediaRecorder for Chunking
                const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
                this.mediaRecorder = new MediaRecorder(this.stream, mimeType ? { mimeType } : undefined);

                this.mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0 && this.onAudioChunk) {
                        this.onAudioChunk(event.data);
                    }
                };

                this.mediaRecorder.onstop = () => {
                    if (this.isRecording.value) {
                        this.mediaRecorder.start();
                        setTimeout(() => {
                            if (this.isRecording.value && this.mediaRecorder.state === 'recording') {
                                this.mediaRecorder.stop();
                            }
                        }, chunkInterval);
                    }
                };

                this.mediaRecorder.start();

                // Start the loop
                setTimeout(() => {
                    if (this.isRecording.value && this.mediaRecorder.state === 'recording') {
                        this.mediaRecorder.stop();
                    }
                }, chunkInterval);
            }

            return this.stream; // Return stream for external use (Realtime)

        } catch (error) {
            console.error('Error accessing microphone:', error);
            throw error;
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording.value) {
            this.mediaRecorder.stop();
            this.isRecording.value = false;
        }
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
    }

    animateVolume() {
        if (!this.isRecording.value) return;

        requestAnimationFrame(() => this.animateVolume());

        this.analyser.getByteFrequencyData(this.dataArray);
        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
        }
        this.volume.value = sum / this.dataArray.length;
    }
}
