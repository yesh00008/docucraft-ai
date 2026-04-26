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
        className="flex items-center gap-2 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors border border-zinc-700 hover:border-zinc-600 shadow-sm"
      >
        <Palette size={14} className="text-[#D4FF00]" />
        <span className="text-sm font-medium">{activeTheme.name}</span>
        <ChevronDown size={14} className="text-zinc-500" />
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
              className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden z-50 py-1"
            >
              <div className="px-3 py-2 text-xs font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-800 mb-1">
                Typography Theme
              </div>
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    setActiveTheme(theme.id);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-zinc-800 transition-colors text-left"
                >
                  <div>
                    <div className={`text-sm font-medium ${activeThemeId === theme.id ? 'text-[#D4FF00]' : 'text-zinc-200'}`}>
                      {theme.name}
                    </div>
                    <div 
                      className="text-xs text-zinc-500 mt-0.5" 
                      style={{ fontFamily: theme.fontFamilyHeading }}
                    >
                      Aa Bb Cc Dd
                    </div>
                  </div>
                  {activeThemeId === theme.id && <Check size={16} className="text-[#D4FF00]" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
