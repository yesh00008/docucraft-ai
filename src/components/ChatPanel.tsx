import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { simulateDocumentGeneration } from '../utils/generationEngine';
import { Send, Terminal, Loader2, StopCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const ChatPanel = () => {
  const { messages, addMessage, addChunk, clearChunks, isGenerating, setGenerating } = useAppStore();
  const [input, setInput] = useState('');
  const [pageCount, setPageCount] = useState<number>(5);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    // Start Generation
    const userMessage = { id: Date.now().toString(), role: 'user' as const, content: input };
    addMessage(userMessage);
    setInput('');
    setGenerating(true);
    clearChunks();

    abortControllerRef.current = new AbortController();

    const assistantMsgId = (Date.now() + 1).toString();
    addMessage({ 
      id: assistantMsgId, 
      role: 'assistant', 
      content: `I'll generate a comprehensive ${pageCount}-page document based on your instructions. Starting the chunked processing engine now...` 
    });

    try {
      const generator = simulateDocumentGeneration(pageCount);
      for await (const chunk of generator) {
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error("Generation aborted by user");
        }
        addChunk(chunk);
      }
      
      addMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: `Generation complete! Generated ${pageCount} pages successfully. You can now use the theme switcher or export to PPTX.`
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      addMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: `Generation stopped: ${errorMessage}`
      });
    } finally {
      setGenerating(false);
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent relative">
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-zinc-600">
          <Terminal size={16} className="text-indigo-500" />
          <span className="text-sm font-bold tracking-wider uppercase">Instruction Panel</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-zinc-500">PAGES:</label>
          <input 
            type="number" 
            min="1" 
            max="200" 
            value={pageCount}
            onChange={(e) => setPageCount(Math.max(1, Math.min(200, parseInt(e.target.value) || 1)))}
            className="w-16 bg-white border border-zinc-200 rounded-md px-2 py-1 text-xs text-zinc-800 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all text-right shadow-sm"
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {messages.map((msg) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed
              ${msg.role === 'user' 
                ? 'bg-indigo-600 text-white shadow-md rounded-tr-sm' 
                : 'bg-white text-zinc-700 border border-zinc-100 shadow-sm rounded-tl-sm'}`}
            >
              {msg.content}
            </div>
          </motion.div>
        ))}
        {isGenerating && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-3 text-zinc-500 text-sm bg-white border border-zinc-100 shadow-sm px-4 py-3 rounded-2xl rounded-tl-sm max-w-[85%]"
          >
            <Loader2 size={16} className="animate-spin text-indigo-500" />
            <span className="font-medium text-xs">Streaming chunks...</span>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-zinc-100 bg-white/50 shrink-0">
        <form onSubmit={handleSubmit} className="relative flex items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Describe the document you want to generate..."
            className="w-full bg-white text-zinc-900 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 border border-zinc-200 resize-none placeholder-zinc-400 text-sm min-h-[50px] max-h-[150px] shadow-sm"
            rows={2}
          />
          <div className="absolute right-2 bottom-2">
            {isGenerating ? (
              <button 
                type="button"
                onClick={stopGeneration}
                className="p-2 text-red-500 hover:text-red-600 transition-colors bg-red-50 rounded-lg"
                title="Stop Generation"
              >
                <StopCircle size={18} />
              </button>
            ) : (
              <button 
                type="submit"
                disabled={!input.trim()}
                className="p-2 text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:hover:bg-indigo-600 rounded-lg shadow-sm"
              >
                <Send size={18} />
              </button>
            )}
          </div>
        </form>
        <div className="mt-2 text-[10px] text-zinc-400 text-center font-medium uppercase tracking-widest">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};
