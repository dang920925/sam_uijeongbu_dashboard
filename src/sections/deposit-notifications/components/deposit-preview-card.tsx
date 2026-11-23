'use client';

// ----------------------------------------------------------------------
// '알림 문구 시험' 카드(R2 — 사용자 결정 2026-11-23) — 받은 알림 문구를 붙여 넣으면 저장하지 않고 판정 결과를 미리 보여 준다.
// 결과: 판정 라벨(+이유) · 읽은 금액 · 금액 후보 · 찾은 방법 · 맞는 예매(받은 금액 포함).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import TextField from '@mui/material/TextField';
import { useId } from 'react';

import { FormField } from '@/src/components/form-field';
import { Iconify } from '@/src/components/iconify';
import { Label } from '@/src/components/label';
import { Typo } from '@/src/components/typo';
import type { DepositNotificationsViewModel } from '@/src/sections/deposit-notifications/view/use-deposit-notifications-view-model';
import { MSG_DEP } from '@/src/shared/messages/deposit-notifications';

interface DepositPreviewCardProps {
  preview: DepositNotificationsViewModel['preview'];
}

function ResultLine({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex flex-wrap gap-2'>
      <Typo.Caption.Regular color='text.secondary'>
        {label}
      </Typo.Caption.Regular>
      <Typo.Caption.Semibold>{value}</Typo.Caption.Semibold>
    </div>
  );
}

export function DepositPreviewCard({ preview }: DepositPreviewCardProps) {
  const titleId = useId();
  const textId = useId();
  const result = preview.result;
  return (
    <Card component='section' aria-labelledby={`${titleId}-heading`}>
      <Box sx={{ p: { xs: 4, md: 6 } }} className='flex flex-col gap-4'>
        <div className='flex flex-col gap-1'>
          <Typo.Title.Bold component='h2' id={`${titleId}-heading`}>
            {MSG_DEP.PREVIEW_TITLE}
          </Typo.Title.Bold>
          <Typo.Caption.Regular color='text.secondary'>
            {MSG_DEP.PREVIEW_DESCRIPTION}
          </Typo.Caption.Regular>
        </div>
        <FormField label={MSG_DEP.PREVIEW_LABEL} htmlFor={textId}>
          <TextField
            id={textId}
            value={preview.text}
            onChange={(event) => preview.onTextChange(event.target.value)}
            placeholder={MSG_DEP.PREVIEW_PLACEHOLDER}
            multiline
            minRows={2}
            fullWidth
            slotProps={{ htmlInput: { maxLength: 1000 } }}
          />
        </FormField>
        <div>
          <Button
            variant='contained'
            startIcon={<Iconify icon='solar:magnifer-linear' />}
            disabled={!preview.canRun}
            onClick={preview.onRun}
          >
            {MSG_DEP.PREVIEW_RUN}
          </Button>
        </div>
        {preview.errorMessage ? (
          <Typo.Caption.Regular color='error.main' role='alert'>
            {preview.errorMessage}
          </Typo.Caption.Regular>
        ) : null}
        {result ? (
          <Box
            role='status'
            aria-label={MSG_DEP.PREVIEW_RESULT}
            sx={{ p: 4, borderRadius: 2, bgcolor: 'action.hover' }}
            className='flex flex-col gap-2'
          >
            <div className='flex flex-wrap items-center gap-2'>
              <Label tone={result.statusTone}>{result.statusLabel}</Label>
            </div>
            {result.reasonText ? (
              <ResultLine
                label={MSG_DEP.PREVIEW_REASON}
                value={result.reasonText}
              />
            ) : null}
            <ResultLine
              label={MSG_DEP.PREVIEW_AMOUNT}
              value={result.amountText}
            />
            <ResultLine
              label={MSG_DEP.PREVIEW_CANDIDATES}
              value={result.candidatesText}
            />
            <ResultLine
              label={MSG_DEP.PREVIEW_MATCHED_BY}
              value={result.matchedByText}
            />
            {result.matches.map((match) => (
              <ResultLine
                key={match.id}
                label={MSG_DEP.PREVIEW_MATCHES}
                value={
                  match.partialText
                    ? `${match.text} (${match.partialText})`
                    : match.text
                }
              />
            ))}
            {preview.autoConfirm ? null : (
              <Typo.Caption.Regular color='text.secondary'>
                {MSG_DEP.AUTO_OFF_NOTICE}
              </Typo.Caption.Regular>
            )}
            <Typo.Caption.Regular color='text.secondary'>
              {MSG_DEP.PREVIEW_NOT_SAVED}
            </Typo.Caption.Regular>
          </Box>
        ) : null}
      </Box>
    </Card>
  );
}
