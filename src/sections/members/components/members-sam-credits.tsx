'use client';

// ----------------------------------------------------------------------
// 배우 프로필 'SAM 출연작'·'참여 직함'(R3 — design §12.1) — props(vm)만으로 렌더.
// SAM 출연작: 행 = 작품명(비노출 라벨) · 배역(출연) · 메모 · 연도 · "연결 해제" / "SAM 출연작 추가" → 한 줄 입력
// (① 작품 ② 배역(선택 — "배역 없음(출연)", 배역이 없으면 "새 배역 추가") ③ 메모 ④ 저장). xs 는 세로로 쌓인다.
// 참여 직함: 행 = 작품 · 직함 · 노출 상태 · 삭제 / "참여 직함 추가" → 작품 + 직함. 회차별 캐스팅 안내 한 줄.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

import { ErrorRetry } from '@/src/components/error-retry';
import { Iconify } from '@/src/components/iconify';
import { Label } from '@/src/components/label';
import { Typo } from '@/src/components/typo';
import type { SamCreditsViewModel } from '@/src/sections/members/view/use-sam-credits-view-model';
import { MSG_D05_SAM } from '@/src/shared/messages/d05-sam';

interface MembersSamCreditsProps {
  vm: SamCreditsViewModel;
}

const ROW_SX = {
  p: 2,
  border: 1,
  borderColor: 'divider',
  borderRadius: 2,
};

