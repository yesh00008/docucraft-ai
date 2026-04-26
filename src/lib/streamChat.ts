const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/doc-chat`;

export type ChatMsg = { role: "user" | "assistant"; content: string };

export async function streamDocChat({
  messages,
  document,
  onDelta,
  onMode,
  onDone,
  signal,
}: {
  messages: ChatMsg[];
  document: string;
  onDelta: (chunk: string) => void;
  onMode: (mode: "DOC" | "CHAT") => void;
  onDone: () => void;
  signal?: AbortSignal;
}) {
  const resp = await fetch(FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, document }),
    signal,
  });

  if (!resp.ok || !resp.body) {
    if (resp.status === 429) throw new Error("Rate limit reached. Please wait a moment.");
    if (resp.status === 402) throw new Error("AI credits exhausted.");
    throw new Error("Failed to start stream");
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let modeDecided = false;
  let modeBuffer = "";
  let streamDone = false;

  const emit = (raw: string) => {
    let pending = raw;
    if (!modeDecided) {
      modeBuffer += pending;
      const m = modeBuffer.match(/^@@(DOC|CHAT)@@\n?/);
      if (m) {
        modeDecided = true;
        onMode(m[1] as "DOC" | "CHAT");
        pending = modeBuffer.slice(m[0].length);
        modeBuffer = "";
      } else if (modeBuffer.length > 30) {
        // Default to chat if no token shows up
        modeDecided = true;
        onMode("CHAT");
        pending = modeBuffer;
        modeBuffer = "";
      } else {
        return;
      }
    }
    if (pending) onDelta(pending);
  };

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") { streamDone = true; break; }
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) emit(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  if (!modeDecided && modeBuffer) {
    onMode("CHAT");
    onDelta(modeBuffer);
  }
  onDone();
}