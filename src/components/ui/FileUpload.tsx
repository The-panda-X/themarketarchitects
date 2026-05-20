'use client';

import { useState, useRef, useCallback, type ChangeEvent, type DragEvent } from 'react';
import { Upload, X, FileIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  label?: string;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  onFilesSelected: (files: File[]) => void;
  error?: string;
  hint?: string;
  className?: string;
}

export default function FileUpload({
  label,
  accept,
  multiple = false,
  maxSizeMB = 10,
  onFilesSelected,
  error,
  hint,
  className,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFiles = useCallback(
    (files: File[]): File[] => {
      const maxBytes = maxSizeMB * 1024 * 1024;
      const valid: File[] = [];

      for (const file of files) {
        if (file.size > maxBytes) {
          setFileError(`${file.name} exceeds ${maxSizeMB}MB limit`);
          continue;
        }
        valid.push(file);
      }

      return valid;
    },
    [maxSizeMB]
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      setFileError(null);
      const valid = validateFiles(Array.from(files));
      if (valid.length > 0) {
        setSelectedFiles(multiple ? [...selectedFiles, ...valid] : valid);
        onFilesSelected(valid);
      }
    },
    [validateFiles, multiple, selectedFiles, onFilesSelected]
  );

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    const updated = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updated);
    onFilesSelected(updated);
  };

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          {label}
        </label>
      )}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-2 px-6 py-8 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200',
          dragActive
            ? 'border-accent-primary bg-accent-primary/5'
            : 'border-[rgba(230,57,70,0.30)] bg-white/[0.02] hover:border-[rgba(230,57,70,0.55)] hover:bg-white/[0.04]',
          (error || fileError) && 'border-danger/40'
        )}
      >
        <Upload
          className={cn(
            'h-8 w-8',
            dragActive ? 'text-accent-primary' : 'text-text-tertiary'
          )}
        />
        <div className="text-center">
          <p className="text-sm text-text-secondary">
            <span className="text-accent-primary font-medium">Click to upload</span> or
            drag and drop
          </p>
          <p className="text-xs text-text-tertiary mt-1">
            {accept ? `Accepted: ${accept}` : 'Any file type'} &middot; Max {maxSizeMB}MB
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-3 space-y-2">
          {selectedFiles.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]"
            >
              <FileIcon className="h-4 w-4 text-text-tertiary shrink-0" />
              <span className="text-sm text-text-secondary truncate flex-1">
                {file.name}
              </span>
              <span className="text-xs text-text-tertiary shrink-0">
                {(file.size / 1024).toFixed(0)}KB
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(i);
                }}
                className="p-0.5 rounded hover:bg-white/5 text-text-tertiary hover:text-danger transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {(error || fileError) && (
        <p className="mt-1.5 text-xs text-danger">{error || fileError}</p>
      )}
      {hint && !error && !fileError && (
        <p className="mt-1.5 text-xs text-text-tertiary">{hint}</p>
      )}
    </div>
  );
}
