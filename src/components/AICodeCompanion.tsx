"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  IconSparkles, 
  IconTerminal, 
  IconCpu, 
  IconCheck, 
  IconCopy, 
  IconAlertTriangle,
  IconClock
} from "@tabler/icons-react";

export default function AICodeCompanion({ questionTitle, questionContent }: { questionTitle: string; questionContent: string }) {
  const [analyzing, setAnalyzing] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const [copied, setCopied] = React.useState(false);

  const startAnalysis = () => {
    if (analyzing) return;
    setAnalyzing(true);
    setStep(1);

    setTimeout(() => {
      setStep(2);
    }, 1200);

    setTimeout(() => {
      setStep(3);
    }, 2400);

    setTimeout(() => {
      setStep(4);
      setAnalyzing(false);
    }, 3800);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(mockOptimizedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate dynamic-looking explanations
  const mockExplanation = `Your code is hitting an O(N²) time complexity due to nested iterations. When the array scales to > 10,000 items, execution delays will exceed 500ms, blocking the single main JavaScript threat. 

Our optimized O(N) hash-mapping approach ensures that duplicates are detected in a single iteration by caching checked values in a high-speed Set.`;

  const mockOptimizedCode = `// Optimized O(N) Hash mapping
const checkDuplicates = (dataList) => {
  const cache = new Set();
  
  for (const item of dataList) {
    if (cache.has(item)) {
      return true; // Duplicate found!
    }
    cache.add(item);
  }
  return false;
};`;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      
      {/* Neon glow header background */}
      <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Title */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4 mb-4 justify-between">
        <div className="flex items-center gap-2">
          <IconSparkles className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-white text-sm uppercase tracking-wider font-mono">AI Code Companion</h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          COMPANION ACTIVE
        </span>
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div 
            key="start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <p className="text-xs text-gray-400 leading-relaxed font-sans">
              Need instant algorithmic debugging or complexity audits? Fire up the DevOverflow Code Companion to analyze this query.
            </p>
            <button 
              onClick={startAnalysis}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
            >
              <IconSparkles className="w-4 h-4 animate-pulse" />
              <span>Audit with DevOverflow AI</span>
            </button>
          </motion.div>
        )}

        {step > 0 && step < 4 && (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4 py-4"
          >
            <div className="flex items-center gap-3 border border-white/10 bg-white/5 rounded-lg p-3">
              <div className="w-4 h-4 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <span className="text-xs font-mono text-indigo-400 animate-pulse">
                {step === 1 && "Tokenizing question text..."}
                {step === 2 && "Auditing code block nesting levels..."}
                {step === 3 && "Benchmarking O(N^2) vs O(N) memory sizes..."}
              </span>
            </div>
            
            <div className="space-y-2 font-mono text-[10px] text-gray-500">
              <p className={step >= 1 ? "text-gray-400" : ""}>➜ Fetching Appwrite Document ID...</p>
              <p className={step >= 2 ? "text-gray-400" : ""}>➜ Parsing question elements: "{questionTitle.slice(0, 30)}..."</p>
              <p className={step >= 3 ? "text-gray-400" : ""}>➜ Triggering dynamic refactoring arrays...</p>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div 
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4 font-mono text-xs leading-normal select-none"
          >
            {/* Complexity warnings */}
            <div className="border border-yellow-500/20 bg-yellow-500/10 rounded-lg p-3 text-yellow-400 flex items-start gap-2.5">
              <IconAlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-yellow-400" />
              <div className="space-y-0.5">
                <p className="font-bold">Suboptimal Nesting Found</p>
                <p className="text-[10px] text-yellow-500 leading-normal">Nested iteration will trigger slow runtime on large arrays.</p>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400">
              <div className="border border-white/5 bg-black/40 rounded p-2 flex flex-col">
                <span className="text-gray-500 uppercase tracking-wider font-bold">Complexity</span>
                <span className="text-red-400 font-bold mt-0.5 flex items-center gap-1">O(N²) ➔ O(N)</span>
              </div>
              <div className="border border-white/5 bg-black/40 rounded p-2 flex flex-col">
                <span className="text-gray-500 uppercase tracking-wider font-bold">Est. Speedup</span>
                <span className="text-emerald-400 font-bold mt-0.5 flex items-center gap-1">
                  <IconClock className="w-3.5 h-3.5" /> 12x Faster
                </span>
              </div>
            </div>

            {/* Markdown Advice */}
            <p className="text-gray-400 text-[11px] leading-relaxed font-sans border-t border-white/5 pt-3">
              {mockExplanation}
            </p>

            {/* Optimized Code Block Container */}
            <div className="relative rounded-xl border border-white/5 bg-black/60 p-4 font-mono text-[11px] overflow-x-auto text-emerald-400 max-h-[180px]">
              <button 
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1.5 rounded-md border border-white/10 bg-white/5 text-gray-400 hover:text-white transition-all cursor-pointer"
                title="Copy optimized code"
              >
                {copied ? <IconCheck className="w-3.5 h-3.5 text-emerald-400" /> : <IconCopy className="w-3.5 h-3.5" />}
              </button>
              <pre>{mockOptimizedCode}</pre>
            </div>

            {/* Action buttons */}
            <button 
              onClick={() => setStep(0)}
              className="w-full h-8 text-center text-xs text-gray-500 hover:text-white transition-all border border-white/10 rounded-lg hover:bg-white/5 cursor-pointer font-sans"
            >
              Reset AI Companion
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
