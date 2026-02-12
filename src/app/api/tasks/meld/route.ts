import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
    try {
        const { task } = await req.json();
        const geminiApiKey = process.env.GEMINI_API_KEY;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!geminiApiKey || !supabaseUrl || !supabaseKey) {
            return NextResponse.json({ error: "Missing configuration" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Ask Gemini to break it down
        const prompt = `
            Break down this high-impact task into 3 distinct, actionable sub-tasks.
            Parent Task: "${task.title}"
            Current Stats: Impact ${task.impact_score}, Effort ${task.effort_hours}h.
            
            Return ONLY a JSON array of objects with these keys: 
            "title" (string), "impact_score" (int), "effort_hours" (float).
            The sub-tasks should collectively achieve the parent goal.
            Example: [{"title": "Subtask 1", "impact_score": 10, "effort_hours": 1.5}]
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json|```/g, "").trim();
        const subtasks = JSON.parse(text);

        // 2. Insert subtasks
        const { data: inserted, error: insertError } = await supabase
            .from("tasks")
            .insert(subtasks.map((st: any) => ({
                ...st,
                status: "todo",
                urgency: 1.0,
                deadline: task.deadline
            })))
            .select();

        if (insertError) throw insertError;

        // 3. Delete parent task
        await supabase.from("tasks").delete().eq("id", task.id);

        return NextResponse.json({ success: true, newTasks: inserted });

    } catch (err: any) {
        console.error("❌ Meld Error:", err);
        return NextResponse.json({ error: "Failed to meld task", message: err.message }, { status: 500 });
    }
}
