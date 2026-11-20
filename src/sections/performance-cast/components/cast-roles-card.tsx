'use client';

// ----------------------------------------------------------------------
// SCR-D14 배역 목록(design §6 SCR-D14 ① · §12) — 행마다 ▲▼(터치용) · 배역명(출연 묶음은 "출연") · 설명 ·
// "모집 중" 스위치 · 기본 캐스트 칩(이름 + 메모, 비노출 표시, 빼기) · "배우 추가" · 수정·삭제 · 공개 안 됨 이유.
// 머리: "출연자 추가"(배역 없이 — 출연 묶음 자동) · "배역 추가". props 만으로 렌더.
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Switch from '@mui/material/Switch';

import { EmptyContent } from '@/src/components/empty-content';
import { Iconify } from '@/src/components/iconify';
import { Label } from '@/src/components/label';
import { Typo } from '@/src/components/typo';
import { PerformanceDetailSectionCard } from '@/src/sections/performance-detail/components/performance-detail-section-card';
import type { RoleRowModel } from '@/src/sections/performance-cast/utils/cast-rows';
import { MSG_D14 } from '@/src/shared/messages/d14';
import { LAYOUT } from '@/src/theme/layout-tokens';

interface CastRolesCardProps {
  rows: RoleRowModel[];
  onAdd: () => void;
  onAddPerformer: () => void;
  onAddActor: (roleId: string) => void;
  onRemoveActor: (roleId: string, memberId: string) => void;
  onToggleRecruiting: (roleId: string, isRecruiting: boolean) => void;
  onMove: (roleId: string, direction: -1 | 1) => void;
  onEdit: (roleId: string) => void;
  onDelete: (roleId: string) => void;
}

const ICON_SX = { width: LAYOUT.controlSm, height: LAYOUT.controlSm };

export function CastRolesCard({
  rows,
  onAdd,
  onAddPerformer,
  onAddActor,
  onRemoveActor,
  onToggleRecruiting,
  onMove,
  onEdit,
  onDelete,
}: CastRolesCardProps) {
  return (
    <PerformanceDetailSectionCard
      title={MSG_D14.ROLES_TITLE}
      action={
        <div className='flex flex-wrap justify-end gap-2'>
          <Button
            variant='outlined'
            color='inherit'
            onClick={onAddPerformer}
            startIcon={<Iconify icon='solar:user-plus-linear' />}
          >
            {MSG_D14.ENSEMBLE_ADD_PERFORMER}
          </Button>
          <Button
            variant='contained'
            onClick={onAdd}
            startIcon={<Iconify icon='solar:add-circle-linear' />}
          >
            {MSG_D14.ROLE_ADD}
          </Button>
        </div>
      }
    >
      {rows.length === 0 ? (
        <EmptyContent message={MSG_D14.ROLES_EMPTY} />
      ) : (
        <ul className='m-0 flex list-none flex-col gap-3 p-0'>
          {rows.map((row) => (
            <Box
              component='li'
              key={row.id}
              aria-label={row.label}
              sx={{
                p: 2,
                border: 1,
                borderColor: 'divider',
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <div className='flex flex-wrap items-center gap-2'>
                <div className='flex'>
                  <IconButton
                    aria-label={MSG_D14.MOVE_UP_ARIA(row.label)}
                    onClick={() => onMove(row.id, -1)}
                    disabled={!row.canMoveUp}
                    sx={ICON_SX}
                  >
                    <Iconify icon='solar:alt-arrow-up-linear' />
                  </IconButton>
                  <IconButton
                    aria-label={MSG_D14.MOVE_DOWN_ARIA(row.label)}
                    onClick={() => onMove(row.id, 1)}
                    disabled={!row.canMoveDown}
                    sx={ICON_SX}
                  >
                    <Iconify icon='solar:alt-arrow-down-linear' />
                  </IconButton>
                </div>
                <Typo.Body.Semibold component='h3'>
                  {row.label}
                </Typo.Body.Semibold>
                {row.reason ? (
                  <Label tone='warning'>{row.reason}</Label>
                ) : (
                  <Label tone='success'>{MSG_D14.PUBLIC_NOW}</Label>
                )}
                <div className='ml-auto flex items-center gap-1'>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={row.isRecruiting}
                        onChange={(_, checked) =>
                          onToggleRecruiting(row.id, checked)
                        }
                      />
                    }
                    label={MSG_D14.RECRUITING}
                  />
                  <IconButton
                    aria-label={MSG_D14.ROLE_EDIT_ARIA(row.label)}
                    onClick={() => onEdit(row.id)}
                    sx={{ ...ICON_SX, color: 'text.secondary' }}
                  >
                    <Iconify icon='solar:pen-linear' />
                  </IconButton>
                  <IconButton
                    aria-label={MSG_D14.ROLE_DELETE_ARIA(row.label)}
                    onClick={() => onDelete(row.id)}
                    sx={{ ...ICON_SX, color: 'error.main' }}
                  >
                    <Iconify icon='solar:trash-bin-trash-linear' />
                  </IconButton>
                </div>
              </div>
              {row.description ? (
                <Typo.Badge.Regular color='text.secondary'>
                  {row.description}
                </Typo.Badge.Regular>
              ) : null}
              <div className='flex flex-wrap items-center gap-2'>
                {row.actors.map((actor) => (
                  <Box
                    key={actor.key}
                    component='span'
                    className='inline-flex items-center gap-1'
                    sx={{
                      pl: 2,
                      border: 1,
                      borderRadius: 9999,
                      borderColor: actor.isVisible ? 'divider' : 'warning.main',
                    }}
                  >
                    <Typo.Badge.Regular>
                      {[actor.name, actor.note].filter(Boolean).join(' · ')}
                    </Typo.Badge.Regular>
                    {actor.isVisible ? null : (
                      <Label tone='warning'>{MSG_D14.HIDDEN_ACTOR}</Label>
                    )}
                    <IconButton
                      aria-label={MSG_D14.ACTOR_REMOVE_ARIA(actor.name)}
                      onClick={() => onRemoveActor(row.id, actor.memberId)}
                      sx={ICON_SX}
                    >
                      <Iconify icon='solar:close-circle-linear' />
                    </IconButton>
                  </Box>
                ))}
                <Button
                  size='small'
                  color='inherit'
                  onClick={() => onAddActor(row.id)}
                  startIcon={<Iconify icon='solar:add-circle-linear' />}
                >
                  {MSG_D14.ACTOR_ADD}
                </Button>
              </div>
            </Box>
          ))}
        </ul>
      )}
    </PerformanceDetailSectionCard>
  );
}
