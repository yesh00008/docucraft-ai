import { create } from 'zustand';
import { THEMES } from '../lib/themes';
import type { CitationStyle, Source } from '../lib/citations';

export type Chapter = {
  id: string;
  heading: string;
  synopsis: string;
  subpoints?: string[];
  content: string;        // long-form prose; can be empty until expanded
  status: 'pending' | 'streaming' | 'done' | 'error';
};

export type DocumentState = {
  title: string;
  chapters: Chapter[];
};

export type Snapshot = {
  id: string;
  label: string;          // user-readable label
  at: number;
  doc: DocumentState;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  pending?: boolean;
};

// Theme alias for legacy components
export const THEMES_LEGACY = THEMES;
export { THEMES } from '../lib/themes';

const STORAGE_KEY = 'docugen.v3';

type Persisted = {
  doc: DocumentState;
  snapshots: Snapshot[];
  themeId: string;
  citationStyle: CitationStyle;
  sources: Source[];
  messages: ChatMessage[];
};

const loadPersisted = (): Partial<Persisted> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch { return {}; }
};

const savePersisted = (s: Persisted) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* quota */ }
};

interface AppState {
  // Document
  doc: DocumentState;
  setDoc: (d: DocumentState) => void;
  setTitle: (t: string) => void;
  upsertChapter: (ch: Chapter) => void;
  updateChapterContent: (id: string, content: string, status?: Chapter['status']) => void;
  removeChapter: (id: string) => void;
  reset: () => void;

  // Chat
  messages: ChatMessage[];
  addMessage: (m: ChatMessage) => void;
  patchMessage: (id: string, patch: Partial<ChatMessage>) => void;

  // Generation
  isGenerating: boolean;
  generationLabel: string;
  setGenerating: (v: boolean, label?: string) => void;

  // Theme + citations + sources
  themeId: string;
  setThemeId: (id: string) => void;
  citationStyle: CitationStyle;
  setCitationStyle: (s: CitationStyle) => void;
  sources: Source[];
  addSource: (s: Source) => void;
  removeSource: (id: string) => void;
  clearSources: () => void;

  // History
  snapshots: Snapshot[];
  takeSnapshot: (label: string) => void;
  restoreSnapshot: (id: string) => void;

  // UI
  diffOpen: boolean;
  diffWith: string | null;       // snapshot id to diff CURRENT against
  openDiff: (id: string) => void;
  closeDiff: () => void;
}

const initialDoc: DocumentState = { title: '', chapters: [] };

const persisted = loadPersisted();

export const useAppStore = create<AppState>((set, get) => {
  const persistNow = () => {
    const s = get();
    savePersisted({
      doc: s.doc,
      snapshots: s.snapshots,
      themeId: s.themeId,
      citationStyle: s.citationStyle,
      sources: s.sources,
      messages: s.messages.slice(-200),
    });
  };

  const wrap = <Args extends unknown[]>(fn: (...a: Args) => void) =>
    (...a: Args) => { fn(...a); persistNow(); };

  return {
    doc: persisted.doc ?? initialDoc,
    setDoc: wrap((d) => set({ doc: d })),
    setTitle: wrap((t) => set((s) => ({ doc: { ...s.doc, title: t } }))),
    upsertChapter: wrap((ch) => set((s) => {
      const i = s.doc.chapters.findIndex(c => c.id === ch.id);
      const next = [...s.doc.chapters];
      if (i === -1) next.push(ch); else next[i] = ch;
      return { doc: { ...s.doc, chapters: next } };
    })),
    updateChapterContent: wrap((id, content, status) => set((s) => ({
      doc: {
        ...s.doc,
        chapters: s.doc.chapters.map(c => c.id === id
          ? { ...c, content, status: status ?? c.status }
          : c),
      },
    }))),
    removeChapter: wrap((id) => set((s) => ({
      doc: { ...s.doc, chapters: s.doc.chapters.filter(c => c.id !== id) },
    }))),
    reset: wrap(() => set({ doc: initialDoc })),

    messages: persisted.messages ?? [{
      id: 'welcome',
      role: 'assistant',
      content: "Hi! Tell me what document you want and I'll generate it. You can ask me to change any specific part later, switch themes, add citations, and export to PDF/DOCX/PPTX.",
    }],
    addMessage: wrap((m) => set((s) => ({ messages: [...s.messages, m] }))),
    patchMessage: wrap((id, patch) => set((s) => ({
      messages: s.messages.map(m => m.id === id ? { ...m, ...patch } : m),
    }))),

    isGenerating: false,
    generationLabel: '',
    setGenerating: (v, label = '') => set({ isGenerating: v, generationLabel: label }),

    themeId: persisted.themeId ?? 'midnight',
    setThemeId: wrap((id) => set({ themeId: id })),

    citationStyle: persisted.citationStyle ?? 'none',
    setCitationStyle: wrap((s) => set({ citationStyle: s })),
    sources: persisted.sources ?? [],
    addSource: wrap((s) => set((st) => ({ sources: [...st.sources, s] }))),
    removeSource: wrap((id) => set((st) => ({ sources: st.sources.filter(x => x.id !== id) }))),
    clearSources: wrap(() => set({ sources: [] })),

    snapshots: persisted.snapshots ?? [],
    takeSnapshot: wrap((label) => set((s) => ({
      snapshots: [
        { id: crypto.randomUUID(), label, at: Date.now(), doc: JSON.parse(JSON.stringify(s.doc)) },
        ...s.snapshots,
      ].slice(0, 50),
    }))),
    restoreSnapshot: wrap((id) => set((s) => {
      const snap = s.snapshots.find(x => x.id === id);
      if (!snap) return s;
      return { doc: JSON.parse(JSON.stringify(snap.doc)) };
    })),

    diffOpen: false,
    diffWith: null,
    openDiff: (id) => set({ diffOpen: true, diffWith: id }),
    closeDiff: () => set({ diffOpen: false, diffWith: null }),
  };
});

// Helpers exposed for components
export const docToPlain = (d: DocumentState): string => {
  const head = d.title ? `${d.title}\n\n` : '';
  return head + d.chapters.map(c => `${c.heading}\n\n${c.content || c.synopsis || ''}`).join('\n\n');
};
