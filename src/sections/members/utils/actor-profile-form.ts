// ----------------------------------------------------------------------
// 배우 프로필 패널 폼(FN-12) — 서버 모델 ↔ 입력 문자열, 검증(순수 함수 + spec).
// - 홈페이지 노출(isVisible)은 MemberListItem 소속(PATCH members) 이라 폼에 같이 들고 저장 때 나눠 보낸다.
// - 검증 문구는 기획에 있는 것만: 소개 200자 초과 "한 줄 소개는 200자 이내로 입력해주세요."(develop FN-12).
//   노출 순서(0~9999)는 도움말 "0~9999" 를 오류 색으로, 출연작 작품명·연도(1900~2100)는 칸 테두리만 오류로 표시한다
//   (기획에 문구 없음 — 지어내지 않음). SNS URL(https)은 서버 검증 문구를 스낵바로 보인다.
// - 노출 순서 빈 값은 0(서버 기본값).
// - (U39) 홈페이지 공개 동의일(publicConsentAt)도 MemberListItem 소속 — 노출과 함께 PATCH members 로 보낸다.
//   노출을 켰는데 동의일이 비면 경고만 한다(저장은 막지 않음 — 사용자 결정 2026-11-20).
// ----------------------------------------------------------------------
import { MSG_D05 } from '@/src/shared/messages/d05';
import type { ActorProfile, Member } from '@/src/types/member';

export const INTRO_MAX = 200;
const DISPLAY_ORDER_MAX = 9999;
const YEAR_MIN = 1900;
const YEAR_MAX = 2100;

export interface FilmographyFormRow {
  /** 목록 렌더 키(서버로 보내지 않음) */
  key: string;
  title: string;
  role: string;
  year: string;
}

export interface ActorProfileForm {
  isVisible: boolean;
  /** (U39) YYYY-MM-DD 또는 빈 문자열 */
  publicConsentAt: string;
  intro: string;
  snsUrl: string;
  activityStart: string;
  displayOrder: string;
  filmography: FilmographyFormRow[];
}

export interface FilmographyRowErrors {
  title: boolean;
  year: boolean;
}

export interface ActorProfileFormErrors {
  intro: string | null;
  displayOrder: string | null;
  filmography: FilmographyRowErrors[];
}

export function emptyFilmographyRow(key: string): FilmographyFormRow {
  return { key, title: '', role: '', year: '' };
}

export function toActorProfileForm(
  member: Member,
  profile: ActorProfile,
  makeKey: () => string
): ActorProfileForm {
  return {
    isVisible: member.isVisible,
    publicConsentAt: member.publicConsentAt ?? '',
    intro: profile.intro ?? '',
    snsUrl: profile.snsUrl ?? '',
    activityStart: profile.activityStart ?? '',
    displayOrder: String(profile.displayOrder),
    filmography: profile.filmography.map((f) => ({
      key: makeKey(),
      title: f.title,
      role: f.role ?? '',
      year: String(f.year),
    })),
  };
}

/** (U39) 공개를 켰는데 동의일이 비었는가 — 경고만(저장은 그대로) */
export function isPublicConsentMissing(
  form: Pick<ActorProfileForm, 'isVisible' | 'publicConsentAt'>
): boolean {
  return form.isVisible && form.publicConsentAt.trim() === '';
}

/** (U39) 단원 쪽 바뀐 값만 PATCH members 본문으로 — 없으면 null(요청 안 함) */
export function toMemberChangeInput(
  form: Pick<ActorProfileForm, 'isVisible' | 'publicConsentAt'>,
  member: Pick<Member, 'isVisible' | 'publicConsentAt'>
): { isVisible?: boolean; publicConsentAt?: string | null } | null {
  const consent = form.publicConsentAt.trim() || null;
  const input = {
    ...(form.isVisible !== member.isVisible && { isVisible: form.isVisible }),
    ...(consent !== (member.publicConsentAt ?? null) && {
      publicConsentAt: consent,
    }),
  };
  return Object.keys(input).length > 0 ? input : null;
}

function parseIntInRange(value: string, min: number, max: number) {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const n = Number(trimmed);
  return n >= min && n <= max ? n : null;
}

export function validateActorProfileForm(
  form: ActorProfileForm
): ActorProfileFormErrors {
  const order = form.displayOrder.trim();
  return {
    intro: form.intro.length > INTRO_MAX ? MSG_D05.INTRO_TOO_LONG : null,
    displayOrder:
      order === '' || parseIntInRange(order, 0, DISPLAY_ORDER_MAX) !== null
        ? null
        : MSG_D05.DISPLAY_ORDER_HELP,
    filmography: form.filmography.map((row) => ({
      title: row.title.trim() === '',
      year: parseIntInRange(row.year, YEAR_MIN, YEAR_MAX) === null,
    })),
  };
}

export function hasActorProfileFormError(
  errors: ActorProfileFormErrors
): boolean {
  return (
    errors.intro !== null ||
    errors.displayOrder !== null ||
    errors.filmography.some((row) => row.title || row.year)
  );
}

/** 검증을 통과한 폼 → 저장할 프로필(사진은 서버 값 그대로 — 사진은 올리는 즉시 따로 저장) */
export function toActorProfileInput(
  form: ActorProfileForm,
  memberId: string,
  profileImageUrl: string | null
): ActorProfile {
  const order = form.displayOrder.trim();
  return {
    memberId,
    profileImageUrl,
    intro: form.intro,
    snsUrl: form.snsUrl,
    activityStart: form.activityStart,
    displayOrder: order === '' ? 0 : Number(order),
    filmography: form.filmography.map((row) => ({
      title: row.title,
      role: row.role,
      year: Number(row.year.trim()),
    })),
  };
}
