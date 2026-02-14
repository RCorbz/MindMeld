"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Users, BrainCircuit, Flame, DollarSign, Zap, LucideIcon } from "lucide-react";
import { useState } from "react";
import { PERSONAS } from "@/lib/personas.config";

interface Proposal {
    focus_tasks: string[];
    prune_tasks: string[];
    outcome_prediction: string;
    rational: string;
}

interface StrategyCardProps {
    proposal: Proposal;
    personaIds: string[];
    onClose: () => void;
    onConfirm: () => void;
    onReAudit: () => void;
}

const IconMap: Record<string, LucideIcon> = { BrainCircuit, Flame, DollarSign, Zap };

export default function StrategyCard({ proposal, personaIds, onClose, onConfirm, onReAudit }: StrategyCardProps) {
    const [showRationale, setShowRationale] = useState(false);

    const selectedPersonas = PERSONAS.filter(p => personaIds.includes(p.id));

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-[60] flex items-end sm:items-center justify-center p-4"
            >
                <motion.div
                    initial={{ y: 200, scale: 0.9 }}
                    animate={{ y: 0, scale: 1 }}
                    exit={{ y: 200, scale: 0.9 }}
                    className="bg-zinc-900 border border-white/10 rounded-[3rem] p-8 w-full max-w-lg shadow-[0_30px_90px_rgba(0,0,0,0.8)]"
                >
                    <div className="flex justify-between items-start mb-8">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2">
                                <Users size={14} className="text-blue-400" />
                                <h3 className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-500">Board Resolution</h3>
                            </div>

                            <div className="flex -space-x-2">
                                {selectedPersonas.map((p) => {
                                    const Icon = IconMap[p.avatar] || BrainCircuit;
                                    return (
                                        <div
                                            key={p.id}
                                            className={`w-10 h-10 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center ${p.color} shadow-xl`}
                                            title={p.name}
                                        >
                                            <Icon size={18} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-500">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-8 mb-10 text-center">
                        <div className="flex flex-col gap-4">
                            <h4 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">The Consensus Path</h4>
                            <p className="text-3xl font-light text-green-400 tracking-tight leading-tight px-4">
                                {proposal.outcome_prediction}
                            </p>
                        </div>

                        <div className="flex flex-col items-center gap-2">
                            <button
                                onClick={() => setShowRationale(!showRationale)}
                                className="text-[10px] font-bold text-zinc-600 hover:text-blue-400 transition-colors uppercase tracking-[0.2em] flex items-center gap-2"
                            >
                                {showRationale ? "Hide Rationale" : "Why this path?"}
                            </button>

                            <AnimatePresence>
                                {showRationale && (
                                    <motion.p
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="text-xs text-zinc-500 leading-relaxed font-light overflow-hidden max-w-sm mx-auto px-6"
                                    >
                                        {proposal.rational}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={onReAudit}
                            className="bg-zinc-800 text-zinc-400 font-bold py-5 rounded-[1.8rem] text-xs uppercase tracking-widest hover:bg-zinc-700 transition-colors"
                        >
                            Re-Audit
                        </button>
                        <button
                            onClick={onConfirm}
                            className="bg-blue-500 text-white font-bold py-5 rounded-[1.8rem] text-xs uppercase tracking-widest hover:bg-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.3)]"
                        >
                            Confirm Path
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
