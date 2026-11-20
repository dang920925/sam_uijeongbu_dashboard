// ----------------------------------------------------------------------
// 고정 치수 토큰(간격 아님 — 고정 높이·캡 폭). 출처 design/tokens.css :root --layout-*·--size-*.
// ----------------------------------------------------------------------
export const LAYOUT = {
  sidebar: 240,
  rail: 72,
  header: 64,
  panel: 320,
  dialog: 512,
  dialogWide: 640,
  dialogConfirm: 384,
  login: 400,
  touch: 44,
  control: 40,
  controlSm: 32,
  avatarSm: 32,
  avatarMd: 48,
  avatarXl: 96,
  iconSm: 16,
  iconMd: 20,
  iconLg: 24,
  thumb: 64,
  contentMax: 1280,
  /** R1 designer §13.2 — 현장 터치 타깃(D13) */
  touchField: 48,
  /** R1 — D13 lg 현황 패널 · D15 카드 최대 폭 · 헤더 빠른 찾기 입력·결과 폭 */
  admissionPanel: 360,
  accountMax: 480,
  quickSearchInput: 256,
  quickSearchPopup: 384,
} as const;

export const RADIUS = { xs: 4, sm: 6, md: 8, lg: 12, pill: 9999 } as const;

export const SHADOW = {
  card: '0 1px 2px 0 rgba(0 0 0 / 0.05)',
  dialog:
    '0 10px 15px -3px rgba(0 0 0 / 0.1), 0 4px 6px -4px rgba(0 0 0 / 0.1)',
  snackbar: '0 10px 15px -3px rgba(0 0 0 / 0.2)',
  drawer: '0 25px 50px -12px rgba(0 0 0 / 0.25)',
} as const;
