import { useEffect, useRef, useState } from 'react';
import { Send, Loader2, Sparkles, BookOpen, Quote, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, type Chapter } from '../store/useAppStore';
import { planOutline, expandChapter, askEditor } from '../lib/aiEngine';
import { citationStyleLabel, type CitationStyle } from '../lib/citations';

export const ChatPanel = () => {
  const {
    messages, addMessage, patchMessage,
    doc, setDoc, setTitle, upsertChapter, updateChapterContent,
    isGenerating, setGenerating, generationLabel,
    citationStyle, setCitationStyle,
    takeSnapshot,
  } = useAppStore();

  const [input, setInput] = useState('');
  const [pageCount, setPageCount] = useState(10);
  const [mode, setMode] = useState<'auto' | 'longform' | 'edit'>('auto');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, generationLabel]);

  const runLongform = async (topic: string) => {
    setGenerating(true, 'Planning chapters…');
    takeSnapshot('Before generation');
    const aId = crypto.randomUUID();
    addMessage({ id: aId, role: 'assistant', content: `Planning a ${pageCount}-page outline…`, pending: true });

    try {
      const outline = await planOutline(topic, pageCount, citationStyle);
      if (outline.error) throw new Error(outline.error);
      setDoc({ title: outline.title || topic, chapters: [] });

      const chapters: Chapter[] = outline.chapters.map((c) => ({
        id: crypto.randomUUID(),
        heading: c.heading,
        synopsis: c.synopsis,
        subpoints: c.subpoints,
        content: '',
        status: 'pending',
      }));
      chapters.forEach(c => upsertChapter(c));

      patchMessage(aId, { content: `Outline ready — ${chapters.length} chapters. Expanding…`, pending: false });

      const wordsPerChapter = Math.max(400, Math.round((pageCount * 350) / chapters.length));
      let prior = '';
      for (let i = 0; i < chapters.length; i++) {
        const c = chapters[i];
        setGenerating(true, `Writing ${i + 1}/${chapters.length}: ${c.heading}`);
        upsertChapter({ ...c, status: 'streaming' });
        const r = await expandChapter(outline.title, c, wordsPerChapter, prior, citationStyle);
        if (r.error) throw new Error(r.error);
        updateChapterContent(c.id, r.content || c.synopsis, 'done');
        prior = (r.content || '').slice(-600);
      }
      addMessage({
        id: crypto.randomUUID(), role: 'assistant',
        content: `Done. ${chapters.length} chapters written, roughly ${pageCount} pages. Ask me to refine any section.`,
      });
    } catch (e) {
      patchMessage(aId, { content: `Generation failed: ${e instanceof Error ? e.message : String(e)}`, pending: false });
    } finally {
      setGenerating(false);
    }
  };

  const runEdit = async (msg: string) => {
    setGenerating(true, 'Thinking…');
    takeSnapshot('Before edit');
    const aId = crypto.randomUUID();
    addMessage({ id: aId, role: 'assistant', content: '', pending: true });
    try {
      const r = await askEditor(
        msg, doc,
        messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
      );
      if (r.error) throw new Error(r.error);
      if (r.mode === 'edit_title' && r.new_title) setTitle(r.new_title);
      if (r.mode === 'edit_chapter' && typeof r.chapter_index === 'number') {
        const ch = doc.chapters[r.chapter_index];
        if (ch) {
          upsertChapter({
            ...ch,
            heading: r.new_heading || ch.heading,
            content: r.new_content || ch.content,
            status: 'done',
          });
        }
      }
      if (r.mode === 'add_chapter' && r.new_content) {
        upsertChapter({
          id: crypto.randomUUID(),
          heading: r.new_heading || 'New Section',
          synopsis: '',
          content: r.new_content,
          status: 'done',
        });
      }
      patchMessage(aId, { content: r.chat_reply || 'Done.', pending: false });
    } catch (e) {
      patchMessage(aId, { content: `Edit failed: ${e instanceof Error ? e.message : String(e)}`, pending: false });
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isGenerating) return;
    setInput('');
    addMessage({ id: crypto.randomUUID(), role: 'user', content: text });

    const isFirst = doc.chapters.length === 0;
    const wantsLongform = mode === 'longform' || (mode === 'auto' && isFirst);
    if (wantsLongform) await runLongform(text);
    else await runEdit(text);
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center gap-2 shrink-0">
        <Sparkles size={16} className="text-primary" />
        <span className="text-sm font-bold tracking-wider uppercase gradient-text">AI Studio</span>
        <span className="ml-auto text-[10px] text-muted-foreground font-mono">Lovable AI · Free</span>
      </div>

      {/* Mode chips */}
      <div className="px-5 pt-3 flex gap-1.5 shrink-0">
        {[
          { id: 'auto', label: 'Auto', icon: Sparkles },
          { id: 'longform', label: 'New doc', icon: BookOpen },
          { id: 'edit', label: 'Edit chat', icon: FileText },
        ].map(m => {
          const Icon = m.icon;
          return (
            <button key={m.id}
              onClick={() => setMode(m.id as typeof mode)}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition border ${
                mode === m.id
                  ? 'bg-primary text-primary-foreground border-primary glow-primary'
                  : 'border-border bg-secondary/40 text-muted-foreground hover:text-foreground'
              }`}>
              <Icon size={11} /> {m.label}
            </button>
          );
        })}
      </div>

      {/* Controls row */}
      <div className="px-5 pt-3 flex items-center gap-2 shrink-0">
        <label className="text-[10px] font-mono text-muted-foreground uppercase">Pages</label>
        <input
          type="number" min={1} max={200} value={pageCount}
          onChange={(e) => setPageCount(Math.max(1, Math.min(200, parseInt(e.target.value) || 1)))}
          className="w-14 bg-secondary border border-border rounded px-1.5 py-0.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <Quote size={12} className="ml-2 text-muted-foreground" />
        <select
          value={citationStyle}
          onChange={(e) => setCitationStyle(e.target.value as CitationStyle)}
          className="bg-secondary border border-border rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary">
          {(['none','apa','mla','chicago','ieee'] as CitationStyle[]).map(s => (
            <option key={s} value={s}>{citationStyleLabel[s]}</option>
          ))}
        </select>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div key={msg.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm shadow-lg'
                  : 'glass text-foreground/90 rounded-bl-sm border border-border'
              }`}>
                <span className={msg.pending ? 'ai-typing-cursor' : ''}>
                  {msg.content || (msg.pending ? 'Thinking' : '')}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isGenerating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-xs text-primary font-mono">
            <Loader2 size={12} className="animate-spin" />
            <span>{generationLabel || 'Working…'}</span>
          </motion.div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border shrink-0">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
            placeholder={doc.chapters.length === 0
              ? 'Describe the document you want…'
              : 'Ask for changes — e.g. "make chapter 3 shorter and add citations"'}
            rows={2}
            className="w-full bg-secondary/60 border border-border rounded-xl pl-4 pr-12 py-3 text-sm resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 transition"
          />
          <button type="submit" disabled={!input.trim() || isGenerating}
            className="absolute right-2 bottom-2 p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-30 transition">
            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
};
