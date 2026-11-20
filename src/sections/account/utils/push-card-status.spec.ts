import { describe, expect, it } from 'vitest';

import { toPushCardStatus } from '@/src/sections/account/utils/push-card-status';

const READY = {
  isLoading: false,
  isError: false,
  publicKey: 'fixture-key',
  permission: 'default' as const,
};

describe('toPushCardStatus', () => {
  it('공개키가 있고 브라우저가 지원하면 ready 다(권한 granted·default)', () => {
    expect(toPushCardStatus(READY)).toBe('ready');
    expect(toPushCardStatus({ ...READY, permission: 'granted' })).toBe('ready');
  });

  it('불러오는 중이거나 브라우저 상태를 아직 모르면 loading, 오류면 error 가 먼저다', () => {
    expect(toPushCardStatus({ ...READY, isLoading: true })).toBe('loading');
    expect(toPushCardStatus({ ...READY, permission: null })).toBe('loading');
    expect(toPushCardStatus({ ...READY, isLoading: true, isError: true })).toBe(
      'error'
    );
  });

  it('서버 꺼짐 → 미지원 → 권한 거부 순으로 알린다', () => {
    expect(
      toPushCardStatus({ ...READY, publicKey: null, permission: 'unsupported' })
    ).toBe('server-disabled');
    expect(toPushCardStatus({ ...READY, permission: 'unsupported' })).toBe(
      'unsupported'
    );
    expect(toPushCardStatus({ ...READY, permission: 'denied' })).toBe('denied');
  });
});
