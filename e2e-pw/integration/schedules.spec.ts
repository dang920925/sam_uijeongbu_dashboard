// ----------------------------------------------------------------------
// 연동 E2E — SCR-D08 일정 관리(FN-15) × 실서버(/api/v1/admin/schedules · 연결 선택용 /admin/performances(size 100)·
// /admin/performances/{id}/classes).
// - 현재 상태: 빈 DB → "등록된 일정이 없습니다".
// - 채운 상태: datetime-local(KST) 입력 → 요청 본문 +09:00(B12) → 서버 UTC Z 저장 → 목록 KST 표시. 연결 공연 → 반(D5) 저장,
//   종료<시작 SCH_002(클라이언트 문구 · 서버 400), 없는/삭제된 공연 연결 404 PERF_001 문구, 수정·삭제·타입 필터.
// - 오류: 목록 5xx(BFF 경로만 page.route) → 오류 문구 + "다시 시도".
// 픽스처: 일정 title · 공연 title 은 fixturePrefix('schedules') 로 시작(반은 픽스처 공연 아래).
// ----------------------------------------------------------------------
import { expect, test, type Page } from '@playwright/test';

import {
  adminApi,
  cleanupFixtures,
  FIXTURE_BASE,
  fixturePrefix,
} from '@/e2e-pw/integration/support/integration-api';

const PREFIX = fixturePrefix('schedules');
const EMPTY = '등록된 일정이 없습니다';
const SERVER_ERROR = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
const PERF_NOT_FOUND = '작품 정보를 찾을 수 없습니다.';

interface ScheduleItem {
  id: string;
  title: string;
  type: string;
  startAt: string;
  endAt: string | null;
  location: string | null;
  description: string | null;
  classId: string | null;
  performanceId: string | null;
}

function rowOf(page: Page, text: string) {
  return page
    .getByRole('table', { name: '일정 관리' })
    .getByRole('row')
    .filter({ hasText: text });
}

async function listSchedules() {
  return (
    await adminApi<{ items: ScheduleItem[] }>(
      'GET',
      '/admin/schedules?size=100'
    )
  ).items;
}

async function createPerformance(title: string) {
  return adminApi<{ id: string }>('POST', '/admin/performances', {
    title,
    type: 'PLAY',
    status: 'ONGOING',
  });
}

test.beforeAll(() => cleanupFixtures(FIXTURE_BASE));
test.afterAll(() => cleanupFixtures(FIXTURE_BASE));

test.describe('SCR-D08 일정 관리 — 현재 상태(빈 DB)', () => {
  test('일정이 없으면 빈 문구를 보인다', async ({ page }) => {
    // Act
    await page.goto('/schedules');
    // Assert
    await expect(
      page.getByRole('heading', { level: 1, name: '일정 관리' })
    ).toBeVisible();
    await expect(page.getByText(EMPTY)).toBeVisible();
  });
});

