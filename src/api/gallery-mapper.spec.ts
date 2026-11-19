import { describe, expect, it } from 'vitest';

import {
  fromGalleryItemResponse,
  toGalleryCreateRequest,
} from '@/src/api/gallery-mapper';

describe('gallery-mapper', () => {
  it('빈 설명은 null 로, 설명은 앞뒤 공백을 지워 생성 요청으로 만든다', () => {
    // Arrange
    const base = { imageUrl: 'https://x/a.png', category: 'PRACTICE' as const };
    // Act
    const blank = toGalleryCreateRequest({ ...base, description: '   ' });
    const filled = toGalleryCreateRequest({ ...base, description: ' 연습 ' });
    // Assert
    expect(blank).toEqual({ ...base, description: null });
    expect(filled.description).toBe('연습');
  });

  it('목록 응답의 설명 null 을 그대로 화면 모델에 둔다', () => {
    // Act
    const item = fromGalleryItemResponse({
      id: 'g1',
      imageUrl: 'https://x/a.png',
      category: 'GROUP',
      description: null,
      createdAt: '2026-11-19T00:00:00.000Z',
    });
    // Assert
    expect(item).toEqual({
      id: 'g1',
      imageUrl: 'https://x/a.png',
      category: 'GROUP',
      description: null,
      createdAt: '2026-11-19T00:00:00.000Z',
    });
  });
});
