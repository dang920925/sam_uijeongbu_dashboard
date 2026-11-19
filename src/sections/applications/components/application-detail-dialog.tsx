'use client';

// ----------------------------------------------------------------------
// 신청 상세 다이얼로그(design SCR-D06 · 현행 Applications.tsx:286-399). 폼이 아니라 AdminDialog 대신 MUI Dialog.
// - 머리: 제목("🎭 작품 참관 신청 상세"/"💬 방문 상담 신청 상세") + 닫기. xs(768 미만)는 전체 화면.
// - 하단(D6): 대기 "승인"+"거절" / 승인+미등록 "단원으로 등록" / 승인+등록됨 "단원 등록됨" 배지 + 단원 이름 링크 / 거절 없음.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MuiLink from '@mui/material/Link';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import NextLink from 'next/link';
import { useId } from 'react';

import { Iconify } from '@/src/components/iconify';
import { Label } from '@/src/components/label';
import { Typo } from '@/src/components/typo';
import { ApplicationInfoItem } from '@/src/sections/applications/components/application-info-item';
import { ApplicationTextBlock } from '@/src/sections/applications/components/application-text-block';
import type {
  ApplicationRow,
  ApplicationRowHandlers,
} from '@/src/sections/applications/utils/application-row';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D06 } from '@/src/shared/messages/d06';
import { LAYOUT } from '@/src/theme/layout-tokens';

interface ApplicationDetailDialogProps {
  detail: ApplicationRow | null;
  handlers: Omit<ApplicationRowHandlers, 'onView'>;
  onClose: () => void;
}

export function ApplicationDetailDialog({
  detail,
  handlers,
  onClose,
}: ApplicationDetailDialogProps) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('md'));
  const titleId = useId();
  const hasActions =
    detail !== null && (detail.action !== 'none' || detail.member !== null);

  return (
    <Dialog
      open={detail !== null}
      onClose={onClose}
      fullScreen={isXs}
      aria-labelledby={titleId}
      slotProps={{
        paper: {
          sx: { width: '100%', maxWidth: LAYOUT.dialog, m: { xs: 0, md: 4 } },
        },
      }}
    >
      {detail ? (
        <>
          <DialogTitle
            id={titleId}
            component='div'
            sx={{ px: { xs: 4, md: 6 }, pt: { xs: 4, md: 6 }, pb: 4 }}
          >
            <div className='flex items-center justify-between gap-2'>
              <Typo.Title.Bold component='h2'>
                {detail.detailTitle}
              </Typo.Title.Bold>
              <IconButton
                aria-label={MSG_COMMON.CLOSE}
                onClick={onClose}
                sx={{ color: 'text.secondary' }}
              >
                <Iconify icon='solar:close-circle-linear' />
              </IconButton>
            </div>
          </DialogTitle>
          <DialogContent sx={{ px: { xs: 4, md: 6 } }}>
            <div className='flex flex-col gap-4'>
              <div className='flex items-center gap-2'>
                <Label tone={detail.statusTone}>{detail.statusLabel}</Label>
                {detail.processedAt ? (
                  <Typo.Caption.Regular color='text.secondary'>
                    {MSG_D06.PROCESSED_AT(detail.processedAt)}
                  </Typo.Caption.Regular>
                ) : null}
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <ApplicationInfoItem
                  icon='solar:user-linear'
                  label={MSG_D06.INFO_APPLICANT}
                  value={detail.applicantName}
                />
                <ApplicationInfoItem
                  icon='solar:phone-linear'
                  label={MSG_D06.INFO_PHONE}
                  value={detail.phone}
                />
                {detail.ageLabel ? (
                  <ApplicationInfoItem
                    label={MSG_D06.INFO_AGE}
                    value={detail.ageLabel}
                  />
                ) : null}
                {detail.genderLabel ? (
                  <ApplicationInfoItem
                    label={MSG_D06.INFO_GENDER}
                    value={detail.genderLabel}
                  />
                ) : null}
              </div>
              <Divider />
              {detail.appType === 'WORK_OBSERVATION' ? (
                <div className='grid grid-cols-2 gap-4'>
                  {detail.performanceTitle ? (
                    <ApplicationInfoItem
                      icon='solar:masks-linear'
                      label={MSG_D06.INFO_PERFORMANCE}
                      value={detail.performanceTitle}
                      isWide
                    />
                  ) : null}
                  {detail.preferredDate ? (
                    <ApplicationInfoItem
                      icon='solar:calendar-linear'
                      label={MSG_D06.INFO_PREFERRED_DATE}
                      value={detail.preferredDate}
                      isWide
                    />
                  ) : null}
                </div>
              ) : (
                <div className='grid grid-cols-2 gap-4'>
                  {detail.methodLabel ? (
                    <ApplicationInfoItem
                      label={MSG_D06.INFO_METHOD}
                      value={detail.methodLabel}
                    />
                  ) : null}
                  {detail.preferredTimeLabel ? (
                    <ApplicationInfoItem
                      icon='solar:clock-circle-linear'
                      label={MSG_D06.INFO_PREFERRED_TIME}
                      value={detail.preferredTimeLabel}
                    />
                  ) : null}
                </div>
              )}
              {detail.motivation ? (
                <ApplicationTextBlock
                  label={MSG_D06.INFO_MOTIVATION}
                  value={detail.motivation}
                />
              ) : null}
              {detail.question ? (
                <ApplicationTextBlock
                  label={MSG_D06.INFO_QUESTION}
                  value={detail.question}
                />
              ) : null}
              <ApplicationInfoItem
                icon='solar:calendar-linear'
                label={MSG_D06.INFO_CREATED}
                value={detail.createdAt}
              />
            </div>
          </DialogContent>
          {hasActions ? (
            <DialogActions
              sx={{
                px: { xs: 4, md: 6 },
                py: 4,
                gap: 2,
                borderTop: 1,
                borderColor: 'divider',
                justifyContent: 'flex-start',
                '& > :not(style) ~ :not(style)': { ml: 0 },
              }}
            >
              {detail.action === 'review' ? (
                <>
                  <Button
                    variant='contained'
                    startIcon={<Iconify icon='solar:check-circle-linear' />}
                    onClick={() => handlers.onRequestApprove(detail.id)}
                    sx={{ flex: 1 }}
                  >
                    {MSG_D06.APPROVE}
                  </Button>
                  <Button
                    variant='contained'
                    color='error'
                    startIcon={<Iconify icon='solar:close-circle-linear' />}
                    onClick={() => handlers.onRequestReject(detail.id)}
                    sx={{ flex: 1 }}
                  >
                    {MSG_D06.REJECT}
                  </Button>
                </>
              ) : null}
              {detail.action === 'register' ? (
                <Button
                  variant='contained'
                  startIcon={<Iconify icon='solar:user-plus-linear' />}
                  onClick={() => handlers.onRequestRegister(detail.id)}
                  sx={{ flex: 1 }}
                >
                  {MSG_D06.REGISTER}
                </Button>
              ) : null}
              {detail.member ? (
                <div className='flex items-center gap-3'>
                  <Label tone='neutral'>{MSG_D06.REGISTERED}</Label>
                  <MuiLink
                    component={NextLink}
                    href={detail.member.href}
                    underline='always'
                    color='text.primary'
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Typo.Badge.Semibold color='inherit'>
                      {detail.member.name}
                    </Typo.Badge.Semibold>
                    <Iconify icon='solar:alt-arrow-right-linear' />
                  </MuiLink>
                </div>
              ) : null}
            </DialogActions>
          ) : null}
        </>
      ) : null}
    </Dialog>
  );
}
