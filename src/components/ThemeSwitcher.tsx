import { useState } from 'react';
import { Palette, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { THEMES, themeById } from '../lib/themes';

export const ThemeSwitcher = () => {
  const { themeId, setThemeId } = useAppStore();
  const [open, setOpen] = useState(false);
  const active = themeById(themeId);

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass border border-border hover:border-primary/50 text-sm transition">
        <Palette size={14} className="text-primary" />
        <span className="font-medium">{active.name}</span>
        <ChevronDown size={14} className="text-muted-foreground" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }} transition={{ duration: 0.18 }}
              className="absolute right-0 mt-2 w-72 glass rounded-xl shadow-2xl overflow-hidden z-50 border border-border">
              <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">
                Document Theme
              </div>
              <div className="max-h-96 overflow-auto py-1">
                {THEMES.map(t => (
                  <button key={t.id}
                    onClick={() => { setThemeId(t.id); setOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary transition text-left">
                    <div className="w-10 h-10 rounded-md shrink-0 border border-border" style={{
                      background: t.bg,
                      borderColor: t.showBorderFrame ? t.accent : 'hsl(var(--border))',
                      borderWidth: t.showBorderFrame ? 2 : 1,
                    }}>
                      <div style={{ color: t.text, fontFamily: t.fontHeading }} className="w-full h-full flex items-center justify-center text-xs font-bold">Aa</div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`text-sm font-medium ${themeId === t.id ? 'text-primary' : ''}`}>{t.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{t.description}</div>
                    </div>
                    {themeId === t.id && <Check size={14} className="text-primary shrink-0" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
