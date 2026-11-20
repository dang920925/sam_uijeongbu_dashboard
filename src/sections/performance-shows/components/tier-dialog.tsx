'use client';

// ----------------------------------------------------------------------
// 가격 등급 추가·수정 다이얼로그 View(design §6.1b · designer dialog-tier lg·xs) — props 만으로 렌더.
// 이름*(30자, "예: 일반, 스태프") · 가격*(원, 1원 이상 + 무료 안내) · 노출 방식*(누구나 / 링크로 들어온 사람만 —
// 설명 붙은 라디오 카드) · 사용 스위치(+설명). 서버 오류는 AdminDialog 오류 상자.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Radio from '@mui/material/Radio';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import { useId } from 'react';

import { AdminDialog } from '@/src/components/admin-dialog';
import { FormField } from '@/src/components/form-field';
import { Typo } from '@/src/components/typo';
import { UnitAdornment } from '@/src/sections/performance-shows/components/unit-adornment';
import { TIER_NAME_MAX } from '@/src/sections/performance-shows/utils/tier-form';
import type { TierDialogState } from '@/src/sections/performance-shows/view/use-tier-dialog';
import { MSG_BOOKING } from '@/src/shared/messages/booking';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D11 } from '@/src/shared/messages/d11';
import type { PriceTierVisibility } from '@/src/types/booking';

interface TierDialogProps {
  dialog: TierDialogState;
}

const VISIBILITY_OPTIONS: {
  value: PriceTierVisibility;
  label: string;
  help: string;
}[] = [
  { value: 'PUBLIC', label: MSG_D11.VIS_PUBLIC, help: MSG_D11.VIS_PUBLIC_HELP },
  { value: 'LINK_ONLY', label: MSG_D11.VIS_LINK, help: MSG_D11.VIS_LINK_HELP },
];

export function TierDialog({ dialog }: TierDialogProps) {
  const nameId = useId();
  const priceId = useId();
  const visibilityId = useId();
  const activeId = useId();
  const activeHelpId = useId();
  const { form, errors } = dialog;

  return (
    <AdminDialog
      open={dialog.isOpen}
      title={dialog.isEdit ? MSG_D11.TIER_EDIT : MSG_D11.TIER_ADD}
      onClose={dialog.onClose}
      onSubmit={dialog.onSubmit}
      errorMessage={dialog.submitError}
      isBusy={dialog.isSubmitting}
      actions={
        <>
          <Button
            variant='outlined'
            color='inherit'
            onClick={dialog.onClose}
            disabled={dialog.isSubmitting}
          >
            {MSG_COMMON.CANCEL}
          </Button>
          <Button
            type='submit'
            variant='contained'
            disabled={dialog.isSubmitting}
          >
            {dialog.isEdit ? MSG_COMMON.SAVE : MSG_COMMON.ADD}
          </Button>
        </>
      }
    >
      <FormField
        label={MSG_D11.TIER_NAME}
        htmlFor={nameId}
        required
        helper={MSG_D11.TIER_NAME_HELP}
        error={errors.name}
      >
        <TextField
          id={nameId}
          value={form.name}
          placeholder={MSG_D11.TIER_NAME_PH}
          error={Boolean(errors.name)}
          onChange={(e) => dialog.onFieldChange('name', e.target.value)}
          slotProps={{ htmlInput: { maxLength: TIER_NAME_MAX } }}
          autoFocus
        />
      </FormField>
      <FormField
        label={MSG_D11.TIER_PRICE}
        htmlFor={priceId}
        required
        helper={MSG_D11.TIER_PRICE_HELP}
        error={errors.price}
      >
        <TextField
          id={priceId}
          value={form.price}
          error={Boolean(errors.price)}
          onChange={(e) => dialog.onFieldChange('price', e.target.value)}
          slotProps={{
            htmlInput: { inputMode: 'numeric', maxLength: 7 },
            input: { endAdornment: <UnitAdornment unit={MSG_BOOKING.WON} /> },
          }}
        />
      </FormField>
      <FormField
        label={MSG_D11.TIER_VISIBILITY}
        required
        asGroup
        labelId={visibilityId}
      >
        <div
          role='radiogroup'
          aria-labelledby={visibilityId}
          className='flex flex-col gap-2'
        >
          {VISIBILITY_OPTIONS.map((option) => {
            const isSelected = form.visibility === option.value;
            return (
              <Box
                key={option.value}
                component='label'
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 2,
                  p: 3,
                  borderRadius: 2,
                  border: isSelected ? 2 : 1,
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  cursor: 'pointer',
                }}
              >
                <Radio
                  checked={isSelected}
                  value={option.value}
                  onChange={() => dialog.onVisibilityChange(option.value)}
                  sx={{ p: 0 }}
                  slotProps={{ input: { 'aria-label': option.label } }}
                />
                <div className='flex flex-col gap-1'>
                  <Typo.Body.Regular component='span'>
                    {option.label}
                  </Typo.Body.Regular>
                  <Typo.Caption.Regular component='span' color='text.secondary'>
                    {option.help}
                  </Typo.Caption.Regular>
                </div>
              </Box>
            );
          })}
        </div>
      </FormField>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 4,
          pt: 3,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <div className='flex flex-col gap-1'>
          <label htmlFor={activeId}>
            <Typo.Badge.Medium component='span'>
              {MSG_D11.TIER_ACTIVE}
            </Typo.Badge.Medium>
          </label>
          <Typo.Caption.Regular id={activeHelpId} color='text.secondary'>
            {MSG_D11.TIER_ACTIVE_HELP}
          </Typo.Caption.Regular>
        </div>
        <Switch
          checked={form.isActive}
          onChange={(_, checked) => dialog.onActiveChange(checked)}
          slotProps={{
            input: { id: activeId, 'aria-describedby': activeHelpId },
          }}
        />
      </Box>
    </AdminDialog>
  );
}
