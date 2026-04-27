import { supabase } from '../integrations/supabase/client';
import type { Chapter, DocumentState } from '../store/useAppStore';
import type { CitationStyle } from './citations';

type OutlineResp = {
  title: string;
  chapters: Array<{ heading: string; synopsis: string; subpoints: string[] }>;
  error?: string;
};
type ChapterResp = { content: string; error?: string };

export type EditResp = {
  mode: 'chat' | 'edit_chapter' | 'edit_title' | 'add_chapter';
  chat_reply: string;
  chapter_index?: number;
  new_heading?: string;
  new_content?: string;
  new_title?: string;
  error?: string;
};

export const planOutline = async (
  topic: string, targetPages: number, citationStyle: CitationStyle,
): Promise<OutlineResp> => {
  const fullTopic = citationStyle !== 'none'
    ? `${topic}\n\nFormat as an academic document. Where evidence would be cited, the writer will insert source placeholders like [1], [2] using ${citationStyle.toUpperCase()} style. Plan chapters accordingly.`
    : topic;
  const { data, error } = await supabase.functions.invoke('doc-outline', {
    body: { topic: fullTopic, targetPages, audience: 'general' },
  });
  if (error) throw new Error(error.message);
  return data as OutlineResp;
};

export const expandChapter = async (
  docTitle: string,
  chapter: Chapter,
  targetWords: number,
  priorContext: string,
  citationStyle: CitationStyle,
): Promise<ChapterResp> => {
  const augmented = citationStyle !== 'none'
    ? { ...chapter, synopsis: `${chapter.synopsis}\n\nNote: include 2-4 inline citation placeholders like [1], [2] (${citationStyle.toUpperCase()}) where claims need sources.` }
    : chapter;
  const { data, error } = await supabase.functions.invoke('doc-chapter', {
    body: { docTitle, chapter: augmented, targetWords, priorContext },
  });
  if (error) throw new Error(error.message);
  return data as ChapterResp;
};

export const askEditor = async (
  userMessage: string,
  doc: DocumentState,
  recentMessages: Array<{ role: string; content: string }>,
): Promise<EditResp> => {
  const { data, error } = await supabase.functions.invoke('doc-edit', {
    body: { userMessage, doc, recentMessages },
  });
  if (error) throw new Error(error.message);
  return data as EditResp;
};
