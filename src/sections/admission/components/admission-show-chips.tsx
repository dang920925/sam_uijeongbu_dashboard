'use client';

// ----------------------------------------------------------------------
// 회차 칩(design SCR-D13 ①) — 높이 48, aria-pressed. xs 는 가로 스크롤(페이지는 넘치지 않음), md↑ 줄바꿈.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';

import { Typo } from '@/src/components/typo';
import { MSG_D13 } from '@/src/shared/messages/d13';

export interface AdmissionShowChip {
  id: string;
  label: string;
  isSelected: boolean;
}

interface AdmissionShowChipsProps {
  chips: AdmissionShowChip[];
  onSelect: (id: string) => void;
}

export function AdmissionShowChips({
  chips,
  onSelect,
}: AdmissionShowChipsProps) {
  return (
    <Box
      role='group'
      aria-label={MSG_D13.SHOWS_ARIA}
      sx={{
        display: 'flex',
        gap: 2,
        flexWrap: { xs: 'nowrap', md: 'wrap' },
        overflowX: { xs: 'auto', md: 'visible' },
        mx: { xs: -4, md: 0 },
        px: { xs: 4, md: 0 },
        py: 1,
      }}
    >
      {chips.map((chip) => (
        <ButtonBase
          key={chip.id}
          aria-pressed={chip.isSelected}
          onClick={() => onSelect(chip.id)}
          sx={{
            flexShrink: 0,
            minHeight: 48,
            px: 4,
            borderRadius: 9999,
            bgcolor: chip.isSelected
              ? 'primary.main'
              : 'semantic.surface.muted',
            color: chip.isSelected
              ? 'primary.contrastText'
              : 'semantic.text.onMuted',
            '&:focus-visible': {
              outline: 2,
              outlineColor: 'primary.main',
              outlineOffset: 2,
            },
          }}
        >
          <Typo.Badge.Semibold color='inherit'>
            {chip.label}
          </Typo.Badge.Semibold>
        </ButtonBase>
      ))}
    </Box>
  );
}
