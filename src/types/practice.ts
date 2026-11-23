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

/** (U46) 막은 시간 발생분 — 관리 예약 목록 응답 blocks */
export interface RoomBlockOccurrenceResponse {
  blockId: string;
  title: string;
  date: string;
  startAt: string;
  endAt: string;
}

export interface AdminRoomScheduleResponse {
  items: AdminRoomReservationResponse[];
  blocks?: RoomBlockOccurrenceResponse[];
}

export interface RoomBlockOccurrence {
  blockId: string;
  title: string;
  date: string;
  startAt: Date;
  endAt: Date;
}

/** 관리 연습실 일정 — 예약 + 막은 시간 */
export interface AdminRoomSchedule {
  reservations: AdminRoomReservation[];
  blocks: RoomBlockOccurrence[];
}

export type RoomBlockRepeat = 'NONE' | 'WEEKLY';

/** (U46) GET /admin/room-blocks items */
export interface RoomBlockResponse {
  id: string;
  title: string;
  memo: string | null;
  repeat: RoomBlockRepeat;
  /** ISO 1=월 … 7=일 */
  weekdays: number[];
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
  skipDates: string[];
  createdAt: string;
}

export type RoomBlock = Omit<RoomBlockResponse, 'createdAt'>;

/** 추가·수정·겹침 확인 본문 */
export interface RoomBlockRequest {
  title: string;
  memo: string | null;
  repeat: RoomBlockRepeat;
  weekdays: number[];
  startTime: string;
  endTime: string;
  startDate: string;
  endDate: string;
  onConflict?: 'CANCEL' | 'KEEP';
}

/** POST /admin/room-blocks/conflicts items */
export interface RoomBlockConflictResponse {
  id: string;
  teamName: string;
  performanceTitle: string;
  startAt: string;
  endAt: string;
}
