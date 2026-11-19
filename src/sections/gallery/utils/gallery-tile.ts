// ----------------------------------------------------------------------
// 갤러리 타일 표시 모델 — 카테고리 코드값 → 라벨, 대체 텍스트 = 설명 → 카테고리 → "갤러리 이미지"(현행 Gallery.tsx:171).
// 필터 pill 값 'ALL' ↔ 조회 category(null = 전체).
// ----------------------------------------------------------------------
import type { SegmentOption } from '@/src/components/segment-pill';
import { MSG_D07 } from '@/src/shared/messages/d07';
import {
  GALLERY_CATEGORIES,
  GALLERY_CATEGORY_LABEL,
  type GalleryCategory,
} from '@/src/types/codes';
import type { GalleryItem } from '@/src/types/content';

export interface GalleryTileModel {
  id: string;
  imageUrl: string;
  alt: string;
  categoryLabel: string;
  description: string | null;
}

export type GalleryFilter = 'ALL' | GalleryCategory;

export const GALLERY_FILTER_OPTIONS: SegmentOption<GalleryFilter>[] = [
  { value: 'ALL', label: MSG_D07.FILTER_ALL },
  ...GALLERY_CATEGORIES.map((c) => ({
    value: c,
    label: GALLERY_CATEGORY_LABEL[c],
  })),
];

export function toCategoryQuery(filter: GalleryFilter): GalleryCategory | null {
  return filter === 'ALL' ? null : filter;
}

export function toGalleryTile(item: GalleryItem): GalleryTileModel {
  const categoryLabel = GALLERY_CATEGORY_LABEL[item.category] ?? '';
  const description = item.description?.trim() ? item.description : null;
  return {
    id: item.id,
    imageUrl: item.imageUrl,
    alt: description ?? (categoryLabel || MSG_D07.IMAGE_ALT_FALLBACK),
    categoryLabel,
    description,
  };
}
