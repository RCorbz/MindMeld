"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import { createClient, LiveClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import { VOICE_CONFIG } from "@/lib/voice.config";

type CaptureStep = "topic" | "impact" | "effort" | "deadline" | "review";

interface VoiceContextType {
    isRecording: boolean;
    processing: boolean;
    transcript: string;
    currentStep: CaptureStep;
    accumulatedData: any;
    tide: { T: boolean; I: boolean; D: boolean; E: boolean };
    error: string | null;
    taskId: string | null;
    isReviewing: boolean;
    parsedData: any;
    startRecording: () => Promise<void>;
    stopRecording: () => Promise<void>;
    confirmTask: () => Promise<void>;
    resetForNextTask: () => void;
    setParsedData: (data: any) => void;
    setError: (error: string | null) => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export function VoiceProvider({ children }: { children: React.ReactNode }) {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [connection, setConnection] = useState<LiveClient | null>(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [taskId, setTaskId] = useState<string | null>(null);

    const [currentStep, setCurrentStep] = useState<CaptureStep>("topic");
    const [accumulatedData, setAccumulatedData] = useState<any>({
        title: "",
        impact_score: 5,
        financial_value: 0,
        effort_hours: 1,
        deadline: null,
        urgency: 5
    });

    const [tide, setTide] = useState({
        T: false,
        I: false,
        D: false,
        E: false,
    });

    const [isReviewing, setIsReviewing] = useState(false);
    const [parsedData, setParsedData] = useState<any>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const transcriptRef = useRef("");

    const startRecording = async () => {
        setIsRecording(true);
        setTranscript("");
        transcriptRef.current = "";
        setIsReviewing(false);
        setTaskId(null);
        setError(null);

        try {
            const response = await fetch("/api/transcribe");
            const data = await response.json();
            if (!data.key) throw new Error("No key returned");

            // Note: In a real app, cross-browser deepgram usage might need careful handling here
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
        } catch (err: any) {
            console.error("Recording Start Error:", err);
            setIsRecording(false);
            setError("Could not start recording.");
        }
    };

    const stopRecording = async () => {
        setIsRecording(false);
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            mediaRecorderRef.current.stop();
        }
        if (connection) connection.requestClose();

        const latestTranscript = transcriptRef.current;

        if (latestTranscript.length > 2) {
            setProcessing(true);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000);

            try {
                const response = await fetch("/api/tasks/parse-step", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        transcript: latestTranscript,
                        step: currentStep
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                const data = await response.json();

                if (response.ok && data.result !== undefined) {
                    setTranscript("");
                    transcriptRef.current = "";

                    const newData = { ...accumulatedData };
                    if (currentStep === "topic") {
                        newData.title = data.result;
                        setTide(prev => ({ ...prev, T: true }));
                        setCurrentStep("impact");
                    } else if (currentStep === "impact") {
                        newData.impact_score = data.result.impact_score;
                        newData.financial_value = data.result.financial_value;
                        setTide(prev => ({ ...prev, I: true }));
                        setCurrentStep("effort");
                    } else if (currentStep === "effort") {
                        newData.effort_hours = data.result.effort_hours;
                        setTide(prev => ({ ...prev, E: true }));
                        setCurrentStep("deadline");
                    } else if (currentStep === "deadline") {
                        newData.deadline = data.result;
                        setTide(prev => ({ ...prev, D: true }));

                        setParsedData(newData);
                        setIsReviewing(true);
                        setCurrentStep("review");
                    }
                    setAccumulatedData(newData);
                } else {
                    throw new Error(data.details || data.error || "Step parsing failed");
                }
            } catch (err: any) {
                console.error("Step Parse Error:", err);
                setError(err.message || `AI couldn't process the ${currentStep}.`);
                setTranscript("");
                transcriptRef.current = "";
            } finally {
                setProcessing(false);
            }
        }
    };

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
        } catch (err: any) {
            console.error("Confirm Error:", err);
            setError(err.message || "Failed to save task.");
        } finally {
            setProcessing(false);
        }
    };

    const resetForNextTask = () => {
        setTaskId(null);
        setTranscript("");
        setError(null);
        setIsReviewing(false);
        setParsedData(null);
        setCurrentStep("topic");
        setAccumulatedData({
            title: "",
            impact_score: 5,
            financial_value: 0,
            effort_hours: 1,
            deadline: null,
            urgency: 5
        });
        setTide({ T: false, I: false, D: false, E: false });
    };

    return (
        <VoiceContext.Provider value={{
            isRecording, processing, transcript, currentStep, accumulatedData, tide, error, taskId, isReviewing, parsedData,
            startRecording, stopRecording, confirmTask, resetForNextTask, setParsedData, setError
        }}>
            {children}
        </VoiceContext.Provider>
    );
}

export function useVoice() {
    const context = useContext(VoiceContext);
    if (context === undefined) {
        throw new Error("useVoice must be used within a VoiceProvider");
    }
    return context;
}
