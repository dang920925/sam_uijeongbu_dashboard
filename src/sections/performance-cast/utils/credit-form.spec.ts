import { describe, expect, it } from 'vitest';

import { validateCreditForm } from '@/src/sections/performance-cast/utils/credit-form';
import { validateRoleForm } from '@/src/sections/performance-cast/utils/role-form';

const base = {
  title: '연출',
  kind: 'staff' as const,
  staffId: 's1',
  memberId: null,
  displayName: '',
  isVisible: false,
};

describe('validateCreditForm', () => {
  it('직함이 비면 직함 필수 문구다', () => {
    expect(validateCreditForm({ ...base, title: ' ' })).toBe(
      '직함을 입력해주세요'
    );
  });

  it('고른 갈래의 사람이 없으면 사람 필수 문구다', () => {
    expect(validateCreditForm({ ...base, staffId: null })).toBe(
      '사람을 고르거나 이름을 입력해주세요'
    );
    expect(
      validateCreditForm({ ...base, kind: 'name', displayName: '  ' })
    ).toBe('사람을 고르거나 이름을 입력해주세요');
  });

  it('갈래에 맞는 값이 있으면 통과한다', () => {
    expect(validateCreditForm(base)).toBeNull();
    expect(
      validateCreditForm({ ...base, kind: 'name', displayName: 'fixture' })
    ).toBeNull();
  });
});

describe('validateRoleForm', () => {
  it('이름 있는 배역은 이름이 필수, 출연 묶음은 이름 없이 통과한다', () => {
    expect(
      validateRoleForm({ isEnsemble: false, name: ' ', description: '' })
    ).toBe('배역 이름을 입력해주세요');
    expect(
      validateRoleForm({ isEnsemble: true, name: '', description: '' })
    ).toBeNull();
  });
});
