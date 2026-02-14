import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
    try {
        const { transcript } = await req.json();

        if (!transcript) {
            return NextResponse.json({ error: "No transcript provided" }, { status: 400 });
        }

        console.log("🧠 PARSE START - Transcript:", transcript);

        // 1. Validate Environment Variables
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const geminiApiKey = process.env.GEMINI_API_KEY;

        if (!supabaseUrl || !supabaseKey || !geminiApiKey) {
            console.error("❌ Missing Env Vars");
            return NextResponse.json({
                error: "Server configuration missing",
                details: "Check Supabase and Gemini API keys in .env.local"
            }, { status: 500 });
        }

        // 2. Initialize Clients (Note: supabase instance is created for potential future use or RLS verification, but currently only genAI is used for extraction)
        // const supabase = createClient(supabaseUrl, supabaseKey); 
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // 3. Prompt Gemini
        const prompt = `
            You are a task management AI. Extract task data from this transcript: "${transcript}"
            Return a JSON object with these EXACT keys:
            - "title": string (3-10 words)
            - "impact_score": integer (1-10)
            - "financial_value": number (dollar amount, 0 if none)
            - "deadline": "YYYY-MM-DD" or null
            - "effort_hours": number (estimated hours)
            - "urgency": integer (1-10)
            
            Return ONLY the raw JSON object. No markdown.
        `;

        try {
            console.log("📡 Calling Gemini (gemini-1.5-flash)...");
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            console.log("✨ Gemini Raw Response:", responseText);

            // Extract JSON even if wrapped in markdown
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? jsonMatch[0] : responseText;

            let parsed;
            try {
                parsed = JSON.parse(jsonStr);
            } catch (pErr) {
                const error = pErr as Error;
                console.error("❌ JSON Parse Failed. Raw:", jsonStr);
                return NextResponse.json({
                    error: "AI returned invalid JSON",
                    message: error.message,
                    raw: responseText
                }, { status: 500 });
            }

            console.log("✅ Parsed JSON:", parsed);

            // 4. Data Normalization (for preview)
            const normalized = {
                title: parsed.title || transcript.substring(0, 50),
                impact_score: Math.min(10, Math.max(1, parseInt(parsed.impact_score) || 5)),
                financial_value: parseFloat(String(parsed.financial_value || 0).replace(/[^0-9.]/g, '')) || 0,
                effort_hours: parseFloat(String(parsed.effort_hours || 1.0).replace(/[^0-9.]/g, '')) || 1.0,
                deadline: parsed.deadline || null,
                urgency: Math.min(10, Math.max(1, parseInt(parsed.urgency) || 5)),
            };

            return NextResponse.json({ parsed: normalized });

        } catch (innerErr) {
            const error = innerErr as Error;
            console.error("❌ Processing failed:", error);
            return NextResponse.json({
                error: "Processing failed",
                message: error.message,
                details: error.toString()
            }, { status: 500 });
        }

    } catch (outerErr) {
        const error = outerErr as Error;
        console.error("❌ Server Error:", error);
        return NextResponse.json({ error: "Internal server error", message: error.message }, { status: 500 });
    }
}
