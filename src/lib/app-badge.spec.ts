import { describe, expect, it, vi } from 'vitest';

import { syncAppBadge, type AppBadgeTarget } from '@/src/lib/app-badge';

function mockTarget(): Required<AppBadgeTarget> & {
  setAppBadge: ReturnType<typeof vi.fn>;
  clearAppBadge: ReturnType<typeof vi.fn>;
} {
  return {
    setAppBadge: vi.fn().mockResolvedValue(undefined),
    clearAppBadge: vi.fn().mockResolvedValue(undefined),
  };
}

describe('syncAppBadge(U40)', () => {
  it('1 이상이면 setAppBadge(n) 를 부른다', () => {
    const target = mockTarget();
    syncAppBadge(3, target);
    expect(target.setAppBadge).toHaveBeenCalledWith(3);
    expect(target.clearAppBadge).not.toHaveBeenCalled();
  });

  it('0 이면 clearAppBadge 를 부른다', () => {
    const target = mockTarget();
    syncAppBadge(0, target);
    expect(target.clearAppBadge).toHaveBeenCalledTimes(1);
    expect(target.setAppBadge).not.toHaveBeenCalled();
  });

  it('지원하지 않는 브라우저(함수 없음·대상 없음)는 조용히 넘어간다', () => {
    expect(() => syncAppBadge(2, {})).not.toThrow();
    expect(() => syncAppBadge(2, undefined)).not.toThrow();
  });

  it('거부(약속 실패)·동기 예외도 밖으로 던지지 않는다', async () => {
    const rejected = mockTarget();
    rejected.setAppBadge.mockRejectedValue(
      new DOMException('x', 'NotAllowedError')
    );
    expect(() => syncAppBadge(1, rejected)).not.toThrow();
    await Promise.resolve();
    const throwing: AppBadgeTarget = {
      setAppBadge: () => {
        throw new TypeError('x');
      },
    };
    expect(() => syncAppBadge(1, throwing)).not.toThrow();
  });
});
