"use client";

import { motion } from "framer-motion";

interface RingSegmentProps {
    startAngle: number;
    endAngle: number;
    isActive: boolean;
    label: string;
    color?: string;
}

export default function RingSegment({
    startAngle,
    endAngle,
    isActive,
    label,
    color = "#00FF00",
}: RingSegmentProps) {
    // Convert polar to cartesian
    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
        const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
        return {
            x: centerX + radius * Math.cos(angleInRadians),
            y: centerY + radius * Math.sin(angleInRadians),
        };
    };

    const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
        const start = polarToCartesian(x, y, radius, endAngle);
        const end = polarToCartesian(x, y, radius, startAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
        const d = [
            "M", start.x, start.y,
            "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
        ].join(" ");
        return d;
    };

    const pathData = describeArc(100, 100, 80, startAngle, endAngle); // 100,100 center, 80 radius

    return (
        <motion.path
            d={pathData}
            fill="none"
            stroke={isActive ? color : "#333333"}
            strokeWidth="12"
            strokeLinecap="round"
            initial={{ stroke: "#333333" }}
            animate={{
                stroke: isActive ? color : "#333333",
                filter: isActive ? `drop-shadow(0 0 8px ${color})` : "none"
            }}
            transition={{ duration: 0.3 }}
            className="transition-colors duration-300"
        />
    );
}
