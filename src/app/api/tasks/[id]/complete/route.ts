import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        const { data, error } = await supabase
            .from("tasks")
            .update({
                status: "done",
                completed_at: new Date().toISOString()
            })
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, task: data });
    } catch (err) {
        console.error("Task Completion Error:", err);
        return NextResponse.json({ error: "Completion Failed" }, { status: 500 });
    }
}
