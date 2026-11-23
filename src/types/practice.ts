// ----------------------------------------------------------------------
// 팀 계정·연습실 예약(관리) 타입(U34 — 계약 develop §18.2 + 서버 보완: password string|null, 예약 항목 performanceId·Title).
// XResponse = 서버 응답 그대로, 그 밖은 화면 모델.
// (U45) 팀 구성 표(배우 × 팀) · 예약 참석자(이름·인원 수).
// ----------------------------------------------------------------------
export interface TeamAccountResponse {
  id: string;
  label: string;
  username: string;
  /** 복호화한 비밀번호 — 복호화할 수 없으면 null(재발급 필요) */
  password: string | null;
  isActive: boolean;
  revokedAt: string | null;
  createdAt: string;
}

export interface TeamAccountListResponse {
  prefix: string | null;
  items: TeamAccountResponse[];
}

export interface AdminRoomReservationResponse {
  id: string;
  startAt: string;
  endAt: string;
  teamName: string;
  memo: string | null;
  performanceId: string;
  performanceTitle: string;
  /** (U45) 참석자(이름 순) */
  attendees: TeamMemberResponse[];
  attendeeCount: number;
}

/** (U45) 배우 1명 — 예약 참석자 */
export interface TeamMemberResponse {
  memberId: string;
  name: string;
}

/** (U45) GET /admin/performances/{id}/team-members */
export interface TeamRosterResponse {
  teams: {
    teamAccountId: string;
    label: string;
    username: string;
    isActive: boolean;
    memberIds: string[];
  }[];
  members: { memberId: string; name: string; roleNames: string[] }[];
}

export type TeamRoster = TeamRosterResponse;

export interface TeamAccount {
  id: string;
  label: string;
  username: string;
  password: string | null;
  isActive: boolean;
  revokedAt: string | null;
}

export interface TeamAccountList {
  prefix: string | null;
  items: TeamAccount[];
}

export interface AdminRoomReservation {
  id: string;
  startAt: Date;
  endAt: Date;
  teamName: string;
  memo: string | null;
  performanceTitle: string;
  /** (U45) 참석자 이름(이름 순) */
  attendeeNames: string[];
}
