/**
 * Base interface for transcription services
 */
export class TranscriptionServiceInterface {
    /**
     * Initialize connection or resources
     */
    async connect() { }

    /**
     * Send audio data for transcription
     * @param {Blob} audioBlob 
     */
    async sendAudio(audioBlob) { }

    /**
     * Register a callback for receiving transcription text
     * @param {Function} callback - (text: string, isFinal: boolean) => void
     */
    onTranscription(callback) { }

    /**
     * Cleanup resources
     */
    disconnect() { }
}
