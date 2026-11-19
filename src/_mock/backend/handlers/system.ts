// 목 전용 시스템 라우트 — 테스트 사이 상태 초기화(데이터만, 세션 유지).
import { noContent, type MockRoute } from '@/src/_mock/backend/mock-http';
import { resetStoreData } from '@/src/_mock/backend/mock-store';

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
];
