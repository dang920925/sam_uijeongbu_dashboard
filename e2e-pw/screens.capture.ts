// ----------------------------------------------------------------------
// 시안 대조용 화면 캡처(역할 문서 §3.5-3) — `pnpm exec playwright test --project=setup --project=capture`.
// 화면별 xs 390 / md 834 / lg 1440 × 라이트(대시보드는 라이트 단일 모드 — designer J-D3) 를 찍어
// SCREEN_DIR(기본 ../../output/sam-uijeongbu/front-end-screens/dashboard)에 저장한다.
// 데이터는 목 백엔드에 `fixture-` 픽스처를 넣어 만든다(실데이터처럼 보이는 값 금지).
// ----------------------------------------------------------------------
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';

import {
  adminApi,
  resetMock,
  uploadFixtureImage,
} from '@/e2e-pw/support/mock-api';

const OUT = resolve(
  process.env.SCREEN_DIR ??
    '../../output/sam-uijeongbu/front-end-screens/dashboard'
);
const VIEWPORTS = {
  lg: { width: 1440, height: 900 },
  md: { width: 834, height: 1112 },
  xs: { width: 390, height: 844 },
};
type Vp = keyof typeof VIEWPORTS;

async function seed(request: APIRequestContext) {
  await resetMock(request);
  const poster = await uploadFixtureImage(request, 'PERFORMANCE_POSTER');
  const perfs = [
    ['MUSICAL', 'ONGOING', true],
    ['PLAY', 'UPCOMING', true],
    ['PLAY', 'ONGOING', true],
    ['SEMINAR', 'ENDED', false],
    ['ETC', 'UPCOMING', true],
    ['MUSICAL', 'ENDED', false],
  ] as const;
  const created: { id: string }[] = [];
  for (const [i, [type, status, isVisible]] of perfs.entries()) {
    created.push(
      await adminApi(request, 'POST', '/admin/performances', {
        title: `fixture-공연-${i + 1}`,
        type,
        status,
        isVisible,
        description: 'fixture-설명',
        posterImageUrl: i % 2 === 0 ? poster : null,
        detailImageUrls: i === 0 ? [poster, poster] : [],
      })
    );
  }
  await adminApi(
    request,
    'POST',
    `/admin/performances/${created[0].id}/classes`,
    {
      name: 'fixture-A반',
      daysOfWeek: ['MON', 'WED'],
      startTime: '19:00',
      endTime: '21:00',
      deadline: null,
      location: 'fixture-연습실',
      status: 'ACTIVE',
    }
  );
  await adminApi(
    request,
    'POST',
    `/admin/performances/${created[0].id}/classes`,
    {
      name: 'fixture-B반',
      daysOfWeek: ['SAT'],
      startTime: '10:00',
      endTime: '12:00',
      deadline: '2026-12-31',
      location: null,
      status: 'INACTIVE',
    }
  );
  const members: { id: string }[] = [];
  for (const [i, type] of (
    ['ACTOR', 'GENERAL', 'ACTOR', 'GENERAL'] as const
  ).entries()) {
    members.push(
      await adminApi(request, 'POST', '/admin/members', {
        name: `fixture-단원-${i + 1}`,
        phone: i === 1 ? null : '010-0000-0000',
        type,
      })
    );
  }
  await adminApi(
    request,
    'PATCH',
    `/admin/members/${members[0].id}/actor-profile`,
    {
      profileImageUrl: await uploadFixtureImage(request, 'ACTOR_PROFILE'),
      intro: 'fixture-소개',
      snsUrl: 'https://instagram.com/fixture',
      activityStart: '2024-03-01',
      displayOrder: 1,
      filmography: [
        { title: 'fixture-작품', role: 'fixture-배역', year: 2025 },
      ],
    }
  );
  await request.post('/api/backend/v1/__mock/seed/applications', {
    data: [
      {
        applicantName: 'fixture-신청-1',
        phone: '010-0000-0000',
        performance: { id: created[0].id, title: 'fixture-공연-1' },
        preferredDate: '2026-12-05',
        age: 30,
        motivation: 'fixture-동기',
      },
      {
        applicantName: 'fixture-신청-2',
        phone: '010-0000-0000',
        status: 'APPROVED',
        processedAt: '2026-11-18T01:00:00.000Z',
        age: 25,
      },
      {
        applicantName: 'fixture-신청-3',
        phone: '010-0000-0000',
        status: 'REJECTED',
        processedAt: '2026-11-18T01:00:00.000Z',
      },
      {
        applicantName: 'fixture-신청-4',
        phone: '010-0000-0000',
        appType: 'CONSULTATION',
        consultationMethod: 'VISIT',
        preferredTime: 'WEEKDAY_EVENING',
      },
    ],
  });
  for (const [i, type] of (
    ['PRACTICE', 'SHOW', 'EVENT', 'ETC'] as const
  ).entries()) {
    await adminApi(request, 'POST', '/admin/schedules', {
      title: `fixture-일정-${i + 1}`,
      type,
      startAt: `2026-12-0${i + 1}T19:00:00+09:00`,
      endAt: `2026-12-0${i + 1}T21:00:00+09:00`,
      location: 'fixture-장소',
      description: null,
      performanceId: type === 'SHOW' ? created[0].id : null,
      classId: null,
    });
  }
  for (const category of [
    'PERFORMANCE',
    'PRACTICE',
    'EVENT',
    'GROUP',
    'ETC',
  ] as const) {
    await adminApi(request, 'POST', '/admin/galleries', {
      imageUrl: await uploadFixtureImage(request, 'GALLERY'),
      category,
      description: 'fixture-사진 설명',
    });
  }
  for (const i of [1, 2]) {
    await adminApi(request, 'POST', '/admin/staff', {
      name: `fixture-연출-${i}`,
      role: 'fixture-역할',
      bio: 'fixture-소개',
      displayOrder: i,
      isVisible: i === 1,
      profileImageUrl:
        i === 1 ? await uploadFixtureImage(request, 'STAFF_PROFILE') : null,
    });
  }
  const popupImage = await uploadFixtureImage(request, 'POPUP');
  await adminApi(request, 'POST', '/admin/popups', {
    imageUrl: popupImage,
    linkUrl: 'https://example.com/fixture',
    startDate: '2026-11-01',
    endDate: '2026-12-31',
    isActive: true,
  });
  await adminApi(request, 'POST', '/admin/popups', {
    imageUrl: popupImage,
    linkUrl: null,
    startDate: '2026-12-01',
    endDate: '2027-01-31',
    isActive: true,
  });
  return { performanceId: created[0].id, actorId: members[0].id };
}

