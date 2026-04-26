// Streaming chat editor: takes conversation + current document, streams an updated document or chat reply.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are an AI co-writer working alongside a user on a long-form document.
You will receive: (1) the current document as plain text and (2) the latest user message.

Decide between two response modes and PREFIX the very first line of your reply with one of these tokens (no spaces, no quotes, then a newline):

@@DOC@@   → when the user wants the document edited, expanded, rewritten, or replaced.
              After this token, output the FULL revised document in plain text:
              - First line: title only (no markdown).
              - Blank line.
              - Sections with heading lines followed by paragraphs.
              - No markdown symbols, no commentary, just the document.

@@CHAT@@  → when the user is asking a question, requesting a suggestion, or chatting.
              After this token, reply conversationally in 1-4 short paragraphs.
              Do NOT repeat the document.

Always pick exactly one mode. Never mix.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, document } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const docContext = document
      ? `Current document:\n----\n${document}\n----`
      : "Current document: (empty — no document yet)";

    const fullMessages = [
      { role: "system", content: SYSTEM },
      { role: "system", content: docContext },
      ...(Array.isArray(messages) ? messages : []),
    ];

    const resp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: fullMessages,
          stream: true,
        }),
      },
    );

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached. Try again soon." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (resp.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await resp.text();
      console.error("doc-chat AI error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(resp.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("doc-chat error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
