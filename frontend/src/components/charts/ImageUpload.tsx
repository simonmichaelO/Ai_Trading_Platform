/**
 * Chart Image Upload Component
 * 
 * Allows users to upload chart screenshots for AI vision analysis.
 * Converts image to base64 data URL for sending to the backend.
 * 
 * Features:
 * - Drag & drop support
 * - File picker
 * - Image preview
 * - Remove uploaded image
 * - File size validation
 */

'use client';

import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  onImageUpload: (base64DataUrl: string) => void;
  onImageRemove?: () => void;
  currentImage?: string | null;
  maxSizeMB?: number;
}

export function ImageUpload({
  onImageUpload,
  onImageRemove,
  currentImage,
  maxSizeMB = 5,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, WebP).');
      return;
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Image must be under ${maxSizeMB}MB.`);
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setPreview(base64);
      onImageUpload(base64);
    };
    reader.readAsDataURL(file);
  }, [maxSizeMB, onImageUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleRemove = useCallback(() => {
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
    onImageRemove?.();
  }, [onImageRemove]);

  // If we have a preview, show it
  if (preview) {
    return (
      <div className="relative group">
        <img
          src={preview}
          alt="Chart screenshot"
          className="w-full rounded-lg border border-border max-h-64 object-contain bg-muted/20"
        />
        <button
          onClick={handleRemove}
          className="absolute top-2 right-2 h-7 w-7 rounded-full bg-destructive/90 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
        >
          ✕
        </button>
        <div className="absolute bottom-2 left-2 rounded-md bg-background/80 backdrop-blur-sm px-2 py-1 text-xs text-muted-foreground">
          Chart uploaded ✓
        </div>
      </div>
    );
  }

  // Upload area
  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-muted/30'
        )}
      >
        <div className="text-3xl mb-2">📸</div>
        <p className="text-sm text-foreground font-medium">
          Drop chart screenshot here
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          or click to browse • PNG, JPG, WebP • Max {maxSizeMB}MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {error && (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
