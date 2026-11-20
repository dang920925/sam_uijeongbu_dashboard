'use client';

// ----------------------------------------------------------------------
// 여러 장 업로드 상태 훅(상세 이미지 — FN-18). 파일마다 진행·실패를 따로 두고, 성공하면 onUploaded(url) 로 넘긴다.
// ----------------------------------------------------------------------
import { useCallback, useRef, useState } from 'react';

import { uploadImage } from '@/src/api/upload';
import { toUploadErrorMessage } from '@/src/hooks/upload-error-message';
import type { UploadPurpose } from '@/src/types/codes';

export interface PendingUpload {
  key: string;
  progress: number;
  errorMessage: string | null;
}

export interface ImageListUploadState {
  pending: PendingUpload[];
  isUploading: boolean;
  uploadFiles: (files: File[]) => void;
  retry: (key: string) => void;
  dismiss: (key: string) => void;
}

export function useImageListUpload(
  purpose: UploadPurpose,
  onUploaded: (url: string) => void
): ImageListUploadState {
  const [pending, setPending] = useState<PendingUpload[]>([]);
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
      patch(key, { progress: 0, errorMessage: null });
      try {
        const url = await uploadImage(purpose, file, (progress) =>
          patch(key, { progress })
        );
        files.current.delete(key);
        setPending((list) => list.filter((p) => p.key !== key));
        onUploaded(url);
      } catch (e: unknown) {
        patch(key, { errorMessage: toUploadErrorMessage(e) });
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
      setPending((list) => [
        ...list,
        ...keys.map((key) => ({ key, progress: 0, errorMessage: null })),
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
    uploadFiles,
    retry: (key: string) => void run(key),
    dismiss: (key: string) => {
      files.current.delete(key);
      setPending((list) => list.filter((p) => p.key !== key));
    },
  };
}
