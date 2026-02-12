import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({ error: "Server configuration missing" }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Fetch tasks sorted by ROI (calculated in DB or handled here)
        // Note: Our DB schema has a generated 'roi_score' column!
        const { data, error } = await supabase
            .from("tasks")
            .select("*")
            .order("roi_score", { ascending: false });

        if (error) {
            console.error("❌ Supabase Fetch Error:", error);
            return NextResponse.json({ error: "Database error", message: error.message }, { status: 500 });
        }

        return NextResponse.json({ tasks: data });

    } catch (err: any) {
        console.error("❌ GET Tasks Error:", err);
        return NextResponse.json({ error: "Failed to fetch tasks", message: err.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const payload = await req.json();

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({ error: "Server configuration missing" }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase
            .from("tasks")
            .insert({
                title: payload.title,
                status: "todo",
                impact_score: payload.impact_score || 1,
                financial_value: payload.financial_value || 0,
                effort_hours: payload.effort_hours || 1.0,
                deadline: payload.deadline,
                urgency: payload.urgency || 1.0,
            })
            .select("id")
            .single();

        if (error) {
            console.error("❌ Supabase Task Insert Error:", error);
            return NextResponse.json({ error: "Database error", message: error.message }, { status: 500 });
        }

        return NextResponse.json({ id: data.id });

    } catch (err: any) {
        console.error("❌ Confirm API Error:", err);
        return NextResponse.json({ error: "Failed to save task", message: err.message }, { status: 500 });
    }
}
