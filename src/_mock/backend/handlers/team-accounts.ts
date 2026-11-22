// ----------------------------------------------------------------------
// 목 팀 계정·연습실 예약(관리, U34 develop §18.2). 상태는 이 파일의 전역에 두고, 공용 목 저장소가 초기화(`__mock/reset`)되면
// 같이 비운다(공용 저장소 객체가 바뀐 것으로 알아챈다 — mock-store 를 고치지 않게).
// - 공연 등록(handlers/performances)이 provisionMockTeam 으로 접두어·A 계정을 만든다(PR-1).
// - 비밀번호는 혼동 문자 없는 12자, 재발급하면 바뀐다. 접두어는 영문·숫자 1~20자, 다른 작품과 겹치면 409 TEAM_003.
// - 연습실 예약은 E2E 가 `POST /v1/__mock/room-reservations` 로 넣는다(팀 화면은 홈페이지 몫).
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
} from '@/src/types/practice';

interface MockTeam extends TeamAccountResponse {
  performanceId: string;
}

interface TeamMockState {
  owner: object;
  prefixes: Map<string, string>;
  teams: MockTeam[];
  rooms: AdminRoomReservationResponse[];
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

export const teamAccountRoutes: MockRoute[] = [
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
      return json({ items });
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
    // 목 전용 — E2E 가 예약을 넣는다. 본문 { startAt, endAt, teamName, memo?, performanceTitle? }
    method: 'POST',
    pattern: /^\/v1\/__mock\/room-reservations$/,
    auth: false,
    handle: (ctx) => {
      const room: AdminRoomReservationResponse = {
        id: newId(),
        startAt: str(ctx.body.startAt) ?? nowIso(),
        endAt: str(ctx.body.endAt) ?? nowIso(),
        teamName: str(ctx.body.teamName) ?? 'Mock-A',
        memo: str(ctx.body.memo),
        performanceId: str(ctx.body.performanceId) ?? newId(),
        performanceTitle: str(ctx.body.performanceTitle) ?? '[작품 제목]',
      };
      state().rooms.push(room);
      return json(room, 201);
    },
  },
];
