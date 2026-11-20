// ----------------------------------------------------------------------
// 목 갤러리(FN-14) — develop §3.4. category 필터·createdAt desc 페이지, 생성 시 허용 저장소 밖 URL 400 UPL_003,
// 없는 id 404 GAL_001, 소프트 삭제(deletedAt).
// ----------------------------------------------------------------------
import {
  apiError,
  isAllowedImageUrl,
  json,
  newId,
  noContent,
  nowIso,
  paginate,
  str,
  validationError,
  type MockRoute,
} from '@/src/_mock/backend/mock-http';
import { getStore, type SoftDeleted } from '@/src/_mock/backend/mock-store';
import { GALLERY_CATEGORIES, type GalleryCategory } from '@/src/types/codes';
import type { GalleryItemResponse } from '@/src/types/content';

function toItem(g: SoftDeleted<GalleryItemResponse>): GalleryItemResponse {
  const { deletedAt: _deletedAt, ...rest } = g;
  return rest;
}

/** createdAt desc — 같은 시각이면 나중에 만든 것(id 가 큰 것)이 먼저 */
function byNewest(a: GalleryItemResponse, b: GalleryItemResponse): number {
  return b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id);
}

export const galleryRoutes: MockRoute[] = [
  {
    method: 'GET',
    pattern: /^\/v1\/admin\/galleries$/,
    auth: true,
    handle: (ctx) => {
      const category = ctx.query.get('category');
      const items = getStore()
        .galleries.filter((g) => g.deletedAt === null)
        .filter((g) => !category || g.category === category)
        .map(toItem)
        .sort(byNewest);
      return json(paginate(items, ctx.query));
    },
  },
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/galleries$/,
    auth: true,
    handle: (ctx) => {
      const b = ctx.body;
      if (!isAllowedImageUrl(b.imageUrl))
        return apiError(ctx, 400, 'UPL_003', '이미지를 업로드해주세요.');
      if (!GALLERY_CATEGORIES.includes(b.category as GalleryCategory))
        return validationError(ctx);
      const description = str(b.description);
      if (description !== null && description.length > 200)
        return validationError(ctx);
      const created: SoftDeleted<GalleryItemResponse> = {
        id: newId(),
        imageUrl: b.imageUrl as string,
        category: b.category as GalleryCategory,
        description,
        createdAt: nowIso(),
        deletedAt: null,
      };
      getStore().galleries.push(created);
      return json(toItem(created), 201);
    },
  },
  {
    method: 'DELETE',
    pattern: /^\/v1\/admin\/galleries\/(?<id>[^/]+)$/,
    auth: true,
    handle: (ctx) => {
      const target = getStore().galleries.find(
        (g) => g.id === ctx.params.id && g.deletedAt === null
      );
      if (!target)
        return apiError(
          ctx,
          404,
          'GAL_001',
          '갤러리 이미지를 찾을 수 없습니다.'
        );
      target.deletedAt = nowIso();
      return noContent();
    },
  },
];
