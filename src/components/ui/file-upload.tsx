"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, File } from "lucide-react";

interface FileUploadProps {
  onUpload?: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
}

export function FileUpload({ onUpload, accept = "*", maxSizeMB = 10 }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    if (f.size > maxSizeMB * 1024 * 1024) return;
    setFile(f);
    onUpload?.(f);
  }

  return (
    <div
      className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
        dragOver ? "border-foreground bg-secondary/50" : "border-border hover:border-foreground/30"
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      {file ? (
        <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
          <div className="flex items-center gap-2">
            <File className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{file.name}</span>
          </div>
          <button onClick={() => setFile(null)}><X className="h-4 w-4" /></button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} className="cursor-pointer">
          <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">Drop file here or click to upload</p>
          <p className="text-xs text-muted-foreground mt-1">Max {maxSizeMB}MB</p>
        </button>
      )}
    </div>
  );
}
