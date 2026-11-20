'use client';

// ----------------------------------------------------------------------
// 상세 연락 칸(designer §18.3 drawer): 전화 링크(44) → "연락 완료" 스위치 + 시각(YYYY.MM.DD HH:mm KST)/연락 전 표시
// → 메모(200자, "예: 12/6 참관 안내 문자 보냄") + "{n}/200" + 저장. 메모 초안은 VM 이 든다.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import MuiLink from '@mui/material/Link';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import { useId } from 'react';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import { ApplicationContactToggle } from '@/src/sections/applications/components/application-contact-toggle';
import type { ApplicationRow } from '@/src/sections/applications/utils/application-row';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D06 } from '@/src/shared/messages/d06';

interface ApplicationContactSectionProps {
  detail: ApplicationRow;
  memo: string;
  isSaving: boolean;
  onToggle: (contacted: boolean) => void;
  onMemoChange: (value: string) => void;
  onSaveMemo: () => void;
}

export function ApplicationContactSection({
  detail,
  memo,
  isSaving,
  onToggle,
  onMemoChange,
  onSaveMemo,
}: ApplicationContactSectionProps) {
  const headingId = useId();
  const switchLabelId = useId();
  const memoId = useId();
  return (
    <section aria-labelledby={headingId} className='flex flex-col gap-3'>
      <Typo.Badge.Bold component='h3' id={headingId}>
        {MSG_D06.SEC_CONTACT}
      </Typo.Badge.Bold>
      <MuiLink
        href={detail.telHref}
        aria-label={MSG_D06.PHONE_CALL(detail.phone)}
        underline='hover'
        color='text.primary'
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 2,
          minHeight: 44,
          alignSelf: 'flex-start',
        }}
      >
        <Iconify icon='solar:phone-calling-linear' size='md' />
        <Typo.Body.Semibold color='inherit'>{detail.phone}</Typo.Body.Semibold>
      </MuiLink>
      <div className='flex flex-wrap items-center gap-3'>
        <label className='inline-flex min-h-11 cursor-pointer items-center gap-2'>
          <Switch
            checked={detail.contact.isContacted}
            onChange={(_, checked) => onToggle(checked)}
            slotProps={{ input: { 'aria-labelledby': switchLabelId } }}
          />
          <Typo.Badge.Medium id={switchLabelId}>
            {MSG_D06.CONTACT_DONE}
          </Typo.Badge.Medium>
        </label>
        {detail.contact.fullTime ? (
          <Typo.Caption.Regular color='text.secondary'>
            {detail.contact.fullTime}
          </Typo.Caption.Regular>
        ) : (
          <ApplicationContactToggle contact={detail.contact} />
        )}
      </div>
      <div className='flex flex-col gap-1'>
        <label htmlFor={memoId}>
          <Typo.Caption.Regular color='text.secondary'>
            {MSG_D06.MEMO}
          </Typo.Caption.Regular>
        </label>
        <TextField
          id={memoId}
          multiline
          minRows={2}
          value={memo}
          placeholder={MSG_D06.MEMO_PLACEHOLDER}
          onChange={(e) => onMemoChange(e.target.value)}
          slotProps={{ htmlInput: { maxLength: MSG_D06.MEMO_MAX } }}
        />
        <div className='flex items-center justify-between gap-2'>
          <Typo.Caption.Regular color='text.secondary'>
            {MSG_D06.MEMO_COUNT(memo.length)}
          </Typo.Caption.Regular>
          <Button
            variant='outlined'
            color='inherit'
            size='small'
            disabled={isSaving}
            onClick={onSaveMemo}
          >
            {MSG_COMMON.SAVE}
          </Button>
        </div>
      </div>
    </section>
  );
}
