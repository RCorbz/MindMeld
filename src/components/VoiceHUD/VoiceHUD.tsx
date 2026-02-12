"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, Check } from "lucide-react";
import { motion } from "framer-motion";
import { createClient, LiveClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import { VOICE_CONFIG } from "@/lib/voice.config";

export default function VoiceHUD() {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [connection, setConnection] = useState<LiveClient | null>(null);
    const [processing, setProcessing] = useState(false);
    const [taskId, setTaskId] = useState<string | null>(null);

    // T.I.D.E. State
    const [tide, setTide] = useState({
        T: false, // Task
        I: false, // Impact
        D: false, // Deadline
        E: false, // Effort
    });

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    // 1. T.I.D.E. Regex Logic
    useEffect(() => {
        if (!transcript) return;

        const lower = transcript.toLowerCase();

        setTide({
            // Topic is "detected" if we have a reasonable amount of context (e.g. > 5 words)
            T: lower.split(" ").length > 5,
            // Impact: Monies, importance
            I: /(\$|dollar|revenue|critical|important|high stakes|priority|urgent)/.test(lower),
            // Deadline: Timeframes
            D: /(today|tomorrow|friday|monday|tuesday|wednesday|thursday|january|february|soon|deadline|next week)/.test(lower),
            // Effort: Duration
            E: /(hour|minute|day|week|month|mins|secs|time)/.test(lower),
        });
    }, [transcript]);

    // 2. Start Recording
    const startRecording = async () => {
        setIsRecording(true);
        setTranscript("");

        try {
            // Get Temp Key
            const response = await fetch("/api/transcribe");
            const data = await response.json();

            if (!data.key) throw new Error("No key returned");

            const deepgram = createClient(data.key);

            // Connect to Deepgram
            const conn = deepgram.listen.live(VOICE_CONFIG);

            conn.on(LiveTranscriptionEvents.Open, () => {
                console.log("🌊 Deepgram Connection OPEN");

                // Start Microphone
                navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
                    console.log("🎤 Microphone Access GRANTED");

                    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                        ? "audio/webm;codecs=opus"
                        : "audio/webm";

                    console.log(`ℹ️ Using MIME Type: ${mimeType}`);

                    const mediaRecorder = new MediaRecorder(stream, { mimeType });
                    mediaRecorderRef.current = mediaRecorder;

                    mediaRecorder.addEventListener("dataavailable", (event) => {
                        if (event.data.size > 0 && conn.getReadyState() === 1) {
                            conn.send(event.data);
                            console.log(`📤 Sent audio chunk: ${event.data.size} bytes`);
                        }
                    });

                    mediaRecorder.start(250); // Send chunks every 250ms
                }).catch(err => console.error("🎤 Microphone Access DENIED:", err));
            });

            conn.on(LiveTranscriptionEvents.Transcript, (data) => {
                const sentence = data.channel.alternatives[0]?.transcript; // Optional chaining
                if (sentence) {
                    console.log("📝 Transcript received:", sentence);
                    setTranscript((prev) => prev + " " + sentence);
                }
            });

            conn.on(LiveTranscriptionEvents.Error, (err) => {
                console.error("🌊 Deepgram Error:", err);
            });

            conn.on(LiveTranscriptionEvents.Close, () => {
                console.log("🌊 Deepgram Connection CLOSED");
            });

            setConnection(conn);

        } catch (error) {
            console.error("❌ Recording Start Error:", error);
            setIsRecording(false);
        }
    };

    // 3. Stop Recording
    const stopRecording = async () => {
        setIsRecording(false);

        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current = null;
        }

        if (connection) {
            connection.requestClose();
            setConnection(null);
        }

        // REAL BACKEND INTEGRATION
        if (transcript.length > 5) {
            setProcessing(true);

            try {
                const response = await fetch("/api/parse", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ transcript }),
                });

                const data = await response.json();

                if (response.ok && data.id) {
                    setTaskId(data.id.substring(0, 8).toUpperCase()); // Show short UUID
                } else {
                    console.error("Parse Failed:", data.error);
                    setTaskId("ERROR"); // Fallback
                }
            } catch (err) {
                console.error("Network Error:", err);
                setTaskId("OFFLINE");
            } finally {
                setProcessing(false);
            }
        }
    };

    const resetForNextTask = () => {
        setTaskId(null);
        setTranscript("");
        setTide({ T: false, I: false, D: false, E: false });
    };

    const ProgressBar = ({ label, subLabel, active, color }: { label: string, subLabel: string, active: boolean, color: string }) => (
        <div className="flex flex-col gap-1 w-full max-w-xs transition-all duration-300">
            <div className="flex justify-between items-end">
                <div className="flex flex-col">
                    <span className={`text-[10px] font-bold tracking-[0.2em] ${active ? "text-white" : "text-zinc-500"}`}>{label}</span>
                    <span className="text-[9px] text-zinc-600 font-medium tracking-wide">{subLabel}</span>
                </div>
                <span className={`text-[9px] font-bold tracking-widest ${active ? "text-green-400" : "opacity-0"}`}>DETECTED</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden mt-1">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: active ? "100%" : "0%" }}
                    className={`h-full ${color} shadow-[0_0_10px_currentColor]`}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                />
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 flex flex-col items-center justify-between text-white bg-black select-none font-sans">

            {/* 1. Header Area with Alpha Tag */}
            <div className="w-full pt-8 px-6 flex justify-between items-center z-10 opacity-50">
                <h1 className="text-sm font-bold tracking-widest uppercase text-zinc-600">Mind Meld // Alpha</h1>
                <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-zinc-800'}`} />
            </div>

            {/* 2. Main Content Stream */}
            <div className="flex-1 w-full px-6 flex flex-col justify-center items-center z-10 pb-20">
                {taskId ? (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-green-500/10 border border-green-500/20 p-6 rounded-2xl flex flex-col items-center text-center gap-2 backdrop-blur-md"
                    >
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-black mb-2 shadow-[0_0_20px_rgba(74,222,128,0.4)]">
                            <Check size={24} strokeWidth={3} />
                        </div>
                        <h2 className="text-xl font-light text-green-400">Task Logged</h2>
                        <p className="text-sm text-zinc-400 font-mono mb-4">{taskId}</p>

                        <div className="flex gap-3 w-full">
                            <button
                                onClick={resetForNextTask}
                                className="flex-1 bg-white text-black text-xs font-bold py-3 rounded-xl hover:bg-zinc-200 transition-colors"
                            >
                                NEXT TASK
                            </button>
                            <button
                                className="flex-1 bg-zinc-800 text-zinc-400 text-xs font-bold py-3 rounded-xl border border-zinc-700 hover:bg-zinc-700 transition-colors"
                            >
                                FINISH AUDIT
                            </button>
                        </div>
                    </motion.div>
                ) : processing ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center gap-4"
                    >
                        <div className="w-12 h-12 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
                        <p className="text-zinc-500 text-xs tracking-[0.2em] animate-pulse">ANALYZING INTENT...</p>
                    </motion.div>
                ) : transcript ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-left w-full max-w-md"
                    >
                        <p className="text-3xl font-light leading-snug tracking-wide text-zinc-100">
                            {transcript}
                            <span className="inline-block w-2 H-6 bg-green-500 ml-1 animate-pulse" />
                        </p>
                    </motion.div>
                ) : (
                    <div className="text-center w-full opacity-30">
                        <p className="text-4xl font-thin tracking-tighter text-zinc-700">Ready</p>
                    </div>
                )}
            </div>

            {/* 3. Interaction Zone */}
            <div className="w-full bg-zinc-900/40 backdrop-blur-xl border-t border-white/5 rounded-t-[3rem] p-8 pb-12 flex flex-col items-center gap-8 shadow-2xl z-20">

                {/* Progress Bars with Descriptions */}
                <div className="w-full flex flex-col gap-5 mb-2">
                    <ProgressBar label="TOPIC" subLabel="What needs to be done?" active={tide.T} color="bg-blue-400" />
                    <ProgressBar label="IMPACT" subLabel="Why is it critical?" active={tide.I} color="bg-purple-400" />
                    <ProgressBar label="EFFORT" subLabel="Time estimate?" active={tide.E} color="bg-orange-400" />
                    <ProgressBar label="DEADLINE" subLabel="When is it due?" active={tide.D} color="bg-green-400" />
                </div>

                {/* Mic Button & Prompt */}
                <div className="flex flex-col items-center gap-4">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${isRecording
                            ? "bg-red-500 text-white shadow-[0_0_40px_rgba(239,68,68,0.4)]"
                            : "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                            }`}
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        onTouchStart={startRecording}
                        onTouchEnd={stopRecording}
                        disabled={processing}
                    >
                        <Mic size={32} strokeWidth={2} />
                    </motion.button>
                    <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">Hold to Capture</p>
                </div>
            </div>
        </div>
    );
}
