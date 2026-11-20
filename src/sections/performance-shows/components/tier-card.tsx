'use client';

// ----------------------------------------------------------------------
// "가격 등급" 카드(design §6.1b · designer 시안 보강2) — 예매 설정 카드 ↔ 회차 관리 카드 사이.
// lg 표: 순서 ▲▼ · 이름 · 가격 · 노출 Label · 사용 스위치 · 예매 매수 · 동작(링크 복사 ▾ · 재발급 · 수정 · 삭제)
// md·xs 카드: 이름 + Label / 가격 · 예매 n매 / 동작 / 사용 스위치 + ▲▼(designer default xs).
// 쓰인 등급 삭제는 비활성 + 툴팁. props 만으로 렌더.
// ----------------------------------------------------------------------
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import { useId } from 'react';

import { DataTable, type DataTableColumn } from '@/src/components/data-table';
import { EmptyContent } from '@/src/components/empty-content';
import { Iconify } from '@/src/components/iconify';
import { Label } from '@/src/components/label';
import { Typo } from '@/src/components/typo';
import { ShowsSectionCard } from '@/src/sections/performance-shows/components/shows-section-card';
import { TierLinkMenu } from '@/src/sections/performance-shows/components/tier-link-menu';
import type { TierRowDisplay } from '@/src/sections/performance-shows/utils/tier-row';
import type { PriceTierSection } from '@/src/sections/performance-shows/view/use-price-tier-section';
import { MSG_D11 } from '@/src/shared/messages/d11';
import { LAYOUT } from '@/src/theme/layout-tokens';

interface TierCardProps {
  card: PriceTierSection['card'];
}

const ICON_BUTTON_SX = { width: LAYOUT.controlSm, height: LAYOUT.controlSm };

