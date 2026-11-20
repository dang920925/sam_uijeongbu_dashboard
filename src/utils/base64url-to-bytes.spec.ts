import { describe, expect, it } from 'vitest';

import { base64UrlToBytes } from '@/src/utils/base64url-to-bytes';

describe('base64UrlToBytes', () => {
  it('패딩 없는 base64url 을 바이트로 바꾼다(- _ 포함)', () => {
    expect(Array.from(base64UrlToBytes('-_8'))).toEqual([251, 255]);
    expect(Array.from(base64UrlToBytes('AQID'))).toEqual([1, 2, 3]);
  });

  it('빈 문자열은 빈 배열이다', () => {
    expect(base64UrlToBytes('')).toHaveLength(0);
  });

  it('VAPID 공개키(87자)는 65바이트 비압축 점(0x04 시작)이다', () => {
    const key = `BA${'A'.repeat(85)}`;
    const bytes = base64UrlToBytes(key);
    expect(bytes).toHaveLength(65);
    expect(bytes[0]).toBe(4);
  });
});
