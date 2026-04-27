import { History, GitCompare, RotateCcw, Camera } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const HistoryPanel = () => {
  const { snapshots, openDiff, restoreSnapshot, takeSnapshot, doc } = useAppStore();
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
          <History size={14} className="text-primary" /> Versions
        </div>
        <button
          onClick={() => takeSnapshot(`Manual · ${doc.chapters.length} ch`)}
          className="text-xs px-2 py-1 rounded bg-secondary hover:bg-muted transition flex items-center gap-1"
          title="Save current state"
        >
          <Camera size={12} /> Snapshot
        </button>
      </div>
      <div className="max-h-64 overflow-auto space-y-1.5">
        {snapshots.length === 0 && (
          <div className="text-xs text-muted-foreground italic">No snapshots yet. Edits auto-snapshot.</div>
        )}
        {snapshots.map(s => (
          <div key={s.id} className="group flex items-center justify-between gap-2 p-2 rounded-lg bg-secondary/40 hover:bg-secondary transition">
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium truncate">{s.label}</div>
              <div className="text-[10px] text-muted-foreground font-mono">
                {new Date(s.at).toLocaleTimeString()} · {s.doc.chapters.length} ch
              </div>
            </div>
            <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition">
              <button onClick={() => openDiff(s.id)} className="p-1.5 rounded hover:bg-primary/20 hover:text-primary transition" title="Compare">
                <GitCompare size={13} />
              </button>
              <button onClick={() => restoreSnapshot(s.id)} className="p-1.5 rounded hover:bg-accent/20 hover:text-accent transition" title="Restore">
                <RotateCcw size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
