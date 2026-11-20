import { describe, expect, it } from 'vitest';

import {
  fromAdminPopupItemResponse,
  toPopupFormInput,
  toPopupUpsertRequest,
} from '@/src/api/popup-mapper';

const RESPONSE = {
  id: 'p1',
  imageUrl: 'https://x/p.png',
  linkUrl: null,
  startDate: '2026-11-01',
  endDate: '2026-11-30',
  isActive: true,
  overlapsActive: true,
  createdAt: '2026-11-19T00:00:00.000Z',
};

describe('popup-mapper', () => {
  it('빈 링크는 null, 링크는 앞뒤 공백을 지워 요청을 만든다', () => {
    // Arrange
    const base = {
      imageUrl: 'https://x/p.png',
      startDate: '2026-11-01',
      endDate: '2026-11-30',
      isActive: false,
    };
    // Act
    const blank = toPopupUpsertRequest({ ...base, linkUrl: '  ' });
    const filled = toPopupUpsertRequest({
      ...base,
      linkUrl: ' https://sam.example/a ',
    });
    // Assert
    expect(blank).toEqual({ ...base, linkUrl: null });
    expect(filled.linkUrl).toBe('https://sam.example/a');
  });

  it('응답의 겹침 여부·null 링크를 화면 모델에 그대로 두고 수정 폼 값으로 바꾼다', () => {
    // Act
    const popup = fromAdminPopupItemResponse(RESPONSE);
    const form = toPopupFormInput(popup);
    // Assert
    expect(popup).toEqual(RESPONSE);
    expect(form).toEqual({
      imageUrl: 'https://x/p.png',
      linkUrl: '',
      startDate: '2026-11-01',
      endDate: '2026-11-30',
      isActive: true,
    });
  });
});
