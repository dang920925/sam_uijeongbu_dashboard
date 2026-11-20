// ----------------------------------------------------------------------
// SCR-D01 로그인 문구(MSG-D01-*) — 근거: 현행 Login.tsx(S-code-20) · design SCR-D01 · develop FN-08·§3.1.
// 429(AUTH_002)는 서버 message 를 그대로 보이므로 여기에 두지 않는다(designer W3 D01 "서버 message 그대로").
// ----------------------------------------------------------------------
export const MSG_D01 = {
  /** 머리 — Login.tsx:41 */
  LOGO: 'SAM 의정부',
  /** 부제 — Login.tsx:42 */
  SUBTITLE: '관리자 로그인',
  /** 필드 라벨·placeholder — Login.tsx:47-64 */
  USERNAME: '아이디',
  USERNAME_PH: '아이디 입력',
  PASSWORD: '비밀번호',
  PASSWORD_PH: '비밀번호 입력',
  /** 빈 값 — Login.tsx:11-12 */
  USERNAME_REQUIRED: '아이디를 입력해주세요',
  PASSWORD_REQUIRED: '비밀번호를 입력해주세요',
  /** 401 실패 박스 — Login.tsx:72-74, B7, develop §3.1 AUTH_001 */
  AUTH_FAILED: '아이디 또는 비밀번호가 올바르지 않습니다.',
  /** 버튼 — Login.tsx:77-83 */
  SUBMIT: '로그인',
} as const;
