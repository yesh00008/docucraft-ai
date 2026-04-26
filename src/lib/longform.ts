import { supabase } from "@/integrations/supabase/client";
import type { StructuredDoc } from "./documentExport";
import { parsePlainDoc } from "./parseDocument";

export type Outline = {
  title: string;
  chapters: { heading: string; synopsis: string; subpoints: string[] }[];
};

export async function fetchOutline(topic: string, targetPages: number, audience: string): Promise<Outline> {
  const { data, error } = await supabase.functions.invoke("doc-outline", {
    body: { topic, targetPages, audience },
  });
  if (error) throw new Error(error.message);
  return data as Outline;
}

export async function fetchChapter(
  docTitle: string,
  chapter: Outline["chapters"][number],
  targetWords: number,
  priorContext: string,
): Promise<string> {
  const { data, error } = await supabase.functions.invoke("doc-chapter", {
    body: { docTitle, chapter, targetWords, priorContext },
  });
  if (error) throw new Error(error.message);
  return (data as { content: string }).content || "";
}

export function mergeChapter(doc: StructuredDoc, chapterText: string): StructuredDoc {
  const parsed = parsePlainDoc(chapterText, "Chapter");
  // The chapter response opens with the chapter heading — its sections are sub-sections.
  const chapterSection = {
    heading: parsed.title,
    paragraphs: [] as string[],
  };
  // Flatten: subheading becomes "{heading}" line then paragraphs
  const flattened: { heading: string; paragraphs: string[] }[] = [chapterSection];
  for (const s of parsed.sections) {
    flattened.push({ heading: s.heading, paragraphs: s.paragraphs });
  }
  return { ...doc, sections: [...doc.sections, ...flattened] };
}