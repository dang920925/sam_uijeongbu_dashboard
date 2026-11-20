// ----------------------------------------------------------------------
// U34 '팀 계정' 탭 · 관리자 연습실 예약 목록 E2E(목 백엔드) — PR-1(등록 시 A 자동·12자·혼동 문자 없음),
// PR-6(재발급·비활성·접두어 변경 — 화면 쪽), PR-8(전체 복사 형식), 접두어 중복 409 TEAM_003, 예약 목록·삭제.
// desktop 은 표, mobile 은 카드 — 보이는 요소만 골라 같은 테스트로 돈다.
// ----------------------------------------------------------------------
import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';

import { adminApi, resetMock } from '@/e2e-pw/support/mock-api';

test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

const CONFUSING = /[0Oo1Ili]/;

async function createPerformance(request: APIRequestContext, title: string) {
  return adminApi<{ id: string }>(request, 'POST', '/admin/performances', {
    title,
    type: 'PLAY',
    status: 'UPCOMING',
    isVisible: false,
  });
}

const visible = (page: Page, testId: string) =>
  page.getByTestId(testId).filter({ visible: true });

test.beforeEach(async ({ request }) => {
  await resetMock(request);
});

test('공연을 등록하면 접두어-A 가 생기고 비밀번호는 가렸다가 보기로 12자를 보인다(PR-1)', async ({
  page,
  request,
}) => {
  const { id } = await createPerformance(request, 'Dear 에반');
  await page.goto(`/performances/${id}/teams`);
  await expect(page.getByRole('tab', { name: '팀 계정' })).toHaveAttribute(
    'aria-selected',
    'true'
  );
  await expect(
    page.getByText('Dear-A').filter({ visible: true }).first()
  ).toBeVisible();
  await expect(visible(page, 'team-password').first()).toHaveText(
    '••••••••••••'
  );
  await page
    .getByRole('button', { name: 'A 팀 비밀번호 보기' })
    .filter({ visible: true })
    .click();
  const password =
    (await visible(page, 'team-password').first().textContent()) ?? '';
  expect(password).toMatch(/^[A-Za-z0-9]{12}$/);
  expect(password).not.toMatch(CONFUSING);
  await expect(
    page.getByText('공연이 끝나면 팀 계정은 자동으로 폐기됩니다.')
  ).toBeVisible();
});

test('팀 추가 뒤 전체 복사는 사용 중 계정만 라벨 순 "A - 아이디: …, 비밀번호 … / B - …"(PR-8)', async ({
  page,
  request,
}) => {
  const { id } = await createPerformance(request, 'Dear');
  const teams = () =>
    adminApi<{
      items: {
        id: string;
        label: string;
        username: string;
        password: string;
      }[];
    }>(request, 'GET', `/admin/performances/${id}/team-accounts`);
  await page.goto(`/performances/${id}/teams`);
  await page.getByRole('button', { name: '팀 추가' }).click();
  await expect(page.getByText('Dear-B 팀 계정을 만들었습니다.')).toBeVisible();
  await page.getByRole('button', { name: '팀 추가' }).click();
  await expect(page.getByText('Dear-C 팀 계정을 만들었습니다.')).toBeVisible();
  // C 끄기 → 전체 복사에서 빠진다
  await page
    .getByRole('switch', { name: 'C 팀 계정 사용' })
    .filter({ visible: true })
    .click();
  await expect(
    page.getByText('사용 안 함').filter({ visible: true }).first()
  ).toBeVisible();

  await page.getByRole('button', { name: '전체 복사' }).click();
  await expect(page.getByText('복사되었습니다.')).toBeVisible();
  const { items } = await teams();
  const [a, b] = items;
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    `A - 아이디: ${a.username}, 비밀번호 ${a.password} / B - 아이디: ${b.username}, 비밀번호 ${b.password}`
  );
});

