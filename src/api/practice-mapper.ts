// ----------------------------------------------------------------------
// 팀 계정·연습실 예약(관리) 매퍼(U34) + 전체 복사 문구(PR-8 — 사용자 형식 그대로).
// ----------------------------------------------------------------------
import type {
  AdminRoomReservation,
  AdminRoomReservationResponse,
  TeamAccount,
  TeamAccountList,
  TeamAccountListResponse,
  TeamAccountResponse,
} from '@/src/types/practice';

export function fromTeamAccountResponse(res: TeamAccountResponse): TeamAccount {
  return {
    id: res.id,
    label: res.label,
    username: res.username,
    password: res.password,
    isActive: res.isActive,
    revokedAt: res.revokedAt,
  };
}

export function fromTeamAccountListResponse(
  res: TeamAccountListResponse
): TeamAccountList {
  return { prefix: res.prefix, items: res.items.map(fromTeamAccountResponse) };
}

export function fromAdminRoomReservationResponse(
  res: AdminRoomReservationResponse
): AdminRoomReservation {
  return {
    id: res.id,
    startAt: new Date(res.startAt),
    endAt: new Date(res.endAt),
    teamName: res.teamName,
    memo: res.memo,
    performanceTitle: res.performanceTitle,
  };
}

/** 한 팀 줄 — "A - 아이디: Dear-A, 비밀번호 xxxx"(develop PR-8 형식) */
export function toTeamCopyLine(
  team: Pick<TeamAccount, 'label' | 'username' | 'password'>
): string {
  return `${team.label} - 아이디: ${team.username}, 비밀번호 ${team.password ?? ''}`.trimEnd();
}

/** 라벨 정렬 — 짧은 것 먼저, 같은 길이는 사전순(A < … < Z < AA) */
export function compareTeamLabels(a: string, b: string): number {
  return a.length - b.length || a.localeCompare(b);
}

/** 전체 복사 — 사용 중인 계정만, 라벨 순, " / " 로 잇는다(PR-8). 비밀번호를 모르는 계정은 뺀다 */
export function toTeamCopyAll(teams: readonly TeamAccount[]): string {
  return [...teams]
    .filter((t) => t.isActive && t.password !== null)
    .sort((a, b) => compareTeamLabels(a.label, b.label))
    .map(toTeamCopyLine)
    .join(' / ');
}
