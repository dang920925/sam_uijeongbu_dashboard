import { describe, expect, it } from 'vitest';

import {
  depositFilterOptions,
  toCodeQuery,
  toStatusQuery,
} from '@/src/sections/deposit-notifications/utils/deposit-filter';

describe('depositFilterOptions', () => {
  it('전체 다음에 처리할 것(확인 안 된 입금·확인 필요·일부 입금)을 앞에 둔다', () => {
    expect(depositFilterOptions().map((o) => o.label)).toEqual([
      '전체',
      '확인 안 된 입금',
      '확인 필요',
      '일부 입금',
      '입금 완료',
      '직접 연결',
      '무시함',
    ]);
  });
});

describe('toStatusQuery', () => {
  it('전체면 undefined, 그 밖은 그대로', () => {
    expect(toStatusQuery('ALL')).toBeUndefined();
    expect(toStatusQuery('PARTIAL')).toBe('PARTIAL');
  });
});

describe('toCodeQuery', () => {
  it('앞뒤 공백을 지운 4자리 숫자만 받는다', () => {
    expect(toCodeQuery(' 1234 ')).toBe('1234');
    expect(toCodeQuery('123')).toBeNull();
    expect(toCodeQuery('12a4')).toBeNull();
  });
});
