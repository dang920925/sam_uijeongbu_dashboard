'use client';

// ----------------------------------------------------------------------
// 상세 하단 동작(D6 — 기존 흐름 그대로): 대기 "승인"+"거절" / 승인+미등록 "단원으로 등록" /
// 승인+등록됨 "단원 등록됨" 배지 + 단원 이름 링크 / 거절 없음.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MuiLink from '@mui/material/Link';
import NextLink from 'next/link';

import { Iconify } from '@/src/components/iconify';
import { Label } from '@/src/components/label';
import { Typo } from '@/src/components/typo';
import type {
  ApplicationDetailHandlers,
  ApplicationRow,
} from '@/src/sections/applications/utils/application-row';
import { MSG_D06 } from '@/src/shared/messages/d06';

interface ApplicationDetailActionsProps {
  detail: ApplicationRow;
  handlers: ApplicationDetailHandlers;
}

export function ApplicationDetailActions({
  detail,
  handlers,
}: ApplicationDetailActionsProps) {
  if (detail.action === 'none' && detail.member === null) return null;
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        px: { xs: 4, md: 6 },
        py: 4,
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      {detail.action === 'review' ? (
        <>
          <Button
            variant='contained'
            startIcon={<Iconify icon='solar:check-circle-linear' />}
            onClick={() => handlers.onRequestApprove(detail.id)}
            sx={{ flex: 1 }}
          >
            {MSG_D06.APPROVE}
          </Button>
          <Button
            variant='contained'
            color='error'
            startIcon={<Iconify icon='solar:close-circle-linear' />}
            onClick={() => handlers.onRequestReject(detail.id)}
            sx={{ flex: 1 }}
          >
            {MSG_D06.REJECT}
          </Button>
        </>
      ) : null}
      {detail.action === 'register' ? (
        <Button
          variant='contained'
          startIcon={<Iconify icon='solar:user-plus-linear' />}
          onClick={() => handlers.onRequestRegister(detail.id)}
          sx={{ flex: 1 }}
        >
          {MSG_D06.REGISTER}
        </Button>
      ) : null}
      {detail.member ? (
        <div className='flex items-center gap-3'>
          <Label tone='neutral'>{MSG_D06.REGISTERED}</Label>
          <MuiLink
            component={NextLink}
            href={detail.member.href}
            underline='always'
            color='text.primary'
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}
          >
            <Typo.Badge.Semibold color='inherit'>
              {detail.member.name}
            </Typo.Badge.Semibold>
            <Iconify icon='solar:alt-arrow-right-linear' />
          </MuiLink>
        </div>
      ) : null}
    </Box>
  );
}