async function shoot(page: Page, name: string, vp: Vp) {
  await page.setViewportSize(VIEWPORTS[vp]);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/${name}__${vp}.png`, fullPage: true });
}

test.describe.configure({ mode: 'serial' });

test('대시보드 화면을 xs·md·lg 로 캡처한다', async ({
  page,
  request,
  browser,
}) => {
  test.setTimeout(240_000);
  mkdirSync(OUT, { recursive: true });
  const { performanceId, actorId } = await seed(request);
  const routes: [string, string][] = [
    ['SCR-D02-summary', '/'],
    ['SCR-D03-performances', '/performances'],
    ['SCR-D04-performance-detail', `/performances/${performanceId}`],
    ['SCR-D05-members', '/members'],
    ['SCR-D06-applications', '/applications'],
    ['SCR-D07-gallery', '/gallery'],
    ['SCR-D08-schedules', '/schedules'],
    ['SCR-D09-staff', '/staff'],
    ['SCR-D10-popups', '/popups'],
  ];
  for (const [name, url] of routes) {
    for (const vp of ['lg', 'md', 'xs'] as Vp[]) {
      await page.setViewportSize(VIEWPORTS[vp]);
      await page.goto(url);
      await expect(page.locator('h1').first()).toBeVisible();
      await shoot(page, name, vp);
    }
  }

  // 상태 변형
  await page.setViewportSize(VIEWPORTS.lg);
  await page.goto('/performances');
  await page.getByRole('button', { name: '공연 추가' }).click();
  await shoot(page, 'SCR-D03-dialog-add', 'lg');
  await page.goto(`/members?member=${actorId}`);
  await expect(page.getByRole('button', { name: '프로필 저장' })).toBeVisible();
  await shoot(page, 'SCR-D05-panel-actor', 'lg');
  await page.goto('/applications');
  await page.getByRole('button', { name: '상세 보기' }).first().click();
  await shoot(page, 'SCR-D06-detail-pending', 'lg');
  await page.setViewportSize(VIEWPORTS.xs);
  await page.goto('/');
  await page.getByRole('button', { name: '메뉴 열기' }).click();
  await shoot(page, 'SCR-D00-drawer', 'xs');

  // 로그인(세션 없음)
  const context = await browser.newContext({
    storageState: { cookies: [], origins: [] },
  });
  const login = await context.newPage();
  for (const vp of ['lg', 'md', 'xs'] as Vp[]) {
    await login.setViewportSize(VIEWPORTS[vp]);
    await login.goto('/login');
    await shoot(login, 'SCR-D01-login', vp);
  }
  await login.getByRole('button', { name: '로그인' }).click();
  await shoot(login, 'SCR-D01-error-empty', 'xs');
  await context.close();

  // 빈 상태(데이터 0건)
  await resetMock(request);
  await page.setViewportSize(VIEWPORTS.xs);
  await page.goto('/');
  await shoot(page, 'SCR-D02-empty', 'xs');
});

// 오류 상태(qa1 QA1-008 — designer 가 추가한 error·class-error·panel-error 프레임과 대조)
test('목록·패널 조회 오류 상태를 캡처한다', async ({ page, request }) => {
  test.setTimeout(240_000);
  mkdirSync(OUT, { recursive: true });
  const { performanceId, actorId } = await seed(request);
  const fault = (pattern: string) =>
    request.post('/api/backend/v1/__mock/fault', {
      data: { method: 'GET', pattern, status: 500, count: 4 },
    });
  const cases: [string, string, string][] = [
    ['SCR-D02-error', '/', '^/v1/admin/dashboard/summary$'],
    ['SCR-D03-error', '/performances', '^/v1/admin/performances$'],
    [
      'SCR-D04-error',
      `/performances/${performanceId}`,
      '^/v1/admin/performances/[^/]+$',
    ],
    [
      'SCR-D04-class-error',
      `/performances/${performanceId}`,
      '^/v1/admin/performances/[^/]+/classes$',
    ],
    ['SCR-D05-error', '/members', '^/v1/admin/members$'],
    [
      'SCR-D05-panel-error',
      `/members?member=${actorId}`,
      '^/v1/admin/members/[^/]+$',
    ],
    ['SCR-D06-error', '/applications', '^/v1/admin/applications$'],
    ['SCR-D07-error', '/gallery', '^/v1/admin/galleries$'],
    ['SCR-D08-error', '/schedules', '^/v1/admin/schedules$'],
    ['SCR-D09-error', '/staff', '^/v1/admin/staff$'],
    ['SCR-D10-error', '/popups', '^/v1/admin/popups$'],
  ];
  for (const [name, url, pattern] of cases) {
    for (const vp of ['lg', 'xs'] as Vp[]) {
      await fault(pattern);
      await page.setViewportSize(VIEWPORTS[vp]);
      await page.goto(url);
      await expect(
        page.getByRole('button', { name: '다시 시도' }).first()
      ).toBeVisible();
      await shoot(page, name, vp);
      await request.post('/api/backend/v1/__mock/fault/clear');
    }
  }
});
