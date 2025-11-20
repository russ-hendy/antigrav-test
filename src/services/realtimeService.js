import { TranscriptionServiceInterface } from './transcriptionServiceInterface';

export class RealtimeService extends TranscriptionServiceInterface {
    constructor() {
        super();
        this.peerConnection = null;
        this.dataChannel = null;
        this.transcriptionCallback = null;
        this.apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        this.audioStream = null;
    }

    async connect(stream) {
        this.audioStream = stream;
        if (!this.apiKey) {
            throw new Error('VITE_OPENAI_API_KEY is missing');
        }

        // 1. Get Ephemeral Token
        const tokenResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-realtime-preview-2024-10-01',
                voice: 'alloy',
            }),
        });

        if (!tokenResponse.ok) {
            throw new Error(`Failed to get session token: ${tokenResponse.statusText}`);
        }
        const data = await tokenResponse.json();
        const ephemeralKey = data.client_secret.value;

        // 2. Initialize WebRTC
        this.peerConnection = new RTCPeerConnection();

        // Setup Audio Handling (Incoming)
        this.peerConnection.ontrack = (event) => {
            const el = document.createElement('audio');
            el.srcObject = event.streams[0];
            el.autoplay = true;
            document.body.appendChild(el);
        };

        // Setup Data Channel
        this.dataChannel = this.peerConnection.createDataChannel('oai-events');
        this.dataChannel.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                this.handleEvent(msg);
            } catch (e) {
                console.error('Error parsing data channel message:', e);
            }
        };

        // 3. Add Local Audio Track
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, this.audioStream);
            });
        } else {
            console.warn('No audio stream provided to RealtimeService');
        }

        // 4. Create Offer & Handshake
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);

        const sdpResponse = await fetch(`https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ephemeralKey}`,
                'Content-Type': 'application/sdp',
            },
            body: offer.sdp,
        });

        if (!sdpResponse.ok) {
            throw new Error(`SDP handshake failed: ${sdpResponse.statusText}`);
        }

        const answerSdp = await sdpResponse.text();
        await this.peerConnection.setRemoteDescription({
            type: 'answer',
            sdp: answerSdp,
        });
    }

    handleEvent(event) {
        // Handle transcription events
        // Note: Realtime API events for transcription might differ from Whisper
        // We look for 'response.audio_transcript.delta' or similar
        if (event.type === 'response.audio_transcript.delta') {
            if (this.transcriptionCallback) {
                this.transcriptionCallback(event.delta, false);
            }
        } else if (event.type === 'response.audio_transcript.done') {
            if (this.transcriptionCallback) {
                this.transcriptionCallback(event.transcript, true);
            }
        }
    }

    onTranscription(callback) {
        this.transcriptionCallback = callback;
    }

    // For Realtime WebRTC, we don't send chunks manually. 
    // The audio track is streamed automatically.
    async sendAudio(audioBlob) {
        // No-op for WebRTC streaming
    }

    disconnect() {
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
            this.audioStream = null;
        }
    }
}
