'use client';

// ----------------------------------------------------------------------
// 예매 연결 다이얼로그(R2 — '확인 안 된 입금'에서 예매에 직접 연결해 확정). 예매번호 4자리로 모든 공연의 입금 대기 예매를 찾아
// 하나를 고르면 그 예매를 입금 확인(MANUAL)으로 확정한다. 판정이 가리킨 예매가 있으면 그 번호로 미리 찾아 둔다.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import TextField from '@mui/material/TextField';
import { useId } from 'react';

import { AdminDialog } from '@/src/components/admin-dialog';
import { FormField } from '@/src/components/form-field';
import { Typo } from '@/src/components/typo';
import type { DepositNotificationsViewModel } from '@/src/sections/deposit-notifications/view/use-deposit-notifications-view-model';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_DEP } from '@/src/shared/messages/deposit-notifications';

interface DepositMatchDialogProps {
  match: DepositNotificationsViewModel['match'];
}

export function DepositMatchDialog({ match }: DepositMatchDialogProps) {
  const codeId = useId();
  const target = match.target;
  return (
    <AdminDialog
      open={target !== null}
      title={MSG_DEP.MATCH_TITLE}
      onClose={match.onClose}
      onSubmit={match.onSubmit}
      isBusy={match.isSubmitting}
      errorMessage={match.errorMessage}
      actions={
        <>
          <Button color='inherit' onClick={match.onClose}>
            {MSG_COMMON.CANCEL}
          </Button>
          <Button
            type='submit'
            variant='contained'
            disabled={!match.chosenId || match.isSubmitting}
          >
            {MSG_DEP.MATCH_CONFIRM}
          </Button>
        </>
      }
    >
      <div className='flex flex-col gap-4'>
        <Typo.Caption.Regular color='text.secondary'>
          {MSG_DEP.MATCH_DESCRIPTION}
        </Typo.Caption.Regular>
        {target ? (
          <Typo.Body.Regular sx={{ whiteSpace: 'pre-line' }}>
            {`${target.amountText} · ${target.messageText}`}
          </Typo.Body.Regular>
        ) : null}
        <FormField label={MSG_DEP.MATCH_CODE_LABEL} htmlFor={codeId}>
          <div className='flex gap-2'>
            <TextField
              id={codeId}
              value={match.codeInput}
              onChange={(event) => match.onCodeChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  if (match.canSearch) match.onSearch();
                }
              }}
              slotProps={{
                htmlInput: { inputMode: 'numeric', maxLength: 4 },
              }}
              size='small'
            />
            <Button
              variant='outlined'
              color='inherit'
              disabled={!match.canSearch}
              onClick={match.onSearch}
            >
              {MSG_DEP.MATCH_SEARCH}
            </Button>
          </div>
        </FormField>
        {match.hasSearched &&
        !match.isSearching &&
        match.options.length === 0 ? (
          <Typo.Caption.Regular color='text.secondary' role='status'>
            {MSG_DEP.MATCH_NONE}
          </Typo.Caption.Regular>
        ) : null}
        {match.options.length > 0 ? (
          <RadioGroup
            aria-label={MSG_DEP.MATCH_TITLE}
            value={match.chosenId ?? ''}
            onChange={(event) => match.onChoose(event.target.value)}
          >
            {match.options.map((option) => (
              <FormControlLabel
                key={option.id}
                value={option.id}
                control={<Radio />}
                label={option.label}
              />
            ))}
          </RadioGroup>
        ) : null}
      </div>
    </AdminDialog>
  );
}
