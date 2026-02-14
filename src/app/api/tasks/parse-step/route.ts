import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
    try {
        const { transcript, step } = await req.json();
        const geminiApiKey = process.env.GEMINI_API_KEY;

        if (!geminiApiKey) {
            return NextResponse.json({ error: "Gemini Key Missing" }, { status: 500 });
        }

        if (!transcript || !step) {
            return NextResponse.json({ error: "Missing transcript or step" }, { status: 400 });
        }

        const today = new Date().toISOString().split('T')[0];
        console.log(`🧠 [PARSE STEP]: ${step.toUpperCase()} | Date: ${today} | Transcript: "${transcript.substring(0, 50)}..."`);

        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const stepPrompts: Record<string, string> = {
            topic: "Extract a professional, 3-7 word task title from this transcript. Strip out filler words ('I need to', 'Can you'). Return ONLY the title string, no quotes.",
            impact: "Evaluate strategic impact from 1-10. SCALE: 10=Direct Revenue/Critical, 5=Standard Task, 1=Trivial. Also extract any USD financial value mentioned. Return ONLY JSON: { \"impact_score\": number, \"financial_value\": number }.",
            effort: "Extract effort in hours. If they say '2 hours', return 2. If 'half a day', return 4. Return ONLY JSON: { \"effort_hours\": number }. Be precise based on the transcript.",
            deadline: `Today is ${today}. Identify the deadline mentioned (relative or absolute). If absolute (e.g. Feb 20), assume the year is 2026. Return ONLY the date in YYYY-MM-DD format, or 'null' if unspecified. No quotes.`
        };

        const currentPrompt = stepPrompts[step];
        if (!currentPrompt) {
            console.error("❌ Invalid step:", step);
            return NextResponse.json({ error: "Invalid step" }, { status: 400 });
        }

        const prompt = `${currentPrompt} \n\nTranscript: "${transcript}"`;

        try {
            console.log("📡 Calling Gemini...");
            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text().trim();
            console.log("✨ Gemini Response:", text);

            if (step === "topic" || step === "deadline") {
                return NextResponse.json({ result: text === "null" ? null : text });
            }

            // JSON Steps (Impact/Effort)
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? jsonMatch[0] : text;
            try {
                const parsed = JSON.parse(jsonStr);
                return NextResponse.json({ result: parsed });
            } catch (pErr) {
                console.error("❌ JSON Parse Failed. Raw Text:", text);
                return NextResponse.json({ error: "AI returned invalid format", raw: text }, { status: 500 });
            }

        } catch (apiErr: any) {
            console.error("❌ Gemini API Error:", apiErr);
            return NextResponse.json({
                error: "Gemini query failed",
                details: apiErr.message || String(apiErr)
            }, { status: 500 });
        }

    } catch (outerErr: any) {
        console.error("❌ Outer Parse Step Error:", outerErr);
        return NextResponse.json({ error: "Server error", message: outerErr.message }, { status: 500 });
    }
}
