import React, { useEffect, useRef } from 'react';
import { useAppStore, THEMES } from '../store/useAppStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';

export const DocumentEditor = () => {
  const { chunks, activeThemeId } = useAppStore();
  const activeTheme = THEMES.find((t) => t.id === activeThemeId) || THEMES[0];
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new chunks arrive
  useEffect(() => {
    if (containerRef.current) {
      const { scrollHeight, clientHeight } = containerRef.current;
      containerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth'
      });
    }
  }, [chunks]);

  if (chunks.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 h-full p-8 text-center bg-[#0F0F0F]">
        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-zinc-400 mb-2">No Document Generated Yet</h3>
        <p className="text-sm max-w-md">
          Use the instruction panel on the left to start generating a document. The content will stream in real-time.
        </p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 scroll-smooth bg-[#0A0A0A]"
    >
      <div className="max-w-4xl mx-auto">
        <AnimatePresence>
          {chunks.map((chunk, index) => (
            <motion.div
              key={chunk.id}
              initial={{ opacity: 0, y: 50, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 100, 
                damping: 20, 
                delay: 0.1 
              }}
              className="mb-8 md:mb-12 shadow-[0_10px_40px_rgba(0,0,0,0.5)] rounded-sm overflow-hidden"
            >
              {/* "Page" Container */}
              <div 
                className="w-full transition-colors duration-500 ease-in-out p-8 md:p-12 min-h-[500px]"
                style={{ 
                  backgroundColor: activeTheme.bgColor,
                  color: activeTheme.textColor,
                }}
              >
                <header className="mb-8 pb-4 border-b border-black/10 flex justify-between items-end">
                  <h2 
                    className="text-3xl md:text-4xl font-bold leading-tight"
                    style={{ fontFamily: activeTheme.fontFamilyHeading }}
                  >
                    {chunk.sectionTitle}
                  </h2>
                  <span className="text-sm font-mono opacity-40">Page {index + 1}</span>
                </header>

                <div 
                  className="prose prose-lg max-w-none prose-headings:font-bold prose-a:text-blue-600 prose-img:rounded-xl"
                  style={{ 
                    fontFamily: activeTheme.fontFamilyBody,
                    color: activeTheme.textColor,
                  }}
                >
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({node, ...props}) => <h1 style={{ fontFamily: activeTheme.fontFamilyHeading, color: activeTheme.textColor }} {...props} />,
                      h2: ({node, ...props}) => <h2 style={{ fontFamily: activeTheme.fontFamilyHeading, color: activeTheme.textColor }} {...props} />,
                      h3: ({node, ...props}) => <h3 style={{ fontFamily: activeTheme.fontFamilyHeading, color: activeTheme.textColor }} {...props} />,
                      p: ({node, ...props}) => <p style={{ color: activeTheme.textColor, opacity: 0.9 }} {...props} />,
                      li: ({node, ...props}) => <li style={{ color: activeTheme.textColor, opacity: 0.9 }} {...props} />,
                      strong: ({node, ...props}) => <strong style={{ color: activeTheme.textColor }} {...props} />,
                      blockquote: ({node, ...props}) => (
                        <blockquote 
                          style={{ 
                            borderLeftColor: activeTheme.textColor, 
                            opacity: 0.8,
                            backgroundColor: 'rgba(0,0,0,0.03)',
                            padding: '1rem'
                          }} 
                          {...props} 
                        />
                      ),
                    }}
                  >
                    {chunk.content}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
