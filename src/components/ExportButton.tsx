import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileOutput, FileText, FileType, Presentation, Loader2, ChevronDown } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { themeById } from '../lib/themes';
import { exportPDF, exportDOCX, exportPPTXFromChapters } from '../lib/exporters';

export const ExportButton = () => {
  const { doc, themeId, sources, citationStyle } = useAppStore();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const disabled = doc.chapters.length === 0;
  const theme = themeById(themeId);
  const baseName = (doc.title || 'document').replace(/[^a-z0-9]+/gi, '_').slice(0, 60) || 'document';

  const wrap = (kind: 'pdf' | 'docx' | 'pptx', fn: () => Promise<void>) => async () => {
    setBusy(kind); setOpen(false);
    try { await fn(); } catch (e) { console.error(e); alert(`Export failed: ${e instanceof Error ? e.message : e}`); }
    finally { setBusy(null); }
  };

  return (
    <div className="relative">
      <button
        disabled={disabled || !!busy}
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition ${
          disabled
            ? 'bg-secondary text-muted-foreground cursor-not-allowed'
            : 'bg-primary text-primary-foreground hover:opacity-90 glow-primary'
        }`}>
        {busy ? <Loader2 size={14} className="animate-spin" /> : <FileOutput size={14} />}
        EXPORT
        <ChevronDown size={12} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }} transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-56 glass rounded-xl shadow-2xl overflow-hidden z-50 border border-border">
              <button
                onClick={wrap('pdf', () => exportPDF(doc.title || 'Document', doc.chapters, theme, sources, citationStyle, `${baseName}.pdf`))}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary transition text-left text-sm">
                <FileText size={16} className="text-red-400" />
                <div>
                  <div className="font-medium">PDF</div>
                  <div className="text-[11px] text-muted-foreground">TOC + page numbers</div>
                </div>
              </button>
              <button
                onClick={wrap('docx', () => exportDOCX(doc.title || 'Document', doc.chapters, theme, sources, citationStyle, `${baseName}.docx`))}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary transition text-left text-sm">
                <FileType size={16} className="text-blue-400" />
                <div>
                  <div className="font-medium">DOCX</div>
                  <div className="text-[11px] text-muted-foreground">TOC + footer page numbers</div>
                </div>
              </button>
              <button
                onClick={wrap('pptx', () => exportPPTXFromChapters(doc.title || 'Document', doc.chapters, theme, `${baseName}.pptx`))}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary transition text-left text-sm">
                <Presentation size={16} className="text-orange-400" />
                <div>
                  <div className="font-medium">PPTX from chapters</div>
                  <div className="text-[11px] text-muted-foreground">One slide per chapter</div>
                </div>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
