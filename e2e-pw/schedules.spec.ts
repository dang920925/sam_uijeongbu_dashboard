// ----------------------------------------------------------------------
// SCR-D08 일정 관리(FN-15) — 추가·수정·삭제·필터, 종료<시작 SCH_002 문구, KST 표시(B12), 연결 공연/반(D5).
// 픽스처 접두사 fixture-1-w3-. desktop(lg 표)·mobile(카드) 모두 같은 흐름.
// ----------------------------------------------------------------------
import { expect, test, type APIRequestContext } from '@playwright/test';

import { adminApi, resetMock } from '@/e2e-pw/support/mock-api';

const API = '/api/backend/v1';

interface ScheduleItem {
  id: string;
  startAt: string;
  endAt: string | null;
  performanceId: string | null;
  classId: string | null;
  title: string;
}

async function createSchedule(
  request: APIRequestContext,
  body: Record<string, unknown>
): Promise<ScheduleItem> {
  return adminApi<ScheduleItem>(request, 'POST', '/admin/schedules', body);
}

async function listSchedules(request: APIRequestContext) {
  return adminApi<{ items: ScheduleItem[] }>(
    request,
    'GET',
    '/admin/schedules'
  );
}

test.describe('SCR-D08 일정 관리', () => {
  test.beforeEach(async ({ request }) => {
    await resetMock(request);
  });

  test('일정이 없으면 빈 문구를 보여 준다', async ({ page }) => {
    await page.goto('/schedules');
    await expect(
      page.getByRole('heading', { level: 1, name: '일정 관리' })
    ).toBeVisible();
    await expect(page.getByText('등록된 일정이 없습니다')).toBeVisible();
  });

  test('일정을 추가하면 +09:00 으로 저장되고 KST 로 표시되며 연결 공연·반이 저장된다', async ({
    page,
    request,
  }) => {
    const performance = await adminApi<{ id: string }>(
      request,
      'POST',
      '/admin/performances',
      { title: 'fixture-1-w3-공연', type: 'PLAY', status: 'ONGOING' }
    );
    const cls = await adminApi<{ id: string }>(
      request,
      'POST',
      `/admin/performances/${performance.id}/classes`,
      { name: 'fixture-1-w3-반', daysOfWeek: ['SAT'], status: 'ACTIVE' }
    );

    await page.goto('/schedules');
    await page.getByRole('button', { name: '일정 추가' }).click();
    const dialog = page.getByRole('dialog', { name: '일정 추가' });
    await dialog.getByLabel('제목').fill('fixture-1-w3-공연 일정');
    await dialog.getByRole('combobox', { name: '타입' }).click();
    await page.getByRole('option', { name: '공연' }).click();
    await dialog.getByLabel('시작 시간').fill('2026-12-01T19:00');
    await dialog.getByLabel('종료 시간').fill('2026-12-01T21:30');
    await dialog.getByLabel('장소').fill('fixture-1-w3-장소');
    await expect(
      dialog.getByRole('combobox', { name: '연결 반' })
    ).toHaveAttribute('aria-disabled', 'true');
    await dialog.getByRole('combobox', { name: '연결 공연' }).click();
    await page.getByRole('option', { name: 'fixture-1-w3-공연' }).click();
    await dialog.getByRole('combobox', { name: '연결 반' }).click();
    await page.getByRole('option', { name: 'fixture-1-w3-반' }).click();
    await dialog.getByRole('button', { name: '추가' }).click();

    await expect(page.getByText('저장되었습니다')).toBeVisible();
    await expect(dialog).toBeHidden();
    await expect(
      page.getByText('2026.12.01 19:00').filter({ visible: true })
    ).toBeVisible();
    await expect(
      page.getByText('2026.12.01 21:30').filter({ visible: true })
    ).toBeVisible();

    const { items } = await listSchedules(request);
    expect(items[0]).toMatchObject({
      startAt: '2026-12-01T10:00:00.000Z',
      endAt: '2026-12-01T12:30:00.000Z',
      performanceId: performance.id,
      classId: cls.id,
    });
  });

  test('제목·시작 시간 필수와 종료<시작 문구를 다이얼로그에서 보여 주고 저장하지 않는다', async ({
    page,
    request,
  }) => {
    await page.goto('/schedules');
    await page.getByRole('button', { name: '일정 추가' }).click();
    const dialog = page.getByRole('dialog', { name: '일정 추가' });
    await dialog.getByRole('button', { name: '추가' }).click();
    await expect(dialog.getByText('제목을 입력해주세요')).toBeVisible();
    await expect(dialog.getByText('시작 시간을 입력해주세요')).toBeVisible();

    await dialog.getByLabel('제목').fill('fixture-1-w3-일정');
    await dialog.getByLabel('시작 시간').fill('2026-12-01T19:00');
    await dialog.getByLabel('종료 시간').fill('2026-12-01T18:00');
    await dialog.getByRole('button', { name: '추가' }).click();
    await expect(
      dialog.getByText('종료 일시는 시작 일시 이후여야 합니다.')
    ).toBeVisible();
    expect((await listSchedules(request)).items).toHaveLength(0);
  });

  test('서버도 종료<시작은 400 SCH_002, 없는 공연 연결은 404 PERF_001', async ({
    request,
  }) => {
    const bad = await request.post(`${API}/admin/schedules`, {
      data: {
        title: 'fixture-1-w3-일정',
        type: 'PRACTICE',
        startAt: '2026-12-01T19:00:00+09:00',
        endAt: '2026-12-01T18:00:00+09:00',
      },
    });
    expect(bad.status()).toBe(400);
    expect(await bad.json()).toMatchObject({
      code: 'SCH_002',
      message: '종료 일시는 시작 일시 이후여야 합니다.',
    });
    const missing = await request.post(`${API}/admin/schedules`, {
      data: {
        title: 'fixture-1-w3-일정',
        type: 'SHOW',
        startAt: '2026-12-01T19:00:00+09:00',
        performanceId: 'fixture-1-w3-없음',
      },
    });
    expect(missing.status()).toBe(404);
    expect((await missing.json()).code).toBe('PERF_001');
  });

  test('수정 다이얼로그는 KST 시각으로 채워지고 저장하면 목록이 바뀐다', async ({
    page,
    request,
  }) => {
    await createSchedule(request, {
      title: 'fixture-1-w3-연습',
      type: 'PRACTICE',
      startAt: '2026-11-30T15:00:00.000Z',
      location: 'fixture-1-w3-연습실',
    });
    await page.goto('/schedules');
    await expect(
      page.getByText('2026.12.01 00:00').filter({ visible: true })
    ).toBeVisible();
    await page.getByRole('button', { name: '일정 수정' }).click();
    const dialog = page.getByRole('dialog', { name: '일정 수정' });
    await expect(dialog.getByLabel('시작 시간')).toHaveValue(
      '2026-12-01T00:00'
    );
    await expect(dialog.getByLabel('장소')).toHaveValue('fixture-1-w3-연습실');
    await dialog.getByLabel('제목').fill('fixture-1-w3-연습 변경');
    await dialog.getByLabel('장소').fill('');
    await dialog.getByRole('button', { name: '저장' }).click();

    await expect(dialog).toBeHidden();
    await expect(
      page.getByText('fixture-1-w3-연습 변경').filter({ visible: true })
    ).toBeVisible();
    const { items } = await listSchedules(request);
    expect(items[0]).toMatchObject({
      title: 'fixture-1-w3-연습 변경',
      startAt: '2026-11-30T15:00:00.000Z',
    });
    expect(items[0]).toHaveProperty('location', null);
  });

  test('삭제는 확인 후 목록에서 사라진다', async ({ page, request }) => {
    await createSchedule(request, {
      title: 'fixture-1-w3-삭제',
      type: 'EVENT',
      startAt: '2026-12-05T10:00:00+09:00',
    });
    await page.goto('/schedules');
    await page.getByRole('button', { name: '일정 삭제' }).click();
    const confirm = page.getByRole('alertdialog');
    await expect(confirm).toContainText('일정을 삭제하시겠습니까?');
    await confirm.getByRole('button', { name: '삭제' }).click();
    await expect(page.getByText('등록된 일정이 없습니다')).toBeVisible();
  });

  test('타입 필터 pill 로 일정을 거르고 선택 상태를 aria-pressed 로 알린다', async ({
    page,
    request,
  }) => {
    await createSchedule(request, {
      title: 'fixture-1-w3-연습',
      type: 'PRACTICE',
      startAt: '2026-12-01T10:00:00+09:00',
    });
    await createSchedule(request, {
      title: 'fixture-1-w3-공연',
      type: 'SHOW',
      startAt: '2026-12-02T10:00:00+09:00',
    });
    await page.goto('/schedules');
    await expect(
      page.getByText('fixture-1-w3-연습').filter({ visible: true })
    ).toBeVisible();
    const filter = page.getByRole('group', { name: '타입' });
    await filter.getByRole('button', { name: '공연' }).click();
    await expect(filter.getByRole('button', { name: '공연' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await expect(
      page.getByText('fixture-1-w3-공연').filter({ visible: true })
    ).toBeVisible();
    await expect(page.getByText('fixture-1-w3-연습')).toHaveCount(0);
  });
});
