// ----------------------------------------------------------------------
// U37 대시보드 PWA + 새 예매 푸시(develop §21 · design §16) — SCR-D15 '예매 알림' 카드, 매니페스트, 서비스 워커.
// 브라우저 푸시(Notification·PushManager)는 테스트 브라우저에 푸시 서비스가 없어 addInitScript 로 흉내 낸다(구독 endpoint 는
// FCM 모양의 픽스처 주소). 서비스 워커(/sw.js)는 실제로 등록된다.
// 수용 기준: PU-5(알림 주소 → 그 예매 강조·상세) · PU-6(서비스 워커가 fetch 를 가로채지 않음) · PU-7(토글 끄면 구독 삭제).
// PU-1~4 는 서버 E2E(server test/push.e2e-spec.ts).
// ----------------------------------------------------------------------
import { expect, test, type Page } from '@playwright/test';

import { adminApi, resetMock } from '@/e2e-pw/support/mock-api';

const PREFIX = 'fixture-push-';
const ENDPOINT = `https://fcm.googleapis.com/fcm/send/${PREFIX}this-device`;
const OTHER_ENDPOINT = `https://fcm.googleapis.com/fcm/send/${PREFIX}other-device`;
const DAY_MS = 24 * 60 * 60 * 1000;
const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';

interface PushDeviceItem {
  endpoint: string;
}

/** 브라우저 푸시 흉내 — nextPermission 은 권한 요청에 돌려줄 값 */
async function fakeBrowserPush(
  page: Page,
  nextPermission: NotificationPermission
) {
  await page.addInitScript(
    ({ endpoint, next }) => {
      const state: {
        permission: NotificationPermission;
        subscription: unknown;
      } = {
        permission: 'default',
        subscription: null,
      };
      Object.defineProperty(Notification, 'permission', {
        get: () => state.permission,
      });
      Notification.requestPermission = () => {
        state.permission = next;
        return Promise.resolve(next);
      };
      PushManager.prototype.getSubscription = function () {
        return Promise.resolve(state.subscription as PushSubscription | null);
      };
      PushManager.prototype.subscribe = function (
        options?: PushSubscriptionOptionsInit
      ) {
        const key = options?.applicationServerKey as Uint8Array;
        const subscription = {
          endpoint,
          options: { applicationServerKey: key.slice().buffer },
          toJSON: () => ({
            endpoint,
            keys: { p256dh: 'BFixturePushP256dh', auth: 'fixturePushAuth' },
          }),
          unsubscribe: () => {
            state.subscription = null;
            return Promise.resolve(true);
          },
        };
        state.subscription = subscription;
        return Promise.resolve(subscription as unknown as PushSubscription);
      };
    },
    { endpoint: ENDPOINT, next: nextPermission }
  );
}

function card(page: Page) {
  return page.getByRole('region', { name: '예매 알림' });
}

async function openAccount(page: Page) {
  await page.goto('/account');
  await expect(
    card(page).getByRole('switch', { name: '이 기기에서 예매 알림 받기' })
  ).toBeVisible();
}

