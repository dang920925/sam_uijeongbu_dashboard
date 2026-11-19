import { describe, expect, it } from 'vitest';

import { validateMemberForm } from '@/src/components/member-form-dialog/validate-member-form';

describe('validateMemberForm', () => {
  it('이름이 공백뿐이면 현행 문구로 막는다', () => {
    expect(
      validateMemberForm({ name: '  ', phone: '', type: 'GENERAL' }).name
    ).toBe('이름을 입력해주세요');
  });

  it('이름이 있으면 오류가 없다', () => {
    expect(
      validateMemberForm({ name: '홍', phone: '', type: 'ACTOR' }).name
    ).toBeNull();
  });
});
