'use client';

// ----------------------------------------------------------------------
// 최종 폴백(루트 레이아웃 자체가 실패) — 테마 밖이라 시스템 폰트·hex 를 직접 쓴다(가이드 §11.3 화이트리스트).
// ----------------------------------------------------------------------
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D00_STATE } from '@/src/shared/messages/d00';

export default function GlobalError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <html lang='ko'>
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          background: '#f8fafc',
          color: '#0f172a',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", sans-serif',
        }}
      >
        <h1 style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>
          {MSG_D00_STATE.ERROR}
        </h1>
        <button
          type='button'
          onClick={reset}
          style={{
            minHeight: 44,
            padding: '0 16px',
            borderRadius: 6,
            border: 0,
            background: '#0f172a',
            color: '#f8fafc',
          }}
        >
          {MSG_COMMON.RETRY}
        </button>
      </body>
    </html>
  );
}
