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
  },
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
  },
  galleries: {
    list: `${admin}/galleries`,
    detail: (id: string) => `${admin}/galleries/${id}`,
  },
  schedules: {
    list: `${admin}/schedules`,
    detail: (id: string) => `${admin}/schedules/${id}`,
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
