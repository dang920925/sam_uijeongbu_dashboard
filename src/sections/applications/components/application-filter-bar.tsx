'use client';

// ----------------------------------------------------------------------
// 필터 줄(U31 보강 — designer §18.3): 유형 pill(전체/참관/상담) → 처리 상태 · 작품("전체 작품") · 연락 · 진행 + "총 {n}건".
// xs 2열 격자(라벨 위), md↑ 한 줄 흐름(라벨 왼쪽). 건수를 모르면(로딩) 숨김. 항목 목록은 VM·상수에서 받는다.
// ----------------------------------------------------------------------
import { SegmentPill } from '@/src/components/segment-pill';
import { Typo } from '@/src/components/typo';
import { ApplicationFilterSelect } from '@/src/sections/applications/components/application-filter-select';
import {
  ALL,
  type ApplicationFilters,
  type AppTypeFilter,
  type ContactFilter,
  type FilterOption,
  type ProgressFilter,
  type StatusFilter,
} from '@/src/sections/applications/utils/application-filters';
import { MSG_D06 } from '@/src/shared/messages/d06';
import { APPLICATION_STATUS_LABEL } from '@/src/types/codes';

interface ApplicationFilterBarProps {
  filters: ApplicationFilters;
  totalCount: number | null;
  workOptions: FilterOption<string>[];
  progressOptions: FilterOption<string>[];
  onAppTypeChange: (value: AppTypeFilter) => void;
  onStatusChange: (value: StatusFilter) => void;
  onWorkChange: (value: string) => void;
  onContactChange: (value: ContactFilter) => void;
  onProgressChange: (value: ProgressFilter) => void;
}

const TYPE_OPTIONS: { value: AppTypeFilter; label: string }[] = [
  { value: ALL, label: MSG_D06.TYPE_ALL },
  { value: 'WORK_OBSERVATION', label: MSG_D06.TYPE_OBSERVATION },
  { value: 'CONSULTATION', label: MSG_D06.TYPE_CONSULTATION },
];

const STATUS_OPTIONS: FilterOption<StatusFilter>[] = [
  { value: ALL, label: MSG_D06.FILTER_ALL },
  { value: 'PENDING', label: APPLICATION_STATUS_LABEL.PENDING },
  { value: 'APPROVED', label: APPLICATION_STATUS_LABEL.APPROVED },
  { value: 'REJECTED', label: APPLICATION_STATUS_LABEL.REJECTED },
];

const CONTACT_OPTIONS: FilterOption<ContactFilter>[] = [
  { value: ALL, label: MSG_D06.FILTER_ALL },
  { value: 'UNCONTACTED', label: MSG_D06.CONTACT_BEFORE },
  { value: 'CONTACTED', label: MSG_D06.CONTACT_DONE },
];

const ALL_WORK = { value: ALL, label: MSG_D06.FILTER_WORK_ALL };
const ALL_PROGRESS = { value: ALL, label: MSG_D06.FILTER_ALL };

export function ApplicationFilterBar({
  filters,
  totalCount,
  workOptions,
  progressOptions,
  onAppTypeChange,
  onStatusChange,
  onWorkChange,
  onContactChange,
  onProgressChange,
}: ApplicationFilterBarProps) {
  return (
    <div className='flex flex-col gap-3'>
      <SegmentPill
        ariaLabel={MSG_D06.TYPE_GROUP}
        options={TYPE_OPTIONS}
        value={filters.appType}
        onChange={onAppTypeChange}
      />
      <div className='grid grid-cols-2 gap-3 md:flex md:flex-wrap md:items-center md:gap-x-6'>
        <ApplicationFilterSelect
          label={MSG_D06.FILTER_STATUS}
          value={filters.status}
          options={STATUS_OPTIONS}
          onChange={(value) => onStatusChange(value as StatusFilter)}
        />
        <ApplicationFilterSelect
          label={MSG_D06.FILTER_WORK}
          value={filters.performanceId}
          options={[ALL_WORK, ...workOptions]}
          onChange={onWorkChange}
          isWide
        />
        <ApplicationFilterSelect
          label={MSG_D06.FILTER_CONTACT}
          value={filters.contact}
          options={CONTACT_OPTIONS}
          onChange={(value) => onContactChange(value as ContactFilter)}
        />
        <ApplicationFilterSelect
          label={MSG_D06.FILTER_PROGRESS}
          value={filters.progress}
          options={[ALL_PROGRESS, ...progressOptions]}
          onChange={(value) => onProgressChange(value as ProgressFilter)}
        />
        {totalCount !== null ? (
          <Typo.Badge.Regular
            color='text.secondary'
            className='col-span-2 md:ml-auto'
          >
            {MSG_D06.TOTAL(totalCount)}
          </Typo.Badge.Regular>
        ) : null}
      </div>
    </div>
  );
}
