'use client';

// ----------------------------------------------------------------------
// TierQuantityList — 등급마다 이름(+ 링크 전용 info Label) · 가격 줄 · stepper(수동 등록 · 등급 수정 공용).
// ----------------------------------------------------------------------
import Box from '@mui/material/Box';

import { Label } from '@/src/components/label';
import { QuantityStepper } from '@/src/components/manual-reservation-dialog/quantity-stepper';
import { Typo } from '@/src/components/typo';
import { MSG_D12 } from '@/src/shared/messages/d12';

export interface TierQuantityRow {
  id: string;
  name: string;
  /** "12,000원" · "예매 당시 12,000원" */
  priceText: string;
  isLinkOnly: boolean;
}

interface TierQuantityListProps {
  rows: TierQuantityRow[];
  quantities: Record<string, string>;
  canIncrease: boolean;
  onChange: (tierId: string, quantity: number) => void;
}

export function TierQuantityList({
  rows,
  quantities,
  canIncrease,
  onChange,
}: TierQuantityListProps) {
  return (
    <Box component='ul' sx={{ m: 0, p: 0, listStyle: 'none' }}>
      {rows.map((row) => (
        <Box
          component='li'
          key={row.id}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 3,
            py: 2,
            borderBottom: 1,
            borderColor: 'divider',
            '&:last-of-type': { borderBottom: 0 },
          }}
        >
          <div className='flex min-w-0 flex-col gap-1'>
            <span className='flex flex-wrap items-center gap-2'>
              <Typo.Body.Semibold>{row.name}</Typo.Body.Semibold>
              {row.isLinkOnly ? (
                <Label tone='info'>{MSG_D12.LINK_ONLY}</Label>
              ) : null}
            </span>
            <Typo.Caption.Regular color='text.secondary'>
              {row.priceText}
            </Typo.Caption.Regular>
          </div>
          <QuantityStepper
            name={row.name}
            value={Number(quantities[row.id] || 0)}
            canIncrease={canIncrease}
            onChange={(value) => onChange(row.id, value)}
          />
        </Box>
      ))}
    </Box>
  );
}
