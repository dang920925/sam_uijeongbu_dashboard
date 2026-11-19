// ----------------------------------------------------------------------
// 갤러리 요청 함수(FN-14) — develop §3.4 `/admin/galleries`.
// ----------------------------------------------------------------------
import { endpoints } from '@/src/api/endpoints';
import {
  fromGalleryItemResponse,
  toGalleryCreateRequest,
  type GalleryCreateInput,
} from '@/src/api/gallery-mapper';
import { apiDelete, apiFetch, apiPost, withQuery } from '@/src/lib/api-client';
import type { GalleryCategory } from '@/src/types/codes';
import type { PageQuery, Paginated } from '@/src/types/common';
import type { GalleryItem, GalleryItemResponse } from '@/src/types/content';

export interface GalleryListQuery extends PageQuery {
  category?: GalleryCategory;
}

export async function fetchGalleries(
  query: GalleryListQuery
): Promise<Paginated<GalleryItem>> {
  const res = await apiFetch<Paginated<GalleryItemResponse>>(
    withQuery(endpoints.galleries.list, query)
  );
  return { ...res, items: res.items.map(fromGalleryItemResponse) };
}

export async function createGallery(
  input: GalleryCreateInput
): Promise<GalleryItem> {
  return fromGalleryItemResponse(
    await apiPost<GalleryItemResponse>(
      endpoints.galleries.list,
      toGalleryCreateRequest(input)
    )
  );
}

export async function deleteGallery(id: string): Promise<void> {
  await apiDelete(endpoints.galleries.detail(id));
}
