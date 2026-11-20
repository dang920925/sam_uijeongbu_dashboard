'use client';

// ----------------------------------------------------------------------
// SCR-D13 입장 체크 View — props 만으로 그린다. 명단 칸(카드·표·빈·다른 회차·스켈레톤)과 회차 상태(로딩·오류·회차 없음)는
// Container 가 골라 준다. 구조(designer §13.7.4 1.1):
//   xs  머리 → 회차 칩(가로 스크롤) → [고정: 배너 · 현황 · 검색] → 명단 1열 → [아래 고정: 현장 예매 등록]
//   md  같은 구조, 고정 묶음은 테두리 카드, 명단 2열, 현장 예매 등록은 머리 오른쪽
//   lg  본문(검색 고정 + 표) + 오른쪽 현황 패널 360(sticky)
// 사용자 처리 결과만 화면 읽기(aria-live)로 알린다 — 10초 갱신 숫자는 live 영역 밖.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import type { ReactNode } from 'react';

import { ManualReservationDialog } from '@/src/components/manual-reservation-dialog';
import { PageContainer } from '@/src/components/page-container';
import { PageHead } from '@/src/components/page-head';
import { ADMISSION_SX } from '@/src/sections/admission/components/admission-field-sx';
import { AdmissionOnsiteButton } from '@/src/sections/admission/components/admission-onsite-button';
import { AdmissionOfflineBanner } from '@/src/sections/admission/components/admission-offline-banner';
import { AdmissionPanel } from '@/src/sections/admission/components/admission-panel';
import { AdmissionPaySheet } from '@/src/sections/admission/components/admission-pay-sheet';
import { AdmissionSearch } from '@/src/sections/admission/components/admission-search';
import { AdmissionShowChips } from '@/src/sections/admission/components/admission-show-chips';
import { AdmissionStats } from '@/src/sections/admission/components/admission-stats';
import type { AdmissionViewModel } from '@/src/sections/admission/view/use-admission-view-model';
import { MSG_D13 } from '@/src/shared/messages/d13';
import { LAYOUT, RADIUS } from '@/src/theme/layout-tokens';

interface AdmissionViewProps {
  vm: AdmissionViewModel;
  /** 회차가 없거나 불러오는 중·실패면 그 화면(칩·현황·검색 대신) */
  showsFallback: ReactNode | null;
  list: ReactNode;
}

export function AdmissionView({ vm, showsFallback, list }: AdmissionViewProps) {
  const statsProps = {
    showLabel: vm.showLabel,
    summary: vm.summary,
    freshness: vm.freshness,
    isRefreshing: vm.isRefreshing,
    onRefresh: vm.onRefresh,
  };
  return (
    <PageContainer>
      <div className='flex flex-col gap-4 md:gap-6'>
        <PageHead
          title={MSG_D13.TITLE}
          subtitle={
            <span className='hidden md:inline'>{MSG_D13.SUBTITLE}</span>
          }
          actions={
            showsFallback ? null : (
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <AdmissionOnsiteButton onClick={vm.onOpenOnsite} />
              </Box>
            )
          }
        />
        {showsFallback ?? (
          <>
            <AdmissionShowChips
              chips={vm.showChips}
              onSelect={vm.onSelectShow}
            />
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'minmax(0, 1fr)',
                  lg: `minmax(0, 1fr) ${ADMISSION_SX.panel}px`,
                },
                gap: 6,
                alignItems: 'start',
              }}
            >
              <div className='flex min-w-0 flex-col gap-4'>
                <Box
                  data-testid='admission-sticky'
                  sx={{
                    position: 'sticky',
                    top: LAYOUT.header,
                    zIndex: 5,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    mx: { xs: -4, md: 0 },
                    px: { xs: 4, md: 4, lg: 0 },
                    py: { xs: 3, md: 4, lg: 2 },
                    bgcolor: {
                      xs: 'background.paper',
                      lg: 'background.default',
                    },
                    borderBottom: { xs: 1, md: 0 },
                    border: { md: 1, lg: 0 },
                    borderColor: { xs: 'divider', md: 'divider' },
                    borderRadius: { xs: 0, md: `${RADIUS.md}px`, lg: 0 },
                  }}
                >
                  {vm.isOffline ? (
                    <AdmissionOfflineBanner onRetry={vm.onRefresh} />
                  ) : null}
                  <Box sx={{ display: { lg: 'none' } }}>
                    <AdmissionStats {...statsProps} />
                  </Box>
                  <AdmissionSearch
                    value={vm.search}
                    isNumeric={vm.isNumericKeypad}
                    onChange={vm.onSearchChange}
                    onClear={vm.onSearchClear}
                    onToggleKeypad={vm.onToggleKeypad}
                  />
                </Box>
                {list}
              </div>
              <Box
                sx={{
                  display: { xs: 'none', lg: 'block' },
                  position: 'sticky',
                  top: LAYOUT.header + 24,
                }}
              >
                <AdmissionPanel {...statsProps} />
              </Box>
            </Box>
            <Box
              sx={{
                display: { xs: 'block', md: 'none' },
                position: 'sticky',
                bottom: 0,
                zIndex: 5,
                mx: -4,
                mb: -4,
                px: 4,
                py: 3,
                bgcolor: 'background.paper',
                borderTop: 1,
                borderColor: 'divider',
              }}
            >
              <AdmissionOnsiteButton onClick={vm.onOpenOnsite} fullWidth />
            </Box>
          </>
        )}
      </div>
      <div role='status' aria-live='polite' className='sr-only'>
        {vm.announcement}
      </div>
      <AdmissionPaySheet
        sheet={vm.sheet}
        onDecrease={vm.onSheetDecrease}
        onIncrease={vm.onSheetIncrease}
        onConfirm={vm.onSheetConfirm}
        onClose={vm.onSheetClose}
      />
      <ManualReservationDialog
        open={vm.onsite.open}
        showOptions={vm.onsite.showOptions}
        fixedShowId={vm.onsite.fixedShowId}
        tierOptions={vm.onsite.tierOptions}
        defaultStatus='CONFIRMED'
        admitNowPlacement='afterStatus'
        minTouch={LAYOUT.touchField}
        isSubmitting={vm.onsite.isSubmitting}
        errorMessage={vm.onsite.errorMessage}
        onSubmit={vm.onSubmitOnsite}
        onClose={vm.onCloseOnsite}
      />
    </PageContainer>
  );
}
