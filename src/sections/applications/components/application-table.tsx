'use client';

// ----------------------------------------------------------------------
// 신청 표 — 참관 8열(신청자·연락처·나이/성별·연결 공연·희망 날짜·신청일·상태·액션),
// 상담은 연결 공연·희망 날짜 대신 상담 방법·희망 시간(현행 Applications.tsx:185-192,235-242).
// lg 미만은 카드(cardBelow 'lg' — designer W4 "D06 8열은 md 에서도 카드").
// ----------------------------------------------------------------------
import type { ReactNode } from 'react';

import { DataTable, type DataTableColumn } from '@/src/components/data-table';
import { Typo } from '@/src/components/typo';
import { ApplicationCard } from '@/src/sections/applications/components/application-card';
import { ApplicationRowActions } from '@/src/sections/applications/components/application-row-actions';
import { ApplicationStatusLabels } from '@/src/sections/applications/components/application-status-labels';
import type {
  ApplicationRow,
  ApplicationRowHandlers,
} from '@/src/sections/applications/utils/application-row';
import { MSG_COMMON } from '@/src/shared/messages/common';
import { MSG_D06 } from '@/src/shared/messages/d06';
import {
  APPLICATION_TYPE_LABEL,
  type ApplicationType,
} from '@/src/types/codes';

interface ApplicationTableProps {
  appType: ApplicationType;
  rows: ApplicationRow[];
  handlers: ApplicationRowHandlers;
}

function secondary(value: string | null): ReactNode {
  return (
    <Typo.Badge.Regular color='text.secondary'>
      {value ?? MSG_COMMON.EMPTY_VALUE}
    </Typo.Badge.Regular>
  );
}

export function ApplicationTable({
  appType,
  rows,
  handlers,
}: ApplicationTableProps) {
  const typeColumns: DataTableColumn<ApplicationRow>[] =
    appType === 'WORK_OBSERVATION'
      ? [
          {
            key: 'performance',
            header: MSG_D06.COL_PERFORMANCE,
            render: (row) => secondary(row.performanceTitle),
          },
          {
            key: 'preferredDate',
            header: MSG_D06.COL_PREFERRED_DATE,
            render: (row) => secondary(row.preferredDate),
          },
        ]
      : [
          {
            key: 'method',
            header: MSG_D06.COL_METHOD,
            render: (row) => secondary(row.methodLabel),
          },
          {
            key: 'preferredTime',
            header: MSG_D06.COL_PREFERRED_TIME,
            render: (row) => secondary(row.preferredTimeLabel),
          },
        ];
  const columns: DataTableColumn<ApplicationRow>[] = [
    {
      key: 'applicant',
      header: MSG_D06.COL_APPLICANT,
      render: (row) => (
        <Typo.Body.Semibold>{row.applicantName}</Typo.Body.Semibold>
      ),
    },
    {
      key: 'phone',
      header: MSG_D06.COL_PHONE,
      render: (row) => secondary(row.phone),
    },
    {
      key: 'ageGender',
      header: MSG_D06.COL_AGE_GENDER,
      render: (row) => secondary(row.ageGender),
    },
    ...typeColumns,
    {
      key: 'created',
      header: MSG_D06.COL_CREATED,
      render: (row) => secondary(row.createdAt),
    },
    {
      key: 'status',
      header: MSG_D06.COL_STATUS,
      render: (row) => <ApplicationStatusLabels row={row} />,
    },
    {
      key: 'actions',
      header: MSG_D06.COL_ACTIONS,
      render: (row) => <ApplicationRowActions row={row} handlers={handlers} />,
    },
  ];

  return (
    <DataTable
      ariaLabel={APPLICATION_TYPE_LABEL[appType]}
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      renderCard={(row) => <ApplicationCard row={row} handlers={handlers} />}
      cardBelow='lg'
    />
  );
}
