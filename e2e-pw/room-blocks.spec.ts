// ----------------------------------------------------------------------
// (U46) 연습실 '시간 막기' 탭 E2E(목 백엔드) — 추가(매주·하루) · 겹치는 예약 경고 → 취소하고 저장 · 삭제 ·
// 예약 목록·캘린더 연습실 레이어에 막은 시간 줄/칩 · 이 날만 해제.
// desktop 은 표, mobile 은 카드 — 보이는 요소만 골라 같은 테스트로 돈다.
// ----------------------------------------------------------------------
import { expect, test, type Page } from '@playwright/test';

import { adminApi, resetMock } from '@/e2e-pw/support/mock-api';

/** KST 오늘 + n 일 'YYYY-MM-DD' */
function kstDate(days: number): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(
    new Date(Date.now() + days * 86400000)
  );
}

const visibleText = (page: Page, text: string) =>
  page.getByText(text).filter({ visible: true }).first();

test.describe('U46 연습실 시간 막기', () => {
  test.beforeEach(async ({ request }) => {
    await resetMock(request);
  });

  test('탭에서 매주 반복으로 막고, 수정 없이 삭제하면 목록이 빈다', async ({
    page,
  }) => {
    await page.goto('/room-reservations');
    await page.getByRole('tab', { name: '시간 막기' }).click();
    await expect(page).toHaveURL('/room-reservations/blocks');
    await expect(page.getByText('막은 시간이 없습니다.')).toBeVisible();

    await page.getByRole('button', { name: '시간 막기', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('제목').fill('고정 사용');
    await expect(dialog.getByLabel('종료일')).not.toHaveValue('');
    await dialog.getByRole('button', { name: '저장' }).click();
    await expect(page.getByText('막은 시간을 저장했습니다.')).toBeVisible();
    await expect(visibleText(page, '고정 사용')).toBeVisible();
    await expect(visibleText(page, '10:00–18:00')).toBeVisible();

    await page
      .getByRole('button', { name: '고정 사용 삭제' })
      .filter({ visible: true })
      .click();
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: '삭제' })
      .click();
    await expect(page.getByText('막은 시간이 없습니다.')).toBeVisible();
  });

  test('겹치는 팀 예약이 있으면 목록으로 경고하고, 취소하고 저장하면 예약이 사라진다', async ({
    page,
    request,
  }) => {
    const day = kstDate(1);
    await adminApi(request, 'POST', '/__mock/room-reservations', {
      startAt: `${day}T11:00:00+09:00`,
      endAt: `${day}T12:00:00+09:00`,
      teamName: 'Dear-A',
      performanceTitle: 'Dear',
    });
    await page.goto('/room-reservations/blocks');
    await page.getByRole('button', { name: '시간 막기', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('제목').fill('대관');
    await dialog.getByRole('button', { name: '하루만' }).click();
    await dialog.getByLabel('날짜').fill(day);
    await dialog.getByRole('button', { name: '저장' }).click();

    const conflicts = page.getByTestId('room-block-conflicts');
    await expect(conflicts).toContainText('Dear-A');
    await page
      .getByRole('button', { name: '겹치는 예약 취소하고 저장' })
      .click();
    await expect(page.getByText('막은 시간을 저장했습니다.')).toBeVisible();

    const schedule = await adminApi<{ items: unknown[]; blocks: unknown[] }>(
      request,
      'GET',
      `/admin/room-reservations?from=${encodeURIComponent(`${day}T00:00:00+09:00`)}&to=${encodeURIComponent(`${kstDate(2)}T00:00:00+09:00`)}`
    );
    expect(schedule.items).toHaveLength(0);
    expect(schedule.blocks).toHaveLength(1);
  });

  test('예약 목록과 캘린더 연습실 레이어에 막은 시간이 보이고, 이 날만 해제하면 사라진다', async ({
    page,
    request,
  }) => {
    const today = kstDate(0);
    await adminApi(request, 'POST', '/admin/room-blocks', {
      title: '고정 사용',
      memo: null,
      repeat: 'NONE',
      weekdays: [],
      startTime: '20:00',
      endTime: '24:00',
      startDate: today,
      endDate: today,
    });

    await page.goto('/schedules');
    await page.getByRole('button', { name: '목록', exact: true }).click();
    const list = page.getByTestId('schedule-room-list');
    await list
      .getByRole('button', { name: /고정 사용/ })
      .first()
      .click();
    const detail = page.getByTestId('room-reservation-detail');
    await expect(detail).toContainText('관리자가 막은 연습실 시간입니다.');
    await page.getByRole('button', { name: '닫기' }).click();

    await page.goto('/room-reservations');
    await expect(
      page.getByTestId('room-block-row').filter({ visible: true }).first()
    ).toContainText('고정 사용');
    await page
      .getByRole('button', { name: /고정 사용 .* 이 날만 해제/ })
      .filter({ visible: true })
      .click();
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: '이 날만 해제' })
      .click();
    await expect(
      page.getByText('이 날은 막은 시간을 해제했습니다.')
    ).toBeVisible();
    await expect(
      page.getByText('이 주에는 연습실 예약이 없습니다.')
    ).toBeVisible();
  });
});
