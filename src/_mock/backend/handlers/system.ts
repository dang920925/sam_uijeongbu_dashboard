// 목 전용 시스템 라우트 — 테스트 사이 상태 초기화(데이터만, 세션 유지).
import { noContent, str, type MockRoute } from '@/src/_mock/backend/mock-http';
import { getStore, resetStoreData } from '@/src/_mock/backend/mock-store';

export const systemRoutes: MockRoute[] = [
  {
    method: 'POST',
    pattern: /^\/v1\/__mock\/reset$/,
    auth: false,
    handle: () => {
      resetStoreData();
      return noContent();
    },
  },
  {
    // 본문 { method, pattern(정규식 문자열, `/v1/...` 기준), status?, count? } — 오류 상태 화면 확인용
    method: 'POST',
    pattern: /^\/v1\/__mock\/fault$/,
    auth: false,
    handle: (ctx) => {
      getStore().faults.push({
        method: str(ctx.body.method) ?? 'GET',
        pattern: str(ctx.body.pattern) ?? '^$',
        status: Number(ctx.body.status ?? 500),
        remaining: Number(ctx.body.count ?? 1),
      });
      return noContent();
    },
  },
  {
    method: 'POST',
    pattern: /^\/v1\/__mock\/fault\/clear$/,
    auth: false,
    handle: () => {
      getStore().faults = [];
      return noContent();
    },
  },
];
