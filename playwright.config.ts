// ----------------------------------------------------------------------
// Playwright E2E 설정.
// - 서버가 아직 없으므로(back-end 동시 진행) BFF 의 목 백엔드(MOCK_BACKEND=true)로 띄운다.
//   실서버 연결은 integration 단계에서 API_BASE_URL 만 바꿔 같은 테스트를 돌린다.
// - 포트: 리드 3220, 작업자 3221~3224(PW_PORT). 작업자는 PW_SERVER=dev + NEXT_DIST_DIR 로 빌드 출력을 나눈다.
// - workers 1: 목 백엔드 상태(메모리)를 테스트끼리 공유하므로 순차 실행한다.
// - E2E_TARGET=integration: 목 없이 실제 서버(INT_API_BASE_URL, 기본 :4200)로 BFF 를 붙여
//   e2e-pw/integration/** 만 돌린다(연동 E2E — integration-developer). 포트 기본 4230, 서버 기본 next dev.
// ----------------------------------------------------------------------
import { defineConfig, devices } from '@playwright/test';

const IS_INTEGRATION = process.env.E2E_TARGET === 'integration';
const PORT = Number(process.env.PW_PORT ?? (IS_INTEGRATION ? 4230 : 3220));
const BASE_URL = `http://localhost:${PORT}`;
const SERVER_MODE = process.env.PW_SERVER ?? (IS_INTEGRATION ? 'dev' : 'start');
const DIST_DIR = process.env.NEXT_DIST_DIR ?? '.next';

export const AUTH_STATE = `e2e-pw/.auth/admin-${PORT}.json`;
/** 연동 E2E 세션(실서버 픽스처 관리자) — 목 세션과 섞이지 않게 파일을 나눈다 */
export const INTEGRATION_AUTH_STATE = `e2e-pw/.auth/integration-${PORT}.json`;

const INTEGRATION_ENV = {
  API_BASE_URL: process.env.INT_API_BASE_URL ?? 'http://localhost:4200',
  // qa1 U11 — 서버와 같은 중계 비밀(방문자 IP 를 레이트리밋 키로 신뢰하게)
  RELAY_SECRET: process.env.INT_RELAY_SECRET ?? '',
  NEXT_DIST_DIR: DIST_DIR,
};

const INTEGRATION_PROJECTS = [
  { name: 'integration-setup', testMatch: /integration\/admin\.setup\.ts/ },
  {
    name: 'integration',
    testMatch: /integration\/.*\.spec\.ts/,
    dependencies: ['integration-setup'],
    use: {
      ...devices['Desktop Chrome'],
      viewport: { width: 1440, height: 900 },
      storageState: INTEGRATION_AUTH_STATE,
    },
  },
];

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
  // 작업자가 동시에 돌려도 결과 폴더가 서로 지워지지 않게 포트별로 나눈다(⚠ 2026-11-19 ENOENT 실측)
  outputDir: `test-results/${PORT}`,
  reporter: [['list']],
  timeout: 60_000,
  use: {
    baseURL: BASE_URL,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    trace: 'retain-on-failure',
  },
  projects: IS_INTEGRATION
    ? INTEGRATION_PROJECTS
    : [
        { name: 'setup', testMatch: /auth\.setup\.ts/ },
        {
          name: 'desktop',
          testIgnore: [/(auth\.setup|screens\.capture)\.ts/, /integration\//],
          dependencies: ['setup'],
          use: {
            ...devices['Desktop Chrome'],
            viewport: { width: 1440, height: 900 },
            storageState: AUTH_STATE,
          },
        },
        {
          name: 'mobile',
          testIgnore: [/(auth\.setup|screens\.capture)\.ts/, /integration\//],
          dependencies: ['setup'],
          use: { ...devices['Pixel 7'], storageState: AUTH_STATE },
        },
        {
          name: 'capture',
          testMatch: /^(?!.*integration).*screens\.capture\.ts/,
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
    env: IS_INTEGRATION ? INTEGRATION_ENV : MOCK_ENV,
  },
});
