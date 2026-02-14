"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useVoice } from "@/context/VoiceContext";
import { Check } from "lucide-react"; // Keep Check for the Task Logged UI

export default function VoiceHUD() {
    const {
        isRecording,
        processing,
        transcript,
        currentStep,
        accumulatedData,
        tide,
        error,
        taskId,
        isReviewing,
        parsedData,
        confirmTask,
        resetForNextTask,
        setParsedData,
        setError,
        startRecording, // Added from context
        stopRecording   // Added from context
    } = useVoice();

    // 1. Step Prompts & Instructions
    const STEP_INFO: Record<string, { title: string, sub: string }> = {
        topic: { title: "Describe the Task", sub: "What needs to be done?" },
        impact: { title: "Define the Impact", sub: "Why is this a priority?" },
        effort: { title: "Estimate Effort", sub: "How many hours to execute?" },
        deadline: { title: "Timeline", sub: "When is the hard deadline?" },
        review: { title: "Final Review", sub: "Confirm task details" }
    };

    return (
        <div className="fixed inset-0 flex flex-col items-center justify-between text-white bg-black select-none font-sans">

            <div className="w-full pt-8 px-6 flex justify-between items-center z-10 opacity-50 text-zinc-600">
                <div className="flex items-center gap-2">
                    <img src="/icon.svg" alt="Mind Meld" className="h-4 w-4" />
                    <h1 className="text-sm font-bold tracking-widest uppercase">Mind Meld // Alpha</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-zinc-800'}`} />
                </div>
            </div>

            {/* 2. Main Content Stream */}
            <div className="flex-1 w-full px-6 flex flex-col justify-center items-center z-10 pb-32">
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

                        {error && (
                            <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest text-center mt-2">{error}</p>
                        )}

                        <button
                            onClick={confirmTask}
                            disabled={processing}
                            className={`w-full font-bold py-4 rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all active:scale-[0.98] disabled:opacity-50 ${error ? "bg-zinc-800 text-zinc-500" : "bg-blue-500 hover:bg-blue-400 text-white"
                                }`}
                        >
                            {processing ? "SAVING..." : error ? "TRY AGAIN" : "CONFIRM & LOG TASK"}
                        </button>
                    </motion.div>
                ) : processing ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center gap-4 py-12"
                    >
                        <div className="w-12 h-12 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
                        <p className="text-zinc-500 text-xs tracking-[0.2em] animate-pulse uppercase">Syncing {currentStep}...</p>
                    </motion.div>
                ) : error ? (
                    <div className="text-center w-full px-12">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col gap-4"
                        >
                            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-500 mx-auto">
                                {/* Mic icon removed as per instruction */}
                            </div>
                            <div className="flex flex-col gap-1">
                                <h2 className="text-2xl font-light tracking-tight text-red-400">
                                    Processing Error
                                </h2>
                                <p className="text-[10px] font-bold tracking-[0.2em] text-red-500/50 uppercase max-w-xs mx-auto leading-relaxed">
                                    {error}
                                </p>
                            </div>
                            <p className="text-[10px] font-medium text-zinc-600 italic">
                                Try speaking clearly and clicking the button to retry...
                            </p>
                        </motion.div>
                    </div>
                ) : transcript ? (
                    <div className="w-full max-w-md h-[50vh] flex flex-col justify-center">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-zinc-900/20 backdrop-blur-sm rounded-3xl p-6 border border-white/5 overflow-y-auto custom-scrollbar"
                        >
                            <p className="text-2xl font-light leading-snug tracking-wide text-zinc-100 italic">
                                "{transcript}"
                                <span className="inline-block w-1.5 h-6 bg-green-500 ml-2 animate-pulse align-middle" />
                            </p>
                        </motion.div>
                    </div>
                ) : (
                    <div className="text-center w-full px-12">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col gap-3"
                        >
                            <h2 className="text-4xl font-thin tracking-tighter text-white/90">
                                {STEP_INFO[currentStep].title}
                            </h2>
                            <p className="text-[10px] font-bold tracking-[0.4em] text-zinc-500 uppercase ml-1">
                                {STEP_INFO[currentStep].sub}
                            </p>
                        </motion.div>
                    </div>
                )}
            </div>

            {/* 3. Interaction Zone: Live Card Builder */}
            <div className="w-full bg-zinc-950/80 backdrop-blur-3xl border-t border-white/5 rounded-t-[3rem] p-8 pb-32 flex flex-col items-center gap-10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] z-20">

                {/* Live Card Preview */}
                {!taskId && !isReviewing && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-sm bg-zinc-900/40 border border-white/5 rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden"
                    >
                        {/* Shimmer effect if not detected yet */}
                        <div className="flex flex-col gap-2">
                            {tide.T ? (
                                <motion.h3 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-medium text-white truncate pr-16">{accumulatedData.title}</motion.h3>
                            ) : (
                                <div className="h-4 w-3/4 bg-zinc-800/50 rounded animate-pulse" />
                            )}
                            <div className="flex items-center gap-3">
                                {tide.I ? (
                                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] font-bold text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded border border-purple-400/20">IMPACT {accumulatedData.impact_score}</motion.span>
                                ) : (
                                    <div className="h-3 w-16 bg-zinc-800/30 rounded" />
                                )}
                                {tide.E ? (
                                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] font-bold text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded border border-orange-400/20">{accumulatedData.effort_hours} HRS</motion.span>
                                ) : (
                                    <div className="h-3 w-12 bg-zinc-800/30 rounded" />
                                )}
                                {tide.D ? (
                                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded border border-green-400/20">{accumulatedData.deadline}</motion.span>
                                ) : (
                                    <div className="h-3 w-20 bg-zinc-800/30 rounded" />
                                )}
                            </div>
                        </div>

                        {/* Step indicator dot */}
                        <div className="absolute top-5 right-5 flex gap-1">
                            {["topic", "impact", "effort", "deadline"].map((s, idx) => (
                                <div
                                    key={s}
                                    className={`w-1 h-1 rounded-full transition-all duration-500 ${currentStep === s ? "w-3 bg-blue-500" : tide[Object.keys(tide)[idx] as keyof typeof tide] ? "bg-zinc-400" : "bg-zinc-800"
                                        }`}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Mic Button & Prompt */}
                {/* This section is removed as per the instruction */}
            </div>
        </div>
    );
}
