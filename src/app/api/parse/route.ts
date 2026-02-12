import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Initialize Supabase Client (Service Role for API routes if needed, but Anon is fine for now with RLS)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Regex Patterns for T.I.D.E. (Simple Heuristic for Alpha)
const PATTERNS = {
    IMPACT: /(high|critical|important|huge) impact/i,
    EFFORT: /(\d+|one|two|five) (hour|minute|day)/i,
    DEADLINE: /by (friday|monday|tomorrow|next week)/i,
    FINANCIAL: /\$(\d+)/,
};

export async function POST(req: Request) {
    try {
        const { transcript } = await req.json();

        if (!transcript) {
            return NextResponse.json({ error: "No transcript provided" }, { status: 400 });
        }

        console.log("🧠 Parsing Transcript:", transcript);

        // 1. EXTRACT METADATA (Heuristic)
        const impactMatch = transcript.match(PATTERNS.IMPACT);
        const effortMatch = transcript.match(PATTERNS.EFFORT);
        const deadlineMatch = transcript.match(PATTERNS.DEADLINE);
        const financialMatch = transcript.match(PATTERNS.FINANCIAL);

        // DEFAULT VALUES
        let impactScore = 1;
        if (impactMatch) impactScore = 8; // High impact keyword -> 8/10

        let effortHours = 1.0;
        if (effortMatch) {
            // Rough parser: "two hours" -> 2
            const val = parseInt(effortMatch[1]) || (effortMatch[1] === 'two' ? 2 : 1);
            effortHours = val;
        }

        // 2. INSERT INTO SUPABASE
        const { data, error } = await supabase
            .from("tasks")
            .insert({
                title: transcript, // Use full transcript as title for now
                status: "todo",
                impact_score: impactScore,
                effort_hours: effortHours,
                deadline: deadlineMatch ? new Date() : null, // Todo: accurate date parsing
                urgency: deadlineMatch ? 2.0 : 1.0,
            })
            .select("id")
            .single();

        if (error) {
            console.error("❌ Supabase Insert Error:", error);
            throw error;
        }

        console.log("✅ Task Created:", data.id);

        return NextResponse.json({
            id: data.id,
            parsed: {
                impact: impactScore,
                effort: effortHours
            }
        });

    } catch (error) {
        console.error("❌ Parse API Error:", error);
        return NextResponse.json({ error: "Failed to parse intent" }, { status: 500 });
    }
}
