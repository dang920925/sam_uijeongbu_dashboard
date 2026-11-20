'use client';

// ----------------------------------------------------------------------
// "좌석 지정 예매" 카드(U35 — design §14 SCR-D11): 공연 단위 스위치 + 도움말. 켜져 있으면 회차 행에 "좌석 배치".
// ----------------------------------------------------------------------
import { SwitchField } from '@/src/components/switch-field';
import { Typo } from '@/src/components/typo';
import { ShowsSectionCard } from '@/src/sections/performance-shows/components/shows-section-card';
import { MSG_SEAT } from '@/src/shared/messages/seat';

export interface SeatSelectionCardProps {
  enabled: boolean;
  isSaving: boolean;
  onToggle: (enabled: boolean) => void;
}

export function SeatSelectionCard({
  enabled,
  isSaving,
  onToggle,
}: SeatSelectionCardProps) {
  return (
    <ShowsSectionCard
      title={MSG_SEAT.SWITCH_TITLE}
      titleId='seat-selection-title'
    >
      <div className='flex flex-col gap-2'>
        <SwitchField
          label={MSG_SEAT.SWITCH_LABEL}
          checked={enabled}
          disabled={isSaving}
          onChange={onToggle}
        />
        <Typo.Caption.Regular color='text.secondary'>
          {MSG_SEAT.SWITCH_HELP}
        </Typo.Caption.Regular>
      </div>
    </ShowsSectionCard>
  );
}
