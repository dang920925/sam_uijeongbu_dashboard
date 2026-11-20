'use client';

// ----------------------------------------------------------------------
// Iconify — solar 세트 단일, 오프라인 번들(generated-icons.ts)만 등록한다(가이드 §11.8).
// 새 아이콘: scripts/icon-list.json 에 이름 추가 → pnpm icons. 장식 아이콘은 aria-hidden.
// ----------------------------------------------------------------------
import { addCollection, Icon } from '@iconify/react';
import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';

import { SOLAR_ICONS } from '@/src/components/iconify/generated-icons';
import { LAYOUT } from '@/src/theme/layout-tokens';

addCollection(SOLAR_ICONS);

export type IconSize = 'sm' | 'md' | 'lg';

const SIZE: Record<IconSize, number> = {
  sm: LAYOUT.iconSm,
  md: LAYOUT.iconMd,
  lg: LAYOUT.iconLg,
};

interface IconifyProps {
  /** 'solar:masks-linear' 처럼 접두사 포함 이름 */
  icon: string;
  size?: IconSize;
  sx?: SxProps<Theme>;
  className?: string;
}

export function Iconify({ icon, size = 'sm', sx, className }: IconifyProps) {
  const px = SIZE[size];
  return (
    <Box
      component={Icon}
      icon={icon}
      width={px}
      height={px}
      aria-hidden
      className={className}
      sx={[{ flexShrink: 0 }, ...(Array.isArray(sx) ? sx : [sx])]}
    />
  );
}
