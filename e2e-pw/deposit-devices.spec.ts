// ----------------------------------------------------------------------
// U43 SCR-D15 '입금 알림 기기' 카드(지휘자 설계, 사용자 결정 2026-11-23) — 목 백엔드.
// ① 일반 브라우저: 등록 버튼 없이 "앱 안에서 등록하세요" 안내만 ② 앱 WebView(User-Agent 끝 SAMAdmin/<버전>): 버튼 →
//   이름 확인(기본 "관리자 폰") → 등록 → samadmin://pair?token&name 으로 이동(토큰은 화면에 없음) ③ 목록 · 등록 해제.
// 딥링크 이동은 Navigation API 의 navigate 이벤트로 가로채 기록한다(실제 외부 프로토콜 실행 없음).
// ----------------------------------------------------------------------
import { expect, test, type Page } from '@playwright/test';

import { adminApi, resetMock } from '@/e2e-pw/support/mock-api';

const PREFIX = 'fixture-u43-';
const APP_UA =
  'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0 Mobile Safari/537.36 SAMAdmin/1.1.0';
const PAIR_BUTTON = '이 폰을 입금 알림 기기로 등록';

/** samadmin:// 이동을 막고 주소를 window.__pairLinks 에 남긴다 */
async function capturePairLinks(page: Page) {
  await page.addInitScript(() => {
    const links: string[] = [];
    (window as unknown as { __pairLinks: string[] }).__pairLinks = links;
    const nav = (
      window as unknown as {
        navigation?: {
          addEventListener: (
            type: 'navigate',
            listener: (event: {
              destination: { url: string };
              preventDefault: () => void;
            }) => void
          ) => void;
        };
      }
    ).navigation;
    nav?.addEventListener('navigate', (event) => {
      if (event.destination.url.startsWith('samadmin:')) {
        links.push(event.destination.url);
        event.preventDefault();
      }
    });
  });
}

function pairLinks(page: Page): Promise<string[]> {
  return page.evaluate(
    () => (window as unknown as { __pairLinks: string[] }).__pairLinks
  );
}

function card(page: Page) {
  return page.getByRole('region', { name: '입금 알림 기기' });
}

test.beforeEach(async ({ request }) => {
  await resetMock(request);
});

test('일반 브라우저에서는 등록 버튼 없이 앱에서 등록하라고만 안내하고, 목록·해제는 된다', async ({
  page,
  request,
}) => {
  await adminApi(request, 'POST', '/admin/deposit-devices', {
    name: `${PREFIX}예비 폰`,
  });
  await page.goto('/account');

  await expect(
    card(page).getByText("안드로이드 앱 'SAM 의정부 관리' 안에서 등록하세요.")
  ).toBeVisible();
  await expect(
    card(page).getByRole('button', { name: PAIR_BUTTON })
  ).toHaveCount(0);
  await expect(card(page).getByText(`${PREFIX}예비 폰`)).toBeVisible();
  await expect(card(page).getByText('아직 받은 알림이 없습니다')).toBeVisible();

  await card(page)
    .getByRole('button', { name: `${PREFIX}예비 폰 등록 해제` })
    .click();
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: '등록 해제' })
    .click();

  await expect(
    page.getByText('입금 알림 기기 등록을 해제했습니다.')
  ).toBeVisible();
  await expect(
    card(page).getByText('아직 등록된 기기가 없습니다.')
  ).toBeVisible();
});

test.describe('앱 WebView(SAMAdmin User-Agent)', () => {
  test.use({ userAgent: APP_UA });

  test('등록 버튼 → 이름 확인 → 등록하면 토큰을 화면에 보이지 않고 딥링크로 이동한다', async ({
    page,
    request,
  }) => {
    await capturePairLinks(page);
    await page.goto('/account');

    await expect(
      card(page).getByText("안드로이드 앱 'SAM 의정부 관리' 안에서 등록하세요.")
    ).toHaveCount(0);
    await card(page).getByRole('button', { name: PAIR_BUTTON }).click();
    const dialog = page.getByRole('dialog', { name: '입금 알림 기기 등록' });
    const nameInput = dialog.getByRole('textbox', { name: '기기 이름' });
    await expect(nameInput).toHaveValue('관리자 폰');
    await nameInput.fill(`${PREFIX}폰`);
    await dialog.getByRole('button', { name: '등록', exact: true }).click();

    await expect.poll(() => pairLinks(page)).toHaveLength(1);
    const [link] = await pairLinks(page);
    expect(link.startsWith('samadmin://pair?')).toBe(true);
    const query = new URLSearchParams(link.slice('samadmin://pair?'.length));
    const token = query.get('token') ?? '';
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(query.get('name')).toBe(`${PREFIX}폰`);
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText(token);
    await expect(card(page).getByText(`${PREFIX}폰`)).toBeVisible();
    const list = await adminApi<{ items: { name: string }[] }>(
      request,
      'GET',
      '/admin/deposit-devices'
    );
    expect(list.items.map((item) => item.name)).toEqual([`${PREFIX}폰`]);
  });

  test('이름을 비우면 등록하지 않고, 5대면 버튼이 잠기고 상한 안내가 보인다', async ({
    page,
    request,
  }) => {
    await capturePairLinks(page);
    await page.goto('/account');
    await card(page).getByRole('button', { name: PAIR_BUTTON }).click();
    const dialog = page.getByRole('dialog', { name: '입금 알림 기기 등록' });
    await dialog.getByRole('textbox', { name: '기기 이름' }).fill('   ');
    await dialog.getByRole('button', { name: '등록', exact: true }).click();
    await expect(
      dialog.getByText('기기 이름은 1~40자로 입력해주세요.')
    ).toBeVisible();
    expect(await pairLinks(page)).toEqual([]);
    await dialog.getByRole('button', { name: '취소' }).click();

    for (let i = 0; i < 5; i += 1) {
      await adminApi(request, 'POST', '/admin/deposit-devices', {
        name: `${PREFIX}${i}`,
      });
    }
    await page.reload();

    await expect(
      card(page).getByRole('button', { name: PAIR_BUTTON })
    ).toBeDisabled();
    await expect(
      card(page).getByText(
        '기기는 5대까지 등록할 수 있습니다. 쓰지 않는 기기를 먼저 해제해주세요.'
      )
    ).toBeVisible();
  });
});
