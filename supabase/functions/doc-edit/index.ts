// Targeted document editor: AI decides whether the user wants a chat reply,
// a chapter-scoped edit, or a global rewrite. Returns structured JSON.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { userMessage, doc, recentMessages = [] } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const docContext = doc?.chapters?.length
      ? `Title: ${doc.title}\n\nChapters:\n` +
        doc.chapters.map((c: { heading: string; content: string; synopsis: string }, i: number) =>
          `[${i}] ${c.heading}\n${(c.content || c.synopsis || "").slice(0, 800)}`).join("\n\n---\n\n")
      : "(no document yet)";

    const tool = {
      type: "function",
      function: {
        name: "respond",
        description: "Respond to the user's request about their document.",
        parameters: {
          type: "object",
          properties: {
            mode: {
              type: "string",
              enum: ["chat", "edit_chapter", "edit_title", "add_chapter"],
              description: "chat = conversational answer only. edit_chapter = rewrite ONE chapter only. edit_title = change title only. add_chapter = append a new chapter.",
            },
            chat_reply: { type: "string", description: "Friendly explanation of what was changed (or a chat-only answer)." },
            chapter_index: { type: "number", description: "0-based index of the chapter to edit (when mode=edit_chapter)." },
            new_heading: { type: "string", description: "New chapter heading (optional when editing)." },
            new_content: { type: "string", description: "Full new prose for the chapter (plain text, no markdown symbols). Required for edit_chapter / add_chapter." },
            new_title: { type: "string", description: "New document title (only for edit_title)." },
          },
          required: ["mode", "chat_reply"],
          additionalProperties: false,
        },
      },
    };

    const sys = `You are a precise document co-writer. You receive the user's current document and their latest request. Choose ONE mode:
- If the user asks a question or wants advice: mode = "chat".
- If the user wants to change a specific part: mode = "edit_chapter" and edit ONLY that chapter; preserve all others.
- If the user wants the document title changed: mode = "edit_title".
- If the user asks to add a new section: mode = "add_chapter".
Never rewrite the entire document at once. Keep edits minimal and surgical. New prose: plain text, no markdown symbols, professional tone.`;

    const messages = [
      { role: "system", content: sys },
      { role: "system", content: `Current document:\n${docContext}` },
      ...recentMessages.slice(-6),
      { role: "user", content: userMessage },
    ];

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        tools: [tool],
        tool_choice: { type: "function", function: { name: "respond" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit reached." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await resp.text();
      console.error("doc-edit AI error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    let parsed: Record<string, unknown> = { mode: "chat", chat_reply: "I couldn't parse my response." };
    try { parsed = JSON.parse(args || "{}"); } catch { /* ignore */ }
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("doc-edit error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
