// ----------------------------------------------------------------------
// v1.2.0 배포 묶음 겹치는 영역 연동(리드) — INT_SCENARIO=v120 별도 실행에서만 돈다.
// - 계정 설정(SCR-D15): 계정 변경(T-SA 이전 R1) 카드와 U37 '예매 알림' 카드가 한 화면에서 함께 동작하고,
//   알림 카드는 실서버 VAPID 공개키를 BFF 로 받는다(세션 자동 연장 BFF 와 같은 경로).
// - 예매 접수 → 새 예매 푸시: 로컬 목 푸시 서비스(https, INT_PUSH_ENDPOINT — 서버는 NODE_EXTRA_CA_CERTS 로 신뢰)를
//   구독으로 DB 에 직접 넣고(API 는 알려진 푸시 호스트만 받으므로 — SSRF 방어 그대로), 공개 예매를 접수하면
//   서버가 커밋 뒤 VAPID 서명·aes128gcm 암호 본문으로 POST 하는지 목 로그(INT_PUSH_LOG)로 본다.
// ----------------------------------------------------------------------
import { createECDH, randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

import { expect, test } from '@playwright/test';

import {
  adminApi,
  cleanupFixtures,
  FIXTURE_BASE,
  fixturePrefix,
  relayPost,
} from '@/e2e-pw/integration/support/integration-api';

const SCENARIO = process.env.INT_SCENARIO;
const PREFIX = fixturePrefix('v120');

function psql(sql: string): string {
  return execFileSync(
    'docker',
    [
      'exec',
      '-i',
      process.env.INT_DB_CONTAINER ?? 'sam-uijeongbu-db-int',
      'psql',
      '-U',
      'postgres',
      '-d',
      process.env.INT_DB_NAME ?? 'sam_uijeongbu',
      '-At',
      '-v',
      'ON_ERROR_STOP=1',
    ],
    { input: sql }
  ).toString();
}

function pushLog(): {
  path: string;
  vapid: boolean;
  ttl: string;
  encoding: string;
  bytes: number;
}[] {
  const file = process.env.INT_PUSH_LOG ?? '';
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as never);
}

test.describe('v1.2.0 겹치는 영역', () => {
  test.skip(SCENARIO !== 'v120', 'INT_SCENARIO=v120 실행 전용');
  test.describe.configure({ mode: 'serial' });
  test.beforeAll(() => cleanupFixtures(FIXTURE_BASE));
  test.afterAll(() => {
    psql(`DELETE FROM push_subscriptions WHERE endpoint LIKE '%${PREFIX}%';`);
    cleanupFixtures(FIXTURE_BASE);
  });

  test('계정 설정: 계정 카드와 예매 알림 카드가 함께 보이고 알림 카드는 실서버 공개키를 받는다', async ({
    page,
  }) => {
    const publicKey = page.waitForResponse((res) =>
      res.url().endsWith('/api/backend/v1/admin/push/public-key')
    );
    await page.goto('/account');
    expect((await publicKey).status()).toBe(200);
    await expect(page.getByText('예매 알림', { exact: true })).toBeVisible();
    await expect(page.getByLabel('새 아이디')).toBeVisible();
  });

  test('공개 예매 접수 뒤 서버가 구독 기기로 VAPID 서명 푸시를 보낸다(목 푸시 서비스)', async () => {
    // Arrange — 예매가 열린 공연·회차·등급
    const performance = await adminApi<{ id: string }>(
      'POST',
      '/admin/performances',
      {
        title: `${PREFIX}작품`,
        type: 'PLAY',
        status: 'ONGOING',
        description: null,
        posterImageUrl: null,
        detailImageUrls: [],
        isVisible: true,
      }
    );
    const date = new Date(Date.now() + 9 * 3600_000 + 10 * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const show = await adminApi<{ id: string }>(
      'POST',
      `/admin/performances/${performance.id}/shows`,
      {
        showDate: date,
        startTime: '19:00',
        endTime: '21:00',
        venue: `${PREFIX}극장`,
        totalSeats: 20,
        bookingEnabled: true,
        // 오픈 시각이 지나야 OPEN(없으면 NOT_READY → RSV_001)
        bookingOpenAt: new Date(Date.now() - 3600_000).toISOString(),
      }
    );
    await adminApi(
      'PUT',
      `/admin/performances/${performance.id}/booking-policy`,
      {
        depositBank: '국민',
        depositAccountNumber: '000-00-0000',
        depositAccountHolder: 'SAM',
        maxTicketsPerBooking: 4,
        depositDeadlineHours: 24,
        refundPolicyText: '공연 전날까지 환불',
      }
    );
    const tier = await adminApi<{ id: string }>(
      'POST',
      `/admin/performances/${performance.id}/price-tiers`,
      { name: '일반', price: 10000, visibility: 'PUBLIC', isActive: true }
    );
    // 구독 — 픽스처 관리자 기기(유효한 P-256 공개키 + 16바이트 auth 로 실제 암호화가 되게)
    const ecdh = createECDH('prime256v1');
    ecdh.generateKeys();
    const endpoint = `${process.env.INT_PUSH_ENDPOINT}/${PREFIX}device`;
    psql(`INSERT INTO push_subscriptions (id, admin_id, endpoint, p256dh, auth, user_agent)
      SELECT gen_random_uuid(), id, '${endpoint}', '${ecdh.getPublicKey().toString('base64url')}',
             '${randomBytes(16).toString('base64url')}', 'integration'
      FROM admins WHERE username = 'fixture-integration-admin';`);
    const before = pushLog().length;

    // Act
    const created = await relayPost('/reservations', {
      showId: show.id,
      items: [{ tierId: tier.id, quantity: 1 }],
      bookerName: `${PREFIX}예매자`,
      bookerPhone: '010-3300-0001',
      agreedToPrivacy: true,
      agreedToRefundPolicy: true,
    });
    expect(created.status, JSON.stringify(created.body)).toBe(201);

    // Assert — 커밋 뒤 발송(응답과 별개) — 몇 초 안에 목 서비스에 1건
    await expect
      .poll(() => pushLog().length - before, { timeout: 15_000 })
      .toBeGreaterThanOrEqual(1);
    const sent = pushLog().at(-1);
    expect(sent?.path).toContain(`${PREFIX}device`);
    expect(sent?.vapid).toBe(true);
    expect(sent?.encoding).toBe('aes128gcm');
    expect(Number(sent?.ttl)).toBeGreaterThan(0);
    expect(sent?.bytes).toBeGreaterThan(0);
  });
});
