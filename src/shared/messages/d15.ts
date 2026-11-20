// ----------------------------------------------------------------------
// SCR-D15 계정 설정 문구(MSG-D15-*) — 근거: design §6 SCR-D15(제안) · designer §13.7.4 W4 제안 문구 표 ·
// develop §11.5 오류 문구(ACC_001~003·검증 두 문구). 서버 오류(ACC_*·429 AUTH_002)는 서버 message 를 그대로
// 보이되, 화면이 먼저 막는 검증·불일치 문구는 같은 글자를 여기 둔다.
// ----------------------------------------------------------------------
export const MSG_D15 = {
  /** 페이지 h1 — 사이드바 메뉴 라벨과 같음(MSG_D00.NAV_ACCOUNT) */
  TITLE: '계정 설정',
  /** MSG-D15-SUB(제안) */
  SUBTITLE: '로그인 아이디와 비밀번호를 바꿉니다',
  /** MSG-D15-LABELS(design §6 필드 이름) */
  CURRENT_USERNAME: '현재 아이디',
  CURRENT_PASSWORD: '현재 비밀번호',
  NEW_USERNAME: '새 아이디',
  NEW_PASSWORD: '새 비밀번호',
  NEW_PASSWORD_OPTIONAL: '(비우면 유지)',
  CONFIRM_PASSWORD: '새 비밀번호 확인',
  /** MSG-D15-HELP-ID · HELP-PW(제안) */
  HELP_USERNAME: '4~50자 영문·숫자·. _ -',
  HELP_PASSWORD: '15자 이상',
  /** MSG-D15-NOTICE(제안) */
  NOTICE: '저장하면 다른 기기에서는 다시 로그인해야 합니다.',
  /** MSG-D15-TOGGLE — 보기 토글 aria-label(제안, 이름 고정 · 상태는 aria-pressed) */
  TOGGLE_PASSWORD: '비밀번호 보기',
  /** MSG-D15-MISMATCH(제안) — 화면에서 먼저 막고 요청하지 않는다 */
  MISMATCH: '새 비밀번호가 서로 다릅니다.',
  /** MSG-D15-SUCCESS(제안) */
  SUCCESS: '계정 정보가 바뀌었습니다.',
  /** MSG-D15-SAVE(design §6) */
  SAVE: '저장',
  /** 현재 비밀번호 빈 값 — 현행 로그인 빈 값 문구 패턴(MSG_D01.PASSWORD_REQUIRED) */
  CURRENT_PASSWORD_REQUIRED: '현재 비밀번호를 입력해주세요',
  /** develop §11.5 검증 문구(400 COMMON_001 — 화면 검증도 같은 문구) */
  INVALID_USERNAME: '아이디는 4~50자의 영문·숫자·._- 만 쓸 수 있습니다.',
  INVALID_PASSWORD: '비밀번호는 15자 이상이어야 합니다.',
  /** develop §11.5 ACC_003 — 화면에서도 먼저 막는다 */
  NO_CHANGE: '바뀐 내용이 없습니다.',
} as const;
