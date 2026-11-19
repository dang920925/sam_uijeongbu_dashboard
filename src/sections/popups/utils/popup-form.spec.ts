import { describe, expect, it } from 'vitest';

import {
  EMPTY_POPUP_FORM,
  hasPopupFormError,
  validatePopupForm,
} from '@/src/sections/popups/utils/popup-form';

const VALID = {
  imageUrl: 'https://x/p.png',
  linkUrl: '',
  startDate: '2026-11-01',
  endDate: '2026-11-30',
  isActive: true,
};

describe('validatePopupForm', () => {
  it('이미지가 없으면 UPL_003, 종료일이 시작일보다 앞이면 POP_002 문구를 돌려준다', () => {
    // Act
    const errors = validatePopupForm({
      ...VALID,
      imageUrl: null,
      endDate: '2026-10-31',
    });
    // Assert
    expect(errors.imageUrl).toBe('이미지를 업로드해주세요.');
    expect(errors.endDate).toBe('종료일은 시작일 이후여야 합니다.');
  });

  it('종료일이 시작일과 같으면 통과하고 빈 링크는 허용한다', () => {
    const errors = validatePopupForm({ ...VALID, endDate: '2026-11-01' });
    expect(hasPopupFormError(errors)).toBe(false);
  });

  it('https 가 아닌 링크와 비어 있는 날짜는 검증 실패 기본 문구로 막는다', () => {
    const errors = validatePopupForm({
      ...EMPTY_POPUP_FORM,
      imageUrl: 'https://x/p.png',
      linkUrl: 'http://sam.example',
    });
    expect(errors).toEqual({
      imageUrl: null,
      linkUrl: '입력값을 확인해주세요.',
      startDate: '입력값을 확인해주세요.',
      endDate: '입력값을 확인해주세요.',
    });
  });
});