export function MembersSamCredits({ vm }: MembersSamCreditsProps) {
  if (vm.loadError) {
    return <ErrorRetry message={vm.loadError} onRetry={vm.onRetry} />;
  }
  const cast = vm.castForm;
  const credit = vm.creditForm;
  return (
    <div className='flex flex-col gap-6'>
      <section
        aria-label={MSG_D05_SAM.CASTS_TITLE}
        className='flex flex-col gap-3'
      >
        <div className='flex items-center justify-between gap-2'>
          <Typo.Badge.Medium component='h3'>
            {MSG_D05_SAM.CASTS_TITLE}
          </Typo.Badge.Medium>
          {cast.draft ? null : (
            <Button
              size='small'
              color='inherit'
              onClick={cast.onOpen}
              startIcon={<Iconify icon='solar:add-circle-linear' />}
            >
              {MSG_D05_SAM.CAST_ADD}
            </Button>
          )}
        </div>
        {vm.castRows.length === 0 && !vm.isLoading ? (
          <Typo.Caption.Regular color='text.secondary'>
            {MSG_D05_SAM.CASTS_EMPTY}
          </Typo.Caption.Regular>
        ) : null}
        <ul className='m-0 flex list-none flex-col gap-2 p-0'>
          {vm.castRows.map((row) => (
            <Box
              component='li'
              key={row.key}
              sx={ROW_SX}
              className='flex flex-col gap-1'
            >
              <div className='flex flex-wrap items-center gap-2'>
                <Typo.Body.Semibold>{row.title}</Typo.Body.Semibold>
                {row.isHidden ? (
                  <Label tone='neutral'>{MSG_D05_SAM.HIDDEN_PERFORMANCE}</Label>
                ) : null}
              </div>
              <div className='flex flex-wrap items-center gap-2'>
                <Typo.Badge.Regular color='text.secondary'>
                  {[row.roleLabel, row.note, row.year]
                    .filter((v) => v !== null && v !== '')
                    .join(' · ')}
                </Typo.Badge.Regular>
                <Button
                  size='small'
                  color='inherit'
                  sx={{ ml: 'auto' }}
                  onClick={() => vm.onUnlink(row.roleId)}
                  aria-label={MSG_D05_SAM.unlinkAria(row.title, row.roleLabel)}
                >
                  {MSG_D05_SAM.UNLINK}
                </Button>
              </div>
            </Box>
          ))}
        </ul>
        {cast.draft ? (
          <Box sx={ROW_SX} className='flex flex-col gap-2'>
            <TextField
              select
              label={MSG_D05_SAM.PERFORMANCE}
              value={cast.draft.performanceId}
              onChange={(e) => cast.onChange({ performanceId: e.target.value })}
            >
              {vm.performanceOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            {cast.hasNoRoles ? (
              <TextField
                label={MSG_D05_SAM.NEW_ROLE}
                placeholder={MSG_D05_SAM.NEW_ROLE_PH}
                value={cast.draft.newRoleName}
                onChange={(e) => cast.onChange({ newRoleName: e.target.value })}
                slotProps={{ htmlInput: { maxLength: 50 } }}
              />
            ) : (
              <TextField
                select
                label={MSG_D05_SAM.ROLE}
                value={cast.draft.roleId}
                disabled={cast.draft.performanceId === ''}
                onChange={(e) => cast.onChange({ roleId: e.target.value })}
                slotProps={{
                  select: { displayEmpty: true },
                  inputLabel: { shrink: true },
                }}
              >
                <MenuItem value=''>{MSG_D05_SAM.ROLE_NONE}</MenuItem>
                {cast.roleOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
            <TextField
              label={MSG_D05_SAM.NOTE}
              placeholder={MSG_D05_SAM.NOTE_PH}
              value={cast.draft.note}
              onChange={(e) => cast.onChange({ note: e.target.value })}
              slotProps={{ htmlInput: { maxLength: 30 } }}
            />
            {cast.error ? (
              <Typo.Caption.Regular color='error.main' role='alert'>
                {cast.error}
              </Typo.Caption.Regular>
            ) : null}
            <div className='flex justify-end gap-2'>
              <Button
                color='inherit'
                onClick={cast.onCancel}
                disabled={cast.isSaving}
              >
                {MSG_D05_SAM.CANCEL}
              </Button>
              <Button
                variant='contained'
                onClick={cast.onSubmit}
                disabled={cast.isSaving}
              >
                {MSG_D05_SAM.SAVE}
              </Button>
            </div>
          </Box>
        ) : null}
        <Typo.Caption.Regular color='text.secondary'>
          {MSG_D05_SAM.SHOW_CAST_GUIDE}
        </Typo.Caption.Regular>
      </section>

      <section
        aria-label={MSG_D05_SAM.CREDITS_TITLE}
        className='flex flex-col gap-3'
      >
        <div className='flex items-center justify-between gap-2'>
          <Typo.Badge.Medium component='h3'>
            {MSG_D05_SAM.CREDITS_TITLE}
          </Typo.Badge.Medium>
          {credit.draft ? null : (
            <Button
              size='small'
              color='inherit'
              onClick={credit.onOpen}
              startIcon={<Iconify icon='solar:add-circle-linear' />}
            >
              {MSG_D05_SAM.CREDIT_ADD}
            </Button>
          )}
        </div>
        {vm.creditRows.length === 0 && !vm.isLoading ? (
          <Typo.Caption.Regular color='text.secondary'>
            {MSG_D05_SAM.CREDITS_EMPTY}
          </Typo.Caption.Regular>
        ) : null}
        <ul className='m-0 flex list-none flex-col gap-2 p-0'>
          {vm.creditRows.map((row) => (
            <Box
              component='li'
              key={row.id}
              sx={ROW_SX}
              className='flex flex-wrap items-center gap-2'
            >
              <div className='flex min-w-0 flex-col'>
                <Typo.Caption.Regular color='text.secondary'>
                  {row.performanceTitle}
                </Typo.Caption.Regular>
                <Typo.Body.Semibold>{row.title}</Typo.Body.Semibold>
              </div>
              <Label tone={row.isVisible ? 'success' : 'neutral'}>
                {row.isVisible
                  ? MSG_D05_SAM.CREDIT_VISIBLE
                  : MSG_D05_SAM.CREDIT_HIDDEN}
              </Label>
              <IconButton
                aria-label={MSG_D05_SAM.creditDeleteAria(row.title)}
                onClick={() => vm.onDeleteCredit(row.id)}
                sx={{ ml: 'auto', color: 'error.main' }}
              >
                <Iconify icon='solar:trash-bin-trash-linear' />
              </IconButton>
            </Box>
          ))}
        </ul>
        {credit.draft ? (
          <Box sx={ROW_SX} className='flex flex-col gap-2'>
            <TextField
              select
              label={MSG_D05_SAM.PERFORMANCE}
              value={credit.draft.performanceId}
              onChange={(e) =>
                credit.onChange({ performanceId: e.target.value })
              }
            >
              {vm.performanceOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={MSG_D05_SAM.CREDIT_TITLE}
              placeholder={MSG_D05_SAM.CREDIT_TITLE_PH}
              value={credit.draft.title}
              onChange={(e) => credit.onChange({ title: e.target.value })}
              slotProps={{ htmlInput: { maxLength: 30 } }}
            />
            {credit.error ? (
              <Typo.Caption.Regular color='error.main' role='alert'>
                {credit.error}
              </Typo.Caption.Regular>
            ) : null}
            <div className='flex justify-end gap-2'>
              <Button
                color='inherit'
                onClick={credit.onCancel}
                disabled={credit.isSaving}
              >
                {MSG_D05_SAM.CANCEL}
              </Button>
              <Button
                variant='contained'
                onClick={credit.onSubmit}
                disabled={credit.isSaving}
              >
                {MSG_D05_SAM.SAVE}
              </Button>
            </div>
          </Box>
        ) : null}
      </section>
    </div>
  );
}
