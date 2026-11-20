'use client';

// ----------------------------------------------------------------------
// 예매 설정 카드(design §6 SCR-D11 콘텐츠 2 · designer 시안) — xs 1열 · md↑ 2열.
// 입금 은행 | 계좌번호 / 예금주 | 1인 최대 매수 / 입금 기한 | 문의처(develop §11.10 — 시안에 없어 빈 칸 자리, 자체 결정) /
// 취소·환불 규정(2열 전체, "기본 문구 넣기") / 저장(오른쪽).
// props 만으로 렌더 — 값·검증·저장은 use-booking-policy-form.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import { useId } from 'react';

import { FormField } from '@/src/components/form-field';
import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import { ShowsSectionCard } from '@/src/sections/performance-shows/components/shows-section-card';
import { UnitAdornment } from '@/src/sections/performance-shows/components/unit-adornment';
import {
  POLICY_INQUIRY_MAX,
  POLICY_REFUND_MAX,
  POLICY_TEXT_MAX,
} from '@/src/sections/performance-shows/utils/booking-policy-form';
import type { BookingPolicyFormState } from '@/src/sections/performance-shows/view/use-booking-policy-form';
import { MSG_BOOKING } from '@/src/shared/messages/booking';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D11 } from '@/src/shared/messages/d11';

interface BookingPolicyCardProps {
  policyForm: BookingPolicyFormState;
}

export function BookingPolicyCard({ policyForm }: BookingPolicyCardProps) {
  const titleId = useId();
  const bankId = useId();
  const accountId = useId();
  const holderId = useId();
  const maxId = useId();
  const hoursId = useId();
  const refundId = useId();
  const inquiryId = useId();
  const refundHelpId = useId();
  const { form, errors, onFieldChange } = policyForm;

  return (
    <ShowsSectionCard
      title={MSG_D11.POLICY_TITLE}
      subtitle={MSG_D11.POLICY_SUBTITLE}
      titleId={titleId}
    >
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          policyForm.onSubmit();
        }}
        className='flex flex-col gap-4'
      >
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <FormField label={MSG_D11.DEPOSIT_BANK} htmlFor={bankId}>
            <TextField
              id={bankId}
              value={form.depositBank}
              onChange={(e) => onFieldChange('depositBank', e.target.value)}
              slotProps={{ htmlInput: { maxLength: POLICY_TEXT_MAX } }}
            />
          </FormField>
          <FormField
            label={MSG_D11.ACCOUNT_NUMBER}
            htmlFor={accountId}
            error={errors.depositAccountNumber}
          >
            <TextField
              id={accountId}
              value={form.depositAccountNumber}
              placeholder={MSG_D11.ACCOUNT_NUMBER_PH}
              error={Boolean(errors.depositAccountNumber)}
              onChange={(e) =>
                onFieldChange('depositAccountNumber', e.target.value)
              }
              slotProps={{
                htmlInput: { maxLength: POLICY_TEXT_MAX, inputMode: 'tel' },
              }}
            />
          </FormField>
          <FormField label={MSG_D11.ACCOUNT_HOLDER} htmlFor={holderId}>
            <TextField
              id={holderId}
              value={form.depositAccountHolder}
              onChange={(e) =>
                onFieldChange('depositAccountHolder', e.target.value)
              }
              slotProps={{ htmlInput: { maxLength: POLICY_TEXT_MAX } }}
            />
          </FormField>
          <FormField
            label={MSG_D11.MAX_TICKETS}
            htmlFor={maxId}
            helper={MSG_D11.MAX_TICKETS_HELP}
            error={errors.maxTicketsPerBooking}
          >
            <TextField
              id={maxId}
              value={form.maxTicketsPerBooking}
              error={Boolean(errors.maxTicketsPerBooking)}
              onChange={(e) =>
                onFieldChange('maxTicketsPerBooking', e.target.value)
              }
              slotProps={{
                htmlInput: { inputMode: 'numeric', maxLength: 2 },
                input: {
                  endAdornment: (
                    <UnitAdornment unit={MSG_BOOKING.TICKET_UNIT} />
                  ),
                },
              }}
            />
          </FormField>
          <FormField
            label={MSG_D11.DEADLINE_HOURS}
            htmlFor={hoursId}
            helper={MSG_D11.DEADLINE_HOURS_HELP}
            error={errors.depositDeadlineHours}
          >
            <TextField
              id={hoursId}
              value={form.depositDeadlineHours}
              placeholder={MSG_D11.DEADLINE_HOURS_PH}
              error={Boolean(errors.depositDeadlineHours)}
              onChange={(e) =>
                onFieldChange('depositDeadlineHours', e.target.value)
              }
              slotProps={{
                htmlInput: { inputMode: 'numeric', maxLength: 3 },
                input: {
                  endAdornment: <UnitAdornment unit={MSG_D11.HOUR_UNIT} />,
                },
              }}
            />
          </FormField>
          <FormField
            label={MSG_D11.INQUIRY}
            htmlFor={inquiryId}
            helper={MSG_D11.INQUIRY_HELP}
            error={errors.inquiryContact}
          >
            <TextField
              id={inquiryId}
              value={form.inquiryContact}
              placeholder={MSG_D11.INQUIRY_PH}
              error={Boolean(errors.inquiryContact)}
              onChange={(e) => onFieldChange('inquiryContact', e.target.value)}
              slotProps={{ htmlInput: { maxLength: POLICY_INQUIRY_MAX } }}
            />
          </FormField>
        </div>
        <div className='flex flex-col gap-1'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <label htmlFor={refundId}>
              <Typo.Badge.Medium component='span'>
                {MSG_D11.REFUND}
              </Typo.Badge.Medium>
            </label>
            <Button
              variant='outlined'
              color='inherit'
              size='small'
              onClick={policyForm.onInsertDefaultRefund}
              startIcon={<Iconify icon='solar:document-add-linear' />}
            >
              {MSG_D11.REFUND_DEFAULT_BUTTON}
            </Button>
          </div>
          <TextField
            id={refundId}
            multiline
            minRows={4}
            value={form.refundPolicyText}
            placeholder={MSG_D11.REFUND_PH}
            onChange={(e) => onFieldChange('refundPolicyText', e.target.value)}
            slotProps={{
              htmlInput: {
                maxLength: POLICY_REFUND_MAX,
                'aria-describedby': refundHelpId,
              },
            }}
          />
          <Typo.Caption.Regular id={refundHelpId} color='text.secondary'>
            {MSG_D11.REFUND_HELP}
          </Typo.Caption.Regular>
        </div>
        <div className='flex justify-end pt-2'>
          <Button
            type='submit'
            variant='contained'
            disabled={policyForm.isSaving}
            startIcon={
              policyForm.isSaving ? (
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
