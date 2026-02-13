"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mic, Target, Zap, LayoutGrid } from "lucide-react";

const NAV_ITEMS = [
    { href: "/", label: "Home", icon: Target },
    { href: "/dump", label: "Dump", icon: Mic },
    { href: "/audit", label: "Audit", icon: Zap },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <div className="fixed bottom-0 left-0 right-0 p-6 z-50 pointer-events-none">
            <nav className="max-w-md mx-auto bg-zinc-900/80 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-2 flex items-center justify-between pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="relative flex-1 flex flex-col items-center py-4 gap-1.5 group active:scale-95 transition-transform"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="nav-active"
                                    className="absolute inset-x-2 inset-y-1 bg-white/5 rounded-3xl border border-white/10"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <Icon
                                size={24}
                                className={`transition-all relative z-10 ${isActive ? "text-blue-400 scale-110" : "text-zinc-500 group-hover:text-zinc-300"}`}
                            />
                            <span className={`text-[9px] font-bold uppercase tracking-widest relative z-10 ${isActive ? "text-blue-400" : "text-zinc-600 group-hover:text-zinc-400"}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
