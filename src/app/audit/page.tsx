"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Clock,
    Zap,
    Trash2,
    ChevronRight,
    BrainCircuit,
} from "lucide-react";
import StrategyCard from "@/components/StrategyCard";
import { PERSONAS, DEFAULT_PERSONA_IDS } from "@/lib/personas.config";
import * as Icons from "lucide-react";

interface Task {
    // ... existing interface
    id: string;
    title: string;
    impact_score: number;
    effort_hours: number;
    financial_value: number;
    roi_score: number;
    deadline: string | null;
}

interface Proposal {
    focus_tasks: string[];
    prune_tasks: string[];
    outcome_prediction: string;
    rational: string;
}

export default function AuditPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes session
    const [isConsiglieriLoading, setIsConsiglieriLoading] = useState(false);
    const [proposal, setProposal] = useState<Proposal | null>(null);
    const [selectedPersonaIds, setSelectedPersonaIds] = useState<string[]>(DEFAULT_PERSONA_IDS);
    const router = useRouter();

    const confirmPath = async () => {
        if (!proposal) return;

        try {
            await fetch("/api/tasks/focus", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    focus_ids: proposal.focus_tasks,
                    prune_ids: proposal.prune_tasks
                }),
            });
            setProposal(null);
            router.push("/");
        } catch (err) {
            console.error("Confirm Path Error:", err);
        }
    };

    // 1. Fetch Tasks
    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch("/api/tasks");
                const data = await res.json();
                if (data.tasks) {
                    setTasks(data.tasks);
                }
            } catch (err) {
                console.error("Fetch Error:", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // 2. Timer Logic
    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    // 3. Negotiate with AI
    const getAdvice = async () => {
        setIsConsiglieriLoading(true);
        try {
            const res = await fetch("/api/tasks/negotiate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    tasks,
                    personaIds: selectedPersonaIds
                }),
            });
            const data = await res.json();
            if (data.proposal) {
                setProposal(data.proposal);
            }
        } catch (err) {
            console.error("Negotiation Error:", err);
        } finally {
            setIsConsiglieriLoading(false);
        }
    };

    const meldTask = async (task: Task) => {
        setLoading(true);
        try {
            const res = await fetch("/api/tasks/meld", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ task }),
            });
            if (res.ok) {
                const data = await res.json();
                setTasks(prev => [
                    ...prev.filter(t => t.id !== task.id),
                    ...data.newTasks
                ].sort((a, b) => b.roi_score - a.roi_score));
            }
        } catch (err) {
            console.error("Meld Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const deleteTask = async (id: string) => {
        try {
            const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
            if (res.ok) {
                setTasks(prev => prev.filter(t => t.id !== id));
            }
        } catch (err) {
            console.error("Delete Error:", err);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 100) return "text-green-400 border-green-500/30 bg-green-500/5";
        if (score >= 50) return "text-yellow-400 border-yellow-500/30 bg-yellow-500/5";
        return "text-red-400 border-red-500/30 bg-red-500/5";
    };

    return (
        <div className="min-h-screen bg-black text-zinc-100 font-sans p-6 pb-32 selection:bg-blue-500/30">

            {/* 1. Sticky Blitz Header */}
            <div className="sticky top-0 z-40 flex items-center justify-between pb-6 pt-2 bg-black/80 backdrop-blur-md">
                <div className="w-10 h-10" /> {/* Spacer instead of back arrow */}

                <div className="flex flex-col items-center gap-1">
                    <span className="text-[9px] font-bold tracking-[0.3em] text-zinc-600 uppercase">Daily Blitz Timer</span>
                    <div className={`flex items-center gap-2 px-6 py-2 rounded-full border border-white/5 ${timeLeft < 60 ? "bg-red-500/10 text-red-500 animate-pulse" : "bg-zinc-900 text-white"}`}>
                        <Clock size={14} />
                        <span className="text-lg font-mono font-bold tracking-tighter">{formatTime(timeLeft)}</span>
                    </div>
                </div>

                <div className="w-10 h-10" /> {/* Spacer */}
            </div>

            <div className="max-w-3xl mx-auto mt-4">

                {/* 2. Main Feed */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-end justify-between px-2">
                        <div>
                            <h2 className="text-2xl font-light tracking-tight">The Audit</h2>
                            <p className="text-[10px] font-bold tracking-[0.2em] text-zinc-600 uppercase mt-1">ROI GRAVITY FEED</p>
                        </div>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Backlog: {tasks.length}</span>
                    </div>

                    {loading ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-4 text-zinc-600">
                            <div className="w-8 h-8 border-2 border-zinc-800 border-t-zinc-400 rounded-full animate-spin" />
                            <p className="text-[9px] font-bold tracking-widest uppercase tracking-[0.2em]">Calculating Weights...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3 pb-32">
                            <AnimatePresence mode="popLayout">
                                {tasks.map((task) => {
                                    const isFocus = proposal?.focus_tasks.includes(task.id);
                                    const isPrune = proposal?.prune_tasks.includes(task.id);

                                    return (
                                        <motion.div
                                            key={task.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{
                                                opacity: isPrune ? 0.3 : 1,
                                                scale: 1,
                                                borderColor: isFocus ? "rgba(59, 130, 246, 0.4)" : "rgba(255, 255, 255, 0.05)"
                                            }}
                                            exit={{ opacity: 0, scale: 0.9, x: 20 }}
                                            className={`group relative bg-zinc-900/40 border p-5 rounded-3xl hover:bg-zinc-900/60 transition-all flex items-center justify-between ${isFocus ? "ring-1 ring-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]" : ""}`}
                                        >
                                            <div className="flex flex-col gap-1.5 flex-1">
                                                <div className="flex items-center gap-2">
                                                    {isFocus && <BrainCircuit size={12} className="text-blue-400" />}
                                                    <h3 className="text-md font-medium text-zinc-200 group-hover:text-white">{task.title}</h3>
                                                </div>
                                                <div className="flex items-center gap-4 text-[10px] font-mono">
                                                    <span className="flex items-center gap-1 text-purple-400/80">
                                                        <Zap size={10} /> {task.impact_score}i
                                                    </span>
                                                    <span className="flex items-center gap-1 text-orange-400/80">
                                                        <Clock size={10} /> {task.effort_hours}h
                                                    </span>
                                                    {task.financial_value > 0 && <span className="text-zinc-500">${task.financial_value.toLocaleString()}</span>}
                                                </div>
                                            </div>

                                            <div className={`flex flex-col items-end gap-1 px-4 py-2 border rounded-2xl ${getScoreColor(task.roi_score)}`}>
                                                <span className="text-[8px] font-bold tracking-widest leading-none">ROI</span>
                                                <span className="text-xl font-mono font-bold tracking-tighter leading-none">{Math.round(task.roi_score)}</span>
                                            </div>

                                            <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => deleteTask(task.id)} className="bg-red-500/10 text-red-400 p-3 rounded-full border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-xl">
                                                    <Trash2 size={14} />
                                                </button>
                                                <button onClick={() => meldTask(task)} className="bg-blue-500/10 text-blue-400 p-3 rounded-full border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all shadow-xl">
                                                    <ChevronRight size={14} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Mobile Bottom Action */}
            <div className="fixed bottom-28 left-0 right-0 p-6 z-40 pointer-events-none">
                <div className="max-w-md mx-auto flex flex-col gap-4 pointer-events-auto">

                    {/* Persona Selector */}
                    <div className="flex justify-center gap-2 p-2 bg-zinc-900/60 backdrop-blur-xl border border-white/5 rounded-3xl">
                        {PERSONAS.map((p) => {
                            const isSelected = selectedPersonaIds.includes(p.id);
                            // @ts-expect-error - dynamic icon lookup
                            const Icon = Icons[p.avatar] || Icons.HelpCircle;

                            return (
                                <button
                                    key={p.id}
                                    onClick={() => {
                                        setSelectedPersonaIds(prev =>
                                            isSelected
                                                ? prev.filter(id => id !== p.id)
                                                : [...prev, p.id]
                                        );
                                    }}
                                    className={`relative flex items-center justify-center w-12 h-12 rounded-2xl border transition-all ${isSelected
                                        ? "bg-blue-500/10 border-blue-500/40 text-blue-400"
                                        : "bg-zinc-800/50 border-white/5 text-zinc-500"
                                        }`}
                                >
                                    <Icon size={20} />
                                    {isSelected && (
                                        <motion.div
                                            layoutId="persona-corner"
                                            className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-zinc-900"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={getAdvice}
                        disabled={isConsiglieriLoading || tasks.length === 0 || selectedPersonaIds.length === 0}
                        className="w-full bg-zinc-900/80 backdrop-blur-xl border border-white/10 hover:border-blue-500/50 text-white font-bold py-5 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                    >
                        {isConsiglieriLoading ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <div className="bg-blue-500 p-2 rounded-xl text-black shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                                    <Icons.Users size={20} />
                                </div>
                                <span className="text-sm tracking-[0.1em] uppercase py-1">Call a Board Meeting</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* 4. Strategic Proposal Overlay */}
            {proposal && (
                <StrategyCard
                    proposal={proposal}
                    personaIds={selectedPersonaIds}
                    onClose={() => setProposal(null)}
                    onConfirm={confirmPath}
                    onReAudit={() => setProposal(null)}
                />
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #27272a;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #3f3f46;
                }
            `}</style>
        </div>
    );
}
