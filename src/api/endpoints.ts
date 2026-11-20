// ----------------------------------------------------------------------
// 모든 엔드포인트는 여기 한 곳에(가이드 A6.3 endpoints 규약). 경로는 develop §3.4 관리 API.
// 브라우저 기준 BFF 경로 = BFF_API_PREFIX + 서버 경로(`/api/v1` 이후).
// ----------------------------------------------------------------------
import { BFF_API_PREFIX } from '@/src/config-global';

const admin = `${BFF_API_PREFIX}/admin`;

export const endpoints = {
  auth: {
    /** BFF 인증 라우트(쿠키 발급·삭제) — app/api/auth/{login,logout} */
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    me: `${BFF_API_PREFIX}/auth/me`,
  },
  dashboard: { summary: `${admin}/dashboard/summary` },
  performances: {
    list: `${admin}/performances`,
    detail: (id: string) => `${admin}/performances/${id}`,
    classes: (id: string) => `${admin}/performances/${id}/classes`,
    /** FN-28 회차 목록·추가(develop §11.4) */
    shows: (id: string) => `${admin}/performances/${id}/shows`,
    /** FN-29 예매 설정 GET·PUT */
    bookingPolicy: (id: string) => `${admin}/performances/${id}/booking-policy`,
    /** 가격 등급 목록·추가(develop §11.10) */
    priceTiers: (id: string) => `${admin}/performances/${id}/price-tiers`,
  },
  /** 가격 등급 단건(develop §11.10) — PATCH·DELETE, 링크 토큰 재발급 */
  priceTiers: {
    detail: (id: string) => `${admin}/price-tiers/${id}`,
    linkToken: (id: string) => `${admin}/price-tiers/${id}/link-token`,
  },
  /** FN-28 회차 단건·입장 체크 회차 선택(develop §11.4) */
  shows: {
    /** `GET ?from=YYYY-MM-DD` — 입장 체크 회차 선택용(공연명 포함) */
    list: `${admin}/shows`,
    detail: (id: string) => `${admin}/shows/${id}`,
    /** FN-36 입장 명단 `GET ?q=` */
    admission: (id: string) => `${admin}/shows/${id}/admission`,
  },
  /** FN-33·34 예매 관리(develop §11.4) */
  reservations: {
    list: `${admin}/reservations`,
    summary: `${admin}/reservations/summary`,
    detail: (id: string) => `${admin}/reservations/${id}`,
    confirm: (id: string) => `${admin}/reservations/${id}/confirm`,
    unconfirm: (id: string) => `${admin}/reservations/${id}/unconfirm`,
    cancel: (id: string) => `${admin}/reservations/${id}/cancel`,
    restore: (id: string) => `${admin}/reservations/${id}/restore`,
    /** 등급 줄 교체(develop §11.10) `{ items?, customLine?, amountOverride?, version }` */
    items: (id: string) => `${admin}/reservations/${id}/items`,
    cancelOverdue: `${admin}/reservations/cancel-overdue`,
    /** FN-36 입장 증감 `{ delta }` */
    admission: (id: string) => `${admin}/reservations/${id}/admission`,
    /** FN-36 현장 확정 + 입장 `{ version, admit }` */
    confirmAndAdmit: (id: string) =>
      `${admin}/reservations/${id}/confirm-and-admit`,
  },
  /** FN-35 단원 초대 링크 */
  inviteCodes: {
    list: `${admin}/members/invite-codes`,
    issue: (memberId: string) => `${admin}/members/${memberId}/invite-code`,
  },
  /** FN-41 계정 변경 — BFF 라우트(app/api/auth/account)가 새 토큰을 쿠키로 바꿔 넣는다(develop §11.5) */
  account: { update: '/api/auth/account' },
  classes: {
    list: `${admin}/classes`,
    detail: (id: string) => `${admin}/classes/${id}`,
  },
  members: {
    list: `${admin}/members`,
    detail: (id: string) => `${admin}/members/${id}`,
    actorProfile: (id: string) => `${admin}/members/${id}/actor-profile`,
  },
  applications: {
    list: `${admin}/applications`,
    pendingCount: `${admin}/applications/pending-count`,
    detail: (id: string) => `${admin}/applications/${id}`,
    approve: (id: string) => `${admin}/applications/${id}/approve`,
    reject: (id: string) => `${admin}/applications/${id}/reject`,
    member: (id: string) => `${admin}/applications/${id}/member`,
    contact: (id: string) => `${admin}/applications/${id}/contact`,
    progress: (id: string) => `${admin}/applications/${id}/progress`,
  },
  galleries: {
    list: `${admin}/galleries`,
    detail: (id: string) => `${admin}/galleries/${id}`,
  },
  schedules: {
    list: `${admin}/schedules`,
    detail: (id: string) => `${admin}/schedules/${id}`,
    cancel: (id: string) => `${admin}/schedules/${id}/cancel`,
    restore: (id: string) => `${admin}/schedules/${id}/restore`,
    cancelImpact: (id: string) => `${admin}/schedules/${id}/cancel-impact`,
  },
  staff: {
    list: `${admin}/staff`,
    detail: (id: string) => `${admin}/staff/${id}`,
  },
  popups: {
    list: `${admin}/popups`,
    detail: (id: string) => `${admin}/popups/${id}`,
  },
  uploads: { create: `${admin}/uploads` },
} as const;
