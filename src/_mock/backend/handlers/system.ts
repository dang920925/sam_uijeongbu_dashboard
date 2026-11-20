// 목 전용 시스템 라우트 — 테스트 사이 상태 초기화(데이터만, 세션 유지).
import {
  json,
  noContent,
  nowIso,
  str,
  type MockRoute,
} from '@/src/_mock/backend/mock-http';
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
  {
    // U27 — 홈페이지 `POST /api/revalidate` 흉내. E2E 의 CLIENT_PUBLIC_URL 이 이 경로 앞부분을 가리킨다
    // (`http://localhost:<port>/api/backend/v1/__mock/client`). 받은 태그·경로만 기록한다.
    method: 'POST',
    pattern: /^\/v1\/__mock\/client\/api\/revalidate$/,
    auth: false,
    handle: (ctx) => {
      const tags = Array.isArray(ctx.body.tags)
        ? ctx.body.tags.map(String)
        : [];
      const paths = Array.isArray(ctx.body.paths)
        ? ctx.body.paths.map(String)
        : [];
      getStore().revalidateCalls.push({ tags, paths, receivedAt: nowIso() });
      return json({ revalidated: true, tags, paths, warmed: 0 });
    },
  },
  {
    method: 'GET',
    pattern: /^\/v1\/__mock\/revalidate-log$/,
    auth: false,
    handle: () => json({ calls: getStore().revalidateCalls }),
  },
];
