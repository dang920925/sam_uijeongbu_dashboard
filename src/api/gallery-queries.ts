'use client';

// 갤러리 쿼리 키와 훅(FN-14). 그리드는 size=100 으로 받는다(develop §3.4 "갤러리 그리드는 size=100").
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createGallery,
  deleteGallery,
  fetchGalleries,
  type GalleryListQuery,
} from '@/src/api/gallery';
import type { GalleryCreateInput } from '@/src/api/gallery-mapper';
import { ROOT_KEYS } from '@/src/api/root-keys';
import type { GalleryCategory } from '@/src/types/codes';
import { ADMIN_MAX_PAGE_SIZE } from '@/src/types/common';

export const galleryKeys = {
  all: ROOT_KEYS.gallery,
  list: (query: GalleryListQuery) =>
    [...galleryKeys.all, 'list', query] as const,
};

export function useGalleries(category: GalleryCategory | null) {
  const query: GalleryListQuery = {
    category: category ?? undefined,
    page: 1,
    size: ADMIN_MAX_PAGE_SIZE,
  };
  return useQuery({
    queryKey: galleryKeys.list(query),
    queryFn: () => fetchGalleries(query),
  });
}

export function useCreateGallery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GalleryCreateInput) => createGallery(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: galleryKeys.all }),
  });
}

export function useDeleteGallery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGallery(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: galleryKeys.all }),
  });
}
