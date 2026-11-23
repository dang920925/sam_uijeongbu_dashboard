// ----------------------------------------------------------------------
// v1.3.1 연동(리드) — 실서버 + 로컬 DB. INT_SCENARIO 와 무관하게 돈다(팀 기능은 서버 TEAM_PASSWORD_KEY 필요).
// - U41 SCR-D11 가격 카드 저장 → 서버 GET inviter-prices · 회차 준비 상태(basePrice·samRelatedPrice) 해제
// - U41 공개 접수(SAM 관계자 · 캐스트 배우 · 연출/스태프) → SCR-D12 '초대한 사람' 열·적용 가격 · 필터(배우 + 입금 대기, IP-9) ·
//   집계 묶음 · SCR-D13 입장 명단 초대 줄(IP-7)
// - 일정 캘린더 '연습실 예약' 레이어 — 팀 로그인으로 넣은 연습실 예약이 빗금 칩으로 보이고 상세에서 삭제된다
// ----------------------------------------------------------------------
import { expect, test } from '@playwright/test';

import {
  adminApi,
  cleanupFixtures,
  FIXTURE_BASE,
  fixturePrefix,
  INT_API_BASE_URL,
  relayPost,
} from '@/e2e-pw/integration/support/integration-api';

const PREFIX = fixturePrefix('v131');
const RELAY = { 'x-relay-secret': process.env.INT_RELAY_SECRET ?? '' };

interface Created {
  id: string;
}
interface TeamItem {
  username: string;
  password: string | null;
}

