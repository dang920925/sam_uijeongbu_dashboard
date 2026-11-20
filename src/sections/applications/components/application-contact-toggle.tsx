'use client';

// ----------------------------------------------------------------------
// 연락 표시·토글(U31 보강 — designer §18.3): 연락 전 = 빈 고리(warning) + "연락 전" / 연락 완료 = 체크(success) + 시각.
// 색만으로 구분하지 않게 모양(고리·체크)과 글자를 함께 쓴다. 목록 행에서는 바로 토글(role=switch),
// 카드(xs)에서는 읽기 전용(시안 ct--ro — 카드를 누르면 드로어). 시각은 lg "MM.DD HH:mm", md·카드 "연락 완료".
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import type { MouseEvent } from 'react';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import type { ApplicationContactView } from '@/src/sections/applications/utils/application-row';
import { MSG_D06 } from '@/src/shared/messages/d06';

interface ApplicationContactToggleProps {
  contact: ApplicationContactView;
  /** 없으면 읽기 전용 */
  onToggle?: (contacted: boolean) => void;
  /** lg 에서 시각을 보일지(표) */
  hasTime?: boolean;
}

function ContactMark({
  contact,
  hasTime,
}: {
  contact: ApplicationContactView;
  hasTime: boolean;
}) {
  if (!contact.isContacted)
    return (
      <>
        <Box
          component='span'
          aria-hidden
          sx={{
            width: 12,
            height: 12,
            flexShrink: 0,
            borderRadius: 9999,
            border: 2,
            borderColor: 'semantic.label.warning.fg',
          }}
        />
        <Typo.Caption.Medium color='semantic.label.warning.fg'>
          {MSG_D06.CONTACT_BEFORE}
        </Typo.Caption.Medium>
      </>
    );
  return (
    <>
      <Iconify
        icon='solar:check-circle-bold'
        sx={{ color: 'semantic.label.success.fg' }}
      />
      <Typo.Caption.Medium
        color='semantic.label.success.fg'
        noWrap
        sx={{
          display:
            hasTime && contact.shortTime
              ? { xs: 'block', lg: 'none' }
              : 'block',
        }}
      >
        {MSG_D06.CONTACT_DONE}
      </Typo.Caption.Medium>
      {hasTime && contact.shortTime ? (
        <Typo.Caption.Medium
          color='semantic.label.success.fg'
          noWrap
          sx={{ display: { xs: 'none', lg: 'block' } }}
        >
          {contact.shortTime}
        </Typo.Caption.Medium>
      ) : null}
    </>
  );
}

export function ApplicationContactToggle({
  contact,
  onToggle,
  hasTime = false,
}: ApplicationContactToggleProps) {
  if (!onToggle)
    return (
      <span className='inline-flex items-center gap-1'>
        <ContactMark contact={contact} hasTime={false} />
      </span>
    );
  const handleClick = (event: MouseEvent) => {
    event.stopPropagation();
    onToggle(!contact.isContacted);
  };
  return (
    <ButtonBase
      role='switch'
      aria-checked={contact.isContacted}
      aria-label={MSG_D06.CONTACT_DONE}
      title={contact.fullTime ?? undefined}
      onClick={handleClick}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        minHeight: 32,
        maxWidth: '100%',
        px: 1,
        mx: -1,
        borderRadius: 1,
        '&:hover': { bgcolor: 'semantic.surface.muted' },
      }}
    >
      <ContactMark contact={contact} hasTime={hasTime} />
    </ButtonBase>
  );
}
