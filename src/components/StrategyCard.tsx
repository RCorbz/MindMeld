"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, X } from "lucide-react";
import { useState } from "react";

interface Proposal {
    focus_tasks: string[];
    prune_tasks: string[];
    outcome_prediction: string;
    rational: string;
}

interface StrategyCardProps {
    proposal: Proposal;
    onClose: () => void;
    onConfirm: () => void;
    onReAudit: () => void;
}

export default function StrategyCard({ proposal, onClose, onConfirm, onReAudit }: StrategyCardProps) {
    const [showRationale, setShowRationale] = useState(false);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[60] flex items-end sm:items-center justify-center p-4"
            >
                <motion.div
                    initial={{ y: 100, scale: 0.95 }}
                    animate={{ y: 0, scale: 1 }}
                    exit={{ y: 100, scale: 0.95 }}
                    className="bg-zinc-900 border border-white/10 rounded-[3rem] p-8 w-full max-w-lg shadow-[0_30px_60px_rgba(0,0,0,0.5)]"
                >
                    <div className="flex justify-between items-start mb-8">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-500/10 p-3 rounded-2xl text-blue-400 border border-blue-500/20">
                                <ShieldAlert size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold tracking-widest uppercase">The Consiglieri</h3>
                                <p className="text-[10px] text-zinc-500 mt-0.5 font-medium uppercase tracking-tighter">Strategic Path Forward</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-500">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-8 mb-10 text-center">
                        <div className="flex flex-col gap-4">
                            <h4 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Expected Daily Outcome</h4>
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
