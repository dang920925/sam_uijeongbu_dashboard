// ----------------------------------------------------------------------
// 헤더 '예매번호로 찾기'(design §6.1a · develop §11.4 U24 보강 S43) — 1건이면 상세 드로어, 여러 건이면 목록,
// 0건이면 문구, xs 는 아이콘 → 헤더 전체 폭 입력으로 펼침.
// 픽스처: 공연 → 회차(2099-12-12) → 등급 → 목 예매(`__mock/booking/reservation`, code 지정).
// ----------------------------------------------------------------------
import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';

import { adminApi, resetMock } from '@/e2e-pw/support/mock-api';

const PREFIX = 'fixture-r1-w4-';
const DAY_MS = 24 * 60 * 60 * 1000;

interface Created {
  id: string;
}

/** 공연 1개 + 회차 1개 + 등급 1개를 만들고 code 로 예매 1건 */
async function reservationIn(
  request: APIRequestContext,
  title: string,
  code: string,
  startTime: string
): Promise<{ performanceId: string }> {
  const performance = await adminApi<Created>(
    request,
    'POST',
    '/admin/performances',
    {
      title: `${PREFIX}${title}`,
      type: 'PLAY',
      status: 'UPCOMING',
      description: `${PREFIX}설명`,
      isVisible: false,
    }
  );
  const show = await adminApi<Created>(
    request,
    'POST',
    `/admin/performances/${performance.id}/shows`,
    {
      showDate: '2099-12-12',
      startTime,
      venue: `${PREFIX}소극장`,
      totalSeats: 20,
      bookingOpenAt: new Date(Date.now() - DAY_MS).toISOString(),
    }
  );
  const tier = await adminApi<Created>(
    request,
    'POST',
    `/admin/performances/${performance.id}/price-tiers`,
    { name: '일반', price: 10000, visibility: 'PUBLIC' }
  );
  await adminApi(request, 'POST', '/__mock/booking/reservation', {
    showId: show.id,
    bookerName: `${PREFIX}예매자`,
    bookerPhone: '010-1111-2222',
    items: [{ tierId: tier.id, quantity: 2 }],
    code,
  });
  return { performanceId: performance.id };
}

async function search(page: Page, isMobile: boolean, value: string) {
  if (isMobile)
    await page.getByRole('button', { name: '예매번호로 찾기' }).click();
  const input = page.getByRole('combobox', { name: '예매번호로 찾기' });
  await input.fill(value);
  await input.press('Enter');
  return input;
}

test.describe('헤더 예매번호로 찾기', () => {
  test.beforeEach(async ({ request }) => {
    await resetMock(request);
  });

  test('1건이면 바로 예매 상세 드로어가 열리고 "예매 관리에서 보기"가 그 예매를 가리킨다', async ({
    page,
    request,
    isMobile,
  }) => {
    // Arrange
    const { performanceId } = await reservationIn(
      request,
      '단건공연',
      '4711',
      '14:00'
    );
    await page.goto('/');
    // Act
    await search(page, isMobile, '4711');
    // Assert
    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText('4711');
    await expect(drawer).toContainText(`${PREFIX}예매자`);
    await expect(
      drawer.getByRole('button', { name: '입금 확인' })
    ).toBeVisible();
    await expect(
      drawer.getByRole('link', { name: '예매 관리에서 보기' })
    ).toHaveAttribute(
      'href',
      `/reservations?performanceId=${performanceId}&q=4711`
    );
  });

  test('여러 건이면 입력 아래 목록(공연·회차 / 이름·등급 / 상태)에서 고르면 드로어가 열린다', async ({
    page,
    request,
    isMobile,
  }) => {
    // Arrange — 번호는 공연 안에서만 유일하다(J-35)
    await reservationIn(request, '첫공연', '4711', '14:00');
    await reservationIn(request, '둘째공연', '4711', '17:00');
    await reservationIn(request, '다른번호공연', '5822', '19:00');
    await page.goto('/');
    // Act
    const input = await search(page, isMobile, '4711');
    // Assert
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText('예매번호 4711 · 2건')).toBeVisible();
    const list = page.getByRole('listbox', { name: '예매번호 찾기 결과' });
    const options = list.getByRole('option');
    await expect(options).toHaveCount(2);
    await expect(
      options.filter({ hasText: `${PREFIX}첫공연 · 12/12 14:00` })
    ).toContainText(`${PREFIX}예매자 · 일반 2`);
    await expect(
      options.filter({ hasText: `${PREFIX}둘째공연 · 12/12 17:00` })
    ).toContainText('입금 대기');
    const box = await options.first().boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);

    await options.filter({ hasText: '둘째공연' }).click();
    await expect(list).toBeHidden();
    await expect(page.getByRole('dialog')).toContainText(`${PREFIX}둘째공연`);
  });

  test('0건이면 "일치하는 예매가 없습니다", 4자리가 아니면 안내를 보이고 요청하지 않는다', async ({
    page,
    request,
    isMobile,
  }) => {
    // Arrange
    await reservationIn(request, '없는번호공연', '4711', '14:00');
    let searched = 0;
    page.on('request', (req) => {
      if (req.url().includes('/admin/reservations?')) searched += 1;
    });
    await page.goto('/');
    // Act
    const input = await search(page, isMobile, '12');
    // Assert
    await expect(page.getByText('예매번호 4자리를 입력해주세요')).toBeVisible();
    expect(searched).toBe(0);
    await input.fill('9876');
    await input.press('Enter');
    await expect(
      page.getByRole('status').filter({ hasText: '일치하는 예매가 없습니다' })
    ).toBeVisible();
    expect(searched).toBe(1);
    await input.press('Escape');
    await expect(page.getByText('일치하는 예매가 없습니다')).toBeHidden();
  });

  test('xs 는 돋보기 버튼으로 헤더 전체 폭 입력을 펼치고 ←로 닫는다', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'xs 전용 동작');
    // Arrange
    await page.goto('/');
    const open = page.getByRole('button', { name: '예매번호로 찾기' });
    const input = page.getByRole('combobox', { name: '예매번호로 찾기' });
    await expect(input).toBeHidden();
    const openBox = await open.boundingBox();
    expect(openBox?.height ?? 0).toBeGreaterThanOrEqual(44);
    // Act
    await open.click();
    // Assert
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();
    await expect(input).toHaveAttribute('inputmode', 'numeric');
    await expect(input).toHaveAttribute('maxlength', '4');
    const header = await page.locator('header').boundingBox();
    const inputBox = await input.boundingBox();
    expect(inputBox?.width ?? 0).toBeGreaterThan((header?.width ?? 0) * 0.6);
    await page.getByRole('button', { name: '찾기 닫기' }).click();
    await expect(input).toBeHidden();
    await expect(open).toBeFocused();
  });

  test('md↑ 는 헤더 오른쪽에 입력이 늘 있다', async ({ page, isMobile }) => {
    test.skip(isMobile, 'md↑ 전용 동작');
    // Arrange · Act
    await page.goto('/performances');
    // Assert
    const input = page.getByRole('combobox', { name: '예매번호로 찾기' });
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('placeholder', '예매번호로 찾기');
    await expect(
      page.getByRole('search', { name: '예매번호로 찾기' })
    ).toBeVisible();
  });
});