/** 오늘(KST)+n 일 'YYYY-MM-DD' */
function kstDate(days: number): string {
  return new Date(Date.now() + 9 * 3600_000 + days * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

let phoneSeq = 0;
function book(showId: string, body: Record<string, unknown>) {
  phoneSeq += 1;
  return relayPost('/reservations', {
    showId,
    quantity: 1,
    bookerName: `${PREFIX}예매자${phoneSeq}`,
    bookerPhone: `010-3131-${String(phoneSeq).padStart(4, '0')}`,
    agreedToPrivacy: true,
    agreedToRefundPolicy: true,
    ...body,
  });
}

test.describe('v1.3.1 실서버', () => {
  test.describe.configure({ mode: 'serial' });
  test.beforeAll(() => cleanupFixtures(FIXTURE_BASE));
  test.afterAll(() => cleanupFixtures(FIXTURE_BASE));

  let performanceId = '';
  let showId = '';
  let actorId = '';
  const actorName = `${PREFIX}가배우`;
  const codes = { sam: '', actorPending: '', actorConfirmed: '', staff: '' };

  test('U41 가격 카드 저장 → 서버 가격 · 회차 준비 경고 해제(IP-5)', async ({
    page,
  }) => {
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
    showId = (
      await adminApi<Created>(
        'POST',
        `/admin/performances/${performanceId}/shows`,
        {
          showDate: kstDate(10),
          startTime: '19:00',
          totalSeats: 30,
          bookingOpenAt: new Date(Date.now() - 3600_000).toISOString(),
        }
      )
    ).id;
    const before = await adminApi<{ items: { missingFields: string[] }[] }>(
      'GET',
      `/admin/performances/${performanceId}/shows`
    );
    expect(before.items[0].missingFields).toEqual([
      'basePrice',
      'samRelatedPrice',
    ]);

    await page.goto(`/performances/${performanceId}/shows`);
    const card = page.getByTestId('inviter-price-card');
    await card.getByLabel('기본가').fill('20000');
    await card.getByLabel('SAM 관계자가').fill('10000');
    await card.getByRole('button', { name: '저장' }).click();
    await expect(page.getByText('저장되었습니다')).toBeVisible();

    expect(
      await adminApi(
        'GET',
        `/admin/performances/${performanceId}/inviter-prices`
      )
    ).toEqual({ base: 20000, samRelated: 10000 });
    const after = await adminApi<{
      items: { state: string; missingFields: string[] }[];
    }>('GET', `/admin/performances/${performanceId}/shows`);
    expect(after.items[0]).toMatchObject({ state: 'OPEN', missingFields: [] });
  });

  test('U41 공개 접수 → 예매 목록 초대한 사람·적용 가격 · 배우 + 입금 대기 필터(IP-9) · 입장 명단(IP-7)', async ({
    page,
  }) => {
    const actor = await adminApi<Created>('POST', '/admin/members', {
      name: actorName,
      type: 'ACTOR',
    });
    actorId = actor.id;
    await adminApi('POST', `/admin/members/${actorId}/cast-roles`, {
      performanceId,
    });
    const sam = await book(showId, {
      quantity: 2,
      inviter: { kind: 'SAM_RELATED' },
      samRelatedAcknowledged: true,
    });
    const pending = await book(showId, {
      inviter: { kind: 'MEMBER', memberId: actorId },
    });
    const confirmed = await book(showId, {
      inviter: { kind: 'MEMBER', memberId: actorId },
    });
    const staff = await book(showId, { inviter: { kind: 'STAFF_RELATED' } });
    for (const res of [sam, pending, confirmed, staff])
      expect(res.status, JSON.stringify(res.body)).toBe(201);
    codes.sam = (sam.body as { code: string }).code;
    codes.actorPending = (pending.body as { code: string }).code;
    codes.actorConfirmed = (confirmed.body as { code: string }).code;
    codes.staff = (staff.body as { code: string }).code;
    // 배우 예매 하나는 확정
    const list = await adminApi<{
      items: { id: string; code: string; version: number }[];
    }>(
      'GET',
      `/admin/reservations?performanceId=${performanceId}&q=${codes.actorConfirmed}`
    );
    const target = list.items.find((i) => i.code === codes.actorConfirmed)!;
    await adminApi('POST', `/admin/reservations/${target.id}/confirm`, {
      version: target.version,
    });

    await page.goto(`/reservations?performanceId=${performanceId}`);
    const row = (code: string) =>
      page
        .locator(`[data-reservation-code="${code}"]`)
        .filter({ visible: true });
    await expect(row(codes.sam)).toContainText('SAM 관계자');
    await expect(row(codes.sam)).toContainText('1매 10,000원');
    await expect(row(codes.actorPending)).toContainText(actorName);
    await expect(row(codes.actorPending)).toContainText('1매 20,000원');
    await expect(row(codes.staff)).toContainText('연출·스태프 관계자');

    await page.getByTestId('reservation-inviter-filter').click();
    await page.getByRole('option', { name: actorName }).click();
    await page
      .getByRole('group', { name: '상태' })
      .getByRole('button', { name: '입금 대기' })
      .click();
    await expect(row(codes.actorPending)).toBeVisible();
    await expect(row(codes.actorConfirmed)).toHaveCount(0);
    await expect(row(codes.sam)).toHaveCount(0);

    // 서버 필터도 같은 결과(IP-9)
    const filtered = await adminApi<{ items: { code: string }[] }>(
      'GET',
      `/admin/reservations?performanceId=${performanceId}&inviterKind=MEMBER&inviterMemberId=${actorId}&status=PENDING`
    );
    expect(filtered.items.map((i) => i.code)).toEqual([codes.actorPending]);

    await page.goto(`/admission?showId=${showId}`);
    const inviter = page
      .getByTestId('admission-inviter')
      .filter({ visible: true });
    await expect(
      inviter.filter({ hasText: 'SAM 관계자 · 1매 10,000원' })
    ).toHaveCount(1);
    await expect(
      inviter.filter({ hasText: `${actorName} · 1매 20,000원` }).first()
    ).toBeVisible();
  });

  test('일정 캘린더 연습실 예약 레이어 — 팀 예약이 빗금 칩으로 보이고 상세에서 삭제된다', async ({
    page,
  }) => {
    const { items } = await adminApi<{ items: TeamItem[] }>(
      'GET',
      `/admin/performances/${performanceId}/team-accounts`
    );
    const login = await fetch(`${INT_API_BASE_URL}/api/v1/team-auth/login`, {
      method: 'POST',
      headers: { ...RELAY, 'content-type': 'application/json' },
      body: JSON.stringify({
        username: items[0].username,
        password: items[0].password,
      }),
    });
    expect(login.status).toBe(200);
    const { accessToken } = (await login.json()) as { accessToken: string };
    const day = kstDate(1);
    const created = await fetch(
      `${INT_API_BASE_URL}/api/v1/room-reservations`,
      {
        method: 'POST',
        headers: {
          ...RELAY,
          'content-type': 'application/json',
          authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          startAt: new Date(`${day}T19:00:00+09:00`).toISOString(),
          endAt: new Date(`${day}T21:00:00+09:00`).toISOString(),
          memo: `${PREFIX}메모`,
        }),
      }
    );
    expect(created.status).toBe(201);

    await page.goto('/schedules?view=list');
    const list = page.getByTestId('schedule-room-list');
    await expect(list).toContainText(`${items[0].username} 연습실`);
    await list
      .getByRole('button', { name: new RegExp(`${items[0].username} 연습실`) })
      .click();
    const detail = page.getByTestId('room-reservation-detail');
    await expect(detail).toContainText(`${PREFIX}메모`);
    await page.getByRole('button', { name: '예약 삭제' }).click();
    await page
      .getByRole('alertdialog', { name: '이 연습실 예약을 삭제하시겠습니까?' })
      .getByRole('button', { name: '예약 삭제' })
      .click();
    await expect(page.getByText('연습실 예약을 삭제했습니다.')).toBeVisible();
    await expect(list).not.toContainText(`${items[0].username} 연습실`);
  });
});
