import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Code, Zap, FileOutput } from 'lucide-react';

const AboutUs = () => {
  return (
    <div className="flex-1 w-full max-w-5xl mx-auto py-12 px-4 relative">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xl mx-auto mb-6">
          <BookOpen size={32} />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-zinc-900 tracking-tight mb-4">
          Where Intelligence Meets <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Creation</span>
        </h1>
        <p className="text-xl text-zinc-600 max-w-2xl mx-auto leading-relaxed">
          DocuGen AI is a next-generation document engine designed to transform your ideas into polished, 200-page presentations in seconds.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-white shadow-xl shadow-zinc-200/20"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6">
            <Zap size={24} />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 mb-3">Lightning Fast</h3>
          <p className="text-zinc-600 leading-relaxed">
            Our streaming architecture means you never have to wait. Watch as your documents are generated in real-time, right before your eyes.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-white shadow-xl shadow-zinc-200/20"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 mb-6">
            <Code size={24} />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 mb-3">Beautiful Typography</h3>
          <p className="text-zinc-600 leading-relaxed">
            Choose from curated themes like Classic Serif, Modern Minimal, and Typewriter. Your documents will look stunning by default.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-white shadow-xl shadow-zinc-200/20"
        >
          <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600 mb-6">
            <FileOutput size={24} />
          </div>
          <h3 className="text-xl font-bold text-zinc-900 mb-3">Export to PPTX</h3>
          <p className="text-zinc-600 leading-relaxed">
            Take your work anywhere. With one click, convert your entire generated document into a fully formatted PowerPoint presentation.
          </p>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-20 text-center"
      >
        <p className="text-zinc-500 font-medium">Inspired by yesz.in & modern AI editor aesthetics.</p>
        <p className="text-zinc-400 text-sm mt-2">© {new Date().getFullYear()} DocuGen AI. All rights reserved.</p>
      </motion.div>
    </div>
  );
};

export default AboutUs;
