'use client';

// ----------------------------------------------------------------------
// (U47) SCR-D04 기본 정보 탭 맨 아래 '공연 삭제' 위험 카드 — 설명 + 빨간 버튼.
// 확인 창: "'{작품명}'을 삭제합니다. 되돌릴 수 없습니다." + 확인 체크(체크해야 삭제 버튼이 켜진다).
// 실패 문구(PERF_002 예매 있음 등)는 창 안에 보인다. props 만으로 렌더.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

import { AdminDialog } from '@/src/components/admin-dialog';
import { Iconify } from '@/src/components/iconify';
import { Typo } from '@/src/components/typo';
import { PerformanceDetailSectionCard } from '@/src/sections/performance-detail/components/performance-detail-section-card';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D04 } from '@/src/shared/messages/d04';

export interface PerformanceDeleteState {
  title: string;
  isOpen: boolean;
  isChecked: boolean;
  isDeleting: boolean;
  errorMessage: string | null;
  onOpen: () => void;
  onToggleCheck: (checked: boolean) => void;
  onConfirm: () => void;
  onClose: () => void;
}

interface PerformanceDeleteCardProps {
  state: PerformanceDeleteState;
}

export function PerformanceDeleteCard({ state }: PerformanceDeleteCardProps) {
  return (
    <>
      <PerformanceDetailSectionCard
        title={MSG_D04.DANGER_TITLE}
        action={
          <Button
            variant='outlined'
            color='error'
            onClick={state.onOpen}
            startIcon={<Iconify icon='solar:trash-bin-trash-linear' />}
          >
            {MSG_D04.DELETE_PERFORMANCE}
          </Button>
        }
      >
        <Typo.Badge.Regular color='text.secondary'>
          {MSG_D04.DANGER_DESC}
        </Typo.Badge.Regular>
      </PerformanceDetailSectionCard>
      <AdminDialog
        open={state.isOpen}
        title={MSG_D04.DELETE_PERFORMANCE}
        onClose={state.onClose}
        isBusy={state.isDeleting}
        errorMessage={state.errorMessage}
        actions={
          <>
            <Button variant='outlined' color='inherit' onClick={state.onClose}>
              {MSG_COMMON.CANCEL}
            </Button>
            <Button
              variant='contained'
              color='error'
              disabled={!state.isChecked || state.isDeleting}
              onClick={state.onConfirm}
            >
              {MSG_D04.DELETE_PERFORMANCE}
            </Button>
          </>
        }
      >
        <Typo.Body.Semibold data-testid='performance-delete-message'>
          {MSG_D04.DELETE_PERFORMANCE_CONFIRM(state.title)}
        </Typo.Body.Semibold>
        <Typo.Badge.Regular color='text.secondary'>
          {MSG_D04.DANGER_DESC}
        </Typo.Badge.Regular>
        <FormControlLabel
          control={
            <Checkbox
              checked={state.isChecked}
              onChange={(_, checked) => state.onToggleCheck(checked)}
            />
          }
          label={MSG_D04.DELETE_PERFORMANCE_CHECK}
        />
      </AdminDialog>
    </>
  );
}
