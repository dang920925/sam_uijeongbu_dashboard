// ----------------------------------------------------------------------
// 정렬 머리 버튼(designer §18.3 th-sort) — 지금 정렬이면 방향 화살표, 아니면 위아래 아이콘. aria-sort 는 th 가 단다.
// ----------------------------------------------------------------------
import ButtonBase from '@mui/material/ButtonBase';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';

interface ApplicationSortHeaderProps {
  label: string;
  ariaSort: 'ascending' | 'descending' | 'none';
  onSort: () => void;
}

const ICON = {
  ascending: 'solar:arrow-up-linear',
  descending: 'solar:arrow-down-linear',
  none: 'solar:sort-vertical-linear',
} as const;

export function ApplicationSortHeader({
  label,
  ariaSort,
  onSort,
}: ApplicationSortHeaderProps) {
  return (
    <ButtonBase
      onClick={onSort}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        minHeight: 32,
        px: 1,
        mx: -1,
        borderRadius: 1,
        color: ariaSort === 'none' ? 'inherit' : 'text.primary',
      }}
    >
      <Typo.Badge.Medium color='inherit'>{label}</Typo.Badge.Medium>
      <Iconify icon={ICON[ariaSort]} />
    </ButtonBase>
  );
}
