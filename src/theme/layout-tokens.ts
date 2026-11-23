// ----------------------------------------------------------------------
// 고정 치수 토큰(간격 아님 — 고정 높이·캡 폭). 출처 design/tokens.css :root --layout-*·--size-*.
// ----------------------------------------------------------------------
import { ALPHA } from '@/src/theme/palette';

export const LAYOUT = {
  sidebar: 240,
  rail: 72,
  header: 64,
  panel: 320,
  dialog: 512,
  dialogWide: 640,
  /** U51 보이는 위치 조정 창(designer §21.2 — --sp-16 × 15) */
  dialogCrop: 960,
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

// U30 안 A(design/u30/tokens-A.css --r-* · --sh-*): 컨트롤 10 · 카드 14 · 칩 pill. 깊은 그림자 + 주 버튼 골드 글로우.
export const RADIUS = { xs: 6, sm: 10, md: 14, lg: 16, pill: 9999 } as const;

export const SHADOW = {
  card: `inset 0 1px 0 ${ALPHA.cardHighlight}, 0 12px 32px ${ALPHA.shadowCard}`,
  dialog: `0 0 0 1px ${ALPHA.panelRing}, 0 16px 40px ${ALPHA.shadowPanel}`,
  snackbar: `0 12px 32px ${ALPHA.shadowPanel}`,
  drawer: `0 16px 40px ${ALPHA.shadowPanel}`,
  primary: `0 6px 20px ${ALPHA.primaryGlow}`,
} as const;
