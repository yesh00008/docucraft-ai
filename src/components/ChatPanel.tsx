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
    <div className="flex-1 flex flex-col h-full bg-[#0A0A0A] relative">
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-zinc-400">
          <Terminal size={16} />
          <span className="text-sm font-bold tracking-wider uppercase">Instruction Panel</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-mono text-zinc-500">PAGES:</label>
          <input 
            type="number" 
            min="1" 
            max="200" 
            value={pageCount}
            onChange={(e) => setPageCount(Math.max(1, Math.min(200, parseInt(e.target.value) || 1)))}
            className="w-16 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#D4FF00] transition-colors text-right"
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
            <div className={`max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed
              ${msg.role === 'user' 
                ? 'bg-zinc-800 text-white shadow-md' 
                : 'bg-transparent text-zinc-300 border-l-2 border-[#D4FF00] pl-4 rounded-none'}`}
            >
              {msg.content}
            </div>
          </motion.div>
        ))}
        {isGenerating && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-3 text-zinc-500 text-sm border-l-2 border-[#D4FF00] pl-4"
          >
            <Loader2 size={16} className="animate-spin text-[#D4FF00]" />
            <span className="font-mono text-xs">Streaming chunks...</span>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-zinc-800 bg-[#0F0F0F] shrink-0">
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
            className="w-full bg-zinc-900 text-white rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:ring-1 focus:ring-[#D4FF00] border border-zinc-700 resize-none placeholder-zinc-600 text-sm min-h-[50px] max-h-[150px]"
            rows={2}
          />
          <div className="absolute right-2 bottom-2">
            {isGenerating ? (
              <button 
                type="button"
                onClick={stopGeneration}
                className="p-2 text-red-500 hover:text-red-400 transition-colors"
                title="Stop Generation"
              >
                <StopCircle size={20} />
              </button>
            ) : (
              <button 
                type="submit"
                disabled={!input.trim()}
                className="p-2 text-zinc-400 hover:text-[#D4FF00] transition-colors disabled:opacity-50 disabled:hover:text-zinc-400"
              >
                <Send size={18} />
              </button>
            )}
          </div>
        </form>
        <div className="mt-2 text-[10px] text-zinc-600 text-center font-mono uppercase tracking-widest">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};
