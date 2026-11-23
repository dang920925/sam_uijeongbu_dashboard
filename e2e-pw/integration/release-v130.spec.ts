// ----------------------------------------------------------------------
// v1.3.0 배포 묶음 새 기능 연동(리드) — INT_SCENARIO=v130 별도 실행에서만 돈다. 실서버(:4200) + 로컬 DB.
// - U34 팀 계정·연습실: 공연 상세 '팀 계정' 탭이 실서버 계정(아이디·비밀번호)을 보이고, 그 비밀번호로 팀 로그인 →
//   연습실 예약 201 · 겹치면 409 ROOM_001 · 같은 시간 동시 요청은 1건만 201(DB EXCLUDE). 관리자 연습실 목록에 보인다.
// - U35 좌석 지정: 새 공연은 좌석 지정 꺼짐이 기본 → 켜고 회차 배치 저장 → 공개 좌석 지도 → 같은 좌석 동시 5건은
//   201 1건 · 409 SEAT_001 4건.
// - R3 배역·캐스팅: cast_public 꺼짐이면 공개 cast 가 빈 목록, 켜면 노출 배우만, 배우를 비노출로 바꾸면 빠진다.
// - U39 진행 단계 통합: 신청서 화면에 승인·거절 버튼이 없고, 진행 DROPPED 는 대기 수에서 빠지며 RECEIVED 로 되돌린다.
// - U40 메뉴 배지: '예매 관리' 배지 숫자 = 요약 pendingReservationCount, 예매 1건 접수 뒤 +1.
// ----------------------------------------------------------------------
import { expect, test } from '@playwright/test';

import {
  adminApi,
  cleanupFixtures,
  FIXTURE_BASE,
  fixturePrefix,
  INT_API_BASE_URL,
  relayApplication,
  relayPost,
} from '@/e2e-pw/integration/support/integration-api';

const SCENARIO = process.env.INT_SCENARIO;
const PREFIX = fixturePrefix('v130');
const RELAY = { 'x-relay-secret': process.env.INT_RELAY_SECRET ?? '' };

interface Created {
  id: string;
}
interface TeamItem {
  id: string;
  label: string;
  username: string;
  password: string | null;
}
interface Summary {
  pendingApplicationCount: number;
  uncontactedPendingCount: number;
  pendingReservationCount: number;
}
interface SeatMap {
  rows: {
    label: string | null;
    cells: { seatId: string | null; seatNumber: number | null }[];
  }[];
  total: number;
  remaining: number;
}

/** 오늘(KST)+n 일의 HH:mm(KST) ISO */
function kstAt(days: number, hhmm: string): string {
  const date = new Date(Date.now() + 9 * 3600_000 + days * 86_400_000)
    .toISOString()
    .slice(0, 10);
  return new Date(`${date}T${hhmm}:00+09:00`).toISOString();
}

