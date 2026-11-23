// ----------------------------------------------------------------------
// (U45) 팀 구성 · 연습실 참석자 표시 E2E(목 백엔드).
// - SCR-D14 '팀 구성' 카드: 캐스트 배우 × 팀 체크(여러 팀 가능, 기본 미배정) → 새로고침해도 유지, '팀 계정' 탭에 소속 배우 이름.
// - 관리 연습실 예약 목록·캘린더 연습실 상세: 참석자 인원 수와 이름. 참석자 없는 예약은 "체크 안 함".
// desktop 은 표, mobile 은 카드 — 보이는 요소만 골라 같은 테스트로 돈다. 접두사 fixture-u45-.
// ----------------------------------------------------------------------
import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';

import { adminApi, resetMock } from '@/e2e-pw/support/mock-api';

const PREFIX = 'fixture-u45-';

interface Created {
  id: string;
}

/** KST 오늘 + n 일 'YYYY-MM-DD' */
function kstDate(days: number): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(
    new Date(Date.now() + days * 86400000)
  );
}

async function createActor(request: APIRequestContext, name: string) {
  const actor = await adminApi<Created>(request, 'POST', '/admin/members', {
    name,
    type: 'ACTOR',
  });
  await adminApi(request, 'PATCH', `/admin/members/${actor.id}/actor-profile`, {
    intro: null,
  });
  return actor.id;
}

/** 작품(팀 A 자동) + 팀 B + 배역 '디어'에 배우 둘 */
async function setup(request: APIRequestContext) {
  const performance = await adminApi<Created>(
    request,
    'POST',
    '/admin/performances',
    {
      title: `Dear ${PREFIX}`,
      type: 'PLAY',
      status: 'UPCOMING',
      isVisible: true,
    }
  );
  await adminApi(
    request,
    'POST',
    `/admin/performances/${performance.id}/team-accounts`,
    {}
  );
  const first = await createActor(request, `${PREFIX}배우1`);
  const second = await createActor(request, `${PREFIX}배우2`);
  const role = await adminApi<Created>(
    request,
    'POST',
    `/admin/performances/${performance.id}/roles`,
    { name: '디어', description: null }
  );
  await adminApi(request, 'PUT', `/admin/roles/${role.id}/default-cast`, {
    actors: [
      { actorProfileId: `ap-${first}` },
      { actorProfileId: `ap-${second}` },
    ],
  });
  return { performanceId: performance.id };
}

const teamCheck = (page: Page, actor: string, team: string) =>
  page
    .getByRole('checkbox', { name: `${PREFIX}${actor} — ${team} 팀` })
    .filter({ visible: true });

test.describe('U45 팀 구성·참석자', () => {
  test.beforeEach(async ({ request }) => {
    await resetMock(request);
  });

  test('배역·캐스팅 탭에서 배우마다 팀을 고르고(여러 팀 가능) 팀 계정 탭에서 소속 배우를 본다', async ({
    page,
    request,
  }) => {
    const { performanceId } = await setup(request);
    await page.goto(`/performances/${performanceId}/cast`);

    const card = page.getByTestId('cast-teams-card');
    await expect(
      card.getByText(`${PREFIX}배우1`).filter({ visible: true })
    ).toBeVisible();
    // 기본은 미배정
    await expect(teamCheck(page, '배우1', 'A')).not.toBeChecked();

    await teamCheck(page, '배우1', 'A').check();
    await expect(teamCheck(page, '배우1', 'A')).toBeChecked();
    await teamCheck(page, '배우2', 'B').check();
    await teamCheck(page, '배우2', 'A').check();
    await expect(teamCheck(page, '배우2', 'A')).toBeChecked();

    await page.reload();
    await expect(teamCheck(page, '배우1', 'A')).toBeChecked();
    await expect(teamCheck(page, '배우1', 'B')).not.toBeChecked();
    await expect(teamCheck(page, '배우2', 'B')).toBeChecked();

    // 빼기
    await teamCheck(page, '배우2', 'A').uncheck();
    await expect(teamCheck(page, '배우2', 'A')).not.toBeChecked();

    await page.getByRole('tab', { name: '팀 계정' }).click();
    await expect(page).toHaveURL(`/performances/${performanceId}/teams`);
    const members = page.getByText(`${PREFIX}배우1`).filter({ visible: true });
    await expect(members.first()).toBeVisible();
    await expect(
      page.getByText(`${PREFIX}배우2`).filter({ visible: true }).first()
    ).toBeVisible();
  });

  test('팀 계정이 없거나 캐스트가 없으면 팀 구성 카드가 안내한다(경계)', async ({
    page,
    request,
  }) => {
    const performance = await adminApi<Created>(
      request,
      'POST',
      '/admin/performances',
      {
        title: `${PREFIX}빈`,
        type: 'PLAY',
        status: 'UPCOMING',
        isVisible: true,
      }
    );
    await page.goto(`/performances/${performance.id}/cast`);
    await expect(
      page.getByText('배역에 배우를 넣으면 여기서 팀을 정할 수 있습니다.')
    ).toBeVisible();
  });

  test('연습실 예약 목록과 캘린더 상세에 참석자 인원 수와 이름이 보인다', async ({
    page,
    request,
  }) => {
    const today = kstDate(0);
    await adminApi(request, 'POST', '/__mock/room-reservations', {
      startAt: `${today}T19:00:00+09:00`,
      endAt: `${today}T21:00:00+09:00`,
      teamName: 'Dear-A',
      performanceTitle: 'Dear',
      attendees: ['김가', '이나'],
    });
    await adminApi(request, 'POST', '/__mock/room-reservations', {
      startAt: `${today}T10:00:00+09:00`,
      endAt: `${today}T11:00:00+09:00`,
      teamName: 'Dear-B',
      performanceTitle: 'Dear',
    });

    await page.goto('/room-reservations');
    await expect(
      page.getByText('2명 · 김가, 이나').filter({ visible: true }).first()
    ).toBeVisible();
    await expect(
      page.getByText('체크 안 함').filter({ visible: true }).first()
    ).toBeVisible();

    await page.goto('/schedules');
    await page.getByRole('button', { name: '목록', exact: true }).click();
    const list = page.getByTestId('schedule-room-list');
    await list
      .getByRole('button', { name: /Dear-A 연습실/ })
      .first()
      .click();
    const detail = page.getByTestId('room-reservation-detail');
    await expect(detail).toContainText('참석자');
    await expect(detail).toContainText('2명 · 김가, 이나');
  });
});
