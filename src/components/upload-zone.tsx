// components/upload-zone.tsx
"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Loader2,
  AlertCircle,
  FileText,
  Trash2,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onAnalysisComplete: (data: any) => void;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB limit to match API guardrail

const readableSize = (bytes: number) =>
  `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

export function UploadZone({ onAnalysisComplete }: UploadZoneProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelection = useCallback((file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(
        `File is too large (${readableSize(
          file.size
        )}). Please keep it under ${readableSize(MAX_FILE_SIZE_BYTES)}.`
      );
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    setError(null);
  }, []);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      handleFileSelection(acceptedFiles[0]);
    },
    [handleFileSelection]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError("Please choose a PDF or image to analyze.");
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const msg =
          data?.error ||
          data?.message ||
          "Failed to analyze file. Please check the server logs.";
        throw new Error(msg);
      }

      onAnalysisComplete(data);
      setSelectedFile(null);
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-5">
      <div
        {...getRootProps()}
        className={cn(
          "relative overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-300 ease-in-out cursor-pointer group",
          isDragActive
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border hover:border-primary/50 hover:bg-muted/50",
          isUploading && "pointer-events-none opacity-50"
        )}
      >
        <input {...getInputProps()} />

        <div className="p-12 flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
          <div className="relative">
            <div
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center transition-colors duration-300",
                isDragActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
              )}
            >
              {isUploading ? (
                <Loader2 className="w-10 h-10 animate-spin" />
              ) : (
                <Upload className="w-10 h-10" />
              )}
            </div>
            {isDragActive && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute -inset-4 rounded-full border-2 border-primary/30 animate-ping"
              />
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold tracking-tight">
              {isUploading
                ? "Analyzing content..."
                : selectedFile
                ? "File ready to analyze"
                : isDragActive
                ? "Drop it here!"
                : "Upload your content"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {isUploading
                ? "Our AI is reading your document to provide engagement insights."
                : selectedFile
                ? `${selectedFile.name} (${readableSize(selectedFile.size)})`
                : "Drag & drop a PDF or Image, or click to select."}
            </p>
          </div>
        </div>

        {/* Decorative background gradients */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      <AnimatePresence initial={false}>
        {selectedFile && !isUploading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl border bg-card/70 p-4 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-3 text-sm">
              <div className="rounded-full bg-primary/10 text-primary p-2">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-muted-foreground">
                  {selectedFile.type || "Unknown type"} ·{" "}
                  {readableSize(selectedFile.size)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleAnalyze}
                disabled={isUploading}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  isUploading
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:opacity-90"
                )}
              >
                {isUploading ? "Analyzing…" : "Analyze this file"}
              </button>
              <button
                onClick={() => setSelectedFile(null)}
                disabled={isUploading}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium border border-border flex items-center gap-2 transition-colors",
                  isUploading
                    ? "text-muted-foreground cursor-not-allowed"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-start gap-2 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
        <Info className="w-4 h-4 mt-0.5" />
        <p>
          Supported types: PDF, PNG, JPG, JPEG, WEBP up to{" "}
          {readableSize(MAX_FILE_SIZE_BYTES)}. We only keep files in memory while
          analyzing them.
        </p>
      </div>

      <AnimatePresence initial={false}>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-destructive/10 text-destructive flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
