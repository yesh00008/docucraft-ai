export type DocumentTheme = {
  id: string;
  name: string;
  description: string;
  fontHeading: string;
  fontBody: string;
  bg: string;
  text: string;
  accent: string;
  muted: string;
  border?: string;
  pagePadding?: string;
  showBorderFrame?: boolean;
};

export const THEMES: DocumentTheme[] = [
  { id: 'classic', name: 'Classic Serif', description: 'Editorial Playfair + Merriweather',
    fontHeading: '"Playfair Display", serif', fontBody: 'Merriweather, serif',
    bg: '#FAF8F3', text: '#1A1A1A', accent: '#7A1F1F', muted: '#5b5b5b' },
  { id: 'modern', name: 'Modern Minimal', description: 'Clean Outfit, lots of air',
    fontHeading: 'Outfit, sans-serif', fontBody: 'Outfit, sans-serif',
    bg: '#FFFFFF', text: '#0F172A', accent: '#2563EB', muted: '#475569' },
  { id: 'typewriter', name: 'Typewriter', description: 'Monospace draft feel',
    fontHeading: '"Courier Prime", monospace', fontBody: '"Courier Prime", monospace',
    bg: '#F4F1E8', text: '#2D2D2D', accent: '#8B4513', muted: '#666' },
  { id: 'midnight', name: 'Midnight Focus', description: 'Dark academic',
    fontHeading: '"Playfair Display", serif', fontBody: 'Outfit, sans-serif',
    bg: '#0F1419', text: '#E5E7EB', accent: '#D4FF00', muted: '#94A3B8' },
  { id: 'academic', name: 'Academic Paper', description: 'Bordered scholarly layout',
    fontHeading: 'Merriweather, serif', fontBody: 'Merriweather, serif',
    bg: '#FFFFFF', text: '#111111', accent: '#7A1F1F', muted: '#444',
    border: '1px solid #d4d4d4', showBorderFrame: true, pagePadding: '4rem 3.5rem' },
  { id: 'corporate', name: 'Corporate Slate', description: 'Crisp business deck',
    fontHeading: 'Outfit, sans-serif', fontBody: 'Outfit, sans-serif',
    bg: '#F8FAFC', text: '#0F172A', accent: '#0EA5E9', muted: '#475569',
    border: '1px solid #e2e8f0', showBorderFrame: true },
  { id: 'manuscript', name: 'Manuscript Cream', description: 'Warm cream with framed pages',
    fontHeading: '"Playfair Display", serif', fontBody: 'Merriweather, serif',
    bg: '#FBF5E6', text: '#2A1F14', accent: '#8B4513', muted: '#6b5840',
    border: '2px double #8B4513', showBorderFrame: true, pagePadding: '4rem 3.5rem' },
];

export const themeById = (id: string) => THEMES.find(t => t.id === id) ?? THEMES[0];
