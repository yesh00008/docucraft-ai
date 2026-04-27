import React, { useState } from 'react';
import { useAppStore, THEMES } from '../store/useAppStore';
import { Palette, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ThemeSwitcher = () => {
  const { activeThemeId, setActiveTheme } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);

  const activeTheme = THEMES.find((t) => t.id === activeThemeId) || THEMES[0];

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-50 text-zinc-700 transition-colors border border-zinc-200 shadow-sm"
      >
        <Palette size={14} className="text-indigo-500" />
        <span className="text-sm font-medium">{activeTheme.name}</span>
        <ChevronDown size={14} className="text-zinc-400" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-56 bg-white border border-zinc-100 rounded-xl shadow-xl overflow-hidden z-50 py-1"
            >
              <div className="px-3 py-2 text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-50 mb-1">
                Typography Theme
              </div>
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    setActiveTheme(theme.id);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-zinc-50 transition-colors text-left"
                >
                  <div>
                    <div className={`text-sm font-medium ${activeThemeId === theme.id ? 'text-indigo-600' : 'text-zinc-700'}`}>
                      {theme.name}
                    </div>
                    <div 
                      className="text-xs text-zinc-400 mt-0.5" 
                      style={{ fontFamily: theme.fontFamilyHeading }}
                    >
                      Aa Bb Cc Dd
                    </div>
                  </div>
                  {activeThemeId === theme.id && <Check size={16} className="text-indigo-500" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
