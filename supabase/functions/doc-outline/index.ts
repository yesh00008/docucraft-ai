// Long-form: produce a chapter outline (titles + brief synopsis) for big documents.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { topic, targetPages = 50, audience = "general" } = await req.json();
    if (!topic) {
      return new Response(JSON.stringify({ error: "Missing topic" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    // ~2 pages per chapter target, capped 8..80
    const chapterCount = Math.max(8, Math.min(80, Math.round(targetPages / 2)));

    const tool = {
      type: "function",
      function: {
        name: "emit_outline",
        description: "Return the structured outline for the document.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string" },
            chapters: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  heading: { type: "string" },
                  synopsis: { type: "string" },
                  subpoints: { type: "array", items: { type: "string" } },
                },
                required: ["heading", "synopsis", "subpoints"],
                additionalProperties: false,
              },
            },
          },
          required: ["title", "chapters"],
          additionalProperties: false,
        },
      },
    };

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content: `You are a master book/report planner. Produce a coherent ${chapterCount}-chapter outline that, when each chapter is fully written, will yield approximately ${targetPages} pages of substantive professional writing. Each chapter heading must be specific (not generic), and the synopsis 2-3 sentences. Provide 3-6 subpoints per chapter as concrete sub-topics to cover.`,
          },
          {
            role: "user",
            content: `Topic: ${topic}\nTarget pages: ${targetPages}\nAudience: ${audience}\nReturn an outline with exactly ${chapterCount} chapters.`,
          },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "emit_outline" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit reached." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await resp.text();
      console.error("outline AI error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await resp.json();
    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    let parsed: any = { title: topic, chapters: [] };
    try { parsed = JSON.parse(args || "{}"); } catch (_) {}
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("doc-outline error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
