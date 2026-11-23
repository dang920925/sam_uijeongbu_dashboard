// ----------------------------------------------------------------------
// (U48) 캐스트 사진 · 회차 출연 팀 · 홈페이지 미리보기 E2E(목 백엔드).
// - SCR-D14 '캐스트 사진' 카드: 공개 꺼짐 안내 → 배역 사진 올리기(진행 → '배역 사진') · 실패(다시 시도로 회복) · 삭제 확인,
//   단체샷 추가·순서·삭제, 팀샷 올리기. 홈페이지 대체 표시(프로필 / 실루엣).
// - SCR-D11 회차 목록 '출연 팀' 선택 → 새로고침해도 유지.
// - [홈페이지 미리보기] → 새 탭 `{홈페이지}/works/{id}?preview=<token>`.
// desktop 은 표, mobile 은 카드 — 보이는 요소만 골라 같은 테스트로 돈다. 접두사 fixture-u48-.
// ----------------------------------------------------------------------
import { expect, test, type Page } from '@playwright/test';

import { adminApi, pngFile, resetMock } from '@/e2e-pw/support/mock-api';
import { U48_PREFIX as PREFIX, seedU48 } from '@/e2e-pw/support/u48-seed';

const API = '/api/backend/v1';

const card = (page: Page) => page.getByTestId('cast-photos-card');
const fileInput = (page: Page, label: string) =>
  page.locator(`input[type=file][aria-label="${label}"]`);

test.describe('U48 캐스트 사진', () => {
  let performanceId = '';

  test.beforeEach(async ({ request, page }) => {
    await resetMock(request);
    ({ performanceId } = await seedU48(request));
    await page.goto(`/performances/${performanceId}/cast`);
    await expect(card(page)).toBeVisible();
  });

  test.afterEach(async ({ request }) => {
    await request.post(`${API}/__mock/fault/clear`);
  });

  test('공개 꺼짐 안내와 홈페이지 대체 표시를 보이고, 배역 사진을 올리고 지운다', async ({
    page,
  }) => {
    await expect(
      card(page).getByText(/지금은 홈페이지에 보이지 않아요/)
    ).toBeVisible();
    await expect(card(page).getByText('0 / 2')).toBeVisible();
    await expect(
      card(page).getByText('홈페이지: 프로필 사진으로 보여요')
    ).toBeVisible();
    await expect(
      card(page).getByText('홈페이지: 실루엣으로 보여요(프로필 사진도 없음)')
    ).toBeVisible();

    await fileInput(page, `에반 ${PREFIX}배우2 사진 올리기`).setInputFiles(
      pngFile(`${PREFIX}role.png`)
    );
    await expect(card(page).getByText('1 / 2')).toBeVisible();
    await expect(
      card(page).getByRole('img', { name: `에반 · ${PREFIX}배우2 배역 사진` })
    ).toBeVisible();

    await card(page)
      .getByRole('button', { name: `에반 ${PREFIX}배우2 사진 삭제` })
      .click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog.getByText('배역 사진을 지울까요?')).toBeVisible();
    await expect(dialog.getByText(/실루엣으로 바뀌어요/)).toBeVisible();
    await dialog.getByRole('button', { name: '삭제' }).click();
    await expect(card(page).getByText('0 / 2')).toBeVisible();
  });

  test('저장이 실패하면 문구와 다시 시도를 보이고, 다시 시도로 회복한다', async ({
    page,
    request,
  }) => {
    await adminApi(request, 'POST', '/__mock/fault', {
      method: 'PUT',
      pattern: '^/v1/admin/roles/.*/photos/',
      status: 500,
      count: 1,
    });
    await fileInput(page, `에반 ${PREFIX}배우1 사진 올리기`).setInputFiles(
      pngFile(`${PREFIX}fail.png`)
    );
    const alert = card(page).getByRole('alert');
    await expect(alert).toContainText('서버 오류가 발생했습니다');
    await card(page).getByRole('button', { name: '다시 시도' }).click();
    await expect(alert).toBeHidden();
    await expect(card(page).getByText('1 / 2')).toBeVisible();
  });

  test('단체샷을 추가·순서 변경·삭제하고 팀샷을 올린다', async ({
    page,
    request,
  }) => {
    await fileInput(page, '단체샷 올리기').setInputFiles(
      pngFile(`${PREFIX}g1.png`)
    );
    await expect(card(page).getByText('대표')).toBeVisible();
    await fileInput(page, '단체샷 추가').setInputFiles(
      pngFile(`${PREFIX}g2.png`)
    );
    await expect(card(page).getByText('2장 더')).toBeVisible();

    const before = await adminApi<{ groupPhotos: { id: string }[] }>(
      request,
      'GET',
      `/admin/performances/${performanceId}/cast-photos`
    );
    await card(page).getByRole('button', { name: '단체샷 2 앞으로' }).click();
    await expect
      .poll(async () => {
        const after = await adminApi<{ groupPhotos: { id: string }[] }>(
          request,
          'GET',
          `/admin/performances/${performanceId}/cast-photos`
        );
        return after.groupPhotos.map((g) => g.id);
      })
      .toEqual([before.groupPhotos[1].id, before.groupPhotos[0].id]);

    await card(page).getByRole('button', { name: '단체샷 2 삭제' }).click();
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: '삭제' })
      .click();
    await expect(card(page).getByText('3장 더')).toBeVisible();

    await fileInput(page, 'A팀 사진 올리기').setInputFiles(
      pngFile(`${PREFIX}team.png`)
    );
    await expect(
      card(page).getByRole('button', { name: 'A팀 팀샷 교체' })
    ).toBeVisible();
    await expect(card(page).getByText('B팀 사진 올리기')).toBeVisible();
  });

  test('홈페이지 미리보기는 토큰을 받아 새 탭으로 작품 상세를 연다', async ({
    page,
  }) => {
    const popup = page.waitForEvent('popup');
    await page
      .getByRole('button', { name: '홈페이지 미리보기' })
      .filter({ visible: true })
      .click();
    const tab = await popup;
    await expect
      .poll(() => tab.url())
      .toMatch(new RegExp(`/works/${performanceId}\\?preview=mock-preview\\.`));
    await expect(page.getByText(/30분 뒤 만료/).first()).toBeVisible();
    await tab.close();
  });
});

test('회차 목록에서 출연 팀을 고르면 저장되고 새로고침해도 유지된다', async ({
  page,
  request,
}) => {
  await resetMock(request);
  const { performanceId } = await seedU48(request);
  await page.goto(`/performances/${performanceId}/shows`);
  const select = page
    .getByRole('combobox', { name: '2026.12.12 (토) 14:00 출연 팀' })
    .filter({ visible: true });
  await expect(select).toHaveText('팀 미정');
  await select.click();
  await page.getByRole('option', { name: 'B팀' }).click();
  await expect(page.getByText('저장되었습니다').first()).toBeVisible();
  await page.reload();
  await expect(
    page
      .getByRole('combobox', { name: '2026.12.12 (토) 14:00 출연 팀' })
      .filter({ visible: true })
  ).toHaveText('B팀');
});
