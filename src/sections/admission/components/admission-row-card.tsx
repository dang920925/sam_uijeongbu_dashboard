// ----------------------------------------------------------------------
// AdmissionRow 카드(xs 1열 · md 2열, designer §13.7.4 1.3): 위(이름 title + 메타 / 오른쪽 "입장" + a/q head) →
// 등급별 매수(title) → 상태 줄 → 동작 줄. 다 들어온 행은 성공 옅은 배경, 방금 처리한 행은 success 테두리.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';

import { Typo } from '@/src/components/typo';
import { AdmissionSeatText } from '@/src/sections/admission/components/admission-seat-text';
import {
  AdmissionRowActions,
  type AdmissionRowHandlers,
} from '@/src/sections/admission/components/admission-row-actions';
import { AdmissionRowStatus } from '@/src/sections/admission/components/admission-row-status';
import { AdmissionTierLines } from '@/src/sections/admission/components/admission-tier-lines';
import type { AdmissionRowModel } from '@/src/sections/admission/utils/admission-row';
import { MSG_D13 } from '@/src/shared/messages/d13';
import { RADIUS, SHADOW } from '@/src/theme/layout-tokens';

interface AdmissionRowCardProps {
  row: AdmissionRowModel;
  handlers: AdmissionRowHandlers;
}

export function AdmissionRowCard({ row, handlers }: AdmissionRowCardProps) {
  const isDone = row.kind === 'done';
  // 성공 옅은 배경(green-100) 위 보조 글자는 slate-600(대비 — slate-500 은 4.5 미만)
  const metaColor = isDone ? 'semantic.text.onMuted' : 'text.secondary';
  return (
    <Box
      component='article'
      aria-labelledby={`admission-card-${row.id}`}
      data-row-kind={row.kind}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        p: 4,
        borderRadius: `${RADIUS.md}px`,
        border: row.isFlash ? 2 : 1,
        borderColor: row.isFlash
          ? 'success.main'
          : isDone
            ? 'semantic.successSoft.border'
            : 'divider',
        bgcolor: isDone ? 'semantic.successSoft.bg' : 'background.paper',
        boxShadow: SHADOW.card,
        transition: (t) => t.transitions.create(['border-color']),
      }}
    >
      <div className='flex items-start justify-between gap-3'>
        <div className='flex min-w-0 flex-col gap-1'>
          <div className='flex flex-wrap items-baseline gap-x-3'>
            <Typo.Title.Bold component='h2' id={`admission-card-${row.id}`}>
              {row.bookerName}
            </Typo.Title.Bold>
            <AdmissionSeatText row={row} />
          </div>
          <div className='flex flex-wrap gap-x-3'>
            <Typo.Badge.Regular color={metaColor}>
              {row.codeText}
            </Typo.Badge.Regular>
            {row.phoneText ? (
              <Typo.Badge.Regular color={metaColor}>
                {row.phoneText}
              </Typo.Badge.Regular>
            ) : null}
            {row.inviterText ? (
              <Typo.Badge.Regular
                color={metaColor}
                data-testid='admission-inviter'
              >
                {row.inviterText}
              </Typo.Badge.Regular>
            ) : null}
          </div>
        </div>
        <div className='flex shrink-0 flex-col items-end'>
          <Typo.Badge.Regular color={metaColor}>
            {MSG_D13.COUNT_LABEL}
          </Typo.Badge.Regular>
          <Typo.Head.Bold className='tabular-nums'>
            {row.countText}
          </Typo.Head.Bold>
        </div>
      </div>
      <AdmissionTierLines lines={row.lines} ariaText={row.tiersAria} />
      {row.hasStatusLine ? <AdmissionRowStatus row={row} /> : null}
      <AdmissionRowActions row={row} handlers={handlers} showDone />
    </Box>
  );
}
