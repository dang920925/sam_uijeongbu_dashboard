// ----------------------------------------------------------------------
// (U48) E2E·캡처 공용 픽스처 — 작품(팀 A 자동) + 팀 B + 배역 '에반'에 배우 둘(배우1 은 프로필 사진 있음) + 회차 하나.
// 이름은 fixture-u48- 접두사(실데이터처럼 보이지 않게).
// ----------------------------------------------------------------------
import type { APIRequestContext } from '@playwright/test';

import { adminApi, uploadFixtureImage } from '@/e2e-pw/support/mock-api';

export const U48_PREFIX = 'fixture-u48-';
const PREFIX = U48_PREFIX;

interface Created {
  id: string;
}

async function createActor(
  request: APIRequestContext,
  name: string,
  profileImageUrl: string | null
) {
  const actor = await adminApi<Created>(request, 'POST', '/admin/members', {
    name,
    type: 'ACTOR',
  });
  await adminApi(request, 'PATCH', `/admin/members/${actor.id}/actor-profile`, {
    intro: null,
    profileImageUrl,
  });
  // 홈페이지 노출 배우(기본 꺼짐) — 대체 표시(프로필·실루엣)를 보려면 켠다
  await adminApi(request, 'PATCH', `/admin/members/${actor.id}`, {
    isVisible: true,
  });
  return actor.id;
}

export async function seedU48(request: APIRequestContext) {
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
  const profile = await uploadFixtureImage(request, 'ACTOR_PROFILE');
  const first = await createActor(request, `${PREFIX}배우1`, profile);
  const second = await createActor(request, `${PREFIX}배우2`, null);
  const role = await adminApi<Created>(
    request,
    'POST',
    `/admin/performances/${performance.id}/roles`,
    { name: '에반', description: null }
  );
  await adminApi(request, 'PUT', `/admin/roles/${role.id}/default-cast`, {
    actors: [
      { actorProfileId: `ap-${first}` },
      { actorProfileId: `ap-${second}` },
    ],
  });
  // 팀 구성: 배우1 → A, 배우2 → B(팀 칩·팀 인원 표시용)
  const roster = await adminApi<{ teams: { teamAccountId: string }[] }>(
    request,
    'GET',
    `/admin/performances/${performance.id}/team-members`
  );
  for (const [index, memberId] of [first, second].entries()) {
    const team = roster.teams[index];
    if (team)
      await adminApi(
        request,
        'PUT',
        `/admin/team-accounts/${team.teamAccountId}/members/${memberId}`
      );
  }
  await adminApi(
    request,
    'POST',
    `/admin/performances/${performance.id}/shows`,
    {
      showDate: '2026-12-12',
      startTime: '14:00',
    }
  );
  return { performanceId: performance.id, roleId: role.id, first, second };
}
