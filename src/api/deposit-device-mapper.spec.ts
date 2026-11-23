import { describe, expect, it } from 'vitest';

import {
  buildPairingLink,
  isAdminAppUserAgent,
  toDepositDeviceRow,
  validateDepositDeviceName,
} from '@/src/api/deposit-device-mapper';

const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0 Mobile Safari/537.36';

describe('isAdminAppUserAgent', () => {
  it('User-Agent 끝이 SAMAdmin/<버전> 이면 관리자 앱이다', () => {
    expect(isAdminAppUserAgent(`${ANDROID_UA} SAMAdmin/1.1.0`)).toBe(true);
  });

  it('없거나 끝이 아니거나 버전이 없으면 앱이 아니다', () => {
    expect(isAdminAppUserAgent(ANDROID_UA)).toBe(false);
    expect(isAdminAppUserAgent(`SAMAdmin/1.1.0 ${ANDROID_UA}`)).toBe(false);
    expect(isAdminAppUserAgent(`${ANDROID_UA} SAMAdmin/`)).toBe(false);
    expect(isAdminAppUserAgent(`${ANDROID_UA}XSAMAdmin/1.1.0`)).toBe(false);
    expect(isAdminAppUserAgent(null)).toBe(false);
  });
});

describe('buildPairingLink', () => {
  it('samadmin://pair 에 토큰과 이름을 URL 인코딩해 붙인다', () => {
    const link = buildPairingLink('abc_DEF-123', '관리자 폰');

    expect(link.startsWith('samadmin://pair?')).toBe(true);
    const query = new URLSearchParams(link.slice('samadmin://pair?'.length));
    expect([query.get('token'), query.get('name')]).toEqual([
      'abc_DEF-123',
      '관리자 폰',
    ]);
  });
});

describe('toDepositDeviceRow', () => {
  it('마지막 수신 시각을 KST 로, 없으면 아직 없음 문구', () => {
    const seen = toDepositDeviceRow({
      id: 'd1',
      name: '관리자 폰',
      createdAt: '2026-11-23T01:00:00.000Z',
      lastSeenAt: '2026-11-23T03:04:00.000Z',
    });
    const never = toDepositDeviceRow({
      id: 'd2',
      name: '예비 폰',
      createdAt: '2026-11-23T01:00:00.000Z',
      lastSeenAt: null,
    });

    expect(seen.lastSeenText).toContain('12:04');
    expect(seen.lastSeenText.startsWith('마지막 수신')).toBe(true);
    expect(never.lastSeenText).toBe('아직 받은 알림이 없습니다');
  });
});

describe('validateDepositDeviceName', () => {
  it('공백을 뺀 1~40자면 통과, 아니면 오류 문구', () => {
    expect(validateDepositDeviceName(' 관리자 폰 ')).toBeNull();
    expect(validateDepositDeviceName('   ')).not.toBeNull();
    expect(validateDepositDeviceName('가'.repeat(41))).not.toBeNull();
  });
});
