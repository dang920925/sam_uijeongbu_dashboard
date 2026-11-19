// ----------------------------------------------------------------------
// Playwright E2E 설정.
// - 서버가 아직 없으므로(back-end 동시 진행) BFF 의 목 백엔드(MOCK_BACKEND=true)로 띄운다.
//   실서버 연결은 integration 단계에서 API_BASE_URL 만 바꿔 같은 테스트를 돌린다.
// - 포트: 리드 3220, 작업자 3221~3224(PW_PORT). 작업자는 PW_SERVER=dev + NEXT_DIST_DIR 로 빌드 출력을 나눈다.
// - workers 1: 목 백엔드 상태(메모리)를 테스트끼리 공유하므로 순차 실행한다.
// ----------------------------------------------------------------------
import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PW_PORT ?? 3220);
const BASE_URL = `http://localhost:${PORT}`;
const SERVER_MODE = process.env.PW_SERVER ?? 'start';
const DIST_DIR = process.env.NEXT_DIST_DIR ?? '.next';

export const AUTH_STATE = `e2e-pw/.auth/admin-${PORT}.json`;

const MOCK_ENV = {
  MOCK_BACKEND: 'true',
  MOCK_ADMIN_USERNAME: 'fixture-admin',
  MOCK_ADMIN_PASSWORD: 'fixture-password',
  NEXT_DIST_DIR: DIST_DIR,
};

export default defineConfig({
  testDir: './e2e-pw',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  timeout: 60_000,
  use: {
    baseURL: BASE_URL,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'desktop',
      testIgnore: /(auth\.setup|screens\.capture)\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        storageState: AUTH_STATE,
      },
    },
    {
      name: 'mobile',
      testIgnore: /(auth\.setup|screens\.capture)\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Pixel 7'], storageState: AUTH_STATE },
    },
    {
      name: 'capture',
      testMatch: /screens\.capture\.ts/,
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: AUTH_STATE },
    },
  ],
  webServer: {
    command:
      SERVER_MODE === 'dev'
        ? `pnpm exec next dev -p ${PORT}`
        : `pnpm exec next start -p ${PORT}`,
    url: `${BASE_URL}/login`,
    reuseExistingServer: true,
    timeout: 180_000,
    env: MOCK_ENV,
  },
});