async function call(
  method: 'GET' | 'POST',
  path: string,
  init: { token?: string; body?: unknown } = {}
): Promise<{ status: number; body: Record<string, unknown> }> {
  const response = await fetch(`${INT_API_BASE_URL}/api/v1${path}`, {
    method,
    headers: {
      ...RELAY,
      ...(init.token ? { authorization: `Bearer ${init.token}` } : {}),
      ...(init.body === undefined
        ? {}
        : { 'content-type': 'application/json' }),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : {} };
}

async function createPerformance(tag: string): Promise<string> {
  const performance = await adminApi<Created>('POST', '/admin/performances', {
    title: `${PREFIX}${tag}`,
    type: 'PLAY',
    status: 'ONGOING',
    description: null,
    posterImageUrl: null,
    detailImageUrls: [],
    isVisible: true,
  });
  return performance.id;
}

/** 예매가 열린 회차 + 예매 설정 + 누구나 등급 */
async function openBooking(
  performanceId: string
): Promise<{ showId: string; tierId: string }> {
  const show = await adminApi<Created>(
    'POST',
    `/admin/performances/${performanceId}/shows`,
    {
      showDate: kstAt(10, '00:00').slice(0, 10),
      startTime: '19:00',
      endTime: '21:00',
      venue: `${PREFIX}극장`,
      totalSeats: 20,
      bookingEnabled: true,
      bookingOpenAt: new Date(Date.now() - 3600_000).toISOString(),
    }
  );
  await adminApi('PUT', `/admin/performances/${performanceId}/booking-policy`, {
    depositBank: '국민',
    depositAccountNumber: '000-00-0000',
    depositAccountHolder: 'SAM',
    maxTicketsPerBooking: 4,
    depositDeadlineHours: 24,
    refundPolicyText: '공연 전날까지 환불',
  });
  // U41(v1.3.1) — 가격은 기본가·SAM 관계자가
  await adminApi('PUT', `/admin/performances/${performanceId}/inviter-prices`, {
    base: 10000,
    samRelated: 5000,
  });
  return { showId: show.id, tierId: '' };
}

let phoneSeq = 0;
function reserve(
  showId: string,
  _tierId: string,
  extra: Record<string, unknown> = {}
) {
  phoneSeq += 1;
  return relayPost('/reservations', {
    showId,
    quantity: 1,
    bookerName: `${PREFIX}예매자`,
    bookerPhone: `010-3130-${String(phoneSeq).padStart(4, '0')}`,
    agreedToPrivacy: true,
    agreedToRefundPolicy: true,
    inviter: { kind: 'STAFF_RELATED' },
    ...extra,
  });
}

test.describe('v1.3.0 새 기능 실서버', () => {
  test.skip(SCENARIO !== 'v130', 'INT_SCENARIO=v130 실행 전용');
  test.describe.configure({ mode: 'serial' });
  test.beforeAll(() => cleanupFixtures(FIXTURE_BASE));
  test.afterAll(() => cleanupFixtures(FIXTURE_BASE));

  test('U34 팀 계정 탭 → 팀 로그인 → 연습실 예약 201 · 겹침 409 ROOM_001 · 동시 1건만', async ({
    page,
  }) => {
    // Arrange — 첫 조회가 접두어와 팀 A 를 만든다, 팀 B 추가
    const performanceId = await createPerformance('팀');
    await page.goto(`/performances/${performanceId}/teams`);
    const { items } = await adminApi<{ items: TeamItem[] }>(
      'GET',
      `/admin/performances/${performanceId}/team-accounts`
    );
    const teamA = items[0];
    const teamB = await adminApi<TeamItem>(
      'POST',
      `/admin/performances/${performanceId}/team-accounts`
    );
    await page.reload();
    await expect(page.getByText(teamA.username).first()).toBeVisible();
    await expect(page.getByText(teamB.username).first()).toBeVisible();

    // Act — 탭에 보이는 비밀번호로 로그인
    const tokens: string[] = [];
    for (const team of [teamA, teamB]) {
      const login = await call('POST', '/team-auth/login', {
        body: { username: team.username, password: team.password },
      });
      expect(login.status, JSON.stringify(login.body)).toBe(200);
      tokens.push(login.body.accessToken as string);
    }
    const startAt = kstAt(5, '19:00');
    const endAt = kstAt(5, '21:00');
    const created = await call('POST', '/room-reservations', {
      token: tokens[0],
      body: { startAt, endAt, memo: `${PREFIX}메모` },
    });
    const overlap = await call('POST', '/room-reservations', {
      token: tokens[1],
      body: { startAt: kstAt(5, '20:00'), endAt: kstAt(5, '22:00') },
    });
    const racing = await Promise.all(
      tokens.map((token) =>
        call('POST', '/room-reservations', {
          token,
          body: { startAt: kstAt(6, '10:00'), endAt: kstAt(6, '11:00') },
        })
      )
    );

    // Assert
    expect(created.status, JSON.stringify(created.body)).toBe(201);
    expect(overlap.status).toBe(409);
    expect(overlap.body).toMatchObject({ code: 'ROOM_001' });
    expect(racing.map((r) => r.status).sort()).toEqual([201, 409]);
    // 관리자 연습실 목록은 주 단위(월 시작, KST) — 예약일(+5일)이 다음 주면 넘긴다
    await page.goto('/room-reservations');
    const kstToday = kstAt(0, '00:00');
    const weekday = new Date(Date.parse(kstToday) + 9 * 3600_000).getUTCDay();
    if (5 > 6 - ((weekday + 6) % 7))
      await page.getByRole('button', { name: '다음 주' }).click();
    await expect(page.getByText(`${PREFIX}팀`).first()).toBeVisible();
    await expect(page.getByText(`${PREFIX}메모`).first()).toBeVisible();
  });

  test('U35 좌석 지정은 꺼짐이 기본 → 켜고 배치 저장 → 같은 좌석 동시 5건은 201 1 · 409 SEAT_001 4', async () => {
    // Arrange
    const performanceId = await createPerformance('좌석');
    const detail = await adminApi<{ seatSelectionEnabled: boolean }>(
      'GET',
      `/admin/performances/${performanceId}`
    );
    expect(detail.seatSelectionEnabled).toBe(false);
    const { showId, tierId } = await openBooking(performanceId);
    await adminApi('PATCH', `/admin/performances/${performanceId}`, {
      seatSelectionEnabled: true,
    });
    await adminApi('PUT', `/admin/shows/${showId}/seat-map`, {
      rowCount: 1,
      colCount: 3,
      cells: [
        {
          rowIndex: 0,
          colIndex: 0,
          kind: 'SEAT',
          rowLabel: 'A',
          seatNumber: 1,
        },
        { rowIndex: 0, colIndex: 1, kind: 'AISLE' },
        {
          rowIndex: 0,
          colIndex: 2,
          kind: 'SEAT',
          rowLabel: 'A',
          seatNumber: 2,
        },
      ],
    });
    const map = (await call('GET', `/shows/${showId}/seat-map`))
      .body as unknown as SeatMap;
    const seatId = map.rows[0].cells.find((c) => c.seatNumber === 2)?.seatId;
    expect(map.total).toBe(2);

    // Act
    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        reserve(showId, tierId, { seatIds: [seatId] })
      )
    );

    // Assert
    expect(responses.map((r) => r.status).sort()).toEqual([
      201, 409, 409, 409, 409,
    ]);
    for (const res of responses.filter((r) => r.status === 409))
      expect(res.body).toMatchObject({ code: 'SEAT_001', seatIds: [seatId] });
    const after = (await call('GET', `/shows/${showId}/seat-map`))
      .body as unknown as SeatMap;
    expect(after.remaining).toBe(1);
  });

  test('R3 배역·캐스팅 공개: 꺼짐 → 빈 목록, 켜면 노출 배우만, 비노출로 바꾸면 빠진다', async () => {
    // Arrange
    const performanceId = await createPerformance('캐스트');
    const member = await adminApi<Created>('POST', '/admin/members', {
      name: `${PREFIX}배우`,
      type: 'ACTOR',
    });
    await adminApi('PATCH', `/admin/members/${member.id}`, { isVisible: true });
    // 배우 프로필은 PATCH 로 생기고, id 는 단원 목록의 actorProfileId(R3)
    await adminApi('PATCH', `/admin/members/${member.id}/actor-profile`, {
      intro: `${PREFIX}소개`,
    });
    const members = await adminApi<{
      items: { id: string; actorProfileId: string | null }[];
    }>('GET', '/admin/members?type=ACTOR&size=100');
    const profile = {
      id: members.items.find((m) => m.id === member.id)?.actorProfileId,
    };
    expect(profile.id).toBeTruthy();
    const role = await adminApi<Created>(
      'POST',
      `/admin/performances/${performanceId}/roles`,
      { name: '제라드', description: null }
    );
    await adminApi('PUT', `/admin/roles/${role.id}/default-cast`, {
      actors: [{ actorProfileId: profile.id }],
    });
    const publicCast = async () =>
      (await call('GET', `/performances/${performanceId}/cast`)).body as {
        roles: { name: string | null; defaultCast: { name: string }[] }[];
      };

    // Act + Assert — 기본은 꺼짐
    const hidden = await publicCast();
    expect(hidden.roles).toEqual([]);
    await adminApi('PATCH', `/admin/performances/${performanceId}`, {
      castPublic: true,
    });
    const shown = await publicCast();
    expect(shown.roles[0]?.name).toBe('제라드');
    expect(shown.roles[0]?.defaultCast.map((a) => a.name)).toEqual([
      `${PREFIX}배우`,
    ]);
    await adminApi('PATCH', `/admin/members/${member.id}`, {
      isVisible: false,
    });
    const afterHide = await publicCast();
    expect(afterHide.roles.flatMap((r) => r.defaultCast)).toEqual([]);
  });

  test('U39 신청서는 승인·거절 버튼 없이 진행 단계로 — DROPPED 는 대기에서 빠지고 RECEIVED 로 되돌린다', async ({
    page,
  }) => {
    // Arrange
    const res = await relayApplication({
      appType: 'CONSULTATION',
      applicantName: `${PREFIX}신청자`,
      phone: '010-3139-0001',
      agreedToPrivacy: true,
      consultationMethod: 'PHONE',
      preferredTime: 'WEEKDAY_EVENING',
      interestUndecided: true,
    });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    const id = (res.body as Created).id;
    const before = await adminApi<Summary>('GET', '/admin/dashboard/summary');

    // Act
    await page.goto('/applications');
    await expect(page.getByText(`${PREFIX}신청자`).first()).toBeVisible();
    await expect(
      page.getByRole('button', { name: /^(승인|거절)/ })
    ).toHaveCount(0);
    const dropped = await adminApi<{ progress: string; status: string }>(
      'PATCH',
      `/admin/applications/${id}/progress`,
      { progress: 'DROPPED' }
    );
    const afterDrop = await adminApi<Summary>(
      'GET',
      '/admin/dashboard/summary'
    );
    const resumed = await adminApi<{ progress: string }>(
      'PATCH',
      `/admin/applications/${id}/progress`,
      { progress: 'RECEIVED' }
    );

    // Assert
    expect(dropped).toMatchObject({ progress: 'DROPPED', status: 'PENDING' });
    expect(afterDrop.pendingApplicationCount).toBe(
      before.pendingApplicationCount - 1
    );
    expect(resumed.progress).toBe('RECEIVED');
  });

  test('U40 메뉴 배지: 예매 관리 숫자 = 요약 입금 대기 수, 예매 접수 뒤 +1', async ({
    page,
  }) => {
    // Arrange
    const performanceId = await createPerformance('배지');
    const { showId, tierId } = await openBooking(performanceId);
    expect((await reserve(showId, tierId)).status).toBe(201);
    const before = await adminApi<Summary>('GET', '/admin/dashboard/summary');
    expect(before.pendingReservationCount).toBeGreaterThan(0);
    await page.goto('/');
    await expect(
      page.getByRole('img', {
        name: `입금 대기 ${before.pendingReservationCount}건`,
      })
    ).toBeVisible();

    // Act
    expect((await reserve(showId, tierId)).status).toBe(201);
    await page.reload();

    // Assert
    await expect(
      page.getByRole('img', {
        name: `입금 대기 ${before.pendingReservationCount + 1}건`,
      })
    ).toBeVisible();
  });
});
