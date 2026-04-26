// Lovable AI document generator/refiner
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_GENERATE = `You are a professional document writer. Produce a complete, well-structured document based on the user's topic.
Rules:
- Begin with a single line containing only the title (no markdown, no "Title:" prefix).
- Then a blank line.
- Then the body, organized in clearly named sections.
- Each section starts with the section heading on its own line, followed by 1-3 paragraphs of substantive content.
- Do not use markdown symbols (#, *, -, _, backticks). No bullet points unless written as plain sentences.
- Use a professional, clear, complete tone suitable for direct PDF/Word export.`;

const SYSTEM_REFINE = `You are a document editor. Improve clarity, grammar, flow, and tone of the provided document while preserving its overall structure (title + section headings + paragraphs).
Return the full revised document in the same plain format:
- First line: title only.
- Blank line.
- Sections with heading lines followed by paragraphs.
No markdown symbols. No commentary, just the document.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode, prompt, document, instruction } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    let messages: Array<{ role: string; content: string }> = [];

    if (mode === "refine") {
      if (!document || typeof document !== "string") {
        return new Response(JSON.stringify({ error: "Missing document" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      messages = [
        { role: "system", content: SYSTEM_REFINE },
        {
          role: "user",
          content: `Instruction: ${instruction || "Improve clarity, grammar, and tone. Keep the structure."}\n\nDocument:\n${document}`,
        },
      ];
    } else {
      if (!prompt || typeof prompt !== "string") {
        return new Response(JSON.stringify({ error: "Missing prompt" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      messages = [
        { role: "system", content: SYSTEM_GENERATE },
        { role: "user", content: prompt },
      ];
    }

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
          messages,
        }),
      },
    );

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (resp.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add credits in Lovable workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";

    // Parse title + sections
    const lines = content.replace(/\r/g, "").split("\n");
    let title = "Untitled Document";
    let bodyStart = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim()) {
        title = lines[i].trim().replace(/^#+\s*/, "").replace(/\*+/g, "");
        bodyStart = i + 1;
        break;
      }
    }
    const bodyLines = lines.slice(bodyStart);
    const sections: { heading: string; paragraphs: string[] }[] = [];
    let current: { heading: string; paragraphs: string[] } | null = null;
    let buffer: string[] = [];

    const flushPara = () => {
      if (!current) return;
      const text = buffer.join(" ").trim();
      if (text) current.paragraphs.push(text);
      buffer = [];
    };

    for (const raw of bodyLines) {
      const line = raw.trimEnd();
      if (!line.trim()) {
        flushPara();
        continue;
      }
      const cleaned = line.replace(/^#+\s*/, "").replace(/\*\*/g, "").trim();
      const isHeading =
        cleaned.length < 90 &&
        !cleaned.endsWith(".") &&
        !cleaned.endsWith(",") &&
        cleaned.split(" ").length <= 12 &&
        (current === null || (buffer.length === 0 && current.paragraphs.length > 0));
      if (isHeading) {
        flushPara();
        current = { heading: cleaned, paragraphs: [] };
        sections.push(current);
      } else {
        if (!current) {
          current = { heading: "Introduction", paragraphs: [] };
          sections.push(current);
        }
        buffer.push(cleaned);
      }
    }
    flushPara();

    return new Response(
      JSON.stringify({ title, sections, raw: content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("document-ai error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});