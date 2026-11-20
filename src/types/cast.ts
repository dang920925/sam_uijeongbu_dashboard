// ----------------------------------------------------------------------
// 배역·캐스팅·참여자 관리 계약(R3 U26 · U33 — develop §11.7 · §17.3 · §17.5). 화면 모델도 같은 모양이다.
// ----------------------------------------------------------------------

/** 관리 캐스트 1명 — isVisible = 지금 공개 배우인지(배우 단원 · 노출 · 미삭제) */
export interface AdminRoleCastResponse {
  actorProfileId: string;
  memberId: string;
  name: string;
  isVisible: boolean;
  note: string | null;
}

export interface AdminRoleResponse {
  id: string;
  /** null = "출연" 묶음 */
  name: string | null;
  description: string | null;
  sortOrder: number;
  isRecruiting: boolean;
  /** 지금 공개 화면에 나오는지(숨김 이유 표시용) */
  publicNow: boolean;
  defaultCast: AdminRoleCastResponse[];
}

export interface ShowCastCellResponse {
  showId: string;
  roleId: string;
  isOverride: boolean;
  publicNow: boolean;
  actors: AdminRoleCastResponse[];
}

export interface ShowCastGridResponse {
  shows: { id: string; showDate: string; startTime: string }[];
  roles: { id: string; name: string | null }[];
  cells: ShowCastCellResponse[];
}

export interface AdminCreditLinkResponse {
  id: string;
  name: string;
  /** 지금 공개 대상인지(연출진 노출 · 배우 공개 규칙) */
  isVisible: boolean;
}

export interface AdminCreditResponse {
  id: string;
  title: string;
  staff: AdminCreditLinkResponse | null;
  member: AdminCreditLinkResponse | null;
  displayName: string | null;
  sortOrder: number;
  isVisible: boolean;
  publicNow: boolean;
}

export interface MemberCastResponse {
  roleId: string;
  roleName: string | null;
  performanceId: string;
  performanceTitle: string;
  performanceVisible: boolean;
  year: number | null;
  note: string | null;
  showOverrideCount: number;
}

export interface MemberCreditResponse {
  creditId: string;
  title: string;
  performanceId: string;
  performanceTitle: string;
  isVisible: boolean;
}

export interface MemberSamCreditsResponse {
  casts: MemberCastResponse[];
  credits: MemberCreditResponse[];
}

// ── 요청 ──────────────────────────────────────────────────

export interface RoleCreateRequest {
  /** null = "출연" 묶음(공연당 1개 — 있으면 409 ROL_004) */
  name: string | null;
  description?: string | null;
  isRecruiting?: boolean;
}

export type RolePatchRequest = Partial<RoleCreateRequest>;

export interface CastActorRequest {
  actorProfileId: string;
  note?: string | null;
}

export interface CreditCreateRequest {
  title: string;
  staffId?: string | null;
  memberId?: string | null;
  displayName?: string | null;
  isVisible?: boolean;
}

export type CreditPatchRequest = Partial<CreditCreateRequest>;

export interface MemberCastCreateRequest {
  performanceId: string;
  /** 비우면 "출연" 묶음(없으면 서버가 만든다) */
  roleId?: string | null;
  note?: string | null;
}

export interface MemberCreditCreateRequest {
  performanceId: string;
  title: string;
}

// ── 화면 모델 ──────────────────────────────────────────────

export type AdminRole = AdminRoleResponse;
export type RoleCast = AdminRoleCastResponse;
export type ShowCastGrid = ShowCastGridResponse;
export type ShowCastCell = ShowCastCellResponse;
export type AdminCredit = AdminCreditResponse;
export type MemberSamCredits = MemberSamCreditsResponse;
export type MemberCast = MemberCastResponse;
export type MemberCredit = MemberCreditResponse;

/** 참여자 사람 연결 방식(design §12 — 연출진 검색 / 단원 검색 / 이름만) */
export type CreditPersonKind = 'staff' | 'member' | 'name';

/** 참여자 다이얼로그 폼 값 */
export interface CreditFormInput {
  title: string;
  kind: CreditPersonKind;
  staffId: string | null;
  memberId: string | null;
  displayName: string;
  isVisible: boolean;
}

/** 배역 다이얼로그 폼 값 — isEnsemble 이면 이름 없이 "출연" 묶음 */
export interface RoleFormInput {
  isEnsemble: boolean;
  name: string;
  description: string;
}
