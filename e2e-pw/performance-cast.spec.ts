// ----------------------------------------------------------------------
// SCR-D14 배역·캐스팅(R3 U26 · U33) · SCR-D05 배우 쪽 SAM 출연작 · SCR-D09 연출진 연혁 E2E(목 백엔드).
// 수용 기준: S35(배역 추가·순서·삭제) · CR-3(출연 묶음 1개) · CR-9(공개 안 됨 이유) · CA-1(양쪽 같은 데이터) ·
// CA-5(참여 직함 → D14 참여자) · CA-8(배역 없이 저장 → 출연 묶음) · T-3(연혁 순서 저장 · 50개 상한).
// desktop 은 격자(lg), mobile 은 회차 고르기 + 배역 목록 — 보이는 요소만 골라 같은 테스트로 돈다.
// ----------------------------------------------------------------------
import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';

import { adminApi, resetMock } from '@/e2e-pw/support/mock-api';

const PREFIX = 'fixture-r3-';

interface Created {
  id: string;
}

async function setup(request: APIRequestContext) {
  const performance = await adminApi<Created>(
    request,
    'POST',
    '/admin/performances',
    {
      title: `${PREFIX}작품`,
      type: 'PLAY',
      status: 'UPCOMING',
      isVisible: true,
    }
  );
  const actor = await adminApi<Created>(request, 'POST', '/admin/members', {
    name: `${PREFIX}배우`,
    type: 'ACTOR',
  });
  await adminApi(request, 'PATCH', `/admin/members/${actor.id}`, {
    isVisible: true,
  });
  await adminApi(request, 'PATCH', `/admin/members/${actor.id}/actor-profile`, {
    intro: null,
  });
  return { performanceId: performance.id, actorId: actor.id };
}

function rolesSection(page: Page) {
  return page.getByRole('region', { name: '배역' });
}

