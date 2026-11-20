'use client';

// ----------------------------------------------------------------------
// 여러 장 업로드 상태 훅(상세 이미지 — FN-18). 파일마다 진행·실패를 따로 두고, 성공하면 onUploaded(url) 로 넘긴다.
// 업로드 전에 브라우저에서 줄인다(W5) — 마지막으로 줄인 파일의 안내를 notice 에 둔다.
// ----------------------------------------------------------------------
import { useCallback, useRef, useState } from 'react';

import { uploadImageWithCompress } from '@/src/api/upload';
import { toUploadErrorMessage } from '@/src/hooks/upload-error-message';
import { MSG_UPLOAD } from '@/src/shared/messages/common';
import type { UploadPurpose } from '@/src/types/codes';
import { formatMegabytes } from '@/src/utils/image-compress/compress-plan';

export interface PendingUpload {
  key: string;
  progress: number;
  /** 업로드 전 축소·압축 중 */
  isOptimizing: boolean;
  errorMessage: string | null;
}

export interface ImageListUploadState {
  pending: PendingUpload[];
  isUploading: boolean;
  /** 압축해 올렸을 때 안내 문구(마지막 파일) */
  notice: string | null;
  uploadFiles: (files: File[]) => void;
  retry: (key: string) => void;
  dismiss: (key: string) => void;
}

export function useImageListUpload(
  purpose: UploadPurpose,
  onUploaded: (url: string) => void
): ImageListUploadState {
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const files = useRef(new Map<string, File>());
  const seq = useRef(0);

  const patch = (key: string, next: Partial<PendingUpload>) =>
    setPending((list) =>
      list.map((p) => (p.key === key ? { ...p, ...next } : p))
    );

  const run = useCallback(
    async (key: string) => {
      const file = files.current.get(key);
      if (!file) return;
      patch(key, { progress: 0, isOptimizing: true, errorMessage: null });
      try {
        const result = await uploadImageWithCompress(purpose, file, {
          onPrepared: () => patch(key, { isOptimizing: false }),
          onProgress: (progress) => patch(key, { progress }),
        });
        files.current.delete(key);
        setPending((list) => list.filter((p) => p.key !== key));
        if (result.originalSize !== null) {
          setNotice(
            MSG_UPLOAD.COMPRESSED(
              formatMegabytes(result.originalSize),
              formatMegabytes(result.uploadedSize)
            )
          );
        }
        onUploaded(result.url);
      } catch (e: unknown) {
        patch(key, {
          isOptimizing: false,
          errorMessage: toUploadErrorMessage(e),
        });
      }
    },
    [purpose, onUploaded]
  );

  const uploadFiles = useCallback(
    (selected: File[]) => {
      const keys = selected.map((file) => {
        seq.current += 1;
        const key = `upload-${seq.current}`;
        files.current.set(key, file);
        return key;
      });
      setNotice(null);
      setPending((list) => [
        ...list,
        ...keys.map((key) => ({
          key,
          progress: 0,
          isOptimizing: true,
          errorMessage: null,
        })),
      ]);
      void keys.reduce(
        (chain, key) => chain.then(() => run(key)),
        Promise.resolve()
      );
    },
    [run]
  );

  return {
    pending,
    isUploading: pending.some((p) => p.errorMessage === null),
    notice,
    uploadFiles,
    retry: (key: string) => void run(key),
    dismiss: (key: string) => {
      files.current.delete(key);
      setPending((list) => list.filter((p) => p.key !== key));
    },
  };
}
