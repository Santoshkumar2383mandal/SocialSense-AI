"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AnalysisResultProps {
  data: {
    text: string;
    analysis: {
      summary: string;
      score: number;
      suggestions: string[];
      trendingIdeas: string[];
      hashtags: string[];
    };
  };
  onReset: () => void;
}

export function AnalysisResult({ data, onReset }: AnalysisResultProps) {
  const [copied, setCopied] = useState(false);

  const copyText = () => {
    navigator.clipboard.writeText(data.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto space-y-8"
    >
      <div className="grid gap-6 md:grid-cols-2">
        {/* Score Card */}
        <div className="p-6 rounded-3xl border bg-card shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-semibold text-lg">Engagement Score</h3>
            <span className={cn("text-4xl font-bold", getScoreColor(data.analysis.score))}>
              {Math.round(data.analysis.score)}
            </span>
          </div>
          <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.analysis.score}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={cn("h-full", 
                data.analysis.score >= 80 ? "bg-green-500" : 
                data.analysis.score >= 50 ? "bg-yellow-500" : "bg-red-500"
              )}
            />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            AI-predicted potential for likes and comments.
          </p>
        </div>

        {/* Summary Card */}
        <div className="p-6 rounded-3xl border bg-card shadow-sm">
          <h3 className="font-semibold text-lg mb-4">Content Summary</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {data.analysis.summary}
          </p>
        </div>
      </div>

      {/* Trending Ideas */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Trending Ideas</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {data.analysis.trendingIdeas.map((idea, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-2xl border bg-primary/5 border-primary/10"
            >
              <p className="text-sm font-medium text-primary">{idea}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Improvements</h3>
        <div className="grid gap-4">
          {data.analysis.suggestions.map((suggestion, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-2xl border bg-card flex items-start gap-3"
            >
              <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-sm">{suggestion}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Hashtags */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Recommended Hashtags</h3>
        <div className="flex flex-wrap gap-2">
          {data.analysis.hashtags.map((tag, index) => (
            <span key={index} className="px-3 py-1 rounded-full bg-muted text-sm text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Extracted Text */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Extracted Content</h3>
          <button
            onClick={copyText}
            className="text-sm flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy Text"}
          </button>
        </div>
        <div className="p-6 rounded-3xl border bg-muted/30 font-mono text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto">
          {data.text}
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <button
          onClick={onReset}
          className="px-8 py-3 rounded-full bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
        >
          Analyze Another File
        </button>
      </div>
    </motion.div>
  );
}