test.describe('SCR-D14 배역·캐스팅', () => {
  test.beforeEach(async ({ request }) => {
    await resetMock(request);
  });

  test('공연 상세 탭에서 들어가고 공개 스위치는 기본 꺼짐이다', async ({
    page,
    request,
  }) => {
    const { performanceId } = await setup(request);
    await page.goto(`/performances/${performanceId}`);

    await page.getByRole('tab', { name: '배역·캐스팅' }).click();

    await expect(page).toHaveURL(`/performances/${performanceId}/cast`);
    const toggle = page.getByRole('switch', {
      name: '캐스트·참여자 홈페이지 공개',
    });
    await expect(toggle).not.toBeChecked();
    await expect(
      page.getByText('등록된 배역이 없습니다').first()
    ).toBeVisible();
  });

  test('배역을 추가하고 배우를 넣으면 공개 안 됨 이유가 보이고, 스위치를 켜면 공개 중이 된다(CR-9)', async ({
    page,
    request,
  }) => {
    const { performanceId } = await setup(request);
    await page.goto(`/performances/${performanceId}/cast`);

    await page.getByRole('button', { name: '배역 추가' }).click();
    const dialog = page.getByRole('dialog', { name: '배역 추가' });
    await dialog.getByRole('button', { name: '추가' }).click();
    await expect(dialog.getByText('배역 이름을 입력해주세요')).toBeVisible();
    await dialog.getByPlaceholder('예: 햄릿').fill(`${PREFIX}햄릿`);
    await dialog.getByRole('button', { name: '추가' }).click();
    await expect(dialog).toBeHidden();

    const role = rolesSection(page).getByRole('listitem', {
      name: `${PREFIX}햄릿`,
    });
    await role.getByRole('button', { name: '배우 추가' }).click();
    const picker = page.getByRole('dialog', { name: /배우 추가/ });
    await picker.getByLabel(`${PREFIX}배우`).check();
    await picker.getByPlaceholder('예: A캐스트').fill('A캐스트');
    await picker.getByRole('button', { name: '저장' }).click();
    await expect(picker).toBeHidden();

    await expect(role).toContainText(`${PREFIX}배우 · A캐스트`);
    await expect(role.getByText('공개 안 됨 — 공개 스위치 꺼짐')).toBeVisible();

    await page
      .getByRole('switch', { name: '캐스트·참여자 홈페이지 공개' })
      .click();
    await expect(role.getByText('공개 중')).toBeVisible();
  });

  test('"출연" 묶음은 하나만 — 출연자 추가는 묶음을 만들고 두 번째 묶음 선택지는 막힌다(CR-3 · CA-8)', async ({
    page,
    request,
  }) => {
    const { performanceId } = await setup(request);
    await page.goto(`/performances/${performanceId}/cast`);

    await page.getByRole('button', { name: '출연자 추가' }).click();
    const picker = page.getByRole('dialog', { name: '출연자 추가' });
    await picker.getByLabel(`${PREFIX}배우`).check();
    await picker.getByRole('button', { name: '저장' }).click();
    await expect(picker).toBeHidden();
    await expect(
      rolesSection(page).getByRole('listitem', { name: '출연' })
    ).toContainText(`${PREFIX}배우`);

    await page.getByRole('button', { name: '배역 추가' }).click();
    const dialog = page.getByRole('dialog', { name: '배역 추가' });
    await expect(dialog.getByLabel('출연(배역 없음) 묶음')).toBeDisabled();
    await expect(
      dialog.getByText('출연 묶음은 하나만 만들 수 있습니다.')
    ).toBeVisible();
  });

  test('회차가 없으면 격자 대신 안내, 회차가 있으면 칸을 지정·해제한다', async ({
    page,
    request,
  }) => {
    const { performanceId, actorId } = await setup(request);
    await page.goto(`/performances/${performanceId}/cast`);
    await expect(
      page.getByText('회차·예매 탭에서 회차를 먼저 추가해주세요.')
    ).toBeVisible();

    const role = await adminApi<Created>(
      request,
      'POST',
      `/admin/performances/${performanceId}/roles`,
      { name: `${PREFIX}제라드` }
    );
    await adminApi(request, 'POST', `/admin/members/${actorId}/cast-roles`, {
      performanceId,
      roleId: role.id,
    });
    await adminApi(
      request,
      'POST',
      `/admin/performances/${performanceId}/shows`,
      {
        showDate: '2026-12-12',
        startTime: '14:00',
      }
    );
    await page.reload();

    const cellButton = page
      .getByRole('button', {
        name: `12/12 (토) 14:00 ${PREFIX}제라드 캐스트 고르기`,
      })
      .filter({ visible: true });
    await expect(cellButton).toContainText('기본');
    await cellButton.click();
    const picker = page.getByRole('dialog', { name: /12\/12/ });
    await expect(picker.getByText('기본 캐스트')).toBeVisible();
    await picker.getByRole('button', { name: '저장' }).click();
    await expect(picker).toBeHidden();

    const clear = page
      .getByRole('button', {
        name: `12/12 (토) 14:00 ${PREFIX}제라드 회차 지정 해제`,
      })
      .filter({ visible: true });
    await expect(clear).toBeVisible();
    await clear.click();
    await expect(clear).toBeHidden();
  });

  test('참여자 — 직함 필수, 이름만 입력으로 추가하고 노출 스위치·삭제가 된다', async ({
    page,
    request,
  }) => {
    const { performanceId } = await setup(request);
    await page.goto(`/performances/${performanceId}/cast`);

    await page.getByRole('button', { name: '참여자 추가' }).click();
    const dialog = page.getByRole('dialog', { name: '참여자 추가' });
    await dialog.getByRole('button', { name: '추가' }).click();
    await expect(dialog.getByText('직함을 입력해주세요')).toBeVisible();
    await dialog
      .getByPlaceholder('예: 연출, 조연출, 연출 및 음악감독')
      .fill('음악감독');
    await dialog.getByLabel('이름만 입력').check();
    await dialog.getByRole('textbox', { name: '이름' }).fill(`${PREFIX}이름`);
    await dialog.getByRole('button', { name: '추가' }).click();
    await expect(dialog).toBeHidden();

    const credits = page.getByRole('region', { name: '참여자' });
    const row = credits.getByRole('listitem', {
      name: `음악감독 ${PREFIX}이름`,
    });
    await expect(row.getByText('공개 안 됨 — 공개 스위치 꺼짐')).toBeVisible();
    await row.getByRole('switch', { name: '음악감독 노출' }).click();
    await expect(
      row.getByRole('switch', { name: '음악감독 노출' })
    ).toBeChecked();

    await row.getByRole('button', { name: '음악감독 삭제' }).click();
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: '삭제' })
      .click();
    await expect(credits.getByText('등록된 참여자가 없습니다')).toBeVisible();
  });
});

