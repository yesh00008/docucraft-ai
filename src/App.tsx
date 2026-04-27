import { useState } from 'react';
import { ChatPanel } from './components/ChatPanel';
import { DocumentEditor } from './components/DocumentEditor';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { ExportButton } from './components/ExportButton';
import { HistoryPanel } from './components/HistoryPanel';
import { SourcesPanel } from './components/SourcesPanel';
import { DiffModal } from './components/DiffModal';
import { BookOpen, Maximize2, Minimize2, PanelRightClose, PanelRight } from 'lucide-react';

export default function App() {
  const [editorExpanded, setEditorExpanded] = useState(false);
  const [sideOpen, setSideOpen] = useState(true);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Top Navbar */}
      <header className="flex-none h-14 glass border-b border-border flex items-center justify-between px-5 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground glow-primary">
            <BookOpen size={18} />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight gradient-text">DocuGen Pro</div>
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-mono">Chat-driven · v3</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <div className="h-6 w-px bg-border" />
          <ExportButton />
          <button onClick={() => setSideOpen(!sideOpen)}
            className="p-2 rounded-lg hover:bg-secondary transition" title={sideOpen ? 'Hide side panel' : 'Show side panel'}>
            {sideOpen ? <PanelRightClose size={16} /> : <PanelRight size={16} />}
          </button>
        </div>
      </header>

      {/* Main 3-pane */}
      <main className="flex-1 flex overflow-hidden">
        {/* Chat */}
        <aside className={`shrink-0 transition-[width] duration-300 ease-in-out border-r border-border flex flex-col z-10 ${
          editorExpanded ? 'w-0 overflow-hidden' : 'w-full md:w-[400px] lg:w-[440px]'
        }`}>
          <ChatPanel />
        </aside>

        {/* Document */}
        <section className="flex-1 relative flex flex-col">
          <div className="absolute top-3 right-3 z-10">
            <button onClick={() => setEditorExpanded(!editorExpanded)}
              className="p-2 rounded-lg glass border border-border hover:border-primary/50 transition"
              title={editorExpanded ? 'Show chat' : 'Expand'}>
              {editorExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
          <DocumentEditor />
        </section>

        {/* Side panel: history + sources */}
        {sideOpen && !editorExpanded && (
          <aside className="hidden lg:flex shrink-0 w-72 border-l border-border flex-col gap-3 p-3 overflow-y-auto">
            <HistoryPanel />
            <SourcesPanel />
          </aside>
        )}
      </main>

      <DiffModal />
    </div>
  );
}
