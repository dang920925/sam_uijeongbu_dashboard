'use client';

// ----------------------------------------------------------------------
// 갤러리(SCR-D07) ViewModel — 필터·업로드·삭제 상태와 콜백. JSX 없음.
// - 파일을 고르면 바로 업로드(서명 URL, FN-18) → POST /admin/galleries → 목록 갱신(현행 Gallery.tsx:52-70 흐름).
// - 업로드 실패 문구는 업로드 카드 안(현행 자리), 삭제 실패·목록 조회 실패는 스낵바(designer W3 스낵바 규격).
// - 삭제 성공은 타일이 사라지는 것으로 알린다(현행에 성공 문구 없음 — 자체 결정).
// ----------------------------------------------------------------------
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  useCreateGallery,
  useDeleteGallery,
  useGalleries,
} from '@/src/api/gallery-queries';
import { uploadImage } from '@/src/api/upload';
import { useAppSnackbar } from '@/src/hooks/use-app-snackbar';
import { ApiError } from '@/src/lib/api-client';
import { toGalleryUploadErrorMessage } from '@/src/sections/gallery/utils/gallery-upload-error';
import {
  GALLERY_FILTER_OPTIONS,
  toCategoryQuery,
  toGalleryTile,
  type GalleryFilter,
} from '@/src/sections/gallery/utils/gallery-tile';
import { MSG_API } from '@/src/shared/messages/common';
import type { GalleryCategory } from '@/src/types/codes';

const toErrorMessage = (error: unknown) =>
  error instanceof ApiError ? error.message : MSG_API.SERVER_ERROR;

export function useGalleryViewModel() {
  const snackbar = useAppSnackbar();
  const [filter, setFilter] = useState<GalleryFilter>('ALL');
  const [uploadCategory, setUploadCategory] =
    useState<GalleryCategory>('PERFORMANCE');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const query = useGalleries(toCategoryQuery(filter));
  const createMutation = useCreateGallery();
  const deleteMutation = useDeleteGallery();
  const { error: queryError, errorUpdatedAt } = query;

  useEffect(() => {
    if (queryError) snackbar.error(toErrorMessage(queryError));
  }, [queryError, errorUpdatedAt, snackbar]);

  const tiles = useMemo(
    () => (query.data?.items ?? []).map(toGalleryTile),
    [query.data]
  );

  const handleFileSelect = useCallback(
    async (file: File) => {
      setUploadError(null);
      setIsUploading(true);
      try {
        const imageUrl = await uploadImage('GALLERY', file);
        await createMutation.mutateAsync({
          imageUrl,
          category: uploadCategory,
          description,
        });
        setDescription('');
      } catch (e: unknown) {
        setUploadError(toGalleryUploadErrorMessage(e));
      } finally {
        setIsUploading(false);
      }
    },
    [createMutation, uploadCategory, description]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTargetId) return;
    try {
      await deleteMutation.mutateAsync(deleteTargetId);
    } catch (e: unknown) {
      snackbar.error(toErrorMessage(e));
    } finally {
      setDeleteTargetId(null);
    }
  }, [deleteMutation, deleteTargetId, snackbar]);

  return {
    isLoading: query.isPending,
    isError: query.isError && !query.data,
    errorMessage: toErrorMessage(queryError),
    onRetry: () => void query.refetch(),
    tiles,
    filter,
    filterOptions: GALLERY_FILTER_OPTIONS,
    onFilterChange: setFilter,
    upload: {
      category: uploadCategory,
      description,
      isUploading,
      errorMessage: uploadError,
      onCategoryChange: setUploadCategory,
      onDescriptionChange: setDescription,
      onFileSelect: (file: File) => void handleFileSelect(file),
    },
    isDeleteOpen: deleteTargetId !== null,
    isDeleting: deleteMutation.isPending,
    onDeleteRequest: setDeleteTargetId,
    onDeleteCancel: () => setDeleteTargetId(null),
    onDeleteConfirm: () => void handleDeleteConfirm(),
  };
}

export type GalleryViewModel = ReturnType<typeof useGalleryViewModel>;
