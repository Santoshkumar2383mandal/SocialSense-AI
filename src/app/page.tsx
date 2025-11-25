"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { AnalysisResult } from "@/components/analysis-result";
import { Sparkles } from "lucide-react";

const UploadZone = dynamic(
  () =>
    import("@/components/upload-zone").then((mod) => mod.UploadZone),
  {
    ssr: false,
    loading: () => (
      <div className="w-full max-w-xl mx-auto rounded-3xl border-2 border-dashed border-border/80 bg-muted/40 p-16 text-center text-muted-foreground animate-pulse">
        Preparing uploader…
      </div>
    ),
  }
);

export default function Home() {
  const [analysisData, setAnalysisData] = useState<any>(null);

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <div className="container mx-auto px-4 py-20 md:py-32 max-w-5xl">
        {/* Header / Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Content Analysis</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Optimize Your Social Media Content
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Upload your drafts (PDFs or Images) and get instant feedback on engagement potential, readability, and improvements.
          </p>
        </motion.div>

        {/* Main Interaction Area */}
        <div className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            {!analysisData ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                className="w-full"
              >
                <UploadZone onAnalysisComplete={setAnalysisData} />
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full"
              >
                <AnalysisResult 
                  data={analysisData} 
                  onReset={() => setAnalysisData(null)} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border/40 mt-20">
        <p>© 2024 Content Analyzer. Built with Next.js & AI.</p>
      </footer>
    </main>
  );
}