export function TierCard({ card }: TierCardProps) {
  const titleId = useId();

  const orderButtons = (row: TierRowDisplay) => (
    <div className='flex gap-1'>
      <IconButton
        aria-label={MSG_D11.TIER_MOVE_UP(row.name)}
        disabled={!row.canMoveUp || card.isBusy}
        onClick={() => card.onMove(row.id, 'up')}
        sx={{ ...ICON_BUTTON_SX, color: 'text.secondary' }}
      >
        <Iconify icon='solar:alt-arrow-up-linear' />
      </IconButton>
      <IconButton
        aria-label={MSG_D11.TIER_MOVE_DOWN(row.name)}
        disabled={!row.canMoveDown || card.isBusy}
        onClick={() => card.onMove(row.id, 'down')}
        sx={{ ...ICON_BUTTON_SX, color: 'text.secondary' }}
      >
        <Iconify icon='solar:alt-arrow-down-linear' />
      </IconButton>
    </div>
  );

  const activeSwitch = (row: TierRowDisplay) => (
    <Switch
      checked={row.isActive}
      disabled={card.isBusy}
      onChange={(_, checked) => card.onToggleActive(row.id, checked)}
      slotProps={{
        input: { 'aria-label': MSG_D11.TIER_ACTIVE_ARIA(row.name) },
      }}
    />
  );

  const deleteButton = (row: TierRowDisplay) => {
    const button = (
      <IconButton
        aria-label={MSG_D11.TIER_DELETE_ARIA(row.name)}
        disabled={!row.canDelete}
        onClick={() => card.onDelete(row.id)}
        sx={{ ...ICON_BUTTON_SX, color: 'error.main' }}
      >
        <Iconify icon='solar:trash-bin-trash-linear' />
      </IconButton>
    );
    return row.canDelete ? (
      button
    ) : (
      <Tooltip title={MSG_D11.DELETE_BLOCKED_TIP}>
        <span>{button}</span>
      </Tooltip>
    );
  };

  const actions = (row: TierRowDisplay, isCard = false) => (
    <div
      className={
        isCard
          ? 'flex flex-wrap items-center gap-1'
          : 'flex items-center justify-end gap-1'
      }
    >
      {row.isLinkOnly ? (
        <>
          <TierLinkMenu
            tierName={row.name}
            isUnavailable={card.isLinkUnavailable}
            onCopyLink={() => card.onCopyLink(row.id)}
            onCopyWithMember={() => card.onCopyWithMember(row.id)}
          />
          <IconButton
            aria-label={MSG_D11.TIER_REISSUE_ARIA(row.name)}
            onClick={() => card.onReissue(row.id)}
            sx={{ ...ICON_BUTTON_SX, color: 'text.secondary' }}
          >
            <Iconify icon='solar:refresh-linear' />
          </IconButton>
        </>
      ) : null}
      <IconButton
        aria-label={MSG_D11.TIER_EDIT_ARIA(row.name)}
        onClick={() => card.onEdit(row.id)}
        sx={{ ...ICON_BUTTON_SX, color: 'text.secondary' }}
      >
        <Iconify icon='solar:pen-linear' />
      </IconButton>
      {deleteButton(row)}
    </div>
  );

  const label = (row: TierRowDisplay) => (
    <Label tone={row.visibilityTone}>{row.visibilityLabel}</Label>
  );

  const columns: DataTableColumn<TierRowDisplay>[] = [
    {
      key: 'order',
      header: <span className='sr-only'>{MSG_D11.TIER_COL_ORDER}</span>,
      isCompact: true,
      render: orderButtons,
    },
    {
      key: 'name',
      header: MSG_D11.TIER_COL_NAME,
      render: (row) => <Typo.Body.Semibold>{row.name}</Typo.Body.Semibold>,
    },
    {
      key: 'price',
      header: MSG_D11.TIER_COL_PRICE,
      render: (row) => <Typo.Badge.Regular>{row.priceText}</Typo.Badge.Regular>,
    },
    { key: 'visibility', header: MSG_D11.TIER_COL_VISIBILITY, render: label },
    { key: 'active', header: MSG_D11.TIER_COL_ACTIVE, render: activeSwitch },
    {
      key: 'used',
      header: MSG_D11.TIER_COL_USED,
      render: (row) => <Typo.Badge.Regular>{row.usedText}</Typo.Badge.Regular>,
    },
    {
      key: 'actions',
      header: <span className='sr-only'>{MSG_D11.TIER_COL_ACTIONS}</span>,
      isCompact: true,
      render: (row) => actions(row),
    },
  ];

  const renderCard = (row: TierRowDisplay) => (
    <>
      <div className='flex items-start justify-between gap-2'>
        <Typo.Body.Semibold>{row.name}</Typo.Body.Semibold>
        {label(row)}
      </div>
      <div className='flex flex-wrap gap-x-3 gap-y-1'>
        <Typo.Badge.Regular color='text.secondary'>
          {row.priceText}
        </Typo.Badge.Regular>
        <Typo.Badge.Regular color='text.secondary'>
          {row.usedCardText}
        </Typo.Badge.Regular>
      </div>
      {actions(row, true)}
      <div className='flex items-center justify-between gap-2'>
        <FormControlLabel
          sx={{ m: 0, minHeight: LAYOUT.touch, gap: 2 }}
          control={activeSwitch(row)}
          label={<Typo.Badge.Medium>{MSG_D11.TIER_ACTIVE}</Typo.Badge.Medium>}
        />
        {orderButtons(row)}
      </div>
    </>
  );

  return (
    <ShowsSectionCard
      title={MSG_D11.TIERS_TITLE}
      subtitle={MSG_D11.TIERS_SUBTITLE}
      titleId={titleId}
      isFlush
      action={
        <Button
          variant='contained'
          size='small'
          onClick={card.onAdd}
          startIcon={<Iconify icon='solar:add-circle-linear' />}
        >
          {MSG_D11.TIER_ADD}
        </Button>
      }
    >
      {card.rows.length === 0 ? (
        <EmptyContent
          message={MSG_D11.TIERS_EMPTY}
          icon='solar:ticket-sale-linear'
        />
      ) : (
        <DataTable
          ariaLabel={MSG_D11.TIERS_TABLE_ARIA}
          columns={columns}
          rows={card.rows}
          getRowKey={(row) => row.id}
          renderCard={renderCard}
          cardBelow='lg'
        />
      )}
    </ShowsSectionCard>
  );
}
