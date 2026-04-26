import type { StructuredDoc } from "./documentExport";

// Parse the plain-text "title \n\n heading \n para \n para \n\n heading ..." format.
export function parsePlainDoc(content: string, fallbackTitle = "Untitled Document"): StructuredDoc {
  const lines = content.replace(/\r/g, "").split("\n");
  let title = fallbackTitle;
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
  return { title, sections };
}

export function wordCount(doc: StructuredDoc): number {
  let n = 0;
  for (const s of doc.sections) {
    for (const p of s.paragraphs) n += p.split(/\s+/).filter(Boolean).length;
  }
  return n;
}

export function pageEstimate(doc: StructuredDoc): number {
  // ~300 words per page in standard pro layout
  return Math.max(1, Math.ceil(wordCount(doc) / 300));
}