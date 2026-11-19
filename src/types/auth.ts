// 인증(FN-08) — develop §3.3 `/auth/login`·`/auth/logout`·`/auth/me`.
export interface LoginRequest {
  username: string;
  password: string;
}
export interface LoginResponse {
  accessToken: string;
  expiresAt: string;
}
export interface MeResponse {
  id: string;
  username: string;
}
