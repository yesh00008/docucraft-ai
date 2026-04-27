import { useState } from 'react';
import { Plus, Trash2, Quote } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { citationStyleLabel, type CitationStyle, formatReference } from '../lib/citations';

export const SourcesPanel = () => {
  const { sources, addSource, removeSource, citationStyle, setCitationStyle } = useAppStore();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ authors: '', year: '', title: '', publisher: '', url: '' });

  const submit = () => {
    if (!draft.title.trim()) return;
    addSource({ id: crypto.randomUUID(), ...draft });
    setDraft({ authors: '', year: '', title: '', publisher: '', url: '' });
    setOpen(false);
  };

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
          <Quote size={14} className="text-primary" /> Sources
        </div>
        <select value={citationStyle} onChange={(e) => setCitationStyle(e.target.value as CitationStyle)}
          className="bg-secondary border border-border rounded px-1.5 py-0.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary">
          {(['none','apa','mla','chicago','ieee'] as CitationStyle[]).map(s => (
            <option key={s} value={s}>{citationStyleLabel[s]}</option>
          ))}
        </select>
      </div>

      <div className="max-h-40 overflow-auto space-y-1.5 mb-3">
        {sources.length === 0 && <div className="text-xs text-muted-foreground italic">No sources yet.</div>}
        {sources.map((s, i) => (
          <div key={s.id} className="group flex items-start gap-2 p-2 rounded-lg bg-secondary/40 hover:bg-secondary transition">
            <span className="text-[10px] font-mono text-primary mt-0.5">[{i + 1}]</span>
            <span className="text-[11px] flex-1 leading-snug">{formatReference(s, citationStyle === 'none' ? 'apa' : citationStyle)}</span>
            <button onClick={() => removeSource(s.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition">
              <Trash2 size={11} />
            </button>
          </div>
        ))}
      </div>

      {!open ? (
        <button onClick={() => setOpen(true)} className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg border border-dashed border-border hover:border-primary hover:text-primary transition text-xs">
          <Plus size={12} /> Add source
        </button>
      ) : (
        <div className="space-y-1.5">
          {([
            ['authors', 'Authors (e.g. Smith, J.)'],
            ['year', 'Year'],
            ['title', 'Title *'],
            ['publisher', 'Publisher'],
            ['url', 'URL'],
          ] as const).map(([k, ph]) => (
            <input key={k} value={(draft as Record<string, string>)[k]} placeholder={ph}
              onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
              className="w-full bg-secondary/60 border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
          ))}
          <div className="flex gap-1.5">
            <button onClick={submit} className="flex-1 py-1 rounded bg-primary text-primary-foreground text-xs font-semibold">Add</button>
            <button onClick={() => setOpen(false)} className="px-2 py-1 rounded bg-secondary text-xs">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};
