import React, { useState } from 'react';
import { useAppStore, THEMES } from '../store/useAppStore';
import { exportToPPTX } from '../utils/pptxExport';
import { FileOutput, Loader2 } from 'lucide-react';

export const ExportButton = () => {
  const { chunks, activeThemeId } = useAppStore();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (chunks.length === 0) return;
    
    setIsExporting(true);
    try {
      const activeTheme = THEMES.find((t) => t.id === activeThemeId) || THEMES[0];
      await exportToPPTX(chunks, activeTheme);
    } catch (error) {
      console.error('Failed to export PPTX:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={chunks.length === 0 || isExporting}
      className={`flex items-center gap-2 px-4 py-1.5 rounded font-bold text-sm tracking-wide transition-all shadow-[0_0_10px_rgba(212,255,0,0)]
        ${chunks.length === 0 
          ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
          : 'bg-[#D4FF00] text-black hover:bg-[#bce600] hover:shadow-[0_0_15px_rgba(212,255,0,0.5)]'
        }`}
    >
      {isExporting ? <Loader2 size={16} className="animate-spin" /> : <FileOutput size={16} />}
      EXPORT PPTX
    </button>
  );
};
