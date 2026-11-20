// ----------------------------------------------------------------------
// SCR-D05 표시 모델·필터 — 단원 행을 화면 문자열로, 필터 pill 값을 목록 쿼리로(순수 함수 + spec).
// 가입일: joinedAt(date, KST 달력) → 'YYYY.MM.DD'. 없으면 createdAt(datetime) 의 KST 날짜(B1 — '-' 대신 실제 날짜).
// (U39) 공개 동의일: publicConsentAt(date) → 'YYYY.MM.DD', 없으면 '-'.
// ----------------------------------------------------------------------
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D05 } from '@/src/shared/messages/d05';
import type { LabelTone } from '@/src/theme/semantic';
import { MEMBER_TYPE_LABEL, type MemberType } from '@/src/types/codes';
import { ADMIN_PAGE_SIZE } from '@/src/types/common';
import type { Member, MemberListQuery } from '@/src/types/member';
import { formatCalendarDate, formatKstDate } from '@/src/utils/kst-date-format';
import { MEMBER_TYPE_TONE } from '@/src/utils/status-tone';

export type MemberFilter = 'ALL' | MemberType;

export const MEMBER_FILTER_OPTIONS: { value: MemberFilter; label: string }[] = [
  { value: 'ALL', label: MSG_D05.FILTER_ALL },
  { value: 'ACTOR', label: MSG_D05.FILTER_ACTOR },
  { value: 'GENERAL', label: MSG_D05.FILTER_GENERAL },
];

export interface MemberRowDisplay {
  id: string;
  name: string;
  profileImageUrl: string | null;
  typeLabel: string;
  typeTone: LabelTone;
  phoneText: string;
  joinedText: string;
  consentText: string;
}

export function toMemberListQuery(
  filter: MemberFilter,
  page: number
): MemberListQuery {
  return {
    type: filter === 'ALL' ? undefined : filter,
    page,
    size: ADMIN_PAGE_SIZE,
  };
}

export function formatJoinedDate(member: Member): string {
  return member.joinedAt
    ? formatCalendarDate(member.joinedAt)
    : formatKstDate(member.createdAt);
}

/** (U39) 공개 동의일 'YYYY.MM.DD', 없으면 '-' */
export function formatConsentDate(
  member: Pick<Member, 'publicConsentAt'>
): string {
  return member.publicConsentAt
    ? formatCalendarDate(member.publicConsentAt)
    : MSG_COMMON.EMPTY_VALUE;
}

export function toMemberRowDisplay(member: Member): MemberRowDisplay {
  return {
    id: member.id,
    name: member.name,
    profileImageUrl: member.profileImageUrl,
    typeLabel: MEMBER_TYPE_LABEL[member.type],
    typeTone: MEMBER_TYPE_TONE[member.type],
    phoneText: member.phone ?? MSG_COMMON.EMPTY_VALUE,
    joinedText: formatJoinedDate(member),
    consentText: formatConsentDate(member),
  };
}
