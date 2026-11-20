// 단원·배우 프로필(FN-11·12) — develop §3.4.
import type { MemberType } from '@/src/types/codes';

export interface MemberListItemResponse {
  id: string;
  name: string;
  type: MemberType;
  phone: string | null;
  isVisible: boolean;
  joinedAt: string | null;
  createdAt: string;
  profileImageUrl: string | null;
}

export interface MemberCreateRequest {
  name: string;
  phone?: string | null;
  type: MemberType;
}

export interface MemberUpdateRequest {
  name?: string;
  phone?: string | null;
  type?: MemberType;
  isVisible?: boolean;
}

export interface MemberListQuery {
  type?: MemberType;
  page?: number;
  size?: number;
}

export interface FilmographyResponse {
  title: string;
  role: string | null;
  year: number;
}

export interface ActorProfileResponse {
  memberId: string;
  profileImageUrl: string | null;
  intro: string | null;
  snsUrl: string | null;
  activityStart: string | null;
  displayOrder: number;
  filmography: FilmographyResponse[];
}

export interface ActorProfileUpsertRequest {
  profileImageUrl?: string | null;
  intro?: string | null;
  snsUrl?: string | null;
  activityStart?: string | null;
  displayOrder?: number;
  filmography?: { title: string; role?: string | null; year: number }[];
}

/** 화면 모델 */
export interface Member {
  id: string;
  name: string;
  type: MemberType;
  phone: string | null;
  isVisible: boolean;
  joinedAt: string | null;
  createdAt: string;
  profileImageUrl: string | null;
}

export interface Filmography {
  title: string;
  role: string | null;
  year: number;
}

export interface ActorProfile {
  memberId: string;
  profileImageUrl: string | null;
  intro: string | null;
  snsUrl: string | null;
  activityStart: string | null;
  displayOrder: number;
  filmography: Filmography[];
}

/** 단원 추가·"단원으로 등록" 공용 폼 입력(design SCR-D06 — D05 폼 재사용) */
export interface MemberFormInput {
  name: string;
  phone: string;
  type: MemberType;
}
