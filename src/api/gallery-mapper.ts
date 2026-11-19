// ----------------------------------------------------------------------
// 갤러리 매퍼(FN-14). 설명은 앞뒤 공백을 지우고 빈 값은 null(develop §3.1 "값 없음은 null").
// ----------------------------------------------------------------------
import type { GalleryCategory } from '@/src/types/codes';
import type {
  GalleryCreateRequest,
  GalleryItem,
  GalleryItemResponse,
} from '@/src/types/content';

/** 업로드 카드 입력 — 이미지 URL 은 업로드(FN-18)가 돌려준 publicUrl */
export interface GalleryCreateInput {
  imageUrl: string;
  category: GalleryCategory;
  description: string;
}

export function fromGalleryItemResponse(res: GalleryItemResponse): GalleryItem {
  return {
    id: res.id,
    imageUrl: res.imageUrl,
    category: res.category,
    description: res.description ?? null,
    createdAt: res.createdAt,
  };
}

export function toGalleryCreateRequest(
  input: GalleryCreateInput
): GalleryCreateRequest {
  const description = input.description.trim();
  return {
    imageUrl: input.imageUrl,
    category: input.category,
    description: description === '' ? null : description,
  };
}
