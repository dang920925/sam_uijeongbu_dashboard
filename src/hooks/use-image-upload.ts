'use client';

// ----------------------------------------------------------------------
// 이미지 1장 업로드 상태 훅(FN-18) — 압축 중·진행률·압축 안내·실패 문구·재시도용 마지막 파일.
// 업로드 전에 브라우저에서 줄인다(W5) — 줄였으면 notice 에 "15.2MB → 2.1MB로 줄여 올렸습니다."
// ----------------------------------------------------------------------
import { useCallback, useState } from 'react';

import { uploadImageWithCompress } from '@/src/api/upload';
import { toUploadErrorMessage } from '@/src/hooks/upload-error-message';
import { MSG_UPLOAD } from '@/src/shared/messages/common';
import type { UploadPurpose } from '@/src/types/codes';
import { formatMegabytes } from '@/src/utils/image-compress/compress-plan';

export interface ImageUploadState {
  isUploading: boolean;
  /** 업로드 전 축소·압축 중(isUploading 도 true) */
  isOptimizing: boolean;
  progress: number;
  errorMessage: string | null;
  /** 압축해 올렸을 때 안내 문구 */
  notice: string | null;
  upload: (file: File) => Promise<string | null>;
  retry: () => Promise<string | null>;
  clearError: () => void;
}

export function useImageUpload(purpose: UploadPurpose): ImageUploadState {
  const [isUploading, setIsUploading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);

  const upload = useCallback(
    async (file: File) => {
      setLastFile(file);
      setErrorMessage(null);
      setNotice(null);
      setIsUploading(true);
      setIsOptimizing(true);
      setProgress(0);
      try {
        const result = await uploadImageWithCompress(purpose, file, {
          onPrepared: () => setIsOptimizing(false),
          onProgress: setProgress,
        });
        if (result.originalSize !== null) {
          setNotice(
            MSG_UPLOAD.COMPRESSED(
              formatMegabytes(result.originalSize),
              formatMegabytes(result.uploadedSize)
            )
          );
        }
        return result.url;
      } catch (e: unknown) {
        setErrorMessage(toUploadErrorMessage(e));
        return null;
      } finally {
        setIsUploading(false);
        setIsOptimizing(false);
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
    isOptimizing,
    progress,
    errorMessage,
    notice,
    upload,
    retry,
    clearError: () => setErrorMessage(null),
  };
}
