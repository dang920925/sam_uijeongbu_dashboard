'use client';

// ----------------------------------------------------------------------
// ManualReservationDialog — 예매 수동 등록(design SCR-D12 "수동 등록 Dialog" · SCR-D13 "현장 예매 등록").
// develop §11.10 보강(무료·특별 초대도 여기로) · design §6.1b · designer §13.11 dialog-manual(-direct):
// 회차* · 이름* · 연락처(선택) · 입력 방식 "등급별 수량 / 직접 입력"(이름 기본 "직접 입력" + 매수 + 금액) ·
// "금액 직접 정하기"(0원 허용) · 상태 "입금 대기 / 확정" · 초대 단원(선택) · 메모 · (확정이면) 입장 인원.
// 남은 좌석보다 많으면 저장 불가. D13 은 입장 인원을 상태 바로 아래에 둔다(designer §13.11 남은 확인 6).
// U35: seatPicker 를 주면(좌석 지정 공연) 매수 아래 "좌석(선택)" — 고르면 매수만큼, 비우면 좌석 미정(J-104).
// U36: 초대 선택지 맨 위 "임원·스태프 및 관계자"(INVITER_STAFF_VALUE).
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
  INVITER_STAFF_VALUE,
  previewLinesAmount,
  type ManualReservationFormInput,
} from '@/src/api/reservation-mapper';
import type { AdminSeatMap } from '@/src/api/seat-map-mapper';
import { SeatPickerField } from '@/src/components/manual-reservation-dialog/seat-picker-field';
import { MSG_SEAT } from '@/src/shared/messages/seat';
import {
  findSeatCell,
  pickedLabels,
  resolvePicked,
  toggleSeatPick,
  toPickerRows,
} from '@/src/utils/seat-grid-view';
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

/** U35 좌석 고르기 — 고른 회차의 지도(VM 이 회차 바뀜을 받아 불러온다) */
export interface ManualReservationSeatPicker {
  status: 'loading' | 'error' | 'ready';
  map: AdminSeatMap | null;
  onShowChange: (showId: string) => void;
  onRetry: () => void;
}

export interface ManualReservationDialogProps {
  open: boolean;
  /** 회차 선택지 — fixedShowId 가 있으면 선택 칸 대신 그 회차를 읽기 전용으로 보인다 */
  showOptions: ManualReservationShowOption[];
  /** D13: 고른 회차 고정 */
  fixedShowId?: string | null;
  /** 초대 단원 선택지 — 주지 않으면(undefined) 칸을 숨긴다. 비어 있어도 "임원·스태프 및 관계자"·"없음/모름"은 고를 수 있다(U36) */
  inviterOptions?: ManualReservationInviterOption[];
  /** 등급 선택지 — 비면 "직접 입력" 방식만 보인다 */
  tierOptions: ManualReservationTierOption[];
  /** 상태 기본값 — D12 'PENDING' · D13 'CONFIRMED'(designer §13.11) */
  defaultStatus: 'PENDING' | 'CONFIRMED';
  /** 입장 인원 칸 — D13 'afterStatus'(확정이면 상태 바로 아래, 기본 = 매수) · 'bottom'(맨 아래) · D12 'none'(칸 없음, 늘 0 — R1-002 사용자 결정) */
  admitNowPlacement: 'afterStatus' | 'bottom' | 'none';
  /** U35 — 좌석 지정 공연일 때만(없으면 좌석 칸 없음) */
  seatPicker?: ManualReservationSeatPicker | null;
  /** 현장 터치 하한(px) — D13 은 48(S24 · qa-r1 R1-004). 없으면 대시보드 기본 */
  minTouch?: number;
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
  inviterOptions,
  tierOptions,
  defaultStatus,
  admitNowPlacement,
  seatPicker = null,
  minTouch,
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
  const [seatIds, setSeatIds] = useState<string[]>([]);
  const [isSeatOpen, setIsSeatOpen] = useState(false);
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
  const input = toEffectiveManualInput(
    form,
    mode,
    isAdmitTouched,
    admitNowPlacement !== 'none'
  );
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
  const seatMap = seatPicker?.status === 'ready' ? seatPicker.map : null;
  const pickedSeats = resolvePicked(seatMap, seatIds, preview.quantity);
  const seatPickError =
    pickedSeats.length > 0 && pickedSeats.length !== preview.quantity
      ? MSG_SEAT.MANUAL_SEAT_NEED(preview.quantity)
      : null;

  const handleSubmit = () => {
    const next = validateManualReservation(input);
    setErrors(next);
    if (hasErrors(next) || seatsMessage || seatPickError) return;
    onSubmit({ ...input, seatIds: pickedSeats });
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
      minTouch={minTouch}
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
            onChange={(event) => {
              patch({ showId: event.target.value });
              setSeatIds([]);
              seatPicker?.onShowChange(event.target.value);
            }}
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
      {seatPicker && seatPicker.map !== null ? (
        <SeatPickerField
          status={seatPicker.status}
          isOpen={isSeatOpen}
          rows={
            seatMap ? toPickerRows(seatMap, pickedSeats, preview.quantity) : []
          }
          pickedText={MSG_SEAT.PICKED(
            pickedLabels(seatMap, pickedSeats),
            pickedSeats.length,
            preview.quantity
          )}
          hasQuantity={preview.quantity > 0}
          error={seatPickError}
          onOpen={() => setIsSeatOpen(true)}
          onClear={() => setSeatIds([])}
          onCellClick={(key) => {
            const cell = findSeatCell(seatMap, key);
            if (cell?.seatId)
              setSeatIds(
                toggleSeatPick(pickedSeats, cell.seatId, preview.quantity)
              );
          }}
          onRetry={seatPicker.onRetry}
        />
      ) : seatPicker && seatPicker.status !== 'ready' ? (
        <SeatPickerField
          status={seatPicker.status}
          isOpen={isSeatOpen}
          rows={[]}
          pickedText=''
          hasQuantity={preview.quantity > 0}
          error={null}
          onOpen={() => setIsSeatOpen(true)}
          onClear={() => setSeatIds([])}
          onCellClick={() => undefined}
          onRetry={seatPicker.onRetry}
        />
      ) : null}
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
      {inviterOptions ? (
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
            <MenuItem value={INVITER_STAFF_VALUE}>
              {MSG_SEAT.INVITER_STAFF}
            </MenuItem>
            {inviterOptions.map((option) => (
              <MenuItem key={option.memberId} value={option.memberId}>
                {option.name}
              </MenuItem>
            ))}
            <MenuItem value=''>{MSG_SEAT.INVITER_NONE}</MenuItem>
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
