// ----------------------------------------------------------------------
// Typo 티어 컴포넌트 팩토리 — 글자 크기는 테마 티어(TYPO_TIERS)에서만 온다(가이드 §11.5).
// 사용: <Typo.Title.Bold component='h1'>공연 관리</Typo.Title.Bold>
// ----------------------------------------------------------------------
import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';
import type { ElementType, ReactNode } from 'react';

import {
  LINE_HEIGHT,
  TYPO_TIERS,
  TYPO_WEIGHTS,
  type TypoTier,
  type TypoWeight,
} from '@/src/theme/typography';

export interface TypoProps {
  children?: ReactNode;
  component?: ElementType;
  color?: string;
  className?: string;
  sx?: SxProps<Theme>;
  id?: string;
  noWrap?: boolean;
  title?: string;
  tabIndex?: number;
  'aria-live'?: 'polite' | 'assertive' | 'off';
  role?: string;
}

export type TypoComponent = (props: TypoProps) => ReactNode;

export function createTypo(tier: TypoTier, weight: TypoWeight): TypoComponent {
  function TypoTierComponent({
    children,
    component = 'span',
    color,
    className,
    sx,
    ...rest
  }: TypoProps) {
    const size = TYPO_TIERS[tier];
    return (
      <Typography
        component={component}
        className={className}
        sx={[
          {
            // MUI 9 Typography 의 color prop 은 'textSecondary' 같은 키만 받아 'text.secondary' 경로가 무시된다
            // (⚠ 2026-11-19 작업자 3명 실측) → sx 로 넘겨 팔레트 경로를 해석하게 한다.
            ...(color ? { color } : {}),
            fontSize: size,
            fontWeight: TYPO_WEIGHTS[weight],
            lineHeight: size >= 18 ? LINE_HEIGHT.snug : LINE_HEIGHT.normal,
            m: 0,
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...rest}
      >
        {children}
      </Typography>
    );
  }
  TypoTierComponent.displayName = `Typo.${tier}.${weight}`;
  return TypoTierComponent;
}
