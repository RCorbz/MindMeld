"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, Check, LayoutGrid } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
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

    // Review state
    const [isReviewing, setIsReviewing] = useState(false);
    const [parsedData, setParsedData] = useState<any>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    // 1. T.I.D.E. Regex Logic
    useEffect(() => {
        if (!transcript) return;

        const lower = transcript.toLowerCase();

        setTide({
            // Topic: Detected if > 5 words
            T: lower.split(/\s+/).filter(w => w.length > 0).length > 5,
            // Impact: Monies (plural), importance
            I: /\b(\$|dollars?|revenue|critical|important|high stakes|priority|urgent)\b/.test(lower),
            // Deadline: Timeframes
            D: /\b(today|tomorrow|friday|monday|tuesday|wednesday|thursday|january|february|soon|deadline|next week)\b/.test(lower),
            // Effort: Duration (plural, and additional common terms like 'hrs')
            E: /\b(hours?|minutes?|days?|weeks?|months?|mins?|secs?|hrs?|time)\b/.test(lower),
        });
    }, [transcript]);

    const transcriptRef = useRef("");

    // 2. Start Recording (same as before)
    const startRecording = async () => {
        setIsRecording(true);
        setTranscript("");
        transcriptRef.current = "";
        setIsReviewing(false); // Reset review
        setTaskId(null); // Reset task id

        try {
            const response = await fetch("/api/transcribe");
            const data = await response.json();
            if (!data.key) throw new Error("No key returned");
            const deepgram = createClient(data.key);
            const conn = deepgram.listen.live(VOICE_CONFIG);

            conn.on(LiveTranscriptionEvents.Open, () => {
                navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
                    const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
                    mediaRecorderRef.current = mediaRecorder;
                    mediaRecorder.addEventListener("dataavailable", (event) => {
                        if (event.data.size > 0 && conn.getReadyState() === 1) conn.send(event.data);
                    });
                    mediaRecorder.start(250);
                });
            });

            conn.on(LiveTranscriptionEvents.Transcript, (data) => {
                const sentence = data.channel.alternatives[0]?.transcript;
                if (sentence) {
                    const newTranscript = transcriptRef.current + " " + sentence;
                    transcriptRef.current = newTranscript;
                    setTranscript(newTranscript);
                }
            });

            setConnection(conn);
        } catch (error) {
            setIsRecording(false);
        }
    };

    // 3. Stop Recording -> Review
    const stopRecording = async () => {
        setIsRecording(false);
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            mediaRecorderRef.current.stop();
        }
        if (connection) connection.requestClose();

        const finalTranscript = transcriptRef.current;

        if (finalTranscript.length > 5) {
            setProcessing(true);
            try {
                const response = await fetch("/api/parse", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ transcript: finalTranscript }),
                });

                const data = await response.json();
                if (response.ok && data.parsed) {
                    setParsedData(data.parsed);
                    setIsReviewing(true); // Switch to review mode
                }
            } catch (err) {
                console.error("Parse Error:", err);
            } finally {
                setProcessing(false);
            }
        }
    };

    // 4. Confirm & Save
    const confirmTask = async () => {
        if (!parsedData) return;
        setProcessing(true);
        try {
            const response = await fetch("/api/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(parsedData),
            });
            const data = await response.json();
            if (response.ok && data.id) {
                setTaskId(data.id.substring(0, 8).toUpperCase());
                setIsReviewing(false);
            }
        } catch (err) {
            console.error("Confirm Error:", err);
        } finally {
            setProcessing(false);
        }
    };

    const resetForNextTask = () => {
        setTaskId(null);
        setTranscript("");
        setIsReviewing(false);
        setParsedData(null);
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

            <div className="w-full pt-8 px-6 flex justify-between items-center z-10 opacity-50 text-zinc-600">
                <div className="flex items-center gap-2">
                    <img src="/icon.svg" alt="Mind Meld" className="h-4 w-4" />
                    <h1 className="text-sm font-bold tracking-widest uppercase">Mind Meld // Alpha</h1>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/audit" className="hover:text-white transition-colors">
                        <LayoutGrid size={18} />
                    </Link>
                    <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-zinc-800'}`} />
                </div>
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
                            <Link
                                href="/audit"
                                className="flex-1 bg-zinc-800 text-zinc-400 text-xs font-bold py-3 rounded-xl border border-zinc-700 hover:bg-zinc-700 transition-colors flex items-center justify-center"
                            >
                                FINISH AUDIT
                            </Link>
                        </div>
                    </motion.div>
                ) : isReviewing && parsedData ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md bg-zinc-900/80 border border-white/10 rounded-3xl p-6 backdrop-blur-2xl shadow-2xl flex flex-col gap-6"
                    >
                        <div className="flex flex-col gap-1">
                            <h2 className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">Confirm Task Intent</h2>
                            <input
                                className="bg-transparent text-2xl font-light text-white outline-none border-b border-white/5 focus:border-blue-400 transition-colors w-full pb-2"
                                value={parsedData.title}
                                onChange={(e) => setParsedData({ ...parsedData, title: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-bold text-zinc-600 tracking-widest uppercase">Impact (1-10)</span>
                                <input
                                    type="number"
                                    className="bg-zinc-800/50 p-3 rounded-xl text-lg font-mono text-purple-400 outline-none border border-white/5 focus:border-purple-400"
                                    value={parsedData.impact_score}
                                    onChange={(e) => setParsedData({ ...parsedData, impact_score: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-bold text-zinc-600 tracking-widest uppercase">Effort (Hrs)</span>
                                <input
                                    type="number"
                                    className="bg-zinc-800/50 p-3 rounded-xl text-lg font-mono text-orange-400 outline-none border border-white/5 focus:border-orange-400"
                                    value={parsedData.effort_hours}
                                    onChange={(e) => setParsedData({ ...parsedData, effort_hours: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-bold text-zinc-600 tracking-widest uppercase">Financial Value ($)</span>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                                <input
                                    type="number"
                                    className="w-full bg-zinc-800/50 p-3 pl-7 rounded-xl text-lg font-mono text-zinc-300 outline-none border border-white/5 focus:border-zinc-400"
                                    value={parsedData.financial_value}
                                    onChange={(e) => setParsedData({ ...parsedData, financial_value: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-bold text-zinc-600 tracking-widest uppercase">Deadline</span>
                            <input
                                type="date"
                                className="bg-zinc-800/50 p-3 rounded-xl text-sm font-mono text-green-400 outline-none border border-white/5 focus:border-green-400"
                                value={parsedData.deadline || ""}
                                onChange={(e) => setParsedData({ ...parsedData, deadline: e.target.value })}
                            />
                        </div>

                        <button
                            onClick={confirmTask}
                            disabled={processing}
                            className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-4 rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {processing ? "SAVING..." : "CONFIRM & LOG TASK"}
                        </button>
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
                            <span className="inline-block w-2 h-6 bg-green-500 ml-1 animate-pulse" />
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
