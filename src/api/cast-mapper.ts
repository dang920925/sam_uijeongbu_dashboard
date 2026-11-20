// ----------------------------------------------------------------------
// 배역·캐스팅·참여자 매퍼(R3 — develop §11.7 · §17.3 · §17.5). 응답은 null 키를 지키고(옛 응답 대비 ?? 보정),
// 요청은 폼 값의 앞뒤 공백을 지우고 빈 글자는 null 로 바꾼다.
// ----------------------------------------------------------------------
import type {
  AdminCredit,
  AdminCreditResponse,
  AdminRole,
  AdminRoleCastResponse,
  AdminRoleResponse,
  CreditCreateRequest,
  CreditFormInput,
  RoleCast,
  RoleCreateRequest,
  RoleFormInput,
} from '@/src/types/cast';

const blankToNull = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

export function fromRoleCastResponse(res: AdminRoleCastResponse): RoleCast {
  return {
    actorProfileId: res.actorProfileId,
    memberId: res.memberId,
    name: res.name,
    isVisible: res.isVisible,
    note: res.note ?? null,
  };
}

export function fromAdminRoleResponse(res: AdminRoleResponse): AdminRole {
  return {
    id: res.id,
    name: res.name ?? null,
    description: res.description ?? null,
    sortOrder: res.sortOrder,
    isRecruiting: res.isRecruiting,
    publicNow: res.publicNow,
    defaultCast: (res.defaultCast ?? []).map(fromRoleCastResponse),
  };
}

export function fromAdminCreditResponse(res: AdminCreditResponse): AdminCredit {
  return {
    id: res.id,
    title: res.title,
    staff: res.staff ?? null,
    member: res.member ?? null,
    displayName: res.displayName ?? null,
    sortOrder: res.sortOrder,
    isVisible: res.isVisible,
    publicNow: res.publicNow,
  };
}

/** 배역 폼 → 요청. "출연" 묶음이면 이름 null(설명은 그대로) */
export function toRoleRequest(input: RoleFormInput): RoleCreateRequest {
  return {
    name: input.isEnsemble ? null : input.name.trim(),
    description: blankToNull(input.description),
  };
}

/** 참여자 폼 → 요청. 연결은 고른 갈래 하나만 보내고 나머지는 null(이름만이면 displayName) */
export function toCreditRequest(input: CreditFormInput): CreditCreateRequest {
  return {
    title: input.title.trim(),
    staffId: input.kind === 'staff' ? input.staffId : null,
    memberId: input.kind === 'member' ? input.memberId : null,
    displayName: input.kind === 'name' ? blankToNull(input.displayName) : null,
    isVisible: input.isVisible,
  };
}

/** 수정 다이얼로그 초기값 */
export function toCreditFormInput(credit: AdminCredit): CreditFormInput {
  return {
    title: credit.title,
    kind: credit.staff ? 'staff' : credit.member ? 'member' : 'name',
    staffId: credit.staff?.id ?? null,
    memberId: credit.member?.id ?? null,
    displayName:
      credit.staff || credit.member ? '' : (credit.displayName ?? ''),
    isVisible: credit.isVisible,
  };
}
