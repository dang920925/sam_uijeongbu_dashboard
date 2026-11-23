// ----------------------------------------------------------------------
// R2 입금 알림 자동 확인 연동(리드, v1.3.1) — 실서버 + 로컬 DB + 로컬 https 목 푸시.
// INT_DEPOSIT_SECRET(서버 DEPOSIT_WEBHOOK_SECRET 과 같은 값)·INT_PUSH_ENDPOINT·INT_PUSH_LOG 가 있을 때만 돈다.
// - 웹훅(POST /internal/deposits, X-Deposit-Secret) → 판정 → 예매 확정(AUTO) → 관리자 기기로 VAPID 푸시(목 서비스 로그)
// - 금액이 모자라면 일부 입금(확정 안 함) → 예매 목록에 받은 금액 표시, '입금 알림' 탭에 판정·잔액 지운 본문
// - 비밀이 틀리면 숨김 404 · 저장 안 함
// 구독은 DB 에 직접 넣는다(API 는 알려진 푸시 호스트만 받는다 — SSRF 방어 그대로, release-v120 과 같은 방식).
// ----------------------------------------------------------------------
import { createECDH, randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';

import {
  adminApi,
  cleanupFixtures,
  fixturePrefix,
  INT_API_BASE_URL,
  relayPost,
} from '@/e2e-pw/integration/support/integration-api';

const PREFIX = fixturePrefix('r2');
const SECRET = process.env.INT_DEPOSIT_SECRET ?? '';
const PUSH_ENDPOINT = process.env.INT_PUSH_ENDPOINT ?? '';

interface Created {
  id: string;
}
interface Booked {
  code: string;
  depositorName: string;
  amount: number;
}
interface AdminItem {
  id: string;
  code: string;
  status: string;
  confirmedBy: string | null;
}

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

function pushLog(): { path: string; vapid: boolean; encoding: string }[] {
  const file = process.env.INT_PUSH_LOG ?? '';
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as never);
}
const devicePushes = () =>
  pushLog().filter((p) => p.path.includes(`${PREFIX}device`));

