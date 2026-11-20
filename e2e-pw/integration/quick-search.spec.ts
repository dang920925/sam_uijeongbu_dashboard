// ----------------------------------------------------------------------
// 연동 헤더 '예매번호로 찾기'(design §6.1a · back-end §14.4 #1) — 실서버 GET /admin/reservations?q=<4자리>
// (performanceId 없음 — 삭제 안 된 전 공연, 최대 20건, 항목에 performanceId·performanceTitle 항상).
// - 1건: 바로 상세 드로어(공연명 = 서버 performanceTitle) → 입금 확인 → "예매 관리에서 보기" 링크.
// - 여러 건: 예매번호는 공연마다 따로 뽑혀 서로 다른 공연에서 같은 번호가 나야 한다 — 두 공연에 관리자 등록을 300건씩 만들어
//   (생일 문제 — 겹칠 확률 ≈ 1 − e^(−9) ≈ 99.99%) 겹친 번호로 찾는다. DB 를 직접 고치지 않는다.
// - 0건 문구 · 4자리가 아니면 화면이 요청 없이 안내 + 서버도 400 "공연을 고르거나 예매번호 4자리를 입력해주세요."
// ----------------------------------------------------------------------
import { expect, test, type Page } from '@playwright/test';

import {
  adminApi,
  cleanupFixtures,
  FIXTURE_BASE,
  fixturePrefix,
} from '@/e2e-pw/integration/support/integration-api';

const PREFIX = fixturePrefix('qs');
const DAY_MS = 24 * 60 * 60 * 1000;
const API = '/api/backend/v1';

interface Created {
  id: string;
}

interface Rsv {
  id: string;
  code: string;
  performanceId: string;
  performanceTitle: string;
  status: string;
}

function kstDate(offsetDays: number): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(
    new Date(Date.now() + offsetDays * DAY_MS)
  );
}

/** 공연 + 회차(좌석 미정 — 수동 등록 제한 없음) + 등급 */
async function performanceWithShow(
  tag: string,
  startTime: string
): Promise<{ performanceId: string; showId: string; tierId: string }> {
  const perf = await adminApi<Created>('POST', '/admin/performances', {
    title: `${PREFIX}${tag}`,
    type: 'PLAY',
    status: 'UPCOMING',
    description: `${PREFIX}설명`,
    isVisible: false,
  });
  const show = await adminApi<Created>(
    'POST',
    `/admin/performances/${perf.id}/shows`,
    {
      showDate: kstDate(20),
      startTime,
      venue: `${PREFIX}소극장`,
      totalSeats: null,
      bookingOpenAt: new Date(Date.now() - DAY_MS).toISOString(),
    }
  );
  const tier = await adminApi<Created>(
    'POST',
    `/admin/performances/${perf.id}/price-tiers`,
    { name: 'W2일반', price: 10000, visibility: 'PUBLIC' }
  );
  return { performanceId: perf.id, showId: show.id, tierId: tier.id };
}

function register(showId: string, tierId: string, name: string) {
  return adminApi<Rsv>('POST', '/admin/reservations', {
    showId,
    bookerName: `${PREFIX}${name}`,
    bookerPhone: '010-4000-0001',
    items: [{ tierId, quantity: 2 }],
    status: 'PENDING',
  });
}

/** n건 수동 등록(20건씩 동시) → 예매번호 목록 */
async function registerMany(
  showId: string,
  tierId: string,
  n: number
): Promise<string[]> {
  const codes: string[] = [];
  for (let start = 0; start < n; start += 20) {
    const batch = await Promise.all(
      Array.from({ length: Math.min(20, n - start) }, () =>
        adminApi<Rsv>('POST', '/admin/reservations', {
          showId,
          bookerName: `${PREFIX}다건`,
          customLine: { quantity: 1, amount: 0 },
          status: 'PENDING',
        })
      )
    );
    codes.push(...batch.map((r) => r.code));
  }
  return codes;
}

async function search(page: Page, value: string) {
  const input = page.getByRole('combobox', { name: '예매번호로 찾기' });
  await input.fill(value);
  await input.press('Enter');
  return input;
}

test.beforeAll(() => cleanupFixtures(FIXTURE_BASE));
test.afterAll(() => cleanupFixtures(FIXTURE_BASE));

test.describe.configure({ mode: 'serial' });

