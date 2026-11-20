'use client';

// ----------------------------------------------------------------------
// SCR-D14 '참여자'(design §12) — 행 = 순서(▲▼) · 직함 · 사람(연결 갈래) · 노출 스위치 · 공개 상태 · 수정 · 삭제.
// 머리 "참여자 추가". 비면 "등록된 참여자가 없습니다". props 만으로 렌더.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Switch from '@mui/material/Switch';

import { EmptyContent } from '@/src/components/empty-content';
import { Iconify } from '@/src/components/iconify';
import { Label } from '@/src/components/label';
import { Typo } from '@/src/components/typo';
import { PerformanceDetailSectionCard } from '@/src/sections/performance-detail/components/performance-detail-section-card';
import type { CreditRowModel } from '@/src/sections/performance-cast/utils/cast-rows';
import { MSG_D14 } from '@/src/shared/messages/d14';
import { LAYOUT } from '@/src/theme/layout-tokens';

interface CastCreditsCardProps {
  rows: CreditRowModel[];
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onToggleVisible: (id: string, isVisible: boolean) => void;
}

const ICON_SX = { width: LAYOUT.controlSm, height: LAYOUT.controlSm };

export function CastCreditsCard({
  rows,
  onAdd,
  onEdit,
  onDelete,
  onMove,
  onToggleVisible,
}: CastCreditsCardProps) {
  return (
    <PerformanceDetailSectionCard
      title={MSG_D14.CREDITS_TITLE}
      action={
        <Button
          variant='contained'
          onClick={onAdd}
          startIcon={<Iconify icon='solar:add-circle-linear' />}
        >
          {MSG_D14.CREDIT_ADD}
        </Button>
      }
    >
      {rows.length === 0 ? (
        <EmptyContent message={MSG_D14.CREDITS_EMPTY} />
      ) : (
        <ul className='m-0 flex list-none flex-col gap-2 p-0'>
          {rows.map((row) => (
            <Box
              component='li'
              key={row.id}
              aria-label={`${row.title} ${row.personName}`}
              className='flex flex-wrap items-center gap-2'
              sx={{
                p: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <div className='flex'>
                <IconButton
                  aria-label={MSG_D14.MOVE_UP_ARIA(row.title)}
                  onClick={() => onMove(row.id, -1)}
                  disabled={!row.canMoveUp}
                  sx={ICON_SX}
                >
                  <Iconify icon='solar:alt-arrow-up-linear' />
                </IconButton>
                <IconButton
                  aria-label={MSG_D14.MOVE_DOWN_ARIA(row.title)}
                  onClick={() => onMove(row.id, 1)}
                  disabled={!row.canMoveDown}
                  sx={ICON_SX}
                >
                  <Iconify icon='solar:alt-arrow-down-linear' />
                </IconButton>
              </div>
              <div className='flex min-w-0 flex-col'>
                <Typo.Caption.Regular color='text.secondary'>
                  {row.title}
                </Typo.Caption.Regular>
                <Typo.Body.Semibold>{row.personName}</Typo.Body.Semibold>
              </div>
              <Label tone='neutral' variant='outline'>
                {row.personKind}
              </Label>
              {row.reason ? (
                <Label tone='warning'>{row.reason}</Label>
              ) : (
                <Label tone='success'>{MSG_D14.PUBLIC_NOW}</Label>
              )}
              <div className='ml-auto flex items-center gap-1'>
                <Switch
                  checked={row.isVisible}
                  onChange={(_, checked) => onToggleVisible(row.id, checked)}
                  slotProps={{
                    input: {
                      'aria-label': MSG_D14.CREDIT_VISIBLE_ARIA(row.title),
                    },
                  }}
                />
                <IconButton
                  aria-label={MSG_D14.CREDIT_EDIT_ARIA(row.title)}
                  onClick={() => onEdit(row.id)}
                  sx={{ ...ICON_SX, color: 'text.secondary' }}
                >
                  <Iconify icon='solar:pen-linear' />
                </IconButton>
                <IconButton
                  aria-label={MSG_D14.CREDIT_DELETE_ARIA(row.title)}
                  onClick={() => onDelete(row.id)}
                  sx={{ ...ICON_SX, color: 'error.main' }}
                >
                  <Iconify icon='solar:trash-bin-trash-linear' />
                </IconButton>
              </div>
            </Box>
          ))}
        </ul>
      )}
    </PerformanceDetailSectionCard>
  );
}