test.describe('SCR-D05 배우 쪽 SAM 출연작(CA-1 · CA-5 · CA-8)', () => {
  test.beforeEach(async ({ request }) => {
    await resetMock(request);
  });

  test('배역 없이 저장하면 "출연"으로 묶이고 D14 에도 같은 데이터로 보인다, 참여 직함은 D14 참여자가 된다', async ({
    page,
    request,
  }) => {
    const { performanceId, actorId } = await setup(request);
    await page.goto(`/members?member=${actorId}`);
    const sam = page
      .getByRole('region', { name: 'SAM 출연작' })
      .filter({ visible: true });

    await sam.getByRole('button', { name: 'SAM 출연작 추가' }).click();
    await sam.getByRole('combobox', { name: '작품' }).click();
    await page.getByRole('option', { name: `${PREFIX}작품` }).click();
    await sam.getByRole('textbox', { name: '새 배역 추가' }).waitFor();
    await sam.getByRole('button', { name: '저장' }).click();
    await expect(sam.getByRole('listitem')).toContainText(`${PREFIX}작품`);
    await expect(sam.getByRole('listitem')).toContainText('출연');

    const credits = page
      .getByRole('region', { name: '참여 직함' })
      .filter({ visible: true });
    await credits.getByRole('button', { name: '참여 직함 추가' }).click();
    await credits.getByRole('combobox', { name: '작품' }).click();
    await page.getByRole('option', { name: `${PREFIX}작품` }).click();
    await credits.getByRole('textbox', { name: '직함' }).fill('조연출');
    await credits.getByRole('button', { name: '저장' }).click();
    await expect(credits.getByRole('listitem')).toContainText('조연출');

    await page.goto(`/performances/${performanceId}/cast`);
    await expect(
      rolesSection(page).getByRole('listitem', { name: '출연' })
    ).toContainText(`${PREFIX}배우`);
    await expect(
      page.getByRole('region', { name: '참여자' }).getByRole('listitem')
    ).toContainText('조연출');
  });
});

test.describe('SCR-D09 연출진 연혁(T-3)', () => {
  test.beforeEach(async ({ request }) => {
    await resetMock(request);
  });

  test('연혁을 추가·순서 변경해 저장하면 같은 순서로 남고 목록에 개수가 보인다', async ({
    page,
    request,
    isMobile,
  }) => {
    await adminApi(request, 'POST', '/admin/staff', {
      name: `${PREFIX}연출가`,
      role: '연출',
    });
    await page.goto('/staff');
    await page
      .getByRole('button', { name: '연출진 수정' })
      .filter({ visible: true })
      .first()
      .click();
    const dialog = page.getByRole('dialog', { name: '연출진 수정' });

    await dialog.getByRole('button', { name: '연혁 추가' }).click();
    await dialog.getByRole('button', { name: '연혁 추가' }).click();
    await dialog.getByRole('textbox', { name: '연도 1' }).fill('2019');
    await dialog.getByRole('textbox', { name: '내용 1' }).fill('첫 연출');
    await dialog.getByRole('textbox', { name: '연도 2' }).fill('2024');
    await dialog.getByRole('textbox', { name: '내용 2' }).fill('최근 연출');
    await dialog.getByRole('button', { name: '위로 2' }).click();
    await dialog.getByRole('button', { name: '저장' }).click();
    await expect(dialog).toBeHidden();

    if (!isMobile) await expect(page.getByText('연혁 2개')).toBeVisible();
    const staff = await adminApi<{
      items: { histories: { year: number; content: string }[] }[];
    }>(request, 'GET', '/admin/staff');
    expect(staff.items[0].histories).toEqual([
      { year: 2024, content: '최근 연출' },
      { year: 2019, content: '첫 연출' },
    ]);
  });

  test('연도가 잘못되면 저장을 막고 안내한다', async ({ page, request }) => {
    await adminApi(request, 'POST', '/admin/staff', {
      name: `${PREFIX}연출가`,
      role: '연출',
    });
    await page.goto('/staff');
    await page
      .getByRole('button', { name: '연출진 수정' })
      .filter({ visible: true })
      .first()
      .click();
    const dialog = page.getByRole('dialog', { name: '연출진 수정' });
    await dialog.getByRole('button', { name: '연혁 추가' }).click();
    await dialog.getByRole('textbox', { name: '연도 1' }).fill('24');
    await dialog.getByRole('textbox', { name: '내용 1' }).fill('내용');
    await dialog.getByRole('button', { name: '저장' }).click();

    await expect(
      dialog.getByText('연도(4자리)와 내용을 확인해주세요.')
    ).toBeVisible();
  });
});