function kstDate(days: number): string {
  return new Date(Date.now() + 9 * 3600_000 + days * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

async function postDeposit(text: string, secret = SECRET) {
  const response = await fetch(`${INT_API_BASE_URL}/api/v1/internal/deposits`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-deposit-secret': secret },
    body: JSON.stringify({
      appPackage: 'com.kakaobank.channel',
      appName: '카카오뱅크',
      title: '입금',
      text,
    }),
  });
  const body = await response.text();
  return {
    status: response.status,
    body: (body ? JSON.parse(body) : {}) as { id: string; status: string },
  };
}

test.describe('R2 입금 알림 자동 확인 — 실서버', () => {
  test.skip(
    !SECRET || !PUSH_ENDPOINT,
    'INT_DEPOSIT_SECRET·INT_PUSH_ENDPOINT 가 있는 실행 전용'
  );
  test.describe.configure({ mode: 'serial' });

  let performanceId = '';
  let full: Booked;
  let partial: Booked;
  const findItem = async (code: string) =>
    (
      await adminApi<{ items: AdminItem[] }>(
        'GET',
        `/admin/reservations?performanceId=${performanceId}&q=${code}`
      )
    ).items.find((i) => i.code === code) as AdminItem;

  test.beforeAll(async () => {
    cleanupFixtures(PREFIX);
    performanceId = (
      await adminApi<Created>('POST', '/admin/performances', {
        title: `${PREFIX}공연`,
        type: 'PLAY',
        status: 'ONGOING',
        description: null,
        posterImageUrl: null,
        detailImageUrls: [],
        isVisible: true,
      })
    ).id;
    await adminApi(
      'PUT',
      `/admin/performances/${performanceId}/booking-policy`,
      {
        depositBank: '국민',
        depositAccountNumber: '000-00-0000',
        depositAccountHolder: 'SAM',
        maxTicketsPerBooking: 4,
        depositDeadlineHours: 24,
        refundPolicyText: '공연 전날까지 환불',
      }
    );
    await adminApi(
      'PUT',
      `/admin/performances/${performanceId}/inviter-prices`,
      {
        base: 20000,
        samRelated: 10000,
      }
    );
    const show = await adminApi<Created>(
      'POST',
      `/admin/performances/${performanceId}/shows`,
      {
        showDate: kstDate(10),
        startTime: '19:00',
        totalSeats: 30,
        bookingOpenAt: new Date(Date.now() - 3600_000).toISOString(),
      }
    );
    const book = async (n: number) => {
      const res = await relayPost('/reservations', {
        showId: show.id,
        quantity: 1,
        inviter: { kind: 'STAFF_RELATED' },
        bookerName: `입금자${n}`,
        bookerPhone: `010-3132-000${n}`,
        agreedToPrivacy: true,
        agreedToRefundPolicy: true,
      });
      expect(res.status, JSON.stringify(res.body)).toBe(201);
      return res.body as Booked;
    };
    full = await book(1);
    partial = await book(2);
    // 픽스처 관리자 기기 구독 — 유효한 P-256 공개키 + 16바이트 auth(실제 암호화가 되게)
    const ecdh = createECDH('prime256v1');
    ecdh.generateKeys();
    psql(`INSERT INTO push_subscriptions (id, admin_id, endpoint, p256dh, auth, user_agent)
      SELECT gen_random_uuid(), id, '${PUSH_ENDPOINT}/${PREFIX}device',
             '${ecdh.getPublicKey().toString('base64url')}',
             '${randomBytes(16).toString('base64url')}', 'integration'
      FROM admins WHERE username = 'fixture-integration-admin';`);
  });

  test.afterAll(() => {
    psql(`DELETE FROM push_subscriptions WHERE endpoint LIKE '%${PREFIX}%';`);
    // 이 파일의 입금 알림은 모두 예매에 연결돼 예매 삭제(정리)에 CASCADE 로 함께 지워진다
    cleanupFixtures(PREFIX);
  });

  test('비밀이 틀리면 숨김 404 이고 저장하지 않는다', async () => {
    const res = await postDeposit(
      `${full.depositorName}님이 20,000원을 보내셨습니다`,
      'x'.repeat(44)
    );
    expect(res.status).toBe(404);
    expect((await findItem(full.code)).status).toBe('PENDING');
  });

  test('입금자명·금액 일치 → 202 AUTO_CONFIRMED → 예매 확정(AUTO) → 관리자 기기로 VAPID 푸시', async () => {
    // Arrange
    expect(full.amount).toBe(20000);
    const before = devicePushes().length;
    // Act
    const res = await postDeposit(
      `${full.depositorName}님이 20,000원을 보내셨습니다 잔액 1,234,000원`
    );
    // Assert
    expect(res.status).toBe(202);
    expect(res.body.status).toBe('AUTO_CONFIRMED');
    expect(await findItem(full.code)).toMatchObject({
      status: 'CONFIRMED',
      confirmedBy: 'AUTO',
    });
    await expect
      .poll(() => devicePushes().length - before, { timeout: 15_000 })
      .toBeGreaterThanOrEqual(1);
    const sent = devicePushes().at(-1);
    expect(sent?.vapid).toBe(true);
    expect(sent?.encoding).toBe('aes128gcm');
  });

  test('금액이 모자라면 일부 입금 — 확정 안 함, 예매 목록에 받은 금액, 입금 알림 탭에 판정·잔액 지운 본문', async ({
    page,
  }) => {
    // Act
    const res = await postDeposit(
      `${partial.depositorName}님이 5,000원을 보내셨습니다 잔액 9,876,000원`
    );
    // Assert
    expect(res.status).toBe(202);
    expect(res.body.status).toBe('PARTIAL');
    expect((await findItem(partial.code)).status).toBe('PENDING');
    await page.goto(`/reservations?performanceId=${performanceId}`);
    await expect(
      page
        .locator(`[data-reservation-code="${partial.code}"]`)
        .filter({ visible: true })
    ).toContainText('받은 금액');
    await page.getByRole('tab', { name: '입금 알림' }).click();
    const list = page.getByText(`${partial.depositorName}님이 5,000원`).first();
    await expect(list).toBeVisible();
    await expect(page.getByText('일부 입금').first()).toBeVisible();
    await expect(page.getByText('입금 완료').first()).toBeVisible();
    await expect(page.getByText('9,876,000')).toHaveCount(0);
  });
});
