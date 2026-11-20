'use client';

// ----------------------------------------------------------------------
// ManualReservationDialog — 예매 수동 등록(design SCR-D12 "수동 등록 Dialog" · SCR-D13 "현장 예매 등록").
// develop §11.10 보강(무료·특별 초대도 여기로) · design §6.1b · designer §13.11 dialog-manual(-direct):
// 회차* · 이름* · 연락처(선택) · 입력 방식 "등급별 수량 / 직접 입력"(이름 기본 "직접 입력" + 매수 + 금액) ·
// "금액 직접 정하기"(0원 허용) · 상태 "입금 대기 / 확정" · 초대 단원(선택) · 메모 · (확정이면) 입장 인원.
// 남은 좌석보다 많으면 저장 불가. D13 은 입장 인원을 상태 바로 아래에 둔다(designer §13.11 남은 확인 6).
// props 계약은 리드가 고정(W3·W4 가 같은 props 로 쓴다). 검증은 validate-manual-reservation.ts(+spec).
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import { useId, useState } from 'react';

import {
  formatWon,
  previewLinesAmount,
  type ManualReservationFormInput,
} from '@/src/api/reservation-mapper';
import { AdminDialog } from '@/src/components/admin-dialog';
import { FormField } from '@/src/components/form-field';
import { AmountOverrideField } from '@/src/components/manual-reservation-dialog/amount-override-field';
import { CustomLineFields } from '@/src/components/manual-reservation-dialog/custom-line-fields';
import { LinesTotalBox } from '@/src/components/manual-reservation-dialog/lines-total-box';
import { TierQuantityList } from '@/src/components/manual-reservation-dialog/tier-quantity-list';
import { UnitInput } from '@/src/components/manual-reservation-dialog/unit-input';
import {
  hasErrors,
  MAX_RESERVATION_QTY,
  seatsBlockMessage,
  toEffectiveManualInput,
  validateManualReservation,
  type ManualEntryMode,
  type ManualReservationErrors,
} from '@/src/components/manual-reservation-dialog/validate-manual-reservation';
import { SegmentPill } from '@/src/components/segment-pill';
import { Typo } from '@/src/components/typo';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D12 } from '@/src/shared/messages/d12';
import { RESERVATION_STATUS_LABEL } from '@/src/types/codes';

export interface ManualReservationShowOption {
  id: string;
  /** 예 "12/12(토) 14:00" */
  label: string;
  /** 남은 좌석(null = 좌석 수 미정 — 제한 없음) */
  remainingSeats: number | null;
}

/** 고를 수 있는 등급(사용 중인 등급 — PUBLIC·LINK_ONLY 모두) */
export interface ManualReservationTierOption {
  id: string;
  name: string;
  price: number;
  visibility: 'PUBLIC' | 'LINK_ONLY';
}

export interface ManualReservationInviterOption {
  memberId: string;
  name: string;
}

export interface ManualReservationDialogProps {
  open: boolean;
  /** 회차 선택지 — fixedShowId 가 있으면 선택 칸 대신 그 회차를 읽기 전용으로 보인다 */
  showOptions: ManualReservationShowOption[];
  /** D13: 고른 회차 고정 */
  fixedShowId?: string | null;
  /** 초대 단원 선택지 — 비거나 없으면 칸을 숨긴다 */
  inviterOptions?: ManualReservationInviterOption[];
  /** 등급 선택지 — 비면 "직접 입력" 방식만 보인다 */
  tierOptions: ManualReservationTierOption[];
  /** 상태 기본값 — D12 'PENDING' · D13 'CONFIRMED'(designer §13.11) */
  defaultStatus: 'PENDING' | 'CONFIRMED';
  /** D13: 확정일 때 입장 인원(0~매수, 기본 = 매수) 칸을 상태 바로 아래에 보인다. D12 는 확정일 때 맨 아래 */
  admitNowPlacement: 'afterStatus' | 'bottom';
  isSubmitting: boolean;
  /** 폼 위 오류 문구(RSV_003 등) — 없으면 null */
  errorMessage: string | null;
  onSubmit: (input: ManualReservationFormInput) => void;
  onClose: () => void;
}

export function ManualReservationDialog(props: ManualReservationDialogProps) {
  // 열릴 때마다 다시 마운트해 폼을 비운다(MemberFormDialog 와 같은 방식)
  return props.open ? <ManualReservationDialogBody {...props} /> : null;
}

type FormStatus = ManualReservationFormInput['status'];

const STATUS_OPTIONS: { value: FormStatus; label: string }[] = [
  { value: 'PENDING', label: RESERVATION_STATUS_LABEL.PENDING },
  { value: 'CONFIRMED', label: RESERVATION_STATUS_LABEL.CONFIRMED },
];
const MODE_OPTIONS: { value: ManualEntryMode; label: string }[] = [
  { value: 'tier', label: MSG_D12.MANUAL_MODE_TIER },
  { value: 'custom', label: MSG_D12.MANUAL_MODE_CUSTOM },
];