test.describe('연동 헤더 예매번호로 찾기', () => {
  test('1건이면 서버 공연명과 함께 상세 드로어가 열리고, 입금 확인 · 예매 관리 링크가 그 예매를 가리킨다', async ({
    page,
  }) => {
    // Arrange
    const fx = await performanceWithShow('단건', '14:00');
    const rsv = await register(fx.showId, fx.tierId, '단건손님');
    // Assert — 서버: performanceId 없이 전 공연에서 찾고 공연 id·제목을 준다
    const api = await adminApi<{ items: Rsv[]; totalCount: number }>(
      'GET',
      `/admin/reservations?q=${rsv.code}`
    );
    expect(api.totalCount).toBe(1);
    expect(api.items[0]).toMatchObject({
      id: rsv.id,
      performanceId: fx.performanceId,
      performanceTitle: `${PREFIX}단건`,
    });
    // Act
    await page.goto('/');
    const request = page.waitForRequest((req) =>
      req.url().includes('/admin/reservations?')
    );
    await search(page, rsv.code);
    // Assert — 요청에 performanceId 가 없다
    const url = new URL((await request).url());
    expect(url.searchParams.get('q')).toBe(rsv.code);
    expect(url.searchParams.has('performanceId')).toBe(false);
    const drawer = page.getByRole('dialog', { name: `예매 ${rsv.code}` });
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText(`${PREFIX}단건`);
    await expect(drawer).toContainText(`${PREFIX}단건손님`);
    await expect(drawer).toContainText('010-4000-0001');
    await expect(drawer).toContainText('W2일반 2');
    await expect(
      drawer.getByRole('link', { name: '예매 관리에서 보기' })
    ).toHaveAttribute(
      'href',
      `/reservations?performanceId=${fx.performanceId}&q=${rsv.code}`
    );
    // Act — 드로어에서 입금 확인
    await drawer.getByRole('button', { name: '입금 확인' }).click();
    // Assert
    await expect(
      page.getByText(`${rsv.code} 입금을 확인했습니다.`)
    ).toBeVisible();
    await expect
      .poll(
        async () =>
          (
            await adminApi<{ items: Rsv[] }>(
              'GET',
              `/admin/reservations?q=${rsv.code}`
            )
          ).items[0]?.status
      )
      .toBe('CONFIRMED');
  });

  test('여러 공연에 같은 번호가 있으면 목록(공연명 · 회차)에서 고르고 드로어가 열린다', async ({
    page,
  }) => {
    test.setTimeout(180_000);
    // Arrange — 두 공연에 300건씩 → 겹친 번호
    const first = await performanceWithShow('첫공연', '14:00');
    const second = await performanceWithShow('둘째공연', '17:00');
    const firstCodes = new Set(
      await registerMany(first.showId, first.tierId, 300)
    );
    const secondCodes = await registerMany(second.showId, second.tierId, 300);
    const shared = secondCodes.find((code) => firstCodes.has(code));
    expect(shared, '두 공연에 같은 예매번호가 나지 않았습니다').toBeTruthy();
    const code = shared as string;
    // Assert — 서버는 두 공연 결과를 모두, 공연명과 함께 준다
    const api = await adminApi<{ items: Rsv[] }>(
      'GET',
      `/admin/reservations?q=${code}`
    );
    expect(api.items.map((r) => r.performanceTitle).sort()).toEqual(
      [`${PREFIX}둘째공연`, `${PREFIX}첫공연`].sort()
    );

    // Act
    await page.goto('/');
    const input = await search(page, code);
    // Assert
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText(`예매번호 ${code} · 2건`)).toBeVisible();
    const list = page.getByRole('listbox', { name: '예매번호 찾기 결과' });
    const options = list.getByRole('option');
    await expect(options).toHaveCount(2);
    const [, month, day] = kstDate(20).split('-').map(Number);
    await expect(
      options.filter({ hasText: `${PREFIX}첫공연 · ${month}/${day} 14:00` })
    ).toContainText(`${PREFIX}다건`);
    await expect(
      options.filter({ hasText: `${PREFIX}둘째공연 · ${month}/${day} 17:00` })
    ).toContainText('입금 대기');
    // Act
    await options.filter({ hasText: '둘째공연' }).click();
    // Assert
    await expect(list).toBeHidden();
    const drawer = page.getByRole('dialog', { name: `예매 ${code}` });
    await expect(drawer).toContainText(`${PREFIX}둘째공연`);
    await expect(
      drawer.getByRole('link', { name: '예매 관리에서 보기' })
    ).toHaveAttribute(
      'href',
      `/reservations?performanceId=${second.performanceId}&q=${code}`
    );
  });

  test('0건이면 "일치하는 예매가 없습니다", 4자리가 아니면 요청 없이 안내하고 서버도 400 이다', async ({
    page,
  }) => {
    // Arrange — 지금 어느 공연에도 없는 번호
    let unused = '';
    for (let n = 0; n < 10000 && !unused; n += 1) {
      const code = String(n).padStart(4, '0');
      const res = await adminApi<{ items: Rsv[] }>(
        'GET',
        `/admin/reservations?q=${code}`
      );
      if (res.items.length === 0) unused = code;
    }
    let searched = 0;
    page.on('request', (req) => {
      if (req.url().includes('/admin/reservations?')) searched += 1;
    });
    await page.goto('/');
    // Act — 2자리
    const input = await search(page, '12');
    // Assert
    await expect(page.getByText('예매번호 4자리를 입력해주세요')).toBeVisible();
    expect(searched).toBe(0);
    // Act — 없는 번호
    await input.fill(unused);
    await input.press('Enter');
    // Assert
    await expect(
      page.getByRole('status').filter({ hasText: '일치하는 예매가 없습니다' })
    ).toBeVisible();
    expect(searched).toBe(1);

    // Assert — BFF 를 거친 서버 400(공연 없이 4자리가 아님)
    const bad = await page.request.get(`${API}/admin/reservations?q=12`);
    expect(bad.status()).toBe(400);
    expect(await bad.json()).toMatchObject({
      code: 'COMMON_001',
      message: '공연을 고르거나 예매번호 4자리를 입력해주세요.',
    });
  });
});
