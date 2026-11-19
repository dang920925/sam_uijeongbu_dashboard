'use client';

// 라우트 오류 경계 — "다시 시도" = reset(재렌더) (라벨과 동작 일치, §11.9).
import { AppStateView } from '@/src/sections/app-state/app-state-view';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D00_STATE } from '@/src/shared/messages/d00';

export default function RouteError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <AppStateView
      message={MSG_D00_STATE.ERROR}
      actionLabel={MSG_COMMON.RETRY}
      onAction={reset}
    />
  );
}
