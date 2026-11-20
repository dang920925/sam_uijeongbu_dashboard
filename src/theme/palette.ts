// ----------------------------------------------------------------------
// 원시 색(raw palette) — hex 허용 유일 위치(가이드 §11.3).
// 출처: U30 안 A '백스테이지'(designer.md §15 · design/u30/tokens-A.css) — 따뜻한 다크 단일 테마.
//   사용자 선택 2026-11-20 Q4 "A로해주세요"(project-manager-develop §14). 이전 slate 라이트 값은 v1.1.1 태그에 있다.
// 반투명 색(rgb … / a)은 hex 가 아니라 이 파일의 ALPHA 에 둔다.
// ----------------------------------------------------------------------
export const RAW = {
  // 바탕·면 (--c-bg · --c-card-bg · --c-raised · --c-muted · --c-divider · --table-head-bg)
  bg: '#110e0d',
  card: '#1a1614',
  raised: '#221d1a',
  muted: '#29231f',
  divider: '#2e2724',
  tableHead: '#1f1a18',
  chipBorder: '#3a322e',
  borderStrong: '#7a6d62',
  // 글자 (--c-text · --c-text-2 · --c-header-fg · --label-neutral-fg)
  text: '#f6efe4',
  text2: '#b8aa9a',
  headerFg: '#e9dfd2',
  textSoft: '#d9cdbf',
  // 주 색 = 골드 (--c-primary · -hover · --c-on-primary)
  gold: '#e8a020',
  goldHover: '#f2b443',
  goldDeep: '#b8781a',
  onGold: '#1a0f00',
  // 상태 글자 · 위험 버튼
  errorText: '#ff8f86',
  successText: '#7fdc9f',
  warningText: '#f6c45e',
  danger: '#c7353c',
  dangerHover: '#b02e35',
  white: '#ffffff',
  black: '#000000',
  // Label 글자 (어두운 바탕용)
  labelInfo: '#a9c2ff',
  labelSuccess: '#86e3a6',
  labelError: '#ffa29b',
  // 사이드바 버건디 벨벳 (--c-nav-*)
  navTop: '#34121a',
  navMid: '#220c11',
  navBottom: '#170a0c',
  navFg: '#dcc6c2',
  navFgActive: '#ffd27a',
  // KPI 아이콘 타일 글자색 계열(--kpi-*-fg) — 타일 바탕은 ALPHA
  kpiRose: '#f39aa4',
  kpiViolet: '#c4b0ff',
} as const;

/** 반투명 역할 색(tokens-A.css 의 rgb(… / a) 값 그대로) */
export const ALPHA = {
  spotlight: 'rgb(232 160 32 / 0.13)',
  navGlow: 'rgb(232 160 32 / 0.20)',
  navActiveBg: 'rgb(232 160 32 / 0.16)',
  navHoverBg: 'rgb(255 255 255 / 0.06)',
  navDivider: 'rgb(255 255 255 / 0.08)',
  navPleatDark: 'rgb(0 0 0 / 0.18)',
  navPleatLight: 'rgb(255 255 255 / 0.025)',
  headerBg: 'rgb(17 14 13 / 0.72)',
  primarySoft: 'rgb(232 160 32 / 0.14)',
  labelNeutralBg: 'rgb(246 239 228 / 0.08)',
  labelInfoBg: 'rgb(125 165 255 / 0.16)',
  labelSuccessBg: 'rgb(74 222 128 / 0.14)',
  labelWarningBg: 'rgb(232 160 32 / 0.18)',
  labelErrorBg: 'rgb(255 107 107 / 0.16)',
  kpiGoldBg: 'rgb(232 160 32 / 0.16)',
  kpiRoseBg: 'rgb(214 84 98 / 0.20)',
  kpiGreenBg: 'rgb(74 222 128 / 0.14)',
  kpiVioletBg: 'rgb(167 139 250 / 0.18)',
  rowDoneBg: 'rgb(74 222 128 / 0.06)',
  cardHighlight: 'rgb(255 255 255 / 0.04)',
  shadowCard: 'rgb(0 0 0 / 0.35)',
  shadowPanel: 'rgb(0 0 0 / 0.45)',
  panelRing: 'rgb(232 160 32 / 0.22)',
  primaryGlow: 'rgb(232 160 32 / 0.28)',
} as const;
