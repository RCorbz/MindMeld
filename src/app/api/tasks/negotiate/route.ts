import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
    try {
        const { tasks } = await req.json();
        const geminiApiKey = process.env.GEMINI_API_KEY;

        if (!geminiApiKey) {
            return NextResponse.json({ error: "Gemini Key Missing" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
            You are the Consiglieri, a ruthless but wise strategic advisor.
            Your goal is to maximize ROI for the user.
            
            Current Task Backlog (JSON):
            ${JSON.stringify(tasks, null, 2)}
            
            Based on this list, identify a "Strategic Path Forward".
            Return ONLY a JSON object with this structure:
            {
              "focus_tasks": ["uuid1", "uuid2"], // The IDs of 2-3 tasks to do today
              "prune_tasks": ["uuid3"], // The ID of 1-2 low-value tasks to kill
              "outcome_prediction": "Quantified statement (e.g. 'Secure $10,000 + 5 hours reclaimed')",
              "rational": "Short tactical explanation for why this path is mathematically optimal"
            }
            
            Requirements:
            - focus_tasks MUST be the highest ROI items.
            - prune_tasks MUST be the lowest ROI items.
            - outcome_prediction MUST be quantified (financial/time), punchy, and numerical.
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json|```/g, "").trim();

        try {
            const proposal = JSON.parse(text);
            return NextResponse.json({ proposal });
        } catch (parseErr) {
            console.error("JSON Parse Error:", text);
            return NextResponse.json({ error: "Invalid AI response format" }, { status: 500 });
        }

    } catch (err: any) {
        console.error("❌ Consiglieri Error:", err);
        return NextResponse.json({ error: "Failed to negotiate", message: err.message }, { status: 500 });
    }
}
