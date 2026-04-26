import React, { useState } from 'react';
import { ChatPanel } from './components/ChatPanel';
import { DocumentEditor } from './components/DocumentEditor';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { ExportButton } from './components/ExportButton';
import { BookOpen, Maximize2, Minimize2 } from 'lucide-react';

function App() {
  const [editorExpanded, setEditorExpanded] = useState(false);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0A0A0A] text-zinc-300 font-sans antialiased selection:bg-[#D4FF00] selection:text-black">
      {/* Top Navbar */}
      <header className="flex-none h-14 border-b border-zinc-800 bg-[#0F0F0F] flex items-center justify-between px-6 z-10 shadow-sm relative">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#D4FF00] flex items-center justify-center text-black font-bold shadow-[0_0_15px_rgba(212,255,0,0.4)]">
            <BookOpen size={18} />
          </div>
          <span className="font-bold text-lg tracking-tight text-white uppercase" style={{ fontFamily: 'Outfit, sans-serif' }}>DocuGen Pro</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700 ml-2">v2.0 Beta</span>
        </div>
        
        <div className="flex items-center gap-4">
          <ThemeSwitcher />
          <div className="h-6 w-px bg-zinc-800"></div>
          <ExportButton />
        </div>
      </header>

      {/* Main Split Layout */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Panel: Chat & Instructions */}
        <div 
          className={`flex-shrink-0 transition-all duration-500 ease-in-out border-r border-zinc-800 bg-[#0F0F0F] flex flex-col z-10 shadow-[5px_0_20px_rgba(0,0,0,0.5)] ${editorExpanded ? 'w-0 opacity-0 pointer-events-none' : 'w-full md:w-[400px] lg:w-[450px]'}`}
        >
          <ChatPanel />
        </div>

        {/* Right Panel: Live Document Editor */}
        <div className="flex-1 bg-zinc-900 overflow-hidden relative flex flex-col">
          <div className="absolute top-4 right-4 z-20">
            <button 
              onClick={() => setEditorExpanded(!editorExpanded)}
              className="p-2 rounded-full bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700 backdrop-blur border border-zinc-700 transition-colors shadow-lg"
              title={editorExpanded ? "Show Chat" : "Expand Editor"}
            >
              {editorExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
          <DocumentEditor />
        </div>
      </main>
    </div>
  );
}

export default App;
