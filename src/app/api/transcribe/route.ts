import { NextResponse } from "next/server";
import { createClient } from "@deepgram/sdk";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    // 1. Get the API Key from environment
    const deepgramApiKey = process.env.DEEPGRAM_API_KEY;

    if (!deepgramApiKey) {
        return NextResponse.json(
            { error: "Deepgram API Key not configured" },
            { status: 500 }
        );
    }

    // 2. Initialize Deepgram Client
    const deepgram = createClient(deepgramApiKey);

    try {
        // 3. Create a temporary key (Ephemera) for the client
        // This prevents exposing the master key in the browser
        const { result, error } = await deepgram.manage.createProjectKey(
            process.env.DEEPGRAM_PROJECT_ID || "default", // Project ID is optional if using a scoped key, but recommended
            {
                comment: "Ephemeral Global Key",
                scopes: ["usage:write"],
                time_to_live_in_seconds: 60, // Key dies in 1 minute
            }
        );

        if (error) {
            // If Project ID is missing or other error, fallback or throw
            console.error("Deepgram Key Error:", error);
            throw new Error("Failed to create temporary key");
        }

        return NextResponse.json({
            key: result?.key,
        });
    } catch (error) {
        console.error("Transcribe Route Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
