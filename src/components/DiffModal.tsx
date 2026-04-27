import { diffLines } from 'diff';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, docToPlain } from '../store/useAppStore';

export const DiffModal = () => {
  const { diffOpen, diffWith, snapshots, doc, closeDiff, restoreSnapshot } = useAppStore();
  if (!diffOpen || !diffWith) return null;
  const snap = snapshots.find(s => s.id === diffWith);
  if (!snap) return null;

  const before = docToPlain(snap.doc);
  const after = docToPlain(doc);
  const parts = diffLines(before, after);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
        onClick={closeDiff}
      >
        <motion.div
          initial={{ scale: 0.96, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 20 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          onClick={(e) => e.stopPropagation()}
          className="glass rounded-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden glow-primary"
        >
          <header className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              <h2 className="text-lg font-bold gradient-text">Compare with snapshot</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {snap.label} · {new Date(snap.at).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { restoreSnapshot(snap.id); closeDiff(); }}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition"
              >
                Restore this version
              </button>
              <button onClick={closeDiff} className="p-2 rounded-lg hover:bg-secondary transition">
                <X size={18} />
              </button>
            </div>
          </header>

          <div className="grid grid-cols-2 flex-1 overflow-hidden">
            <div className="overflow-auto p-6 border-r border-border">
              <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Snapshot</div>
              <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap">
                {parts.map((p, i) =>
                  p.added ? null : (
                    <span key={i} className={p.removed ? 'bg-red-500/15 text-red-300 block' : 'text-foreground/80'}>
                      {p.value}
                    </span>
                  )
                )}
              </pre>
            </div>
            <div className="overflow-auto p-6">
              <div className="text-xs font-mono uppercase tracking-wider text-primary mb-3">Current</div>
              <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap">
                {parts.map((p, i) =>
                  p.removed ? null : (
                    <span key={i} className={p.added ? 'bg-primary/15 text-primary block' : 'text-foreground/80'}>
                      {p.value}
                    </span>
                  )
                )}
              </pre>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
