'use client';

// ----------------------------------------------------------------------
// 신청 상세 드로어(U31 보강 — designer §18.3): lg 오른쪽 440 비모달(목록을 계속 누를 수 있게) / lg 미만 모달
// (md 오른쪽 440 · xs 전체 화면). 머리 제목("🎭 작품 참관 신청 상세"/"💬 방문 상담 신청 상세") + 닫기.
// 본문: 요약 → 연락(전화·스위치·메모) → 진행 단계 → 신청 동기/문의 → 하단 고정 동작(승인·거절 / 단원으로 등록).
// 비모달이라 Esc 로 닫기와 열 때 제목 포커스를 직접 맡는다(designer §18.3 확인 필요 ⑦).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useEffect, useId, useRef, type KeyboardEvent } from 'react';

import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import { ApplicationContactSection } from '@/src/sections/applications/components/application-contact-section';
import { ApplicationDetailActions } from '@/src/sections/applications/components/application-detail-actions';
import { ApplicationDetailSummary } from '@/src/sections/applications/components/application-detail-summary';
import { ApplicationProgressSteps } from '@/src/sections/applications/components/application-progress-steps';
import { ApplicationTextBlock } from '@/src/sections/applications/components/application-text-block';
import type {
  ApplicationDetailHandlers,
  ApplicationRow,
} from '@/src/sections/applications/utils/application-row';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D06 } from '@/src/shared/messages/d06';
import { LAYOUT } from '@/src/theme/layout-tokens';
import type { ApplicationProgress } from '@/src/types/codes';

/** designer §18.3 "lg 오른쪽 440"(--layout-admin-drawer 제안 — 토큰 미정, 320 + 44×2 + 32 = 440) */
const DRAWER_WIDTH = LAYOUT.panel + LAYOUT.touch * 2 + LAYOUT.controlSm;

interface ApplicationDetailDrawerProps {
  detail: ApplicationRow | null;
  memo: string;
  isSavingMemo: boolean;
  handlers: ApplicationDetailHandlers & {
    onToggleContact: (id: string, contacted: boolean) => void;
    onChangeProgress: (id: string, progress: ApplicationProgress) => void;
    onMemoChange: (value: string) => void;
    onSaveMemo: () => void;
  };
  onClose: () => void;
}

export function ApplicationDetailDrawer({
  detail,
  memo,
  isSavingMemo,
  handlers,
  onClose,
}: ApplicationDetailDrawerProps) {
  const theme = useTheme();
  const isLg = useMediaQuery(theme.breakpoints.up('lg'));
  const titleId = useId();
  const progressHeadingId = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const openId = detail?.id ?? null;

  // 다른 신청을 열면 제목으로 포커스(비모달은 MUI 가 포커스를 옮기지 않는다)
  useEffect(() => {
    if (openId) titleRef.current?.focus();
  }, [openId]);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') onClose();
  };

  return (
    <Drawer
      anchor='right'
      variant={isLg ? 'persistent' : 'temporary'}
      open={detail !== null}
      onClose={onClose}
      slotProps={{
        paper: {
          role: 'dialog',
          'aria-modal': !isLg,
          'aria-labelledby': titleId,
          onKeyDown: handleKeyDown,
          sx: {
            width: { xs: '100%', md: DRAWER_WIDTH },
            boxShadow: isLg ? 8 : undefined,
          },
        } as object,
      }}
    >
      {detail ? (
        <div className='flex h-full flex-col'>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 3,
              px: { xs: 4, md: 6 },
              py: 4,
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Box
              component='h2'
              id={titleId}
              tabIndex={-1}
              ref={titleRef}
              sx={{ m: 0, outline: 'none' }}
            >
              <Typo.Title.Bold>{detail.detailTitle}</Typo.Title.Bold>
            </Box>
            <IconButton
              aria-label={MSG_COMMON.CLOSE}
              onClick={onClose}
              sx={{ width: LAYOUT.touch, height: LAYOUT.touch, mr: -2 }}
            >
              <Iconify icon='solar:close-circle-linear' size='md' />
            </IconButton>
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto', px: { xs: 4, md: 6 }, py: 4 }}>
            <div className='flex flex-col gap-4'>
              <ApplicationDetailSummary detail={detail} />
              <Divider />
              <ApplicationContactSection
                detail={detail}
                memo={memo}
                isSaving={isSavingMemo}
                onToggle={(contacted) =>
                  handlers.onToggleContact(detail.id, contacted)
                }
                onMemoChange={handlers.onMemoChange}
                onSaveMemo={handlers.onSaveMemo}
              />
              <Divider />
              <section
                aria-labelledby={progressHeadingId}
                className='flex flex-col gap-3'
              >
                <Typo.Badge.Bold component='h3' id={progressHeadingId}>
                  {MSG_D06.SEC_PROGRESS}
                </Typo.Badge.Bold>
                <ApplicationProgressSteps
                  progress={detail.progress}
                  labelledBy={progressHeadingId}
                  onChange={(progress) =>
                    handlers.onChangeProgress(detail.id, progress)
                  }
                />
              </section>
              {detail.motivation || detail.question ? <Divider /> : null}
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
            </div>
          </Box>
          <ApplicationDetailActions detail={detail} handlers={handlers} />
        </div>
      ) : null}
    </Drawer>
  );
}
