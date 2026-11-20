// ----------------------------------------------------------------------
// MUI 컴포넌트 오버라이드 — U30 안 A '백스테이지'(design/u30/components-u30.css · tokens-A.css) 외형을 MUI 로 옮긴다.
// - 컨트롤 높이 40, xs(768 미만) 터치 44 (§11.4).
// - MuiStack useFlexGap: 자식 margin 리셋이 간격을 지우는 함정 방지(가이드 §11.10).
// - prefers-reduced-motion: 전역 transition·animation 을 즉시로(designer.md §4).
// - 인쇄(@media print): 바탕을 흰색·글자를 검정으로 — 입장 명단 인쇄(/admission/[showId]/print)는 흰 종이 그대로(기획 §14).
// ----------------------------------------------------------------------
import type { Components, Theme } from '@mui/material/styles';

import { RAW } from '@/src/theme/palette';
import { LAYOUT, RADIUS, SHADOW } from '@/src/theme/layout-tokens';
import { SEMANTIC } from '@/src/theme/semantic';
import { FONT_FAMILY, TYPO_TIERS } from '@/src/theme/typography';

const XS_ONLY = '@media (max-width: 767.95px)';

export const componentOverrides: Components<Theme> = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        backgroundColor: RAW.bg,
        // 위에서 떨어지는 스포트라이트 한 줄기(--c-bg-image) — 스크롤해도 첫 화면 위쪽에만
        backgroundImage: SEMANTIC.spotlight,
        backgroundRepeat: 'no-repeat',
        color: RAW.text,
        fontFamily: FONT_FAMILY,
        WebkitFontSmoothing: 'antialiased',
      },
      '@media print': {
        'html, body': {
          backgroundColor: RAW.white,
          backgroundImage: 'none',
          color: RAW.black,
          colorScheme: 'light',
        },
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
    // 리플을 끈 대신 키보드 포커스 링(A 골드 --c-focus, 2px · offset 2 — WCAG 2.4.7).
    styleOverrides: {
      root: {
        '&.Mui-focusVisible': {
          outline: `2px solid ${RAW.goldHover}`,
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
        fontWeight: 600,
        fontSize: TYPO_TIERS.badge,
        whiteSpace: 'nowrap',
        [XS_ONLY]: { minHeight: LAYOUT.touch },
        // 비활성 = 같은 색 50%(qa2 QA2-008 결정 유지 — 시안 A 는 45% 이나 E2E 기대값을 지키려 50%). MUI 기본 회색 대신
        '&.Mui-disabled': { opacity: 0.5, boxShadow: 'none' },
        // MUI 9 는 containedPrimary 같은 색별 슬롯이 없어 root 에서 클래스 조합으로 건다.
        // 주 버튼 골드 글로우(--sh-primary)
        '&.MuiButton-contained.MuiButton-colorPrimary': {
          boxShadow: SHADOW.primary,
        },
        '&.MuiButton-contained.MuiButton-colorPrimary:hover': {
          backgroundColor: RAW.goldHover,
        },
        // 위험 버튼 = 진한 빨강 + 흰 글자(--c-error · --c-on-error 5.25:1)
        '&.MuiButton-contained.MuiButton-colorError': {
          backgroundColor: RAW.danger,
          color: RAW.white,
        },
        '&.MuiButton-contained.MuiButton-colorError:hover': {
          backgroundColor: RAW.dangerHover,
        },
        // 보조(outlined primary) = 크림 글자(--c-btn-outlined-bg · --c-text)
        '&.MuiButton-outlined.MuiButton-colorPrimary': { color: RAW.text },
        '&.MuiButton-outlined.MuiButton-colorPrimary:hover': {
          backgroundColor: RAW.muted,
          borderColor: RAW.text2,
        },
        '&.MuiButton-text.MuiButton-colorPrimary': { color: RAW.goldHover },
        '&.MuiButton-contained.MuiButton-colorPrimary.Mui-disabled': {
          backgroundColor: RAW.gold,
          color: RAW.onGold,
        },
        '&.MuiButton-contained.MuiButton-colorError.Mui-disabled': {
          backgroundColor: RAW.danger,
          color: RAW.white,
        },
        '&.MuiButton-contained.MuiButton-colorSuccess.Mui-disabled': {
          backgroundColor: RAW.successText,
          color: RAW.onGold,
        },
      },
      // sizeSmall 이 root 의 xs 44 를 덮지 않게 — xs 는 44
      sizeSmall: {
        minHeight: LAYOUT.controlSm,
        [XS_ONLY]: { minHeight: LAYOUT.touch },
      },
      outlined: {
        borderColor: RAW.borderStrong,
        backgroundColor: RAW.raised,
        '&.Mui-disabled': { borderColor: RAW.borderStrong, color: RAW.text },
      },
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
        backgroundColor: RAW.raised,
        fontSize: TYPO_TIERS.body,
        // 입력 테두리 3.33:1(1.4.11) — --c-border-strong
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: RAW.borderStrong,
        },
        // root 의 기본 테두리 규칙이 오류·포커스 테두리를 덮지 않게 같은 구체성으로 다시 건다(⚠ 2026-11-19 실측)
        '&:hover:not(.Mui-focused):not(.Mui-error):not(.Mui-disabled) .MuiOutlinedInput-notchedOutline':
          { borderColor: RAW.text2 },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: RAW.goldHover,
        },
        '&.Mui-error .MuiOutlinedInput-notchedOutline': {
          borderColor: RAW.errorText,
        },
        '&.Mui-disabled .MuiOutlinedInput-notchedOutline': {
          borderColor: RAW.divider,
        },
      },
      input: {
        // placeholder = text.secondary(--c-text-2 7.35:1). MUI 기본 opacity 는 대비 미달
        '&::placeholder': { color: RAW.text2, opacity: 1 },
        paddingTop: 8,
        paddingBottom: 8,
        minHeight: LAYOUT.control - 16,
        [XS_ONLY]: { minHeight: LAYOUT.touch - 16 },
        // 브라우저 자동 완성의 밝은 바탕이 다크 입력 칸을 덮지 않게
        '&:-webkit-autofill': {
          WebkitBoxShadow: `0 0 0 100px ${RAW.raised} inset`,
          WebkitTextFillColor: RAW.text,
          caretColor: RAW.text,
        },
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
        borderColor: RAW.divider,
        backgroundColor: RAW.card,
        boxShadow: SHADOW.card,
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: RADIUS.md,
        boxShadow: SHADOW.dialog,
        backgroundColor: RAW.card,
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: { backgroundColor: RAW.card, borderColor: RAW.divider },
    },
  },
  MuiPopover: {
    styleOverrides: {
      paper: {
        backgroundColor: RAW.raised,
        border: `1px solid ${RAW.divider}`,
        boxShadow: SHADOW.dialog,
      },
    },
  },
  MuiMenuItem: {
    styleOverrides: {
      root: { '&:hover': { backgroundColor: RAW.muted } },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        borderBottomColor: RAW.divider,
        fontSize: TYPO_TIERS.badge,
        padding: '12px 16px',
      },
      head: {
        height: 48,
        paddingTop: 0,
        paddingBottom: 0,
        color: SEMANTIC.tableHead.fg,
        backgroundColor: SEMANTIC.tableHead.bg,
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
        color: RAW.text2,
        '&.Mui-selected': { color: RAW.goldHover },
        // 탭 목록(scroller)이 overflow hidden 이라 바깥 링이 잘린다 → 안쪽 링(qa2 QA2-004)
        '&.Mui-focusVisible': { outlineOffset: -2 },
      },
    },
  },
  MuiTabs: {
    styleOverrides: {
      root: {
        minHeight: LAYOUT.touch,
        borderBottom: `1px solid ${RAW.divider}`,
      },
      indicator: { backgroundColor: RAW.gold },
    },
  },
  // 입장 현황 진행 막대 — 트랙 + 골드 그라디언트(--c-progress-track · --c-progress-fill)
  MuiLinearProgress: {
    styleOverrides: {
      root: { backgroundColor: SEMANTIC.progress.track },
      bar: { backgroundImage: SEMANTIC.progress.fill },
    },
  },
  // 토글 버튼(입장 명단 인쇄 화면의 정렬 — 흰 종이 위 화면 전용 도구, 인쇄 땐 숨김).
  // 바탕이 흰색이든 다크든 읽히게 바탕·글자를 스스로 가진다: 비선택 = 어두운 칸 + 크림 글자, 선택 = 골드 + 진한 글자.
  MuiToggleButton: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        fontSize: TYPO_TIERS.badge,
        fontWeight: 600,
        minHeight: LAYOUT.control,
        color: RAW.text,
        backgroundColor: RAW.raised,
        borderColor: RAW.borderStrong,
        [XS_ONLY]: { minHeight: LAYOUT.touch },
        '&:hover': { backgroundColor: RAW.muted },
        '&.Mui-selected, &.Mui-selected:hover': {
          color: RAW.onGold,
          backgroundColor: RAW.gold,
        },
      },
    },
  },
  MuiSkeleton: {
    defaultProps: { animation: 'pulse' },
    styleOverrides: { root: { backgroundColor: RAW.muted } },
  },
  MuiTooltip: {
    defaultProps: { arrow: false },
    styleOverrides: {
      tooltip: {
        backgroundColor: RAW.raised,
        color: RAW.text,
        border: `1px solid ${RAW.divider}`,
        fontSize: TYPO_TIERS.caption,
      },
    },
  },
};
