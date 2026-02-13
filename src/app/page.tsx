"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Zap,
    TrendingUp,
    DollarSign,
    Target,
    Mic,
    Plus,
    LayoutGrid,
    CheckCircle2,
    Clock,
    Flame
} from "lucide-react";
import Link from "next/link";

interface Task {
    id: string;
    title: string;
    impact_score: number;
    effort_hours: number;
    financial_value: number;
    roi_score: number;
    is_focus: boolean;
    completed_at: string | null;
}

export default function MissionControl() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

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

    const focusTasks = tasks.filter(t => t.is_focus && !t.completed_at);
    const completedFocusTasks = tasks.filter(t => t.is_focus && t.completed_at);

    const totalRevenue = tasks.reduce((acc, t) => acc + (t.completed_at ? t.financial_value : 0), 0);
    const potentialRevenue = focusTasks.reduce((acc, t) => acc + t.financial_value, 0);

    const momentum = completedFocusTasks.length > 0
        ? Math.round((completedFocusTasks.length / (focusTasks.length + completedFocusTasks.length)) * 100)
        : 0;

    const completeTask = async (task: Task) => {
        try {
            const res = await fetch(`/api/tasks/${task.id}/complete`, {
                method: "POST"
            });
            if (res.ok) {
                // Instantly update UI for snappy feel
                setTasks(prev => prev.map(t =>
                    t.id === task.id ? { ...t, completed_at: new Date().toISOString() } : t
                ));
            }
        } catch (err) {
            console.error("Completion Error:", err);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 font-sans p-6 pb-32">
            {/* ... header and cards ... */}
            <AnimatePresence>
                {momentum === 100 && focusTasks.length === 0 && completedFocusTasks.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center"
                    >
                        <div className="bg-blue-500/20 backdrop-blur-3xl p-20 rounded-full animate-pulse border border-blue-500/30">
                            <Flame size={120} className="text-blue-400" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header / Global Stats */}
            <div className="max-w-4xl mx-auto pt-8 pb-12 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-light tracking-tighter">Mission Control</h1>
                    <p className="text-[10px] font-bold tracking-[0.3em] text-zinc-600 uppercase mt-1">Operational Status: Optimal</p>
                </div>
                <div className="flex gap-4">
                    {/* Navigation moved to BottomNav */}
                </div>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
                {/* HUD Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Revenue Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-zinc-900/50 border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group"
                    >
                        <div className="absolute top-[-20px] right-[-20px] text-green-500/5 rotate-12 group-hover:scale-110 transition-transform">
                            <DollarSign size={140} />
                        </div>
                        <div className="flex flex-col gap-1 relative z-10">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Revenue Captured</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-light tracking-tighter text-green-400">${totalRevenue.toLocaleString()}</span>
                                {potentialRevenue > 0 && (
                                    <span className="text-zinc-500 text-sm font-mono tracking-tighter">/ ${(totalRevenue + potentialRevenue).toLocaleString()}</span>
                                )}
                            </div>
                        </div>
                        <div className="mt-6 flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                            <Target size={12} className="text-green-500/50" />
                            <span>DAILY ROI TARGET: $10,000</span>
                        </div>
                    </motion.div>

                    {/* Momentum Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-zinc-900/50 border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group"
                    >
                        <div className="absolute top-[-20px] right-[-20px] text-blue-500/5 -rotate-12 group-hover:scale-110 transition-transform">
                            <Flame size={140} />
                        </div>
                        <div className="flex flex-col gap-1 relative z-10">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Daily Momentum</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-light tracking-tighter text-blue-400">{momentum}%</span>
                            </div>
                        </div>
                        <div className="mt-6 w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${momentum}%` }}
                                className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                            />
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                            <TrendingUp size={12} className="text-blue-500/50" />
                            <span>VELOCITY: {completedFocusTasks.length} TASKS SECURED</span>
                        </div>
                    </motion.div>
                </div>

                {/* Focus List */}
                <div className="mt-12 space-y-6">
                    <div className="flex items-end justify-between px-2">
                        <div>
                            <h2 className="text-xl font-light tracking-tight">Focus Path</h2>
                            <p className="text-[9px] font-bold tracking-[0.2em] text-zinc-600 uppercase mt-1">Strategic Selection</p>
                        </div>
                        <div className="h-[1px] flex-1 bg-white/5 mx-6 mb-2"></div>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{focusTasks.length} Active</span>
                    </div>

                    {loading ? (
                        <div className="h-32 flex items-center justify-center text-zinc-800 font-mono text-[9px] uppercase tracking-widest">
                            Syncing Data...
                        </div>
                    ) : focusTasks.length > 0 ? (
                        <div className="flex flex-col gap-3">
                            <AnimatePresence mode="popLayout">
                                {focusTasks.map((task) => (
                                    <motion.div
                                        key={task.id}
                                        layout
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.8, x: 20 }}
                                        className="group bg-zinc-900/30 border border-white/5 p-6 rounded-3xl flex items-center justify-between hover:bg-zinc-900/60 transition-all"
                                    >
                                        <div className="flex flex-col gap-1.5">
                                            <h3 className="text-lg font-medium text-zinc-200 group-hover:text-white text-left">{task.title}</h3>
                                            <div className="flex items-center gap-4 text-[10px] font-mono">
                                                <span className="flex items-center gap-1 text-purple-400/80 uppercase">
                                                    <Zap size={10} /> {task.impact_score} Impact
                                                </span>
                                                <span className="flex items-center gap-1 text-orange-400/80 uppercase">
                                                    <Clock size={10} /> {task.effort_hours}h
                                                </span>
                                                {task.financial_value > 0 && <span className="text-green-500/80">${task.financial_value.toLocaleString()}</span>}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => completeTask(task)}
                                            className="bg-blue-500/10 text-blue-400 p-4 rounded-2xl border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all shadow-[0_0_15px_rgba(59,130,246,0.1)] active:scale-90"
                                        >
                                            <CheckCircle2 size={20} />
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="bg-zinc-900/20 border border-dashed border-white/5 p-12 rounded-[2.5rem] flex flex-col items-center justify-center text-center gap-4">
                            <div className="bg-zinc-900 p-4 rounded-full text-zinc-700">
                                <LayoutGrid size={32} />
                            </div>
                            <div>
                                <h3 className="text-zinc-400 font-medium">No Focus Path Active</h3>
                                <p className="text-zinc-600 text-xs mt-1">Audit your backlog to set today's mission.</p>
                            </div>
                            <Link href="/audit" className="mt-4 px-8 py-3 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-full border border-white/5 hover:bg-zinc-800 transition-colors">
                                Open Audit Feed
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
