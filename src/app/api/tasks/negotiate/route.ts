import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PERSONAS } from "@/lib/personas.config";

export async function POST(req: Request) {
    try {
        const { tasks, personaIds } = await req.json();
        const geminiApiKey = process.env.GEMINI_API_KEY;

        if (!geminiApiKey) {
            return NextResponse.json({ error: "Gemini Key Missing" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const selectedPersonas = PERSONAS.filter(p => personaIds?.includes(p.id));
        const boardDescription = selectedPersonas.map(p => `- ${p.name}: ${p.promptSnippet}`).join("\n");

        const prompt = `
            You are a Board Meeting. You must evaluate the user's task list from multiple perspectives and come to a consensus on a "Strategic Path Forward".

            THE BOARD MEMBERS:
            ${boardDescription}

            Current Task Backlog (JSON):
            ${JSON.stringify(tasks, null, 2)}
            
            As the Board, identify a single, unified path.
            Return ONLY a JSON object with this structure:
            {
              "focus_tasks": ["uuid1", "uuid2"], // 2-3 tasks to execute today
              "prune_tasks": ["uuid3"], // 1-2 low-value tasks to delete
              "outcome_prediction": "Quantified board projection (e.g. 'Projected $12,500 capture + 8 Focus Hours')",
              "rational": "A summary of the board's debate and final consensus logic. Mention specific members' viewpoints if they clash (e.g. 'Warren pushed for the high-value pivot while Goggins demanded we stop avoiding the harder task X'). Max 3 sentences."
            }
            
            Requirements:
            - Focus on the HIGHEST ROI items that satisfy the board's diverse biases.
            - The "rational" MUST feel like it came from a board meeting.
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json|```/g, "").trim();

        try {
            const proposal = JSON.parse(text);
            return NextResponse.json({ proposal });
        } catch {
            console.error("Board JSON Parse Error:", text);
            return NextResponse.json({ error: "Invalid Board response format" }, { status: 500 });
        }

    } catch (err) {
        const error = err as Error;
        console.error("❌ Board Room Error:", error);
        return NextResponse.json({ error: "Board Meeting Failed", message: error.message }, { status: 500 });
    }
}
