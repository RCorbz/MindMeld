export const VOICE_CONFIG = {
    // The 'Experience': Nova-2 (Fastest, most accurate for commands)
    model: "nova-2",
    language: "en",
    smart_format: true,

    // Voice Activity Detection (VAD) - Crucial for 'Hold-to-Talk' feel
    interim_results: true,
    utterance_end_ms: 1000,
    vad_events: true,

    // Audio Config
} as const;
