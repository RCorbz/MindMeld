import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const { focus_ids, prune_ids } = await req.json();

        // 1. Reset all focus states first (or just update specific ones)
        // For simplicity in this POC, we'll mark the selected ones as focus and others as not focus if they are in the prune list

        if (focus_ids && focus_ids.length > 0) {
            await supabase
                .from("tasks")
                .update({ is_focus: true })
                .in("id", focus_ids);
        }

        if (prune_ids && prune_ids.length > 0) {
            await supabase
                .from("tasks")
                .update({ is_focus: false })
                .in("id", prune_ids);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        const error = err as Error;
        console.error("Focus Update Error:", error);
        return NextResponse.json({ error: "Focus Update Failed" }, { status: 500 });
    }
}