test('재발급은 확인 뒤 새 비밀번호, 접두어 변경은 모든 아이디를 바꾸고 중복이면 409 문구(PR-6)', async ({
  page,
  request,
}) => {
  await createPerformance(request, 'Taken');
  const { id } = await createPerformance(request, 'Dear');
  const before = await adminApi<{ items: { password: string }[] }>(
    request,
    'GET',
    `/admin/performances/${id}/team-accounts`
  );
  await page.goto(`/performances/${id}/teams`);

  await page
    .getByRole('button', { name: 'A 팀 비밀번호 재발급' })
    .filter({ visible: true })
    .click();
  await expect(page.getByText('비밀번호를 재발급하시겠습니까?')).toBeVisible();
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: '재발급' })
    .click();
  await expect(page.getByText('새 비밀번호를 만들었습니다.')).toBeVisible();
  const shown =
    (await visible(page, 'team-password').first().textContent()) ?? '';
  expect(shown).toMatch(/^[A-Za-z0-9]{12}$/);
  expect(shown).not.toBe(before.items[0].password);

  const prefix = page.getByLabel('아이디 접두어');
  await prefix.fill('Taken');
  await page.getByRole('button', { name: '접두어 저장' }).click();
  await expect(
    page.getByText('이미 사용 중인 아이디입니다. 다른 접두어를 입력해주세요.')
  ).toBeVisible();
  await prefix.fill('De-ar');
  await expect(
    page.getByText('접두어는 영문·숫자 1~20자여야 합니다.')
  ).toBeVisible();
  await prefix.fill('Evan');
  await page.getByRole('button', { name: '접두어 저장' }).click();
  await expect(page.getByText('접두어를 바꿨습니다.')).toBeVisible();
  await expect(
    page.getByText('Evan-A').filter({ visible: true }).first()
  ).toBeVisible();
});

test('관리자 연습실 예약 목록은 메모·작품을 보이고 확인 뒤 삭제한다', async ({
  page,
  request,
}) => {
  const tomorrow = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
  }).format(new Date(Date.now() + 86400000));
  await page.goto('/room-reservations');
  const title = await page.getByTestId('room-week-title').textContent();
  const nextMonday = (title ?? '').slice(0, 10).replaceAll('.', '-');
  const monday = new Date(Date.parse(`${nextMonday}T00:00:00Z`) + 7 * 86400000)
    .toISOString()
    .slice(0, 10);
  await adminApi(request, 'POST', '/__mock/room-reservations', {
    startAt: `${tomorrow}T19:00:00+09:00`,
    endAt: `${tomorrow}T21:00:00+09:00`,
    teamName: 'Dear-A',
    memo: '[팀 메모]',
    performanceTitle: '[작품 제목]',
  });
  await page.reload();
  if (tomorrow >= monday)
    await page.getByRole('button', { name: '다음 주' }).click();
  await expect(
    page.getByText('[팀 메모]').filter({ visible: true })
  ).toBeVisible();
  await expect(
    page.getByText('19:00–21:00').filter({ visible: true }).first()
  ).toBeVisible();
  await page
    .getByRole('button', { name: /Dear-A .* 예약 삭제/ })
    .filter({ visible: true })
    .click();
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: '삭제' })
    .click();
  await expect(page.getByText('예약을 삭제했습니다.')).toBeVisible();
  await expect(
    page.getByText('이 주에는 연습실 예약이 없습니다.')
  ).toBeVisible();
});

test('메뉴 "연습실 예약" 으로 들어온다', async ({ page }) => {
  await page.goto('/');
  const nav = page
    .getByRole('link', { name: '연습실 예약' })
    .filter({ visible: true });
  if ((await nav.count()) === 0)
    await page.getByRole('button', { name: /메뉴/ }).first().click();
  await page
    .getByRole('link', { name: '연습실 예약' })
    .filter({ visible: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/room-reservations$/);
  await expect(
    page.getByRole('heading', { name: '연습실 예약', level: 1 })
  ).toBeVisible();
});
