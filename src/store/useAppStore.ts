import { create } from 'zustand';

export type DocumentChunk = {
  id: string;
  sectionTitle: string;
  content: string;
  order: number;
};

export type DocumentTheme = {
  id: string;
  name: string;
  fontFamilyHeading: string;
  fontFamilyBody: string;
  bgColor: string;
  textColor: string;
};

export const THEMES: DocumentTheme[] = [
  {
    id: 'classic',
    name: 'Classic Serif',
    fontFamilyHeading: 'Playfair Display, serif',
    fontFamilyBody: 'Merriweather, serif',
    bgColor: '#F9F9F9',
    textColor: '#1A1A1A',
  },
  {
    id: 'modern',
    name: 'Modern Minimal',
    fontFamilyHeading: 'Outfit, sans-serif',
    fontFamilyBody: 'Outfit, sans-serif',
    bgColor: '#FFFFFF',
    textColor: '#0F172A',
  },
  {
    id: 'typewriter',
    name: 'Typewriter',
    fontFamilyHeading: 'Courier Prime, monospace',
    fontFamilyBody: 'Courier Prime, monospace',
    bgColor: '#F4F4EC',
    textColor: '#2D2D2D',
  },
];

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

interface AppState {
  messages: Message[];
  addMessage: (message: Message) => void;
  
  chunks: DocumentChunk[];
  addChunk: (chunk: DocumentChunk) => void;
  clearChunks: () => void;
  
  isGenerating: boolean;
  setGenerating: (generating: boolean) => void;
  
  activeThemeId: string;
  setActiveTheme: (themeId: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  messages: [
    { id: '1', role: 'assistant', content: 'Welcome to the Document Generator. What would you like to create today? You can generate up to 200 pages.' }
  ],
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  
  chunks: [],
  addChunk: (chunk) => set((state) => ({ chunks: [...state.chunks, chunk] })),
  clearChunks: () => set({ chunks: [] }),
  
  isGenerating: false,
  setGenerating: (isGenerating) => set({ isGenerating }),
  
  activeThemeId: 'classic',
  setActiveTheme: (activeThemeId) => set({ activeThemeId }),
}));
