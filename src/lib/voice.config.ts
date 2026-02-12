export const VOICE_CONFIG = {
    // The 'Experience': Nova-3 (Flagship, Lower WER, <300ms latency)
    model: "nova-3",
    language: "en",
    smart_format: true,

    // Voice Activity Detection (VAD) - Crucial for 'Hold-to-Talk' feel
    interim_results: true,
    utterance_end_ms: 1000,
    vad_events: true,

    // Audio Config
} as const;