function ManualReservationDialogBody({
  open,
  showOptions,
  fixedShowId = null,
  inviterOptions = [],
  tierOptions,
  defaultStatus,
  admitNowPlacement,
  isSubmitting,
  errorMessage,
  onSubmit,
  onClose,
}: ManualReservationDialogProps) {
  const [form, setForm] = useState<ManualReservationFormInput>(() => ({
    showId: fixedShowId ?? showOptions[0]?.id ?? '',
    bookerName: '',
    bookerPhone: '',
    inviterMemberId: null,
    memo: '',
    status: defaultStatus,
    admitNow: '',
    tierQuantities: {},
    useCustom: false,
    customLabel: '',
    customQuantity: '',
    customAmount: '',
    useAmountOverride: false,
    amountOverride: '',
  }));
  const [mode, setMode] = useState<ManualEntryMode>(
    tierOptions.length > 0 ? 'tier' : 'custom'
  );
  const [isAdmitTouched, setIsAdmitTouched] = useState(false);
  const [errors, setErrors] = useState<ManualReservationErrors | null>(null);
  const showId = useId();
  const showLabelId = useId();
  const nameId = useId();
  const phoneId = useId();
  const admitId = useId();
  const inviterId = useId();
  const inviterLabelId = useId();
  const memoId = useId();

  const patch = (next: Partial<ManualReservationFormInput>) =>
    setForm((current) => ({ ...current, ...next }));
  const input = toEffectiveManualInput(form, mode, isAdmitTouched);
  const preview = previewLinesAmount(
    input,
    (tierId) => tierOptions.find((tier) => tier.id === tierId)?.price ?? 0
  );
  const show = showOptions.find((option) => option.id === form.showId) ?? null;
  const seatsMessage = seatsBlockMessage(
    preview.quantity,
    show?.remainingSeats ?? null
  );
  const shown = errors ?? null;

  const handleSubmit = () => {
    const next = validateManualReservation(input);
    setErrors(next);
    if (hasErrors(next) || seatsMessage) return;
    onSubmit(input);
  };

  const admitField = (
    <FormField
      label={MSG_D12.MANUAL_ADMIT}
      htmlFor={admitId}
      helper={MSG_D12.MANUAL_ADMIT_HELP(preview.quantity)}
      error={shown?.admitNow}
    >
      <UnitInput
        id={admitId}
        value={input.admitNow}
        unit={MSG_D12.PERSON_UNIT}
        error={Boolean(shown?.admitNow)}
        onChange={(value) => {
          setIsAdmitTouched(true);
          patch({ admitNow: value });
        }}
      />
    </FormField>
  );
  const isConfirmed = form.status === 'CONFIRMED';

  return (
    <AdminDialog
      open={open}
      title={MSG_D12.MANUAL_TITLE}
      onClose={onClose}
      onSubmit={handleSubmit}
      errorMessage={errorMessage}
      blockMessage={seatsMessage}
      isBusy={isSubmitting}
      actions={
        <>
          <Button
            variant='outlined'
            color='inherit'
            onClick={onClose}
            disabled={isSubmitting}
          >
            {MSG_COMMON.CANCEL}
          </Button>
          <Button
            type='submit'
            variant='contained'
            disabled={isSubmitting || seatsMessage !== null}
            startIcon={
              isSubmitting ? (
                <CircularProgress size={16} color='inherit' />
              ) : undefined
            }
          >
            {MSG_D12.MANUAL_SUBMIT}
          </Button>
        </>
      }
    >
      {fixedShowId ? (
        <FormField label={MSG_D12.MANUAL_SHOW}>
          <Typo.Body.Semibold>
            {show
              ? MSG_D12.MANUAL_SHOW_OPT(show.label, show.remainingSeats)
              : MSG_COMMON.EMPTY_VALUE}
          </Typo.Body.Semibold>
        </FormField>
      ) : (
        <FormField
          label={MSG_D12.MANUAL_SHOW}
          htmlFor={showId}
          labelId={showLabelId}
          required
          error={shown?.showId}
        >
          <TextField
            id={showId}
            select
            value={form.showId}
            error={Boolean(shown?.showId)}
            onChange={(event) => patch({ showId: event.target.value })}
            fullWidth
            slotProps={{
              select: {
                labelId: showLabelId,
                SelectDisplayProps: { 'aria-labelledby': showLabelId },
              },
            }}
          >
            {showOptions.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {MSG_D12.MANUAL_SHOW_OPT(option.label, option.remainingSeats)}
              </MenuItem>
            ))}
          </TextField>
        </FormField>
      )}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <FormField
          label={MSG_D12.MANUAL_NAME}
          htmlFor={nameId}
          required
          error={shown?.bookerName}
        >
          <TextField
            id={nameId}
            value={form.bookerName}
            error={Boolean(shown?.bookerName)}
            onChange={(event) => patch({ bookerName: event.target.value })}
            fullWidth
            slotProps={{ htmlInput: { maxLength: 50 } }}
          />
        </FormField>
        <FormField
          label={
            <>
              {MSG_D12.MANUAL_PHONE}{' '}
              <Typo.Badge.Regular color='text.secondary'>
                {MSG_D12.MANUAL_PHONE_OPTIONAL}
              </Typo.Badge.Regular>
            </>
          }
          htmlFor={phoneId}
          error={shown?.bookerPhone}
        >
          <TextField
            id={phoneId}
            value={form.bookerPhone}
            placeholder={MSG_D12.MANUAL_PHONE_PH}
            error={Boolean(shown?.bookerPhone)}
            onChange={(event) => patch({ bookerPhone: event.target.value })}
            fullWidth
            slotProps={{ htmlInput: { inputMode: 'tel', maxLength: 13 } }}
          />
        </FormField>
      </div>
      {tierOptions.length > 0 ? (
        <FormField label={MSG_D12.MANUAL_MODE} asGroup required>
          <SegmentPill
            options={MODE_OPTIONS}
            value={mode}
            onChange={setMode}
            ariaLabel={MSG_D12.MANUAL_MODE}
          />
        </FormField>
      ) : null}
      <Box
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
          px: 4,
          py: mode === 'tier' ? 2 : 4,
        }}
      >
        {mode === 'tier' ? (
          <div className='flex flex-col gap-2 pb-2'>
            <TierQuantityList
              rows={tierOptions.map((tier) => ({
                id: tier.id,
                name: tier.name,
                priceText: formatWon(tier.price),
                isLinkOnly: tier.visibility === 'LINK_ONLY',
              }))}
              quantities={form.tierQuantities}
              canIncrease={preview.quantity < MAX_RESERVATION_QTY}
              onChange={(tierId, quantity) =>
                patch({
                  tierQuantities: {
                    ...form.tierQuantities,
                    [tierId]: String(quantity),
                  },
                })
              }
            />
            <Typo.Caption.Regular color='text.secondary'>
              {MSG_D12.MANUAL_TIER_HELP}
            </Typo.Caption.Regular>
          </div>
        ) : (
          <CustomLineFields
            label={form.customLabel}
            quantity={form.customQuantity}
            amount={form.customAmount}
            errors={{
              customLabel: shown?.customLabel ?? null,
              customQuantity: shown?.customQuantity ?? null,
              customAmount: shown?.customAmount ?? null,
            }}
            onChange={patch}
          />
        )}
      </Box>
      {shown?.lines && !shown.customQuantity ? (
        <Typo.Caption.Regular color='error.main' role='alert'>
          {shown.lines}
        </Typo.Caption.Regular>
      ) : null}
      <LinesTotalBox
        label={
          mode === 'tier' ? MSG_D12.MANUAL_TOTAL_TIER : MSG_D12.MANUAL_TOTAL
        }
        value={MSG_D12.MANUAL_TOTAL_VALUE(
          preview.quantity,
          formatWon(preview.lineAmount)
        )}
      />
      <AmountOverrideField
        checked={form.useAmountOverride}
        value={form.amountOverride}
        error={shown?.amountOverride ?? null}
        onToggle={(checked) => patch({ useAmountOverride: checked })}
        onChange={(value) => patch({ amountOverride: value })}
      />
      <FormField
        label={MSG_D12.MANUAL_STATUS}
        asGroup
        required
        helper={
          isConfirmed
            ? MSG_D12.MANUAL_STATUS_CONFIRMED_HELP
            : MSG_D12.MANUAL_STATUS_PENDING_HELP
        }
      >
        <SegmentPill
          options={STATUS_OPTIONS}
          value={form.status}
          onChange={(status) => patch({ status })}
          ariaLabel={MSG_D12.MANUAL_STATUS}
        />
      </FormField>
      {isConfirmed && admitNowPlacement === 'afterStatus' ? admitField : null}
      {inviterOptions.length > 0 ? (
        <FormField
          label={MSG_D12.MANUAL_INVITER}
          htmlFor={inviterId}
          labelId={inviterLabelId}
        >
          <TextField
            id={inviterId}
            select
            value={form.inviterMemberId ?? ''}
            onChange={(event) =>
              patch({ inviterMemberId: event.target.value || null })
            }
            fullWidth
            slotProps={{
              select: {
                labelId: inviterLabelId,
                displayEmpty: true,
                SelectDisplayProps: { 'aria-labelledby': inviterLabelId },
              },
            }}
          >
            <MenuItem value=''>{MSG_D12.MANUAL_INVITER_NONE}</MenuItem>
            {inviterOptions.map((option) => (
              <MenuItem key={option.memberId} value={option.memberId}>
                {option.name}
              </MenuItem>
            ))}
          </TextField>
        </FormField>
      ) : null}
      <FormField label={MSG_D12.MANUAL_MEMO} htmlFor={memoId}>
        <TextField
          id={memoId}
          value={form.memo}
          placeholder={MSG_D12.MANUAL_MEMO_PH}
          onChange={(event) => patch({ memo: event.target.value })}
          multiline
          minRows={3}
          fullWidth
          slotProps={{ htmlInput: { maxLength: 500 } }}
        />
      </FormField>
      {isConfirmed && admitNowPlacement === 'bottom' ? admitField : null}
    </AdminDialog>
  );
}
