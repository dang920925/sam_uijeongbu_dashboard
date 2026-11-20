'use client';

// ----------------------------------------------------------------------
// md·xs 카드(designer W4 D06 — 8열 표는 lg 미만에서 카드): 이름 + 상태 배지 → 연락처·나이 →
// 연결 공연·희망 날짜·신청일(상담은 상담 방법·희망 시간·신청일) → 아이콘+글자 버튼 줄(xs 높이 44·균등 폭).
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import { ApplicationStatusLabels } from '@/src/sections/applications/components/application-status-labels';
import type {
  ApplicationRow,
  ApplicationRowHandlers,
} from '@/src/sections/applications/utils/application-row';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D06 } from '@/src/shared/messages/d06';

interface ApplicationCardProps {
  row: ApplicationRow;
  handlers: ApplicationRowHandlers;
}

const BUTTON_SX = {
  minHeight: { xs: 44, md: 32 },
  flex: { xs: 1, md: 'none' },
};

export function ApplicationCard({ row, handlers }: ApplicationCardProps) {
  const isObservation = row.appType === 'WORK_OBSERVATION';
  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-start justify-between gap-2'>
        <Typo.Body.Semibold>{row.applicantName}</Typo.Body.Semibold>
        <ApplicationStatusLabels row={row} />
      </div>
      <div className='flex flex-wrap gap-x-3 gap-y-1'>
        <Typo.Badge.Regular color='text.secondary'>
          {row.phone}
        </Typo.Badge.Regular>
        {row.ageGender ? (
          <Typo.Badge.Regular color='text.secondary'>
            {row.ageGender}
          </Typo.Badge.Regular>
        ) : null}
      </div>
      <div className='flex flex-wrap gap-x-3 gap-y-1'>
        {isObservation && row.performanceTitle ? (
          <Typo.Badge.Regular color='text.secondary'>
            {row.performanceTitle}
          </Typo.Badge.Regular>
        ) : null}
        {!isObservation && row.methodLabel ? (
          <Typo.Badge.Regular color='text.secondary'>
            {row.methodLabel}
          </Typo.Badge.Regular>
        ) : null}
        <Typo.Badge.Regular color='text.secondary'>
          {isObservation
            ? `${MSG_D06.COL_PREFERRED_DATE} ${row.preferredDate ?? MSG_COMMON.EMPTY_VALUE}`
            : `${MSG_D06.COL_PREFERRED_TIME} ${row.preferredTimeLabel ?? MSG_COMMON.EMPTY_VALUE}`}
        </Typo.Badge.Regular>
        <Typo.Badge.Regular color='text.secondary'>
          {`${MSG_D06.COL_CREATED} ${row.createdAt}`}
        </Typo.Badge.Regular>
      </div>
      <div className='flex gap-2 pt-2'>
        <Button
          variant='outlined'
          color='inherit'
          size='small'
          startIcon={<Iconify icon='solar:eye-linear' />}
          onClick={() => handlers.onView(row.id)}
          sx={BUTTON_SX}
        >
          {MSG_D06.VIEW}
        </Button>
        {row.action === 'review' ? (
          <>
            <Button
              variant='outlined'
              color='success'
              size='small'
              startIcon={<Iconify icon='solar:check-circle-linear' />}
              onClick={() => handlers.onRequestApprove(row.id)}
              sx={{ ...BUTTON_SX, borderColor: 'divider' }}
            >
              {MSG_D06.APPROVE}
            </Button>
            <Button
              variant='outlined'
              color='error'
              size='small'
              startIcon={<Iconify icon='solar:close-circle-linear' />}
              onClick={() => handlers.onRequestReject(row.id)}
              sx={{ ...BUTTON_SX, borderColor: 'divider' }}
            >
              {MSG_D06.REJECT}
            </Button>
          </>
        ) : null}
        {row.action === 'register' ? (
          <Button
            variant='outlined'
            color='inherit'
            size='small'
            startIcon={<Iconify icon='solar:user-plus-linear' />}
            onClick={() => handlers.onRequestRegister(row.id)}
            sx={BUTTON_SX}
          >
            {MSG_D06.REGISTER}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
