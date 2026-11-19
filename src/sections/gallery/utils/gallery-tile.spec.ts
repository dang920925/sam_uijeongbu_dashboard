import { describe, expect, it } from 'vitest';

import {
  GALLERY_FILTER_OPTIONS,
  toCategoryQuery,
  toGalleryTile,
} from '@/src/sections/gallery/utils/gallery-tile';

const ITEM = {
  id: 'g1',
  imageUrl: 'https://x/a.png',
  category: 'PRACTICE' as const,
  description: null,
  createdAt: '2026-11-19T00:00:00.000Z',
};

describe('gallery-tile', () => {
  it('설명이 있으면 대체 텍스트로, 없으면 카테고리 라벨을 쓴다', () => {
    expect(toGalleryTile({ ...ITEM, description: '리허설' }).alt).toBe(
      '리허설'
    );
    const tile = toGalleryTile(ITEM);
    expect(tile.alt).toBe('연습');
    expect(tile.categoryLabel).toBe('연습');
    expect(tile.description).toBeNull();
  });

  it('필터 pill 은 전체 + 카테고리 5개 순서이고 전체는 조회 조건을 비운다', () => {
    expect(GALLERY_FILTER_OPTIONS.map((o) => o.label)).toEqual([
      '전체',
      '공연',
      '연습',
      '이벤트',
      '단체사진',
      '기타',
    ]);
    expect(toCategoryQuery('ALL')).toBeNull();
    expect(toCategoryQuery('GROUP')).toBe('GROUP');
  });
});
