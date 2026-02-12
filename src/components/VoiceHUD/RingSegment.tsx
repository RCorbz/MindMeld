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

    // Calculate arc length for dasharray animation
    const radius = 80;
    const angleDiff = Math.abs(endAngle - startAngle);
    const arcLength = (2 * Math.PI * radius * angleDiff) / 360;

    return (
        <motion.path
            d={pathData}
            fill="none"
            stroke={isActive ? color : "#444444"}
            strokeWidth="12"
            strokeLinecap="round"
            initial={{ strokeDasharray: arcLength, strokeDashoffset: arcLength, stroke: "#444444" }}
            animate={{
                stroke: isActive ? color : "#333333",
                filter: isActive ? `drop-shadow(0 0 8px ${color})` : "none",
                strokeDashoffset: isActive ? 0 : arcLength
            }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="transition-colors duration-300"
        />
    );
}
