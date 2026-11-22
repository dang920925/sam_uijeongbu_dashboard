'use client';

// ----------------------------------------------------------------------
// 좌석 배치 편집기 Dialog(U35 — design §14 SCR-D11): 열 수·열당 칸 수 → 격자(칸을 누르면 좌석/통로/사용 안 함) →
// 미리보기(관객 화면 모양) → "다른 회차 배치 복사" → 배치 저장. 예매된 좌석은 잠김(✕, 바꿀 수 없음).
// props 만으로 렌더 — 상태·요청은 use-seat-layout-editor.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import { useId } from 'react';

import { AdminDialog } from '@/src/components/admin-dialog';
import { ErrorRetry } from '@/src/components/error-retry';
import { FormField } from '@/src/components/form-field';
import {
  SeatGrid,
  SeatGridLegend,
  type SeatGridRowView,
} from '@/src/components/seat-grid';
import { Typo } from '@/src/components/typo';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_SEAT } from '@/src/shared/messages/seat';

export interface SeatLayoutDialogProps {
  open: boolean;
  title: string;
  status: 'loading' | 'error' | 'ready';
  loadErrorMessage: string | null;
  isNew: boolean;
  rowsInput: string;
  colsInput: string;
  sizeError: string | null;
  editorRows: SeatGridRowView[];
  previewRows: SeatGridRowView[];
  summaryText: string;
  copyOptions: { value: string; label: string }[];
  copySourceId: string;
  isCopying: boolean;
  isSaving: boolean;
  errorMessage: string | null;
  onRowsChange: (value: string) => void;
  onColsChange: (value: string) => void;
  onCellClick: (key: string) => void;
  onCopySourceChange: (value: string) => void;
  onCopy: () => void;
  onSave: () => void;
  onClose: () => void;
  onRetry: () => void;
}

export function SeatLayoutDialog(props: SeatLayoutDialogProps) {
  const rowsId = useId();
  const colsId = useId();
  const copyId = useId();
  const copyLabelId = useId();
  const busy = props.isSaving || props.isCopying;

  const body =
    props.status === 'loading' ? (
      <Skeleton variant='rounded' height={240} />
    ) : props.status === 'error' ? (
      <ErrorRetry
        message={props.loadErrorMessage ?? MSG_SEAT.LOAD_ERROR}
        onRetry={props.onRetry}
      />
    ) : (
      <>
        {props.isNew ? (
          <Typo.Caption.Regular color='text.secondary'>
            {MSG_SEAT.EDITOR_NEW}
          </Typo.Caption.Regular>
        ) : null}
        <div className='grid grid-cols-2 gap-4'>
          <FormField
            label={MSG_SEAT.EDITOR_ROWS}
            htmlFor={rowsId}
            error={props.sizeError}
          >
            <TextField
              id={rowsId}
              value={props.rowsInput}
              error={Boolean(props.sizeError)}
              onChange={(event) => props.onRowsChange(event.target.value)}
              fullWidth
              slotProps={{
                htmlInput: { inputMode: 'numeric', 'data-testid': 'seat-rows' },
              }}
            />
          </FormField>
          <FormField
            label={MSG_SEAT.EDITOR_COLS}
            htmlFor={colsId}
            helper={MSG_SEAT.EDITOR_SIZE_HELP}
          >
            <TextField
              id={colsId}
              value={props.colsInput}
              error={Boolean(props.sizeError)}
              onChange={(event) => props.onColsChange(event.target.value)}
              fullWidth
              slotProps={{
                htmlInput: { inputMode: 'numeric', 'data-testid': 'seat-cols' },
              }}
            />
          </FormField>
        </div>
        <Box className='flex flex-col gap-2'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <Typo.Body.Semibold>{MSG_SEAT.EDITOR_GRID}</Typo.Body.Semibold>
            <Typo.Badge.Semibold data-testid='seat-layout-summary'>
              {props.summaryText}
            </Typo.Badge.Semibold>
          </div>
          <SeatGridLegend
            ariaLabel={MSG_SEAT.LEGEND}
            items={[
              { tone: 'available', label: MSG_SEAT.LEGEND_SEAT },
              { tone: 'aisle', label: MSG_SEAT.LEGEND_AISLE },
              { tone: 'void', label: MSG_SEAT.LEGEND_VOID },
              { tone: 'locked', label: MSG_SEAT.LEGEND_SOLD },
            ]}
          />
          <SeatGrid
            rows={props.editorRows}
            stageLabel={MSG_SEAT.STAGE}
            ariaLabel={MSG_SEAT.EDITOR_GRID}
            showEmptyCells
            testId='seat-layout-editor'
            onCellClick={props.onCellClick}
          />
          <Typo.Caption.Regular color='text.secondary'>
            {MSG_SEAT.EDITOR_HINT}
          </Typo.Caption.Regular>
        </Box>
        <Box className='flex flex-col gap-2'>
          <Typo.Body.Semibold>{MSG_SEAT.EDITOR_PREVIEW}</Typo.Body.Semibold>
          <SeatGrid
            rows={props.previewRows}
            stageLabel={MSG_SEAT.STAGE}
            ariaLabel={MSG_SEAT.EDITOR_PREVIEW}
            testId='seat-layout-preview'
            cellSize={24}
          />
        </Box>
        {props.copyOptions.length > 0 ? (
          <FormField
            label={MSG_SEAT.EDITOR_COPY_LABEL}
            htmlFor={copyId}
            labelId={copyLabelId}
          >
            <div className='flex gap-2'>
              <TextField
                id={copyId}
                select
                value={props.copySourceId}
                onChange={(event) =>
                  props.onCopySourceChange(event.target.value)
                }
                fullWidth
                slotProps={{
                  select: {
                    labelId: copyLabelId,
                    displayEmpty: true,
                    SelectDisplayProps: { 'aria-labelledby': copyLabelId },
                  },
                }}
              >
                <MenuItem value=''>{MSG_SEAT.EDITOR_COPY_PH}</MenuItem>
                {props.copyOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                variant='outlined'
                color='inherit'
                onClick={props.onCopy}
                disabled={!props.copySourceId || busy}
                sx={{ flexShrink: 0 }}
              >
                {MSG_SEAT.EDITOR_COPY_BUTTON}
              </Button>
            </div>
          </FormField>
        ) : null}
      </>
    );

  return (
    <AdminDialog
      open={props.open}
      title={props.title}
      wide
      onClose={props.onClose}
      onSubmit={props.onSave}
      errorMessage={props.errorMessage}
      isBusy={busy}
      actions={
        <>
          <Button
            variant='outlined'
            color='inherit'
            onClick={props.onClose}
            disabled={busy}
          >
            {MSG_COMMON.CANCEL}
          </Button>
          <Button
            type='submit'
            variant='contained'
            disabled={busy || props.status !== 'ready'}
            startIcon={
              props.isSaving ? (
                <CircularProgress size={16} color='inherit' />
              ) : undefined
            }
          >
            {MSG_SEAT.EDITOR_SAVE}
          </Button>
        </>
      }
    >
      {body}
    </AdminDialog>
  );
}
