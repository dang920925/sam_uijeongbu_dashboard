'use client';

// ----------------------------------------------------------------------
// 가격 카드(U41 design §17 SCR-D11 — 예전 '가격 등급' 카드 자리) — 두 칸 "기본가" · "SAM 관계자가"(원) + 저장.
// 링크 전용·역할 없는 예전 등급은 이 화면에서 보이지 않는다(API 는 남김 — develop §22).
// props 만으로 렌더 — 값·검증·저장은 use-inviter-price-form.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import { useId } from 'react';

import { FormField } from '@/src/components/form-field';
import { Typo } from '@/src/components/typo';
import { ShowsSectionCard } from '@/src/sections/performance-shows/components/shows-section-card';
import { UnitAdornment } from '@/src/sections/performance-shows/components/unit-adornment';
import type { InviterPriceFormState } from '@/src/sections/performance-shows/view/use-inviter-price-form';
import { MSG_BOOKING } from '@/src/shared/messages/booking';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D11 } from '@/src/shared/messages/d11';

interface InviterPriceCardProps {
  priceForm: InviterPriceFormState;
}

export function InviterPriceCard({ priceForm }: InviterPriceCardProps) {
  const titleId = useId();
  const baseId = useId();
  const samId = useId();
  const { form, errors, onFieldChange } = priceForm;

  return (
    <ShowsSectionCard
      title={MSG_D11.PRICE_TITLE}
      subtitle={MSG_D11.PRICE_SUBTITLE}
      titleId={titleId}
    >
      <form
        noValidate
        data-testid='inviter-price-card'
        onSubmit={(event) => {
          event.preventDefault();
          priceForm.onSubmit();
        }}
        className='flex flex-col gap-4'
      >
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <FormField
            label={MSG_D11.PRICE_BASE}
            htmlFor={baseId}
            helper={MSG_D11.PRICE_BASE_HELP}
            error={errors.base}
            required
          >
            <TextField
              id={baseId}
              value={form.base}
              error={Boolean(errors.base)}
              onChange={(e) => onFieldChange('base', e.target.value)}
              slotProps={{
                htmlInput: { inputMode: 'numeric', maxLength: 9 },
                input: {
                  endAdornment: <UnitAdornment unit={MSG_BOOKING.WON} />,
                },
              }}
            />
          </FormField>
          <FormField
            label={MSG_D11.PRICE_SAM}
            htmlFor={samId}
            helper={MSG_D11.PRICE_SAM_HELP}
            error={errors.samRelated}
            required
          >
            <TextField
              id={samId}
              value={form.samRelated}
              error={Boolean(errors.samRelated)}
              onChange={(e) => onFieldChange('samRelated', e.target.value)}
              slotProps={{
                htmlInput: { inputMode: 'numeric', maxLength: 9 },
                input: {
                  endAdornment: <UnitAdornment unit={MSG_BOOKING.WON} />,
                },
              }}
            />
          </FormField>
        </div>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <Typo.Caption.Regular color='text.secondary'>
            {MSG_D11.PRICE_SAVED_NOTE}
          </Typo.Caption.Regular>
          <Button
            type='submit'
            variant='contained'
            disabled={priceForm.isSaving}
            startIcon={
              priceForm.isSaving ? (
                <CircularProgress size={16} color='inherit' />
              ) : undefined
            }
          >
            {MSG_COMMON.SAVE}
          </Button>
        </div>
      </form>
    </ShowsSectionCard>
  );
}
