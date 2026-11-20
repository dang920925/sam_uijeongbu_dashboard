// ----------------------------------------------------------------------
// 대시보드 MUI 테마 생성.
// - 브레이크포인트: 640/768/1024/1280(현행 Tailwind 값 = Tailwind 4 기본 — designer J-D2). 이름은 가이드 그대로.
// - spacing 4px: sx 숫자와 Tailwind 스텝(1=4px)이 같은 축이 되게 한다(check-spacing 이 같은 허용 집합으로 검사).
// - U30 안 A '백스테이지' 다크 단일 모드: cssVariables 는 켜되 colorSchemes 는 dark 하나(가이드 §11.10 모드 분기 함정 회피).
//   palette.mode 'dark' 만 주면 MUI 가 dark 스킴 하나로 만든다. 라이트·다크 전환 기능은 범위 밖(기획 §14).
// - modularCssLayers: 레이어 순서 문자열을 MUI 가 head 맨 앞에 선언한다. true 로 두면 'mui' 가 Tailwind 보다 먼저 선언돼
//   가장 낮은 레이어가 되고 preflight 가 sx 간격을 지운다(⚠ 2026-11-19 실측). 그래서 Tailwind 순서를 포함한 문자열을 준다.
// ----------------------------------------------------------------------
import { createTheme } from '@mui/material/styles';

import { componentOverrides } from '@/src/theme/overrides/components';
import { RAW } from '@/src/theme/palette';
import { SEMANTIC } from '@/src/theme/semantic';
import { FONT_FAMILY } from '@/src/theme/typography';
import { MOTION } from '@/src/theme/motion';

export const appTheme = createTheme({
  cssVariables: true,
  modularCssLayers: '@layer theme, base, mui, components, utilities;',
  breakpoints: { values: { xs: 0, sm: 640, md: 768, lg: 1024, xl: 1280 } },
  spacing: 4,
  shape: { borderRadius: 4 },
  palette: {
    mode: 'dark',
    primary: {
      main: RAW.gold,
      dark: RAW.goldHover,
      contrastText: RAW.onGold,
    },
    secondary: { main: RAW.raised, contrastText: RAW.text },
    // 글자로 쓰이는 error.main 은 밝은 오류 글자(--c-error-text). 위험(contained) 버튼 바탕은 overrides 에서 RAW.danger
    error: { main: RAW.errorText, dark: RAW.danger, contrastText: RAW.onGold },
    success: {
      main: RAW.successText,
      dark: RAW.labelSuccess,
      contrastText: RAW.onGold,
    },
    warning: { main: RAW.warningText, contrastText: RAW.onGold },
    info: { main: RAW.labelInfo, contrastText: RAW.onGold },
    background: { default: RAW.bg, paper: RAW.card },
    divider: RAW.divider,
    text: {
      primary: RAW.text,
      secondary: RAW.text2,
      disabled: RAW.borderStrong,
    },
    action: {
      hover: RAW.raised,
      selected: RAW.muted,
      focus: RAW.muted,
      disabledBackground: RAW.muted,
      disabled: RAW.borderStrong,
    },
    semantic: SEMANTIC,
  },
  typography: { fontFamily: FONT_FAMILY, htmlFontSize: 16, fontSize: 14 },
  transitions: {
    duration: {
      shortest: MOTION.duration.short,
      shorter: MOTION.duration.short,
      short: MOTION.duration.short,
      standard: MOTION.duration.medium,
      complex: MOTION.duration.long,
      enteringScreen: MOTION.duration.medium,
      leavingScreen: MOTION.duration.short,
    },
    easing: {
      easeInOut: MOTION.easing.standard,
      easeOut: MOTION.easing.enter,
      easeIn: MOTION.easing.exit,
      sharp: MOTION.easing.standard,
    },
  },
  components: componentOverrides,
});