test.describe('U37 예매 알림(SCR-D15)', () => {
  test.beforeEach(async ({ request }) => {
    await resetMock(request);
  });

  test('토글을 켜면 이 기기가 등록되고 시험 알림을 보낼 수 있으며, 끄면 구독이 삭제된다(PU-7)', async ({
    page,
    request,
  }) => {
    // Arrange
    await fakeBrowserPush(page, 'granted');
    await openAccount(page);
    const toggle = card(page).getByRole('switch', {
      name: '이 기기에서 예매 알림 받기',
    });
    await expect(card(page)).toContainText('아직 알림을 받는 기기가 없습니다.');
    await expect(card(page)).toContainText(
      "iPhone 은 iOS 16.4 이상에서 '홈 화면에 추가'한 앱에서만 알림을 받을 수 있습니다."
    );
    // Act — 켜기
    await toggle.click();
    // Assert
    await expect(
      page.getByText('이 기기에서 예매 알림을 받습니다.')
    ).toBeVisible();
    await expect(toggle).toBeChecked();
    await expect(
      card(page).getByText('이 기기', { exact: true })
    ).toBeVisible();
    const after = await adminApi<{ items: PushDeviceItem[] }>(
      request,
      'GET',
      '/admin/push/subscriptions'
    );
    expect(after.items.map((d) => d.endpoint)).toEqual([ENDPOINT]);

    // Act — 시험 알림
    await card(page).getByRole('button', { name: '시험 알림 보내기' }).click();
    await expect(page.getByText('시험 알림을 보냈습니다. (1대)')).toBeVisible();

    // Act — 끄기
    await toggle.click();
    await expect(
      page.getByText('이 기기의 예매 알림을 껐습니다.')
    ).toBeVisible();
    await expect(toggle).not.toBeChecked();
    const end = await adminApi<{ items: PushDeviceItem[] }>(
      request,
      'GET',
      '/admin/push/subscriptions'
    );
    expect(end.items).toEqual([]);
  });

  test('다른 기기는 이름·등록일과 함께 보이고 삭제할 수 있다', async ({
    page,
    request,
  }) => {
    // Arrange
    await adminApi(request, 'POST', '/admin/push/subscriptions', {
      endpoint: OTHER_ENDPOINT,
      keys: { p256dh: 'BFixtureOther', auth: 'fixtureOther' },
      userAgent: IPHONE_UA,
    });
    await fakeBrowserPush(page, 'granted');
    await openAccount(page);
    const toggle = card(page).getByRole('switch', {
      name: '이 기기에서 예매 알림 받기',
    });
    await expect(toggle).not.toBeChecked();
    await expect(card(page)).toContainText('iPhone · Safari');
    // Act
    await card(page)
      .getByRole('button', { name: 'iPhone · Safari 알림 기기 삭제' })
      .click();
    // Assert
    await expect(page.getByText('알림 기기를 삭제했습니다.')).toBeVisible();
    await expect(card(page)).toContainText('아직 알림을 받는 기기가 없습니다.');
  });

  test('브라우저가 권한을 막으면 안내를 보이고 등록하지 않는다', async ({
    page,
    request,
  }) => {
    await fakeBrowserPush(page, 'denied');
    await openAccount(page);

    await card(page)
      .getByRole('switch', { name: '이 기기에서 예매 알림 받기' })
      .click();

    await expect(card(page).getByRole('alert')).toHaveText(
      '브라우저 설정에서 알림을 허용해주세요.'
    );
    const list = await adminApi<{ items: PushDeviceItem[] }>(
      request,
      'GET',
      '/admin/push/subscriptions'
    );
    expect(list.items).toEqual([]);
  });

  test('서버에서 푸시가 꺼져 있으면 토글·시험 알림을 잠그고 안내한다', async ({
    page,
    request,
  }) => {
    await request.post('/api/backend/v1/__mock/push-disabled');
    await fakeBrowserPush(page, 'granted');
    await openAccount(page);

    await expect(card(page).getByRole('alert')).toHaveText(
      '이 서버에서는 알림 기능이 꺼져 있습니다.'
    );
    await expect(
      card(page).getByRole('switch', { name: '이 기기에서 예매 알림 받기' })
    ).toBeDisabled();
    await expect(
      card(page).getByRole('button', { name: '시험 알림 보내기' })
    ).toBeDisabled();
  });

  test('알림 클릭 주소(공연 + 예매번호)로 열면 그 예매의 상세가 열린다(PU-5)', async ({
    page,
    request,
  }) => {
    // Arrange — 서버 알림 url 모양: /reservations?performanceId={id}&q={예매번호}
    const performance = await adminApi<{ id: string }>(
      request,
      'POST',
      '/admin/performances',
      {
        title: `${PREFIX}알림공연`,
        type: 'PLAY',
        status: 'UPCOMING',
        description: `${PREFIX}설명`,
        isVisible: false,
      }
    );
    const show = await adminApi<{ id: string }>(
      request,
      'POST',
      `/admin/performances/${performance.id}/shows`,
      {
        showDate: '2099-12-12',
        startTime: '14:00',
        venue: `${PREFIX}소극장`,
        totalSeats: 20,
        bookingOpenAt: new Date(Date.now() - DAY_MS).toISOString(),
      }
    );
    const tier = await adminApi<{ id: string }>(
      request,
      'POST',
      `/admin/performances/${performance.id}/price-tiers`,
      {
        name: '일반',
        price: 10000,
        visibility: 'PUBLIC',
      }
    );
    await adminApi(request, 'POST', '/__mock/booking/reservation', {
      showId: show.id,
      bookerName: `${PREFIX}예매자`,
      bookerPhone: '010-1111-2222',
      items: [{ tierId: tier.id, quantity: 2 }],
      code: '0420',
    });
    // Act
    await page.goto(`/reservations?performanceId=${performance.id}&q=0420`);
    // Assert
    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText('0420');
  });
});

test.describe('U37 PWA', () => {
  test('매니페스트는 로그인 없이 받을 수 있고 이름·standalone·아이콘을 담는다', async ({
    playwright,
    baseURL,
  }) => {
    const anonymous = await playwright.request.newContext({ baseURL });
    const response = await anonymous.get('/manifest.webmanifest');
    expect(response.status()).toBe(200);
    const manifest = (await response.json()) as {
      name: string;
      display: string;
      icons: { src: string; sizes: string }[];
    };
    expect(manifest.name).toBe('SAM 의정부 관리');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.map((icon) => icon.sizes)).toEqual([
      '192x192',
      '512x512',
      '180x180',
    ]);
    for (const icon of manifest.icons) {
      expect((await anonymous.get(icon.src)).status()).toBe(200);
    }
    expect((await anonymous.get('/sw.js')).status()).toBe(200);
    await anonymous.dispose();
  });

  test('서비스 워커가 페이지를 맡아도 오프라인이면 브라우저 기본 오류다 — fetch 가로채기·캐시 없음(PU-6)', async ({
    page,
    context,
  }) => {
    // Arrange — 계정 화면이 서비스 워커를 등록하고, activate 의 clients.claim 으로 이 페이지를 맡는다
    await fakeBrowserPush(page, 'granted');
    await openAccount(page);
    await page.waitForFunction(
      () => navigator.serviceWorker.controller !== null
    );
    // Act
    await context.setOffline(true);
    const navigation = page.goto('/account');
    // Assert
    await expect(navigation).rejects.toThrow(/ERR_INTERNET_DISCONNECTED/);
    await context.setOffline(false);
  });
});
