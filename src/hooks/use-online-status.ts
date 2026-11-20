'use client';

// ----------------------------------------------------------------------
// 브라우저 온라인 상태(navigator.onLine + online/offline 이벤트). 서버 렌더는 온라인으로 본다.
// R1-001(qa-r1): 입장 체크가 실제 오프라인을 바로 알아채 낙관 표시 대신 연결 끊김 배너를 보이게.
// ----------------------------------------------------------------------
import { useSyncExternalStore } from 'react';

function subscribe(onChange: () => void) {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true
  );
}
