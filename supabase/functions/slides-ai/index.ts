// Slides generator: builds a structured deck (title + slides[]) from a topic.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { topic, slideCount = 12, audience = "general" } = await req.json();
    if (!topic) {
      return new Response(JSON.stringify({ error: "Missing topic" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const tool = {
      type: "function",
      function: {
        name: "emit_deck",
        description: "Return a structured slide deck.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string" },
            subtitle: { type: "string" },
            slides: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  bullets: { type: "array", items: { type: "string" } },
                  notes: { type: "string" },
                },
                required: ["title", "bullets", "notes"],
                additionalProperties: false,
              },
            },
          },
          required: ["title", "subtitle", "slides"],
          additionalProperties: false,
        },
      },
    };

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You design professional, well-paced presentation decks. Each slide has a sharp title (max 8 words), 3-5 concise bullet points (max 14 words each, no trailing punctuation), and 2-4 sentences of speaker notes. Total ${slideCount} content slides plus a title slide concept implied. Avoid filler.`,
          },
          {
            role: "user",
            content: `Topic: ${topic}\nAudience: ${audience}\nGenerate exactly ${slideCount} slides.`,
          },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "emit_deck" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit reached." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await resp.text();
      console.error("slides AI error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await resp.json();
    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    let parsed: any = { title: topic, subtitle: "", slides: [] };
    try { parsed = JSON.parse(args || "{}"); } catch (_) {}
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("slides-ai error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
