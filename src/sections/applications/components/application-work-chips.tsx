// ----------------------------------------------------------------------
// 작품 칸 칩 묶음(U31 — design §10, designer §18.3): 중립 칩(한 줄 말줄임) · "아직 모르겠어요" 외곽선 · 넘치면 "+n".
// 칩이 없으면(옛 신청) '-'. 나누기(폭별 수)는 utils/work-chips 가 미리 했다.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';

import { Typo } from '@/src/components/typo';
import type {
  WorkChip,
  WorkChipSplit,
} from '@/src/sections/applications/utils/work-chips';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D06 } from '@/src/shared/messages/d06';

interface ApplicationWorkChipsProps {
  split: WorkChipSplit;
  isEmpty: boolean;
  /** 한 줄(목록) · 여러 줄(상세 드로어) */
  isWrap?: boolean;
}

const CHIP_BASE = {
  display: 'inline-flex',
  alignItems: 'center',
  minWidth: 0,
  maxWidth: '100%',
  px: 2,
  py: 1,
  borderRadius: 9999,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
} as const;

function chipSx(chip: WorkChip) {
  return chip.kind === 'undecided'
    ? {
        ...CHIP_BASE,
        flexShrink: 0,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        color: 'text.primary',
      }
    : {
        ...CHIP_BASE,
        flexShrink: 1,
        bgcolor: 'semantic.label.neutral.bg',
        color: 'semantic.label.neutral.fg',
      };
}

export function ApplicationWorkChips({
  split,
  isEmpty,
  isWrap = false,
}: ApplicationWorkChipsProps) {
  if (isEmpty)
    return (
      <Typo.Badge.Regular color='text.secondary'>
        {MSG_COMMON.EMPTY_VALUE}
      </Typo.Badge.Regular>
    );
  return (
    <Box
      component='span'
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        minWidth: 0,
        flexWrap: isWrap ? 'wrap' : 'nowrap',
      }}
    >
      {split.visible.map((chip) => (
        <Box
          key={chip.key}
          component='span'
          sx={chipSx(chip)}
          title={chip.text}
        >
          <Typo.Caption.Semibold
            color='inherit'
            sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {chip.text}
          </Typo.Caption.Semibold>
        </Box>
      ))}
      {split.overflow > 0 ? (
        <Box
          component='span'
          title={MSG_D06.WORK_MORE_LABEL(split.overflow)}
          sx={{
            ...CHIP_BASE,
            flexShrink: 0,
            border: 1,
            borderColor: 'divider',
            color: 'text.primary',
          }}
        >
          <Typo.Caption.Semibold color='inherit'>
            {MSG_D06.WORK_MORE(split.overflow)}
          </Typo.Caption.Semibold>
        </Box>
      ) : null}
    </Box>
  );
}
