import OpenAI from 'openai';
import { TranscriptionServiceInterface } from './transcriptionServiceInterface';

export class WhisperService extends TranscriptionServiceInterface {
    constructor() {
        super();
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) {
            console.error('VITE_OPENAI_API_KEY is missing');
        }
        this.openai = new OpenAI({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true
        });
        this.transcriptionCallback = null;
    }

    async connect() {
        // No persistent connection needed for Whisper
    }

    onTranscription(callback) {
        this.transcriptionCallback = callback;
    }

    async sendAudio(audioBlob) {
        try {
            // Determine extension from blob type
            const type = audioBlob.type;
            const ext = type.includes('mp4') ? 'm4a' : 'webm';
            const file = new File([audioBlob], `audio.${ext}`, { type });

            const response = await this.openai.audio.transcriptions.create({
                file: file,
                model: 'whisper-1',
                language: 'en',
            });

            if (this.transcriptionCallback) {
                this.transcriptionCallback(response.text, true); // true = final
            }
        } catch (error) {
            console.error('Transcription error:', error);
        }
    }

    disconnect() {
        // Nothing to clean up
    }
}
