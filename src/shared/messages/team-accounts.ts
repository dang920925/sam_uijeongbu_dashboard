// ----------------------------------------------------------------------
// U34 SCR-D04 '팀 계정' 탭 문구 — 기획 design §13 의 (제안) 문구 + 계약 develop §18.2 오류 문구.
// ----------------------------------------------------------------------
export const MSG_TEAMS = {
  TITLE: '팀 계정',
  SUBTITLE:
    '배우들이 홈페이지에서 연습실을 예약할 때 쓰는 팀 아이디와 비밀번호입니다.',
  NOTICE: '공연이 끝나면 팀 계정은 자동으로 폐기됩니다.',
  PREFIX_LABEL: '아이디 접두어',
  PREFIX_HELPER:
    '영문·숫자 1~20자. 바꾸면 모든 팀 아이디가 바뀌고 로그인한 팀은 다시 로그인해야 합니다.',
  PREFIX_INVALID: '접두어는 영문·숫자 1~20자여야 합니다.',
  PREFIX_SAVE: '접두어 저장',
  PREFIX_SAVED: '접두어를 바꿨습니다.',
  ADD: '팀 추가',
  CREATE_FIRST: '팀 계정 만들기',
  EMPTY: '아직 팀 계정이 없습니다. "팀 계정 만들기"로 A 팀 계정을 만드세요.',
  COPY_ALL: '전체 복사',
  COPY_ALL_EMPTY: '복사할 사용 중인 팀 계정이 없습니다.',
  COPIED: '복사되었습니다.',
  COPY_FAILED: '복사하지 못했습니다. 직접 선택해 복사해주세요.',
  CREATED: (username: string) => `${username} 팀 계정을 만들었습니다.`,
  COL_LABEL: '팀',
  COL_USERNAME: '아이디',
  COL_PASSWORD: '비밀번호',
  COL_ACTIVE: '사용',
  COL_ACTIONS: '동작',
  TABLE_ARIA: '팀 계정 목록',
  PASSWORD_MASK: '••••••••••••',
  PASSWORD_UNKNOWN: '재발급 필요',
  SHOW_PASSWORD: (label: string) => `${label} 팀 비밀번호 보기`,
  HIDE_PASSWORD: (label: string) => `${label} 팀 비밀번호 가리기`,
  COPY_ROW: (label: string) => `${label} 팀 아이디·비밀번호 복사`,
  ACTIVE_ARIA: (label: string) => `${label} 팀 계정 사용`,
  REISSUE: '재발급',
  REISSUE_ARIA: (label: string) => `${label} 팀 비밀번호 재발급`,
  REISSUE_CONFIRM: '비밀번호를 재발급하시겠습니까?',
  REISSUE_DESC: (username: string) =>
    `${username} — 이전 비밀번호는 더 이상 쓸 수 없고 로그인한 배우들은 다시 로그인해야 합니다.`,
  REISSUED: '새 비밀번호를 만들었습니다.',
  REVOKED: '폐기됨',
  INACTIVE: '사용 안 함',
  ACTIVE: '사용 중',
} as const;
