export type CitationStyle = 'none' | 'apa' | 'mla' | 'chicago' | 'ieee';

export type Source = {
  id: string;
  authors: string;
  year: string;
  title: string;
  publisher?: string;
  url?: string;
};

export const formatReference = (s: Source, style: CitationStyle): string => {
  const pub = s.publisher ?? '';
  const url = s.url ? ` ${s.url}` : '';
  switch (style) {
    case 'apa': return `${s.authors} (${s.year}). ${s.title}. ${pub}.${url}`.trim();
    case 'mla': return `${s.authors}. "${s.title}." ${pub}, ${s.year}.${url}`.trim();
    case 'chicago': return `${s.authors}. ${s.title}. ${pub}, ${s.year}.${url}`.trim();
    case 'ieee': return `${s.authors}, "${s.title}," ${pub}, ${s.year}.${url}`.trim();
    default: return `${s.authors} (${s.year}). ${s.title}.`;
  }
};

export const inlineCitation = (n: number, style: CitationStyle, s?: Source): string => {
  if (style === 'none') return '';
  if (style === 'ieee') return `[${n}]`;
  if (style === 'apa' && s) {
    const surname = s.authors.split(/[,&]/)[0].trim();
    return `(${surname}, ${s.year})`;
  }
  if (style === 'mla' && s) {
    const surname = s.authors.split(/[,&]/)[0].trim();
    return `(${surname})`;
  }
  return `[${n}]`;
};

export const citationStyleLabel: Record<CitationStyle, string> = {
  none: 'No citations',
  apa: 'APA 7',
  mla: 'MLA 9',
  chicago: 'Chicago',
  ieee: 'IEEE',
};
