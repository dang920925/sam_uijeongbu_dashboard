// ----------------------------------------------------------------------
// MUI 컴포넌트 오버라이드 — 시안 components.css(대시보드) 외형을 MUI 로 옮긴다.
// - 컨트롤 높이 40, xs(768 미만) 터치 44 (§11.4).
// - MuiStack useFlexGap: 자식 margin 리셋이 간격을 지우는 함정 방지(가이드 §11.10).
// - prefers-reduced-motion: 전역 transition·animation 을 즉시로(designer.md §4).
// ----------------------------------------------------------------------
import type { Components, Theme } from '@mui/material/styles';

import { RAW } from '@/src/theme/palette';
import { LAYOUT, RADIUS, SHADOW } from '@/src/theme/layout-tokens';
import { FONT_FAMILY, TYPO_TIERS } from '@/src/theme/typography';

const XS_ONLY = '@media (max-width: 767.95px)';

export const componentOverrides: Components<Theme> = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        backgroundColor: RAW.slate50,
        color: RAW.slate900,
        fontFamily: FONT_FAMILY,
        WebkitFontSmoothing: 'antialiased',
      },
      '@media (prefers-reduced-motion: reduce)': {
        '*, *::before, *::after': {
          animationDuration: '0.01ms !important',
          animationIterationCount: '1 !important',
          transitionDuration: '0.01ms !important',
          scrollBehavior: 'auto !important',
        },
      },
    },
  },
  MuiStack: { defaultProps: { useFlexGap: true } },
  MuiButtonBase: {
    defaultProps: { disableRipple: true },
    // 리플을 끈 대신 키보드 포커스 링(designer §6 slate-900, WCAG 2.4.7 — qa1 QA1-009).
    // 어두운 내비·pill 처럼 자체 링이 있는 곳은 sx 가 덮는다.
    styleOverrides: {
      root: {
        '&.Mui-focusVisible': {
          outline: `2px solid ${RAW.slate900}`,
          outlineOffset: 2,
        },
      },
    },
  },
  MuiButton: {
    defaultProps: { disableElevation: true },
    styleOverrides: {
      root: {
        textTransform: 'none',
        borderRadius: RADIUS.sm,
        minHeight: LAYOUT.control,
        fontWeight: 500,
        fontSize: TYPO_TIERS.badge,
        whiteSpace: 'nowrap',
        [XS_ONLY]: { minHeight: LAYOUT.touch },
      },
      // sizeSmall 이 root 의 xs 44 를 덮어 xs 작은 버튼이 33 이던 문제(qa1 QA1-007 D07 "삭제") — xs 는 44
      sizeSmall: {
        minHeight: LAYOUT.controlSm,
        [XS_ONLY]: { minHeight: LAYOUT.touch },
      },
      outlined: { borderColor: RAW.slate200, backgroundColor: RAW.white },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        borderRadius: RADIUS.sm,
        [XS_ONLY]: { minWidth: LAYOUT.touch, minHeight: LAYOUT.touch },
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: RADIUS.sm,
        backgroundColor: RAW.white,
        fontSize: TYPO_TIERS.body,
        '& .MuiOutlinedInput-notchedOutline': { borderColor: RAW.slate200 },
        // root 의 기본 테두리 규칙이 오류·포커스 테두리를 덮지 않게 같은 구체성으로 다시 건다(⚠ 2026-11-19 실측)
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: RAW.slate900,
        },
        '&.Mui-error .MuiOutlinedInput-notchedOutline': {
          borderColor: RAW.red600,
        },
        '&.Mui-disabled .MuiOutlinedInput-notchedOutline': {
          borderColor: RAW.slate200,
        },
      },
      input: {
        // placeholder = text.secondary(시안 components.css:441) — MUI 기본 opacity 0.42 는 2.70:1(qa1 QA1-011)
        '&::placeholder': { color: RAW.slate500, opacity: 1 },
        paddingTop: 8,
        paddingBottom: 8,
        minHeight: LAYOUT.control - 16,
        [XS_ONLY]: { minHeight: LAYOUT.touch - 16 },
      },
      multiline: { paddingTop: 8, paddingBottom: 8 },
    },
  },
  MuiFormHelperText: {
    styleOverrides: {
      root: { marginLeft: 0, marginTop: 4, fontSize: TYPO_TIERS.caption },
    },
  },
  MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
  MuiCard: {
    defaultProps: { variant: 'outlined' },
    styleOverrides: {
      root: {
        borderRadius: RADIUS.md,
        borderColor: RAW.slate200,
        boxShadow: SHADOW.card,
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: { borderRadius: RADIUS.md, boxShadow: SHADOW.dialog },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        borderBottomColor: RAW.slate200,
        fontSize: TYPO_TIERS.badge,
        padding: '12px 16px',
      },
      head: {
        height: 48,
        paddingTop: 0,
        paddingBottom: 0,
        color: RAW.slate500,
        fontWeight: 500,
        whiteSpace: 'nowrap',
      },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        minHeight: LAYOUT.touch,
        fontSize: TYPO_TIERS.badge,
        fontWeight: 500,
        color: RAW.slate500,
        '&.Mui-selected': { color: RAW.slate900 },
      },
    },
  },
  MuiTabs: {
    styleOverrides: {
      root: {
        minHeight: LAYOUT.touch,
        borderBottom: `1px solid ${RAW.slate200}`,
      },
      indicator: { backgroundColor: RAW.slate900 },
    },
  },
  MuiSkeleton: {
    defaultProps: { animation: 'pulse' },
    styleOverrides: { root: { backgroundColor: RAW.slate100 } },
  },
  MuiTooltip: { defaultProps: { arrow: false } },
};
