// ----------------------------------------------------------------------
// SCR-D14 배역·참여자 행 표시 모델(design §6 SCR-D14 · §12) + 배우 고르기 후보.
// - 배역 행: 이름(없으면 "출연") · 설명 · 모집 중 · 기본 캐스트(비노출 표시) · ▲▼ 가능 여부 · 공개 안 됨 이유.
// - 참여자 행: 직함 · 사람(연결 갈래 라벨) · 노출 · 이유 · ▲▼.
// - 배우 후보: 배우 단원 이름 검색, 기본 캐스트 후보를 먼저(회차 칸). 회차 칸은 프로필 없는 배우를 고를 수 없다.
// ----------------------------------------------------------------------
import {
  castReason,
  creditReason,
  type CastPublicContext,
} from '@/src/sections/performance-cast/utils/cast-reasons';
import { MSG_D14 } from '@/src/shared/messages/d14';
import type { AdminCredit, AdminRole, RoleCast } from '@/src/types/cast';
import type { Member } from '@/src/types/member';

export interface RoleRowModel {
  id: string;
  label: string;
  description: string | null;
  isEnsemble: boolean;
  isRecruiting: boolean;
  actors: (RoleCast & { key: string })[];
  reason: string | null;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export interface CreditRowModel {
  id: string;
  title: string;
  personName: string;
  personKind: string;
  isVisible: boolean;
  reason: string | null;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export interface ActorCandidate {
  memberId: string;
  actorProfileId: string | null;
  name: string;
  isDefault: boolean;
  isDisabled: boolean;
}

export function toRoleRows(
  roles: readonly AdminRole[],
  ctx: CastPublicContext
): RoleRowModel[] {
  return roles.map((role, index) => ({
    id: role.id,
    label: role.name ?? MSG_D14.ENSEMBLE,
    description: role.description,
    isEnsemble: role.name === null,
    isRecruiting: role.isRecruiting,
    actors: role.defaultCast.map((actor) => ({
      ...actor,
      key: `${role.id}-${actor.actorProfileId}`,
    })),
    reason: castReason(role.publicNow, role.name, role.defaultCast, ctx),
    canMoveUp: index > 0,
    canMoveDown: index < roles.length - 1,
  }));
}

export function toCreditRows(
  credits: readonly AdminCredit[],
  ctx: CastPublicContext
): CreditRowModel[] {
  return credits.map((credit, index) => ({
    id: credit.id,
    title: credit.title,
    personName:
      credit.staff?.name ?? credit.member?.name ?? credit.displayName ?? '',
    personKind: credit.staff
      ? MSG_D14.CREDIT_KIND_STAFF
      : credit.member
        ? MSG_D14.CREDIT_KIND_MEMBER
        : MSG_D14.CREDIT_KIND_NAME,
    isVisible: credit.isVisible,
    reason: creditReason(credit, ctx),
    canMoveUp: index > 0,
    canMoveDown: index < credits.length - 1,
  }));
}

/** id 목록에서 하나를 위(-1)·아래(+1)로 옮긴 새 목록. 끝이면 null(보낼 필요 없음) */
export function moveId(
  ids: readonly string[],
  id: string,
  direction: -1 | 1
): string[] | null {
  const index = ids.indexOf(id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= ids.length) return null;
  const next = [...ids];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function toActorCandidates(
  members: readonly Member[],
  options: {
    query: string;
    defaultMemberIds: readonly string[];
    requireProfile: boolean;
  }
): ActorCandidate[] {
  const q = options.query.trim();
  const defaults = new Set(options.defaultMemberIds);
  return members
    .filter((m) => m.type === 'ACTOR' && (q === '' || m.name.includes(q)))
    .map((m) => ({
      memberId: m.id,
      actorProfileId: m.actorProfileId,
      name: m.name,
      isDefault: defaults.has(m.id),
      isDisabled: options.requireProfile && m.actorProfileId === null,
    }))
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
}
