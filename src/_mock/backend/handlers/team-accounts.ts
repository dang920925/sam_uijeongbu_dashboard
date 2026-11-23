// ----------------------------------------------------------------------
// 목 팀 계정·연습실 예약(관리, U34 develop §18.2). 상태는 이 파일의 전역에 두고, 공용 목 저장소가 초기화(`__mock/reset`)되면
// 같이 비운다(공용 저장소 객체가 바뀐 것으로 알아챈다 — mock-store 를 고치지 않게).
// - 공연 등록(handlers/performances)이 provisionMockTeam 으로 접두어·A 계정을 만든다(PR-1).
// - 비밀번호는 혼동 문자 없는 12자, 재발급하면 바뀐다. 접두어는 영문·숫자 1~20자, 다른 작품과 겹치면 409 TEAM_003.
// - 연습실 예약은 E2E 가 `POST /v1/__mock/room-reservations` 로 넣는다(팀 화면은 홈페이지 몫). attendees 이름 배열을 줄 수 있다.
// - (U45) 팀 구성: 소속(팀 id → 단원 id 집합). 후보 = 공용 저장소의 기본 캐스트(role_casts, showId null) 배우(배역 순).
// - (U46) 시간 막기: 규칙 목록 + 기간 조회 때 발생분 계산(KST, ISO 요일, 끝 24:00). 겹치는 목 예약은 onConflict 없으면 409 ROOM_007.
// ----------------------------------------------------------------------
import { findPerformanceAlive } from '@/src/_mock/backend/booking-model';
import {
  apiError,
  json,
  newId,
  noContent,
  nowIso,
  str,
  validationError,
  type MockRoute,
} from '@/src/_mock/backend/mock-http';
import { getStore } from '@/src/_mock/backend/mock-store';
import type {
  AdminRoomReservationResponse,
  TeamAccountResponse,
  RoomBlockResponse,
  TeamRosterResponse,
} from '@/src/types/practice';

interface MockTeam extends TeamAccountResponse {
  performanceId: string;
}

