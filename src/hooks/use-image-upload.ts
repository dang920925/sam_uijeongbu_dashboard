'use client';

// ----------------------------------------------------------------------
// 이미지 1장 업로드 상태 훅(FN-18) — 진행률·실패 문구·재시도용 마지막 파일.
// ----------------------------------------------------------------------
import { useCallback, useState } from 'react';

import { uploadImage } from '@/src/api/upload';
import { toUploadErrorMessage } from '@/src/hooks/upload-error-message';
import type { UploadPurpose } from '@/src/types/codes';

export interface ImageUploadState {
  isUploading: boolean;
  progress: number;
  errorMessage: string | null;
  upload: (file: File) => Promise<string | null>;
  retry: () => Promise<string | null>;
  clearError: () => void;
}

export function useImageUpload(purpose: UploadPurpose): ImageUploadState {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);

  const upload = useCallback(
    async (file: File) => {
      setLastFile(file);
      setErrorMessage(null);
      setIsUploading(true);
      setProgress(0);
      try {
        return await uploadImage(purpose, file, setProgress);
      } catch (e: unknown) {
        setErrorMessage(toUploadErrorMessage(e));
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [purpose]
  );

  const retry = useCallback(
    async () => (lastFile ? upload(lastFile) : null),
    [lastFile, upload]
  );

  return {
    isUploading,
    progress,
    errorMessage,
    upload,
    retry,
    clearError: () => setErrorMessage(null),
  };
}
