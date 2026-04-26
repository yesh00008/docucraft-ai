// Long-form: expand a single chapter into ~N words of polished prose.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { docTitle, chapter, targetWords = 900, priorContext = "" } = await req.json();
    if (!chapter?.heading) {
      return new Response(JSON.stringify({ error: "Missing chapter" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const sys = `You are a professional long-form writer expanding a single chapter of a larger document.
Rules:
- Write approximately ${targetWords} words of substantive, original prose.
- Begin with the chapter heading on its own line, then a blank line, then the body.
- Within the chapter, use clear sub-headings (each on its own line, max 8 words, no trailing punctuation) followed by 1-3 paragraphs each.
- No markdown symbols (no #, *, -, _, backticks). No bullet lists; write flowing prose.
- Maintain a coherent, professional tone consistent with the broader document.
- Do not repeat content from prior chapters; build on it.`;

    const usr = `Document title: ${docTitle}
Chapter heading: ${chapter.heading}
Synopsis: ${chapter.synopsis}
Subpoints to cover:
${(chapter.subpoints || []).map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")}

${priorContext ? `Brief recap of what came before:\n${priorContext}\n` : ""}
Now write the chapter.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: usr },
        ],
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit reached." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await resp.text();
      console.error("chapter AI error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await resp.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("doc-chapter error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