interface TeamMockState {
  owner: object;
  prefixes: Map<string, string>;
  teams: MockTeam[];
  rooms: AdminRoomReservationResponse[];
  /** (U45) 팀 id → 소속 단원 id */
  members: Map<string, Set<string>>;
  /** (U46) 막은 시간 규칙 */
  blocks: RoomBlockResponse[];
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
const PREFIX = /^[A-Za-z0-9]{1,20}$/;
const globalForTeam = globalThis as unknown as {
  __samTeamMock?: TeamMockState;
};

function state(): TeamMockState {
  const owner = getStore();
  if (globalForTeam.__samTeamMock?.owner !== owner) {
    globalForTeam.__samTeamMock = {
      owner,
      prefixes: new Map(),
      teams: [],
      rooms: [],
      members: new Map(),
      blocks: [],
    };
  }
  return globalForTeam.__samTeamMock;
}

function newPassword(): string {
  return Array.from(
    { length: 12 },
    () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  ).join('');
}

function nextLabel(labels: string[]): string {
  const toNum = (l: string) =>
    [...l].reduce((s, c) => s * 26 + c.charCodeAt(0) - 64, 0);
  let n = labels.reduce((m, l) => Math.max(m, toNum(l)), 0) + 1;
  let label = '';
  while (n > 0) {
    label = String.fromCharCode(65 + ((n - 1) % 26)) + label;
    n = Math.floor((n - 1) / 26);
  }
  return label;
}

function isPrefixTaken(prefix: string, exceptPerformanceId: string): boolean {
  return [...state().prefixes.entries()].some(
    ([id, p]) =>
      id !== exceptPerformanceId && p.toLowerCase() === prefix.toLowerCase()
  );
}

function defaultPrefix(performanceId: string, title: string): string {
  const base = title.replace(/[^A-Za-z0-9]/g, '').slice(0, 20);
  for (let n = 1; n < 500; n += 1) {
    const candidate = base
      ? n === 1
        ? base
        : `${base.slice(0, 20 - String(n).length)}${n}`
      : `SAM${n}`;
    if (!isPrefixTaken(candidate, performanceId)) return candidate;
  }
  return `SAM${Date.now() % 100000}`;
}

function addTeam(performanceId: string): MockTeam {
  const s = state();
  const prefix = s.prefixes.get(performanceId) as string;
  const label = nextLabel(
    s.teams.filter((t) => t.performanceId === performanceId).map((t) => t.label)
  );
  const team: MockTeam = {
    id: newId(),
    performanceId,
    label,
    username: `${prefix}-${label}`,
    password: newPassword(),
    isActive: true,
    revokedAt: null,
    createdAt: nowIso(),
  };
  s.teams.push(team);
  return team;
}

/** 공연 등록 때 접두어 기본값 + A 계정(PR-1) */
export function provisionMockTeam(performance: {
  id: string;
  title: string;
}): void {
  state().prefixes.set(
    performance.id,
    defaultPrefix(performance.id, performance.title)
  );
  addTeam(performance.id);
}

/** (U48) 캐스트 사진·회차 팀 지정용 — 폐기 안 된 팀(라벨 순) */
export function mockActiveTeams(
  performanceId: string
): { id: string; label: string }[] {
  return state()
    .teams.filter((t) => t.performanceId === performanceId && !t.revokedAt)
    .sort(
      (a, b) =>
        a.label.length - b.label.length || a.label.localeCompare(b.label)
    )
    .map((t) => ({ id: t.id, label: t.label }));
}

const toItem = ({
  performanceId: _performanceId,
  ...team
}: MockTeam): TeamAccountResponse => team;

function list(performanceId: string) {
  const s = state();
  return {
    prefix: s.prefixes.get(performanceId) ?? null,
    items: s.teams
      .filter((t) => t.performanceId === performanceId)
      .sort(
        (a, b) =>
          a.label.length - b.label.length || a.label.localeCompare(b.label)
      )
      .map(toItem),
  };
}

/** (U45) 공연 기본 캐스트 배우 — 배역 순 → 캐스트 순, 배우마다 한 줄 */
function castCandidates(performanceId: string): TeamRosterResponse['members'] {
  const store = getStore();
  const roles = store.roles
    .filter((r) => r.performanceId === performanceId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const byMember = new Map<string, TeamRosterResponse['members'][number]>();
  for (const role of roles) {
    const rows = store.roleCasts
      .filter((c) => c.roleId === role.id && c.showId === null)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    for (const row of rows) {
      const member = store.members.find((m) => m.id === row.memberId);
      if (!member) continue;
      const roleName = role.name ?? '출연';
      const found = byMember.get(member.id);
      if (!found)
        byMember.set(member.id, {
          memberId: member.id,
          name: member.name,
          roleNames: [roleName],
        });
      else if (!found.roleNames.includes(roleName))
        found.roleNames.push(roleName);
    }
  }
  return [...byMember.values()];
}

function roster(performanceId: string): TeamRosterResponse {
  const s = state();
  const members = castCandidates(performanceId);
  return {
    teams: s.teams
      .filter((t) => t.performanceId === performanceId && !t.revokedAt)
      .sort(
        (a, b) =>
          a.label.length - b.label.length || a.label.localeCompare(b.label)
      )
      .map((t) => ({
        teamAccountId: t.id,
        label: t.label,
        username: t.username,
        isActive: t.isActive,
        memberIds: members
          .map((m) => m.memberId)
          .filter((id) => s.members.get(t.id)?.has(id)),
      })),
    members,
  };
}

const DAY = 86_400_000;
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
const kstStartMs = (date: string) => Date.parse(`${date}T00:00:00+09:00`);
const isoDay = (date: string) => new Date(`${date}T00:00:00Z`).getUTCDay() || 7;

/** (U46) 기간 [from, to) 와 겹치는 블록 발생분 */
function blockOccurrences(from: number, to: number) {
  const out: {
    blockId: string;
    title: string;
    date: string;
    startAt: string;
    endAt: string;
  }[] = [];
  for (const b of state().blocks) {
    for (
      let ms = Date.parse(`${b.startDate}T00:00:00Z`);
      ms <= Date.parse(`${b.endDate}T00:00:00Z`);
      ms += DAY
    ) {
      const date = new Date(ms).toISOString().slice(0, 10);
      if (b.skipDates.includes(date)) continue;
      if (b.repeat === 'WEEKLY' && !b.weekdays.includes(isoDay(date))) continue;
      const start = kstStartMs(date) + toMin(b.startTime) * 60000;
      const end = kstStartMs(date) + toMin(b.endTime) * 60000;
      if (start >= to || end <= from) continue;
      out.push({
        blockId: b.id,
        title: b.title,
        date,
        startAt: new Date(start).toISOString(),
        endAt: new Date(end).toISOString(),
      });
    }
  }
  return out.sort((a, b) => a.startAt.localeCompare(b.startAt));
}

function readBlock(
  body: Record<string, unknown>,
  base?: RoomBlockResponse
): RoomBlockResponse | string {
  const pick = <K extends keyof RoomBlockResponse>(k: K) =>
    (body[k] !== undefined ? body[k] : base?.[k]) as RoomBlockResponse[K];
  const repeat = pick('repeat') ?? 'NONE';
  const startDate = pick('startDate');
  const block: RoomBlockResponse = {
    id: base?.id ?? newId(),
    title: String(pick('title') ?? '').trim(),
    memo: (pick('memo') as string | null) ?? null,
    repeat,
    weekdays: repeat === 'WEEKLY' ? [...(pick('weekdays') ?? [])] : [],
    startTime: pick('startTime'),
    endTime: pick('endTime'),
    startDate,
    endDate: repeat === 'WEEKLY' ? pick('endDate') : startDate,
    skipDates: base?.skipDates ?? [],
    createdAt: base?.createdAt ?? nowIso(),
  };
  if (!block.title) return '제목을 입력해주세요.';
  if (toMin(block.endTime) - toMin(block.startTime) < 30)
    return '끝 시각은 시작보다 30분 이상 뒤여야 합니다.';
  if (block.repeat === 'WEEKLY' && block.weekdays.length === 0)
    return '반복할 요일을 하나 이상 골라주세요.';
  if (block.endDate < block.startDate)
    return '종료일은 시작일과 같거나 뒤여야 합니다.';
  return block;
}

/** 규칙과 겹치는 아직 시작 안 한 목 예약 */
function blockConflicts(block: RoomBlockResponse) {
  const s = state();
  const saved = s.blocks;
  s.blocks = [block];
  const from = kstStartMs(block.startDate);
  const to = kstStartMs(block.endDate) + DAY;
  const occ = blockOccurrences(from, to);
  s.blocks = saved;
  return s.rooms.filter(
    (r) =>
      Date.parse(r.startAt) > Date.now() &&
      occ.some(
        (o) =>
          Date.parse(o.startAt) < Date.parse(r.endAt) &&
          Date.parse(o.endAt) > Date.parse(r.startAt)
      )
  );
}

function saveBlock(
  ctx: Parameters<MockRoute['handle']>[0],
  base?: RoomBlockResponse
) {
  const block = readBlock(ctx.body, base);
  if (typeof block === 'string') return validationError(ctx, block);
  const conflicts = blockConflicts(block);
  const onConflict = str(ctx.body.onConflict);
  if (conflicts.length > 0 && !onConflict)
    return apiError(
      ctx,
      409,
      'ROOM_007',
      '겹치는 팀 예약이 있습니다. 취소할지 유지할지 골라주세요.'
    );
  const s = state();
  if (onConflict === 'CANCEL') {
    const ids = new Set(conflicts.map((r) => r.id));
    s.rooms = s.rooms.filter((r) => !ids.has(r.id));
  }
  s.blocks = [...s.blocks.filter((b) => b.id !== block.id), block];
  return json(block, base ? 200 : 201);
}

export const teamAccountRoutes: MockRoute[] = [
  {
    method: 'GET',
    pattern: /^\/v1\/admin\/room-blocks$/,
    auth: true,
    handle: () => json({ items: state().blocks }),
  },
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/room-blocks\/conflicts$/,
    auth: true,
    handle: (ctx) => {
      const block = readBlock(ctx.body);
      if (typeof block === 'string') return validationError(ctx, block);
      return json({
        items: blockConflicts(block).map((r) => ({
          id: r.id,
          teamName: r.teamName,
          performanceTitle: r.performanceTitle,
          startAt: r.startAt,
          endAt: r.endAt,
        })),
      });
    },
  },
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/room-blocks$/,
    auth: true,
    handle: (ctx) => saveBlock(ctx),
  },
  {
    method: 'PATCH',
    pattern: /^\/v1\/admin\/room-blocks\/(?<id>[^/]+)$/,
    auth: true,
    handle: (ctx) => {
      const base = state().blocks.find((b) => b.id === ctx.params.id);
      return base
        ? saveBlock(ctx, base)
        : apiError(ctx, 404, 'ROOM_008', '막은 시간을 찾을 수 없습니다.');
    },
  },
  {
    method: 'DELETE',
    pattern: /^\/v1\/admin\/room-blocks\/(?<id>[^/]+)$/,
    auth: true,
    handle: (ctx) => {
      const s = state();
      const before = s.blocks.length;
      s.blocks = s.blocks.filter((b) => b.id !== ctx.params.id);
      return s.blocks.length < before
        ? noContent()
        : apiError(ctx, 404, 'ROOM_008', '막은 시간을 찾을 수 없습니다.');
    },
  },
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/room-blocks\/(?<id>[^/]+)\/skip$/,
    auth: true,
    handle: (ctx) => {
      const block = state().blocks.find((b) => b.id === ctx.params.id);
      if (!block)
        return apiError(ctx, 404, 'ROOM_008', '막은 시간을 찾을 수 없습니다.');
      const date = str(ctx.body.date) ?? '';
      if (!block.skipDates.includes(date)) block.skipDates.push(date);
      block.skipDates.sort();
      return json(block);
    },
  },
  {
    method: 'GET',
    pattern: /^\/v1\/admin\/performances\/(?<id>[^/]+)\/team-members$/,
    auth: true,
    handle: (ctx) =>
      findPerformanceAlive(ctx.params.id)
        ? json(roster(ctx.params.id))
        : apiError(ctx, 404, 'PERF_001', '작품 정보를 찾을 수 없습니다.'),
  },
  {
    method: 'PUT',
    pattern:
      /^\/v1\/admin\/team-accounts\/(?<id>[^/]+)\/members\/(?<memberId>[^/]+)$/,
    auth: true,
    handle: (ctx) => {
      const s = state();
      const team = s.teams.find((t) => t.id === ctx.params.id && !t.revokedAt);
      if (!team)
        return apiError(ctx, 404, 'TEAM_005', '팀 계정을 찾을 수 없습니다.');
      const isCast = castCandidates(team.performanceId).some(
        (m) => m.memberId === ctx.params.memberId
      );
      if (!isCast)
        return apiError(
          ctx,
          400,
          'TEAM_006',
          '이 공연 캐스트에 있는 배우만 팀에 넣을 수 있습니다.'
        );
      const set = s.members.get(team.id) ?? new Set<string>();
      set.add(ctx.params.memberId);
      s.members.set(team.id, set);
      return noContent();
    },
  },
  {
    method: 'DELETE',
    pattern:
      /^\/v1\/admin\/team-accounts\/(?<id>[^/]+)\/members\/(?<memberId>[^/]+)$/,
    auth: true,
    handle: (ctx) => {
      const s = state();
      if (!s.teams.some((t) => t.id === ctx.params.id && !t.revokedAt))
        return apiError(ctx, 404, 'TEAM_005', '팀 계정을 찾을 수 없습니다.');
      s.members.get(ctx.params.id)?.delete(ctx.params.memberId);
      return noContent();
    },
  },
  {
    method: 'GET',
    pattern: /^\/v1\/admin\/performances\/(?<id>[^/]+)\/team-accounts$/,
    auth: true,
    handle: (ctx) =>
      findPerformanceAlive(ctx.params.id)
        ? json(list(ctx.params.id))
        : apiError(ctx, 404, 'PERF_001', '작품 정보를 찾을 수 없습니다.'),
  },
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/performances\/(?<id>[^/]+)\/team-accounts$/,
    auth: true,
    handle: (ctx) => {
      const performance = findPerformanceAlive(ctx.params.id);
      if (!performance)
        return apiError(ctx, 404, 'PERF_001', '작품 정보를 찾을 수 없습니다.');
      if (!state().prefixes.has(performance.id)) {
        state().prefixes.set(
          performance.id,
          defaultPrefix(performance.id, performance.title)
        );
      }
      return json(toItem(addTeam(performance.id)), 201);
    },
  },
  {
    method: 'PATCH',
    pattern: /^\/v1\/admin\/performances\/(?<id>[^/]+)\/team-prefix$/,
    auth: true,
    handle: (ctx) => {
      if (!findPerformanceAlive(ctx.params.id))
        return apiError(ctx, 404, 'PERF_001', '작품 정보를 찾을 수 없습니다.');
      const prefix = str(ctx.body.prefix) ?? '';
      if (!PREFIX.test(prefix))
        return validationError(ctx, '접두어는 영문·숫자 1~20자여야 합니다.');
      if (isPrefixTaken(prefix, ctx.params.id))
        return apiError(
          ctx,
          409,
          'TEAM_003',
          '이미 사용 중인 아이디입니다. 다른 접두어를 입력해주세요.'
        );
      const s = state();
      s.prefixes.set(ctx.params.id, prefix);
      for (const t of s.teams.filter(
        (x) => x.performanceId === ctx.params.id
      )) {
        t.username = `${prefix}-${t.label}`;
      }
      return json(list(ctx.params.id));
    },
  },
  {
    method: 'POST',
    pattern: /^\/v1\/admin\/team-accounts\/(?<id>[^/]+)\/reset-password$/,
    auth: true,
    handle: (ctx) => {
      const team = state().teams.find((t) => t.id === ctx.params.id);
      if (!team)
        return apiError(ctx, 404, 'TEAM_005', '팀 계정을 찾을 수 없습니다.');
      team.password = newPassword();
      return json(toItem(team));
    },
  },
  {
    method: 'PATCH',
    pattern: /^\/v1\/admin\/team-accounts\/(?<id>[^/]+)$/,
    auth: true,
    handle: (ctx) => {
      const team = state().teams.find((t) => t.id === ctx.params.id);
      if (!team)
        return apiError(ctx, 404, 'TEAM_005', '팀 계정을 찾을 수 없습니다.');
      if (typeof ctx.body.isActive !== 'boolean') return validationError(ctx);
      team.isActive = ctx.body.isActive;
      if (team.isActive) team.revokedAt = null;
      return json(toItem(team));
    },
  },
  {
    method: 'GET',
    pattern: /^\/v1\/admin\/room-reservations$/,
    auth: true,
    handle: (ctx) => {
      const from = Date.parse(ctx.query.get('from') ?? '');
      const to = Date.parse(ctx.query.get('to') ?? '');
      if (
        Number.isNaN(from) ||
        Number.isNaN(to) ||
        to <= from ||
        to - from > 31 * 86400000
      )
        return validationError(
          ctx,
          '조회 기간은 31일 이하이고 끝이 시작보다 뒤여야 합니다.'
        );
      const items = state()
        .rooms.filter(
          (r) => Date.parse(r.startAt) < to && Date.parse(r.endAt) > from
        )
        .sort((a, b) => a.startAt.localeCompare(b.startAt));
      return json({ items, blocks: blockOccurrences(from, to) });
    },
  },
  {
    method: 'DELETE',
    pattern: /^\/v1\/admin\/room-reservations\/(?<id>[^/]+)$/,
    auth: true,
    handle: (ctx) => {
      const s = state();
      const before = s.rooms.length;
      s.rooms = s.rooms.filter((r) => r.id !== ctx.params.id);
      return s.rooms.length < before
        ? noContent()
        : apiError(ctx, 404, 'ROOM_004', '예약을 찾을 수 없습니다.');
    },
  },
  {
    // 목 전용 — E2E 가 예약을 넣는다. 본문 { startAt, endAt, teamName, memo?, performanceTitle?, attendees?(이름 배열) }
    method: 'POST',
    pattern: /^\/v1\/__mock\/room-reservations$/,
    auth: false,
    handle: (ctx) => {
      const names = Array.isArray(ctx.body.attendees)
        ? ctx.body.attendees.filter((n): n is string => typeof n === 'string')
        : [];
      const room: AdminRoomReservationResponse = {
        id: newId(),
        startAt: str(ctx.body.startAt) ?? nowIso(),
        endAt: str(ctx.body.endAt) ?? nowIso(),
        teamName: str(ctx.body.teamName) ?? 'Mock-A',
        memo: str(ctx.body.memo),
        performanceId: str(ctx.body.performanceId) ?? newId(),
        performanceTitle: str(ctx.body.performanceTitle) ?? '[작품 제목]',
        attendees: names.map((name) => ({ memberId: newId(), name })),
        attendeeCount: names.length,
      };
      state().rooms.push(room);
      return json(room, 201);
    },
  },
];
