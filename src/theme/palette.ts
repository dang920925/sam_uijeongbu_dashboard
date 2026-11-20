// ----------------------------------------------------------------------
// 원시 색(raw palette) — hex 허용 유일 위치(가이드 §11.3).
// 출처: designer 시안 design/tokens.css `.app-admin` (현행 대시보드 Tailwind slate 계열).
// ⚑ 표시는 designer.md §8.1 의 대비·filled 금지 보정값 — 사용자 확정(2026-11-19 "보정 적용 (기본안)").
//   되돌릴 때는 이 파일의 해당 줄만 현행 값으로 바꾼다.
// ----------------------------------------------------------------------
export const RAW = {
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',
  white: '#ffffff',
  black: '#000000',
  red50: '#fef2f2',
  red100: '#fee2e2',
  red200: '#fecaca',
  red300: '#fca5a5',
  red600: '#dc2626', // ⚑ 현행 red-500 #ef4444 (흰 글자 3.76:1 → 4.83:1)
  red700: '#b91c1c',
  green50: '#f0fdf4',
  green100: '#dcfce7',
  green200: '#bbf7d0',
  green600: '#16a34a',
  green700: '#15803d',
  green800: '#166534',
  yellow100: '#fef9c3',
  yellow800: '#854d0e',
  amber50: '#fffbeb',
  amber200: '#fde68a',
  amber700: '#b45309', // ⚑ 현행 amber-600 #d97706 (3.07:1 → 4.84:1)
  blue50: '#eff6ff',
  blue100: '#dbeafe',
  blue700: '#1d4ed8',
  kpiBlue: '#3b82f6',
  kpiEmerald: '#10b981',
  kpiAmber: '#f59e0b',
  kpiPurple: '#a855f7',
} as const;
