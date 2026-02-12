// Placeholder for Deno edge function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
    return new Response(
        JSON.stringify({ message: "Hello from Parser!" }),
        { headers: { "Content-Type": "application/json" } },
    )
})
