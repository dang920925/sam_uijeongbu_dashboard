// ----------------------------------------------------------------------
// 계정 변경(U25, FN-41) 계약 — develop §11.5 `PATCH /admin/account`.
// 브라우저 → BFF `PATCH /api/auth/account`(app/api/auth/account) → 서버. BFF 는 새 accessToken 을
// httpOnly 쿠키로 바꿔 넣고 본문에서는 `{ username }` 만 돌려준다.
// ----------------------------------------------------------------------

export interface AccountUpdateRequest {
  /** 1~200 */
  currentPassword: string;
  /** 4~50, ^[A-Za-z0-9._-]+$ */
  newUsername: string;
  /** 15~200 — null 이면 비밀번호 유지 */
  newPassword?: string | null;
}

/** 서버 응답(BFF 만 받는다) */
export interface AccountUpdateUpstreamResponse {
  username: string;
  accessToken: string;
}

/** BFF → 브라우저 응답(토큰 제외) */
export interface AccountUpdateResponse {
  username: string;
}
