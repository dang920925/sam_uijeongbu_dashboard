// ----------------------------------------------------------------------
// 팝업 행 표시 모델 — 노출 기간(행 주 항목)·활성(반 상태 라벨 재사용)·기간 상태(공연 상태 라벨 재사용)·겹침 경고.
// ----------------------------------------------------------------------
import {
  formatPopupPeriod,
  getPopupPeriodStatus,
} from '@/src/sections/popups/utils/popup-period';
import { MSG_COMMON } from '@/src/shared/messages/common';
import {
  CLASS_STATUS_LABEL,
  PERFORMANCE_STATUS_LABEL,
} from '@/src/types/codes';
import type { Popup } from '@/src/types/content';
import type { LabelTone } from '@/src/theme/semantic';
import {
  CLASS_STATUS_TONE,
  PERFORMANCE_STATUS_TONE,
} from '@/src/utils/status-tone';

export interface PopupRowModel {
  id: string;
  imageUrl: string;
  link: string;
  period: string;
  activeLabel: string;
  activeTone: LabelTone;
  statusLabel: string;
  statusTone: LabelTone;
  overlapsActive: boolean;
}

export function toPopupRow(popup: Popup, today: string): PopupRowModel {
  const status = getPopupPeriodStatus(popup.startDate, popup.endDate, today);
  const active = popup.isActive ? 'ACTIVE' : 'INACTIVE';
  return {
    id: popup.id,
    imageUrl: popup.imageUrl,
    link: popup.linkUrl ?? MSG_COMMON.EMPTY_VALUE,
    period: formatPopupPeriod(popup.startDate, popup.endDate),
    activeLabel: CLASS_STATUS_LABEL[active],
    activeTone: CLASS_STATUS_TONE[active],
    statusLabel: PERFORMANCE_STATUS_LABEL[status],
    statusTone: PERFORMANCE_STATUS_TONE[status],
    overlapsActive: popup.overlapsActive,
  };
}
