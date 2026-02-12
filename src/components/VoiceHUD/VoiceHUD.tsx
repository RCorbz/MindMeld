"use client";

import { useState, useEffect, useRef } from "react";
import { Mic } from "lucide-react";
import RingSegment from "./RingSegment";
import { motion } from "framer-motion";
import { createClient, LiveClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import { VOICE_CONFIG } from "@/lib/voice.config";

export default function VoiceHUD() {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [connection, setConnection] = useState<LiveClient | null>(null);

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
            T: lower.split(" ").length > 3, // Task: > 3 words
            I: /(\$|dollar|revenue|critical|important|high stakes)/.test(lower),
            D: /(today|tomorrow|friday|monday|january|february|soon|deadline)/.test(lower),
            E: /(hour|minute|day|week|month|mins)/.test(lower),
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
                console.log("Deepgram Connected");

                // Start Microphone
                navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
                    const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
                    mediaRecorderRef.current = mediaRecorder;

                    mediaRecorder.addEventListener("dataavailable", (event) => {
                        if (event.data.size > 0 && conn.getReadyState() === 1) {
                            conn.send(event.data);
                        }
                    });

                    mediaRecorder.start(250); // Send chunks every 250ms
                });
            });

            conn.on(LiveTranscriptionEvents.Transcript, (data) => {
                const sentence = data.channel.alternatives[0].transcript;
                if (sentence) {
                    setTranscript((prev) => prev + " " + sentence);
                }
            });

            setConnection(conn);

        } catch (error) {
            console.error("Recording Error:", error);
            setIsRecording(false);
        }
    };

    // 3. Stop Recording
    const stopRecording = () => {
        setIsRecording(false);

        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current = null;
        }

        if (connection) {
            connection.requestClose();
            setConnection(null);
        }

        // Play "Lock-In" sound if all 4 green? (Can implement later)
        console.log("Final Transcript:", transcript);
    };

    return (
        <div className="fixed bottom-10 left-0 right-0 flex justify-center items-center z-50">
            <div className="relative w-64 h-64 flex justify-center items-center">
                {/* SVG Ring Container */}
                <svg className="absolute w-full h-full transform rotate-0" viewBox="0 0 200 200">
                    {/* T - Top Left */}
                    <RingSegment startAngle={275} endAngle={355} isActive={tide.T} label="T" />
                    {/* I - Top Right */}
                    <RingSegment startAngle={5} endAngle={85} isActive={tide.I} label="I" />
                    {/* D - Bottom Right */}
                    <RingSegment startAngle={95} endAngle={175} isActive={tide.D} label="D" />
                    {/* E - Bottom Left */}
                    <RingSegment startAngle={185} endAngle={265} isActive={tide.E} label="E" />
                </svg>

                {/* Central FAB */}
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    className={`w-36 h-36 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${isRecording
                            ? "bg-red-600 shadow-[0_0_30px_rgba(220,38,38,0.6)]"
                            : "bg-white shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                        }`}
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onTouchStart={startRecording} // Mobile support
                    onTouchEnd={stopRecording}
                >
                    <Mic size={48} className={isRecording ? "text-white" : "text-black"} />
                </motion.button>
            </div>

            {/* Live Transcript Preview (Optional) */}
            {transcript && (
                <div className="absolute -top-20 w-64 text-center text-xs text-zinc-400 truncate px-2">
                    {transcript}
                </div>
            )}

            {/* Debug/Labels (Optional) */}
            <div className="absolute top-0 w-full flex justify-between px-4 text-xs font-mono text-zinc-500 pointer-events-none opacity-50">
                <span>T</span>
                <span>I</span>
            </div>
            <div className="absolute bottom-0 w-full flex justify-between px-4 text-xs font-mono text-zinc-500 pointer-events-none opacity-50">
                <span>E</span>
                <span>D</span>
            </div>
        </div>
    );
}
