import React, { useState } from 'react';
import { ChatPanel } from '../components/ChatPanel';
import { DocumentEditor } from '../components/DocumentEditor';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { ExportButton } from '../components/ExportButton';
import { BookOpen, Maximize2, Minimize2 } from 'lucide-react';
import { motion } from 'framer-motion';

const Home = () => {
  const [editorExpanded, setEditorExpanded] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col h-full w-full overflow-hidden bg-white rounded-2xl shadow-2xl border border-zinc-200/50 backdrop-blur-2xl ring-1 ring-black/5"
    >
      {/* Internal Toolbar / Header */}
      <header className="flex-none h-14 border-b border-zinc-100 bg-white/50 flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shadow-sm border border-indigo-200">
            <BookOpen size={18} />
          </div>
          <span className="font-semibold text-zinc-800 tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>Editor Context</span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-zinc-100 text-zinc-500 border border-zinc-200 ml-2 shadow-sm">AI Active</span>
        </div>
        
        <div className="flex items-center gap-4 bg-zinc-50/80 p-1.5 rounded-xl border border-zinc-200/60 shadow-sm">
          <ThemeSwitcher />
          <div className="h-6 w-px bg-zinc-200"></div>
          <ExportButton />
        </div>
      </header>

      {/* Main Split Layout */}
      <main className="flex-1 flex overflow-hidden relative bg-[#FDFDFD]">
        {/* Left Panel: Chat & Instructions */}
        <div 
          className={`flex-shrink-0 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] border-r border-zinc-100 bg-white/80 flex flex-col z-10 shadow-[10px_0_30px_-15px_rgba(0,0,0,0.05)] ${editorExpanded ? 'w-0 opacity-0 pointer-events-none' : 'w-full md:w-[450px] lg:w-[500px]'}`}
        >
          <ChatPanel />
        </div>

        {/* Right Panel: Live Document Editor */}
        <div className="flex-1 bg-[#FAFAFA] overflow-hidden relative flex flex-col">
          <div className="absolute top-4 right-4 z-20">
            <button 
              onClick={() => setEditorExpanded(!editorExpanded)}
              className="p-2 rounded-full bg-white/80 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 backdrop-blur-md border border-zinc-200 transition-all shadow-sm hover:shadow-md"
              title={editorExpanded ? "Show Chat" : "Expand Editor"}
            >
              {editorExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
          <DocumentEditor />
        </div>
      </main>
    </motion.div>
  );
};

export default Home;
