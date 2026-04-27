import { useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { themeById } from '../lib/themes';
import { formatReference } from '../lib/citations';

export const DocumentEditor = () => {
  const { doc, themeId, citationStyle, sources, isGenerating, setTitle } = useAppStore();
  const theme = themeById(themeId);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll while streaming
  useEffect(() => {
    if (!isGenerating || !containerRef.current) return;
    const el = containerRef.current;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [doc.chapters.length, isGenerating]);

  const totalWords = useMemo(
    () => doc.chapters.reduce((n, c) => n + (c.content || c.synopsis || '').split(/\s+/).filter(Boolean).length, 0),
    [doc.chapters],
  );
  const estPages = Math.max(1, Math.round(totalWords / 350));

  if (doc.chapters.length === 0 && !doc.title) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-3xl p-10 max-w-md anim-float">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 mx-auto mb-5 flex items-center justify-center text-2xl glow-primary">
            ✦
          </div>
          <h3 className="text-xl font-bold mb-2 gradient-text">Your document will appear here</h3>
          <p className="text-sm text-muted-foreground">
            Describe what you need in the chat — a 5-page brief or a 200-page handbook. Pick a theme, a citation style, and let the AI write it.
          </p>
        </motion.div>
      </div>
    );
  }

  const pageStyle: React.CSSProperties = {
    backgroundColor: theme.bg,
    color: theme.text,
    fontFamily: theme.fontBody,
    border: theme.showBorderFrame ? theme.border : undefined,
    padding: theme.pagePadding ?? '3rem 2.5rem',
  };

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
      {/* Stats bar */}
      <div className="max-w-4xl mx-auto mb-4 flex items-center justify-between text-xs font-mono text-muted-foreground">
        <span>{doc.chapters.length} chapters · {totalWords.toLocaleString()} words · ~{estPages} pages</span>
        <span className="text-primary">{theme.name}</span>
      </div>

      {/* Title */}
      <div className="max-w-4xl mx-auto mb-6">
        <input
          value={doc.title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled document"
          className="w-full bg-transparent text-3xl md:text-4xl font-bold gradient-text border-b border-border/40 focus:outline-none focus:border-primary py-2 transition"
        />
      </div>

      {/* Chapters */}
      <div className="max-w-4xl mx-auto space-y-6">
        <AnimatePresence initial={false}>
          {doc.chapters.map((c, i) => (
            <motion.article
              key={c.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 22, delay: 0.04 }}
              className="rounded-xl shadow-elevated overflow-hidden"
              style={{ boxShadow: '0 20px 60px -20px rgba(0,0,0,0.7)' }}
            >
              <div style={pageStyle}>
                <header className="mb-6 flex items-baseline justify-between gap-4 border-b" style={{ borderColor: 'currentColor', opacity: 1, borderBottomWidth: 1, borderBottomColor: theme.muted, paddingBottom: 12 }}>
                  <h2 style={{ fontFamily: theme.fontHeading, color: theme.text }} className="text-2xl md:text-3xl font-bold leading-tight">
                    {i + 1}. {c.heading}
                  </h2>
                  <span style={{ color: theme.muted }} className="text-xs font-mono shrink-0">
                    {c.status === 'streaming' && <span className="ai-typing-cursor">writing</span>}
                    {c.status === 'pending' && 'queued'}
                    {c.status === 'done' && `Page ${i + 1}`}
                  </span>
                </header>
                {c.status === 'pending' && (
                  <div className="space-y-2">
                    <div className="h-3 shimmer rounded w-3/4" />
                    <div className="h-3 shimmer rounded w-5/6" />
                    <div className="h-3 shimmer rounded w-2/3" />
                  </div>
                )}
                {c.status !== 'pending' && (
                  <div style={{ fontFamily: theme.fontBody, color: theme.text }} className="text-base md:text-[1.05rem] leading-[1.75] whitespace-pre-wrap">
                    {c.content || c.synopsis}
                    {c.status === 'streaming' && <span className="ai-typing-cursor" />}
                  </div>
                )}
              </div>
            </motion.article>
          ))}
        </AnimatePresence>

        {/* References block when applicable */}
        {citationStyle !== 'none' && sources.length > 0 && (
          <motion.article
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl shadow-elevated overflow-hidden"
          >
            <div style={pageStyle}>
              <h2 style={{ fontFamily: theme.fontHeading, color: theme.text }} className="text-2xl font-bold mb-4">References</h2>
              <ol className="space-y-2 text-sm" style={{ color: theme.text }}>
                {sources.map((s, i) => (
                  <li key={s.id} className="flex gap-2">
                    <span style={{ color: theme.muted }} className="font-mono">{i + 1}.</span>
                    <span>{formatReference(s, citationStyle)}</span>
                  </li>
                ))}
              </ol>
            </div>
          </motion.article>
        )}
      </div>
    </div>
  );
};