test.describe('SCR-D08 일정 관리 — 채운 상태(실서버)', () => {
  test('KST 입력이 +09:00 으로 저장되고 목록에 KST 로 보이며 연결 공연·반이 저장된다', async ({
    page,
  }) => {
    // Arrange — 연결 대상 공연·반(서버 직접)
    const performanceTitle = `${PREFIX}연결 공연`;
    const performance = await createPerformance(performanceTitle);
    const cls = await adminApi<{ id: string }>(
      'POST',
      `/admin/performances/${performance.id}/classes`,
      { name: `${PREFIX}토요반`, daysOfWeek: ['SAT'], status: 'ACTIVE' }
    );
    const title = `${PREFIX}정기 공연`;
    await page.goto('/schedules');
    await page.getByRole('button', { name: '일정 추가' }).click();
    const dialog = page.getByRole('dialog', { name: '일정 추가' });
    await dialog.getByLabel('제목').fill(title);
    await dialog.getByRole('combobox', { name: '타입' }).click();
    await page.getByRole('option', { name: '공연' }).click();
    await dialog.getByLabel('시작 시간').fill('2026-12-01T19:00');
    await dialog.getByLabel('종료 시간').fill('2026-12-01T21:30');
    await dialog.getByLabel('장소').fill('의정부 예술의전당');
    await expect(
      dialog.getByRole('combobox', { name: '연결 반' })
    ).toHaveAttribute('aria-disabled', 'true');
    await dialog.getByRole('combobox', { name: '연결 공연' }).click();
    await page.getByRole('option', { name: performanceTitle }).click();
    await dialog.getByRole('combobox', { name: '연결 반' }).click();
    await page.getByRole('option', { name: `${PREFIX}토요반` }).click();
    const createRequest = page.waitForRequest(
      (r) =>
        r.url().endsWith('/api/backend/v1/admin/schedules') &&
        r.method() === 'POST'
    );
    // Act
    await dialog.getByRole('button', { name: '추가' }).click();
    // Assert — 요청 본문 오프셋(B12)
    expect((await createRequest).postDataJSON()).toEqual({
      title,
      type: 'SHOW',
      startAt: '2026-12-01T19:00:00+09:00',
      endAt: '2026-12-01T21:30:00+09:00',
      location: '의정부 예술의전당',
      description: null,
      performanceId: performance.id,
      classId: cls.id,
    });
    await expect(dialog).toBeHidden();
    await expect(page.getByText('저장되었습니다')).toBeVisible();
    // Assert — 목록 KST 표시
    const row = rowOf(page, title);
    await expect(row).toContainText('2026.12.01 19:00');
    await expect(row).toContainText('2026.12.01 21:30');
    await expect(row).toContainText('공연');
    await expect(row).toContainText('의정부 예술의전당');
    // Assert — 서버 UTC 저장·연결
    const saved = (await listSchedules()).find((s) => s.title === title);
    expect(saved).toMatchObject({
      startAt: '2026-12-01T10:00:00.000Z',
      endAt: '2026-12-01T12:30:00.000Z',
      performanceId: performance.id,
      classId: cls.id,
    });
    // Act — 수정 다이얼로그는 KST 값과 연결 공연·반으로 다시 채워진다
    await row.getByRole('button', { name: '일정 수정' }).click();
    const edit = page.getByRole('dialog', { name: '일정 수정' });
    // Assert
    await expect(edit.getByLabel('시작 시간')).toHaveValue('2026-12-01T19:00');
    await expect(edit.getByLabel('종료 시간')).toHaveValue('2026-12-01T21:30');
    await expect(edit.getByRole('combobox', { name: '연결 공연' })).toHaveText(
      performanceTitle
    );
    await expect(edit.getByRole('combobox', { name: '연결 반' })).toHaveText(
      `${PREFIX}토요반`
    );
    await edit.getByRole('button', { name: '취소' }).click();
  });

  test('종료<시작은 화면이 SCH_002 문구로 막고, 서버도 400 SCH_002 로 거절한다', async ({
    page,
    request,
  }) => {
    // Arrange
    const title = `${PREFIX}순서 오류`;
    await page.goto('/schedules');
    await page.getByRole('button', { name: '일정 추가' }).click();
    const dialog = page.getByRole('dialog', { name: '일정 추가' });
    // Act — 빈 제출
    await dialog.getByRole('button', { name: '추가' }).click();
    // Assert
    await expect(dialog.getByText('제목을 입력해주세요')).toBeVisible();
    await expect(dialog.getByText('시작 시간을 입력해주세요')).toBeVisible();
    // Act — 종료 < 시작
    await dialog.getByLabel('제목').fill(title);
    await dialog.getByLabel('시작 시간').fill('2026-12-01T19:00');
    await dialog.getByLabel('종료 시간').fill('2026-12-01T18:00');
    await dialog.getByRole('button', { name: '추가' }).click();
    // Assert — 클라이언트 문구, 저장 안 됨
    await expect(
      dialog.getByText('종료 일시는 시작 일시 이후여야 합니다.')
    ).toBeVisible();
    expect((await listSchedules()).map((s) => s.title)).not.toContain(title);
    // Act — 서버(BFF 경유)도 같은 규칙
    const response = await request.post('/api/backend/v1/admin/schedules', {
      data: {
        title,
        type: 'PRACTICE',
        startAt: '2026-12-01T19:00:00+09:00',
        endAt: '2026-12-01T18:00:00+09:00',
      },
    });
    // Assert
    expect(response.status()).toBe(400);
    expect(await response.json()).toMatchObject({
      code: 'SCH_002',
      message: '종료 일시는 시작 일시 이후여야 합니다.',
    });
  });

  test('다이얼로그를 연 사이 삭제된 공연을 연결하면 서버 PERF_001 문구를 다이얼로그에 보인다', async ({
    page,
  }) => {
    // Arrange
    const performanceTitle = `${PREFIX}곧 삭제될 공연`;
    const performance = await createPerformance(performanceTitle);
    const title = `${PREFIX}삭제 공연 연결`;
    await page.goto('/schedules');
    await page.getByRole('button', { name: '일정 추가' }).click();
    const dialog = page.getByRole('dialog', { name: '일정 추가' });
    await dialog.getByLabel('제목').fill(title);
    await dialog.getByLabel('시작 시간').fill('2026-12-02T10:00');
    await dialog.getByRole('combobox', { name: '연결 공연' }).click();
    await page.getByRole('option', { name: performanceTitle }).click();
    await adminApi('DELETE', `/admin/performances/${performance.id}`);
    // Act
    await dialog.getByRole('button', { name: '추가' }).click();
    // Assert — 404 PERF_001 서버 문구, 다이얼로그 유지
    await expect(dialog.getByText(PERF_NOT_FOUND)).toBeVisible();
    await expect(dialog).toBeVisible();
    expect((await listSchedules()).map((s) => s.title)).not.toContain(title);
  });

  test('연결 공연이 나중에 삭제된 일정은 관리 응답이 performanceId null 이라 "선택 안 함"으로 열리고 그대로 저장된다(qa1 Q3)', async ({
    page,
  }) => {
    // Arrange — 공연을 연결해 만든 뒤 공연만 삭제
    const performance = await createPerformance(`${PREFIX}지난 공연`);
    const title = `${PREFIX}지난 공연 일정`;
    const created = await adminApi<ScheduleItem>('POST', '/admin/schedules', {
      title,
      type: 'SHOW',
      startAt: '2026-10-01T19:00:00+09:00',
      performanceId: performance.id,
    });
    await adminApi('DELETE', `/admin/performances/${performance.id}`);
    expect(
      (await listSchedules()).find((s) => s.id === created.id)?.performanceId
    ).toBeNull();
    await page.goto('/schedules');
    const row = rowOf(page, title);
    await row.getByRole('button', { name: '일정 수정' }).click();
    const dialog = page.getByRole('dialog', { name: '일정 수정' });
    await expect(
      dialog.getByRole('combobox', { name: '연결 공연' })
    ).toContainText('선택 안 함');
    // Act — 그대로 저장
    await dialog.getByRole('button', { name: '저장' }).click();
    // Assert — PERF_001 없이 저장, 저장값 null
    await expect(dialog).toBeHidden();
    await expect(page.getByText(PERF_NOT_FOUND)).toHaveCount(0);
    const saved = (await listSchedules()).find((s) => s.id === created.id);
    expect(saved).toMatchObject({ performanceId: null, classId: null });
  });

  test('수정에서 장소를 지우면 null 로 저장되고 삭제는 확인 후 사라진다', async ({
    page,
  }) => {
    // Arrange — 서버 UTC 15:00 = KST 다음날 00:00(날짜 경계)
    const title = `${PREFIX}자정 연습`;
    const created = await adminApi<ScheduleItem>('POST', '/admin/schedules', {
      title,
      type: 'PRACTICE',
      startAt: '2026-11-30T15:00:00Z',
      location: '연습실',
    });
    await page.goto('/schedules');
    const row = rowOf(page, title);
    await expect(row).toContainText('2026.12.01 00:00');
    // Act — 수정
    await row.getByRole('button', { name: '일정 수정' }).click();
    const dialog = page.getByRole('dialog', { name: '일정 수정' });
    await expect(dialog.getByLabel('시작 시간')).toHaveValue(
      '2026-12-01T00:00'
    );
    await expect(dialog.getByLabel('장소')).toHaveValue('연습실');
    await dialog.getByLabel('제목').fill(`${title} 변경`);
    await dialog.getByLabel('장소').fill('');
    await dialog.getByRole('button', { name: '저장' }).click();
    // Assert
    await expect(dialog).toBeHidden();
    await expect(rowOf(page, `${title} 변경`)).toBeVisible();
    const saved = (await listSchedules()).find((s) => s.id === created.id);
    expect(saved).toMatchObject({
      title: `${title} 변경`,
      startAt: '2026-11-30T15:00:00.000Z',
      location: null,
    });
    // Act — 삭제
    await rowOf(page, `${title} 변경`)
      .getByRole('button', { name: '일정 삭제' })
      .click();
    const confirm = page.getByRole('alertdialog');
    await expect(confirm).toContainText('일정을 삭제하시겠습니까?');
    await confirm.getByRole('button', { name: '삭제' }).click();
    // Assert
    await expect(confirm).toBeHidden();
    await expect(rowOf(page, `${title} 변경`)).toHaveCount(0);
    expect((await listSchedules()).map((s) => s.id)).not.toContain(created.id);
  });

  test('타입 필터는 서버 type 쿼리로 거른다', async ({ page }) => {
    // Arrange
    await adminApi('POST', '/admin/schedules', {
      title: `${PREFIX}필터 연습`,
      type: 'PRACTICE',
      startAt: '2026-12-10T10:00:00+09:00',
    });
    await adminApi('POST', '/admin/schedules', {
      title: `${PREFIX}필터 이벤트`,
      type: 'EVENT',
      startAt: '2026-12-11T10:00:00+09:00',
    });
    await page.goto('/schedules');
    await expect(rowOf(page, `${PREFIX}필터 연습`)).toBeVisible();
    const filtered = page.waitForRequest((r) =>
      r.url().includes('/api/backend/v1/admin/schedules?type=EVENT')
    );
    // Act
    const filter = page.getByRole('group', { name: '타입' });
    await filter.getByRole('button', { name: '이벤트' }).click();
    // Assert
    await filtered;
    await expect(
      filter.getByRole('button', { name: '이벤트' })
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(rowOf(page, `${PREFIX}필터 이벤트`)).toBeVisible();
    await expect(rowOf(page, `${PREFIX}필터 연습`)).toHaveCount(0);
  });

  test('목록 조회가 5xx 면 오류 문구와 다시 시도를 보인다', async ({
    page,
  }) => {
    // Arrange — 서버 형식 500 본문
    await page.route('**/api/backend/v1/admin/schedules?**', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 500,
          status: 'INTERNAL_SERVER_ERROR',
          message: SERVER_ERROR,
          code: 'COMMON_003',
          timestamp: '2026-11-19T00:00:00.000Z',
          path: '/api/v1/admin/schedules',
        }),
      })
    );
    // Act
    await page.goto('/schedules');
    // Assert
    await expect(page.getByText(SERVER_ERROR).first()).toBeVisible();
    await expect(page.getByRole('button', { name: '다시 시도' })).toBeVisible();
    // Act — 복구
    await page.unroute('**/api/backend/v1/admin/schedules?**');
    await page.getByRole('button', { name: '다시 시도' }).click();
    // Assert
    await expect(page.getByRole('table', { name: '일정 관리' })).toBeVisible();
  });
});
