// ----------------------------------------------------------------------
// 상세 요약(designer §18.3 drawer dr__sum): 이름 · 나이/성별 → 유형 Label(+ 단원 등록됨) → 신청일 →
// (U39) 처리 상태·처리일은 진행 단계로 합쳐 보이지 않는다.
//
// 참관: '참관 작품'·'관심 작품'(따로, design §10) · '희망 날짜'(+ 일정 취소됨·사유) / 상담: '희망 작품' 전체 · '상담 방법 · 희망 시간'.
// ----------------------------------------------------------------------
import { Typo } from '@/src/components/typo';
import { ApplicationDetailKv } from '@/src/sections/applications/components/application-detail-kv';
import { ApplicationScheduleCell } from '@/src/sections/applications/components/application-schedule-cell';
import { ApplicationMemberLabel } from '@/src/sections/applications/components/application-member-label';
import { ApplicationTypeLabel } from '@/src/sections/applications/components/application-type-label';
import { ApplicationWorkChips } from '@/src/sections/applications/components/application-work-chips';
import type { ApplicationRow } from '@/src/sections/applications/utils/application-row';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D06 } from '@/src/shared/messages/d06';

interface ApplicationDetailSummaryProps {
  detail: ApplicationRow;
}

export function ApplicationDetailSummary({
  detail,
}: ApplicationDetailSummaryProps) {
  const isObservation = detail.appType === 'WORK_OBSERVATION';
  const interest = (
    <ApplicationWorkChips
      split={{ visible: detail.interestChips, overflow: 0 }}
      isEmpty={detail.interestChips.length === 0}
      isWrap
    />
  );
  return (
    <section className='flex flex-col gap-3'>
      <div className='flex flex-wrap items-baseline gap-2'>
        <Typo.Body.Semibold>{detail.applicantName}</Typo.Body.Semibold>
        {detail.ageGender ? (
          <Typo.Badge.Regular color='text.secondary'>
            {detail.ageGender}
          </Typo.Badge.Regular>
        ) : null}
      </div>
      <div className='flex flex-wrap items-center gap-1'>
        <ApplicationTypeLabel row={detail} hasIcon />
        <ApplicationMemberLabel row={detail} />
      </div>
      <Typo.Caption.Regular color='text.secondary'>
        {MSG_D06.DRAWER_CREATED(detail.createdAt)}
      </Typo.Caption.Regular>
      {isObservation ? (
        <>
          <ApplicationDetailKv label={MSG_D06.INFO_OBSERVATION_WORK}>
            <Typo.Badge.Medium>
              {detail.observationWork ?? MSG_COMMON.EMPTY_VALUE}
            </Typo.Badge.Medium>
          </ApplicationDetailKv>
          <ApplicationDetailKv label={detail.interestTitle}>
            {interest}
          </ApplicationDetailKv>
          <ApplicationDetailKv label={MSG_D06.INFO_PREFERRED_DATE}>
            <ApplicationScheduleCell row={detail} />
          </ApplicationDetailKv>
        </>
      ) : (
        <>
          <ApplicationDetailKv label={detail.interestTitle}>
            {interest}
          </ApplicationDetailKv>
          <ApplicationDetailKv label={MSG_D06.INFO_METHOD_TIME}>
            <Typo.Badge.Medium>{detail.scheduleText}</Typo.Badge.Medium>
          </ApplicationDetailKv>
        </>
      )}
    </section>
  );
}
