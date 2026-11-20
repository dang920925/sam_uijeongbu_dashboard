// ----------------------------------------------------------------------
// 현장(SCR-D13) 공통 치수·테두리 — 터치 48(designer §13.2 `--size-touch-field`), 보조 버튼·검색 칸·스테퍼 테두리는
// 대비 3:1 이상(지휘자 결정 2026-11-20 `--color-input-border-strong` = slate-500 → semantic.input.borderStrong).
// ----------------------------------------------------------------------
import { LAYOUT } from '@/src/theme/layout-tokens';

export const ADMISSION_SX = {
  touch: LAYOUT.touchField,
  /** lg 오른쪽 현황 패널(designer `--layout-admission-panel`) */
  panel: LAYOUT.admissionPanel,
  strongBorder: 'semantic.input.borderStrong',
  /** 보조(outlined) 버튼 */
  outlinedButton: {
    minHeight: LAYOUT.touchField,
    borderColor: 'semantic.input.borderStrong',
    color: 'text.primary',
    '&:hover': { borderColor: 'text.primary' },
    '&.Mui-disabled': { borderColor: 'divider' },
  },
  /** 주(contained) 버튼 */
  containedButton: { minHeight: LAYOUT.touchField },
} as const;
