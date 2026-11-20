'use client';

// ----------------------------------------------------------------------
// "등급 링크 + 단원 초대 링크" 단원 고르기 다이얼로그 — designer 미작성(§13.11 5), 자체 결정 모양:
// AdminDialog + MUI Autocomplete(단원 이름) + "복사". props 만으로 렌더.
// ----------------------------------------------------------------------
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { useId } from 'react';

import { AdminDialog } from '@/src/components/admin-dialog';
import { FormField } from '@/src/components/form-field';
import type { TierMemberLinkState } from '@/src/sections/performance-shows/view/use-tier-member-link';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D11 } from '@/src/shared/messages/d11';

interface TierMemberLinkDialogProps {
  state: TierMemberLinkState;
}

export function TierMemberLinkDialog({ state }: TierMemberLinkDialogProps) {
  const memberId = useId();
  const selected =
    state.options.find((option) => option.value === state.selectedId) ?? null;

  return (
    <AdminDialog
      open={state.isOpen}
      title={`${MSG_D11.LINK_COPY_WITH_MEMBER} — ${state.tierName}`}
      onClose={state.onClose}
      onSubmit={state.onSubmit}
      errorMessage={state.error}
      isBusy={state.isSubmitting}
      actions={
        <>
          <Button
            variant='outlined'
            color='inherit'
            onClick={state.onClose}
            disabled={state.isSubmitting}
          >
            {MSG_COMMON.CANCEL}
          </Button>
          <Button
            type='submit'
            variant='contained'
            disabled={state.isSubmitting}
          >
            {MSG_D11.COPY}
          </Button>
        </>
      }
    >
      <FormField
        label={MSG_D11.MEMBER}
        htmlFor={memberId}
        required
        helper={MSG_D11.MEMBER_HELP}
      >
        <Autocomplete
          id={memberId}
          options={state.options}
          value={selected}
          loading={state.isLoading}
          noOptionsText={MSG_D11.MEMBER_EMPTY}
          getOptionLabel={(option) => option.label}
          isOptionEqualToValue={(option, value) => option.value === value.value}
          onChange={(_, option) => state.onSelect(option?.value ?? null)}
          renderInput={(params) => (
            <TextField {...params} placeholder={MSG_D11.MEMBER_PH} />
          )}
        />
      </FormField>
    </AdminDialog>
  );
}
