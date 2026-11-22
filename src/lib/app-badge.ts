// ----------------------------------------------------------------------
// (U40) 앱 아이콘 배지(Badging API) — 설치한 PWA 아이콘 오른쪽 위 숫자 = 입금 대기 예매 수.
// - n > 0 → navigator.setAppBadge(n), 0 → clearAppBadge(). 지원하지 않는 브라우저(함수 없음)·거부(권한·설치 안 함)는 조용히 넘어간다.
// - 서비스 워커(public/sw.js)는 push payload 의 badgeCount 로 같은 일을 한다(self.registration.setAppBadge).
// ----------------------------------------------------------------------

/** Badging API 가 있을 수 있는 대상(window.navigator · 테스트 모의 객체) */
export interface AppBadgeTarget {
  setAppBadge?: (contents?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
}

function defaultTarget(): AppBadgeTarget | undefined {
  return typeof navigator === 'undefined'
    ? undefined
    : (navigator as unknown as AppBadgeTarget);
}

export function syncAppBadge(
  count: number,
  target: AppBadgeTarget | undefined = defaultTarget()
): void {
  if (!target) return;
  try {
    const n = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
    const pending = n > 0 ? target.setAppBadge?.(n) : target.clearAppBadge?.();
    // 거부(NotAllowedError 등)는 화면에 알릴 일이 아니다
    void pending?.catch(() => undefined);
  } catch {
    // 동기 예외(구현 차이)도 조용히
  }
}
