'use client';

// ----------------------------------------------------------------------
// 진행 Label 버튼 ▾ → 단계 메뉴(U31 보강 — design §10.1, designer §18.3).
// 톤: 접수 neutral · 일정 확정/상담 예정 info · 완료 success · 입단 success 굵게 + 아이콘 · 불참/보류 외곽선.
// 거절된 신청은 비활성(▾ 없음, APP_012). 메뉴는 포털이라 클릭이 행으로 번지지 않게 감싼 곳에서 멈춘다.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useState, type MouseEvent } from 'react';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import type { ApplicationProgressView } from '@/src/sections/applications/utils/application-row';
import { MSG_D06 } from '@/src/shared/messages/d06';
import type { ApplicationProgress } from '@/src/types/codes';

interface ApplicationProgressMenuProps {
  progress: ApplicationProgressView;
  /** 없으면 읽기 전용 Label(카드) */
  onChange?: (progress: ApplicationProgress) => void;
}

function progressLabelSx(progress: ApplicationProgressView) {
  return progress.isOutline
    ? {
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        color: 'text.primary',
      }
    : {
        bgcolor: `semantic.label.${progress.tone}.bg`,
        color: `semantic.label.${progress.tone}.fg`,
      };
}

function ProgressText({ progress }: { progress: ApplicationProgressView }) {
  const Text = progress.isJoined ? Typo.Caption.Bold : Typo.Caption.Semibold;
  return (
    <>
      {progress.isJoined ? (
        <Iconify icon='solar:user-check-rounded-linear' />
      ) : null}
      <Text color='inherit'>{progress.label}</Text>
    </>
  );
}

const LABEL_SX = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 1,
  px: 2,
  py: 1,
  borderRadius: 9999,
  whiteSpace: 'nowrap',
} as const;

export function ApplicationProgressMenu({
  progress,
  onChange,
}: ApplicationProgressMenuProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  if (!onChange)
    return (
      <Box
        component='span'
        title={
          progress.isLocked
            ? MSG_D06.PROGRESS_LOCKED(progress.label)
            : undefined
        }
        sx={{ ...LABEL_SX, ...progressLabelSx(progress) }}
      >
        <ProgressText progress={progress} />
      </Box>
    );

  const stop = (event: MouseEvent) => event.stopPropagation();
  const handleSelect = (value: ApplicationProgress) => {
    setAnchor(null);
    if (value !== progress.value) onChange(value);
  };

  return (
    <>
      <ButtonBase
        aria-haspopup='menu'
        aria-expanded={anchor !== null}
        aria-label={
          progress.isLocked
            ? MSG_D06.PROGRESS_LOCKED(progress.label)
            : MSG_D06.PROGRESS_CHANGE(progress.label)
        }
        disabled={progress.isLocked}
        onClick={(event) => {
          stop(event);
          setAnchor(event.currentTarget);
        }}
        sx={{
          ...LABEL_SX,
          ...progressLabelSx(progress),
          minHeight: 28,
          '&.Mui-disabled': { opacity: 1 },
        }}
      >
        <ProgressText progress={progress} />
        {progress.isLocked ? null : (
          <Iconify icon='solar:alt-arrow-down-linear' />
        )}
      </ButtonBase>
      <Menu
        anchorEl={anchor}
        open={anchor !== null}
        onClose={() => setAnchor(null)}
        onClick={stop}
      >
        {progress.options.map((option) => (
          <MenuItem
            key={option.value}
            selected={option.value === progress.value}
            onClick={() => handleSelect(option.value)}
          >
            <Typo.Badge.Regular>{option.label}</Typo.Badge.Regular>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
